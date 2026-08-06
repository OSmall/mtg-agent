import {describe, expect, test} from "bun:test";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const workspaceRoot = join(import.meta.dir, "../../..");

describe("Tomekin agent configuration", () => {
    test("routes 60-card Constructed work through the researched methodology", () => {
        const methodology = read(".opencode/skills/sixty-card-constructed-deck-architecture/SKILL.md");
        const coordinator = read(".opencode/skills/tomekin-deck-building/SKILL.md");
        const agent = read(".opencode/agents/tomekin-deck-builder.md");

        expect(methodology).toContain("Do not create a Sideboard by default");
        expect(methodology).toMatch(/one\s+focused matchup question/);
        expect(methodology).toContain("19.59");
        expect(methodology).toContain("60-card-constructed-slice-2-strategy.md");
        expect(coordinator).toContain("sixty-card-constructed-deck-architecture");
        expect(agent).toContain("sixty-card-constructed-deck-architecture");
    });

    test("documents the complete public Card Query legality vocabulary", () => {
        const querySkill = read(".opencode/skills/query-cards/SKILL.md");

        for (const format of ["commander", "standard", "pioneer", "modern", "legacy", "vintage", "pauper"]) {
            expect(querySkill).toContain(`legality.${format}`);
        }
        expect(querySkill).toContain("`legality.casual_60` is invalid");
    });
});

function read(path: string): string {
    return readFileSync(join(workspaceRoot, path), "utf8");
}
