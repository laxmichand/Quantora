import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface DeviceFingerprint {
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;

  browser?: string;
  browserVersion?: string;
  engine?: string;
  engineVersion?: string;

  os?: string;
  osVersion?: string;
  platform?: string;
  cpuArchitecture?: string;

  hostname?: string;
  manufacturer?: string;
  model?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;

  screenResolution?: string;
  viewport?: string;
  pixelRatio?: number;

  timezone?: string;
  language?: string;
  languages?: string[];

  webglVendor?: string;
  webglRenderer?: string;
  canvasFingerprint?: string;
  audioFingerprint?: string;
  fontsHash?: string;
  pluginsHash?: string;

  touchSupport?: boolean;
  cookiesEnabled?: boolean;
  localStorage?: boolean;
  sessionStorage?: boolean;
  batterySupported?: boolean;
  batteryLevel?: number;
  charging?: boolean;
  connectionDownlink?: number;
  effectiveNetworkType?: string;

  userAgent?: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  acceptHeader?: string;
  referer?: string;
  origin?: string;
}

@Injectable()
export class FingerprintService {
  /**
   * Generate a deterministic fingerprint hash from collected data.
   * Uses SHA-256 of stable, sorted fingerprint components.
   */
  hash(data: Partial<DeviceFingerprint>): string {
    const stable = {
      wg:
        data.webglVendor && data.webglRenderer ? `${data.webglVendor}:${data.webglRenderer}` : null,
      cf: data.canvasFingerprint || null,
      af: data.audioFingerprint || null,
      fh: data.fontsHash || null,
      ph: data.pluginsHash || null,
      sc: data.screenResolution || null,
      px: data.pixelRatio || null,
      br: data.browser && data.browserVersion ? `${data.browser}:${data.browserVersion}` : null,
      os: data.os && data.osVersion ? `${data.os}:${data.osVersion}` : null,
      eng: data.engine && data.engineVersion ? `${data.engine}:${data.engineVersion}` : null,
      hw: data.hardwareConcurrency ? String(data.hardwareConcurrency) : null,
      mem: data.deviceMemory ? String(data.deviceMemory) : null,
      tz: data.timezone || null,
      lang: data.language || null,
      pl: data.platform || null,
      cpu: data.cpuArchitecture || null,
      ts: data.touchSupport !== undefined ? String(data.touchSupport) : null,
    };

    const serialized = Object.entries(stable)
      .filter(([, v]) => v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('|');

    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Compare two fingerprints and return a match quality score (0-1).
   * 1.0 = exact match, 0.0 = completely different
   */
  matchQuality(stored: string, incoming: string): number {
    if (!stored || !incoming) return 0;
    if (stored === incoming) return 1.0;

    // Partial match: core components match but some differ
    return 0.3; // Same device but different fingerprint (browser update, etc.)
  }

  /**
   * Check if core identifiers (browser, OS, screen) match the stored device.
   */
  isCoreMatch(stored: Partial<DeviceFingerprint>, incoming: Partial<DeviceFingerprint>): boolean {
    const storedBrowser = stored.browser?.toLowerCase();
    const incomingBrowser = incoming.browser?.toLowerCase();
    if (storedBrowser && incomingBrowser && storedBrowser !== incomingBrowser) return false;

    const storedOs = stored.os?.toLowerCase();
    const incomingOs = incoming.os?.toLowerCase();
    if (storedOs && incomingOs && storedOs !== incomingOs) return false;

    return true;
  }
}
