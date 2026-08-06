import type {CardIdentity} from "./scryfall-sync";

export function isBasicLand(typeLine: string): boolean {
    const rulesTypes = typeLine.split(/\s+[—-]\s+/, 1)[0] ?? typeLine;
    const tokens = new Set(rulesTypes.split(/\s+/));
    return tokens.has("Basic") && tokens.has("Land");
}

export function effectiveCopyMaximum(card: CardIdentity, ordinaryMaximum: number): number | null {
    if (isBasicLand(card.typeLine) || card.copyLimitOverride.kind === "unlimited") return null;
    return card.copyLimitOverride.kind === "maximum" ? card.copyLimitOverride.maximum : ordinaryMaximum;
}
