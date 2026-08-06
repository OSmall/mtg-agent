import {describe, expect, test} from "bun:test";
import {DeckBuildingBriefSchema, draftDeckBuildingBrief, DraftDeckBuildingBriefInputSchema} from "@tomekin/core";

describe("Deck Building Brief", () => {
    test("models Commander and 60-card Constructed preferences as strict Format branches", () => {
        const commander = DeckBuildingBriefSchema.parse({
            goal: "Build around Muldrotha",
            format: "commander",
            commanderBracket: null,
            ruleZeroExceptions: [],
        });
        const modern = DeckBuildingBriefSchema.parse({
            goal: "Build Modern prowess",
            format: "modern",
            powerLevel: null,
        });

        expect(commander).not.toHaveProperty("powerLevel");
        expect(modern).not.toHaveProperty("commanderBracket");
        expect(modern).not.toHaveProperty("ruleZeroExceptions");
        expect(DeckBuildingBriefSchema.safeParse({...modern, commanderBracket: null}).success).toBe(false);
        expect(DeckBuildingBriefSchema.safeParse({...commander, powerLevel: null}).success).toBe(false);
    });

    test("requires Format while drafting and adds the bracket assumption only for Commander", () => {
        expect(DraftDeckBuildingBriefInputSchema.safeParse({goal: "Build a deck"}).success).toBe(false);

        const commander = draftDeckBuildingBrief({
            goal: "Build a Commander deck",
            format: "commander",
            commanderBracket: null,
            ruleZeroExceptions: [],
        });
        const standard = draftDeckBuildingBrief({
            goal: "Build a Standard deck",
            format: "standard",
            powerLevel: null,
        });

        expect(commander.assumptionsToConfirm).toContain("Commander Bracket was not specified; confirm the intended table experience before deck-building.");
        expect(standard.assumptionsToConfirm).not.toContain("Commander Bracket was not specified; confirm the intended table experience before deck-building.");
    });
});
