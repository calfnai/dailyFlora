import type { BouquetTheme } from './types';

export const themes: BouquetTheme[] = [
  {
    id: 'tropical-forest',
    name: '热带丛林',
    palette: ['#d7f07d', '#b9e86e', '#f47d33', '#f8f1cf', '#8dcdb7'],
    leafPalette: ['#173f2c', '#3f7f4c', '#93b86b', '#c6d983'],
    stem: '#527044',
    background: '#070907',
    floor: '#1e2a1d',
    glow: '#d4ff9c',
    densityBias: 1.05,
    verticalBias: 1.1,
    wildness: 1.2
  },
  {
    id: 'moon-white',
    name: '月光手捧',
    palette: ['#fff9e8', '#e8f4ff', '#d2ecf0', '#b6c8ff', '#f1f7d8'],
    leafPalette: ['#203d36', '#5f806c', '#9ab69c', '#d7dfc0'],
    stem: '#7f8d70',
    background: '#05060a',
    floor: '#20242c',
    glow: '#eaf4ff',
    densityBias: 0.95,
    verticalBias: 0.98,
    wildness: 0.9
  },
  {
    id: 'fairy-violet',
    name: '梦幻紫雾',
    palette: ['#b8b1ff', '#7aaee8', '#f3e9ff', '#d495e8', '#fff7d6'],
    leafPalette: ['#1f3245', '#485e6b', '#6f8d74', '#a9c796'],
    stem: '#586d62',
    background: '#070711',
    floor: '#201d2e',
    glow: '#d7c9ff',
    densityBias: 1.0,
    verticalBias: 1.05,
    wildness: 1.15
  },
  {
    id: 'sea-salt-lemon',
    name: '海盐柠檬',
    palette: ['#f4e25e', '#fff6c6', '#9bdde2', '#d9f1e0', '#f7f9f0'],
    leafPalette: ['#1d4638', '#5f9a72', '#a9c978', '#cfe3a2'],
    stem: '#67784f',
    background: '#061113',
    floor: '#152c2c',
    glow: '#fff28f',
    densityBias: 0.9,
    verticalBias: 1.0,
    wildness: 1.0
  },
  {
    id: 'hillside-wild',
    name: '山岗小花',
    palette: ['#ffadbe', '#f8d554', '#7abdf2', '#ffffff', '#f77b4f'],
    leafPalette: ['#183f30', '#4f8a5d', '#8abf69', '#d4e6a1'],
    stem: '#697d52',
    background: '#080909',
    floor: '#22271e',
    glow: '#ffe795',
    densityBias: 1.15,
    verticalBias: 0.95,
    wildness: 1.35
  },
  {
    id: 'summer-pinwheel',
    name: '夏日风车',
    palette: ['#ff7d38', '#fddf5b', '#fbf8de', '#7fc96f', '#8dc6ef'],
    leafPalette: ['#23462d', '#4b8541', '#9fbd51', '#d4dd78'],
    stem: '#657d41',
    background: '#0a0906',
    floor: '#2a2418',
    glow: '#ffd36a',
    densityBias: 1.0,
    verticalBias: 1.12,
    wildness: 1.18
  },
  {
    id: 'starry-night',
    name: '繁星夜色',
    palette: ['#fefef5', '#c7d7ff', '#8c7dff', '#ff9fb6', '#f7dc7b'],
    leafPalette: ['#172a32', '#496066', '#8fa48c', '#c3cca8'],
    stem: '#5a6a62',
    background: '#030408',
    floor: '#191c24',
    glow: '#f7f4db',
    densityBias: 1.05,
    verticalBias: 1.0,
    wildness: 1.3
  }
];
