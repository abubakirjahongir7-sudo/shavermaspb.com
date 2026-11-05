import { describe, it, expect } from "vitest";
import { findPublishedLegalDoc, publishedLegalDocs, type LegalDoc } from "./legal";

const docs: LegalDoc[] = [
  { slug: "oferta", title: "Оферта", body: "Текст" },
  { slug: "refund", title: "Возврат", body: "   \n " },
];

describe("legal documents", () => {
  it("publishes only documents with text", () => {
    expect(publishedLegalDocs(docs).map((d) => d.slug)).toEqual(["oferta"]);
  });

  it("does not find a document that has no text yet", () => {
    expect(findPublishedLegalDoc("oferta", docs)?.title).toBe("Оферта");
    expect(findPublishedLegalDoc("refund", docs)).toBeUndefined();
    expect(findPublishedLegalDoc("unknown", docs)).toBeUndefined();
  });
});
