import {describe, expect, test} from "bun:test";
import {compileCopyLimitOverride} from "@tomekin/core";

describe("Copy Limit Override compilation", () => {
    test("compiles canonical unlimited deck-construction text", () => {
        expect(compileCopyLimitOverride(
            "Rat Colony",
            "A deck can have any number of cards named Rat Colony.",
        )).toEqual({kind: "unlimited"});
    });

    test("compiles a canonical named maximum expressed as a number word", () => {
        expect(compileCopyLimitOverride(
            "Seven Dwarves",
            "A deck can have up to seven cards named Seven Dwarves.",
        )).toEqual({kind: "maximum", maximum: 7});
    });

    test("blocks potential deck-construction wording that is not fully understood", () => {
        expect(() => compileCopyLimitOverride(
            "Future Colony",
            "Your deck may contain as many cards named Future Colony as you like.",
        )).toThrow("Card Identity Future Colony has unsupported potential Copy Limit Override wording");
        expect(() => compileCopyLimitOverride(
            "Rat Colony",
            "A deck can have any number of cards named Relentless Rats.",
        )).toThrow("Card Identity Rat Colony has unsupported potential Copy Limit Override wording");
    });

    test("does not combine unrelated deck and cards-named wording across sentences", () => {
        expect(compileCopyLimitOverride(
            "Arcane Savant",
            "Before you shuffle your deck to start the game, you may reveal this card from your deck and exile an instant or sorcery card you drafted that isn't in your deck.\nWhen this creature enters, copy a card you exiled with cards named Arcane Savant. You may cast the copy without paying its mana cost.",
        )).toEqual({kind: "none"});
    });
});
