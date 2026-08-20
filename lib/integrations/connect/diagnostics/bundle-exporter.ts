import { createHash } from "crypto";
import type { DiagnosticBundle, BundleExportResult } from "./bundle-types";
import { DIAGNOSTIC_BUNDLE_VERSION } from "./bundle-types";
import { nowIso } from "../../utils/correlation";

/** Exports diagnostic bundles as JSON, ZIP, or Markdown. */
export class BundleExporter {
  exportJson(bundle: DiagnosticBundle): BundleExportResult {
    const data = JSON.stringify(bundle, null, 2);
    const filename = this.filename(bundle, "json");
    return {
      format: "json",
      filename,
      contentType: "application/json",
      data,
      sizeBytes: Buffer.byteLength(data, "utf8"),
      generatedAt: nowIso(),
    };
  }

  exportMarkdown(bundle: DiagnosticBundle): BundleExportResult {
    const data = bundle.readme;
    const filename = this.filename(bundle, "md");
    return {
      format: "markdown",
      filename,
      contentType: "text/markdown",
      data,
      sizeBytes: Buffer.byteLength(data, "utf8"),
      generatedAt: nowIso(),
    };
  }

  exportZip(bundle: DiagnosticBundle): BundleExportResult {
    const baseFiles: Record<string, string> = {
      "README.md": bundle.readme,
      "manifest.json": JSON.stringify(bundle.manifest, null, 2),
      "bundle.json": JSON.stringify(
        {
          connection: bundle.connection,
          health: bundle.health,
          syncCursor: bundle.syncCursor,
          syncHistory: bundle.syncHistory,
          recentEvents: bundle.recentEvents,
          auditTrail: bundle.auditTrail,
          replayReferences: bundle.replayReferences,
          projectionState: bundle.projectionState,
          platform: bundle.platform,
          providerManifest: bundle.providerManifest,
          connectionConfiguration: bundle.connectionConfiguration,
          featureFlags: bundle.featureFlags,
          environmentValidation: bundle.environmentValidation,
          performanceMetrics: bundle.performanceMetrics,
          errorSummary: bundle.errorSummary,
          warningSummary: bundle.warningSummary,
          logs: bundle.logs,
          redactions: bundle.redactions,
        },
        null,
        2
      ),
      "health.json": JSON.stringify(bundle.health, null, 2),
      "events.json": JSON.stringify(bundle.recentEvents, null, 2),
      "sync.json": JSON.stringify({ cursor: bundle.syncCursor, history: bundle.syncHistory }, null, 2),
      "replay.json": JSON.stringify(bundle.replayReferences, null, 2),
      "errors.json": JSON.stringify(bundle.errorSummary, null, 2),
    };

    const files: Record<string, string> = {
      ...baseFiles,
      "checksums.json": JSON.stringify(
        {
          bundleVersion: DIAGNOSTIC_BUNDLE_VERSION,
          files: Object.fromEntries(
            Object.entries(baseFiles).map(([name, content]) => [name, sha256(content)])
          ),
          manifest: bundle.manifest.checksums,
        },
        null,
        2
      ),
    };

    const zipBuffer = createStoreZip(files);
    const filename = this.filename(bundle, "zip");

    return {
      format: "zip",
      filename,
      contentType: "application/zip",
      data: zipBuffer,
      sizeBytes: zipBuffer.length,
      generatedAt: nowIso(),
    };
  }

  private filename(bundle: DiagnosticBundle, ext: string): string {
    const ts = bundle.manifest.generatedAt.replace(/[:.]/g, "-").slice(0, 19);
    return `workvouch-connect-${bundle.manifest.provider}-${ts}.${ext}`;
  }
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Minimal ZIP (store method, no compression) — no external dependencies. */
function createStoreZip(files: Record<string, string>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBuf = Buffer.from(name, "utf8");
    const dataBuf = Buffer.from(content, "utf8");
    const crc = crc32(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(crc, 10);
    localHeader.writeUInt32LE(dataBuf.length, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt16LE(nameBuf.length, 22);
    localHeader.writeUInt16LE(0, 24);

    localParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt32LE(0, 36);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);

  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(Object.keys(files).length, 8);
  endRecord.writeUInt16LE(Object.keys(files).length, 10);
  endRecord.writeUInt32LE(centralDir.length, 12);
  endRecord.writeUInt32LE(localData.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localData, centralDir, endRecord]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
