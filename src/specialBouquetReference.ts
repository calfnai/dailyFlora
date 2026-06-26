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
