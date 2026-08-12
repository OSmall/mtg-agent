import {describe, expect, test} from "bun:test";
import {
    requiredScryfallImportContractRevisions,
    type ScryfallBulkDataImport,
    summarizeReferenceImports
} from "@tomekin/core";

describe("Scryfall reference readiness", () => {
    test("requires a reimport when the latest successful dataset has an older Import Contract Revision", () => {
        const imports: ScryfallBulkDataImport[] = [
            imported("oracle_cards", 0),
            imported("all_cards", requiredScryfallImportContractRevisions.all_cards),
            imported("oracle_tags", requiredScryfallImportContractRevisions.oracle_tags),
        ];

        const status = summarizeReferenceImports(imports, new Date("2026-08-06T00:00:00.000Z"));

        expect(status.missing).toEqual([]);
        expect(status.reimportRequired).toEqual(["oracle_cards"]);
        expect(status.ready).toBe(false);
    });
});

function imported(bulkDataType: ScryfallBulkDataImport["bulkDataType"], importContractRevision: number): ScryfallBulkDataImport {
    return {
        id: `${bulkDataType}-import`,
        bulkDataType,
        importContractRevision,
        status: "succeeded",
        startedAt: new Date("2026-08-01T00:00:00.000Z"),
        completedAt: new Date("2026-08-01T00:01:00.000Z"),
        sourceUpdatedAt: new Date("2026-08-01T00:00:00.000Z"),
        sourceUri: "fixture://scryfall",
        importedRecordCount: 1,
        warnings: [],
        blockingErrors: [],
    };
}
