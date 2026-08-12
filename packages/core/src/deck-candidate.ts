import {z} from "zod";
import {type DeckBuildingBrief, DeckBuildingBriefSchema, DeckFormatSchema} from "./deck-building-brief";

export const deckCandidateCardSectionValues = ["commander", "mainboard", "sideboard"] as const;
export const DeckCandidateCardSectionSchema = z.enum(deckCandidateCardSectionValues);
export type DeckCandidateCardSection = z.infer<typeof DeckCandidateCardSectionSchema>;

export const DeckCandidateCardInputSchema = z.object({
  cardIdentityId: z.uuid(),
  quantity: z.number().int().positive(),
  section: DeckCandidateCardSectionSchema,
  sortOrder: z.number().int().nonnegative().default(0),
  note: z.string().min(1).nullable().default(null),
});
export type DeckCandidateCardInput = z.infer<typeof DeckCandidateCardInputSchema>;

export const DeckCandidateCardSchema = DeckCandidateCardInputSchema.extend({
  cardName: z.string().min(1),
});
export type DeckCandidateCard = z.infer<typeof DeckCandidateCardSchema>;

export const SaveDeckCandidateInputSchema = z.strictObject({
  id: z.uuid().optional(),
  label: z.string().min(1),
  formatAnchor: z.string().min(1).nullable().default(null),
  brief: DeckBuildingBriefSchema,
  collectionImportTimestamp: z.coerce.date().nullable().default(null),
  markdown: z.string().min(1),
  cards: z.array(DeckCandidateCardInputSchema).min(1),
});
export type SaveDeckCandidateInput = z.input<typeof SaveDeckCandidateInputSchema>;
export type NormalizedSaveDeckCandidateInput = z.infer<typeof SaveDeckCandidateInputSchema>;

export const DeckCandidateSchema = z.strictObject({
  id: z.uuid(),
  label: z.string().min(1),
  format: DeckFormatSchema,
  formatAnchor: z.string().min(1).nullable(),
  brief: DeckBuildingBriefSchema,
  collectionImportTimestamp: z.date().nullable(),
  markdown: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  cards: z.array(DeckCandidateCardSchema),
}).superRefine((candidate, context) => {
    if (candidate.format !== candidate.brief.format) {
        context.addIssue({
            code: "custom",
            path: ["format"],
            message: "Deck Candidate Format must match its authoritative Deck Building Brief Format.",
        });
    }
});
export type DeckCandidate = z.infer<typeof DeckCandidateSchema>;

export type DeckCandidateSummary = Omit<DeckCandidate, "brief" | "markdown" | "cards"> & {
  readonly cardCount: number;
};

export type DeckCandidateRepositoryError = {
  readonly type: "repository_error" | "not_found" | "unresolved_card_identity";
  readonly message: string;
};

export type DeckCandidateRepository = {
  saveDeckCandidate(input: NormalizedSaveDeckCandidateInput): Promise<import("neverthrow").Result<DeckCandidate, DeckCandidateRepositoryError>>;
  getDeckCandidate(id: string): Promise<import("neverthrow").Result<DeckCandidate, DeckCandidateRepositoryError>>;
  listDeckCandidates(): Promise<import("neverthrow").Result<readonly DeckCandidateSummary[], DeckCandidateRepositoryError>>;
};

export function normalizeDeckCandidateForSave(input: SaveDeckCandidateInput): NormalizedSaveDeckCandidateInput {
    const parsed = SaveDeckCandidateInputSchema.parse(input);
    return parsed;
}

export function candidateCardCount(cards: readonly {readonly quantity: number}[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

export function briefFormatAnchor(brief: DeckBuildingBrief): string | null {
  return brief.formatAnchor ?? null;
}
