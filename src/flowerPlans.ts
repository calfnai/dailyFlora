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
    silhouette: '穗线从花丛中穿插上来，少量高线条拉开高度，底部有小花和叶材支撑。',
    avoid: '避免穗状花在顶部成片，避免所有穗线同向直立成僵硬柱子。',
    items: normalizeShares([
      { typeId: 'liatris', cn: '蛇鞭菊线形', en: 'liatris wand', role: 'line', share: 0.18, scale: 1.16, placement: 'mixed', note: '从花丛中穿插上来，不集中堆在顶部。' },
      { typeId: 'hyacinth', cn: '风信子穗形', en: 'hyacinth spike', role: 'line', share: 0.12, scale: 0.98, placement: 'outer', note: '少量密一点的花穗，嵌在外圈层次里。' },
      { typeId: 'snapdragon', cn: '金鱼草穗形', en: 'snapdragon spike', role: 'secondary', share: 0.12, scale: 0.94, placement: 'mixed', note: '侧向和中层穗线，不能形成顶部穗花墙。' },
      { typeId: 'chamomile', cn: '洋甘菊形', en: 'chamomile form', role: 'filler', share: 0.22, scale: 0.78, placement: 'mixed', note: '局部小花散点，打散穗线。' },
      { typeId: 'bellFruit', cn: '风铃果形', en: 'bell fruit form', role: 'fruit', share: 0.12, scale: 0.82, placement: 'spray', note: '增加细节停顿。' },
      { typeId: 'hydrangea', cn: '绣球簇形', en: 'hydrangea cluster', role: 'cluster', share: 0.24, scale: 0.86, placement: 'low', note: '底部托住体积，防止山岗小花顶上成片。' }
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
    id: 'dewberry-morning-air',
    cnName: '晨露莓园空气束',
    enName: 'Dewberry Morning Air',
    reference: 'original-dailyflora: 根据用户已确认的山岗小花 composition 语法凭空生成',
    silhouette: '中低层是白黄小花和蓝紫小簇，莓红果点穿插，少量杯形花停顿，嫩绿穗线从花丛中向外打开。',
    avoid: '避免变成山岗小花换皮，避免穗状花在顶部成片，避免全是高饱和花而没有绿色和空气缓冲。',
    items: normalizeShares([
      { typeId: 'chamomile', cn: '奶白小面花', en: 'ivory small open faces', role: 'filler', share: 0.18, scale: 0.86, placement: 'mixed', note: '形成清晨感小花矩阵，不做大菊花脸。' },
      { typeId: 'chamomile', cn: '柠檬黄小雏菊', en: 'lemon daisy sparks', role: 'filler', share: 0.12, scale: 0.72, placement: 'mixed', note: '少量明亮黄色跳点，不能铺成黄墙。' },
      { typeId: 'hydrangea', cn: '蓝紫雾状小簇', en: 'blue lilac mist clusters', role: 'cluster', share: 0.16, scale: 0.78, placement: 'mixed', note: '像湿润空气里的冷色小簇，支撑前后层次。' },
      { typeId: 'bellFruit', cn: '莓红露珠果材', en: 'dewberry fruit dots', role: 'fruit', share: 0.16, scale: 0.82, placement: 'mixed', note: '果点必须有枝条归属，做晨露和莓园记忆点。' },
      { typeId: 'orchid', cn: '象牙杯形花', en: 'ivory cup blooms', role: 'main', share: 0.12, scale: 0.94, placement: 'outer', note: '少量杯形停顿，让画面有可看的局部而不是全碎花。' },
      { typeId: 'camelliaPeony', cn: '粉莓褶皱小团花', en: 'raspberry ruffled small blooms', role: 'secondary', share: 0.12, scale: 0.9, placement: 'low', note: '低位柔软体积，只托住花束，不抢成大主花。' },
      { typeId: 'liatris', cn: '嫩绿外开穗线', en: 'fresh green open spike lines', role: 'line', share: 0.1, scale: 1.02, placement: 'mixed', note: '穿插在花丛中并向外打开，不能顶部成片。' },
      { typeId: 'orchid', cn: '珊瑚星形线花', en: 'coral star line petals', role: 'line', share: 0.04, scale: 0.98, placement: 'spray', note: '极少量珊瑚色外伸，让原创主题有自己的记忆点。' }
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
  },
  {
    id: 'her-january-sky-memory',
    cnName: '一月星空记忆束',
    enName: 'Her January Sky Memory',
    reference: 'private-special: 2026-06-29 bouquet photos + Hubble NGC 2787',
    silhouette: '下半部饱满柔软，右侧粉白主花密一点；上方和左侧有细长枝条、白色小点和火焰状花瓣伸出。',
    avoid: '避免平均球形，避免只剩星空点阵，避免叶子压过花，避免变成情人节红粉配色。',
    items: normalizeShares([
      { typeId: 'chamomile', cn: '白色宇宙菊/小雏菊形', en: 'white cosmos daisy form', role: 'main', share: 0.22, scale: 1.04, placement: 'mixed', note: '照片里最清楚的白色开面花，带黄心。' },
      { typeId: 'camelliaPeony', cn: '浅粉层叠圆花', en: 'blush layered round bloom', role: 'secondary', share: 0.18, scale: 1.02, placement: 'low', note: '复现粉色柔软体积。' },
      { typeId: 'orchid', cn: '白色杯形郁金香/马蹄莲感', en: 'ivory cup-shaped bloom', role: 'main', share: 0.16, scale: 1.0, placement: 'outer', note: '用杯形花保留照片里的白色杯状轮廓。' },
      { typeId: 'orchid', cn: '橙红火焰百合形', en: 'coral flame-lily form', role: 'line', share: 0.14, scale: 1.12, placement: 'spray', note: '负责左侧外伸、卷曲、火焰感的记忆点。' },
      { typeId: 'hydrangea', cn: '淡蓝淡紫小花簇', en: 'pale blue lilac mini clusters', role: 'cluster', share: 0.14, scale: 0.82, placement: 'mixed', note: '蓝紫小花只做局部冷色闪光。' },
      { typeId: 'liatris', cn: '绿色细线枝条', en: 'fine green line stems', role: 'line', share: 0.1, scale: 1.08, placement: 'high', note: '拉出真实花束的高低和不对称。' },
      { typeId: 'bellFruit', cn: '满天星白色小珠', en: 'baby-breath pearl dots', role: 'filler', share: 0.06, scale: 0.72, placement: 'spray', note: '补充空气感白点，不做照片展示。' }
    ])
  },
  {
    id: 'her-january-sky-memory-v2',
    cnName: '一月星空记忆束 v2',
    enName: 'Her January Sky Memory v2',
    reference: 'private-special: 2026-06-29 bouquet photos translated with fewer daisy/chrysanthemum forms',
    silhouette: '中下部是柔软粉白核心，外圈留出空气和透明枝线；右侧更满，左上有细线和少量橙红卷曲花瓣伸出。',
    avoid: '避免菊花和雏菊占主导，避免圆盘花重复，避免平均球形，避免把星空做成廉价背景。',
    items: normalizeShares([
      { typeId: 'camelliaPeony', cn: '柔粉褶皱圆花', en: 'blush ruffled round bloom', role: 'main', share: 0.24, scale: 1.04, placement: 'low', note: '承担照片里的柔软粉色体积，但不用菊花盘面。' },
      { typeId: 'orchid', cn: '象牙杯形花', en: 'ivory cup bloom', role: 'main', share: 0.2, scale: 1.02, placement: 'outer', note: '复现白色杯形和包裹感。' },
      { typeId: 'orchid', cn: '卷曲马蹄莲感', en: 'curled calla bract', role: 'secondary', share: 0.16, scale: 0.98, placement: 'mixed', note: '增加优雅卷曲轮廓，减少平面花瓣。' },
      { typeId: 'hydrangea', cn: '淡蓝淡紫小簇', en: 'pale blue-lilac airy clusters', role: 'cluster', share: 0.16, scale: 0.76, placement: 'mixed', note: '做冷色空气层和小花雾感。' },
      { typeId: 'liatris', cn: '绿色空气枝线', en: 'green airy stem lines', role: 'line', share: 0.14, scale: 1.12, placement: 'high', note: '让叶材和枝条从花束中合理长出来。' },
      { typeId: 'bellFruit', cn: '满天星白色小珠', en: 'baby-breath pearl air', role: 'filler', share: 0.06, scale: 0.68, placement: 'spray', note: '只做细碎空气点，不变成主花。' },
      { typeId: 'orchid', cn: '橙红火焰花线', en: 'coral flame-lily strokes', role: 'line', share: 0.04, scale: 1.1, placement: 'spray', note: '保留照片里的橙红记忆点，数量很少。' }
    ])
  },
  {
    id: 'her-january-sky-memory-v3',
    cnName: '一月星空春意束 v3',
    enName: 'Her January Sky Spring Memory v3',
    reference: 'private-special: 2026-06-29 bouquet photos, spring color restored, NGC 2787 visible',
    silhouette: '下半部粉白金色更饱满，中层有蓝紫和珊瑚色跳点，上方保留细枝空气，但不让枝线压过花。',
    avoid: '避免大量菊花盘面；避免为了少菊花而变灰、变稀、变不春天；避免 NGC 2787 只剩不可见暗影。',
    items: normalizeShares([
      { typeId: 'camelliaPeony', cn: '粉白褶皱主花', en: 'blush ivory ruffled bloom', role: 'main', share: 0.22, scale: 1.04, placement: 'low', note: '保留柔软饱满核心，替代菊花式圆盘。' },
      { typeId: 'rose', cn: '淡金层叠花', en: 'pale gold layered bloom', role: 'secondary', share: 0.14, scale: 0.96, placement: 'center', note: '增加春天的暖黄色明度，不做雏菊脸。' },
      { typeId: 'orchid', cn: '象牙杯形花', en: 'ivory cup bloom', role: 'main', share: 0.16, scale: 1.0, placement: 'outer', note: '回应照片中的白色杯形轮廓。' },
      { typeId: 'orchid', cn: '蓝紫蝴蝶花瓣', en: 'blue lilac butterfly petals', role: 'secondary', share: 0.12, scale: 0.88, placement: 'mixed', note: '恢复缤纷冷色层，避免画面只剩粉白绿。' },
      { typeId: 'hydrangea', cn: '春雾小花簇', en: 'spring mist mini clusters', role: 'cluster', share: 0.14, scale: 0.78, placement: 'mixed', note: '小簇像空气里的碎花，不是主花盘。' },
      { typeId: 'orchid', cn: '珊瑚火焰花线', en: 'coral flame-lily strokes', role: 'line', share: 0.08, scale: 1.08, placement: 'spray', note: '少量橙红外伸，让花束鲜活。' },
      { typeId: 'liatris', cn: '嫩绿空气枝', en: 'fresh green airy stems', role: 'line', share: 0.08, scale: 1.0, placement: 'high', note: '控制枝线比例，只支撑空间感。' },
      { typeId: 'bellFruit', cn: '满天星光点', en: 'baby-breath light pearls', role: 'filler', share: 0.06, scale: 0.66, placement: 'spray', note: '细碎白点，和星尘呼应。' }
    ])
  },
  {
    id: 'her-real-bouquet-memory-v4',
    cnName: '真实春日花束 v4',
    enName: 'Real Spring Bouquet Memory v4',
    reference: 'private-special: ref-01/ref-02/ref-03 real bouquet photos, especially ref-02 front view',
    silhouette: '透明包装托住右下方手捧核心，粉白主体很满；左侧有红黄嘉兰长线外伸，上方满天星和绿枝轻散，整体是右下到左上的非对称扇形。',
    avoid: '避免把白色波斯菊做成密瓣菊花团；避免削弱黄色、蓝色、粉色和红黄嘉兰；避免花束变稀或变成抽象星点。',
    items: normalizeShares([
      { typeId: 'chamomile', cn: '白色波斯菊开面花', en: 'white cosmos open faces', role: 'main', share: 0.24, scale: 1.08, placement: 'mixed', note: '照片里最醒目的白色薄瓣黄心花，要少瓣、开面、分散。' },
      { typeId: 'chamomile', cn: '黄色春日小雏菊', en: 'yellow spring daisy accents', role: 'filler', share: 0.1, scale: 0.9, placement: 'mixed', note: '黄色跳点很多，但尺寸要小，不能主导成菊花墙。' },
      { typeId: 'orchid', cn: '红黄嘉兰火焰线', en: 'red yellow gloriosa flame lines', role: 'line', share: 0.1, scale: 1.08, placement: 'spray', note: '真实花束最有辨识度的外伸卷曲形态。' },
      { typeId: 'camelliaPeony', cn: '浅粉柔软团块', en: 'soft blush rounded clusters', role: 'secondary', share: 0.2, scale: 1.04, placement: 'low', note: '复现粉色玫瑰/绣球/康乃馨感的饱满底层。' },
      { typeId: 'orchid', cn: '白色杯形花', en: 'ivory cup blooms', role: 'main', share: 0.12, scale: 0.96, placement: 'outer', note: '右侧和上层可见的白色杯形轮廓。' },
      { typeId: 'orchid', cn: '淡紫星形花瓣', en: 'pale lilac star petals', role: 'secondary', share: 0.1, scale: 0.86, placement: 'mixed', note: '补照片里的淡紫星形花，增加层次。' },
      { typeId: 'hydrangea', cn: '蓝色小穗花簇', en: 'blue airy mini clusters', role: 'cluster', share: 0.12, scale: 0.84, placement: 'mixed', note: '蓝色小花是照片的重要冷色点。' },
      { typeId: 'bellFruit', cn: '满天星白珠', en: 'baby-breath white pearls', role: 'filler', share: 0.1, scale: 0.68, placement: 'spray', note: '白色小珠沿外圈和上方散开。' },
      { typeId: 'liatris', cn: '嫩绿枝叶和花苞', en: 'fresh green stems and buds', role: 'line', share: 0.02, scale: 0.92, placement: 'high', note: '真实枝叶可见，但不压过花面。' }
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
  'starry-night': ['fairy-violet-air', 'berry-grove'],
  'dewberry-morning': ['dewberry-morning-air']
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
