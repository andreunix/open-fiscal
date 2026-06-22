import { describe, expect, it } from "vitest";
import { parseSharedStrings, parseSheet, rowsToTsv } from "./xlsx";

const sharedXml = `<sst><si><t>tBand</t></si><si><t>Operadora</t></si><si><t xml:space="preserve">CalCard </t></si><si><r><t>A&amp;</t></r><r><t>B</t></r></si></sst>`;

describe("parseSharedStrings", () => {
  it("resolves entries, preserves spacing and joins rich-text runs", () => {
    expect(parseSharedStrings(sharedXml)).toEqual(["tBand", "Operadora", "CalCard ", "A&B"]);
  });
});

describe("parseSheet", () => {
  const shared = parseSharedStrings(sharedXml);

  it("places cells by column letter and resolves shared/number values", () => {
    const xml = `<sheetData>
      <row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
      <row><c r="A2" t="s"><v>3</v></c><c r="B2"><v>43831</v></c></row>
    </sheetData>`;
    expect(parseSheet(xml, shared)).toEqual([
      ["tBand", "Operadora"],
      ["A&B", "43831"],
    ]);
  });

  it("fills internal gaps and trims trailing empty columns", () => {
    const xml = `<sheetData>
      <row><c r="A1" t="s"><v>0</v></c><c r="C1"><v>9</v></c><c r="F1"/></row>
      <row><c r="A2"><v>1</v></c></row>
    </sheetData>`;
    expect(parseSheet(xml, shared)).toEqual([
      ["tBand", "", "9"],
      ["1", "", ""],
    ]);
  });
});

describe("rowsToTsv", () => {
  it("joins rows with tabs and neutralizes embedded tabs/newlines", () => {
    expect(rowsToTsv([["a", "b\tc"], ["d\ne", "f"]])).toBe("a\tb c\nd e\tf\n");
  });
});
