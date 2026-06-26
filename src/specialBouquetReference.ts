import type { SpecialBouquetReference } from './types';

export const herJanuarySkyReference: SpecialBouquetReference = {
  id: 'ngc2787',
  title: 'her-january-sky',
  versionLabel: 'v1',
  routePath: 'special0629',
  flowerPlanId: 'her-january-sky-memory',
  date: '2026-06-29',
  seed: 'daily-flora:special:ngc2787:2026-06-29',
  hubbleImagePath: 'special/ngc-2787.jpg',
  audioPath: 'special/ladyfingers-lofi.mp3',
  theme: {
    id: 'her-january-sky',
    name: 'her january sky',
    palette: [
      '#fff8df',
      '#f8ecce',
      '#f3c9d8',
      '#e8d8f4',
      '#b9d7f4',
      '#ffe061',
      '#f57947',
      '#c93658'
    ],
    leafPalette: ['#738a3d', '#8ea850', '#b8c47b', '#dee6bd'],
    stem: '#7d8f45',
    background: '#050408',
    floor: '#171218',
    glow: '#fff1be',
    densityBias: 1.18,
    verticalBias: 1.24,
    wildness: 1.18,
    branchBias: 1.32,
    leafBias: 0.92,
    flowerBias: 1.2,
    outerLineBias: 1.48
  },
  visualAnalysis: {
    mainColors: [
      'warm ivory white petals',
      'soft blush pink round blooms',
      'pale lilac petals',
      'clear green stems and leaves',
      'translucent grey-white wrapping'
    ],
    accentColors: [
      'small bright yellow daisy centers and blooms',
      'powder blue flowers',
      'orange and coral flame-lily petals',
      'deep rose red accents',
      'pale pink ribbon'
    ],
    flowerShapes: [
      'open cosmos-like discs with yellow centers',
      'rounded peony or rose-like soft clusters',
      'cup-shaped white tulip/calla forms',
      'small baby-breath bead sprays',
      'long curled flame-lily petals'
    ],
    silhouette:
      'Tall asymmetric hand bouquet: dense lower-right core, airy upper sprays, and long left-reaching stems.',
    wrapping:
      'Clear crinkled cellophane over cool translucent grey-white paper, folded into loose triangular panels with a pale pink tie.',
    emotionalTone:
      'Fresh, tender, spontaneous, and full, with a handmade remembered quality rather than formal symmetry.',
    particleTranslation:
      'Use a dense ivory-pink central bloom cloud, sparse bead-like white sprays, yellow/blue/lilac accents, tall curved tendrils, visible stems, and translucent folded wrap geometry.'
  },
  shape: {
    radius: 1.06,
    height: 1.46,
    verticalLift: 0.28,
    asymmetry: 0.34,
    airySprayBias: 1.34,
    centralFullness: 1.2,
    stemVisibility: 1.28
  },
  bloomScale: {
    small: 0.56,
    medium: 0.92,
    large: 1.46,
    largeBias: 0.18
  },
  wrapping: {
    color: '#dfe3df',
    edgeColor: '#fff4f9',
    ribbonColor: '#f4bfd2',
    opacity: 0.13
  },
  cosmic: {
    starColors: ['#fff8dc', '#d9e6ff', '#f7d7be', '#b6c8ff'],
    dustColors: ['#fff1bc', '#d8c0ff', '#b89a78', '#f8d7e3'],
    galaxyTint: '#e9ddc8',
    warmCore: '#fff0b4'
  }
};

export const herJanuarySkyReferenceV2: SpecialBouquetReference = {
  ...herJanuarySkyReference,
  id: 'ngc2787v2',
  title: 'her-january-sky-v2',
  versionLabel: 'v2',
  routePath: 'special0629-v2',
  flowerPlanId: 'her-january-sky-memory-v2',
  seed: 'daily-flora:special:ngc2787:v2:2026-06-29',
  theme: {
    ...herJanuarySkyReference.theme,
    id: 'her-january-sky-v2',
    name: 'her january sky v2',
    palette: [
      '#fff9e8',
      '#f7e6cc',
      '#f4c5d4',
      '#f6f1f6',
      '#cad9ef',
      '#d7c6ef',
      '#f47b4e',
      '#c74a64'
    ],
    leafPalette: ['#6d823c', '#91a663', '#c4cca0', '#e4ebd2'],
    stem: '#78904a',
    densityBias: 1.08,
    verticalBias: 1.32,
    wildness: 1.24,
    branchBias: 1.42,
    leafBias: 1.08,
    flowerBias: 1.06,
    outerLineBias: 1.58
  },
  visualAnalysis: {
    ...herJanuarySkyReference.visualAnalysis,
    flowerShapes: [
      'soft folded cup blooms instead of repeated daisy discs',
      'ruffled blush-ivory round flowers with uneven petal layers',
      'curled calla-like ivory bracts',
      'thin green air stems and small pearl sprays',
      'a few coral flame-lily strokes at the outer edge'
    ],
    silhouette:
      'A lower, fuller hand bouquet with open air pockets: soft ivory-pink core, taller green lines, and a few coral side gestures.',
    particleTranslation:
      'Reduce flat disk flowers; build the memory from cup blooms, ruffled layered petals, curled bracts, pearl sprays, visible stems, and translucent folded wrapping.'
  },
  shape: {
    radius: 1.02,
    height: 1.52,
    verticalLift: 0.32,
    asymmetry: 0.38,
    airySprayBias: 1.42,
    centralFullness: 1.08,
    stemVisibility: 1.38
  },
  bloomScale: {
    small: 0.5,
    medium: 0.86,
    large: 1.32,
    largeBias: 0.12
  },
  wrapping: {
    color: '#e1e5df',
    edgeColor: '#fff7f8',
    ribbonColor: '#efb6ca',
    opacity: 0.12
  }
};

export const herJanuarySkyReferenceV3: SpecialBouquetReference = {
  ...herJanuarySkyReference,
  id: 'ngc2787v3',
  title: 'her-january-sky-v3',
  versionLabel: 'v3',
  routePath: 'special0629-v3',
  flowerPlanId: 'her-january-sky-memory-v3',
  seed: 'daily-flora:special:ngc2787:v3:spring-memory:2026-06-29',
  theme: {
    ...herJanuarySkyReference.theme,
    id: 'her-january-sky-v3',
    name: 'her january sky v3',
    palette: [
      '#fff8dd',
      '#ffe06a',
      '#f6b7cb',
      '#eecfe8',
      '#b9d8f5',
      '#f67c4c',
      '#c94d63',
      '#f9eee8',
      '#d9f0b8'
    ],
    leafPalette: ['#6f8f38', '#8fb458', '#bed27f', '#e0ebb9'],
    stem: '#7f9949',
    background: '#050408',
    floor: '#161119',
    glow: '#fff0b0',
    densityBias: 1.16,
    verticalBias: 1.22,
    wildness: 1.16,
    branchBias: 1.22,
    leafBias: 0.88,
    flowerBias: 1.2,
    outerLineBias: 1.34
  },
  visualAnalysis: {
    ...herJanuarySkyReference.visualAnalysis,
    flowerShapes: [
      'bright spring cup blooms with ivory and pale yellow light',
      'soft blush ruffled flowers for the full remembered core',
      'lilac-blue butterfly petals and airy mini clusters',
      'small coral flame-lily strokes for asymmetry',
      'only a few tiny yellow sparks, not repeated daisy discs'
    ],
    silhouette:
      'A cheerful spring hand bouquet: full lower core, colorful middle layer, airy upper sprays, and a visible galaxy glow behind it.',
    emotionalTone:
      'Fresh, colorful, tender, and quietly cosmic, closer to a spring memory than a dark memorial object.',
    particleTranslation:
      'Keep spring color variety from the photos, reduce chrysanthemum-like disks, and make NGC 2787 a visible translucent celestial plate behind the flowers.'
  },
  shape: {
    radius: 1.07,
    height: 1.42,
    verticalLift: 0.26,
    asymmetry: 0.32,
    airySprayBias: 1.22,
    centralFullness: 1.18,
    stemVisibility: 1.18
  },
  bloomScale: {
    small: 0.52,
    medium: 0.9,
    large: 1.38,
    largeBias: 0.15
  },
  wrapping: {
    color: '#dfe5dc',
    edgeColor: '#fff6fa',
    ribbonColor: '#efb8cc',
    opacity: 0.13
  },
  cosmic: {
    starColors: ['#fff8dc', '#dbe8ff', '#ffd7b8', '#c9d1ff'],
    dustColors: ['#fff0a8', '#f3c6d8', '#d5c2ff', '#b7d5ff'],
    galaxyTint: '#ffffff',
    warmCore: '#ffe58a',
    galaxyOpacity: 0.9,
    galaxyScale: 1.28,
    galaxyPosition: [-1.42, 1.16, -8.95],
    galaxyRotation: -0.08,
    galaxyAlphaMap: true,
    galaxyDepthTest: false,
    coreOpacity: 0.48,
    coreRadius: 0.9
  }
};
