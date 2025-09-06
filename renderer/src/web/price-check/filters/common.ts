import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";
import { ModifierType } from "@/parser/modifiers";

export function maxUsefulItemLevel(category: ItemCategory | undefined) {
  const itemLevelCaps: Partial<Record<ItemCategory, number>> = {
    [ItemCategory.Wand]: 81,
    [ItemCategory.Staff]: 81,
    [ItemCategory.Spear]: 81,
    [ItemCategory.Relic]: 80,
  };

  const maxUsefulItemLevel = category ? (itemLevelCaps[category] ?? 82) : 82;
  return maxUsefulItemLevel;
}

export function likelyFinishedItem(item: ParsedItem) {
  return (
    item.rarity === ItemRarity.Unique ||
    item.statsByType.some((calc) => calc.type === ModifierType.Crafted) ||
    item.quality === 20 || // quality > 20 can be used for selling bases, quality < 20 drops sometimes
    item.isCorrupted ||
    item.isMirrored
  );
}

export function hasCraftingValue(item: ParsedItem) {
  return (
    // Base useful crafting item (synth and influence not in poe2 yet though)
    item.isSynthesised ||
    item.isFractured ||
    item.influences.length ||
    // Clusters (deprecated)
    item.category === ItemCategory.ClusterJewel ||
    // Jewels
    (item.category === ItemCategory.Jewel &&
      item.rarity === ItemRarity.Magic) ||
    // High ilvl
    item.itemLevel! >= maxUsefulItemLevel(item.category)
  );
}
