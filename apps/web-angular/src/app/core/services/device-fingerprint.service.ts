import { Injectable } from '@angular/core';

export interface DeviceFingerprintData {
  deviceId: string;
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
  screenResolution?: string;
  viewport?: string;
  pixelRatio?: number;
  timezone?: string;
  language?: string;
  languages?: string[];
  hardwareConcurrency?: number;
  deviceMemory?: number;
  touchSupport?: boolean;
  cookiesEnabled?: boolean;
  localStorage?: boolean;
  sessionStorage?: boolean;
  webglVendor?: string;
  webglRenderer?: string;
  canvasFingerprint?: string;
  audioFingerprint?: string;
  fontsHash?: string;
  pluginsHash?: string;
  batterySupported?: boolean;
  batteryLevel?: number;
  charging?: boolean;
  connectionDownlink?: number;
  effectiveNetworkType?: string;
  userAgent?: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceFingerprintService {
  private readonly STORAGE_KEY = 'quantora_device_id';
  private storedDeviceId: string | null = null;

  async collect(): Promise<DeviceFingerprintData> {
    this.storedDeviceId = this.getCurrentDeviceId();

    return {
      deviceId: this.storedDeviceId,
      deviceName: this.getDeviceName(),
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      browserVersion: this.getBrowserVersion(),
      engine: this.getEngine(),
      engineVersion: this.getEngineVersion(),
      os: this.getOS(),
      osVersion: this.getOSVersion(),
      platform: navigator.platform,
      cpuArchitecture: this.getCPUArch(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      hardwareConcurrency: navigator.hardwareConcurrency || undefined,
      deviceMemory: (navigator as any).deviceMemory || undefined,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      webglVendor: this.getWebGLVendor(),
      webglRenderer: this.getWebGLRenderer(),
      canvasFingerprint: this.getCanvasFingerprint(),
      audioFingerprint: await this.getAudioFingerprint(),
      fontsHash: this.getFontsHash(),
      pluginsHash: this.getPluginsHash(),
      batterySupported: 'getBattery' in navigator,
      batteryLevel: undefined,
      charging: undefined,
      connectionDownlink: (navigator as any).connection?.downlink || undefined,
      effectiveNetworkType: (navigator as any).connection?.effectiveType || undefined,
      userAgent: navigator.userAgent,
    };
  }

  getCurrentDeviceId(): string {
    if (!this.storedDeviceId) {
      this.storedDeviceId = localStorage.getItem(this.STORAGE_KEY);
      if (!this.storedDeviceId) {
        this.storedDeviceId = this.generateDeviceId();
        localStorage.setItem(this.STORAGE_KEY, this.storedDeviceId);
      }
    }
    return this.storedDeviceId;
  }

  clearDeviceId(): void {
    this.storedDeviceId = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private generateDeviceId(): string {
    // Simple random UUID without external dependency
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/') || ua.includes('Edge/')) return 'Edge';
    if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Safari/')) return 'Safari';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const ua = navigator.userAgent;
    const matches = ua.match(/(?:Chrome|Firefox|Safari|Edg|OPR)\/([\d.]+)/);
    return matches?.[1] || '';
  }

  private getEngine(): string {
    const ua = navigator.userAgent;
    if (ua.includes('AppleWebKit/') && !ua.includes('Chrome/')) return 'WebKit';
    if (ua.includes('Gecko/') && ua.includes('Firefox/')) return 'Gecko';
    if (ua.includes('Chrome/') || ua.includes('Edg/')) return 'Blink';
    return 'Unknown';
  }

  private getEngineVersion(): string {
    const ua = navigator.userAgent;
    const m = ua.match(/(?:AppleWebKit|Gecko|Chrome)\/([\d.]+)/);
    return m?.[1] || '';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT')) return 'Windows';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  }

  private getOSVersion(): string {
    const ua = navigator.userAgent;
    const m = ua.match(/(?:Windows NT |Mac OS X |Android )([\d_.]+)/);
    if (m) return m[1].replace(/_/g, '.');
    return '';
  }

  private getDeviceName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Macintosh') || ua.includes('MacBook')) return 'Mac';
    if (ua.includes('Windows')) return 'PC';
    if (ua.includes('Android')) {
      const m = ua.match(/; ([\w\s]+) Build/);
      return m ? m[1] : 'Android Device';
    }
    return 'Unknown Device';
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) return 'tablet';
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private getCPUArch(): string {
    const ua = navigator.userAgent;
    if (ua.includes('x86_64') || ua.includes('Win64') || ua.includes('WOW64')) return 'x64';
    if (ua.includes('x86') || ua.includes('i686')) return 'x86';
    if (ua.includes('arm64') || ua.includes('aarch64')) return 'arm64';
    if (ua.includes('armv')) return 'arm';
    return 'unknown';
  }

  private getWebGLVendor(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) return gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || '';
      }
    } catch {
      /* WebGL not available */
    }
    return '';
  }

  private getWebGLRenderer(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
      }
    } catch {
      /* WebGL not available */
    }
    return '';
  }

  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(100, 1, 50, 50);
      ctx.fillStyle = '#069';
      ctx.font = '16px Arial';
      ctx.fillText('Quantora', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = '18px Arial';
      ctx.fillText('🔒', 4, 45);
      return canvas.toDataURL();
    } catch {
      return '';
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      const ctx = new OfflineAudioContext(1, 44100, 44100);
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 440;
      const gain = ctx.createGain();
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      const buffer = await ctx.startRendering();
      const samples = Array.from(buffer.getChannelData(0).slice(0, 1000));
      return samples.reduce((h, v) => h + Math.abs(v), 0).toFixed(4);
    } catch {
      return '';
    }
  }

  private getFontsHash(): string {
    // Simple font detection by measuring element widths
    const testString = 'mmMwWLliI0O&1';
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Courier New',
      'Verdana',
      'Georgia',
      'Palatino',
      'Impact',
      'Trebuchet MS',
      'Comic Sans MS',
    ];
    try {
      const el = document.createElement('span');
      el.textContent = testString;
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      const widths = testFonts.map((font) => {
        el.style.fontFamily = `"${font}", ${baseFonts[0]}`;
        return el.offsetWidth;
      });
      document.body.removeChild(el);
      return widths.join('|');
    } catch {
      return '';
    }
  }

  private getPluginsHash(): string {
    try {
      const plugins = Array.from(navigator.plugins || [])
        .map((p) => `${p.name}:${p.filename}`)
        .sort()
        .join('|');
      return plugins || '';
    } catch {
      return '';
    }
  }
}
