import { describe, expect, it } from "vitest";
import {
  findNormalizedTextIndex,
  OUT_OF_SCOPE_STATUS,
  parsePortalCategoryHtml,
  portalItemIdentity,
  reconcileStatus,
  type PortalCategory,
} from "./nfe-portal";

const category: PortalCategory = {
  slug: "notas-tecnicas",
  contentId: "test",
  stopMarker: "Documentos nao vigentes",
};

function link(id: string, title: string): string {
  return `<a href="./exibirArquivo.aspx?conteudo=${id}"><span class="tituloConteudo">${title}</span></a>`;
}

describe("findNormalizedTextIndex", () => {
  it("finds a marker regardless of accents and case", () => {
    const html = "<h2>DOCUMENTOS NÃO VIGENTES</h2>";
    expect(findNormalizedTextIndex(html, "Documentos nao vigentes")).toBe(html.indexOf("DOCUMENTOS"));
  });
});

describe("parsePortalCategoryHtml", () => {
  it("separates current items from items after the validity marker", () => {
    const currentLink = link("current=", "Nota Técnica 2026.001 v1.00");
    const expiredLink = link("expired=", "Nota Técnica 2020.001 v1.00");
    const html = `${currentLink}<h2>Documentos não vigentes</h2>${expiredLink}`;

    const snapshot = parsePortalCategoryHtml(category, html);

    expect(snapshot.current.map((item) => item.title)).toEqual(["Nota Técnica 2026.001 v1.00"]);
    expect(snapshot.outOfScope.map((item) => item.title)).toEqual(["Nota Técnica 2020.001 v1.00"]);
  });

  it("keeps a duplicated URL current when it also appears after the marker", () => {
    const currentLink = link("same=", "Nota Técnica 2026.001 v1.00");
    const expiredLink = link("same=", "Nota Técnica 2026.001 v1.00");
    const html = `${currentLink}<h2>Documentos não vigentes</h2>${expiredLink}`;

    const snapshot = parsePortalCategoryHtml(category, html);

    expect(snapshot.current).toHaveLength(1);
    expect(snapshot.outOfScope).toHaveLength(0);
  });

  it("treats every item as current when the marker is absent", () => {
    const html = `${link("one=", "Documento 1")}${link("two=", "Documento 2")}`;

    const snapshot = parsePortalCategoryHtml(category, html);

    expect(snapshot.current).toHaveLength(2);
    expect(snapshot.outOfScope).toHaveLength(0);
  });
});

describe("reconcileStatus", () => {
  it("does not report ignored entries as missing", () => {
    expect(reconcileStatus(OUT_OF_SCOPE_STATUS, false)).toBe(OUT_OF_SCOPE_STATUS);
    expect(reconcileStatus("ARCHIVED", false)).toBe("ARCHIVED");
    expect(reconcileStatus("OK", false)).toBe("MISSING");
  });
});

describe("portalItemIdentity", () => {
  it("matches the same document even when its URL and title change", () => {
    const first = {
      category: "notas-tecnicas",
      title: "Título antigo",
      url: "https://example.com/old",
      published: "01-01-2026",
      version: "1.00",
      docKey: "nota-tecnica:2026.001",
    };
    const moved = {
      ...first,
      title: "Título novo",
      url: "https://example.com/new",
    };

    expect(portalItemIdentity(first)).toBe(portalItemIdentity(moved));
  });
});
