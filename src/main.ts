import './styles.css';
import { buildInfo } from './buildInfo';
import type { DensityName, RenderQualityName } from './types';
import { todayKey } from './random';
import { bouquetDisplayName, createDailySpec, readParams } from './spec';
import { resolveQuality } from './quality';
import { BouquetScene } from './bouquetScene';
import { createSpecialSpec, readSpecialId, specialPathname, specialReferences, withBasePath } from './special';
import { themes } from './themes';
import { IdleClockController, normalizeClockInterval, type ClockDisplaySource, type IdleClockSettings } from './idleClock';
import type { DailyFloraHandActions } from './dailyFloraHandControl';

type RotationDirection = 1 | -1;
type CameraRouteMode = 'orbit' | 'high-arc' | 'low-arc' | 'near-far' | 'figure-eight';
type AccountState = {
  name: string;
  email: string;
};
type FavoriteBouquet = {
  id: string;
  date: string;
  seed: string;
  themeId: string;
  themeName: string;
  themeEnglishName: string;
  flowerPlanName: string;
  flowers: string;
  savedAt: string;
};
type ReferenceState = {
  dataUrl: string;
  fileName: string;
  size: number;
  averageColor: string;
  themeId: string;
  themeName: string;
};
type InterfaceLanguage = 'en' | 'zh' | 'es' | 'fr' | 'pt' | 'it' | 'ja';

const minRotationSpeed = 0.012;
const maxRotationSpeed = 0.13;
const accountStorageKey = 'dailyflora.account.v1';
const favoritesStorageKey = 'dailyflora.favorites.v1';
const interfaceLanguageStorageKey = 'dailyflora.interface-language.v1';
const fullscreenHelpDismissedStorageKey = 'dailyflora.fullscreenHelpDismissed.v1';
const interfaceCopy: Record<InterfaceLanguage, { documentLang: string } & Record<string, string>> = {
  zh: {
    documentLang: 'zh-CN',
    index: 'INDEX',
    view: 'VIEW',
    hideView: 'CLOSE',
    about: '关于',
    howToUse: '使用方法',
    favorite: '收藏今日花束',
    custom: '生成我的专属花束',
    objects: '周边与线下',
    sync: '多端同步',
    scifi: 'scifi',
    garden: '我的花园',
    review: '审美审核',
    siteMenuLabel: 'DailyFlora 网站菜单',
    interfaceLanguage: '界面语言',
    viewingControls: '观看设置',
    showView: '展开观看设置',
    pickDate: '选择花束日期',
    today: '返回今日花束',
    randomDate: '随机查看另一个日期',
    fullscreen: '进入全屏',
    exitFullscreen: '退出全屏',
    handControl: '使用手势控制',
    handOn: '使用手势控制',
    handOff: '关闭手势控制',
    zoomControls: '缩放控制',
    zoomOut: '拉远',
    zoomIn: '拉近',
    resetView: '恢复默认视角',
    help: '查看使用方法',
    densityGroup: '花束密度',
    densityLow: '花材少一点',
    densityMedium: '花材中等',
    densityHigh: '花材密一点',
    densityLowShort: '疏',
    densityMediumShort: '中',
    densityHighShort: '密',
    renderGroup: '渲染精度',
    renderAuto: '自动选择清晰度',
    renderLow: '省电模式',
    renderMedium: '清晰模式',
    renderHigh: '精细模式',
    renderAutoShort: '自',
    renderLowShort: '省',
    renderMediumShort: '清',
    renderHighShort: '精',
    routeGroup: '镜头路线',
    pause: '暂停旋转',
    resume: '继续旋转',
    reverse: '反转当前镜头路线',
    speed: '镜头速度',
    randomPreset: '随机镜头预设',
    clockSettings: '待机时钟设置',
    showClock: '显示时钟',
    hideClock: '关闭时钟',
    clockAfterPrefix: '',
    clockAfterSuffix: '分后',
    automatic: '自动',
    intervalBefore: '自动显示时钟前等待分钟数',
    automaticAria: '启用自动待机时钟',
    closeClock: '关闭时钟',
    buildInfo: '打开当前构建信息',
    previousMonth: '上个月',
    nextMonth: '下个月',
    weekdays: '日,一,二,三,四,五,六'
    ,
    fullscreenHelpTitle: '全屏观看快捷键',
    fullscreenHelpIntro: '这些按键在每日花束页面中均可使用。',
    fullscreenHelpDismiss: '以后不再提示',
    fullscreenHelpClose: '关闭',
    fullscreenHelpMore: '完整使用方法',
    shortcutEscape: '退出全屏或关闭当前浮层',
    shortcutDates: '切换前一天与后一天',
    shortcutRandom: '随机查看一个日期',
    shortcutZoom: '拉近或拉远花束',
    shortcutReset: '恢复默认视角',
    shortcutRotation: '暂停或继续自动旋转',
    shortcutInterface: '显示或隐藏界面',
    shortcutHelp: '重新打开快捷键说明'
  },
  en: {
    documentLang: 'en',
    index: 'INDEX',
    view: 'VIEW',
    hideView: 'CLOSE',
    about: 'About',
    howToUse: 'How to use',
    favorite: "Save today's bouquet",
    custom: 'Generate my bouquet',
    objects: 'Objects & offline',
    sync: 'Multi-device sync',
    scifi: 'scifi',
    garden: 'My garden',
    review: 'Aesthetic review',
    siteMenuLabel: 'DailyFlora site menu',
    interfaceLanguage: 'Interface language',
    viewingControls: 'Viewing controls',
    showView: 'Show viewing controls',
    pickDate: 'Pick bouquet date',
    today: "Return to today's bouquet",
    randomDate: 'Open a random date',
    fullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    handControl: 'Hand control',
    handOn: 'Enable hand control',
    handOff: 'Disable hand control',
    zoomControls: 'Zoom controls',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    resetView: 'Restore default view',
    help: 'View instructions',
    densityGroup: 'Bouquet density',
    densityLow: 'Sparse bouquet',
    densityMedium: 'Medium bouquet',
    densityHigh: 'Dense bouquet',
    densityLowShort: 'S',
    densityMediumShort: 'M',
    densityHighShort: 'D',
    renderGroup: 'Render precision',
    renderAuto: 'Automatic quality',
    renderLow: 'Low power mode',
    renderMedium: 'Clear mode',
    renderHigh: 'Fine mode',
    renderAutoShort: 'A',
    renderLowShort: 'L',
    renderMediumShort: 'M',
    renderHighShort: 'H',
    routeGroup: 'Camera route',
    pause: 'Pause rotation',
    resume: 'Resume rotation',
    reverse: 'Reverse current camera route',
    speed: 'Camera route speed',
    randomPreset: 'Random camera route preset',
    clockSettings: 'Idle clock settings',
    showClock: 'Show clock',
    hideClock: 'Hide clock',
    clockAfterPrefix: 'After',
    clockAfterSuffix: 'min',
    automatic: 'Auto',
    intervalBefore: 'Minutes before automatic clock',
    automaticAria: 'Enable automatic idle clock',
    closeClock: 'Close clock',
    buildInfo: 'Open current build information',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    weekdays: 'S,M,T,W,T,F,S',
    fullscreenHelpTitle: 'FULLSCREEN CONTROLS',
    fullscreenHelpIntro: 'These keys work throughout the daily bouquet view.',
    fullscreenHelpDismiss: "Don't show automatically again",
    fullscreenHelpClose: 'CLOSE',
    fullscreenHelpMore: 'Full instructions',
    shortcutEscape: 'Exit fullscreen or close this panel',
    shortcutDates: 'Move to the previous or next day',
    shortcutRandom: 'Open a random date',
    shortcutZoom: 'Move closer to or farther from the bouquet',
    shortcutReset: 'Restore the default view',
    shortcutRotation: 'Pause or resume automatic rotation',
    shortcutInterface: 'Show or hide the interface',
    shortcutHelp: 'Open these instructions again'
  },
  es: {
    documentLang: 'es',
    index: 'ÍNDICE',
    view: 'VISTA',
    hideView: 'CERRAR',
    about: 'Acerca de',
    howToUse: 'Cómo usar',
    favorite: 'Guardar ramo de hoy',
    custom: 'Generar mi ramo',
    objects: 'Objetos y offline',
    sync: 'Sincronización multi-dispositivo',
    scifi: 'scifi',
    garden: 'Mi jardín',
    review: 'Revisión estética',
    siteMenuLabel: 'Menú del sitio DailyFlora',
    interfaceLanguage: 'Idioma de la interfaz',
    viewingControls: 'Controles de vista',
    showView: 'Mostrar controles',
    pickDate: 'Elegir fecha del ramo',
    today: 'Volver al ramo de hoy',
    randomDate: 'Abrir una fecha al azar',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    handControl: 'Control gestual',
    handOn: 'Activar control gestual',
    handOff: 'Desactivar control gestual',
    zoomControls: 'Controles de zoom',
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    resetView: 'Restaurar vista predeterminada',
    help: 'Ver instrucciones',
    densityGroup: 'Densidad del ramo',
    densityLow: 'Ramo ligero',
    densityMedium: 'Ramo medio',
    densityHigh: 'Ramo denso',
    densityLowShort: 'L',
    densityMediumShort: 'M',
    densityHighShort: 'D',
    renderGroup: 'Precisión de renderizado',
    renderAuto: 'Calidad automática',
    renderLow: 'Modo ahorro',
    renderMedium: 'Modo claro',
    renderHigh: 'Modo fino',
    renderAutoShort: 'A',
    renderLowShort: 'B',
    renderMediumShort: 'M',
    renderHighShort: 'A',
    routeGroup: 'Ruta de cámara',
    pause: 'Pausar rotación',
    resume: 'Reanudar rotación',
    reverse: 'Invertir ruta de cámara',
    speed: 'Velocidad de cámara',
    randomPreset: 'Ruta de cámara aleatoria',
    clockSettings: 'Ajustes del reloj',
    showClock: 'Mostrar reloj',
    hideClock: 'Ocultar reloj',
    clockAfterPrefix: 'Tras',
    clockAfterSuffix: 'min',
    automatic: 'Auto',
    intervalBefore: 'Minutos antes del reloj automático',
    automaticAria: 'Activar reloj automático',
    closeClock: 'Cerrar reloj',
    buildInfo: 'Abrir información de compilación',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    weekdays: 'D,L,M,X,J,V,S'
  },
  fr: {
    documentLang: 'fr',
    index: 'INDEX',
    view: 'VUE',
    hideView: 'FERMER',
    about: 'À propos',
    howToUse: 'Mode d’emploi',
    favorite: 'Enregistrer le bouquet',
    custom: 'Générer mon bouquet',
    objects: 'Objets et hors ligne',
    sync: 'Synchronisation multi-écrans',
    scifi: 'scifi',
    garden: 'Mon jardin',
    review: 'Revue esthétique',
    siteMenuLabel: 'Menu du site DailyFlora',
    interfaceLanguage: 'Langue de l’interface',
    viewingControls: 'Commandes de vue',
    showView: 'Afficher les commandes',
    pickDate: 'Choisir la date du bouquet',
    today: 'Revenir au bouquet du jour',
    randomDate: 'Ouvrir une date aléatoire',
    fullscreen: 'Plein écran',
    exitFullscreen: 'Quitter le plein écran',
    handControl: 'Commande gestuelle',
    handOn: 'Activer la commande gestuelle',
    handOff: 'Désactiver la commande gestuelle',
    zoomControls: 'Commandes de zoom',
    zoomOut: 'Éloigner',
    zoomIn: 'Rapprocher',
    resetView: 'Rétablir la vue par défaut',
    help: 'Voir le mode d’emploi',
    densityGroup: 'Densité du bouquet',
    densityLow: 'Bouquet léger',
    densityMedium: 'Bouquet moyen',
    densityHigh: 'Bouquet dense',
    densityLowShort: 'L',
    densityMediumShort: 'M',
    densityHighShort: 'D',
    renderGroup: 'Précision du rendu',
    renderAuto: 'Qualité automatique',
    renderLow: 'Mode économie',
    renderMedium: 'Mode clair',
    renderHigh: 'Mode précis',
    renderAutoShort: 'A',
    renderLowShort: 'B',
    renderMediumShort: 'M',
    renderHighShort: 'H',
    routeGroup: 'Parcours caméra',
    pause: 'Mettre en pause',
    resume: 'Reprendre la rotation',
    reverse: 'Inverser le parcours caméra',
    speed: 'Vitesse de la caméra',
    randomPreset: 'Parcours caméra aléatoire',
    clockSettings: 'Réglages de l’horloge',
    showClock: 'Afficher l’horloge',
    hideClock: 'Masquer l’horloge',
    clockAfterPrefix: 'Après',
    clockAfterSuffix: 'min',
    automatic: 'Auto',
    intervalBefore: 'Minutes avant l’horloge automatique',
    automaticAria: 'Activer l’horloge automatique',
    closeClock: 'Fermer l’horloge',
    buildInfo: 'Ouvrir les informations de version',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    weekdays: 'D,L,M,M,J,V,S'
  },
  pt: {
    documentLang: 'pt',
    index: 'ÍNDICE',
    view: 'VISTA',
    hideView: 'FECHAR',
    about: 'Sobre',
    howToUse: 'Como usar',
    favorite: 'Salvar buquê de hoje',
    custom: 'Gerar meu buquê',
    objects: 'Objetos e offline',
    sync: 'Sincronização multidispositivo',
    scifi: 'scifi',
    garden: 'Meu jardim',
    review: 'Revisão estética',
    siteMenuLabel: 'Menu do site DailyFlora',
    interfaceLanguage: 'Idioma da interface',
    viewingControls: 'Controles de visualização',
    showView: 'Mostrar controles',
    pickDate: 'Escolher data do buquê',
    today: 'Voltar ao buquê de hoje',
    randomDate: 'Abrir uma data aleatória',
    fullscreen: 'Tela cheia',
    exitFullscreen: 'Sair da tela cheia',
    handControl: 'Controle por gestos',
    handOn: 'Ativar controle por gestos',
    handOff: 'Desativar controle por gestos',
    zoomControls: 'Controles de zoom',
    zoomOut: 'Afastar',
    zoomIn: 'Aproximar',
    resetView: 'Restaurar visualização padrão',
    help: 'Ver instruções',
    densityGroup: 'Densidade do buquê',
    densityLow: 'Buquê leve',
    densityMedium: 'Buquê médio',
    densityHigh: 'Buquê denso',
    densityLowShort: 'L',
    densityMediumShort: 'M',
    densityHighShort: 'D',
    renderGroup: 'Precisão de renderização',
    renderAuto: 'Qualidade automática',
    renderLow: 'Modo econômico',
    renderMedium: 'Modo claro',
    renderHigh: 'Modo fino',
    renderAutoShort: 'A',
    renderLowShort: 'B',
    renderMediumShort: 'M',
    renderHighShort: 'A',
    routeGroup: 'Rota da câmera',
    pause: 'Pausar rotação',
    resume: 'Retomar rotação',
    reverse: 'Inverter rota da câmera',
    speed: 'Velocidade da câmera',
    randomPreset: 'Rota de câmera aleatória',
    clockSettings: 'Configurações do relógio',
    showClock: 'Mostrar relógio',
    hideClock: 'Ocultar relógio',
    clockAfterPrefix: 'Após',
    clockAfterSuffix: 'min',
    automatic: 'Auto',
    intervalBefore: 'Minutos antes do relógio automático',
    automaticAria: 'Ativar relógio automático',
    closeClock: 'Fechar relógio',
    buildInfo: 'Abrir informações da versão',
    previousMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    weekdays: 'D,S,T,Q,Q,S,S'
  },
  it: {
    documentLang: 'it',
    index: 'INDICE',
    view: 'VISTA',
    hideView: 'CHIUDI',
    about: 'Informazioni',
    howToUse: 'Come si usa',
    favorite: 'Salva il bouquet',
    custom: 'Genera il mio bouquet',
    objects: 'Oggetti e offline',
    sync: 'Sincronizzazione multi-dispositivo',
    scifi: 'scifi',
    garden: 'Il mio giardino',
    review: 'Revisione estetica',
    siteMenuLabel: 'Menu del sito DailyFlora',
    interfaceLanguage: 'Lingua dell’interfaccia',
    viewingControls: 'Controlli di visualizzazione',
    showView: 'Mostra controlli',
    pickDate: 'Scegli la data del bouquet',
    today: 'Torna al bouquet di oggi',
    randomDate: 'Apri una data casuale',
    fullscreen: 'Schermo intero',
    exitFullscreen: 'Esci da schermo intero',
    handControl: 'Controllo gestuale',
    handOn: 'Attiva controllo gestuale',
    handOff: 'Disattiva controllo gestuale',
    zoomControls: 'Controlli zoom',
    zoomOut: 'Allontana',
    zoomIn: 'Avvicina',
    resetView: 'Ripristina vista predefinita',
    help: 'Visualizza istruzioni',
    densityGroup: 'Densità del bouquet',
    densityLow: 'Bouquet leggero',
    densityMedium: 'Bouquet medio',
    densityHigh: 'Bouquet denso',
    densityLowShort: 'L',
    densityMediumShort: 'M',
    densityHighShort: 'D',
    renderGroup: 'Precisione di rendering',
    renderAuto: 'Qualità automatica',
    renderLow: 'Modalità risparmio',
    renderMedium: 'Modalità nitida',
    renderHigh: 'Modalità fine',
    renderAutoShort: 'A',
    renderLowShort: 'B',
    renderMediumShort: 'M',
    renderHighShort: 'A',
    routeGroup: 'Percorso camera',
    pause: 'Pausa rotazione',
    resume: 'Riprendi rotazione',
    reverse: 'Inverti percorso camera',
    speed: 'Velocità camera',
    randomPreset: 'Percorso camera casuale',
    clockSettings: 'Impostazioni orologio',
    showClock: 'Mostra orologio',
    hideClock: 'Nascondi orologio',
    clockAfterPrefix: 'Dopo',
    clockAfterSuffix: 'min',
    automatic: 'Auto',
    intervalBefore: 'Minuti prima dell’orologio automatico',
    automaticAria: 'Attiva orologio automatico',
    closeClock: 'Chiudi orologio',
    buildInfo: 'Apri informazioni sulla build',
    previousMonth: 'Mese precedente',
    nextMonth: 'Mese successivo',
    weekdays: 'D,L,M,M,G,V,S'
  },
  ja: {
    documentLang: 'ja',
    index: '索引',
    view: '表示',
    hideView: '閉じる',
    about: '概要',
    howToUse: '使い方',
    favorite: '今日の花束を保存',
    custom: '自分の花束を生成',
    objects: 'グッズとオフライン',
    sync: 'マルチデバイス同期',
    scifi: 'scifi',
    garden: '私の庭',
    review: '美的レビュー',
    siteMenuLabel: 'DailyFlora サイトメニュー',
    interfaceLanguage: '表示言語',
    viewingControls: '表示設定',
    showView: '表示設定を開く',
    pickDate: '花束の日付を選択',
    today: '今日の花束に戻る',
    randomDate: 'ランダムな日付を開く',
    fullscreen: '全画面表示',
    exitFullscreen: '全画面表示を終了',
    handControl: 'ジェスチャー操作',
    handOn: 'ジェスチャー操作を開始',
    handOff: 'ジェスチャー操作を終了',
    zoomControls: 'ズーム操作',
    zoomOut: '縮小',
    zoomIn: '拡大',
    resetView: '既定の表示に戻す',
    help: '使い方を見る',
    densityGroup: '花束の密度',
    densityLow: '花材を少なく',
    densityMedium: '花材を標準に',
    densityHigh: '花材を多く',
    densityLowShort: '疎',
    densityMediumShort: '中',
    densityHighShort: '密',
    renderGroup: '描画精度',
    renderAuto: '自動品質',
    renderLow: '省電力',
    renderMedium: '標準画質',
    renderHigh: '高精細',
    renderAutoShort: '自',
    renderLowShort: '省',
    renderMediumShort: '標',
    renderHighShort: '精',
    routeGroup: 'カメラ経路',
    pause: '回転を一時停止',
    resume: '回転を再開',
    reverse: 'カメラ経路を反転',
    speed: 'カメラ速度',
    randomPreset: 'カメラ経路をランダム化',
    clockSettings: '待機時計の設定',
    showClock: '時計を表示',
    hideClock: '時計を閉じる',
    clockAfterPrefix: '',
    clockAfterSuffix: '分後',
    automatic: '自動',
    intervalBefore: '自動時計までの分数',
    automaticAria: '自動待機時計を有効化',
    closeClock: '時計を閉じる',
    buildInfo: '現在のビルド情報を開く',
    previousMonth: '前の月',
    nextMonth: '次の月',
    weekdays: '日,月,火,水,木,金,土'
  }
};
const themeEnglishNames: Record<string, string> = {
  'tropical-forest': 'Tropical Forest',
  'moon-white': 'Moon White Hand-Tied',
  'fairy-violet': 'Fairy Violet Mist',
  'sea-salt-lemon': 'Sea Salt Lemon',
  'hillside-wild': 'Hillside Wildflowers',
  'summer-pinwheel': 'Summer Pinwheel',
  'dopamine-field': 'Dopamine Field',
  'starry-night': 'Starry Night',
  'dewberry-morning': 'Dewberry Morning',
  'lychee-garden-rainbow': 'Lychee Garden Rainbow',
  'her-january-sky': 'Her January Sky',
  'her-january-sky-v2': 'Her January Sky v2',
  'her-january-sky-v3': 'Her January Sky v3',
  'her-real-bouquet-v4': 'Her Real Bouquet v4'
};
const rotationPresets: Array<{
  speed: number;
  direction: RotationDirection;
  pitch: number;
  mode: CameraRouteMode;
  pitchAmplitude: number;
  yawAmplitude: number;
  distanceAmplitude: number;
  targetYAmplitude: number;
}> = [
  {
    speed: 0.036,
    direction: 1,
    pitch: 0.38,
    mode: 'orbit',
    pitchAmplitude: 0,
    yawAmplitude: 0,
    distanceAmplitude: 0,
    targetYAmplitude: 0
  },
  {
    speed: 0.052,
    direction: 1,
    pitch: 0.78,
    mode: 'high-arc',
    pitchAmplitude: 0.28,
    yawAmplitude: 0.16,
    distanceAmplitude: 0.16,
    targetYAmplitude: 0.08
  },
  {
    speed: 0.044,
    direction: -1,
    pitch: 0.24,
    mode: 'low-arc',
    pitchAmplitude: 0.18,
    yawAmplitude: 0.2,
    distanceAmplitude: 0.24,
    targetYAmplitude: 0.06
  },
  {
    speed: 0.064,
    direction: 1,
    pitch: 0.52,
    mode: 'near-far',
    pitchAmplitude: 0.18,
    yawAmplitude: 0.24,
    distanceAmplitude: 0.52,
    targetYAmplitude: 0.12
  },
  {
    speed: 0.046,
    direction: -1,
    pitch: 0.62,
    mode: 'figure-eight',
    pitchAmplitude: 0.26,
    yawAmplitude: 0.48,
    distanceAmplitude: 0.32,
    targetYAmplitude: 0.1
  }
];

const canvas = document.querySelector<HTMLCanvasElement>('#flora-canvas');
const hud = document.querySelector<HTMLElement>('#hud');
const controls = document.querySelector<HTMLElement>('#controls');
const controlsToggleButton = document.querySelector<HTMLButtonElement>('#controls-toggle');
const controlsPanel = document.querySelector<HTMLElement>('#controls-panel');
const siteMenu = document.querySelector<HTMLElement>('#site-menu');
const siteMenuToggle = document.querySelector<HTMLButtonElement>('#site-menu-toggle');
const siteMenuPanel = document.querySelector<HTMLElement>('#site-menu-panel');
const siteLanguageSwitcher = document.querySelector<HTMLElement>('#site-language-switcher');
const handControlToggle = document.querySelector<HTMLButtonElement>('#hand-control-toggle');
const dateLabel = document.querySelector<HTMLElement>('#daily-date');
const dateEnLabel = document.querySelector<HTMLElement>('#daily-date-en');
const dateCnLabel = document.querySelector<HTMLElement>('#daily-date-cn');
const themeLabel = document.querySelector<HTMLElement>('#daily-theme');
const themeCnLabel = document.querySelector<HTMLElement>('#daily-theme-cn');
const themeEnLabel = document.querySelector<HTMLElement>('#daily-theme-en');
const flowerPlanLabel = document.querySelector<HTMLElement>('#flower-plan-mark');
const flowerPlanEnLabel = document.querySelector<HTMLElement>('#flower-plan-mark-en');
const qualityLabel = document.querySelector<HTMLElement>('#quality-mark');
const debugPanel = document.querySelector<HTMLElement>('#debug-panel');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
const todayButton = document.querySelector<HTMLButtonElement>('#today-button');
const todayResetButton = document.querySelector<HTMLButtonElement>('#today-reset-button');
const datePicker = document.querySelector<HTMLInputElement>('#date-picker');
const calendarPanel = document.createElement('div');
const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-button');
const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen-button');
const zoomInButton = document.querySelector<HTMLButtonElement>('#zoom-in-button');
const zoomOutButton = document.querySelector<HTMLButtonElement>('#zoom-out-button');
const resetViewButton = document.querySelector<HTMLButtonElement>('#reset-view-button');
const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
const shortcutHelp = document.querySelector<HTMLElement>('#shortcut-help');
const shortcutHelpTitle = document.querySelector<HTMLElement>('#shortcut-help-title');
const shortcutHelpIntro = document.querySelector<HTMLElement>('#shortcut-help-intro');
const shortcutHelpDismiss = document.querySelector<HTMLInputElement>('#shortcut-help-dismiss');
const shortcutHelpDismissLabel = document.querySelector<HTMLElement>('#shortcut-help-dismiss-label');
const shortcutHelpClose = document.querySelector<HTMLButtonElement>('#shortcut-help-close');
const shortcutHelpX = document.querySelector<HTMLButtonElement>('#shortcut-help-x');
const shortcutHelpMore = document.querySelector<HTMLAnchorElement>('#shortcut-help-more');
const densityButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-density-choice]'));
const renderButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-render-choice]'));
const rotationSpeedInput = document.querySelector<HTMLInputElement>('#rotation-speed');
const rotationDirectionButton = document.querySelector<HTMLButtonElement>('#rotation-direction-button');
const rotationPresetButton = document.querySelector<HTMLButtonElement>('#rotation-preset-button');
const accountDock = document.querySelector<HTMLElement>('#account-dock');
const favoriteButton = document.querySelector<HTMLButtonElement>('#favorite-button');
const accountOpenButton = document.querySelector<HTMLButtonElement>('#account-open-button');
const accountCloseButton = document.querySelector<HTMLButtonElement>('#account-close-button');
const accountPanel = document.querySelector<HTMLElement>('#account-panel');
const accountAvatar = document.querySelector<HTMLElement>('#account-avatar');
const accountOpenTitle = document.querySelector<HTMLElement>('#account-open-title');
const accountOpenStatus = document.querySelector<HTMLElement>('#account-open-status');
const accountPanelTitle = document.querySelector<HTMLElement>('#account-panel-title');
const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const loginNameInput = document.querySelector<HTMLInputElement>('#login-name-input');
const loginEmailInput = document.querySelector<HTMLInputElement>('#login-email-input');
const accountProfile = document.querySelector<HTMLElement>('#account-profile');
const profileAvatar = document.querySelector<HTMLElement>('#profile-avatar');
const profileName = document.querySelector<HTMLElement>('#profile-name');
const profileEmail = document.querySelector<HTMLElement>('#profile-email');
const logoutButton = document.querySelector<HTMLButtonElement>('#logout-button');
const collectionCount = document.querySelector<HTMLElement>('#collection-count');
const collectionList = document.querySelector<HTMLElement>('#collection-list');
const referenceFileInput = document.querySelector<HTMLInputElement>('#reference-file-input');
const referencePreview = document.querySelector<HTMLElement>('#reference-preview');
const referencePreviewImage = document.querySelector<HTMLImageElement>('#reference-preview-image');
const referencePreviewTitle = document.querySelector<HTMLElement>('#reference-preview-title');
const referencePreviewMeta = document.querySelector<HTMLElement>('#reference-preview-meta');
const referenceNoteInput = document.querySelector<HTMLTextAreaElement>('#reference-note-input');
const referenceGenerateButton = document.querySelector<HTMLButtonElement>('#reference-generate-button');
const referenceResult = document.querySelector<HTMLElement>('#reference-result');
const clockToggleButton = document.querySelector<HTMLButtonElement>('#clock-toggle');
const clockIntervalInput = document.querySelector<HTMLInputElement>('#clock-interval');
const clockAutoEnabledInput = document.querySelector<HTMLInputElement>('#clock-auto-enabled');
const clockOverlay = document.querySelector<HTMLElement>('#clock-overlay');
const clockTime = document.querySelector<HTMLElement>('#clock-time');
const clockDate = document.querySelector<HTMLElement>('#clock-date');
const clockQuoteText = document.querySelector<HTMLElement>('#clock-quote-text');
const clockQuoteAuthor = document.querySelector<HTMLElement>('#clock-quote-author');
const clockCloseButton = document.querySelector<HTMLButtonElement>('#clock-close-button');
const releaseMark = document.querySelector<HTMLAnchorElement>('#release-mark');

if (
  !canvas ||
  !hud ||
  !controls ||
  !controlsToggleButton ||
  !controlsPanel ||
  !dateLabel ||
  !dateEnLabel ||
  !dateCnLabel ||
  !themeLabel ||
  !themeCnLabel ||
  !themeEnLabel ||
  !flowerPlanLabel ||
  !flowerPlanEnLabel ||
  !qualityLabel
) {
  throw new Error('DailyFlora could not find the required page elements.');
}

const ui = {
  canvas,
  hud,
  controls,
  controlsToggleButton,
  controlsPanel,
  dateLabel,
  dateEnLabel,
  dateCnLabel,
  themeLabel,
  themeCnLabel,
  themeEnLabel,
  flowerPlanLabel,
  flowerPlanEnLabel,
  qualityLabel
};

if (releaseMark) {
  releaseMark.textContent = buildInfo.releaseId;
  releaseMark.href = withBasePath('version.json');
  releaseMark.title = [
    `Release: ${buildInfo.releaseId}`,
    `Commit: ${buildInfo.commitSha}`,
    `Branch: ${buildInfo.branch}`,
    `Built: ${buildInfo.builtAt}`
  ].join('\n');
}

let params = readParams();
const specialId = readSpecialId();
const specialReference = specialId ? specialReferences[specialId] : null;
const searchParams = new URLSearchParams(window.location.search);
const debugValue = searchParams.get('debug');
const debugMode = searchParams.has('debug') && debugValue !== '0' && debugValue !== 'false';
const previewValue = searchParams.get('preview');
const previewMode = searchParams.has('preview') && previewValue !== '0' && previewValue !== 'false';
const internalPreviewMode = debugMode || previewMode;
const requestedDensity = searchParams.get('density') || searchParams.get('quality');
const requestedRender = searchParams.get('render');
const maxSelectableDate = todayKey();
const initialDate = params.date > maxSelectableDate ? maxSelectableDate : params.date;
const initialSeed = params.date > maxSelectableDate && params.seed === params.date ? maxSelectableDate : params.seed;
let selectedDensity = requestedDensity
  ? normalizeDensity(requestedDensity)
  : internalPreviewMode
    ? 'high'
    : specialReference
      ? 'medium'
      : normalizeDensity(params.density);
document.body.classList.toggle('is-preview', previewMode);
let selectedRender = requestedRender
  ? normalizeRender(requestedRender)
  : internalPreviewMode || specialReference
    ? 'high'
    : normalizeRender(params.render);
let selectedTheme = specialReference ? specialReference.theme.id : params.theme;
let quality = resolveQuality(selectedDensity, selectedRender);
let spec = specialReference
  ? createSpecialSpec(specialReference, new URLSearchParams(window.location.search).get('date') || undefined)
  : createDailySpec(initialDate, initialSeed, selectedTheme);
let followsToday = !specialReference && !searchParams.has('date') && !searchParams.has('seed');
let scene = new BouquetScene(ui.canvas, spec, quality);
(window as Window & {
  __dailyFloraAudit?: () => ReturnType<BouquetScene['getDebugStats']>;
}).__dailyFloraAudit = () => scene.getDebugStats();
const requestedCamera = searchParams.get('camera');
if (requestedCamera === 'front' || requestedCamera === 'side' || requestedCamera === 'top') {
  scene.setStaticCameraView(requestedCamera);
}
let hideTimer = 0;
let previewCount = 0;
let rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
let rotationDirection: RotationDirection = 1;
let cameraRouteMode: CameraRouteMode = 'orbit';
let pitchAmplitude = 0;
let yawAmplitude = 0;
let distanceAmplitude = 0;
let targetYAmplitude = 0;
let manualRotation = false;
let manualZoom = 0;
let rotationPaused = false;
let specialAudio: HTMLAudioElement | null = null;
let specialAudioMuted = false;
let debugTimer = 0;
let dateRolloverTimer = 0;
let fullscreenHelpClosedThisEntry = false;
let calendarView = parseDateKey(spec.dateLabel);
let accountState = readAccountState();
let favoriteBouquets = readFavoriteBouquets();
let referenceState: ReferenceState | null = null;
let clockTickTimer = 0;
let clockDisplaySource: ClockDisplaySource | null = null;
let clockQuoteIndex = 0;
const clockSettingsStorageKey = 'dailyflora.idle-clock.v1';
const clockQuotes: Record<InterfaceLanguage, readonly (readonly [string, string])[]> = {
  zh: [
    ['自然从不匆忙，却完成一切。', '老子'],
    ['越安静，越能听见。', '拉姆·达斯']
  ],
  en: [
    ['Nature does not hurry, yet everything is accomplished.', 'Lao Tzu'],
    ['The quieter you become, the more you can hear.', 'Ram Dass']
  ],
  es: [
    ['La naturaleza no se apresura y, aun así, todo se cumple.', 'Lao Tse'],
    ['Cuanto más silencio guardas, más puedes oír.', 'Ram Dass']
  ],
  fr: [
    ['La nature ne se presse pas, pourtant tout s’accomplit.', 'Lao Tseu'],
    ['Plus vous devenez silencieux, plus vous pouvez entendre.', 'Ram Dass']
  ],
  pt: [
    ['A natureza não tem pressa e, ainda assim, tudo se realiza.', 'Lao Tsé'],
    ['Quanto mais silêncio, mais se pode ouvir.', 'Ram Dass']
  ],
  it: [
    ['La natura non ha fretta, eppure tutto si compie.', 'Lao Tzu'],
    ['Più diventi silenzioso, più riesci ad ascoltare.', 'Ram Dass']
  ],
  ja: [
    ['自然は急がない。それでも、すべては成し遂げられる。', '老子'],
    ['静かになるほど、より多くが聞こえてくる。', 'ラム・ダス']
  ]
};

function readClockSettings(): IdleClockSettings {
  const stored = safeJsonParse<Partial<IdleClockSettings>>(window.localStorage.getItem(clockSettingsStorageKey), {});
  return {
    autoEnabled: stored.autoEnabled ?? true,
    intervalMinutes: normalizeClockInterval(stored.intervalMinutes ?? 5)
  };
}

let clockSettings = readClockSettings();
const idleClock = new IdleClockController(clockSettings, {
  onShow: (source) => showClock(source),
  onHide: hideClock
});

calendarPanel.className = 'date-calendar';
calendarPanel.id = 'date-calendar';
calendarPanel.hidden = true;
calendarPanel.setAttribute('role', 'dialog');
calendarPanel.setAttribute('aria-label', 'Pick bouquet date');
document.body.append(calendarPanel);
todayButton?.setAttribute('aria-haspopup', 'dialog');
todayButton?.setAttribute('aria-controls', 'date-calendar');
todayButton?.setAttribute('aria-expanded', 'false');
if (datePicker) datePicker.max = maxSelectableDate;

function THREEClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDensity(value: string): DensityName {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function normalizeRender(value: string): RenderQualityName {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'auto' ? value : 'auto';
}

function speedToSlider(speed: number) {
  return Math.round(((speed - minRotationSpeed) / (maxRotationSpeed - minRotationSpeed)) * 100);
}

function sliderToSpeed(value: string) {
  const ratio = Number(value) / 100;
  return minRotationSpeed + (maxRotationSpeed - minRotationSpeed) * ratio;
}

function bouquetHoverTitle() {
  const name = bouquetDisplayName(spec);
  return `${name.cn} / ${name.en}`;
}

function themeEnglishName() {
  return themeEnglishNames[spec.theme.id] || spec.theme.id;
}

function flowerPlanText() {
  return spec.flowerPlan.items.map((item) => item.cn).join(' / ');
}

function flowerPlanTextEn() {
  return spec.flowerPlan.items.map((item) => item.en).join(' / ');
}

function displayNameWithoutDate(value: string) {
  const parts = value.split(' · ');
  return parts.length > 1 ? parts.slice(1).join(' · ') : value;
}

function formatDisplayDates(dateKey: string) {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { en: dateKey, cn: dateKey };
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const englishMonth = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Shanghai' })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .toUpperCase();
  return { en: `${englishMonth} ${day},${year}`, cn: `${month}月${day}日` };
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatClockDate(now: Date) {
  return new Intl.DateTimeFormat(interfaceCopy[readInterfaceLanguage()].documentLang, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  }).format(now);
}

function updateClockTime() {
  const now = new Date();
  if (clockTime) {
    clockTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  if (clockDate) clockDate.textContent = formatClockDate(now);
}

function updateClockQuote(language = readInterfaceLanguage()) {
  const quotes = clockQuotes[language];
  const quote = quotes[clockQuoteIndex % quotes.length];
  if (clockQuoteText) clockQuoteText.textContent = quote[0];
  if (clockQuoteAuthor) clockQuoteAuthor.textContent = quote[1];
}

function syncClockControls() {
  const { autoEnabled, intervalMinutes } = clockSettings;
  [clockIntervalInput].forEach((input) => {
    if (input) input.value = String(intervalMinutes);
  });
  [clockAutoEnabledInput].forEach((input) => {
    if (input) input.checked = autoEnabled;
  });
  if (clockToggleButton) {
    const isManual = clockDisplaySource === 'manual';
    const label = interfaceText(isManual ? 'hideClock' : 'showClock');
    clockToggleButton.classList.toggle('is-active', isManual);
    clockToggleButton.setAttribute('aria-pressed', String(isManual));
    clockToggleButton.setAttribute('aria-label', label);
    clockToggleButton.setAttribute('data-tooltip', label);
    clockToggleButton.title = label;
  }
}

function updateClockSettings(next: Partial<IdleClockSettings>) {
  clockSettings = {
    ...clockSettings,
    ...next,
    intervalMinutes: normalizeClockInterval(next.intervalMinutes ?? clockSettings.intervalMinutes)
  };
  window.localStorage.setItem(clockSettingsStorageKey, JSON.stringify(clockSettings));
  idleClock.updateSettings(clockSettings);
  syncClockControls();
}

function showClock(source: ClockDisplaySource) {
  clockDisplaySource = source;
  setControlsExpanded(false, false);
  hideUiNow();
  clockQuoteIndex = Math.floor(Math.random() * clockQuotes.en.length);
  updateClockQuote();
  updateClockTime();
  window.clearInterval(clockTickTimer);
  clockTickTimer = window.setInterval(updateClockTime, 1000);
  document.body.classList.add('is-clock-visible');
  scene.setClockLayout(true);
  if (clockOverlay) {
    clockOverlay.classList.remove('is-auto', 'is-manual', 'is-visible');
    clockOverlay.setAttribute('aria-hidden', 'false');
    if (source === 'auto') clockOverlay.classList.add('is-auto');
    if (source === 'manual') clockOverlay.classList.add('is-manual');
    requestAnimationFrame(() => clockOverlay.classList.add('is-visible'));
  }
  window.setTimeout(() => scene.resize(), 0);
  syncClockControls();
}

function hideClock() {
  clockDisplaySource = null;
  window.clearInterval(clockTickTimer);
  if (clockOverlay) {
    clockOverlay.classList.remove('is-visible', 'is-auto', 'is-manual');
    clockOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('is-clock-visible');
  scene.setClockLayout(false);
  window.setTimeout(() => scene.resize(), 380);
  syncClockControls();
}

function readAccountState(): AccountState | null {
  const account = safeJsonParse<AccountState | null>(window.localStorage.getItem(accountStorageKey), null);
  if (!account?.email) return null;
  return account;
}

function saveAccountState(nextAccount: AccountState | null) {
  accountState = nextAccount;
  if (nextAccount) {
    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextAccount));
  } else {
    window.localStorage.removeItem(accountStorageKey);
  }
  renderAccountState();
}

function readFavoriteBouquets(): FavoriteBouquet[] {
  const favorites = safeJsonParse<FavoriteBouquet[]>(window.localStorage.getItem(favoritesStorageKey), []);
  return Array.isArray(favorites) ? favorites : [];
}

function saveFavoriteBouquets(nextFavorites: FavoriteBouquet[]) {
  favoriteBouquets = nextFavorites.slice(0, 24);
  window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favoriteBouquets));
  renderAccountState();
}

function currentFavoriteId() {
  return `${spec.dateLabel}:${spec.seed}:${spec.theme.id}`;
}

function currentFavorite() {
  return favoriteBouquets.find((favorite) => favorite.id === currentFavoriteId()) || null;
}

function createFavorite(): FavoriteBouquet {
  const name = bouquetDisplayName(spec);
  return {
    id: currentFavoriteId(),
    date: spec.dateLabel,
    seed: spec.seed,
    themeId: spec.theme.id,
    themeName: name.cn,
    themeEnglishName: name.en,
    flowerPlanName: spec.flowerPlan.cnName,
    flowers: flowerPlanText(),
    savedAt: new Date().toISOString()
  };
}

function initials(name: string, fallback: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : fallback;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  if (max === g) hue = (b - r) / delta + 2;
  if (max === b) hue = (r - g) / delta + 4;
  return { hue: (hue * 60 + 360) % 360, saturation, lightness };
}

function themeForAverageColor(red: number, green: number, blue: number) {
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
  let themeId = 'sea-salt-lemon';
  if (lightness > 0.76 && saturation < 0.28) themeId = 'moon-white';
  else if (hue >= 245 && hue < 330) themeId = saturation > 0.34 ? 'fairy-violet' : 'starry-night';
  else if (hue >= 330 || hue < 22) themeId = 'dewberry-morning';
  else if (hue >= 22 && hue < 54) themeId = saturation > 0.42 ? 'summer-pinwheel' : 'hillside-wild';
  else if (hue >= 54 && hue < 92) themeId = 'sea-salt-lemon';
  else if (hue >= 92 && hue < 172) themeId = saturation > 0.32 ? 'tropical-forest' : 'hillside-wild';
  else if (hue >= 172 && hue < 215) themeId = 'sea-salt-lemon';
  else if (hue >= 215 && hue < 245) themeId = 'starry-night';
  return themes.find((theme) => theme.id === themeId) || themes[0];
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('Could not read reference image.')));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load reference image.')));
    image.src = dataUrl;
  });
}

async function analyzeReferenceImage(file: File): Promise<ReferenceState> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const canvasElement = document.createElement('canvas');
  const size = 48;
  canvasElement.width = size;
  canvasElement.height = size;
  const context = canvasElement.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not analyze reference image.');
  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.2) continue;
    red += pixels[index] * alpha;
    green += pixels[index + 1] * alpha;
    blue += pixels[index + 2] * alpha;
    count += alpha;
  }
  const averageRed = Math.round(red / Math.max(1, count));
  const averageGreen = Math.round(green / Math.max(1, count));
  const averageBlue = Math.round(blue / Math.max(1, count));
  const theme = themeForAverageColor(averageRed, averageGreen, averageBlue);
  return {
    dataUrl,
    fileName: file.name,
    size: file.size,
    averageColor: rgbToHex(averageRed, averageGreen, averageBlue),
    themeId: theme.id,
    themeName: theme.name
  };
}

function renderReferenceState() {
  if (!referencePreview || !referencePreviewImage || !referencePreviewMeta || !referenceGenerateButton) return;
  const hasReference = Boolean(referenceState);
  referencePreview.hidden = !hasReference;
  referenceGenerateButton.disabled = !hasReference;
  if (!referenceState) return;
  referencePreviewImage.src = referenceState.dataUrl;
  referencePreviewTitle && (referencePreviewTitle.textContent = referenceState.fileName);
  referencePreviewMeta.textContent = `${formatFileSize(referenceState.size)} · ${referenceState.themeName} · ${referenceState.averageColor}`;
  referencePreview.style.setProperty('--reference-color', referenceState.averageColor);
}

async function handleReferenceFile(file: File) {
  if (!file.type.startsWith('image/')) return;
  if (referenceResult) {
    referenceResult.hidden = false;
    referenceResult.textContent = '正在读取参考图...';
  }
  referenceState = await analyzeReferenceImage(file);
  renderReferenceState();
  if (referenceResult) {
    referenceResult.textContent = `已匹配到 ${referenceState.themeName}，可以生成。`;
  }
}

function generateFromReference() {
  if (!referenceState) return;
  const note = referenceNoteInput?.value.trim() || 'reference';
  const date = todayKey();
  const seed = `reference:${Date.now()}:${referenceState.fileName}:${note}`;
  selectedTheme = referenceState.themeId;
  previewCount = 0;
  closeCalendar();
  rebuild(date, seed);
  syncTodayMode(date, seed);
  if (referenceResult) {
    referenceResult.hidden = false;
    referenceResult.textContent = `已按 ${referenceState.themeName} 生成，可点爱心收藏。`;
  }
}

function openAccountPanel() {
  if (!accountPanel || !accountOpenButton) return;
  accountPanel.hidden = false;
  accountOpenButton.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => accountPanel.classList.add('is-open'), 20);
  if (!accountState) {
    loginNameInput?.focus();
  }
  revealUi();
}

function closeAccountPanel() {
  if (!accountPanel || !accountOpenButton) return;
  accountPanel.classList.remove('is-open');
  accountOpenButton.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => {
    if (!accountPanel.classList.contains('is-open')) accountPanel.hidden = true;
  }, 220);
}

function toggleSiteMenu(forceOpen?: boolean) {
  if (!siteMenuToggle || !siteMenuPanel) return;
  const open = forceOpen ?? siteMenuPanel.hidden;
  siteMenuPanel.hidden = !open;
  siteMenuToggle.setAttribute('aria-expanded', String(open));
}

function readInterfaceLanguage(): InterfaceLanguage {
  const stored = window.localStorage.getItem(interfaceLanguageStorageKey);
  return stored && stored in interfaceCopy ? (stored as InterfaceLanguage) : 'zh';
}

function interfaceText(key: string, language = readInterfaceLanguage()) {
  return interfaceCopy[language][key] ?? interfaceCopy.en[key] ?? key;
}

function updateInterfaceLanguage(language: InterfaceLanguage) {
  const copy = interfaceCopy[language];
  const setAttributes = (selector: string, key: string, attributes: string[]) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;
    const value = interfaceText(key, language);
    attributes.forEach((attribute) => element.setAttribute(attribute, value));
  };

  document.documentElement.lang = copy.documentLang;
  document.querySelectorAll<HTMLElement>('[data-i18n-key]').forEach((element) => {
    const key = element.dataset.i18nKey;
    if (key && key in copy) element.textContent = copy[key];
  });
  document.querySelectorAll<HTMLElement>('[data-interface-copy]').forEach((element) => {
    const key = element.dataset.interfaceCopy;
    if (!key) return;
    element.textContent = key === 'view' && ui.controls.classList.contains('is-expanded')
      ? copy.hideView
      : copy[key];
  });

  setAttributes('#site-menu', 'siteMenuLabel', ['aria-label']);
  setAttributes('#site-menu-toggle', 'siteMenuLabel', ['aria-label']);
  setAttributes('#site-menu-toggle', 'index', ['title', 'data-tooltip']);
  setAttributes('#site-language-switcher', 'interfaceLanguage', ['aria-label']);
  setAttributes('#controls', 'viewingControls', ['aria-label']);
  setAttributes('#today-button', 'pickDate', ['data-tooltip']);
  setAttributes('#today-button', 'pickDate', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('#today-reset-button', 'today', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('#date-picker', 'pickDate', ['aria-label']);
  setAttributes('#shuffle-button', 'randomDate', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('#fullscreen-button', 'fullscreen', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('.zoom-control', 'zoomControls', ['aria-label']);
  setAttributes('#zoom-out-button', 'zoomOut', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('#zoom-in-button', 'zoomIn', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('#reset-view-button', 'resetView', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('#help-button', 'help', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('.density-control', 'densityGroup', ['aria-label']);
  setAttributes('.render-control', 'renderGroup', ['aria-label']);
  setAttributes('.rotation-control', 'routeGroup', ['aria-label']);
  setAttributes('#rotation-direction-button', 'reverse', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('.slider-shell', 'speed', ['data-tooltip']);
  setAttributes('#rotation-speed', 'speed', ['aria-label']);
  setAttributes('.slider-shell .sr-only', 'speed', []);
  const speedReaderLabel = document.querySelector<HTMLElement>('.slider-shell .sr-only');
  if (speedReaderLabel) speedReaderLabel.textContent = interfaceText('speed', language);
  setAttributes('#rotation-preset-button', 'randomPreset', ['title', 'aria-label', 'data-tooltip']);
  setAttributes('.clock-control', 'clockSettings', ['aria-label']);
  setAttributes('.clock-interval-label', 'intervalBefore', ['title']);
  setAttributes('#clock-interval', 'intervalBefore', ['aria-label']);
  setAttributes('#clock-auto-enabled', 'automaticAria', ['aria-label']);
  setAttributes('#clock-close-button', 'closeClock', ['title', 'aria-label']);
  setAttributes('#release-mark', 'buildInfo', ['aria-label']);
  calendarPanel.setAttribute('aria-label', interfaceText('pickDate', language));
  if (shortcutHelpTitle) shortcutHelpTitle.textContent = interfaceText('fullscreenHelpTitle', language);
  if (shortcutHelpIntro) shortcutHelpIntro.textContent = interfaceText('fullscreenHelpIntro', language);
  if (shortcutHelpDismissLabel) shortcutHelpDismissLabel.textContent = interfaceText('fullscreenHelpDismiss', language);
  if (shortcutHelpClose) shortcutHelpClose.textContent = interfaceText('fullscreenHelpClose', language);
  if (shortcutHelpMore) shortcutHelpMore.textContent = interfaceText('fullscreenHelpMore', language);
  const shortcutCopy = {
    escape: 'shortcutEscape',
    dates: 'shortcutDates',
    random: 'shortcutRandom',
    zoom: 'shortcutZoom',
    reset: 'shortcutReset',
    rotation: 'shortcutRotation',
    interface: 'shortcutInterface',
    help: 'shortcutHelp'
  } as const;
  document.querySelectorAll<HTMLElement>('[data-shortcut-copy]').forEach((element) => {
    const key = element.dataset.shortcutCopy as keyof typeof shortcutCopy | undefined;
    if (key) element.textContent = interfaceText(shortcutCopy[key], language);
  });

  densityButtons.forEach((button) => {
    const choice = button.dataset.densityChoice;
    if (!choice) return;
    const suffix = `${choice[0].toUpperCase()}${choice.slice(1)}`;
    button.textContent = interfaceText(`density${suffix}Short`, language);
    const label = interfaceText(`density${suffix}`, language);
    button.title = label;
    button.dataset.tooltip = label;
  });
  renderButtons.forEach((button) => {
    const choice = button.dataset.renderChoice;
    if (!choice) return;
    const suffix = `${choice[0].toUpperCase()}${choice.slice(1)}`;
    button.textContent = interfaceText(`render${suffix}Short`, language);
    const label = interfaceText(`render${suffix}`, language);
    button.title = label;
    button.dataset.tooltip = label;
  });

  siteLanguageSwitcher?.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  window.localStorage.setItem(interfaceLanguageStorageKey, language);
  setControlsExpanded(ui.controls.classList.contains('is-expanded'), false);
  syncClockControls();
  syncControls();
  syncPauseButton(rotationPaused);
  syncHandControlToggle();
  setLabels();
  updateClockTime();
  updateClockQuote(language);
  if (!calendarPanel.hidden) renderCalendar();
}

function toggleFavorite() {
  if (!accountState) {
    openAccountPanel();
    return;
  }

  const favorite = currentFavorite();
  if (favorite) {
    saveFavoriteBouquets(favoriteBouquets.filter((item) => item.id !== favorite.id));
    return;
  }

  saveFavoriteBouquets([createFavorite(), ...favoriteBouquets.filter((item) => item.id !== currentFavoriteId())]);
}

function renderFavoriteButton() {
  if (!favoriteButton) return;
  const saved = Boolean(currentFavorite());
  favoriteButton.classList.toggle('is-saved', saved);
  favoriteButton.setAttribute('aria-pressed', String(saved));
  favoriteButton.title = saved ? '已收藏今日花束' : '收藏今日花束';
}

function renderCollectionList() {
  if (!collectionList || !collectionCount) return;
  collectionCount.textContent = String(favoriteBouquets.length);
  if (favoriteBouquets.length === 0) {
    collectionList.innerHTML = `
      <div class="empty-collection">
        <strong>还没有收藏</strong>
        <span>点亮爱心后，这束花会留在这里。</span>
      </div>
    `;
    return;
  }

  collectionList.innerHTML = favoriteBouquets
    .map(
      (favorite) => `
        <button class="collection-item" type="button" data-favorite-id="${favorite.id}">
          <span class="collection-item-date">${favorite.date}</span>
          <span class="collection-item-title">${favorite.themeName}</span>
          <span class="collection-item-meta">${favorite.flowerPlanName} · ${favorite.themeEnglishName}</span>
        </button>
      `
    )
    .join('');
}

function renderAccountState() {
  const signedIn = Boolean(accountState);
  accountDock?.classList.toggle('is-signed-in', signedIn);
  if (accountOpenTitle) accountOpenTitle.textContent = signedIn ? accountState?.name || '个人花园' : '个人花园';
  if (accountOpenStatus) {
    accountOpenStatus.textContent = signedIn
      ? `${favoriteBouquets.length} 个收藏`
      : '登录后同步收藏';
  }
  if (accountAvatar) accountAvatar.textContent = signedIn ? initials(accountState?.name || '', '花') : '访';
  if (accountPanelTitle) accountPanelTitle.textContent = signedIn ? '你的 DailyFlora 收藏' : '把今天的花束收进个人花园';
  if (loginForm) loginForm.hidden = signedIn;
  if (accountProfile) accountProfile.hidden = !signedIn;
  if (profileAvatar) profileAvatar.textContent = initials(accountState?.name || '', '花');
  if (profileName) profileName.textContent = accountState?.name || 'DailyFlora 用户';
  if (profileEmail) profileEmail.textContent = accountState?.email || '';
  renderFavoriteButton();
  renderCollectionList();
}

function setLabels() {
  const name = bouquetDisplayName(spec);
  const displayDates = formatDisplayDates(spec.dateLabel);
  ui.dateLabel.textContent = 'DAILY COMPOSITION';
  ui.dateCnLabel.hidden = true;
  ui.dateEnLabel.hidden = true;
  ui.themeCnLabel.textContent = `${displayDates.cn}·${displayNameWithoutDate(name.cn)}`;
  ui.themeEnLabel.textContent = `${displayDates.en} ·${displayNameWithoutDate(name.en).toUpperCase()}·`;
  ui.flowerPlanEnLabel.textContent = `${themeEnglishName()} · ${spec.flowerPlan.enName} · ${flowerPlanTextEn()}`;
  ui.flowerPlanLabel.textContent = `${spec.theme.name} · ${spec.flowerPlan.cnName} · ${flowerPlanText()}`;
  ui.flowerPlanLabel.title = `${spec.flowerPlan.reference}\n${spec.flowerPlan.silhouette}\n避免：${spec.flowerPlan.avoid}`;
  if (datePicker) datePicker.value = spec.dateLabel;
  ui.themeLabel.title = bouquetHoverTitle();
  ui.dateLabel.title = bouquetHoverTitle();
  const pickDateLabel = interfaceText('pickDate');
  const randomDateLabel = interfaceText('randomDate');
  todayButton?.setAttribute('title', pickDateLabel);
  todayButton?.setAttribute('aria-label', pickDateLabel);
  todayButton?.setAttribute('data-tooltip', pickDateLabel);
  shuffleButton?.setAttribute('title', randomDateLabel);
  shuffleButton?.setAttribute('aria-label', randomDateLabel);
  shuffleButton?.setAttribute('data-tooltip', randomDateLabel);
  const densitySuffix = `${quality.densityName[0].toUpperCase()}${quality.densityName.slice(1)}`;
  const renderSuffix = `${quality.renderName[0].toUpperCase()}${quality.renderName.slice(1)}`;
  const renderLabel = selectedRender === 'auto'
    ? `${interfaceText('renderAutoShort')}/${interfaceText(`render${renderSuffix}Short`)}`
    : interfaceText(`render${renderSuffix}Short`);
  ui.qualityLabel.textContent = `${interfaceText(`density${densitySuffix}Short`)} · ${renderLabel}`;
  document.title = `DailyFlora - ${name.cn} / ${name.en}`;
  if (!calendarPanel.hidden) {
    renderCalendar();
    positionCalendarPanel();
  }
  renderFavoriteButton();
}

function formatCount(value: number) {
  return value >= 1000 ? value.toLocaleString('en-US') : String(value);
}

function updateDebugPanel() {
  if (!debugMode || !debugPanel) return;
  const stats = scene.getDebugStats();
  debugPanel.dataset.flowerAudit = JSON.stringify(stats.flowerAudit);
  const { flowerRecords: _flowerRecords, ...leafOwnershipCounts } = stats.leafOwnership;
  debugPanel.dataset.leafOwnershipAudit = JSON.stringify(leafOwnershipCounts);
  const heapText = stats.jsHeapUsedMb === null
    ? 'n/a'
    : `${stats.jsHeapUsedMb}/${stats.jsHeapTotalMb} MB`;
  debugPanel.innerHTML = `
    <div class="debug-row"><span>FPS</span><strong>${stats.fps || '--'} / ${stats.targetFps}</strong></div>
    <div class="debug-row"><span>Render</span><strong>${stats.render} · ${stats.density}</strong></div>
    <div class="debug-row"><span>Canvas</span><strong>${stats.canvasWidth}×${stats.canvasHeight} @ ${stats.pixelRatio.toFixed(2)}</strong></div>
    <div class="debug-row"><span>Draw</span><strong>${stats.calls} calls · ${formatCount(stats.triangles)} tris</strong></div>
    <div class="debug-row"><span>Points/Lines</span><strong>${formatCount(stats.points)} / ${formatCount(stats.lines)}</strong></div>
    <div class="debug-row"><span>GPU res</span><strong>${stats.geometries} geo · ${stats.textures} tex</strong></div>
    <div class="debug-row"><span>JS heap</span><strong>${heapText}</strong></div>
    <div class="debug-row"><span>Realistic leaves</span><strong>${stats.leafOwnership.realisticFlowerLeafCount}</strong></div>
    <div class="debug-row"><span>Legacy stems</span><strong>${stats.leafOwnership.temporaryLegacyStemCount}</strong></div>
    <div class="debug-row"><span>Leaves before/after</span><strong>${stats.leafOwnership.beforeTotalLeafCount} → ${stats.leafOwnership.afterTotalLeafCount} (${stats.leafOwnership.totalLeafDelta})</strong></div>
    <div class="debug-row"><span>Loose leaves removed</span><strong>${stats.leafOwnership.beforeLooseLeafCount}</strong></div>
    <div class="debug-row"><span>Ownership errors</span><strong>${stats.leafOwnership.orphanLeafCount}/${stats.leafOwnership.mixedProfileStemCount}/${stats.leafOwnership.mixedArrangementStemCount}/${stats.leafOwnership.unresolvedGeneratedLeafCount}/${stats.leafOwnership.detachedLeafNodeCount}</strong></div>
    <div class="debug-row"><span>Leaf status</span><strong>structural transition</strong></div>
  `;
}

function setupDebugMode() {
  document.body.classList.toggle('is-debug', debugMode);
  if (debugPanel) {
    debugPanel.hidden = !debugMode;
  }
  if (!debugMode) return;
  const debugLink = document.createElement('a');
  debugLink.className = 'site-menu-debug-link';
  debugLink.href = withBasePath('docs/aesthetic-review-dashboard.html?debug=1');
  debugLink.target = '_blank';
  debugLink.rel = 'noopener';
  debugLink.dataset.i18nKey = 'review';
  debugLink.textContent = interfaceText('review');
  siteMenuPanel?.insertBefore(debugLink, siteLanguageSwitcher);

  const reviewLink = document.createElement('a');
  reviewLink.className = 'icon-button review-dashboard-button';
  reviewLink.href = withBasePath('docs/aesthetic-review-dashboard.html?debug=1');
  reviewLink.target = '_blank';
  reviewLink.rel = 'noopener';
  reviewLink.title = interfaceText('review');
  reviewLink.setAttribute('aria-label', interfaceText('review'));
  reviewLink.dataset.tooltip = interfaceText('review');
  reviewLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h14V5z" /><path d="M7 8h10v2H7zM7 12h6v2H7zM15.4 13.6l1.4 1.4-3.6 3.6-2.2-2.2 1.4-1.4.8.8z" /></svg>';
  ui.controls.insertBefore(reviewLink, controlsPanel);
  updateDebugPanel();
  debugTimer = window.setInterval(updateDebugPanel, 650);
}

function syncControls() {
  densityButtons.forEach((button) => {
    const active = button.dataset.densityChoice === selectedDensity;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  renderButtons.forEach((button) => {
    const active = button.dataset.renderChoice === selectedRender;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (rotationSpeedInput) {
    rotationSpeedInput.value = String(speedToSlider(rotationSpeed));
    rotationSpeedInput.setAttribute('aria-valuetext', `${Math.round(rotationSpeed * 1000)}`);
  }

  if (rotationDirectionButton) {
    const label = interfaceText('reverse');
    rotationDirectionButton.classList.toggle('is-reverse', rotationDirection === -1);
    rotationDirectionButton.setAttribute('aria-label', label);
    rotationDirectionButton.setAttribute('data-tooltip', label);
    rotationDirectionButton.title = label;
  }
}

function revealUi() {
  ui.hud.classList.remove('is-hidden');
  ui.controls.classList.remove('is-hidden');
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (ui.controls.classList.contains('is-expanded')) setControlsExpanded(false, false);
  }, ui.controls.classList.contains('is-expanded') ? 7000 : 3200);
}

function hideUiNow() {
  window.clearTimeout(hideTimer);
  ui.hud.classList.add('is-hidden');
  ui.controls.classList.add('is-hidden');
}

function showShortcutHelp() {
  if (!shortcutHelp) return;
  shortcutHelp.hidden = false;
  shortcutHelp.classList.remove('is-visible');
  if (shortcutHelpDismiss) shortcutHelpDismiss.checked = false;
  requestAnimationFrame(() => shortcutHelp.classList.add('is-visible'));
  shortcutHelpClose?.focus();
}

function closeShortcutHelp() {
  if (!shortcutHelp || shortcutHelp.hidden) return;
  fullscreenHelpClosedThisEntry = true;
  if (shortcutHelpDismiss?.checked) {
    window.localStorage.setItem(fullscreenHelpDismissedStorageKey, JSON.stringify({ permanent: true }));
  }
  shortcutHelp.classList.remove('is-visible');
  window.setTimeout(() => {
    if (!shortcutHelp.classList.contains('is-visible')) shortcutHelp.hidden = true;
  }, 180);
  helpButton?.focus();
}

function maybeShowFullscreenHelp() {
  if (fullscreenHelpClosedThisEntry) return;
  const dismissed = safeJsonParse<{ permanent?: boolean }>(
    window.localStorage.getItem(fullscreenHelpDismissedStorageKey),
    {}
  );
  if (dismissed.permanent || window.localStorage.getItem(fullscreenHelpDismissedStorageKey) === 'true') return;
  showShortcutHelp();
}

function resetView() {
  manualZoom = scene.resetView();
  cameraRouteMode = 'orbit';
  pitchAmplitude = 0;
  yawAmplitude = 0;
  distanceAmplitude = 0;
  targetYAmplitude = 0;
  rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
  rotationDirection = 1;
  rotationPaused = false;
  scene.setAutomaticCameraEnabled(true);
  applyRotationSettings();
  syncPauseButton(rotationPaused);
  revealUi();
}

function setControlsExpanded(expanded: boolean, reveal = true) {
  ui.controls.classList.toggle('is-expanded', expanded);
  ui.controls.classList.toggle('is-collapsed', !expanded);
  ui.controlsPanel.hidden = !expanded;
  ui.controlsToggleButton.setAttribute('aria-expanded', String(expanded));
  const label = interfaceText(expanded ? 'hideView' : 'showView');
  ui.controlsToggleButton.setAttribute('aria-label', label);
  ui.controlsToggleButton.setAttribute('data-tooltip', label);
  ui.controlsToggleButton.title = label;
  const language = readInterfaceLanguage();
  const interfaceLabel = ui.controlsToggleButton.querySelector<HTMLElement>('[data-interface-copy="view"]');
  if (interfaceLabel) interfaceLabel.textContent = expanded ? interfaceCopy[language].hideView : interfaceCopy[language].view;
  if (reveal) revealUi();
}

function updateUrl(date: string, seed: string) {
  const next = new URL(window.location.href);
  if (date === todayKey()) {
    next.searchParams.delete('date');
  } else {
    next.searchParams.set('date', date);
  }
  if (seed === date) {
    next.searchParams.delete('seed');
  } else {
    next.searchParams.set('seed', seed);
  }
  next.searchParams.delete('quality');
  if (selectedDensity === 'medium') {
    next.searchParams.delete('density');
  } else {
    next.searchParams.set('density', selectedDensity);
  }
  if (selectedRender === 'auto') {
    next.searchParams.delete('render');
  } else {
    next.searchParams.set('render', selectedRender);
  }
  if (selectedTheme === 'random') {
    next.searchParams.delete('theme');
  } else {
    next.searchParams.set('theme', selectedTheme);
  }
  if (specialReference) {
    next.pathname = specialPathname(specialReference);
    next.searchParams.delete('special');
    next.searchParams.delete('seed');
    if (date === specialReference.date) {
      next.searchParams.delete('date');
    } else {
      next.searchParams.set('date', date);
    }
  }
  window.history.replaceState({}, '', next);
}

function syncTodayMode(date: string, seed: string) {
  followsToday = !specialReference && date === todayKey() && seed === date;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map((part) => Number(part));
  const fallback = new Date();
  return {
    year: Number.isFinite(year) ? year : fallback.getFullYear(),
    month: Number.isFinite(month) ? THREEClamp(month - 1, 0, 11) : fallback.getMonth(),
    day: Number.isFinite(day) ? THREEClamp(day, 1, 31) : fallback.getDate()
  };
}

function dateKeyFromParts(year: number, month: number, day: number) {
  const paddedMonth = String(month + 1).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

function clampDateKeyToToday(dateKey: string) {
  return dateKey > maxSelectableDate ? maxSelectableDate : dateKey;
}

function dateKeyWithOffset(dateKey: string, offsetDays: number) {
  const { year, month, day } = parseDateKey(dateKey);
  const next = new Date(Date.UTC(year, month, day + offsetDays));
  return clampDateKeyToToday(dateKeyFromParts(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()));
}

function openDate(dateKey: string) {
  previewCount = 0;
  closeCalendar();
  rebuild(dateKey, dateKey);
  syncTodayMode(dateKey, dateKey);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function firstWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

function selectCalendarDate(dateKey: string) {
  previewCount = 0;
  rebuild(dateKey, dateKey);
  syncTodayMode(dateKey, dateKey);
  closeCalendar();
}

function closeCalendar() {
  if (calendarPanel.hidden) return;
  calendarPanel.hidden = true;
  todayButton?.setAttribute('aria-expanded', 'false');
}

function positionCalendarPanel() {
  if (!todayButton) return;
  const margin = 12;
  const buttonRect = todayButton.getBoundingClientRect();
  const panelRect = calendarPanel.getBoundingClientRect();
  const panelWidth = panelRect.width || 292;
  const panelHeight = panelRect.height || 332;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const preferredLeft = buttonRect.right - panelWidth;
  const left = THREEClamp(preferredLeft, margin, Math.max(margin, viewportWidth - panelWidth - margin));
  const aboveTop = buttonRect.top - panelHeight - 10;
  const belowTop = buttonRect.bottom + 10;
  const hasRoomAbove = aboveTop >= margin;
  const preferredTop = hasRoomAbove ? aboveTop : belowTop;
  const top = THREEClamp(preferredTop, margin, Math.max(margin, viewportHeight - panelHeight - margin));

  calendarPanel.style.left = `${left}px`;
  calendarPanel.style.top = `${top}px`;
}

function renderCalendar() {
  const selected = parseDateKey(spec.dateLabel);
  const today = parseDateKey(todayKey());
  const totalDays = daysInMonth(calendarView.year, calendarView.month);
  const leadingDays = firstWeekday(calendarView.year, calendarView.month);
  const monthLabel = `${calendarView.year}.${String(calendarView.month + 1).padStart(2, '0')}`;
  const dayButtons: string[] = [];

  for (let index = 0; index < leadingDays; index += 1) {
    dayButtons.push('<span class="calendar-day is-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = dateKeyFromParts(calendarView.year, calendarView.month, day);
    const isSelected =
      selected.year === calendarView.year && selected.month === calendarView.month && selected.day === day;
    const isToday = today.year === calendarView.year && today.month === calendarView.month && today.day === day;
    const isFuture = dateKey > maxSelectableDate;
    dayButtons.push(`
      <button
        class="calendar-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}${isFuture ? ' is-disabled' : ''}"
        type="button"
        data-calendar-date="${dateKey}"
        aria-pressed="${isSelected}"
        aria-disabled="${isFuture}"
        ${isFuture ? 'disabled' : ''}
      >${day}</button>
    `);
  }

  const nextMonthDateKey = dateKeyFromParts(
    calendarView.month === 11 ? calendarView.year + 1 : calendarView.year,
    calendarView.month === 11 ? 0 : calendarView.month + 1,
    1
  );
  const canGoNext = nextMonthDateKey <= maxSelectableDate;
  const weekdays = interfaceText('weekdays').split(',');

  calendarPanel.innerHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-button" type="button" data-calendar-nav="-1" aria-label="${interfaceText('previousMonth')}">‹</button>
      <strong>${monthLabel}</strong>
      <button class="calendar-nav-button" type="button" data-calendar-nav="1" aria-label="${interfaceText('nextMonth')}" ${canGoNext ? '' : 'disabled aria-disabled="true"'}>›</button>
    </div>
    <div class="calendar-weekdays" aria-hidden="true">
      ${weekdays.map((weekday) => `<span>${weekday}</span>`).join('')}
    </div>
    <div class="calendar-grid">${dayButtons.join('')}</div>
  `;
}

function openCalendar() {
  calendarView = parseDateKey(spec.dateLabel);
  renderCalendar();
  calendarPanel.hidden = false;
  todayButton?.setAttribute('aria-expanded', 'true');
  positionCalendarPanel();
}

function toggleCalendar() {
  if (calendarPanel.hidden) {
    openCalendar();
  } else {
    closeCalendar();
  }
}

function applyRotationSettings(pitch?: number) {
  scene.setRotationSettings({
    speed: rotationSpeed,
    direction: rotationDirection,
    pitch,
    mode: cameraRouteMode,
    pitchAmplitude,
    yawAmplitude,
    distanceAmplitude,
    targetYAmplitude
  });
  syncControls();
}

function applyZoom(nextZoom: number) {
  manualZoom = scene.setZoomOffset(THREEClamp(nextZoom, -1.35, 2.05));
  revealUi();
}

function zoomBy(delta: number) {
  manualZoom = scene.zoomBy(delta);
  revealUi();
}

function applyRoutePreset(preset: (typeof rotationPresets)[number]) {
  manualRotation = true;
  rotationSpeed = preset.speed;
  rotationDirection = preset.direction;
  cameraRouteMode = preset.mode;
  pitchAmplitude = preset.pitchAmplitude;
  yawAmplitude = preset.yawAmplitude;
  distanceAmplitude = preset.distanceAmplitude;
  targetYAmplitude = preset.targetYAmplitude;
  applyRotationSettings(preset.pitch);
}

function randomDateKey() {
  const start = new Date('2026-01-01T00:00:00');
  const end = new Date(`${maxSelectableDate}T00:00:00`);
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((end.getTime() - start.getTime()) / dayMs);
  const date = new Date(start.getTime() + Math.floor(Math.random() * (days + 1)) * dayMs);
  return date.toISOString().slice(0, 10);
}

function rebuild(date: string, seed: string) {
  spec = specialReference ? createSpecialSpec(specialReference, date) : createDailySpec(date, seed, selectedTheme);
  if (!manualRotation) {
    rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
    cameraRouteMode = 'orbit';
    pitchAmplitude = 0;
    yawAmplitude = 0;
    distanceAmplitude = 0;
    targetYAmplitude = 0;
  }
  scene.rebuild(spec, quality);
  applyRotationSettings();
  setLabels();
  updateUrl(date, seed);
  params = { date, seed, density: selectedDensity, render: selectedRender, theme: selectedTheme };
  revealUi();
}

function scheduleDailyRollover() {
  if (specialReference) return;

  window.clearTimeout(dateRolloverTimer);
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 3, 0);
  const delay = Math.max(1000, nextDay.getTime() - now.getTime());

  dateRolloverTimer = window.setTimeout(() => {
    const date = todayKey();
    if (followsToday && spec.dateLabel !== date) {
      rebuild(date, date);
      syncTodayMode(date, date);
    }
    scheduleDailyRollover();
  }, delay);
}

function createSpecialOverlay() {
  if (!specialReference) return;
  document.body.classList.add('is-special');

  const overlay = document.createElement('section');
  overlay.className = 'special-start-overlay';
  overlay.setAttribute('aria-label', 'Start special bouquet');
  overlay.innerHTML = `
    <div class="special-start-copy">
      <p class="special-date">1997.01.29</p>
      <h1>A galaxy, wound around its own light.</h1>
      <button class="special-start-button" type="button">Start the bouquet</button>
    </div>
  `;

  const caption = document.createElement('aside');
  caption.className = 'special-caption';
  const versionText = specialReference.versionLabel ? ` · ${specialReference.versionLabel}` : '';
  caption.innerHTML = `
    <p>NGC 2787 · seen by Hubble</p>
    <p>A bouquet remembered for 2026.06.29${versionText}</p>
  `;

  const quote = document.createElement('aside');
  quote.className = specialReference.quoteStanzas ? 'special-quote is-custom' : 'special-quote';
  if (specialReference.quoteStanzas) {
    const zh = specialReference.quoteStanzas
      .map((stanza) => `<p lang="zh-CN">${stanza.replace(/\n/g, '<br />')}</p>`)
      .join('');
    const en = (specialReference.quoteTranslationStanzas || [])
      .map((stanza) => `<p lang="en">${stanza.replace(/\n/g, '<br />')}</p>`)
      .join('');
    quote.innerHTML = `
      <div class="special-quote-language special-quote-zh">${zh}</div>
      ${en ? `<div class="special-quote-language special-quote-en">${en}</div>` : ''}
    `;
  } else {
    quote.innerHTML = `
      <p>Some flowers last for days.<br />Some light travels long enough to arrive as a memory.</p>
      <p lang="zh-CN">有些花会谢。<br />有些光，会走很久才抵达。</p>
    `;
  }

  const credit = document.createElement('aside');
  credit.className = 'special-credit';
  credit.textContent = 'Image source: NASA / ESA / Hubble';

  const muteButton = document.createElement('button');
  muteButton.className = 'special-mute-button';
  muteButton.type = 'button';
  muteButton.hidden = true;
  const syncMuteButton = () => {
    muteButton.classList.toggle('is-muted', specialAudioMuted);
    muteButton.setAttribute('aria-pressed', String(specialAudioMuted));
    muteButton.setAttribute('aria-label', specialAudioMuted ? 'Unmute audio' : 'Mute audio');
    muteButton.title = specialAudioMuted ? 'Unmute audio' : 'Mute audio';
    muteButton.innerHTML = specialAudioMuted
      ? '<svg class="special-audio-glyph" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.2 18.5H6.9a1.25 1.25 0 0 1-1.25-1.25v-2.5A1.25 1.25 0 0 1 6.9 13.5h2.3l5.15-4.05v13.1L9.2 18.5Z" /><path d="M19.2 11.4l5.2 9.2" /></svg>'
      : '<svg class="special-audio-glyph" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.2 18.5H6.9a1.25 1.25 0 0 1-1.25-1.25v-2.5A1.25 1.25 0 0 1 6.9 13.5h2.3l5.15-4.05v13.1L9.2 18.5Z" /><path d="M18.55 12.6c.95.9 1.45 2.05 1.45 3.4s-.5 2.5-1.45 3.4" /><path d="M21.45 10.05c1.6 1.6 2.45 3.65 2.45 5.95s-.85 4.35-2.45 5.95" /></svg>';
  };
  syncMuteButton();
  muteButton.addEventListener('click', () => {
    specialAudioMuted = !specialAudioMuted;
    if (specialAudio) specialAudio.muted = specialAudioMuted;
    syncMuteButton();
  });

  document.body.append(overlay, caption, quote, credit, muteButton);

  try {
    specialAudio = new Audio(withBasePath(specialReference.audioPath));
    specialAudio.loop = true;
    specialAudio.preload = 'auto';
    specialAudio.volume = 0.42;
    specialAudio.muted = false;
  } catch {
    specialAudio = null;
  }

  overlay.querySelector<HTMLButtonElement>('.special-start-button')?.addEventListener('click', async () => {
    overlay.classList.add('is-dismissed');
    try {
      await specialAudio?.play();
      muteButton.hidden = !specialAudio;
    } catch {
      specialAudio = null;
      muteButton.hidden = true;
    }
    window.setTimeout(() => overlay.remove(), 900);
  });
}

function rebuildQuality(nextDensity = selectedDensity, nextRender = selectedRender) {
  const next = resolveQuality(nextDensity, nextRender);
  const changed = next.densityName !== quality.densityName || next.renderName !== quality.renderName;
  quality = next;
  if (changed) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    scene.setZoomOffset(manualZoom);
  }
  setLabels();
  syncControls();
  updateUrl(spec.dateLabel, spec.seed);
  revealUi();
}

function setDensity(nextDensity: DensityName) {
  selectedDensity = nextDensity;
  rebuildQuality();
}

function setRender(nextRender: RenderQualityName) {
  selectedRender = nextRender;
  rebuildQuality();
}

accountOpenButton?.addEventListener('click', () => {
  if (accountPanel?.classList.contains('is-open')) {
    closeAccountPanel();
  } else {
    openAccountPanel();
  }
});

accountCloseButton?.addEventListener('click', closeAccountPanel);

favoriteButton?.addEventListener('click', () => {
  toggleFavorite();
  revealUi();
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = loginNameInput?.value.trim() || 'DailyFlora 用户';
  const email = loginEmailInput?.value.trim() || `${name.replace(/\s+/g, '').toLowerCase()}@dailyflora.local`;
  saveAccountState({ name, email });
  if (!currentFavorite()) {
    saveFavoriteBouquets([createFavorite(), ...favoriteBouquets]);
  }
});

logoutButton?.addEventListener('click', () => {
  saveAccountState(null);
});

collectionList?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>('[data-favorite-id]');
  if (!button) return;
  const favorite = favoriteBouquets.find((item) => item.id === button.dataset.favoriteId);
  if (!favorite) return;
  previewCount = 0;
  closeCalendar();
  rebuild(favorite.date, favorite.seed);
  syncTodayMode(favorite.date, favorite.seed);
  closeAccountPanel();
});

referenceFileInput?.addEventListener('change', async () => {
  const file = referenceFileInput.files?.[0];
  if (!file) return;
  try {
    await handleReferenceFile(file);
  } catch {
    referenceState = null;
    renderReferenceState();
    if (referenceResult) {
      referenceResult.hidden = false;
      referenceResult.textContent = '这张图暂时读不了，换一张试试。';
    }
  }
});

referenceGenerateButton?.addEventListener('click', generateFromReference);

siteMenuToggle?.addEventListener('click', () => {
  if (siteMenuPanel?.hidden) setControlsExpanded(false, false);
  toggleSiteMenu();
  revealUi();
});

siteLanguageSwitcher?.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-language]');
  const language = button?.dataset.language;
  if (!language || !(language in interfaceCopy)) return;
  updateInterfaceLanguage(language as InterfaceLanguage);
  revealUi();
});

document.addEventListener('pointerdown', (event) => {
  const target = event.target;
  if (siteMenuPanel && siteMenu && !siteMenuPanel.hidden && target instanceof Node && !siteMenu.contains(target)) {
    toggleSiteMenu(false);
  }
  if (!accountPanel) return;
  if (
    accountPanel.hidden ||
    !(target instanceof Node) ||
    accountPanel.contains(target) ||
    accountDock?.contains(target)
  ) {
    return;
  }
  closeAccountPanel();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    toggleSiteMenu(false);
  }
});

controlsToggleButton?.addEventListener('click', () => {
  toggleSiteMenu(false);
  setControlsExpanded(!controls.classList.contains('is-expanded'));
});

function syncPauseButton(paused: boolean) {
  if (!pauseButton) return;
  const label = interfaceText(paused ? 'resume' : 'pause');
  pauseButton.setAttribute('aria-label', label);
  pauseButton.setAttribute('data-tooltip', label);
  pauseButton.title = label;
  pauseButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>';
}

pauseButton?.addEventListener('click', () => {
  rotationPaused = scene.togglePause();
  syncPauseButton(rotationPaused);
  revealUi();
});

todayButton?.addEventListener('click', () => {
  toggleCalendar();
  revealUi();
});

todayResetButton?.addEventListener('click', () => {
  openDate(todayKey());
  revealUi();
});

datePicker?.addEventListener('change', () => {
  if (!datePicker.value) return;
  const selectedDate = clampDateKeyToToday(datePicker.value);
  if (datePicker.value !== selectedDate) datePicker.value = selectedDate;
  previewCount = 0;
  rebuild(selectedDate, selectedDate);
  syncTodayMode(selectedDate, selectedDate);
  datePicker.blur();
});

calendarPanel.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const navValue = target.dataset.calendarNav;
  if (navValue) {
    const nextMonth = calendarView.month + Number(navValue);
    const nextYear = calendarView.year + (nextMonth < 0 ? -1 : nextMonth > 11 ? 1 : 0);
    const normalizedNextMonth = nextMonth < 0 ? 11 : nextMonth > 11 ? 0 : nextMonth;
    if (dateKeyFromParts(nextYear, normalizedNextMonth, 1) > maxSelectableDate) return;
    calendarView.month = normalizedNextMonth;
    calendarView.year = nextYear;
    renderCalendar();
    positionCalendarPanel();
    revealUi();
    return;
  }

  const dateKey = target.dataset.calendarDate;
  if (dateKey) {
    if (dateKey > maxSelectableDate) return;
    selectCalendarDate(dateKey);
  }
});

document.addEventListener('pointerdown', (event) => {
  const target = event.target;
  if (
    calendarPanel.hidden ||
    !(target instanceof Node) ||
    calendarPanel.contains(target) ||
    todayButton?.contains(target)
  ) {
    return;
  }
  closeCalendar();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCalendar();
    closeAccountPanel();
  }
});

shuffleButton?.addEventListener('click', () => {
  const date = randomDateKey();
  previewCount = 0;
  closeCalendar();
  rebuild(date, date);
  syncTodayMode(date, date);
});

resetViewButton?.addEventListener('click', resetView);
helpButton?.addEventListener('click', showShortcutHelp);
shortcutHelpClose?.addEventListener('click', closeShortcutHelp);
shortcutHelpX?.addEventListener('click', closeShortcutHelp);
shortcutHelp?.addEventListener('pointerdown', (event) => {
  if (event.target === shortcutHelp) closeShortcutHelp();
});

fullscreenButton?.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn('Fullscreen request was not completed.', error);
  }
  revealUi();
});

document.addEventListener('fullscreenchange', () => {
  if (!fullscreenButton) return;
  const label = interfaceText(document.fullscreenElement ? 'exitFullscreen' : 'fullscreen');
  fullscreenButton.setAttribute('aria-label', label);
  fullscreenButton.setAttribute('data-tooltip', label);
  fullscreenButton.title = label;
  if (document.fullscreenElement) {
    fullscreenHelpClosedThisEntry = false;
    maybeShowFullscreenHelp();
  } else if (shortcutHelp && !shortcutHelp.hidden) {
    closeShortcutHelp();
    fullscreenHelpClosedThisEntry = false;
  } else {
    fullscreenHelpClosedThisEntry = false;
  }
});

zoomInButton?.addEventListener('click', () => {
  zoomBy(-0.28);
});

zoomOutButton?.addEventListener('click', () => {
  zoomBy(0.28);
});

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const normalized = THREEClamp(event.deltaY / 520, -0.42, 0.42);
    applyZoom(manualZoom + normalized);
  },
  { passive: false }
);

densityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDensity(normalizeDensity(button.dataset.densityChoice || 'medium'));
  });
});

renderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setRender(normalizeRender(button.dataset.renderChoice || 'auto'));
  });
});

rotationSpeedInput?.addEventListener('input', () => {
  manualRotation = true;
  rotationSpeed = sliderToSpeed(rotationSpeedInput.value);
  applyRotationSettings();
  revealUi();
});

rotationDirectionButton?.addEventListener('click', () => {
  manualRotation = true;
  rotationDirection = rotationDirection === 1 ? -1 : 1;
  applyRotationSettings();
  revealUi();
});

rotationPresetButton?.addEventListener('click', () => {
  const preset = rotationPresets[Math.floor(Math.random() * rotationPresets.length)];
  applyRoutePreset({
    ...preset,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: THREEClamp(preset.speed * (0.78 + Math.random() * 0.58), minRotationSpeed, maxRotationSpeed)
  });
  revealUi();
});

clockToggleButton?.addEventListener('click', () => {
  const visible = idleClock.toggleManual();
  if (visible) {
    hideUiNow();
  } else {
    revealUi();
  }
});

clockCloseButton?.addEventListener('click', () => {
  idleClock.hideVisible();
  revealUi();
});

function updateClockIntervalFrom(input: HTMLInputElement | null) {
  if (!input) return;
  updateClockSettings({ intervalMinutes: normalizeClockInterval(Number(input.value)) });
}

[clockIntervalInput].forEach((input) => {
  input?.addEventListener('change', () => updateClockIntervalFrom(input));
});

[clockAutoEnabledInput].forEach((input) => {
  input?.addEventListener('change', () => updateClockSettings({ autoEnabled: input.checked }));
});

async function startHandControl() {
  const { startDailyFloraHandControl } = await import('./dailyFloraHandControl');
  const densityOrder: DensityName[] = ['low', 'medium', 'high'];
  const renderOrder: Array<Exclude<RenderQualityName, 'auto'>> = ['low', 'medium', 'high'];
  let immersive = false;
  const actions: DailyFloraHandActions = {
    cycleDensity: () => {
      const index = densityOrder.indexOf(selectedDensity);
      setDensity(densityOrder[(index + 1) % densityOrder.length]);
    },
    cycleRender: () => {
      const current = selectedRender === 'auto' ? quality.renderName : selectedRender;
      const index = renderOrder.indexOf(current);
      setRender(renderOrder[(index + 1) % renderOrder.length]);
    },
    toggleClock: () => {
      const visible = idleClock.toggleManual();
      if (visible) hideUiNow();
      else revealUi();
    },
    setAutomaticCameraEnabled: (enabled) => {
      scene.setAutomaticCameraEnabled(enabled);
      rotationPaused = !enabled;
      syncPauseButton(rotationPaused);
      revealUi();
    },
    toggleImmersive: () => {
      immersive = !immersive;
      document.body.classList.toggle('is-hand-control-immersive', immersive);
    },
    moveFramingBy: (deltaX, deltaY) => {
      scene.moveGestureFramingBy(-deltaX, -deltaY);
    },
    rotateBy: (deltaYaw, deltaPitch) => {
      scene.rotateGestureBy(deltaYaw, deltaPitch);
    },
    zoomBy: (delta) => {
      zoomBy(delta);
    }
  };
  const stop = startDailyFloraHandControl(actions);
  return () => {
    stop();
    document.body.classList.remove('is-hand-control-immersive');
  };
}

let stopHandControl: (() => void) | null = null;
let handControlLoading = false;

function syncHandControlToggle() {
  if (!handControlToggle) return;
  const active = stopHandControl !== null;
  handControlToggle.classList.toggle('is-loading', handControlLoading);
  handControlToggle.disabled = handControlLoading;
  handControlToggle.setAttribute('aria-pressed', String(active));
  const label = interfaceText(active ? 'handOff' : 'handOn');
  handControlToggle.setAttribute('aria-label', label);
  handControlToggle.setAttribute('data-tooltip', label);
  handControlToggle.title = label;
}

async function enableHandControl() {
  if (stopHandControl || handControlLoading) return;
  handControlLoading = true;
  syncHandControlToggle();
  try {
    stopHandControl = await startHandControl();
  } catch (error) {
    console.error('Unable to start hand control', error);
  } finally {
    handControlLoading = false;
    syncHandControlToggle();
  }
}

function disableHandControl() {
  stopHandControl?.();
  stopHandControl = null;
  syncHandControlToggle();
}

handControlToggle?.addEventListener('click', () => {
  if (stopHandControl) disableHandControl();
  else void enableHandControl();
});

window.addEventListener('keydown', (event) => {
  const target = event.target;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return;
  }

  if (event.key === 'Escape' && shortcutHelp && !shortcutHelp.hidden) {
    event.preventDefault();
    closeShortcutHelp();
    return;
  }
  if (event.key === '?') {
    event.preventDefault();
    showShortcutHelp();
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    openDate(dateKeyWithOffset(spec.dateLabel, event.key === 'ArrowLeft' ? -1 : 1));
    return;
  }
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault();
    openDate(randomDateKey());
    return;
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    zoomBy(-0.28);
    return;
  }
  if (event.key === '-') {
    event.preventDefault();
    zoomBy(0.28);
    return;
  }
  if (event.key === '0') {
    event.preventDefault();
    resetView();
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    pauseButton?.click();
    return;
  }
  if (event.key.toLowerCase() === 'h') {
    event.preventDefault();
    document.body.classList.toggle('is-interface-hidden');
  }
});

document.querySelectorAll<HTMLElement>('.controls [data-tooltip]').forEach((element) => {
  let longPressTimer = 0;
  let touchTooltipHideTimer = 0;
  const hideTouchTooltip = () => {
    window.clearTimeout(longPressTimer);
    window.clearTimeout(touchTooltipHideTimer);
    element.classList.remove('is-tooltip-visible');
  };
  element.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    window.clearTimeout(longPressTimer);
    window.clearTimeout(touchTooltipHideTimer);
    longPressTimer = window.setTimeout(() => {
      element.classList.add('is-tooltip-visible');
      touchTooltipHideTimer = window.setTimeout(() => element.classList.remove('is-tooltip-visible'), 2400);
    }, 480);
  });
  element.addEventListener('pointerup', () => {
    window.clearTimeout(longPressTimer);
  });
  element.addEventListener('pointercancel', hideTouchTooltip);
  element.addEventListener('pointerleave', () => {
    window.clearTimeout(longPressTimer);
  });
});

window.addEventListener('resize', () => {
  const nextQuality = resolveQuality(selectedDensity, selectedRender);
  const qualityChanged = nextQuality.densityName !== quality.densityName || nextQuality.renderName !== quality.renderName;
  quality = nextQuality;
  scene.resize();
  if (qualityChanged) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    setLabels();
  }
  if (!calendarPanel.hidden) positionCalendarPanel();
});

['pointermove', 'pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-clock-interaction]')) {
      if (!clockDisplaySource) revealUi();
      return;
    }
    if (clockDisplaySource === 'manual' && target instanceof Element && target.closest('#clock-overlay')) {
      return;
    }
    revealUi();
    idleClock.noteActivity();
  }, { passive: true });
});

window.addEventListener('focus', () => idleClock.noteActivity());

window.addEventListener('beforeunload', () => scene.stop());
window.addEventListener('beforeunload', () => window.clearInterval(debugTimer));
window.addEventListener('beforeunload', () => window.clearTimeout(dateRolloverTimer));
window.addEventListener('beforeunload', () => window.clearInterval(clockTickTimer));
window.addEventListener('beforeunload', () => idleClock.stop());
window.addEventListener('beforeunload', () => stopHandControl?.(), { once: true });

updateInterfaceLanguage(readInterfaceLanguage());
if (searchParams.get('tutorial') === 'fullscreen') {
  fullscreenHelpClosedThisEntry = false;
  window.setTimeout(showShortcutHelp, 0);
} else if (searchParams.get('tutorial') === 'view') {
  window.setTimeout(() => {
    setControlsExpanded(true);
    controlsToggleButton.focus();
  }, 0);
} else if (searchParams.get('tutorial') === 'hand') {
  window.setTimeout(() => {
    setControlsExpanded(true);
    handControlToggle?.focus();
  }, 0);
}
renderAccountState();
setupDebugMode();
if (specialReference) {
  rotationSpeed = 0.024;
  cameraRouteMode = 'figure-eight';
  pitchAmplitude = 0.16;
  yawAmplitude = 0.2;
  distanceAmplitude = 0.18;
  targetYAmplitude = 0.08;
  createSpecialOverlay();
}
applyRotationSettings();
scene.setZoomOffset(manualZoom);
scheduleDailyRollover();
syncClockControls();
idleClock.start();
revealUi();
scene.start();
