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
        } finally {
            local.close();
        }
    });

    test("keeps non-Commander legality queries out of the public agent workflow", async () => {
        const dbPath = join(mkdtempSync(join(tmpdir(), "tomekin-opencode-format-boundary-")), "test.sqlite");
        applySqliteMigrations(dbPath, {log: testLog});
        const local = createLocalAgentToolHandlers({databasePath: dbPath, log: testLog});
        try {
            const result = await local.handlers.queryCards({
                filter: {op: "=", args: [{property: "legality.modern"}, "legal"]},
            });

            expect(result.isErr()).toBe(true);
            if (result.isOk()) throw new Error("expected public Format boundary failure");
            expect(result.error.type).toBe("validation_error");
        } finally {
            local.close();
        }
    });
});
