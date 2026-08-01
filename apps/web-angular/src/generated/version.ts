export interface BuildVersion {
  version: string;
  gitSha: string;
  gitRef: string;
  buildTime: string;
}

export const buildVersion: BuildVersion = {
  version: '0.0.1',
  gitSha: '182974ca693dc4eb61e89592697d0b528a3f4ea5',
  gitRef: 'main',
  buildTime: '2026-08-01T01:02:52.836Z',
};
