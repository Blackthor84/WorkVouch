/**
 * Text extraction from PDF and DOCX.
 * If extraction fails: log error, fail in both sandbox and production. No fallback mock.
 */

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string }> {
  const ext = mimeType === "application/pdf" ? "pdf" : "docx";
  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      const text = result?.text ?? "";
      await parser.destroy?.();
      if (!text || text.trim().length < 20) {
        throw new Error("PDF text extraction returned insufficient text");
      }
      return { text };
    } catch (e) {
      console.error("[resume-extract] PDF error:", e);
      throw e;
    }
  }
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value ?? "";
  if (!text || text.trim().length < 20) {
    throw new Error("DOCX text extraction returned insufficient text");
  }
  return { text };
}
