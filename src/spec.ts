import { createRng, todayKey } from './random';
import { themes } from './themes';
import { createFlowerPlan } from './flowerPlans';
import type { DailyBouquetSpec } from './types';

const defaultThemeId = 'random';

const dailyCorrections: Record<string, {
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
  '2026-07-11': { cn: '紫雾游枝', en: 'Violet Wand Drift' }
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

function dateStamp(dateLabel: string) {
  const match = dateLabel.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { cn: dateLabel, en: dateLabel };
  const month = Number(match[2]);
  const day = Number(match[3]);
  const englishMonth = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Shanghai' })
    .format(new Date(Date.UTC(Number(match[1]), month - 1, day)));
  return { cn: `${month}月${day}日`, en: `${englishMonth} ${day}` };
}

export function bouquetDisplayName(spec: DailyBouquetSpec) {
  if (spec.special) return { cn: spec.special.title, en: spec.flowerPlan.enName };

  const stamp = dateStamp(spec.dateLabel);
  const override = spec.seed === spec.dateLabel ? dailyNameOverrides[spec.seed] : undefined;
  const rng = createRng(`daily-flora-name:${spec.seed}:${spec.theme.id}:${spec.flowerPlan.id}`);
  const mood = nameMoods[Math.floor(rng.value() * nameMoods.length)] ?? nameMoods[0];
  const planName = spec.flowerPlan.cnName.replace(/束$/, '');
  const name = override ?? { cn: `${mood.cn}${planName}`, en: `${mood.en} ${spec.flowerPlan.enName}` };
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
  const theme =
    themeId === 'random'
      ? themes[Math.floor(rng.value() * themes.length)]
      : themes.find((item) => item.id === themeId) || themes.find((item) => item.id === defaultThemeId) || themes[0];
  const correction = themeId === defaultThemeId && seed === dateLabel ? dailyCorrections[seed] : undefined;
  const flowerPlan = createFlowerPlan(seed, theme);

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
