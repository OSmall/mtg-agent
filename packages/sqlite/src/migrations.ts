import {mkdirSync} from "node:fs";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {sql} from "drizzle-orm";
import {migrate} from "drizzle-orm/bun-sqlite/migrator";
import type {Logger} from "@tomekin/core";

import {closeDatabase, openDatabase, resolveDatabasePath} from "./database";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

export type SqliteMigrationIo = {
    readonly stdout: { write(message: string): void };
};

export type CardSetMigrationCleanupSummary = {
    readonly collectionCardsRemoved: number;
    readonly collectionLocationsRemoved: number;
    readonly collectionImportsRemoved: number;
    readonly cardPrintingFinishesRemoved: number;
    readonly cardPrintingPartsRemoved: number;
    readonly cardPrintingsRemoved: number;
    readonly deckCandidatesPreserved: number;
    readonly deckCandidateCardsPreserved: number;
};

export function prepareLegacyDatabaseForCardSetMigration(
    dbPath = resolveDatabasePath(),
    options: { readonly log: Logger },
    io?: SqliteMigrationIo,
): CardSetMigrationCleanupSummary {
    io?.stdout.write(`Target database: ${dbPath}\n`);
    const db = openDatabase(dbPath, {log: options.log});
    try {
        const columns = db.$client.query<{name: string}, []>("PRAGMA table_info(card_printing)").all();
        const names = new Set(columns.map((column) => column.name));
        if (names.has("set_id")) {
            throw new Error("Card Set migration cleanup is unnecessary because card_printing.set_id already exists.");
        }
        if (!names.has("set_code")) {
            throw new Error("Card Set migration cleanup requires the legacy card_printing.set_code schema.");
        }

        const summary: CardSetMigrationCleanupSummary = {
            collectionCardsRemoved: tableCount(db, "collection_card"),
            collectionLocationsRemoved: tableCount(db, "collection_location"),
            collectionImportsRemoved: tableCount(db, "collection_import"),
            cardPrintingFinishesRemoved: tableCount(db, "card_printing_finish"),
            cardPrintingPartsRemoved: tableCount(db, "card_printing_part"),
            cardPrintingsRemoved: tableCount(db, "card_printing"),
            deckCandidatesPreserved: tableCount(db, "deck_candidate"),
            deckCandidateCardsPreserved: tableCount(db, "deck_candidate_card"),
        };

        db.run(sql`BEGIN IMMEDIATE`);
        try {
            db.run(sql`DELETE FROM collection_card`);
            db.run(sql`DELETE FROM collection_location`);
            db.run(sql`DELETE FROM collection_import`);
            db.run(sql`DELETE FROM card_printing_finish`);
            db.run(sql`DELETE FROM card_printing_part`);
            db.run(sql`DELETE FROM card_printing`);
            db.run(sql`COMMIT`);
        } catch (error) {
            db.run(sql`ROLLBACK`);
            throw error;
        }

        io?.stdout.write(
            `Removed ${summary.cardPrintingsRemoved} legacy Card Printings and ${summary.collectionCardsRemoved} Collection cards; preserved ${summary.deckCandidatesPreserved} Deck Candidates.\n`,
        );
        io?.stdout.write("Apply SQLite migrations, sync Scryfall, then reimport the Collection.\n");
        return summary;
    } finally {
        closeDatabase(db);
    }
}

export function applySqliteMigrations(
    dbPath = resolveDatabasePath(),
    options: { readonly log: Logger },
    io?: SqliteMigrationIo,
): void {
    io?.stdout.write(`Target database: ${dbPath}\n`);
    mkdirSync(dirname(dbPath), {recursive: true});
    const db = openDatabase(dbPath, {log: options.log});
    try {
        const printingColumns = db.$client.query<{name: string}, []>("PRAGMA table_info(card_printing)").all();
        const printingColumnNames = new Set(printingColumns.map((column) => column.name));
        if (
            printingColumnNames.has("set_code")
            && !printingColumnNames.has("set_id")
            && tableCount(db, "card_printing") > 0
        ) {
            throw new Error(
                "Card Set migration requires clearing the legacy Printing and Collection snapshot first. "
                + "Back up the database, run `bun run db:sqlite:migration:prepare-card-set-search`, then apply migrations again.",
            );
        }
        db.run(sql`PRAGMA foreign_keys = OFF`);
        migrate(db, {migrationsFolder});
        const foreignKeyViolations = db.$client.query("PRAGMA foreign_key_check").all();
        if (foreignKeyViolations.length > 0) throw new Error(`SQLite migration left foreign key violations: ${JSON.stringify(foreignKeyViolations)}`);
        db.run(sql`PRAGMA foreign_keys = ON`);
    } finally {
        db.run(sql`PRAGMA foreign_keys = ON`);
        closeDatabase(db);
    }
    io?.stdout.write("SQLite migrations applied successfully.\n");
}

function tableCount(db: ReturnType<typeof openDatabase>, table: string): number {
    const row = db.$client.query<{count: number}, []>(`SELECT COUNT(*) AS count FROM ${table}`).get();
    return row?.count ?? 0;
}
