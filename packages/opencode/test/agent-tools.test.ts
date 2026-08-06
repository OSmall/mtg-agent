import {describe, expect, test} from "bun:test";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createTestRootLoggerFromEnv} from "@tomekin/core";
import {applySqliteMigrations} from "@tomekin/sqlite";
import {createLocalAgentToolHandlers, resultToOpencodeOutput} from "@tomekin/opencode";

const testLog = createTestRootLoggerFromEnv();

describe("opencode adapter tools", () => {
    test("renders Result output as JSON for opencode", () => {
        const output = resultToOpencodeOutput({
            isOk: () => true,
            isErr: () => false,
            value: {ready: true},
        });

        expect(JSON.parse(output)).toEqual({ready: true});
    });

    test("drafts a 60-card Constructed Brief through the public handler", () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-modern-brief-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = local.handlers.draftDeckBuildingBrief({
                goal: "Build an interactive Modern deck.",
                format: "modern",
                powerLevel: "Competitive at the local store.",
            });

            expect(result.isOk()).toBe(true);
            if (result.isErr()) throw new Error(result.error.message);
            expect(result.value.brief).toMatchObject({
                format: "modern",
                powerLevel: "Competitive at the local store.",
            });
        } finally {
            local.close();
        }
    });

    test("rejects Commander-only fields from a 60-card Constructed Brief", () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-strict-brief-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = local.handlers.draftDeckBuildingBrief({
                goal: "Build Modern control.",
                format: "modern",
                powerLevel: null,
                commanderBracket: null,
            });

            expect(result.isErr()).toBe(true);
            if (result.isOk()) throw new Error("expected a strict Brief validation failure");
            expect(result.error.type).toBe("validation_error");
        } finally {
            local.close();
        }
    });

    test("exposes 60-card Constructed Format constraints through the public handler", async () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-modern-constraints-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = await local.handlers.getFormatConstraints({format: "modern"});

            expect(result.isOk()).toBe(true);
            if (result.isErr()) throw new Error(result.error.message);
            expect(result.value).toEqual({
                format: "modern",
                mainboardMinimum: 60,
                mainboardMaximum: null,
                sideboardMaximum: 15,
                ordinaryCopyLimit: 4,
                basicLandsExempt: true,
                copyLimitOverrides: true,
                usesScryfallLegality: true,
            });
        } finally {
            local.close();
        }
    });

    test("exposes missing reference setup through local handlers", async () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = await local.handlers.summarizeReferenceSupport();
            const output = resultToOpencodeOutput(result);

            expect(JSON.parse(output)).toMatchObject({
                ready: false,
                missing: ["oracle_cards", "all_cards", "oracle_tags"],
            });
        } finally {
            local.close();
        }
    });

    test("blocks reference-dependent agent work with a structured readiness error", async () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-unready-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = await local.handlers.getCardIdentity({
                idOrName: "11111111-1111-4111-8111-111111111111",
            });

            expect(result.isErr()).toBe(true);
            if (result.isOk()) throw new Error("expected reference readiness failure");
            expect(result.error).toMatchObject({
                type: "reference_data_unready",
                missingBulkDataTypes: ["oracle_cards", "all_cards", "oracle_tags"],
                reimportRequiredBulkDataTypes: [],
            });
            expect(JSON.parse(resultToOpencodeOutput(result))).toMatchObject({
                error: "reference_data_unready",
                missingBulkDataTypes: ["oracle_cards", "all_cards", "oracle_tags"],
                reimportRequiredBulkDataTypes: [],
            });
        } finally {
            local.close();
        }
    });

    test("exposes sanctioned 60-card legality queries through the public agent workflow", async () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-format-boundary-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = await local.handlers.queryCards({
                filter: {op: "=", args: [{property: "legality.modern"}, "legal"]},
            });

            expect(result.isErr()).toBe(true);
            if (result.isOk()) throw new Error("expected missing reference data");
            expect(result.error.type).toBe("reference_data_unready");
        } finally {
            local.close();
        }
    });
});
