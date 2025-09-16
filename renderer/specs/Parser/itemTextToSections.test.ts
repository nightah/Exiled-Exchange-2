// itemTextToSections.test.ts
import { __testExports } from "@/parser/Parser";
import { beforeEach, describe, expect, test } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import {
  ArmourHighValueRareItem,
  HighDamageRareItem,
  MagicItem,
  NormalItem,
  RareItem,
  RareWithImplicit,
  UniqueItem,
} from "./items";
import { loadForLang } from "@/assets/data";
import { ParsedItem } from "@/parser";

describe("itemTextToSections", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("empty string should not throw", () => {
    expect(() => __testExports.itemTextToSections("")).not.toThrow();
  });
  test("standard item", () => {
    const sections = __testExports.itemTextToSections(RareItem.rawText);
    expect(sections.length).toBe(RareItem.sectionCount);
  });
  test("magic item", () => {
    const sections = __testExports.itemTextToSections(MagicItem.rawText);
    expect(sections.length).toBe(MagicItem.sectionCount);
  });
  test("normal item", () => {
    const sections = __testExports.itemTextToSections(NormalItem.rawText);
    expect(sections.length).toBe(NormalItem.sectionCount);
  });
  test("unique item", () => {
    const sections = __testExports.itemTextToSections(UniqueItem.rawText);
    expect(sections.length).toBe(UniqueItem.sectionCount);
  });
  test("rare item with implicit", () => {
    const sections = __testExports.itemTextToSections(RareWithImplicit.rawText);
    expect(sections.length).toBe(RareWithImplicit.sectionCount);
  });
  test("high damage rare item", () => {
    const sections = __testExports.itemTextToSections(
      HighDamageRareItem.rawText,
    );
    expect(sections.length).toBe(HighDamageRareItem.sectionCount);
  });
});

describe("parseWeapon", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("Magic Weapon", () => {
    const sections = __testExports.itemTextToSections(MagicItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.weaponPHYSICAL).toBe(MagicItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(MagicItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(MagicItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(MagicItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(MagicItem.weaponReload);
  });
  test("Rare Weapon", () => {
    const sections = __testExports.itemTextToSections(RareItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.weaponPHYSICAL).toBe(RareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(RareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(RareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(RareItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(RareItem.weaponReload);
  });
  test("High Damage Rare Weapon", () => {
    const sections = __testExports.itemTextToSections(
      HighDamageRareItem.rawText,
    );
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseWeapon(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.weaponPHYSICAL).toBe(HighDamageRareItem.weaponPHYSICAL);
    expect(parsedItem.weaponELEMENTAL).toBe(HighDamageRareItem.weaponELEMENTAL);
    expect(parsedItem.weaponAS).toBe(HighDamageRareItem.weaponAS);
    expect(parsedItem.weaponCRIT).toBe(HighDamageRareItem.weaponCRIT);
    expect(parsedItem.weaponReload).toBe(HighDamageRareItem.weaponReload);
  });
});

describe("parseArmour", () => {
  beforeEach(async () => {
    setupTests();
    await loadForLang("en");
  });
  test("Normal Armour", () => {
    const sections = __testExports.itemTextToSections(NormalItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.armourAR).toBe(NormalItem.armourAR);
    expect(parsedItem.armourEV).toBe(NormalItem.armourEV);
    expect(parsedItem.armourES).toBe(NormalItem.armourES);
  });
  test("Unique Armour", () => {
    const sections = __testExports.itemTextToSections(UniqueItem.rawText);
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.armourAR).toBe(UniqueItem.armourAR);
    expect(parsedItem.armourEV).toBe(UniqueItem.armourEV);
    expect(parsedItem.armourES).toBe(UniqueItem.armourES);
  });
  test("High Armour Rare", () => {
    const sections = __testExports.itemTextToSections(
      ArmourHighValueRareItem.rawText,
    );
    const parsedItem = {} as ParsedItem;

    const res = __testExports.parseArmour(sections[1], parsedItem);

    expect(res).toBe("SECTION_PARSED");
    expect(parsedItem.armourAR).toBe(ArmourHighValueRareItem.armourAR);
    expect(parsedItem.armourEV).toBe(ArmourHighValueRareItem.armourEV);
    expect(parsedItem.armourES).toBe(ArmourHighValueRareItem.armourES);
  });
});
