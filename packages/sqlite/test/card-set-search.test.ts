import {describe, expect, test} from "bun:test";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createTestRootLoggerFromEnv} from "@tomekin/core";
import {
    applySqliteMigrations,
    cardIdentity,
    cardPrinting,
    cardPrintingPromoType,
    cardSet,
    closeDatabase,
    collectionCard,
    collectionLocation,
    createSqliteCardQueryRepository,
    createSqliteCardReferenceRepository,
    openDatabase,
} from "@tomekin/sqlite";

const log = createTestRootLoggerFromEnv();

describe("SQLite Card Set discovery and Printing queries", () => {
    test("searches Set code and name case-insensitively with exact-match ranking", async () => {
        await withDatabase(async (db) => {
            db.insert(cardSet).values([
                setRow("11111111-1111-4111-8111-111111111111", "hob", "Tales of Middle-earth Commander"),
                setRow("22222222-2222-4222-8222-222222222222", "who", "Doctor Who"),
                setRow("33333333-3333-4333-8333-333333333333", "who2", "WHO"),
            ]).run();
            const repository = createSqliteCardReferenceRepository(db);

            const exactCode = await repository.searchCardSets({query: "HOB"});
            expect(exactCode.isOk() && exactCode.value.map((set) => set.code)).toEqual(["hob"]);
            const exactName = await repository.searchCardSets({query: "who", limit: 2});
            expect(exactName.isOk() && exactName.value.map((set) => set.code)).toEqual(["who", "who2"]);
            const partial = await repository.searchCardSets({query: "doctor"});
            expect(partial.isOk() && partial.value.map((set) => set.name)).toEqual(["Doctor Who"]);
        });
    });

    test("defaults Set discovery to 25 results and caps repository requests at 100", async () => {
        await withDatabase(async (db) => {
            db.insert(cardSet).values(Array.from({length: 105}, (_, index) =>
                setRow(`set-${String(index).padStart(3, "0")}`, `s${String(index).padStart(3, "0")}`, `Set ${String(index).padStart(3, "0")}`),
            )).run();
            const repository = createSqliteCardReferenceRepository(db);

            const defaults = await repository.searchCardSets({});
            const capped = await repository.searchCardSets({limit: 1_000});

            expect(defaults.isOk() && defaults.value).toHaveLength(25);
            expect(capped.isOk() && capped.value).toHaveLength(100);
        });
    });

    test("implements Printing existence, anti-existence, and same-Printing promo scope", async () => {
        await withDatabase(async (db) => {
            db.insert(cardSet).values([
                setRow("11111111-1111-4111-8111-111111111111", "hob", "Universes Beyond Set"),
                setRow("22222222-2222-4222-8222-222222222222", "dom", "Dominaria"),
                setRow("33333333-3333-4333-8333-333333333333", "sld", "Secret Lair Drop"),
            ]).run();
            db.insert(cardIdentity).values([
                identity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Mixed"),
                identity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "UB Only"),
                identity("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Non-UB Only"),
                identity("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "Secret Lair Only"),
            ]).run();
            db.insert(cardPrinting).values([
                printing("a0000000-0000-4000-8000-000000000001", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "11111111-1111-4111-8111-111111111111"),
                printing("a0000000-0000-4000-8000-000000000003", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "11111111-1111-4111-8111-111111111111"),
                printing("a0000000-0000-4000-8000-000000000002", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "22222222-2222-4222-8222-222222222222"),
                printing("a0000000-0000-4000-8000-000000000004", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "33333333-3333-4333-8333-333333333333"),
                printing("b0000000-0000-4000-8000-000000000001", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "11111111-1111-4111-8111-111111111111"),
                printing("c0000000-0000-4000-8000-000000000001", "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "22222222-2222-4222-8222-222222222222"),
                printing("d0000000-0000-4000-8000-000000000001", "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "33333333-3333-4333-8333-333333333333"),
            ]).run();
            db.insert(cardPrintingPromoType).values([
                {cardPrintingId: "a0000000-0000-4000-8000-000000000001", promoType: "universesbeyond"},
                {cardPrintingId: "b0000000-0000-4000-8000-000000000001", promoType: "universesbeyond"},
            ]).run();
            db.insert(collectionLocation).values({id: "owned-location", name: "Binder", type: "binder"}).run();
            db.insert(collectionCard).values({
                id: "owned-mixed-sld", quantity: 1, collectionLocationId: "owned-location", finish: "nonfoil",
                manaBoxId: null, cardPrintingId: "a0000000-0000-4000-8000-000000000004", misprint: false,
                altered: false, condition: null, purchasePriceCurrency: null, purchasePrice: null, addedAt: null,
                sourceRowNumber: 1,
            }).run();
            const repository = createSqliteCardQueryRepository(db);

            const acceptable = await repository.queryCards({filter: {op: "withPrinting", args: [
                {op: "=", args: [{property: "printing.universesBeyond"}, false]},
            ]}});
            expect(acceptable.isOk() && acceptable.value.items.map((item) => item.name)).toEqual(["Mixed", "Non-UB Only", "Secret Lair Only"]);

            const neverUb = await repository.queryCards({filter: {op: "withoutPrinting", args: [
                {op: "=", args: [{property: "printing.universesBeyond"}, true]},
            ]}});
            expect(neverUb.isOk() && neverUb.value.items.map((item) => item.name)).toEqual(["Non-UB Only", "Secret Lair Only"]);

            const scoped = await repository.queryCards({filter: {op: "withPrinting", args: [{op: "and", args: [
                {op: "=", args: [{property: "printing.setCode"}, "dom"]},
                {op: "=", args: [{property: "printing.promoType"}, "universesbeyond"]},
            ]}]}});
            expect(scoped.isOk() && scoped.value.items).toEqual([]);

            const hob = await repository.queryCards({filter: {op: "withPrinting", args: [
                {op: "=", args: [{property: "printing.setCode"}, "hob"]},
            ]}});
            expect(hob.isOk() && hob.value.items.map((item) => item.name)).toEqual(["Mixed", "UB Only"]);

            const acceptableSecretLair = await repository.queryCards({filter: {op: "withPrinting", args: [
                {op: "not", args: [{op: "in", args: [{property: "printing.setCode"}, ["sld"]]}]},
            ]}});
            expect(acceptableSecretLair.isOk() && acceptableSecretLair.value.items.map((item) => item.name))
                .toEqual(["Mixed", "UB Only", "Non-UB Only"]);

            const neverSecretLair = await repository.queryCards({filter: {op: "withoutPrinting", args: [
                {op: "in", args: [{property: "printing.setCode"}, ["sld"]]},
            ]}});
            expect(neverSecretLair.isOk() && neverSecretLair.value.items.map((item) => item.name))
                .toEqual(["UB Only", "Non-UB Only"]);

            const independentlyOwned = await repository.queryCards({filter: {op: "and", args: [
                {op: "withPrinting", args: [{op: "=", args: [{property: "printing.setCode"}, "dom"]}]},
                {op: "withCollectionCard", args: [{op: ">", args: [{property: "collection.quantity"}, 0]}]},
            ]}});
            expect(independentlyOwned.isOk() && independentlyOwned.value.items.map((item) => item.name)).toEqual(["Mixed"]);
        });
    });
});

async function withDatabase(run: (db: ReturnType<typeof openDatabase>) => Promise<void>) {
    const path = join(mkdtempSync(join(tmpdir(), "tomekin-card-set-")), "test.sqlite");
    applySqliteMigrations(path, {log});
    const db = openDatabase(path, {log});
    try { await run(db); } finally { closeDatabase(db); }
}

function setRow(id: string, code: string, name: string) {
    return {id, code, name, setType: "expansion", apiUri: `https://api.scryfall.com/sets/${id}`,
        cardSearchUri: `https://api.scryfall.com/cards/search?q=e%3A${code}`,
        sourcePageUri: `https://scryfall.com/sets/${code}`};
}

function identity(id: string, name: string) {
    return {id, name, layout: "normal" as const, manaCost: null, manaValue: 1, typeLine: "Artifact",
        oracleText: null, copyLimitOverrideKind: "none" as const, copyLimitOverrideMaximum: null,
        colorIdentity: "" as const, colors: null, colorIndicator: null, producedMana: null, keywordsJson: [],
        power: null, toughness: null, loyalty: null, defense: null, edhrecRank: null, gameChanger: false,
        sourcePageUri: `https://scryfall.com/card/${id}`};
}

function printing(id: string, cardIdentityId: string, setId: string) {
    return {id, cardIdentityId, setId, layout: "standard" as const, printedName: null, collectorNumber: "1",
        language: "en", tcgplayerId: null, cardmarketId: null, sourcePageUri: `https://scryfall.com/card/${id}`};
}
