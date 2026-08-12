import {describe, expect, test} from "bun:test";
import {
    assessDeckLegality,
    type DeckFormat,
    type DeckLegalityCard,
    getFormatConstraints,
    isBasicLand
} from "@tomekin/core";

const sixtyCardFormats = ["standard", "pioneer", "modern", "legacy", "vintage", "pauper", "casual_60"] as const;
const scryfallFormats = ["commander", "standard", "pioneer", "modern", "legacy", "vintage", "pauper"] as const;
let nextIdentity = 1;

describe("60-card Constructed Legality Assessment", () => {
    test("exposes explicit construction constraints for every supported Format", () => {
        const modern = getFormatConstraints("modern")._unsafeUnwrap();
        const casual = getFormatConstraints("casual_60")._unsafeUnwrap();

        expect(modern).toEqual(expect.objectContaining({
            mainboardMinimum: 60,
            sideboardMaximum: 15,
            ordinaryCopyLimit: 4,
            usesScryfallLegality: true
        }));
        expect(casual).toEqual(expect.objectContaining({
            mainboardMinimum: 60,
            sideboardMaximum: 15,
            ordinaryCopyLimit: 4,
            usesScryfallLegality: false
        }));
    });
    test.each(sixtyCardFormats)("%s accepts Mainboards at and above 60 cards", (format) => {
        expect(assessment(format, [row("Plains", "Basic Land — Plains", 60)]).status).toBe("legal");
        const aboveMinimum = assessment(format, [row("Plains", "Basic Land — Plains", 61)]);
        expect(aboveMinimum.status).toBe("legal");
        expect(aboveMinimum.warnings).toEqual([]);
    });

    test("recognizes Basic Lands only from Basic and Land type tokens before the dash", () => {
        expect(isBasicLand("Basic Land — Plains")).toBe(true);
        expect(isBasicLand("Basic Snow Land — Forest")).toBe(true);
        expect(isBasicLand("Basic Land — Wastes")).toBe(true);
        expect(isBasicLand("Basic Land")).toBe(true);
        expect(isBasicLand("Land — Wastes")).toBe(false);
        expect(isBasicLand("Legendary Land — Plains")).toBe(false);
        expect(isBasicLand("Land — Basic Forest")).toBe(false);
    });

    test("permits an optional Sideboard up to 15 cards and rejects a larger one", () => {
        const mainboard = row("Plains", "Basic Land — Plains", 60);
        expect(assessment("modern", [mainboard]).status).toBe("legal");
        expect(assessment("modern", [mainboard, row("Island", "Basic Land — Island", 7, {section: "sideboard"})]).status).toBe("legal");
        expect(assessment("modern", [mainboard, row("Swamp", "Basic Land — Swamp", 15, {section: "sideboard"})]).status).toBe("legal");

        const tooLarge = assessment("modern", [mainboard, row("Mountain", "Basic Land — Mountain", 16, {section: "sideboard"})]);
        expect(tooLarge.status).toBe("illegal");
        expect(tooLarge.reasons).toContain("Modern Sideboard contains 16 cards; expected no more than 15.");
    });

    test("applies the ordinary four-copy limit by Card Identity across Mainboard and Sideboard", () => {
        const lightningBoltId = "11111111-1111-4111-8111-111111111111";
        const result = assessment("modern", [
            row("Plains", "Basic Land — Plains", 56),
            row("Lightning Bolt", "Instant", 4, {id: lightningBoltId}),
            row("Lightning Bolt", "Instant", 1, {id: lightningBoltId, section: "sideboard"}),
        ]);

        expect(result.status).toBe("illegal");
        expect(result.reasons).toContain("Lightning Bolt appears 5 times across Mainboard and Sideboard; Modern permits at most 4.");
    });

    test("honors unlimited and numeric card-specific Copy Limit Overrides", () => {
        expect(assessment("modern", [
            row("Plains", "Basic Land — Plains", 40),
            row("Rat Colony", "Creature — Rat", 20, {override: {kind: "unlimited"}}),
        ]).status).toBe("legal");
        expect(assessment("modern", [
            row("Plains", "Basic Land — Plains", 53),
            row("Seven Dwarves", "Creature — Dwarf", 7, {override: {kind: "maximum", maximum: 7}}),
        ]).status).toBe("legal");

        const tooMany = assessment("modern", [
            row("Plains", "Basic Land — Plains", 52),
            row("Seven Dwarves", "Creature — Dwarf", 8, {override: {kind: "maximum", maximum: 7}}),
        ]);
        expect(tooMany.status).toBe("illegal");
        expect(tooMany.reasons[0]).toContain("permits at most 7");
    });

    test("gives the Vintage restricted list precedence over Copy Limit Overrides", () => {
        const result = assessment("vintage", [
            row("Plains", "Basic Land — Plains", 58),
            row("Restricted Colony", "Creature — Rat", 2, {
                legality: "restricted",
                override: {kind: "unlimited"},
            }),
        ]);

        expect(result.status).toBe("illegal");
        expect(result.reasons).toContain("Restricted Colony is restricted in Vintage and appears 2 times; restricted Card Identities permit at most 1.");
    });

    test("Casual 60 bypasses sanctioned legality without bypassing construction rules", () => {
        const bannedElsewhere = [
            row("Plains", "Basic Land — Plains", 56),
            row("Banned Elsewhere", "Sorcery", 4, {legality: "banned"}),
        ];
        expect(assessment("casual_60", bannedElsewhere).status).toBe("legal");

        const fiveCopies = [...bannedElsewhere, row("Banned Elsewhere", "Sorcery", 1, {
            id: bannedElsewhere[1]!.card.id,
            section: "sideboard",
            legality: "banned",
        })];
        expect(assessment("casual_60", fiveCopies).status).toBe("illegal");
    });

    test.each(["banned", "not_legal"] as const)("treats %s sanctioned legality as illegal", (legality) => {
        const result = assessment("modern", [
            row("Plains", "Basic Land — Plains", 59),
            row("Unavailable Spell", "Sorcery", 1, {legality}),
        ]);

        expect(result.status).toBe("illegal");
        expect(result.reasons[0]).toContain(legality);
    });

    test("returns an operational error when sanctioned legality data is missing", () => {
        const card = row("Missing Legality", "Basic Land — Plains", 60);
        const result = assessDeckLegality({
            format: "modern",
            cards: [{...card, legalities: card.legalities.filter((legality) => legality.format !== "modern")}],
            scryfallSourceUpdatedAt: new Date("2026-08-01T00:00:00.000Z"),
            now: new Date("2026-08-06T00:00:00.000Z"),
        });

        expect(result.isErr()).toBe(true);
        if (result.isOk()) throw new Error("expected reference-data invariant error");
        expect(result.error.type).toBe("reference_data_invariant");
    });

    test("treats recognized sections that the Format does not permit as illegal", () => {
        const result = assessment("modern", [
            row("Plains", "Basic Land — Plains", 60),
            row("Not A Commander", "Legendary Creature — Human", 1, {section: "commander"}),
        ]);

        expect(result.status).toBe("illegal");
        expect(result.reasons[0]).toContain("Commander section");
    });

    test("warns when the Scryfall source timestamp is older than 14 days", () => {
        const result = assessDeckLegality({
            format: "standard",
            cards: [row("Plains", "Basic Land — Plains", 60)],
            scryfallSourceUpdatedAt: new Date("2026-07-01T00:00:00.000Z"),
            now: new Date("2026-08-06T00:00:00.000Z"),
        })._unsafeUnwrap();

        expect(result.status).toBe("legal");
        expect(result.scryfallSourceUpdatedAt).toEqual(new Date("2026-07-01T00:00:00.000Z"));
        expect(result.warnings[0]).toContain("36 days old");
    });

    test("preserves an unknown source timestamp for local-file imports", () => {
        const result = assessDeckLegality({
            format: "casual_60",
            cards: [row("Plains", "Basic Land — Plains", 60)],
            scryfallSourceUpdatedAt: null,
            now: new Date("2026-08-06T00:00:00.000Z"),
        })._unsafeUnwrap();

        expect(result.scryfallSourceUpdatedAt).toBeNull();
        expect(result.warnings).toEqual([]);
    });
});

describe("Commander regression boundary", () => {
    test("preserves Commander eligibility while using canonical Mainboard sections", () => {
        const result = assessment("commander", [
            row("Example Commander", "Legendary Creature — Elf", 1, {section: "commander"}),
            row("Forest", "Basic Land — Forest", 99),
        ]);

        expect(result.status).toBe("legal");
    });

    test("rejects a Sideboard without changing command-zone eligibility rules", () => {
        const result = assessment("commander", [
            row("Example Commander", "Legendary Creature — Elf", 1, {section: "commander"}),
            row("Forest", "Basic Land — Forest", 99),
            row("Plains", "Basic Land — Plains", 1, {section: "sideboard"}),
        ]);

        expect(result.status).toBe("illegal");
        expect(result.reasons[0]).toContain("Sideboard");
    });
});

function assessment(format: DeckFormat, cards: readonly DeckLegalityCard[]) {
    return assessDeckLegality({
        format,
        cards,
        scryfallSourceUpdatedAt: new Date("2026-08-01T00:00:00.000Z"),
        now: new Date("2026-08-06T00:00:00.000Z"),
    })._unsafeUnwrap();
}

function row(name: string, typeLine: string, quantity: number, options: {
    readonly id?: string;
    readonly section?: DeckLegalityCard["section"];
    readonly override?: DeckLegalityCard["card"]["copyLimitOverride"];
    readonly legality?: "legal" | "not_legal" | "banned" | "restricted";
} = {}): DeckLegalityCard {
    const suffix = String(nextIdentity++).padStart(12, "0");
    const id = options.id ?? `00000000-0000-4000-8000-${suffix}`;
    return {
        card: {
            id,
            name,
            layout: "normal",
            manaCost: null,
            manaValue: 0,
            typeLine,
            oracleText: null,
            copyLimitOverride: options.override ?? {kind: "none"},
            colorIdentity: "",
            colors: null,
            colorIndicator: null,
            producedMana: null,
            keywords: [],
            power: null,
            toughness: null,
            loyalty: null,
            defense: null,
            edhrecRank: null,
            gameChanger: false,
            sourcePageUri: "https://scryfall.com/card/example",
        },
        quantity,
        section: options.section ?? "mainboard",
        legalities: scryfallFormats.map((candidate) => ({
            cardIdentityId: id,
            format: candidate,
            legality: options.legality ?? "legal",
        })),
        parts: [],
    };
}
