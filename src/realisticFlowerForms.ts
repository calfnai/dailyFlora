import * as THREE from 'three';
import {
  createRealisticFlower as createBaseRealisticFlower,
  realisticFlowerDefinitions as baseRealisticFlowerDefinitions,
  type RealisticFlowerDefinition
} from './realisticFlowerFormsBase';
import {
  createResearchedBabysBreath,
  createResearchedHydrangea,
  createResearchedLaceFlower
} from './researchedClusterFlowers';
import {
  createResearchedFoxtailLily,
  createResearchedHyacinth,
  createResearchedLiatris
} from './researchedSpikeFlowersA';
import type { BuildOptions } from './researchedFlowerShared';
import {
  createResearchedDelphinium,
  createResearchedSnapdragon
} from './researchedSpikeFlowersB';

export type { RealisticFlowerDefinition };

function wrapResearchedModel(model: THREE.Group, scale: number) {
  const wrapper = new THREE.Group();
  model.scale.setScalar(scale);
  wrapper.add(model);
  return wrapper;
}

const definitionUpdates: Partial<Record<RealisticFlowerDefinition['id'], Partial<RealisticFlowerDefinition>>> = {
  hydrangea: {
    en: 'Mophead Hydrangea · Hydrangea macrophylla',
    description: '不规则半球花序；四片放大的装饰萼片与藏在内部的五裂小型可育花并存。',
    printStructure: '主茎经内部多级支架分配到花簇，装饰花与可育花都由短梗实体连接。'
  },
  'babys-breath': {
    en: "Baby's Breath · Gypsophila paniculata",
    description: '多级圆锥状分枝承托五瓣微花，并混入不同大小和开放阶段的花苞。',
    printStructure: '主枝、一级枝、二级枝和末端花梗连续连接；细枝保留可打印厚度。'
  },
  liatris: {
    en: 'Blazing Star · Liatris spicata',
    description: '无舌状花；贴轴头状花由细管状盘花组成，外伸花柱形成绒穗，并表现由上向下开放。',
    printStructure: '头状花紧贴主轴，管状花和外伸花柱直接进入花头芯体。'
  },
  'lace-flower': {
    cn: '蕾丝花（大阿米芹）',
    en: 'Lace Flower · Ammi majus',
    description: '明确的复伞形花序：主伞梗汇成扁平微拱花面，每个末端再分出八朵五瓣小花。',
    printStructure: '中心花梗、主伞梗、二级小梗和花心形成完整两级连接。'
  },
  hyacinth: {
    en: 'Common Hyacinth · Hyacinthus orientalis',
    description: '短而密的圆柱总状花序；下部筒状钟形花开放并六裂反卷，上部保留花苞。',
    printStructure: '每朵花由短梗接入粗主轴，花筒、喉部和六枚裂片连续相交。'
  },
  'foxtail-lily': {
    en: 'Foxtail Lily · Eremurus',
    description: '细长总状花序分为下部残花、中部六被片星形开放花和顶部花苞；雄蕊明显外伸。',
    printStructure: '花梗从下到上逐渐缩短；花被、雄蕊和花心共同连接花梗末端。'
  },
  snapdragon: {
    en: 'Snapdragon · Antirrhinum majus',
    description: '左右对称的融合花冠形成上下两唇，膨大的下唇封住花喉；下部开放、顶部花苞。',
    printStructure: '筒状花冠承担结构核心，五枚唇裂和花喉垫体都与花筒实体连接。'
  },
  delphinium: {
    en: 'Delphinium · Delphinium spp.',
    description: '五枚花瓣状萼片围绕四枚内瓣；上方萼片向后延伸成单一花距，顶部保留花苞。',
    printStructure: '花距、外萼片、内瓣与中心芯体组成单花，再经短花梗连接总状花轴。'
  }
};

export const morphologyResearchedIds = new Set<RealisticFlowerDefinition['id']>([
  'hydrangea',
  'babys-breath',
  'liatris',
  'lace-flower',
  'hyacinth',
  'foxtail-lily',
  'snapdragon',
  'delphinium'
]);

export const realisticFlowerDefinitions: RealisticFlowerDefinition[] = baseRealisticFlowerDefinitions.map((definition) => ({
  ...definition,
  ...(definitionUpdates[definition.id] || {})
}));

export function createRealisticFlower(definition: RealisticFlowerDefinition, seed: string) {
  const options: BuildOptions = { seed, palette: definition.palette };
  switch (definition.id) {
    case 'hydrangea':
      return wrapResearchedModel(createResearchedHydrangea(options), 1.14);
    case 'babys-breath':
      return wrapResearchedModel(createResearchedBabysBreath(options), 1.14);
    case 'liatris':
      return wrapResearchedModel(createResearchedLiatris(options), 1.16);
    case 'lace-flower':
      return wrapResearchedModel(createResearchedLaceFlower(options), 1.12);
    case 'hyacinth':
      return wrapResearchedModel(createResearchedHyacinth(options), 1.16);
    case 'foxtail-lily':
      return wrapResearchedModel(createResearchedFoxtailLily(options), 1.14);
    case 'snapdragon':
      return wrapResearchedModel(createResearchedSnapdragon(options), 1.16);
    case 'delphinium':
      return wrapResearchedModel(createResearchedDelphinium(options), 1.16);
    default:
      return createBaseRealisticFlower(definition, seed);
  }
}
