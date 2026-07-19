import { createRng, todayKey } from './random';
import { themes } from './themes';
import { createFlowerPlan } from './flowerPlans';
import type { DailyBouquetSpec } from './types';

const defaultThemeId = 'random';

const dailyCorrections: Record<string, {
  themeId?: string;
  flowerPlanId?: string;
  flowerDensity?: number;
  sparkleDensity?: number;
  branchDensity?: number;
  leafDensity?: number;
  compositionTuning?: DailyBouquetSpec['compositionTuning'];
}> = {
  '2026-07-07': {
    flowerDensity: 0.72,
    sparkleDensity: 1.28,
    branchDensity: 1.14,
    leafDensity: 1.18,
    compositionTuning: {
      radialSpread: 1.13,
      centerSpread: 1.22,
      roleShare: { main: 0.68, secondary: 0.7, cluster: 0.62, filler: 1.28, fruit: 1.2, line: 1.16 },
      roleScale: { main: 0.86, secondary: 0.84, cluster: 0.76 }
    }
  },
  '2026-07-13': {
    themeId: 'tropical-forest',
    flowerPlanId: 'daily-concrete-forest-variety',
    flowerDensity: 1.08,
    branchDensity: 1.12,
    leafDensity: 1.08,
    sparkleDensity: 1.08,
    compositionTuning: {
      radialSpread: 1.08,
      centerSpread: 1.16,
      roleShare: { main: 1.02, secondary: 1.12, cluster: 0.72, filler: 1.08, fruit: 0.92, line: 1.06 },
      roleScale: { main: 0.92, secondary: 0.9, cluster: 0.74, fruit: 0.86 }
    }
  },
  '2026-07-16': {
    flowerDensity: 0.92,
    branchDensity: 1.08,
    leafDensity: 1.12,
    sparkleDensity: 3,
    compositionTuning: {
      radialSpread: 0.92,
      centerSpread: 1.08,
      spikeScale: 0.58,
      spikeAnchorLift: -0.34,
      roleShare: { line: 0.42, filler: 1.24, fruit: 1.68, cluster: 0.96, main: 1.06, secondary: 1.02 },
      roleScale: { line: 0.66, fruit: 0.72, filler: 0.94 }
    }
  },
  '2026-07-11': {
    flowerDensity: 0.9,
    branchDensity: 1.08,
    compositionTuning: {
      radialSpread: 1.06,
      spikeScale: 0.78,
      spikeAnchorLift: -0.2,
      roleShare: { line: 0.76, filler: 1.14, main: 1.08, secondary: 1.06, cluster: 1.08 }
    }
  }
};

const dailyNameOverrides: Record<string, { cn: string; en: string }> = {
  '2026-07-07': { cn: '星点果汁风车', en: 'Star-speckled Juice Pinwheel' },
  '2026-07-11': { cn: '紫雾游枝', en: 'Violet Wand Drift' },
  '2026-07-13': { cn: '百花莓园游枝', en: 'Many-flower Berry Branch Drift' }
};

const nameMoods = [
  { cn: '晨露', en: 'Morning Dew' },
  { cn: '晴风', en: 'Clear Breeze' },
  { cn: '雨隙', en: 'After Rain' },
  { cn: '星点', en: 'Starlit' },
  { cn: '花影', en: 'Flower Shadow' },
  { cn: '云光', en: 'Cloudlight' },
  { cn: '晚晴', en: 'Evening Clear' },
  { cn: '露野', en: 'Dew Field' }
] as const;

const monthNameMarks = [
  { cn: '雪芽', en: 'Snow-budded' },
  { cn: '早樱', en: 'Early-cherry' },
  { cn: '春溪', en: 'Spring-stream' },
  { cn: '新叶', en: 'New-leaf' },
  { cn: '青梅', en: 'Green-plum' },
  { cn: '夏萤', en: 'Summer-firefly' },
  { cn: '雨林', en: 'Rainforest' },
  { cn: '晚荷', en: 'Late-lotus' },
  { cn: '桂影', en: 'Osmanthus-shadow' },
  { cn: '霜果', en: 'Frost-fruit' },
  { cn: '雾枝', en: 'Mist-branch' },
  { cn: '冬光', en: 'Winter-light' }
] as const;

const dayNameMarks = [
  { cn: '一露', en: 'first-dew' },
  { cn: '二苔', en: 'second-moss' },
  { cn: '三瓣', en: 'third-petal' },
  { cn: '四枝', en: 'fourth-branch' },
  { cn: '五果', en: 'fifth-fruit' },
  { cn: '六风', en: 'sixth-breeze' },
  { cn: '七星', en: 'seventh-star' },
  { cn: '八叶', en: 'eighth-leaf' },
  { cn: '九铃', en: 'ninth-bell' },
  { cn: '十芽', en: 'tenth-bud' },
  { cn: '十一云', en: 'eleventh-cloud' },
  { cn: '十二溪', en: 'twelfth-stream' },
  { cn: '十三藤', en: 'thirteenth-vine' },
  { cn: '十四晴', en: 'fourteenth-clear' },
  { cn: '十五莓', en: 'fifteenth-berry' },
  { cn: '十六月', en: 'sixteenth-moon' },
  { cn: '十七光', en: 'seventeenth-light' },
  { cn: '十八雨', en: 'eighteenth-rain' },
  { cn: '十九野', en: 'nineteenth-field' },
  { cn: '二十羽', en: 'twentieth-feather' },
  { cn: '廿一花', en: 'twenty-first-flower' },
  { cn: '廿二泉', en: 'twenty-second-spring' },
  { cn: '廿三雾', en: 'twenty-third-mist' },
  { cn: '廿四籽', en: 'twenty-fourth-seed' },
  { cn: '廿五影', en: 'twenty-fifth-shadow' },
  { cn: '廿六蓝', en: 'twenty-sixth-blue' },
  { cn: '廿七橙', en: 'twenty-seventh-orange' },
  { cn: '廿八白', en: 'twenty-eighth-white' },
  { cn: '廿九绿', en: 'twenty-ninth-green' },
  { cn: '三十金', en: 'thirtieth-gold' },
  { cn: '卅一虹', en: 'thirty-first-rainbow' }
] as const;

function dateStamp(dateLabel: string) {
  const match = dateLabel.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { cn: dateLabel, en: dateLabel };
  const month = Number(match[2]);
  const day = Number(match[3]);
  const englishMonth = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Shanghai' })
    .format(new Date(Date.UTC(Number(match[1]), month - 1, day)));
  return { cn: `${month}月${day}日`, en: `${englishMonth} ${day}` };
}

function dailyNameMark(dateLabel: string) {
  const match = dateLabel.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { cn: '日签', en: 'date-marked' };
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthMark = monthNameMarks[(month - 1) % monthNameMarks.length] ?? monthNameMarks[0];
  const dayMark = dayNameMarks[(day - 1) % dayNameMarks.length] ?? dayNameMarks[0];
  return { cn: `${monthMark.cn}${dayMark.cn}`, en: `${monthMark.en} ${dayMark.en}` };
}

export function bouquetDisplayName(spec: DailyBouquetSpec) {
  if (spec.special) return { cn: spec.special.title, en: spec.flowerPlan.enName };

  const stamp = dateStamp(spec.dateLabel);
  const override = spec.seed === spec.dateLabel ? dailyNameOverrides[spec.seed] : undefined;
  const rng = createRng(`daily-flora-name:${spec.seed}:${spec.theme.id}:${spec.flowerPlan.id}`);
  const mood = nameMoods[Math.floor(rng.value() * nameMoods.length)] ?? nameMoods[0];
  const mark = dailyNameMark(spec.dateLabel);
  const planName = spec.flowerPlan.cnName.replace(/束$/, '');
  const name = override ?? { cn: `${mood.cn}${mark.cn}${planName}`, en: `${mood.en} ${mark.en} ${spec.flowerPlan.enName}` };
  return { cn: `${stamp.cn} · ${name.cn}`, en: `${stamp.en} · ${name.en}` };
}

export function readParams() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date') || todayKey();
  const seed = params.get('seed') || date;
  const density = params.get('density') || params.get('quality') || 'medium';
  const render = params.get('render') || 'auto';
  const theme = params.get('theme') || defaultThemeId;
  return { date, seed, density, render, theme };
}

export function createDailySpec(dateLabel: string, seed: string, themeId = defaultThemeId): DailyBouquetSpec {
  const rng = createRng(`daily-flora:${seed}`);
  const correction = themeId === defaultThemeId && seed === dateLabel ? dailyCorrections[seed] : undefined;
  const resolvedThemeId = correction?.themeId ?? themeId;
  const theme =
    resolvedThemeId === 'random'
      ? themes[Math.floor(rng.value() * themes.length)]
      : themes.find((item) => item.id === resolvedThemeId) || themes.find((item) => item.id === defaultThemeId) || themes[0];
  const flowerPlan = createFlowerPlan(seed, theme, correction?.flowerPlanId);

  return {
    seed,
    dateLabel,
    theme,
    branchDensity: rng.range(0.85, 1.25) * theme.densityBias * (theme.branchBias ?? 1) * (correction?.branchDensity ?? 1),
    sparkleDensity: rng.range(0.75, 1.4) * (correction?.sparkleDensity ?? 1),
    flowerDensity: rng.range(0.8, 1.35) * theme.densityBias * (theme.flowerBias ?? 1) * (correction?.flowerDensity ?? 1),
    leafDensity: rng.range(0.75, 1.25) * (theme.leafBias ?? 1) * (correction?.leafDensity ?? 1),
    rotationSpeed: rng.range(0.045, 0.085),
    asymmetry: rng.range(0.08, 0.26),
    haloLift: rng.range(0.05, 0.36) * theme.verticalBias,
    flowerPlan,
    compositionTuning: correction?.compositionTuning
  };
}
