/**
 * Application Version Management
 *
 * This module provides centralized version information for the application.
 * Version is read from package.json at build time and exposed via environment variable.
 */

// Version is injected at build time via next.config.js
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

// Build information
export const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

/**
 * Get formatted version string
 * @param prefix - Optional prefix (default: 'v')
 * @returns Formatted version string (e.g., 'v1.0.0')
 */
export function getVersionString(prefix: string = 'v'): string {
  return `${prefix}${APP_VERSION}`;
}

/**
 * Parse version into components
 * @returns Object with major, minor, patch, and prerelease components
 */
export function parseVersion(): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
} {
  const match = APP_VERSION.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);

  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

/**
 * Get version info object for API responses or metadata
 */
export function getVersionInfo() {
  const { major, minor, patch, prerelease } = parseVersion();

  return {
    version: APP_VERSION,
    versionString: getVersionString(),
    major,
    minor,
    patch,
    prerelease,
    buildTime: BUILD_TIME,
  };
}

/**
 * Check if current version is a prerelease
 */
export function isPrerelease(): boolean {
  return parseVersion().prerelease !== undefined;
}

/**
 * Compare current version with another version
 * @param otherVersion - Version to compare against
 * @returns -1 if current < other, 0 if equal, 1 if current > other
 */
export function compareVersion(otherVersion: string): number {
  const current = parseVersion();
  const otherMatch = otherVersion.match(/^(\d+)\.(\d+)\.(\d+)/);

  if (!otherMatch) return 0;

  const other = {
    major: parseInt(otherMatch[1], 10),
    minor: parseInt(otherMatch[2], 10),
    patch: parseInt(otherMatch[3], 10),
  };

  if (current.major !== other.major) {
    return current.major > other.major ? 1 : -1;
  }
  if (current.minor !== other.minor) {
    return current.minor > other.minor ? 1 : -1;
  }
  if (current.patch !== other.patch) {
    return current.patch > other.patch ? 1 : -1;
  }

  return 0;
}
