import {describe, expect, test} from "bun:test";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createTestRootLoggerFromEnv} from "@tomekin/core";
import {
    applySqliteMigrations,
    cardIdentity,
    closeDatabase,
    createSqliteDeckCandidateRepository,
    openDatabase
} from "@tomekin/sqlite";

const testLog = createTestRootLoggerFromEnv();

describe("SQLite Deck Candidate repository", () => {
    test("persists 60-card Constructed Format from the authoritative Brief", async () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-candidate-sixty-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const db = openDatabase(dbPath, {log: testLog});
        try {
            db.insert(cardIdentity).values(identity("11111111-1111-4111-8111-111111111111", "Monastery Swiftspear", "Creature — Human Monk")).run();
            const repository = createSqliteDeckCandidateRepository(db, {now: () => new Date("2026-08-06T00:00:00.000Z")});

            const saved = await repository.saveDeckCandidate({
                label: "Modern Prowess",
                formatAnchor: "Prowess",
                brief: {
                    goal: "Build Modern prowess",
                    format: "modern",
                    powerLevel: "Competitive",
                    formatAnchor: "Prowess",
                    playExperience: "Fast and interactive",
                    budget: null,
                    missingCardTolerance: "Moderate",
                    comboTolerance: "Avoid",
                    constraints: [],
                    exclusions: [],
                    assumptions: []
                },
                collectionImportTimestamp: null,
                markdown: "# Modern Prowess",
                cards: [
                    {
                        cardIdentityId: "11111111-1111-4111-8111-111111111111",
                        quantity: 4,
                        section: "mainboard",
                        sortOrder: 0,
                        note: null
                    },
                    {
                        cardIdentityId: "11111111-1111-4111-8111-111111111111",
                        quantity: 1,
                        section: "sideboard",
                        sortOrder: 1,
                        note: "fixture only"
                    },
                ],
            });

            expect(saved.isOk()).toBe(true);
            if (saved.isErr()) throw new Error(saved.error.message);
            expect(saved.value.format).toBe("modern");
            expect(saved.value.brief).not.toHaveProperty("commanderBracket");
            const listed = await repository.listDeckCandidates();
            if (listed.isErr()) throw new Error(listed.error.message);
            expect(listed.value[0]?.format).toBe("modern");
        } finally {
            closeDatabase(db);
        }
    });

  test("saves, updates in place, and reopens candidate cards with Card Identity names", async () => {
    const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-candidate-")), "test.sqlite");
    applySqliteMigrations(dbPath, {log: testLog});
    const db = openDatabase(dbPath, {log: testLog});
    try {
      db.insert(cardIdentity).values([
        identity("33333333-3333-4333-8333-333333333333", "Example Commander", "Legendary Creature — Elf"),
        identity("11111111-1111-4111-8111-111111111111", "Sol Ring", "Artifact"),
        identity("22222222-2222-4222-8222-222222222222", "Cultivate", "Sorcery"),
      ]).run();
      let now = new Date("2026-01-01T00:00:00.000Z");
      const repository = createSqliteDeckCandidateRepository(db, {now: () => now});

      const saved = await repository.saveDeckCandidate({
        label: "Example Deck",
        formatAnchor: "Example Commander",
        brief: {goal: "Build an example deck", format: "commander", formatAnchor: "Example Commander", playExperience: "Casual", commanderBracket: "Bracket 2", budget: null, missingCardTolerance: "Moderate", comboTolerance: "Avoid", constraints: [], exclusions: [], assumptions: [], ruleZeroExceptions: []},
        collectionImportTimestamp: null,
        markdown: "# Example Deck",
        cards: [
          {cardIdentityId: "33333333-3333-4333-8333-333333333333", quantity: 1, section: "commander", sortOrder: 0, note: null},
            {
                cardIdentityId: "11111111-1111-4111-8111-111111111111",
                quantity: 1,
                section: "mainboard",
                sortOrder: 1,
                note: null
            },
        ],
      });

      expect(saved.isOk()).toBe(true);
      if (saved.isErr()) throw new Error(saved.error.message);
      expect(saved.value.cards.map((card) => card.cardName)).toEqual(["Example Commander", "Sol Ring"]);

      const reopened = await repository.getDeckCandidate(saved.value.id);
      expect(reopened.isOk()).toBe(true);
      if (reopened.isErr()) throw new Error(reopened.error.message);
      expect(reopened.value.label).toBe("Example Deck");
      expect(reopened.value.cards).toHaveLength(2);

      now = new Date("2026-01-02T00:00:00.000Z");
      const updated = await repository.saveDeckCandidate({
        id: saved.value.id,
        label: "Updated Example Deck",
        formatAnchor: "Example Commander",
        brief: saved.value.brief,
        collectionImportTimestamp: null,
        markdown: "# Updated Example Deck",
        cards: [
          {cardIdentityId: "33333333-3333-4333-8333-333333333333", quantity: 1, section: "commander", sortOrder: 0, note: null},
            {
                cardIdentityId: "22222222-2222-4222-8222-222222222222",
                quantity: 1,
                section: "mainboard",
                sortOrder: 1,
                note: null
            },
        ],
      });

      expect(updated.isOk()).toBe(true);
      if (updated.isErr()) throw new Error(updated.error.message);
      expect(updated.value.id).toBe(saved.value.id);
      expect(updated.value.createdAt).toEqual(saved.value.createdAt);
      expect(updated.value.updatedAt).toEqual(now);
      expect(updated.value.cards.map((card) => card.cardName)).toEqual(["Example Commander", "Cultivate"]);

      const listed = await repository.listDeckCandidates();
      expect(listed.isOk()).toBe(true);
      if (listed.isErr()) throw new Error(listed.error.message);
      expect(listed.value).toHaveLength(1);
      expect(listed.value[0]?.label).toBe("Updated Example Deck");
      expect(listed.value[0]?.cardCount).toBe(2);
        expect(listed.value[0]).not.toHaveProperty("commanderBracket");
    } finally {
      closeDatabase(db);
    }
  });
});

function identity(id: string, name: string, typeLine: string) {
  return {
    id,
    name,
    layout: "normal" as const,
    manaCost: null,
    manaValue: 1,
    typeLine,
    oracleText: null,
      copyLimitOverrideKind: "none" as const,
      copyLimitOverrideMaximum: null,
    colorIdentity: "" as const,
    colors: null,
    colorIndicator: null,
    producedMana: null,
    keywordsJson: [],
    power: null,
    toughness: null,
    loyalty: null,
    defense: null,
    edhrecRank: null,
      gameChanger: false,
    sourcePageUri: "https://scryfall.com/card/example",
  };
}
