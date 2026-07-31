export interface BuildVersion {
  version: string;
  gitSha: string;
  gitRef: string;
  buildTime: string;
}

export const buildVersion: BuildVersion = {
  version: '0.0.1',
  gitSha: '8d1586868b5d2660d83d4ea99022f2cba76394d8',
  gitRef: 'main',
  buildTime: '2026-07-31T07:08:36.205Z',
};
