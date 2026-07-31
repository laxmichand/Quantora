export interface BuildVersion {
  version: string;
  gitSha: string;
  gitRef: string;
  buildTime: string;
}

export const buildVersion: BuildVersion = {
  version: '0.0.1',
  gitSha: 'a97c0282fa20f070155d2ffeed10f93a0eb7b14b',
  gitRef: 'main',
  buildTime: '2026-07-31T05:30:01.025Z',
};
