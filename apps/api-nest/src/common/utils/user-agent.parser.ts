export interface UserAgentInfo {
  browser: string;
  os: string;
  deviceName: string;
}

export function parseUserAgent(ua?: string): UserAgentInfo {
  if (!ua) {
    return { browser: 'Unknown', os: 'Unknown', deviceName: 'Unknown Device' };
  }

  const browser = parseBrowser(ua);
  const os = parseOS(ua);
  const deviceName = parseDeviceName(ua, os);

  return { browser, os, deviceName };
}

function parseBrowser(ua: string): string {
  const patterns: [RegExp, string][] = [
    [/(Edg|Edge)\/([\d.]+)/, 'Edge'],
    [/(Chrome)\/([\d.]+)/, 'Chrome'],
    [/(Firefox)\/([\d.]+)/, 'Firefox'],
    [/(Safari)\/([\d.]+)/, 'Safari'],
    [/(OPR|Opera)\/([\d.]+)/, 'Opera'],
    [/MSIE ([\d.]+)/, 'IE'],
    [/(Trident).*rv:([\d.]+)/, 'IE'],
  ];

  for (const [regex, name] of patterns) {
    const match = ua.match(regex);
    if (match && name !== 'Safari' && name !== 'Chrome') {
      return `${name} ${match[2]}`;
    }
  }

  // Differentiate Chrome from Safari (Chrome includes "Safari" in UA)
  const chromeMatch = ua.match(/Chrome\/([\d.]+)/);
  const safariMatch = ua.match(/Safari\/([\d.]+)/);
  if (chromeMatch) return `Chrome ${chromeMatch[1]}`;
  if (safariMatch) return `Safari ${safariMatch[1]}`;

  return 'Unknown Browser';
}

function parseOS(ua: string): string {
  const patterns: ([RegExp, string] | [RegExp, (v: string) => string])[] = [
    [
      /Windows NT ([\d.]+)/,
      (v: string) => {
        const map: Record<string, string> = {
          '11.0': 'Windows 11',
          '10.0': 'Windows 10',
          '6.3': 'Windows 8.1',
          '6.2': 'Windows 8',
          '6.1': 'Windows 7',
        };
        return map[v] || `Windows ${v}`;
      },
    ],
    [
      /Mac OS X ([\d_.]+)/,
      (v: string) => {
        const parts = v.split('_');
        const map: Record<string, string> = {
          '14': 'Sonoma',
          '13': 'Ventura',
          '12': 'Monterey',
          '11': 'Big Sur',
          '10.15': 'Catalina',
          '10.14': 'Mojave',
          '10.13': 'High Sierra',
          '10.12': 'Sierra',
        };
        const key =
          parts.length >= 2 ? `${parseInt(parts[0], 10)}.${parseInt(parts[1], 10)}` : parts[0];
        return map[key] ? `macOS ${map[key]}` : `macOS ${parts.join('.')}`;
      },
    ],
    [/Android ([\d.]+)/, (v: string) => `Android ${v}`],
    [/iPhone OS ([\d_]+)/, (v: string) => `iOS ${v.replace(/_/g, '.')}`],
    [/iPad;.*OS ([\d_]+)/, (v: string) => `iPadOS ${v.replace(/_/g, '.')}`],
    [/Linux (?:x86_64|amd64|i686)/, 'Linux'],
    [/CrOS/, 'ChromeOS'],
    [/Ubuntu/, 'Ubuntu'],
    [/Fedora/, 'Fedora'],
    [/Debian/, 'Debian'],
  ];

  for (const [regex, formatter] of patterns) {
    const match = ua.match(regex);
    if (match) {
      if (typeof formatter === 'function') {
        return formatter(match[1]);
      }
      return formatter;
    }
  }

  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

function parseDeviceName(ua: string, os: string): string {
  const lower = ua.toLowerCase();

  const devicePatterns: [RegExp, string][] = [
    [/iPhone/, 'iPhone'],
    [/iPad/, 'iPad'],
    [/iPod/, 'iPod'],
    [/\bMacintosh\b|\bMacBook\b/, 'MacBook'],
    [/Pixel (\d)/, 'Pixel'],
    [/SM-[A-Z0-9]+/, 'Samsung Galaxy'],
    [/Nexus (\d)/, 'Nexus'],
    [/Surface (Pro|Go|Laptop|Book)/, 'Surface'],
    [/\bWindows\b/, 'PC'],
  ];

  for (const [regex, name] of devicePatterns) {
    const match = ua.match(regex);
    if (match) {
      if (name === 'Pixel') return `${name} ${match[1]}`;
      if (name === 'Surface') return `${name} ${match[1]}`;
      return name;
    }
  }

  if (/android/i.test(lower)) return 'Android Device';
  if (/linux/i.test(lower)) return 'Linux Device';

  return os !== 'Unknown OS' ? os : 'Unknown Device';
}
