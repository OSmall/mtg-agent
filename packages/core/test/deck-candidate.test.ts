import {describe, expect, test} from "bun:test";
import {normalizeDeckCandidateForSave, SaveDeckCandidateArgsSchema} from "@tomekin/core";

describe("Deck Candidate", () => {
    test("derives its only writable Format from the Brief and accepts canonical sections", () => {
        const candidate = normalizeDeckCandidateForSave({
            label: "Modern Prowess",
            formatAnchor: "Prowess",
            brief: {
                goal: "Build Modern prowess",
                format: "modern",
                powerLevel: "Competitive at the expected local table",
            },
            collectionImportTimestamp: null,
            markdown: "# Modern Prowess",
            cards: [
                {cardIdentityId: "11111111-1111-4111-8111-111111111111", quantity: 4, section: "mainboard"},
                {cardIdentityId: "22222222-2222-4222-8222-222222222222", quantity: 2, section: "sideboard"},
            ],
        });

        expect(candidate.brief.format).toBe("modern");
        expect(candidate).not.toHaveProperty("commanderBracket");
        expect(() => normalizeDeckCandidateForSave({...candidate, format: "legacy"} as never)).toThrow();
        expect(() => normalizeDeckCandidateForSave({
            ...candidate,
            cards: [{...candidate.cards[0]!, section: "deck"}]
        } as never)).toThrow();
        expect(() => normalizeDeckCandidateForSave({
            ...candidate,
            cards: [{...candidate.cards[0]!, section: "companion"}]
        } as never)).toThrow();
    });

    test("keeps the public agent save contract Commander-only", () => {
        expect(SaveDeckCandidateArgsSchema.safeParse({
            label: "Modern Prowess",
            formatAnchor: "Prowess",
            brief: {
                goal: "Build Modern prowess",
                format: "modern",
                powerLevel: "Competitive",
            },
            collectionImportTimestamp: null,
            markdown: "# Modern Prowess",
            cards: [{
                cardIdentityId: "11111111-1111-4111-8111-111111111111",
                quantity: 4,
                section: "mainboard",
            }],
        }).success).toBe(false);
    });
});
