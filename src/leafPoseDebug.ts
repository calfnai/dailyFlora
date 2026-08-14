import { createLeafPoseDebugScene } from './bouquetScene';

const canvas = document.querySelector<HTMLCanvasElement>('#flora-canvas');
if (!canvas) throw new Error('Leaf pose debug canvas is missing.');

const searchParams = new URLSearchParams(window.location.search);
const requestedView = searchParams.get('view');
const view =
  requestedView === 'side' || requestedView === 'top' || requestedView === 'perspective' || requestedView === 'orbit'
    ? requestedView
    : 'front';
const requestedMode = searchParams.get('mode');
const mode =
  requestedMode === 'normal' ||
  requestedMode === 'monochrome' ||
  requestedMode === 'silhouette' ||
  requestedMode === 'front' ||
  requestedMode === 'back' ||
  requestedMode === 'wireframe'
    ? requestedMode
    : 'monochrome';
const requestedPrototype = searchParams.get('prototype');
const prototype =
  requestedPrototype === 'strap' ||
  requestedPrototype === 'lanceolate' ||
  requestedPrototype === 'ovate' ||
  requestedPrototype === 'palmate' ||
  requestedPrototype === 'compound'
    ? requestedPrototype
    : 'ovate';
const comparison = searchParams.get('comparison') === '1';

const debugScene = createLeafPoseDebugScene(canvas, view, mode, { prototype, comparison });
debugScene.start();

document.querySelectorAll<HTMLButtonElement>('[data-leaf-mode]').forEach((button) => {
  const buttonMode = button.dataset.leafMode || 'monochrome';
  button.setAttribute('aria-pressed', String(buttonMode === mode));
  button.addEventListener('click', () => {
    searchParams.set('mode', buttonMode);
    window.location.search = searchParams.toString();
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-leaf-prototype]').forEach((button) => {
  const buttonPrototype = button.dataset.leafPrototype || 'ovate';
  button.setAttribute('aria-pressed', String(!comparison && buttonPrototype === prototype));
  button.addEventListener('click', () => {
    searchParams.set('prototype', buttonPrototype);
    searchParams.delete('comparison');
    window.location.search = searchParams.toString();
  });
});

const comparisonButton = document.querySelector<HTMLButtonElement>('[data-leaf-comparison]');
if (comparisonButton) {
  comparisonButton.setAttribute('aria-pressed', String(comparison));
  comparisonButton.addEventListener('click', () => {
    searchParams.set('comparison', '1');
    window.location.search = searchParams.toString();
  });
}

const statsPanel = document.querySelector<HTMLElement>('#leaf-pose-stats');
if (statsPanel) {
  const stats = debugScene.stats;
  statsPanel.textContent = [
    `mode: ${mode}`,
    `view: ${view}`,
    `comparison: ${comparison}`,
    `leafCount: ${stats.leafCount}`,
    `stemCount: ${stats.stemCount}`,
    `realisticFlowerLeafCount: ${stats.realisticFlowerLeafCount}`,
    `temporaryLegacyStemCount: ${stats.temporaryLegacyStemCount}`,
    `leaves before/after: ${stats.beforeTotalLeafCount} -> ${stats.afterTotalLeafCount} (${stats.totalLeafDelta})`,
    `pitchRange: [${stats.pitchRange.join(', ')}]`,
    `rollRange: [${stats.rollRange.join(', ')}]`,
    `meanPitch: ${stats.meanPitch}`,
    `meanRoll: ${stats.meanRoll}`,
    `nearHorizontalRatio: ${stats.nearHorizontalRatio}`,
    `nearVerticalRatio: ${stats.nearVerticalRatio}`,
    '',
    ...stats.stems.flatMap((stem) => [
      `stemId: ${stem.stemId}`,
      `plantMemberId: ${stem.plantMemberId}`,
      `foliageProfile: ${stem.foliageProfile}`,
      `leafMode: ${stem.leafMode}`,
      `leafArrangement: ${stem.leafArrangement}`,
      ''
    ])
  ].join('\n');
}
