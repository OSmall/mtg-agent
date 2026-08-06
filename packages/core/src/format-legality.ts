import {err, ok, type Result} from "neverthrow";
import type {DeckBuildingBrief, DeckFormat} from "./deck-building-brief";
import type {DeckCandidateCardSection} from "./deck-candidate";
import type {CardIdentity, CardIdentityFormatLegality, CardIdentityPart} from "./scryfall-sync";
import {effectiveCopyMaximum} from "./deck-construction-rules";
import {validateCommanderDeck} from "./commander-legality";

export type DeckLegalityCard = {
    readonly card: CardIdentity;
    readonly quantity: number;
    readonly section: DeckCandidateCardSection;
    readonly legalities: readonly CardIdentityFormatLegality[];
    readonly parts?: readonly CardIdentityPart[];
};

export type LegalityAssessment = {
    readonly status: "legal" | "illegal" | "unsupported";
    readonly reasons: readonly string[];
    readonly warnings: readonly string[];
    readonly scryfallSourceUpdatedAt: Date | null;
};

export type LegalityAssessmentError = {
    readonly type: "reference_data_invariant" | "invalid_input";
    readonly message: string;
};

export type AssessDeckLegalityInput = {
    readonly format: DeckFormat;
    readonly cards: readonly DeckLegalityCard[];
    readonly brief?: DeckBuildingBrief;
    readonly scryfallSourceUpdatedAt: Date | null;
    readonly now?: Date;
};

export function assessDeckLegality(input: AssessDeckLegalityInput): Result<LegalityAssessment, LegalityAssessmentError> {
    if (input.format === "commander") {
        return assessCommander(input);
    }

    const reasons: string[] = [];
    const vintageRestricted = new Set<string>();
    const warnings = staleWarnings(input.scryfallSourceUpdatedAt, input.now);
    const mainboardSize = sectionQuantity(input.cards, "mainboard");
    if (mainboardSize < 60) reasons.push(`${displayFormat(input.format)} Mainboard contains ${mainboardSize} cards; expected at least 60.`);
    const sideboardSize = sectionQuantity(input.cards, "sideboard");
    if (sideboardSize > 15) reasons.push(`${displayFormat(input.format)} Sideboard contains ${sideboardSize} cards; expected no more than 15.`);

    for (const row of input.cards) {
        if (row.section === "commander") reasons.push(`${row.card.name} is in the Commander section, which is not permitted in ${displayFormat(input.format)}.`);
        if (input.format !== "casual_60") {
            const legality = row.legalities.find((candidate) => candidate.format === input.format);
            if (!legality) {
                return err({
                    type: "reference_data_invariant",
                    message: `Missing ${displayFormat(input.format)} legality data for Card Identity ${row.card.name} (${row.card.id}).`,
                });
            }
            if (legality.legality === "banned" || legality.legality === "not_legal") {
                reasons.push(`${row.card.name} is ${legality.legality} in ${displayFormat(input.format)} according to local Scryfall data.`);
            }
            if (input.format === "vintage" && legality.legality === "restricted") vintageRestricted.add(row.card.id);
        }
    }

    const quantityByIdentity = aggregateRelevantQuantities(input.cards);
    for (const {card, quantity} of quantityByIdentity.values()) {
        if (vintageRestricted.has(card.id)) {
            if (quantity > 1) reasons.push(`${card.name} is restricted in Vintage and appears ${quantity} times; restricted Card Identities permit at most 1.`);
            continue;
        }
        const maximum = effectiveCopyMaximum(card, 4);
        if (maximum !== null && quantity > maximum) reasons.push(`${card.name} appears ${quantity} times across Mainboard and Sideboard; ${displayFormat(input.format)} permits at most ${maximum}.`);
    }

    return ok({
        status: reasons.length === 0 ? "legal" : "illegal",
        reasons,
        warnings,
        scryfallSourceUpdatedAt: input.scryfallSourceUpdatedAt,
    });
}

function sectionQuantity(cards: readonly DeckLegalityCard[], section: DeckCandidateCardSection): number {
    return cards.filter((row) => row.section === section).reduce((sum, row) => sum + row.quantity, 0);
}

function assessCommander(input: AssessDeckLegalityInput): Result<LegalityAssessment, LegalityAssessmentError> {
    for (const row of input.cards) {
        if (!row.legalities.some((legality) => legality.format === "commander")) {
            return err({
                type: "reference_data_invariant",
                message: `Missing Commander legality data for Card Identity ${row.card.name} (${row.card.id}).`,
            });
        }
    }
    const sideboardReasons = input.cards
        .filter((row) => row.section === "sideboard")
        .map((row) => `${row.card.name} is in the Sideboard, which is not permitted in Commander.`);
    const commanderCards = input.cards
        .filter((row) => row.section !== "sideboard")
        .map((row) => ({...row, section: row.section as "commander" | "mainboard"}));
    const brief = input.brief?.format === "commander" ? input.brief : undefined;
    const commander = validateCommanderDeck(commanderCards, brief);
    const reasons = [...sideboardReasons, ...commander.reasons];
    return ok({
        status: commander.status === "unsupported" ? "unsupported" : reasons.length === 0 ? "legal" : "illegal",
        reasons,
        warnings: [...commander.warnings, ...staleWarnings(input.scryfallSourceUpdatedAt, input.now)],
        scryfallSourceUpdatedAt: input.scryfallSourceUpdatedAt,
    });
}

function aggregateRelevantQuantities(cards: readonly DeckLegalityCard[]): Map<string, {
    card: CardIdentity;
    quantity: number
}> {
    const quantities = new Map<string, { card: CardIdentity; quantity: number }>();
    for (const row of cards.filter((candidate) => candidate.section === "mainboard" || candidate.section === "sideboard")) {
        const previous = quantities.get(row.card.id);
        quantities.set(row.card.id, {card: row.card, quantity: (previous?.quantity ?? 0) + row.quantity});
    }
    return quantities;
}

function staleWarnings(sourceUpdatedAt: Date | null, now = new Date()): string[] {
    if (sourceUpdatedAt === null) return [];
    const ageDays = (now.getTime() - sourceUpdatedAt.getTime()) / 86_400_000;
    return ageDays > 14
        ? [`Scryfall reference data is ${Math.floor(ageDays)} days old; refresh if current external facts matter.`]
        : [];
}

function displayFormat(format: DeckFormat): string {
    if (format === "casual_60") return "Casual 60";
    return format.charAt(0).toUpperCase() + format.slice(1);
}
