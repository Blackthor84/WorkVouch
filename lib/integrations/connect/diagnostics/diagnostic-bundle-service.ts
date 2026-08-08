import type { DiagnosticBundleRuntime } from "./bundle-runtime";
import { BundleBuilder } from "./bundle-builder";
import { BundleValidator } from "./bundle-validator";
import { BundleExporter } from "./bundle-exporter";
import type {
  BundleBuildOptions,
  BundleExportResult,
  BundlePreview,
  BundleValidationResult,
  DiagnosticBundle,
} from "./bundle-types";

/** Developer and support API for Connect diagnostic bundles. */
export class DiagnosticBundleService {
  private readonly builder: BundleBuilder;
  private readonly validator = new BundleValidator();
  private readonly exporter = new BundleExporter();

  constructor(runtime: DiagnosticBundleRuntime) {
    this.builder = new BundleBuilder(runtime);
  }

  async generateDiagnosticBundle(options: BundleBuildOptions): Promise<DiagnosticBundle> {
    const bundle = await this.builder.build(options);
    const validation = this.validator.validate(bundle);
    if (!validation.valid) {
      throw new Error(`Bundle validation failed: ${validation.errors.join("; ")}`);
    }
    return bundle;
  }

  async downloadDiagnosticBundle(
    options: BundleBuildOptions & { format?: "json" | "zip" | "markdown" }
  ): Promise<BundleExportResult> {
    const bundle = await this.generateDiagnosticBundle(options);
    const format = options.format ?? "zip";

    switch (format) {
      case "json":
        return this.exporter.exportJson(bundle);
      case "markdown":
        return this.exporter.exportMarkdown(bundle);
      case "zip":
      default:
        return this.exporter.exportZip(bundle);
    }
  }

  validateDiagnosticBundle(bundle: DiagnosticBundle): BundleValidationResult {
    return this.validator.validate(bundle);
  }

  async previewDiagnosticBundle(options: BundleBuildOptions): Promise<BundlePreview> {
    const bundle = await this.builder.build(options);
    const jsonExport = this.exporter.exportJson(bundle);

    return {
      manifest: bundle.manifest,
      healthStatus: String((bundle.health as { overallStatus?: string }).overallStatus ?? "unknown"),
      topErrors: bundle.errorSummary.items.slice(0, 5).map((e) => e.message),
      suggestedNextSteps: extractSteps(bundle.readme),
      estimatedSizeBytes: jsonExport.sizeBytes,
    };
  }
}

function extractSteps(readme: string): string[] {
  const match = readme.match(/## Suggested Next Steps\n([\s\S]*?)(?:\n##|$)/);
  if (!match) return [];
  return match[1]
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}
