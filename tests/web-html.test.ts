import { escapeHtml } from "../src/web/html";

describe("web HTML helpers", () => {
  it("escapes event text before string-based rendering", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)"> & ok`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; ok",
    );
  });
});
