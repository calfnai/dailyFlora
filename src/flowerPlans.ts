import type { BouquetTheme, FlowerPlan, FlowerPlanItem } from './types';
import { createRng } from './random';

const normalizeShares = (items: FlowerPlanItem[]) => {
  const total = items.reduce((sum, item) => sum + item.share, 0) || 1;
  return items.map((item) => ({ ...item, share: item.share / total }));
};

const plans: FlowerPlan[] = [
  {
    id: 'summer-pinwheel-detail',
    cnName: '夏日风车细节束',
    enName: 'Summer Pinwheel Detail',
    reference: 'dailyflora-reference-gallery: 夏日风车 / 多色花束',
    silhouette: '外圈有轻微上扬枝条，中层多色小花，中心不能被单朵大花压住。',
    avoid: '避免只剩一团彩色点，避免中心大花过霸道。',
    items: normalizeShares([
      { typeId: 'orchid', cn: '蝴蝶兰形', en: 'orchid form', role: 'main', share: 0.16, scale: 1.04, placement: 'outer', note: '做出风车式外张花瓣。' },
      { typeId: 'chamomile', cn: '洋甘菊形', en: 'chamomile form', role: 'filler', share: 0.22, scale: 0.88, placement: 'mixed', note: '明亮小花点，负责轻快节奏。' },
      { typeId: 'rose', cn: '玫瑰层叠形', en: 'rose layered form', role: 'secondary', share: 0.18, scale: 1.0, placement: 'center', note: '少量层叠主花，不能抢占全局。' },
      { typeId: 'snapdragon', cn: '金鱼草穗形', en: 'snapdragon spike', role: 'line', share: 0.16, scale: 1.08, placement: 'high', note: '提供上扬线条。' },
      { typeId: 'hydrangea', cn: '绣球簇形', en: 'hydrangea cluster', role: 'cluster', share: 0.16, scale: 0.94, placement: 'low', note: '补中低层体积。' },
      { typeId: 'bellFruit', cn: '风铃果形', en: 'bell fruit form', role: 'fruit', share: 0.12, scale: 0.86, placement: 'spray', note: '小果子跳点，避免全是花瓣。' }
    ])
  },
  {
    id: 'fairy-violet-air',
    cnName: '梦幻紫空气束',
    enName: 'Fairy Violet Air',
    reference: 'dailyflora-reference-gallery: 是仙女的梦幻紫',
    silhouette: '蓝紫统一但要轻，边缘有细枝和小花雾气。',
    avoid: '避免紫色变成闷块，避免花型全部一样。',
    items: normalizeShares([
      { typeId: 'hyacinth', cn: '风信子穗形', en: 'hyacinth spike', role: 'line', share: 0.2, scale: 1.0, placement: 'high', note: '蓝紫主线条。' },
      { typeId: 'liatris', cn: '蛇鞭菊线形', en: 'liatris wand', role: 'line', share: 0.18, scale: 1.12, placement: 'spray', note: '细长外逸线。' },
      { typeId: 'orchid', cn: '蝴蝶兰形', en: 'orchid form', role: 'main', share: 0.16, scale: 0.98, placement: 'outer', note: '不对称花瓣让局部可看。' },
      { typeId: 'chamomile', cn: '小雏菊形', en: 'small daisy form', role: 'filler', share: 0.18, scale: 0.78, placement: 'mixed', note: '浅色小点打散紫色。' },
      { typeId: 'camelliaPeony', cn: '山茶牡丹形', en: 'camellia peony form', role: 'secondary', share: 0.14, scale: 0.92, placement: 'center', note: '少量柔软层叠花。' },
      { typeId: 'hydrangea', cn: '绣球雾团形', en: 'hydrangea mist cluster', role: 'cluster', share: 0.14, scale: 0.82, placement: 'low', note: '低层轻体积。' }
    ])
  },
  {
    id: 'foxtail-lily-vertical',
    cnName: '狐尾百合竖线束',
    enName: 'Foxtail Lily Vertical',
    reference: 'dailyflora-reference-gallery: 狐尾百合',
    silhouette: '强竖向穗线，底部有小花和叶材支撑，不能变成僵硬柱子。',
    avoid: '避免所有花都在中心，避免竖线太死。',
    items: normalizeShares([
      { typeId: 'liatris', cn: '蛇鞭菊线形', en: 'liatris wand', role: 'line', share: 0.26, scale: 1.24, placement: 'high', note: '最高的竖向线条。' },
      { typeId: 'hyacinth', cn: '风信子穗形', en: 'hyacinth spike', role: 'line', share: 0.2, scale: 1.08, placement: 'high', note: '密一点的花穗。' },
      { typeId: 'snapdragon', cn: '金鱼草穗形', en: 'snapdragon spike', role: 'secondary', share: 0.16, scale: 1.02, placement: 'outer', note: '侧向穗线。' },
      { typeId: 'chamomile', cn: '洋甘菊形', en: 'chamomile form', role: 'filler', share: 0.16, scale: 0.78, placement: 'mixed', note: '局部小花散点。' },
      { typeId: 'bellFruit', cn: '风铃果形', en: 'bell fruit form', role: 'fruit', share: 0.1, scale: 0.82, placement: 'spray', note: '增加细节停顿。' },
      { typeId: 'hydrangea', cn: '绣球簇形', en: 'hydrangea cluster', role: 'cluster', share: 0.12, scale: 0.86, placement: 'low', note: '底部托住体积。' }
    ])
  },
  {
    id: 'berry-grove',
    cnName: '浆果森林束',
    enName: 'Berry Grove',
    reference: 'dailyflora-reference-gallery: 浆果森林 / 蓝莓形状参考',
    silhouette: '小果、小花、枝叶混在一起，像森林里冒出的童话感。',
    avoid: '避免成熟礼盒感，避免大主花过多。',
    items: normalizeShares([
      { typeId: 'bellFruit', cn: '风铃果/浆果形', en: 'berry bell fruit form', role: 'fruit', share: 0.28, scale: 0.88, placement: 'mixed', note: '核心是小果粒和童话感。' },
      { typeId: 'hydrangea', cn: '绣球小簇形', en: 'hydrangea mini cluster', role: 'cluster', share: 0.22, scale: 0.84, placement: 'low', note: '提供小簇团。' },
      { typeId: 'chamomile', cn: '小雏菊形', en: 'small daisy form', role: 'filler', share: 0.18, scale: 0.76, placement: 'mixed', note: '细小亮点。' },
      { typeId: 'liatris', cn: '细线花材', en: 'fine wand flower', role: 'line', share: 0.12, scale: 0.96, placement: 'spray', note: '从边缘伸出去。' },
      { typeId: 'orchid', cn: '小蝴蝶兰形', en: 'small orchid form', role: 'secondary', share: 0.1, scale: 0.86, placement: 'outer', note: '偶发异形花瓣。' },
      { typeId: 'pompon', cn: '乒乓菊球形', en: 'pompon mum form', role: 'cluster', share: 0.1, scale: 0.82, placement: 'center', note: '少量圆形花头。' }
    ])
  },
  {
    id: 'autumn-juice',
    cnName: '秋日果汁束',
    enName: 'Autumn Juice Bouquet',
    reference: 'dailyflora-reference-gallery: 秋日果汁 / 浪漫具象化',
    silhouette: '暖橙黄、饱满但不沉，中心有层叠主花，外围有小花和果感。',
    avoid: '避免冷灰，避免变成一坨橙色。',
    items: normalizeShares([
      { typeId: 'rose', cn: '玫瑰形', en: 'rose form', role: 'main', share: 0.22, scale: 1.08, placement: 'center', note: '暖色主花。' },
      { typeId: 'camelliaPeony', cn: '山茶牡丹形', en: 'camellia peony form', role: 'secondary', share: 0.18, scale: 1.0, placement: 'center', note: '柔软层叠。' },
      { typeId: 'chamomile', cn: '洋甘菊形', en: 'chamomile form', role: 'filler', share: 0.18, scale: 0.82, placement: 'mixed', note: '明亮小花。' },
      { typeId: 'bellFruit', cn: '风铃果形', en: 'bell fruit form', role: 'fruit', share: 0.16, scale: 0.9, placement: 'outer', note: '果汁感跳点。' },
      { typeId: 'snapdragon', cn: '金鱼草形', en: 'snapdragon form', role: 'line', share: 0.14, scale: 0.98, placement: 'high', note: '拉开高度。' },
      { typeId: 'hydrangea', cn: '绣球簇形', en: 'hydrangea cluster', role: 'cluster', share: 0.12, scale: 0.92, placement: 'low', note: '托住底部。' }
    ])
  },
  {
    id: 'breathing-landscape',
    cnName: '会呼吸的风景束',
    enName: 'Breathing Landscape Bouquet',
    reference: 'dailyflora-reference-gallery: 会呼吸的风景 / 洋水仙',
    silhouette: '主体留空、有前后层次，白黄花材和长叶枝条形成风景感。',
    avoid: '避免只做空，空必须由远近层次支撑。',
    items: normalizeShares([
      { typeId: 'orchid', cn: '洋水仙/蝴蝶兰开口形', en: 'open narcissus-orchid form', role: 'main', share: 0.2, scale: 1.06, placement: 'outer', note: '开口花型形成季节感。' },
      { typeId: 'chamomile', cn: '洋甘菊形', en: 'chamomile form', role: 'filler', share: 0.2, scale: 0.78, placement: 'mixed', note: '浅色散点。' },
      { typeId: 'liatris', cn: '细线花材', en: 'fine wand flower', role: 'line', share: 0.18, scale: 1.02, placement: 'spray', note: '画出呼吸边缘。' },
      { typeId: 'hyacinth', cn: '风信子穗形', en: 'hyacinth spike', role: 'secondary', share: 0.14, scale: 0.92, placement: 'high', note: '柔和纵向。' },
      { typeId: 'bellFruit', cn: '风铃果形', en: 'bell fruit form', role: 'fruit', share: 0.14, scale: 0.82, placement: 'spray', note: '局部停顿。' },
      { typeId: 'hydrangea', cn: '小绣球簇', en: 'small hydrangea cluster', role: 'cluster', share: 0.14, scale: 0.82, placement: 'low', note: '低层小体积。' }
    ])
  }
];

const themePlanIds: Record<string, string[]> = {
  'summer-pinwheel': ['summer-pinwheel-detail', 'autumn-juice'],
  'dopamine-field': ['summer-pinwheel-detail', 'berry-grove'],
  'fairy-violet': ['fairy-violet-air', 'breathing-landscape'],
  'sea-salt-lemon': ['breathing-landscape', 'summer-pinwheel-detail'],
  'hillside-wild': ['foxtail-lily-vertical', 'berry-grove'],
  'tropical-forest': ['berry-grove', 'foxtail-lily-vertical'],
  'moon-white': ['breathing-landscape', 'fairy-violet-air'],
  'starry-night': ['fairy-violet-air', 'berry-grove']
};

export function createFlowerPlan(seed: string, theme: BouquetTheme) {
  const rng = createRng(`flower-plan:${seed}:${theme.id}`);
  const candidates = themePlanIds[theme.id] ?? plans.map((plan) => plan.id);
  const selectedId = candidates[Math.floor(rng.value() * candidates.length)] ?? candidates[0];
  return plans.find((plan) => plan.id === selectedId) ?? plans[0];
}

export function getFlowerPlanById(id: string) {
  return plans.find((plan) => plan.id === id) ?? null;
}

export const flowerPlanCatalog = plans;
