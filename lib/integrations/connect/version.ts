/** WorkVouch Connect platform version — semver. */
export const CONNECT_PLATFORM_VERSION = "1.0.0";

export interface ConnectVersionRange {
  compatibleConnectVersion: string;
  minimumConnectVersion: string;
  maximumTestedConnectVersion: string;
}

export interface ConnectProviderManifestVersion extends ConnectVersionRange {
  provider: string;
  version: string;
  apiVersion: string;
}

export function parseSemver(version: string): [number, number, number] {
  const parts = version.replace(/^v/, "").split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

export function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = parseSemver(a);
  const [bMaj, bMin, bPatch] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}

export function isConnectVersionCompatible(
  platformVersion: string,
  manifest: ConnectVersionRange
): { compatible: boolean; errors: string[] } {
  const errors: string[] = [];

  if (compareSemver(platformVersion, manifest.minimumConnectVersion) < 0) {
    errors.push(
      `Platform ${platformVersion} is below minimum ${manifest.minimumConnectVersion}`
    );
  }

  if (compareSemver(platformVersion, manifest.compatibleConnectVersion) < 0) {
    errors.push(
      `Platform ${platformVersion} is below compatible ${manifest.compatibleConnectVersion}`
    );
  }

  if (compareSemver(platformVersion, manifest.maximumTestedConnectVersion) > 0) {
    errors.push(
      `Platform ${platformVersion} exceeds maximum tested ${manifest.maximumTestedConnectVersion}`
    );
  }

  return { compatible: errors.length === 0, errors };
}

export function validateProviderManifestVersion(
  manifest: ConnectProviderManifestVersion
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!manifest.provider) errors.push("provider is required");
  if (!manifest.version) errors.push("version is required");
  if (!manifest.apiVersion) errors.push("apiVersion is required");
  if (!manifest.compatibleConnectVersion) errors.push("compatibleConnectVersion is required");
  if (!manifest.minimumConnectVersion) errors.push("minimumConnectVersion is required");
  if (!manifest.maximumTestedConnectVersion) errors.push("maximumTestedConnectVersion is required");

  const compat = isConnectVersionCompatible(CONNECT_PLATFORM_VERSION, manifest);
  errors.push(...compat.errors);

  return { valid: errors.length === 0, errors };
}
