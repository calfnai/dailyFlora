export type DailyFloraBuildInfo = {
  releaseId: string;
  builtAt: string;
  timezone: string;
  commitSha: string;
  shortSha: string;
  branch: string;
  commitMessage: string;
  dirty: boolean;
  buildSource: 'local' | 'vercel';
  deploymentId: string | null;
  deploymentUrl: string | null;
};

declare const __DAILYFLORA_BUILD_INFO__: DailyFloraBuildInfo;

export const buildInfo = __DAILYFLORA_BUILD_INFO__;
