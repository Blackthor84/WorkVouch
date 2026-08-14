export type ExtractTextResult =
  | { ok: true; text: string; format: string }
  | { ok: false; error: string; code: string };

export async function extractTextFromResumeBuffer(
  buffer: Buffer,
  path: string
): Promise<ExtractTextResult> {
  const lower = path.toLowerCase();

  try {
    if (lower.endsWith(".txt")) {
      const text = buffer.toString("utf-8").trim();
      if (!text) {
        return { ok: false, error: "The file appears to be empty.", code: "EMPTY_FILE" };
      }
      return { ok: true, text, format: "txt" };
    }

    if (lower.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        const text = (result?.text ?? "").trim();
        await parser.destroy?.();
        if (!text) {
          return { ok: false, error: "Could not extract text from this PDF.", code: "CORRUPT_FILE" };
        }
        return { ok: true, text, format: "pdf" };
      } catch {
        return { ok: false, error: "This PDF could not be read. Try another file.", code: "CORRUPT_FILE" };
      }
    }

    if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value ?? "").trim();
      if (!text) {
        return { ok: false, error: "Could not extract text from this document.", code: "CORRUPT_FILE" };
      }
      return { ok: true, text, format: lower.endsWith(".docx") ? "docx" : "doc" };
    }

    return { ok: false, error: "Unsupported file format.", code: "UNSUPPORTED_FORMAT" };
  } catch {
    return { ok: false, error: "Could not read the file.", code: "EXTRACT_FAILED" };
  }
}
