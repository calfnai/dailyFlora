import { aboutTranslations } from "./about";

export const locales = ['en', 'zh-CN', 'es', 'fr', 'pt', 'it', 'ja'] as const;

export type Locale = (typeof locales)[number];

type TranslationTree = {
  [key: string]: string | TranslationTree;
};

export const localeStorageKey = 'dailyflora.locale.v1';

export const localeButtons: Record<Locale, { label: string; aria: string; lang: string }> = {
  en: { label: 'EN', aria: 'Switch to English', lang: 'en' },
  'zh-CN': { label: '中', aria: '切换为简体中文', lang: 'zh-CN' },
  es: { label: 'ES', aria: 'Cambiar a español', lang: 'es' },
  fr: { label: 'FR', aria: 'Passer en français', lang: 'fr' },
  pt: { label: 'PT', aria: 'Mudar para português', lang: 'pt' },
  it: { label: 'IT', aria: 'Passa all’italiano', lang: 'it' },
  ja: { label: '日', aria: '日本語に切り替える', lang: 'ja' }
};

export const translations: Record<Locale, TranslationTree> = {
  en: {
    meta: {
      homeTitle: 'DailyFlora - A bouquet for every day',
      homeDescription: 'DailyFlora grows a collectible 3D digital bouquet from each date.',
      aboutTitle: 'About DailyFlora - A bouquet for every day',
      aboutDescription: 'About DailyFlora, an independent digital-art project where dates meet flowers.',
      memberTitle: 'DailyFlora Member Garden',
      memberDescription: 'Register, sign in, save bouquets, and create private DailyFlora records on this device.',
      objectsTitle: 'DailyFlora Objects & Collaborations',
      objectsDescription: 'Future DailyFlora objects, ambient displays, and florist collaborations.',
      platformsTitle: 'DailyFlora Platforms',
      platformsDescription: 'DailyFlora platform status across web, desktop, mobile, and ambient screens.',
      termsTitle: 'DailyFlora Terms of Use',
      privacyTitle: 'DailyFlora Privacy Policy',
      creditsTitle: 'DailyFlora Credits & Attributions',
      copyrightTitle: 'DailyFlora Copyright Notice',
      tutorialTitle: 'DailyFlora How to Use',
      tutorialDescription: 'A quiet guide to viewing, saving, and living with a DailyFlora bouquet.',
      legalDescription: 'DailyFlora legal information, credits, privacy, copyright, and usage terms.'
    },
    common: {
      today: "Today's bouquet",
      member: 'My garden',
      about: 'About DailyFlora',
      objects: 'Objects & Collaborations',
      platforms: 'Platforms',
      scifi: 'SciFi Flora',
      collect: 'Keep this bouquet',
      openWeb: 'Open the web version',
      version: 'Read release code...',
      system: 'System',
      explore: 'Explore',
      close: 'Close',
      localOnly: 'Saved on this device only',
      language: 'Language',
      siteNavigation: 'Site navigation',
      signInExisting: 'Sign in to an existing account',
      createAccount: 'Create account',
      guestAuthHint: 'Sign in to sync your collection; create an account if this is your first visit.',
      copyright: '© 2026 CALFN LAU. All rights reserved.',
      brandHome: 'DailyFlora home'
    },
    index: {
      index: 'INDEX',
      view: 'VIEW',
      hideView: 'CLOSE',
      siteMenu: 'DailyFlora site menu',
      currentBouquet: "Today's bouquet",
      myGarden: 'My garden',
      about: 'About DailyFlora',
      objects: 'Objects & Collaborations',
      platforms: 'Platforms',
      favorite: 'Keep this bouquet',
      debug: 'Aesthetic review',
      openGarden: 'Open my garden',
      favoriteToday: "Save today's bouquet",
      savedToday: "Today's bouquet is saved",
      gardenTitle: 'My garden',
      gardenStatusGuest: 'Sign in to keep bouquets',
      gardenStatusSigned: '{count} saved',
      accountPanelTitleGuest: "Keep today's bouquet in your garden",
      accountPanelTitleSigned: 'Your DailyFlora collection',
      loginName: 'Your name',
      loginNamePlaceholder: 'For example: Flora',
      loginEmail: 'Email',
      loginSubmit: 'Create a local garden and save',
      logout: 'Sign out',
      collection: 'My collection',
      emptyTitle: 'No saved bouquets yet',
      emptyBody: 'Light the heart and this bouquet will stay here.',
      referenceTitle: 'Start from a reference image',
      referenceBody: 'DailyFlora reads color and file name on this device to preview a new bouquet. Nothing is uploaded.',
      referenceChoose: 'Choose a reference image',
      referenceNote: 'Preference note',
      referencePlaceholder: 'For example: lighter, cooler, keep the branches',
      referenceGenerate: 'Generate from reference',
      referenceReading: 'Reading the reference image...',
      referenceReady: 'Matched {theme}. You can generate now.',
      referenceError: 'This image could not be read. Try another one.',
      referenceDone: 'Generated from {theme}. Use the heart to save it.'
    },
    view: {
      show: 'Show viewing controls',
      hide: 'Hide viewing controls',
      date: 'Pick bouquet date',
      dateWithName: 'Pick bouquet date: {name}',
      random: 'Preview another date',
      fullscreen: 'Fullscreen',
      handOn: 'Enable hand control',
      handOff: 'Disable hand control',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      density: 'Bouquet density',
      densityLow: 'Sparse',
      densityMedium: 'Medium',
      densityHigh: 'Dense',
      render: 'Render precision',
      renderAuto: 'Auto',
      renderLow: 'Battery saver',
      renderMedium: 'Clear spheres',
      renderHigh: 'Detailed',
      pause: 'Pause rotation',
      resume: 'Resume rotation',
      reverse: 'Reverse current camera route',
      speed: 'Camera route speed',
      preset: 'Random camera route preset',
      clock: 'Clock',
      showClock: 'Show clock',
      hideClock: 'Hide clock',
      howToUse: 'How to use',
      clockMinutes: 'min',
      clockAuto: 'Auto',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      weekdays: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'
    },
    tutorial: {
      title: 'HOW TO USE',
      lead: 'A quiet guide to keeping a flower on the screen.',
      screenshotCaption: 'A quiet place to return to a flower you kept.',
      basicsTitle: 'The daily bouquet',
      basicsBody: 'Every date grows its own bouquet. Drag the flower to look around, use the wheel or plus and minus to change the distance, and open VIEW for the rest of the controls.',
      controlsTitle: 'VIEW controls',
      controlsBody: 'Choose a date, change density and clarity, pause the camera, or open the clock. Press O to open VIEW and Esc to close an open mode.',
      fullscreenTitle: 'Fullscreen',
      fullscreenBody: 'Use the fullscreen button for an uninterrupted room-like view. Press F to enter or leave fullscreen; O still opens VIEW while fullscreen is active.',
      gestureTitle: 'Hand control',
      gestureBody: 'Enable hand control from VIEW, allow camera access, then use an open hand to move through the bouquet. The camera is used locally by the browser.',
      clockTitle: 'Clock mode',
      clockBody: 'Clock mode shows the current time, date, a rotating quote, and a clock-focused bouquet layout. Open it from VIEW, or let Auto start it after the selected quiet interval. Press Esc to exit.',
      acknowledge: 'Got it',
      openHome: 'Open today’s flower',
      openGesture: 'Open hand-control tutorial',
      openFullscreen: 'Open fullscreen tutorial',
      openClock: 'Open clock tutorial',
      openBasics: 'Open the basics tutorial'
    },
    about: {
      eyebrow: 'A BOUQUET FOR EVERY DAY',
      title: 'Where dates meet flowers.',
      lead: 'In the dark, a bouquet slowly takes form. DailyFlora lets each date become a seed, growing color, stems, air, and a quiet 3D bouquet for the day.',
      primary: "See today's flower",
      secondary: 'Keep a day in bloom',
      captionTitle: 'Growing today',
      captionBody: 'A live bouquet shaped by date and floral rules',
      manifestoEyebrow: 'Why it exists',
      manifestoTitle: 'A screen can hold a sign of life, not only a task.',
      manifestoP1: 'DailyFlora began with a simple wish: a screen at home can be more than tools and alerts. It can behave like a windowsill, holding a bouquet when nothing else needs to happen.',
      manifestoP2: 'It does not copy one real arrangement. It turns color, outline, density, branch lines, and air into rules that can keep evolving.',
      quote: 'This is not an image you need to finish.',
      principlesEyebrow: 'What guides it',
      principlesTitle: 'The work is not about having more flowers.',
      p1Title: 'Different each day, still recognizable',
      p1Body: 'Generation brings surprise; aesthetic rules keep the edges. DailyFlora wants changing order, not uncontrolled randomness.',
      p2Title: 'Let air become part of the bouquet',
      p2Body: 'Color lives through small rhythms, directional differences, and room between stems. Leaves hold the space instead of filling it shut.',
      p3Title: 'Lighter, then longer',
      p3Body: 'The project starts in the browser so an ordinary device can keep a rotating bouquet that changes with the date.',
      teamEyebrow: 'Made by a small studio',
      teamTitle: 'Human-led, AI-assisted.',
      teamBody: 'DailyFlora is an independent project in progress. Product judgment, floral taste, and final decisions remain human-led; AI assists with prototypes, code, tests, and documentation.',
      founderTitle: 'Founder',
      founderRole: 'CALFN LAU · Creative Direction',
      founderBody: 'Defines the product concept, floral boundaries, interaction direction, and final expression.',
      codexTitle: 'Codex collaboration',
      codexRole: 'AI Development Collaborator',
      codexBody: 'Helps turn ideas into working web interfaces, generation rules, and reviewed development notes.',
      legalTitle: 'Code and references',
      legalP1: 'DailyFlora is an independent creative project. Original visual rules, copy, and arrangements belong to the creator unless stated otherwise.',
      legalP2: 'The project uses open-source software such as Three.js under their original licenses. AI-assisted code is reviewed before adoption.'
    },
    member: {
      eyebrow: 'DailyFlora ID / MVP',
      title: 'My garden',
      lead: 'This is the registration entry and the signed-in workspace. Your account and garden data sync after you sign in.',
      todayEyebrow: "Today's bouquet",
      todayTitle: 'Keep today’s bouquet first.',
      stateNone: 'Not created',
      stateReady: 'Created',
      signupPill: 'Create account',
      signupTitle: 'Create your garden',
      signupBody: 'Create an account to sync your garden across devices.',
      name: 'Your name',
      email: 'Email',
      create: 'Create account',
      consentPrefix: 'I have read and agree to the',
      consentAnd: 'and',
      favoriteAction: "Save today's bouquet",
      logout: 'Sign out',
      collectionTitle: 'My collection',
      collectionBody: 'Each saved bouquet keeps date, seed, flowerPlan, and a unique code. Empty states stay honest.',
      emptySavedTitle: 'No saved bouquets yet',
      emptySavedBody: 'Return to today’s bouquet and light the heart. The first saved flower will appear here with its code.',
      studioEyebrow: 'Upload to bouquet',
      studioTitle: 'Upload a reference image and create a traceable private bouquet record.',
      studioPill: 'Private garden',
      createTitle: 'Create a custom bouquet',
      createBody: 'Reads average image color and preference text to create a mock plan. Old records are not overwritten.',
      chooseImage: 'Choose a reference image',
      chooseHint: 'Bouquet, color mood, or floral detail. Private upload is prepared after sign-in.',
      bouquetName: 'Bouquet name',
      direction: 'Direction',
      auto: 'Auto',
      air: 'Airy',
      rainbow: 'Rainbow color',
      fruit: 'Fruit / berries',
      warm: 'Warm and full',
      preference: 'Preference note',
      recognize: 'Recognize as plan',
      sample: 'Use sample mood',
      reset: 'Clear',
      resultEyebrow: 'Recognition',
      waiting: 'Waiting for upload',
      notReady: 'not ready',
      resultBody: 'After upload, color, floral roles, structure, seed, and record code appear here.',
      saveRecord: 'Generate and save record',
      openSimilar: 'Open similar bouquet',
      historyTitle: 'My generated bouquets',
      historyBody: '',
      creditsTitle: 'Credits',
      creditsHeading: 'Credits',
      creditsPill: 'Mock data',
      toastCreated: 'Account created.',
      toastLogout: 'Signed out.',
      toastSaved: 'Saved {id}'
    },
    objects: {
      eyebrow: 'DailyFlora Editions',
      title: 'Bring DailyFlora into everyday life.',
      lead: 'Preview upcoming objects and register your presale interest.',
      primary: 'Explore presale editions',
      secondary: '#Floristplan',
      sectionEyebrow: 'Upcoming editions',
      sectionTitle: 'Objects that let a DailyFlora bouquet live beyond the screen.',
      sectionBody: 'Explore the first collection and save presale interest for launch updates.',
      floristEyebrow: '#Floristplan',
      floristTitle: 'DailyFlora Florist Plan',
      floristBody: 'City experiences, physical bouquet editions, and florist collaborations.',
      cityTitle: 'City experience points',
      cityBody: 'Hangzhou, Shanghai, and Shenzhen are the first candidate cities.',
      bouquetCollabTitle: 'Physical bouquet editions',
      bouquetCollabBody: 'Translate selected digital bouquets into real flowers, wrapping, and in-store displays.',
      collaborationTitle: 'Collaboration enquiries',
      collaborationBody: 'A future entry for florists, makers, and city partners.',
      interest: 'Register presale interest',
      toast: 'Presale interest saved. Launch updates will be shown here.'
    },
    platforms: {
      eyebrow: 'DailyFlora across screens',
      title: 'Let the flower stay on the screen you use most.',
      lead: 'The web version works now, and the Windows and macOS desktop betas are available for testing.',
      primary: 'Download macOS beta',
      secondary: 'Open web version',
      sectionEyebrow: 'Platform roadmap',
      sectionTitle: 'The same bouquet can stay differently on different screens.',
      sectionBody: 'Every platform is marked by what is usable now.',
      browserStatus: 'MVP available',
      browserBody: 'Open daily bouquets, favorites, the member garden, and project records now.',
      adapting: 'In adaptation',
      planned: 'Planned',
      closed: 'Not open yet',
      follow: 'Follow release',
      macEyebrow: 'macOS desktop beta',
      macTitle: 'Let the daily bouquet stay on your Mac.',
      macLead: 'A local-first display app for macOS 12 Monterey and later. Apple Silicon keeps camera gestures; Intel stays display-only.',
      macStatus: '0.72 Beta · arm64 / x64',
      macCardTitle: 'DailyFlora for macOS',
      macBody: 'Apple Silicon includes local hand-control resources and camera support. Intel packages omit camera and gesture resources for a lighter display-only build.',
      macArmLabel: 'Apple Silicon · arm64',
      macIntelLabel: 'Intel · x64',
      macFeishu: 'Download from Feishu',
      macOneDrive: 'Download from OneDrive',
      macSourceTitle: 'Choose a Mac architecture and mirror',
      macMirror: 'Mirror',
      macMirrorBody: 'Both mirrors contain the same architecture package. Choose the source that opens normally on your device.',
      macDownloadHost: 'Feishu and OneDrive are mirrors for the same architecture packages. Choose the source that opens normally in your browser.',
      macSystemLabel: 'System',
      macSystem: 'macOS 12 Monterey or later',
      macModeLabel: 'Modes',
      macMode: 'arm64 camera gestures · x64 display only',
      macSecurityLabel: 'Security',
      macSecurity: 'Local Beta; not Developer ID notarized',
      macNote: 'macOS may show a security warning because this is a local Beta package. Do not treat it as a notarized public release.',
      macCardBody: 'The macOS beta provides camera gestures on Apple Silicon and a lighter display-only build on Intel.',
      macOpen: 'View download',
      windowsEyebrow: 'Windows desktop beta',
      windowsTitle: 'Let the daily bouquet stay on your Windows desktop.',
      windowsLead: 'A local-first display app for Windows 10 and 11. Daily bouquet content still comes from the internet.',
      windowsStatus: '0.72 Beta · x64',
      windowsCardTitle: 'DailyFlora for Windows',
      windowsBody: 'The installer keeps the flower engine, Three.js, MediaPipe files, and hand model local. When the window closes, DailyFlora stays in the Windows system tray instead of quitting.',
      windowsInstaller: 'Download installer',
      windowsPortable: 'Download portable',
      windowsSourceTitle: 'Choose a mirror',
      windowsMirror: 'Mirror',
      windowsOneDriveTitle: 'OneDrive mirror',
      windowsOneDriveBody: 'OneDrive mirror for the same Windows package. Use it if it opens normally on your device.',
      windowsFeishuTitle: 'Feishu mirror',
      windowsFeishuBody: 'Feishu mirror for the same Windows package. Use it if it opens normally on your device.',
      windowsChecksums: 'SHA-256 checksums',
      windowsSystemLabel: 'System',
      windowsSystem: 'Windows 10 / 11 · 64-bit',
      windowsModeLabel: 'Display mode',
      windowsMode: 'Tray-resident ambient display',
      windowsAutoLabel: 'Auto display',
      windowsAuto: '5, 10, 15, 30, or 60 minutes after closing',
      windowsExitLabel: 'Exit fullscreen',
      windowsExit: 'Press Esc; the app returns to the tray',
      windowsNote: 'This is a beta desktop display, not a registered Windows .scr screensaver. Windows may show an unsigned-app warning; verify the installer with SHA-256 before opening it.',
      windowsCardBody: 'The tray-resident desktop beta is available above. It reads the daily bouquet online and keeps heavy runtime assets local.',
      windowsOpen: 'View download',
      windowsDownloadHost: 'OneDrive and Feishu are mirrors for the same package. Choose the source that opens normally in your browser. Verify SHA-256 before opening the package.',
      toast: 'Saved on this device. No install or subscription was triggered.',
      footer: 'DailyFlora across screens.'
    },
    legal: {
      termsTitle: 'Terms of Use',
      privacyTitle: 'Privacy Policy',
      creditsTitle: 'Credits & Attributions',
      copyrightTitle: 'Copyright Notice',
      intro: 'DailyFlora is an independent digital-art project by CALFN LAU. These pages describe the current local MVP honestly.',
      termsBody: 'DailyFlora is provided as an experimental digital art and member-garden experience. Current account, favorite, upload, credit, and generated-record features are local browser features unless a page explicitly says otherwise. Do not use the service to upload material you do not have the right to use.',
      privacyBody: 'Current DailyFlora member data is stored in browser localStorage on this device. Reference images are read locally for preview and are not uploaded by the current MVP. Clearing browser data may delete your local garden, favorites, and records.',
      creditsBody: 'DailyFlora is created by CALFN LAU with AI-assisted development support. The project uses open-source software including Three.js and MediaPipe Tasks Vision where applicable. Third-party names and assets remain the property of their owners.',
      copyrightBody: 'DailyFlora, original visual rules, generated composition logic, page copy, and product direction are protected unless otherwise noted. Open-source dependencies remain under their original licenses.',
      contact: 'Rights or privacy questions: find@calfn.com'
    },
    footer: {
      statement: 'One bouquet a day. No need to possess it.',
      aboutStatement: 'Come back tomorrow and see how the flower changes.',
      memberStatement: 'A flower you loved should have somewhere to stay.',
      objectsStatement: 'DailyFlora editions and florist collaborations.',
      devHidden: 'DEV LOG is not part of the formal site entrance.'
    },
    errors: {
      missing: 'Something is missing. Please reload the page.',
      storage: 'This device cannot save that preference right now.',
      image: 'This image could not be read. Try another one.',
      empty: 'Nothing here yet.'
    }
  },
  'zh-CN': {
    meta: {
      homeTitle: 'DailyFlora - 每日数字花束',
      homeDescription: 'DailyFlora 让日期长出一束可收藏、可回看的 3D 数字花。',
      aboutTitle: '关于 DailyFlora - 日期与花，在此相遇',
      aboutDescription: '关于 DailyFlora：一个让日期与花相遇的独立数字艺术项目。',
      memberTitle: 'DailyFlora 个人花园',
      memberDescription: '注册、登录、收藏每日花束，并在本机生成私人花束记录。',
      objectsTitle: 'DailyFlora 周边与线下合作',
      objectsDescription: 'DailyFlora 未来周边、环境展示与线下花店合作计划。',
      platformsTitle: 'DailyFlora 多端入口',
      platformsDescription: 'DailyFlora Web、桌面、移动与环境屏幕的当前状态。',
      termsTitle: 'DailyFlora 使用条款',
      privacyTitle: 'DailyFlora 隐私政策',
      creditsTitle: 'DailyFlora 致谢与署名',
      copyrightTitle: 'DailyFlora 版权说明',
      legalDescription: 'DailyFlora 使用条款、隐私、版权与署名说明。'
    },
    common: {
      today: '今日花束',
      member: '我的花园',
      about: '关于 DailyFlora',
      objects: '周边与线下',
      platforms: '多端入口',
      scifi: 'SciFi Flora',
      collect: '收藏这束花',
      openWeb: '打开 Web 版',
      version: '读取版本代码…',
      system: '系统',
      explore: '探索',
      close: '关闭',
      localOnly: '仅本机保存',
      language: '语言',
      siteNavigation: '站点导航',
      signInExisting: '登录已有账户',
      createAccount: '创建账户',
      guestAuthHint: '登录后同步收藏；第一次使用可以先创建账户。',
      copyright: '© 2026 CALFN LAU. All rights reserved.',
      brandHome: 'DailyFlora 首页'
    },
    index: {
      index: 'INDEX',
      view: 'VIEW',
      hideView: 'CLOSE',
      siteMenu: 'DailyFlora 站点菜单',
      currentBouquet: '今日花束',
      myGarden: '我的花园',
      about: '关于 DailyFlora',
      objects: '周边与线下',
      platforms: '多端入口',
      favorite: '收藏这束花',
      debug: '审美审核',
      openGarden: '打开个人花园',
      favoriteToday: '收藏今日花束',
      savedToday: '已收藏今日花束',
      gardenTitle: '个人花园',
      gardenStatusGuest: '登录后同步收藏',
      gardenStatusSigned: '{count} 个收藏',
      accountPanelTitleGuest: '把今天的花束收进个人花园',
      accountPanelTitleSigned: '你的 DailyFlora 收藏',
      loginName: '怎么称呼你',
      loginNamePlaceholder: '例如：小花',
      loginEmail: '邮箱',
      loginSubmit: '建立本机花园并收藏',
      logout: '退出',
      collection: '我的收藏',
      emptyTitle: '还没有收藏',
      emptyBody: '点亮爱心后，这束花会留在这里。',
      referenceTitle: '从参考图出发',
      referenceBody: '只在本机读取颜色和文件名，用来预览一束新的花；不会上传图片。',
      referenceChoose: '选择一张参考图',
      referenceNote: '偏好备注',
      referencePlaceholder: '例如：更轻、更冷一点，保留枝条感',
      referenceGenerate: '按参考图生成',
      referenceReading: '正在读取参考图…',
      referenceReady: '已匹配到 {theme}，可以生成。',
      referenceError: '这张图暂时读不了，换一张试试。',
      referenceDone: '已按 {theme} 生成，可点爱心收藏。'
    },
    view: {
      show: '显示观看设置',
      hide: '收起观看设置',
      howToUse: '使用教程',
      date: '选择日期',
      dateWithName: '选择日期：{name}',
      random: '随机跳到某一天',
      fullscreen: '全屏观看',
      handOn: '开启手势控制',
      handOff: '关闭手势控制',
      zoomOut: '拉远',
      zoomIn: '拉近',
      density: '花束密度',
      densityLow: '花材少一点',
      densityMedium: '花材中等',
      densityHigh: '花材密一点',
      render: '渲染精度',
      renderAuto: '自动选择清晰度',
      renderLow: '省电模式',
      renderMedium: '透明光滑球',
      renderHigh: '精细模式',
      pause: '暂停旋转',
      resume: '继续旋转',
      reverse: '反转当前镜头路线',
      speed: '镜头速度',
      preset: '随机镜头预设',
      clock: '时钟',
      showClock: '显示时钟',
      hideClock: '隐藏时钟',
      clockMinutes: '分',
      clockAuto: '自动',
      previousMonth: '上个月',
      nextMonth: '下个月',
      weekdays: '日,一,二,三,四,五,六'
    },
    tutorial: {
      title: '使用教程',
      lead: '让一束花安静地留在屏幕上。',
      screenshotCaption: '给那些被你留下的花，一个安静的回来之处。',
      basicsTitle: '每天的花束',
      basicsBody: '每个日期都会长出自己的花束。拖动花束可以环视，滚轮或加减按钮可以调整距离，其余设置都在 VIEW 里。',
      controlsTitle: 'VIEW 设置',
      controlsBody: '选择日期，调整疏密与清晰度，暂停镜头，或打开时钟。按 O 打开 VIEW，按 Esc 关闭当前打开的模式。',
      fullscreenTitle: '全屏观看',
      fullscreenBody: '全屏按钮会让花束更像房间里的一束花。按 F 进入或退出全屏；全屏时按 O 仍然可以打开 VIEW。',
      gestureTitle: '手势控制',
      gestureBody: '在 VIEW 中开启手势控制并允许摄像头访问，然后用张开的手在花束中移动。摄像头画面只在浏览器本机使用。',
      clockTitle: '时钟模式',
      clockBody: '时钟模式会显示当前时间、日期和轮换引语，并把花束切换到时钟构图。可在 VIEW 中手动打开，也可开启“自动”，按设定的安静时长进入。按 Esc 退出。',
      acknowledge: '我知道了',
      openHome: '打开今天的花',
      openGesture: '打开手势教程',
      openFullscreen: '打开全屏教程',
      openClock: '打开时钟教程',
      openBasics: '打开基础教程'
    },
    about: {
      eyebrow: '日期与花，在此相遇。',
      title: '暗色之中，一束花缓缓成形。',
      lead: 'DailyFlora 是一座每天醒来一次的数字花园。日期成为种子，色彩、花材与空间规则彼此生长，生成一束只属于今天的 3D 花。',
      primary: '看今天的花',
      secondary: '让这一天继续开着',
      captionTitle: '今日生成',
      captionBody: '由日期与花材规则实时生长',
      manifestoEyebrow: '为什么做它',
      manifestoTitle: '在重复的屏幕里，留下一个会变化的生命迹象。',
      manifestoP1: 'DailyFlora 的开发初衷很简单：屏幕不应该永远只是工具和通知。它也可以像窗台一样，在你没有操作的时候，安静地放着一束花。',
      manifestoP2: '我们不复制现实中的某一束花，而是把花艺里的颜色、轮廓、疏密、枝线和空气感写成可演化的规则。',
      quote: '这不是一张需要“看完”的图像。',
      principlesEyebrow: '我们在意什么',
      principlesTitle: '我们在意的，不只是花多不多。',
      p1Title: '每天不同，但始终可认',
      p1Body: '生成带来惊喜，审美规则守住边界。DailyFlora 追求有变化的秩序，而不是不受控制的随机。',
      p2Title: '让空气成为花材',
      p2Body: '真正的缤纷来自点状节奏、方向差异与留白。叶材托住空间，花朵不被填成沉重的一团。',
      p3Title: '轻一点，再长久一点',
      p3Body: '项目从浏览器中的低功耗体验开始，让普通设备也能拥有一束持续旋转、随日期更新的数字花。',
      teamEyebrow: '小团队制作',
      teamTitle: '一人主理，人与 AI 协作。',
      teamBody: 'DailyFlora 是仍在成长的独立项目。产品判断、花艺审美与最终取舍始终由人负责；AI 参与原型、代码、测试与文档整理。',
      founderTitle: '产品主理人',
      founderRole: 'CALFN LAU · Creative Direction',
      founderBody: '提出 DailyFlora 的产品概念，建立花艺审美边界，决定每日花束、交互与品牌表达的最终方向。',
      codexTitle: 'Codex 协作开发',
      codexRole: 'AI Development Collaborator',
      codexBody: '协助把创意转化为可运行的网页、生成规则和开发文档，并在每轮修改后完成结构与构建检查。',
      legalTitle: '代码与引用说明',
      legalP1: 'DailyFlora 为独立开发项目。站内原创视觉规则、文案与组合方式除另有说明外归项目创作者所有。',
      legalP2: '项目使用 Three.js 等开源软件；相关代码继续适用其原始开源许可。AI 辅助代码需人工审阅后采用。'
    },
    member: {
      eyebrow: 'DailyFlora ID / MVP',
      title: '我的花园',
      lead: '这里是注册入口，也是登录后的工作台。登录后，账户和花园数据会同步到云端。',
      todayEyebrow: 'Today’s bouquet',
      todayTitle: '先把今天这束花留下。',
      stateNone: '未建立',
      stateReady: '已建立',
      signupPill: '建立账户',
      signupTitle: '建立你的花园',
      signupBody: '建立账户后，你可以在不同设备同步花园。',
      name: '怎么称呼你',
      email: '邮箱',
      create: '建立账户',
      consentPrefix: '我已阅读并同意',
      consentAnd: '和',
      favoriteAction: '收藏今日花束',
      logout: '退出账户',
      collectionTitle: '我的收藏',
      collectionBody: '每张收藏都保留日期、seed、flowerPlan 与唯一代码。没有收藏时不虚构数据。',
      emptySavedTitle: '还没有收藏',
      emptySavedBody: '回到今日花束，点右上角爱心。第一束花会带着唯一代码出现在这里。',
      studioEyebrow: 'Upload to bouquet',
      studioTitle: '上传参考图，生成一份可追踪的私人花束记录。',
      studioPill: '私人花园',
      createTitle: '新建定制花束',
      createBody: '读取图片平均色与文字偏好，生成一份 mock 方案。旧记录不热修改。',
      chooseImage: '选择一张参考图',
      chooseHint: '花束、色彩氛围、局部花材都可以。登录后进入私有上传流程。',
      bouquetName: '花束名称',
      direction: '方向',
      auto: '自动判断',
      air: '空气感',
      rainbow: '彩虹多色',
      fruit: '果材/莓果',
      warm: '暖色饱满',
      preference: '文字偏好',
      recognize: '识别成方案',
      sample: '使用示例图感',
      reset: '清空',
      resultEyebrow: 'Recognition',
      waiting: '等待上传',
      notReady: 'not ready',
      resultBody: '上传参考图后，这里会显示主色、花材角色、空间结构、seed 和唯一记录代码。',
      saveRecord: '生成并保存记录',
      openSimilar: '打开相近花束',
      historyTitle: '我的已生成花束',
      historyBody: '',
      creditsTitle: 'Credits',
      creditsHeading: '致谢与署名',
      creditsPill: '模拟数据',
      toastCreated: '账户已建立。',
      toastLogout: '已退出账户。',
      toastSaved: '已保存 {id}'
    },
    objects: {
      eyebrow: 'DailyFlora 周边预售',
      title: '把 DailyFlora 带进真实生活。',
      lead: '预览即将推出的周边系列，并登记预售意向。',
      primary: '查看周边预售',
      secondary: '#Floristplan',
      sectionEyebrow: '即将推出',
      sectionTitle: '让 DailyFlora 花束以另一种方式留在屏幕之外。',
      sectionBody: '浏览首批周边，并登记预售意向以获取发布信息。',
      floristEyebrow: '#Floristplan',
      floristTitle: 'DailyFlora 花店计划',
      floristBody: '城市体验、实体花束联名与花店合作计划。',
      cityTitle: '城市体验点',
      cityBody: '杭州、上海、深圳作为首批候选城市。',
      bouquetCollabTitle: '实体花束联名',
      bouquetCollabBody: '把精选数字花束转化为真实花材、包装和门店陈列。',
      collaborationTitle: '合作入口',
      collaborationBody: '面向花店、制作方与城市合作伙伴的未来合作入口。',
      interest: '登记预售意向',
      toast: '已登记预售意向，发布信息会在这里更新。'
    },
    platforms: {
      eyebrow: 'DailyFlora across screens',
      title: '让花停留在你最常用的屏幕上。',
      lead: '当前 Web 版可用，Windows 和 macOS 桌面 Beta 都已开放测试。',
      primary: '下载 macOS Beta',
      secondary: '打开 Web 版',
      sectionEyebrow: 'Platform roadmap',
      sectionTitle: '同一束花，不同屏幕上的停留方式。',
      sectionBody: '每个平台都按“当前能否使用”来标注。',
      browserStatus: 'MVP 可体验',
      browserBody: '现在可打开每日花束、收藏、个人花园和开发记录。',
      adapting: '适配中',
      planned: '规划中',
      closed: '暂未开放',
      follow: '关注发布',
      macEyebrow: 'macOS 桌面 Beta',
      macTitle: '让每日花束留在你的 Mac 上。',
      macLead: '面向 macOS 12 Monterey 及以上版本的本地优先展示程序。Apple Silicon 支持摄像头手势；Intel 版本为纯显示模式。',
      macStatus: '0.72 Beta · arm64 / x64',
      macCardTitle: 'DailyFlora macOS 桌面版',
      macBody: 'Apple Silicon 包含本地手势资源并支持摄像头；Intel 包不包含摄像头和手势资源，更适合纯展示。',
      macArmLabel: 'Apple Silicon · arm64',
      macIntelLabel: 'Intel · x64',
      macFeishu: '从飞书下载',
      macOneDrive: '从 OneDrive 下载',
      macSourceTitle: '选择 Mac 架构和镜像',
      macMirror: '镜像',
      macMirrorBody: '两个镜像是同一架构的安装包。请选择你设备上能正常打开的来源。',
      macDownloadHost: '飞书和 OneDrive 是同一架构安装包的镜像。请选择你浏览器中能正常打开的来源。',
      macSystemLabel: '系统',
      macSystem: 'macOS 12 Monterey 及以上',
      macModeLabel: '模式',
      macMode: 'arm64 支持摄像头手势 · x64 纯显示',
      macSecurityLabel: '安全状态',
      macSecurity: '本机 Beta；尚未 Developer ID 公证',
      macNote: '这是本机 Beta 包，macOS 可能显示安全警告。它目前不是经过公证的正式公开版本。',
      macCardBody: 'macOS Beta 在 Apple Silicon 上支持摄像头手势，在 Intel 上提供更轻量的纯显示版本。',
      macOpen: '查看下载',
      windowsEyebrow: 'Windows 桌面 Beta',
      windowsTitle: '让每日花束留在你的 Windows 桌面上。',
      windowsLead: '面向 Windows 10 和 11 的本地优先展示程序；每日花束内容仍然从互联网读取。',
      windowsStatus: '0.72 Beta · x64',
      windowsCardTitle: 'DailyFlora Windows 桌面版',
      windowsBody: '安装包会把花束引擎、Three.js、MediaPipe 文件和手部模型保存在本机。关闭窗口后，DailyFlora 会留在 Windows 系统托盘中，而不是退出。',
      windowsInstaller: '下载安装包',
      windowsPortable: '下载 Portable 版',
      windowsSourceTitle: '选择镜像来源',
      windowsMirror: '镜像',
      windowsOneDriveTitle: 'OneDrive 镜像',
      windowsOneDriveBody: '同一 Windows 安装包的 OneDrive 镜像。请选择你设备上能正常打开的来源。',
      windowsFeishuTitle: '飞书镜像',
      windowsFeishuBody: '同一 Windows 安装包的飞书镜像。请选择你设备上能正常打开的来源。',
      windowsChecksums: 'SHA-256 校验值',
      windowsSystemLabel: '系统',
      windowsSystem: 'Windows 10 / 11 · 64 位',
      windowsModeLabel: '展示方式',
      windowsMode: '系统托盘驻留的环境展示',
      windowsAutoLabel: '自动显示',
      windowsAuto: '关闭窗口后闲置 5、10、15、30 或 60 分钟',
      windowsExitLabel: '退出全屏',
      windowsExit: '按 Esc；程序会回到系统托盘',
      windowsNote: '这是 Beta 桌面展示程序，不是注册到 Windows 的 .scr 屏保。Windows 可能提示程序尚未签名；打开前请用 SHA-256 校验安装包。',
      windowsCardBody: '上方提供系统托盘驻留桌面 Beta。它在线读取每日花束，并把体积较大的运行资源保存在本机。',
      windowsOpen: '查看下载',
      windowsDownloadHost: 'OneDrive 和飞书是同一安装包的镜像。请选择你浏览器中能正常打开的来源。打开前请核对 SHA-256。',
      toast: '已在本机记下关注。正式下载开放前，这里不会触发安装或订阅。',
      footer: 'DailyFlora，多屏绽放。'
    },
    legal: {
      termsTitle: '使用条款',
      privacyTitle: '隐私政策',
      creditsTitle: '致谢与署名',
      copyrightTitle: '版权说明',
      tutorialTitle: 'DailyFlora 使用教程',
      tutorialDescription: 'DailyFlora 花束观看、收藏与互动方式的安静指南。',
      intro: 'DailyFlora 是 CALFN LAU 的独立数字艺术项目。以下说明按当前本机 MVP 的真实行为书写。',
      termsBody: 'DailyFlora 当前作为实验性的数字艺术与个人花园体验提供。账户、收藏、上传、积分和生成记录均为本机浏览器功能，除非页面明确说明，否则不代表真实云端服务已经上线。请不要上传或使用你无权使用的材料。',
      privacyBody: '当前 DailyFlora 会员数据保存在本设备浏览器 localStorage 中。参考图只在本机读取用于预览，不会由当前 MVP 上传。清除浏览器数据可能删除本机花园、收藏和记录。',
      creditsBody: 'DailyFlora 由 CALFN LAU 创作，并使用 AI 辅助开发。项目使用 Three.js、MediaPipe Tasks Vision 等开源软件；第三方名称和资产仍归其权利人所有。',
      copyrightBody: 'DailyFlora 的原创视觉规则、生成构图逻辑、页面文案与产品方向除另有说明外受版权保护。开源依赖继续适用其原始许可证。',
      contact: '权利或隐私问题：find@calfn.com'
    },
    footer: {
      statement: '每天一束，不必占有。',
      aboutStatement: '明天再来，看花如何变化。',
      memberStatement: '喜欢过的花，应该有地方留下。',
      objectsStatement: 'DailyFlora 周边预售与花店合作计划。',
      devHidden: 'DEV LOG 不进入正式网站入口。'
    },
    errors: {
      missing: '页面缺少必要元素，请刷新重试。',
      storage: '当前设备暂时无法保存这个偏好。',
      image: '这张图暂时读不了，换一张试试。',
      empty: '这里暂时还没有内容。'
    }
  },
  es: {},
  fr: {},
  pt: {},
  it: {},
  ja: {}
};

const conciseLocaleOverrides: Partial<Record<Locale, TranslationTree>> = {
  es: {
    meta: {
      homeTitle: 'DailyFlora - Un ramo para cada día',
      homeDescription: 'DailyFlora hace crecer un ramo digital 3D, coleccionable y ligado a la fecha.',
      aboutTitle: 'Sobre DailyFlora - Un ramo para cada día',
      aboutDescription: 'DailyFlora es un proyecto de arte digital donde las fechas se encuentran con las flores.',
      memberTitle: 'Jardín personal DailyFlora',
      memberDescription: 'Regístrate, guarda ramos y crea registros privados en este dispositivo.',
      objectsTitle: 'DailyFlora Objetos y colaboraciones',
      objectsDescription: 'Objetos, pantallas ambientales y futuras colaboraciones florales de DailyFlora.',
      platformsTitle: 'DailyFlora Plataformas',
      platformsDescription: 'Estado de DailyFlora en web, escritorio, móvil y pantallas ambientales.'
    },
    common: { today: 'Ramo de hoy', member: 'Mi jardín', about: 'Acerca de DailyFlora', objects: 'Objetos y colaboraciones', platforms: 'Plataformas', scifi: 'SciFi Flora', collect: 'Guardar este ramo', openWeb: 'Abrir versión web', explore: 'Explorar', system: 'Sistema', version: 'Leer código de versión...', localOnly: 'Guardado solo en este dispositivo', siteNavigation: 'Navegación del sitio', signInExisting: 'Iniciar sesión con una cuenta existente', createAccount: 'Crear cuenta', guestAuthHint: 'Inicia sesión para sincronizar tu colección; crea una cuenta si es tu primera visita.' },
    index: { index: 'ÍNDICE', view: 'VISTA', hideView: 'CERRAR', siteMenu: 'Menú de DailyFlora', currentBouquet: 'Ramo de hoy', myGarden: 'Mi jardín', about: 'Acerca de DailyFlora', objects: 'Objetos y colaboraciones', platforms: 'Plataformas', favorite: 'Guardar este ramo', debug: 'Revisión estética', openGarden: 'Abrir mi jardín', favoriteToday: 'Guardar el ramo de hoy', savedToday: 'Ramo guardado', gardenTitle: 'Mi jardín', gardenStatusGuest: 'Inicia sesión para guardar', gardenStatusSigned: '{count} guardados', accountPanelTitleGuest: 'Guarda el ramo de hoy en tu jardín', accountPanelTitleSigned: 'Tu colección DailyFlora', collection: 'Mi colección', emptyTitle: 'Aún no hay ramos guardados', emptyBody: 'Enciende el corazón y este ramo quedará aquí.', referenceTitle: 'Partir de una imagen', referenceBody: 'Lee color y nombre de archivo en este dispositivo para prever un ramo. No se sube nada.', referenceChoose: 'Elegir imagen', referenceGenerate: 'Generar desde la referencia', referenceReading: 'Leyendo la imagen...', referenceReady: 'Se encontró {theme}. Ya puedes generar.', referenceDone: 'Generado desde {theme}. Usa el corazón para guardarlo.' },
    view: { show: 'Mostrar controles', hide: 'Ocultar controles', howToUse: 'Cómo usarlo', date: 'Elegir fecha', dateWithName: 'Elegir fecha: {name}', random: 'Ver otra fecha', fullscreen: 'Pantalla completa', handOn: 'Activar gestos', handOff: 'Desactivar gestos', zoomOut: 'Alejar', zoomIn: 'Acercar', density: 'Densidad del ramo', densityLow: 'Más ligero', densityMedium: 'Medio', densityHigh: 'Más denso', render: 'Precisión visual', renderAuto: 'Auto', renderLow: 'Ahorro', renderMedium: 'Claro', renderHigh: 'Detallado', pause: 'Pausar rotación', resume: 'Reanudar rotación', reverse: 'Invertir ruta de cámara', speed: 'Velocidad de cámara', preset: 'Ruta de cámara aleatoria', clock: 'Reloj', showClock: 'Mostrar reloj', hideClock: 'Ocultar reloj', clockMinutes: 'min', clockAuto: 'Auto', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', weekdays: 'Dom,Lun,Mar,Mié,Jue,Vie,Sáb' },
    about: { eyebrow: 'UN RAMO PARA CADA DÍA', title: 'Donde las fechas se encuentran con las flores.', lead: 'En la oscuridad, un ramo toma forma despacio. Cada fecha se vuelve semilla para una flor digital tranquila.', primary: 'Ver la flor de hoy', secondary: 'Mantener un día en flor', quote: 'No es una imagen que tengas que terminar.', manifestoTitle: 'Una pantalla también puede guardar una señal de vida.', principlesTitle: 'No se trata de tener más flores.' },
    member: { title: 'Mi jardín', lead: 'Registro y mesa de trabajo. Por ahora, cuenta, favoritos y registros se guardan solo en este dispositivo.', create: 'Crear jardín local', collectionTitle: 'Mi colección', studioTitle: 'Sube una referencia y crea un ramo privado rastreable.', historyTitle: 'Mis ramos generados', historyBody: '', creditsTitle: 'Créditos' },
    platforms: { title: 'Deja que la flor viva en la pantalla que más usas.', lead: 'La web ya está disponible; las demás plataformas permanecen como próximas entradas honestas.', follow: 'Seguir lanzamiento', toast: 'Guardado en este dispositivo. No se inició instalación ni suscripción.' },
    objects: { eyebrow: 'Ediciones DailyFlora', title: 'Lleva DailyFlora a la vida cotidiana.', lead: 'Descubre los próximos objetos y registra tu interés en la preventa.', primary: 'Ver ediciones en preventa', secondary: '#Floristplan', sectionEyebrow: 'Próximas ediciones', sectionTitle: 'Objetos para que un ramo DailyFlora viva más allá de la pantalla.', sectionBody: 'Explora la primera colección y guarda tu interés para recibir novedades.', floristEyebrow: '#Floristplan', floristTitle: 'Plan de floristas DailyFlora', floristBody: 'Experiencias urbanas, ediciones de ramos físicos y colaboraciones con floristas.', cityTitle: 'Puntos de experiencia urbanos', cityBody: 'Hangzhou, Shanghái y Shenzhen son las primeras ciudades candidatas.', bouquetCollabTitle: 'Ediciones de ramos físicos', bouquetCollabBody: 'Traducir ramos digitales seleccionados a flores reales, envoltorios y escaparates.', collaborationTitle: 'Colaboraciones', collaborationBody: 'Una futura entrada para floristas, creadores y socios urbanos.', interest: 'Registrar interés', toast: 'Interés de preventa guardado. Las novedades aparecerán aquí.' }
  },
  fr: {
    common: { today: 'Bouquet du jour', member: 'Mon jardin', about: 'À propos de DailyFlora', objects: 'Objets et collaborations', platforms: 'Plateformes', scifi: 'SciFi Flora', collect: 'Garder ce bouquet', openWeb: 'Ouvrir la version web', explore: 'Explorer', system: 'Système', version: 'Lire le code de version...', siteNavigation: 'Navigation du site', signInExisting: 'Se connecter à un compte existant', createAccount: 'Créer un compte', guestAuthHint: 'Connectez-vous pour synchroniser votre collection ; créez un compte si vous arrivez pour la première fois.' },
    index: { index: 'INDEX', view: 'VUE', hideView: 'FERMER', siteMenu: 'Menu DailyFlora', currentBouquet: 'Bouquet du jour', myGarden: 'Mon jardin', about: 'À propos de DailyFlora', objects: 'Objets et collaborations', platforms: 'Plateformes', favorite: 'Garder ce bouquet', debug: 'Revue esthétique', gardenStatusSigned: '{count} gardés' },
    view: { show: 'Afficher les contrôles', hide: 'Masquer les contrôles', howToUse: 'Mode d’emploi', date: 'Choisir la date', random: 'Voir une autre date', fullscreen: 'Plein écran', zoomOut: 'Éloigner', zoomIn: 'Rapprocher', pause: 'Mettre en pause', resume: 'Reprendre', clock: 'Horloge', showClock: 'Afficher l’horloge', hideClock: 'Masquer l’horloge', weekdays: 'Dim,Lun,Mar,Mer,Jeu,Ven,Sam' },
    about: { eyebrow: 'UN BOUQUET POUR CHAQUE JOUR', title: 'Là où les dates rencontrent les fleurs.', lead: 'Dans l’obscurité, un bouquet prend lentement forme. Une date devient une graine, puis un espace, une couleur, une fleur numérique.', primary: 'Voir la fleur du jour', secondary: 'Garder un jour en fleur', quote: 'Ce n’est pas une image qu’il faut finir.' },
    member: { title: 'Mon jardin', lead: 'Inscription et espace personnel. Pour l’instant, tout reste enregistré sur cet appareil.' },
    platforms: { title: 'Laisser la fleur habiter l’écran que vous utilisez le plus.', lead: 'La version web est disponible; les autres écrans restent des entrées à venir.' },
    objects: { eyebrow: 'Éditions DailyFlora', title: 'Faites entrer DailyFlora dans la vie quotidienne.', lead: 'Découvrez les prochains objets et inscrivez votre intérêt pour la prévente.', primary: 'Voir les éditions en prévente', secondary: '#Floristplan', sectionEyebrow: 'Prochaines éditions', sectionTitle: 'Des objets pour faire vivre un bouquet DailyFlora au-delà de l’écran.', sectionBody: 'Explorez la première collection et suivez son lancement.', floristEyebrow: '#Floristplan', floristTitle: 'Plan fleuristes DailyFlora', floristBody: 'Expériences urbaines, bouquets physiques et collaborations avec des fleuristes.', cityTitle: 'Points d’expérience en ville', cityBody: 'Hangzhou, Shanghai et Shenzhen sont les premières villes candidates.', bouquetCollabTitle: 'Éditions de bouquets physiques', bouquetCollabBody: 'Traduire des bouquets numériques en fleurs réelles, emballages et vitrines.', collaborationTitle: 'Collaborations', collaborationBody: 'Une future entrée pour fleuristes, créateurs et partenaires urbains.', interest: 'Inscrire mon intérêt', toast: 'Intérêt pour la prévente enregistré. Les nouveautés seront affichées ici.' }
  },
  pt: {
    common: { today: 'Buquê de hoje', member: 'Meu jardim', about: 'Sobre DailyFlora', objects: 'Objetos e colaborações', platforms: 'Plataformas', scifi: 'SciFi Flora', collect: 'Guardar este buquê', openWeb: 'Abrir versão web', explore: 'Explorar', system: 'Sistema', version: 'Ler código da versão...', siteNavigation: 'Navegação do site', signInExisting: 'Entrar com uma conta existente', createAccount: 'Criar conta', guestAuthHint: 'Entre para sincronizar sua coleção; crie uma conta se esta for sua primeira visita.' },
    index: { index: 'ÍNDICE', view: 'VISTA', hideView: 'FECHAR', currentBouquet: 'Buquê de hoje', myGarden: 'Meu jardim', about: 'Sobre DailyFlora', objects: 'Objetos e colaborações', platforms: 'Plataformas', favorite: 'Guardar este buquê', gardenStatusSigned: '{count} guardados' },
    view: { show: 'Mostrar controles', hide: 'Ocultar controles', howToUse: 'Como usar', date: 'Escolher data', random: 'Ver outra data', fullscreen: 'Tela cheia', zoomOut: 'Afastar', zoomIn: 'Aproximar', pause: 'Pausar rotação', resume: 'Continuar rotação', clock: 'Relógio', weekdays: 'Dom,Seg,Ter,Qua,Qui,Sex,Sáb' },
    about: { eyebrow: 'UM BUQUÊ PARA CADA DIA', title: 'Onde datas encontram flores.', lead: 'No escuro, um buquê se forma devagar. A data vira semente para uma flor digital silenciosa.', primary: 'Ver a flor de hoje', secondary: 'Manter um dia florido', quote: 'Não é uma imagem que você precisa terminar.' },
    member: { title: 'Meu jardim', lead: 'Cadastro e área pessoal. Por enquanto, tudo fica salvo neste dispositivo.' },
    platforms: { title: 'Deixe a flor ficar na tela que você mais usa.', lead: 'A versão web já funciona; as demais plataformas seguem como caminhos futuros.' },
    objects: { eyebrow: 'Edições DailyFlora', title: 'Leve DailyFlora para a vida cotidiana.', lead: 'Conheça os próximos objetos e registre interesse na pré-venda.', primary: 'Ver edições em pré-venda', secondary: '#Floristplan', sectionEyebrow: 'Próximas edições', sectionTitle: 'Objetos para o buquê DailyFlora viver além da tela.', sectionBody: 'Explore a primeira coleção e acompanhe o lançamento.', floristEyebrow: '#Floristplan', floristTitle: 'Plano de floristas DailyFlora', floristBody: 'Experiências urbanas, buquês físicos e colaborações com floristas.', cityTitle: 'Pontos de experiência nas cidades', cityBody: 'Hangzhou, Xangai e Shenzhen são as primeiras cidades candidatas.', bouquetCollabTitle: 'Edições de buquês físicos', bouquetCollabBody: 'Traduzir buquês digitais em flores reais, embalagens e vitrines.', collaborationTitle: 'Colaborações', collaborationBody: 'Uma futura entrada para floristas, criadores e parceiros urbanos.', interest: 'Registrar interesse', toast: 'Interesse de pré-venda salvo. As novidades aparecerão aqui.' }
  },
  it: {
    common: { today: 'Bouquet di oggi', member: 'Il mio giardino', about: 'Informazioni su DailyFlora', objects: 'Oggetti e collaborazioni', platforms: 'Piattaforme', scifi: 'SciFi Flora', collect: 'Conserva questo bouquet', openWeb: 'Apri versione web', explore: 'Esplora', system: 'Sistema', version: 'Leggi codice versione...', siteNavigation: 'Navigazione del sito', signInExisting: 'Accedi con un account esistente', createAccount: 'Crea account', guestAuthHint: 'Accedi per sincronizzare la tua raccolta; crea un account se è la tua prima visita.' },
    index: { index: 'INDICE', view: 'VISTA', hideView: 'CHIUDI', currentBouquet: 'Bouquet di oggi', myGarden: 'Il mio giardino', about: 'About DailyFlora', objects: 'Oggetti e collaborazioni', platforms: 'Piattaforme', favorite: 'Conserva questo bouquet', gardenStatusSigned: '{count} salvati' },
    view: { show: 'Mostra controlli', hide: 'Nascondi controlli', howToUse: 'Come si usa', date: 'Scegli data', random: 'Vedi un’altra data', fullscreen: 'Schermo intero', zoomOut: 'Allontana', zoomIn: 'Avvicina', pause: 'Pausa rotazione', resume: 'Riprendi rotazione', clock: 'Orologio', weekdays: 'Dom,Lun,Mar,Mer,Gio,Ven,Sab' },
    about: { eyebrow: 'UN BOUQUET PER OGNI GIORNO', title: 'Dove le date incontrano i fiori.', lead: 'Nel buio, un bouquet prende forma lentamente. La data diventa seme per un fiore digitale quieto.', primary: 'Vedi il fiore di oggi', secondary: 'Tenere un giorno in fiore', quote: 'Non è un’immagine da finire.' },
    member: { title: 'Il mio giardino', lead: 'Registrazione e spazio personale. Per ora tutto resta su questo dispositivo.' },
    platforms: { title: 'Lascia il fiore sullo schermo che usi di più.', lead: 'La versione web è disponibile; le altre piattaforme restano aperture future.' },
    objects: { eyebrow: 'Edizioni DailyFlora', title: 'Porta DailyFlora nella vita quotidiana.', lead: 'Scopri i prossimi oggetti e registra il tuo interesse per la prevendita.', primary: 'Vedi le edizioni in prevendita', secondary: '#Floristplan', sectionEyebrow: 'Prossime edizioni', sectionTitle: 'Oggetti che fanno vivere un bouquet DailyFlora oltre lo schermo.', sectionBody: 'Esplora la prima collezione e segui il lancio.', floristEyebrow: '#Floristplan', floristTitle: 'Piano fioristi DailyFlora', floristBody: 'Esperienze urbane, bouquet fisici e collaborazioni con fioristi.', cityTitle: 'Punti esperienza in città', cityBody: 'Hangzhou, Shanghai e Shenzhen sono le prime città candidate.', bouquetCollabTitle: 'Edizioni di bouquet fisici', bouquetCollabBody: 'Tradurre bouquet digitali in fiori reali, confezioni e vetrine.', collaborationTitle: 'Collaborazioni', collaborationBody: 'Un futuro ingresso per fioristi, creatori e partner urbani.', interest: 'Registra interesse', toast: 'Interesse per la prevendita salvato. Gli aggiornamenti appariranno qui.' }
  },
  ja: {
    common: { today: '今日の花束', member: '私の庭', about: 'DailyFlora について', objects: 'オブジェクトと協業', platforms: 'プラットフォーム', scifi: 'SciFi Flora', collect: 'この花束を残す', openWeb: 'Web版を開く', explore: '見る', system: 'システム', version: 'バージョンを読む…', siteNavigation: 'サイトナビゲーション', signInExisting: '既存のアカウントでログイン', createAccount: 'アカウントを作成', guestAuthHint: 'ログインするとコレクションを同期できます。初めての方はアカウントを作成してください。' },
    index: { index: 'INDEX', view: 'VIEW', hideView: 'CLOSE', siteMenu: 'DailyFlora メニュー', currentBouquet: '今日の花束', myGarden: '私の庭', about: 'DailyFlora について', objects: 'オブジェクトと協業', platforms: 'プラットフォーム', favorite: 'この花束を残す', debug: '美意識レビュー', openGarden: '私の庭を開く', favoriteToday: '今日の花束を保存', savedToday: '保存済み', gardenStatusSigned: '{count} 件保存' },
    view: { show: '表示設定を開く', hide: '表示設定を閉じる', howToUse: '使い方', date: '日付を選ぶ', random: '別の日を見る', fullscreen: '全画面', handOn: '手の操作を有効にする', handOff: '手の操作を閉じる', zoomOut: '引く', zoomIn: '寄る', pause: '回転を止める', resume: '回転を再開', reverse: 'カメラ経路を反転', clock: '時計', showClock: '時計を表示', hideClock: '時計を隠す', weekdays: '日,月,火,水,木,金,土' },
    about: { eyebrow: '毎日のための花束', title: '日付と花が、ここで出会う。', lead: '暗い空間の中で、一束の花がゆっくり形になる。日付は種になり、色と茎と余白が静かに育つ。', primary: '今日の花を見る', secondary: 'この日を咲かせておく', quote: 'これは「見終える」ための画像ではありません。' },
    member: { title: '私の庭', lead: '登録と作業場所です。いまはアカウント、保存、生成記録はこの端末だけに残ります。' },
    platforms: { title: 'よく使う画面に、花を置く。', lead: 'Web版はいま使えます。ほかの画面は、正直にこれからの入口として残します。' },
    objects: { eyebrow: 'DailyFlora エディション', title: 'DailyFlora を日常へ。', lead: '今後のプロダクトを見て、先行販売の案内を登録できます。', primary: '先行販売を見る', secondary: '#Floristplan', sectionEyebrow: '近日公開', sectionTitle: 'DailyFlora の花束を画面の外でも楽しむためのプロダクト。', sectionBody: '最初のコレクションを見て、発売情報を受け取れます。', floristEyebrow: '#Floristplan', floristTitle: 'DailyFlora フローリストプラン', floristBody: '都市体験、実物の花束エディション、花店とのコラボレーション。', cityTitle: '都市体験拠点', cityBody: '杭州、上海、深圳を最初の候補都市とします。', bouquetCollabTitle: '実物の花束エディション', bouquetCollabBody: '選ばれたデジタル花束を、生花、包装、店頭展示へ展開します。', collaborationTitle: 'コラボレーション', collaborationBody: '花店、制作者、都市パートナーのための将来の窓口です。', interest: '先行案内を登録', toast: '先行販売への関心を登録しました。最新情報はここに表示されます。' }
  }
};

const tutorialLocaleOverrides: Partial<Record<Locale, TranslationTree>> = {
  es: { tutorial: { title: 'CÓMO USARLO', lead: 'Una guía tranquila para dejar una flor en la pantalla.', basicsTitle: 'El ramo de cada día', basicsBody: 'Cada fecha crea su propio ramo. Arrastra para mirar alrededor, usa la rueda o los botones más y menos para cambiar la distancia y abre VISTA para ver el resto de controles.', controlsTitle: 'Controles de VISTA', controlsBody: 'Elige una fecha, cambia la densidad y el detalle, pausa la cámara o abre el reloj. Pulsa O para abrir VISTA y Esc para cerrar un modo abierto.', fullscreenTitle: 'Pantalla completa', fullscreenBody: 'La pantalla completa deja que el ramo ocupe la habitación. Pulsa F para entrar o salir; O sigue abriendo VISTA mientras está activa.', gestureTitle: 'Control con las manos', gestureBody: 'Activa los gestos desde VISTA y permite el acceso a la cámara. La imagen de la cámara se usa localmente en el navegador.', clockTitle: 'Modo reloj', clockBody: 'El modo reloj muestra la hora, la fecha, una cita rotativa y una composición especial. Ábrelo desde VISTA o activa Auto para iniciarlo tras el intervalo elegido. Pulsa Esc para salir.', acknowledge: 'Entendido', openHome: 'Abrir la flor de hoy', openGesture: 'Abrir el tutorial de gestos', openFullscreen: 'Abrir el tutorial de pantalla completa', openClock: 'Abrir el tutorial del reloj', openBasics: 'Abrir el tutorial básico' } },
  fr: { tutorial: { title: 'MODE D’EMPLOI', lead: 'Un guide calme pour garder une fleur à l’écran.', basicsTitle: 'Le bouquet du jour', basicsBody: 'Chaque date fait pousser son propre bouquet. Faites glisser pour regarder autour, utilisez la molette ou les boutons plus et moins pour changer la distance, puis ouvrez VUE.', controlsTitle: 'Contrôles de VUE', controlsBody: 'Choisissez une date, ajustez la densité et le détail, mettez la caméra en pause ou ouvrez l’horloge. O ouvre VUE et Esc ferme le mode ouvert.', fullscreenTitle: 'Plein écran', fullscreenBody: 'Le plein écran laisse le bouquet occuper la pièce. F entre ou sort du plein écran; O ouvre toujours VUE.', gestureTitle: 'Contrôle par les mains', gestureBody: 'Activez les gestes dans VUE et autorisez la caméra. L’image reste utilisée localement dans le navigateur.', clockTitle: 'Mode horloge', clockBody: 'Le mode horloge affiche l’heure, la date, une citation et une composition dédiée. Ouvrez-le dans VUE ou activez Auto après le délai choisi. Appuyez sur Esc pour quitter.', acknowledge: 'Compris', openHome: 'Voir la fleur du jour', openGesture: 'Ouvrir le guide des gestes', openFullscreen: 'Ouvrir le guide plein écran', openClock: 'Ouvrir le guide de l’horloge', openBasics: 'Ouvrir le guide de base' } },
  pt: { tutorial: { title: 'COMO USAR', lead: 'Um guia quieto para deixar uma flor na tela.', basicsTitle: 'O buquê de cada dia', basicsBody: 'Cada data cria seu próprio buquê. Arraste para olhar ao redor, use a roda ou os botões mais e menos para mudar a distância e abra VISTA para os outros controles.', controlsTitle: 'Controles de VISTA', controlsBody: 'Escolha uma data, ajuste densidade e detalhe, pause a câmera ou abra o relógio. O abre VISTA e Esc fecha o modo aberto.', fullscreenTitle: 'Tela cheia', fullscreenBody: 'A tela cheia deixa o buquê ocupar o ambiente. F entra ou sai da tela cheia; O continua abrindo VISTA.', gestureTitle: 'Controle com as mãos', gestureBody: 'Ative os gestos em VISTA e permita o acesso à câmera. A imagem é usada localmente no navegador.', clockTitle: 'Modo relógio', clockBody: 'O modo relógio mostra hora, data, uma citação e uma composição própria. Abra-o em VISTA ou ative Auto após o intervalo escolhido. Pressione Esc para sair.', acknowledge: 'Entendi', openHome: 'Abrir a flor de hoje', openGesture: 'Abrir tutorial de gestos', openFullscreen: 'Abrir tutorial de tela cheia', openClock: 'Abrir tutorial do relógio', openBasics: 'Abrir tutorial básico' } },
  it: { tutorial: { title: 'COME SI USA', lead: 'Una guida quieta per lasciare un fiore sullo schermo.', basicsTitle: 'Il bouquet del giorno', basicsBody: 'Ogni data crea il proprio bouquet. Trascina per guardarti intorno, usa la rotella o i pulsanti più e meno per cambiare distanza e apri VISTA per gli altri controlli.', controlsTitle: 'Controlli di VISTA', controlsBody: 'Scegli una data, regola densità e dettaglio, metti in pausa la camera o apri l’orologio. O apre VISTA ed Esc chiude la modalità aperta.', fullscreenTitle: 'Schermo intero', fullscreenBody: 'Lo schermo intero lascia che il bouquet occupi la stanza. F entra o esce; O continua ad aprire VISTA.', gestureTitle: 'Controllo con le mani', gestureBody: 'Attiva i gesti in VISTA e consenti l’accesso alla camera. L’immagine resta nel browser e viene usata localmente.', clockTitle: 'Modalità orologio', clockBody: 'La modalità orologio mostra ora, data, una citazione e una composizione dedicata. Aprila da VISTA o attiva Auto dopo l’intervallo scelto. Premi Esc per uscire.', acknowledge: 'Ho capito', openHome: 'Apri il fiore di oggi', openGesture: 'Apri il tutorial dei gesti', openFullscreen: 'Apri il tutorial a schermo intero', openClock: 'Apri il tutorial dell’orologio', openBasics: 'Apri il tutorial di base' } },
  ja: { tutorial: { title: '使い方', lead: '画面に花を置いておくための、静かな案内です。', basicsTitle: '毎日の花束', basicsBody: '日付ごとに一つの花束が生まれます。ドラッグで眺め、ホイールや＋／−で距離を変えます。ほかの設定は VIEW にあります。', controlsTitle: 'VIEW の設定', controlsBody: '日付、密度、描画の細かさ、回転、時計を選べます。O で VIEW を開き、Esc で開いているモードを閉じます。', fullscreenTitle: '全画面', fullscreenBody: '全画面では、部屋に花を置くように眺められます。F で全画面を切り替え、全画面中も O で VIEW を開けます。', gestureTitle: '手の操作', gestureBody: 'VIEW から手の操作を有効にし、カメラを許可します。カメラ映像はブラウザ内でのみ使われます。', clockTitle: '時計モード', clockBody: '時計モードでは時刻、日付、引用文と専用の花束構図を表示します。VIEW から開くか、選択した待機時間後に自動で開始できます。Esc で終了します。', acknowledge: 'わかりました', openHome: '今日の花を開く', openGesture: '手の操作を見る', openFullscreen: '全画面の使い方を見る', openClock: '時計モードの使い方を見る', openBasics: '基本の使い方を見る' } }
};

function deepMerge(base: TranslationTree, override: TranslationTree): TranslationTree {
  const next: TranslationTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = next[key];
    next[key] =
      typeof value === 'object' && value && typeof baseValue === 'object' && baseValue
        ? deepMerge(baseValue, value)
        : value;
  }
  return next;
}

for (const locale of locales) {
  if (locale === 'en' || locale === 'zh-CN') continue;
  translations[locale] = deepMerge(
    deepMerge(translations.en, conciseLocaleOverrides[locale] || {}),
    tutorialLocaleOverrides[locale] || {}
  );
}

const registrationConsentLocaleOverrides: Partial<Record<Locale, TranslationTree>> = {
  es: { member: { consentPrefix: 'He leído y acepto los', consentAnd: 'y la' } },
  fr: { member: { consentPrefix: 'J’ai lu et j’accepte les', consentAnd: 'et la' } },
  pt: { member: { consentPrefix: 'Li e concordo com os', consentAnd: 'e a' } },
  it: { member: { consentPrefix: 'Ho letto e accetto i', consentAnd: 'e la' } },
  ja: { member: { consentPrefix: '以下を読み、同意します：', consentAnd: 'および' } }
};

for (const locale of locales) {
  const override = registrationConsentLocaleOverrides[locale];
  if (override) translations[locale] = deepMerge(translations[locale], override);
}

const authLocaleOverrides: Record<Locale, TranslationTree> = {
  en: {
    auth: {
      signupEyebrow: 'DailyFlora ID',
      signupTitle: 'Create your garden.',
      signupLead: 'Your saved bouquets, generation history, and private garden sync across devices after you sign up.',
      proofCloud: 'Cloud account',
      proofPrivate: 'Private garden records',
      proofLogout: 'Sign out anytime',
      signupStep: 'Create account',
      signupHeading: 'Create account',
      existingPrompt: 'Already have an account?',
      nameLabel: 'Your name',
      namePlaceholder: 'For example: Flora',
      emailLabel: 'Email',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '8–128 characters',
      consentPrefix: 'I have read and agree to the',
      termsLink: 'Terms of Use',
      consentAnd: 'and the',
      privacyLink: 'Privacy Policy',
      consentPeriod: '.',
      signupSubmit: 'Create account',
      loginEyebrow: 'DailyFlora ID',
      loginTitle: 'Welcome back to your garden.',
      loginLead: 'Sign in on a new device to continue with the same collection, generation history, and private garden.',
      loginStep: 'Sign in',
      loginHeading: 'Sign in',
      noAccountPrompt: 'Don’t have an account?',
      signupLink: 'Create one now',
      loginSubmit: 'Sign in and open garden',
      forgotPassword: 'Forgot password?',
      forgotEmailLabel: 'Registration email',
      sendReset: 'Send reset email',
      backToLogin: 'Back to sign in',
      newPasswordLabel: 'New password',
      confirmPasswordLabel: 'Confirm new password',
      savePassword: 'Save new password and sign in'
    }
  },
  'zh-CN': {
    auth: {
      signupEyebrow: 'DailyFlora ID',
      signupTitle: '建立你的花园。',
      signupLead: '注册后，收藏、生成历史和个人花园会随账户跨设备同步。',
      proofCloud: '真实云端账户',
      proofPrivate: '私有花园记录',
      proofLogout: '随时可以退出',
      signupStep: '创建账户',
      signupHeading: '注册',
      existingPrompt: '已经有账户？',
      nameLabel: '怎么称呼你',
      namePlaceholder: '例如：小花',
      emailLabel: '邮箱',
      emailPlaceholder: 'name@example.com',
      passwordLabel: '密码',
      passwordPlaceholder: '8–128 位',
      consentPrefix: '我已阅读并同意',
      termsLink: '使用条款',
      consentAnd: '和',
      privacyLink: '隐私政策',
      consentPeriod: '。',
      signupSubmit: '创建账户',
      loginEyebrow: 'DailyFlora ID',
      loginTitle: '欢迎回到花园。',
      loginLead: '在新设备登录后，继续查看同一份收藏、生成历史与个人花园。',
      loginStep: '登录',
      loginHeading: '登录',
      noAccountPrompt: '还没有账户？',
      signupLink: '立即注册',
      loginSubmit: '登录并打开花园',
      forgotPassword: '忘记密码？',
      forgotEmailLabel: '注册邮箱',
      sendReset: '发送重置邮件',
      backToLogin: '返回登录',
      newPasswordLabel: '新密码',
      confirmPasswordLabel: '确认新密码',
      savePassword: '保存新密码并登录'
    }
  },
  es: {
    auth: {
      signupEyebrow: 'DailyFlora ID', signupTitle: 'Crea tu jardín.', signupLead: 'Tus ramos guardados, tu historial y tu jardín privado se sincronizan entre dispositivos al registrarte.', proofCloud: 'Cuenta en la nube', proofPrivate: 'Registros privados', proofLogout: 'Puedes salir cuando quieras', signupStep: 'Crear cuenta', signupHeading: 'Crear cuenta', existingPrompt: '¿Ya tienes una cuenta?', nameLabel: 'Tu nombre', namePlaceholder: 'Por ejemplo: Flora', emailLabel: 'Correo electrónico', emailPlaceholder: 'name@example.com', passwordLabel: 'Contraseña', passwordPlaceholder: '8–128 caracteres', consentPrefix: 'He leído y acepto los', termsLink: 'Términos de uso', consentAnd: 'y la', privacyLink: 'Política de privacidad', consentPeriod: '.', signupSubmit: 'Crear cuenta', loginEyebrow: 'DailyFlora ID', loginTitle: 'Vuelve a tu jardín.', loginLead: 'Inicia sesión en un dispositivo nuevo para continuar con tu colección, historial y jardín privado.', loginStep: 'Iniciar sesión', loginHeading: 'Iniciar sesión', noAccountPrompt: '¿No tienes una cuenta?', signupLink: 'Regístrate ahora', loginSubmit: 'Iniciar sesión y abrir el jardín', forgotPassword: '¿Olvidaste la contraseña?', forgotEmailLabel: 'Correo de registro', sendReset: 'Enviar correo de restablecimiento', backToLogin: 'Volver a iniciar sesión', newPasswordLabel: 'Nueva contraseña', confirmPasswordLabel: 'Confirmar nueva contraseña', savePassword: 'Guardar contraseña e iniciar sesión'
    }
  },
  fr: {
    auth: {
      signupEyebrow: 'DailyFlora ID', signupTitle: 'Créez votre jardin.', signupLead: 'Vos bouquets, votre historique et votre jardin privé se synchronisent entre appareils après votre inscription.', proofCloud: 'Compte cloud', proofPrivate: 'Archives privées', proofLogout: 'Déconnexion à tout moment', signupStep: 'Créer un compte', signupHeading: 'Créer un compte', existingPrompt: 'Vous avez déjà un compte ?', nameLabel: 'Votre nom', namePlaceholder: 'Par exemple : Flora', emailLabel: 'E-mail', emailPlaceholder: 'name@example.com', passwordLabel: 'Mot de passe', passwordPlaceholder: '8 à 128 caractères', consentPrefix: 'J’ai lu et j’accepte les', termsLink: 'Conditions d’utilisation', consentAnd: 'et la', privacyLink: 'Politique de confidentialité', consentPeriod: '.', signupSubmit: 'Créer un compte', loginEyebrow: 'DailyFlora ID', loginTitle: 'Retrouvez votre jardin.', loginLead: 'Connectez-vous sur un nouvel appareil pour retrouver votre collection, votre historique et votre jardin privé.', loginStep: 'Connexion', loginHeading: 'Connexion', noAccountPrompt: 'Vous n’avez pas encore de compte ?', signupLink: 'Inscrivez-vous maintenant', loginSubmit: 'Se connecter et ouvrir le jardin', forgotPassword: 'Mot de passe oublié ?', forgotEmailLabel: 'E-mail d’inscription', sendReset: 'Envoyer l’e-mail de réinitialisation', backToLogin: 'Retour à la connexion', newPasswordLabel: 'Nouveau mot de passe', confirmPasswordLabel: 'Confirmer le nouveau mot de passe', savePassword: 'Enregistrer et se connecter'
    }
  },
  pt: {
    auth: {
      signupEyebrow: 'DailyFlora ID', signupTitle: 'Crie o seu jardim.', signupLead: 'Seus buquês salvos, histórico e jardim privado sincronizam entre dispositivos após o cadastro.', proofCloud: 'Conta na nuvem', proofPrivate: 'Registros privados', proofLogout: 'Saia quando quiser', signupStep: 'Criar conta', signupHeading: 'Criar conta', existingPrompt: 'Já tem uma conta?', nameLabel: 'Seu nome', namePlaceholder: 'Por exemplo: Flora', emailLabel: 'E-mail', emailPlaceholder: 'name@example.com', passwordLabel: 'Senha', passwordPlaceholder: '8–128 caracteres', consentPrefix: 'Li e concordo com os', termsLink: 'Termos de uso', consentAnd: 'e a', privacyLink: 'Política de privacidade', consentPeriod: '.', signupSubmit: 'Criar conta', loginEyebrow: 'DailyFlora ID', loginTitle: 'Bem-vindo de volta ao jardim.', loginLead: 'Entre em um novo dispositivo para continuar com a mesma coleção, histórico e jardim privado.', loginStep: 'Entrar', loginHeading: 'Entrar', noAccountPrompt: 'Ainda não tem uma conta?', signupLink: 'Cadastre-se agora', loginSubmit: 'Entrar e abrir o jardim', forgotPassword: 'Esqueceu a senha?', forgotEmailLabel: 'E-mail de cadastro', sendReset: 'Enviar e-mail de redefinição', backToLogin: 'Voltar ao login', newPasswordLabel: 'Nova senha', confirmPasswordLabel: 'Confirmar nova senha', savePassword: 'Salvar senha e entrar'
    }
  },
  it: {
    auth: {
      signupEyebrow: 'DailyFlora ID', signupTitle: 'Crea il tuo giardino.', signupLead: 'Dopo la registrazione, bouquet salvati, cronologia e giardino privato si sincronizzano tra i dispositivi.', proofCloud: 'Account cloud', proofPrivate: 'Record privati', proofLogout: 'Esci quando vuoi', signupStep: 'Crea account', signupHeading: 'Crea account', existingPrompt: 'Hai già un account?', nameLabel: 'Il tuo nome', namePlaceholder: 'Per esempio: Flora', emailLabel: 'E-mail', emailPlaceholder: 'name@example.com', passwordLabel: 'Password', passwordPlaceholder: '8–128 caratteri', consentPrefix: 'Ho letto e accetto i', termsLink: 'Termini di utilizzo', consentAnd: 'e la', privacyLink: 'Privacy Policy', consentPeriod: '.', signupSubmit: 'Crea account', loginEyebrow: 'DailyFlora ID', loginTitle: 'Bentornato nel giardino.', loginLead: 'Accedi da un nuovo dispositivo per continuare con la stessa raccolta, cronologia e giardino privato.', loginStep: 'Accedi', loginHeading: 'Accedi', noAccountPrompt: 'Non hai ancora un account?', signupLink: 'Registrati ora', loginSubmit: 'Accedi e apri il giardino', forgotPassword: 'Password dimenticata?', forgotEmailLabel: 'E-mail di registrazione', sendReset: 'Invia e-mail di reimpostazione', backToLogin: 'Torna all’accesso', newPasswordLabel: 'Nuova password', confirmPasswordLabel: 'Conferma nuova password', savePassword: 'Salva password e accedi'
    }
  },
  ja: {
    auth: {
      signupEyebrow: 'DailyFlora ID', signupTitle: 'あなたの庭をつくる。', signupLead: '登録すると、保存した花束、生成履歴、個人の庭が端末をまたいで同期されます。', proofCloud: 'クラウドアカウント', proofPrivate: '非公開の庭の記録', proofLogout: 'いつでもログアウト', signupStep: 'アカウント作成', signupHeading: '登録', existingPrompt: 'すでにアカウントをお持ちですか？', nameLabel: 'お名前', namePlaceholder: '例：Flora', emailLabel: 'メールアドレス', emailPlaceholder: 'name@example.com', passwordLabel: 'パスワード', passwordPlaceholder: '8～128文字', consentPrefix: '以下を読み、同意します：', termsLink: '利用規約', consentAnd: 'および', privacyLink: 'プライバシーポリシー', consentPeriod: '。', signupSubmit: 'アカウントを作成', loginEyebrow: 'DailyFlora ID', loginTitle: '庭へおかえりなさい。', loginLead: '新しい端末でログインすると、保存した花束、生成履歴、個人の庭を続けて利用できます。', loginStep: 'ログイン', loginHeading: 'ログイン', noAccountPrompt: 'アカウントをお持ちでないですか？', signupLink: '今すぐ登録', loginSubmit: 'ログインして庭を開く', forgotPassword: 'パスワードを忘れた場合', forgotEmailLabel: '登録メールアドレス', sendReset: '再設定メールを送る', backToLogin: 'ログインに戻る', newPasswordLabel: '新しいパスワード', confirmPasswordLabel: '新しいパスワード（確認）', savePassword: '保存してログイン'
    }
  }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], authLocaleOverrides[locale]);
}

const controlLocaleOverrides: Record<Locale, TranslationTree> = {
  en: { view: { densityLowShort: 'LOW', densityMediumShort: 'MID', densityHighShort: 'HIGH', renderAutoShort: 'AUTO', renderLowShort: 'ECO', renderMediumShort: 'CLEAR', renderHighShort: 'FINE', clockLabel: 'clock', clockMinutes: 'min', clockAuto: 'AUTO', clockSettings: 'Idle clock settings' }, hand: { title: 'Camera gestures', guideButton: 'Hand tutorial', guideTitle: 'DailyFlora hand tutorial', close: 'Close', enable: 'Enable camera', restart: 'Restart' }, shortcuts: { title: 'FULLSCREEN CONTROLS', intro: 'These keys work throughout the daily bouquet view.', fullscreen: 'Enter or leave fullscreen', escape: 'Press Esc to close this guide and leave fullscreen', dates: 'Move to the previous or next day', arrowZoom: 'Move closer to or farther from the bouquet', zoom: 'Move closer to or farther from the bouquet', random: 'Open a random date', reset: 'Restore the default view', preset: 'Change the camera route preset', rotation: 'Pause or resume automatic rotation', interface: 'Hide or reveal the interface', view: 'Open or close VIEW', help: 'Open this guide again', dismiss: "Don't show automatically again", more: 'Full instructions' } },
  'zh-CN': { view: { densityLowShort: '疏', densityMediumShort: '中', densityHighShort: '密', renderAutoShort: '自', renderLowShort: '省', renderMediumShort: '清', renderHighShort: '精', clockLabel: '钟', clockMinutes: '分', clockAuto: '自动', clockSettings: '时钟设置' }, hand: { title: '摄像头手势', guideButton: '手势教程', guideTitle: 'DailyFlora 手势教程', close: '关闭', enable: '启用摄像头', restart: '重新启用' }, shortcuts: { title: '全屏观看快捷键', intro: '这些按键在每日花束界面中都可以使用。', fullscreen: '进入或退出全屏', escape: '按 Esc 关闭教程并退出全屏', dates: '切换前一天与后一天', arrowZoom: '拉近或拉远花束', zoom: '拉近或拉远花束', random: '随机查看一个日期', reset: '恢复默认视角', preset: '更换镜头旋转路径预设', rotation: '暂停或继续自动旋转', interface: '隐藏或显示界面', view: '打开或收起 VIEW', help: '重新打开本教程', dismiss: '以后不再自动显示', more: '查看完整教程' } },
  es: { view: { densityLowShort: 'BAJO', densityMediumShort: 'MED', densityHighShort: 'ALTO', renderAutoShort: 'AUTO', renderLowShort: 'ECO', renderMediumShort: 'CLARO', renderHighShort: 'FINO', clockLabel: 'reloj', clockMinutes: 'min', clockAuto: 'AUTO', clockSettings: 'Ajustes del reloj' }, hand: { title: 'Gestos con cámara', guideButton: 'Guía de gestos', guideTitle: 'Guía de gestos DailyFlora', close: 'Cerrar', enable: 'Activar cámara', restart: 'Reactivar' }, shortcuts: { title: 'CONTROLES DE PANTALLA COMPLETA', intro: 'Estas teclas funcionan en la vista diaria del ramo.', fullscreen: 'Entrar o salir de pantalla completa', escape: 'Cerrar esta guía y después salir de pantalla completa', dates: 'Ir al día anterior o siguiente', arrowZoom: 'Acercarse o alejarse del ramo', zoom: 'Acercarse o alejarse del ramo', random: 'Abrir una fecha al azar', reset: 'Restaurar la vista inicial', preset: 'Cambiar la ruta de cámara', rotation: 'Pausar o reanudar la rotación', interface: 'Ocultar o mostrar la interfaz', view: 'Abrir o cerrar VISTA', help: 'Abrir de nuevo esta guía', dismiss: 'No mostrar automáticamente otra vez', more: 'Ver la guía completa' } },
  fr: { view: { densityLowShort: 'PEU', densityMediumShort: 'MOY', densityHighShort: 'DENSE', renderAutoShort: 'AUTO', renderLowShort: 'ÉCO', renderMediumShort: 'CLAIR', renderHighShort: 'FIN', clockLabel: 'horloge', clockMinutes: 'min', clockAuto: 'AUTO', clockSettings: 'Réglages de l’horloge' }, hand: { title: 'Gestes caméra', guideButton: 'Guide des gestes', guideTitle: 'Guide des gestes DailyFlora', close: 'Fermer', enable: 'Activer la caméra', restart: 'Réactiver' }, shortcuts: { title: 'COMMANDES PLEIN ÉCRAN', intro: 'Ces touches fonctionnent dans la vue du bouquet quotidien.', fullscreen: 'Entrer ou quitter le plein écran', escape: 'Fermer ce guide, puis quitter le plein écran', dates: 'Passer au jour précédent ou suivant', arrowZoom: 'Se rapprocher ou s’éloigner du bouquet', zoom: 'Se rapprocher ou s’éloigner du bouquet', random: 'Ouvrir une date aléatoire', reset: 'Rétablir la vue initiale', preset: 'Changer le parcours caméra', rotation: 'Suspendre ou reprendre la rotation', interface: 'Masquer ou afficher l’interface', view: 'Ouvrir ou fermer VUE', help: 'Rouvrir ce guide', dismiss: 'Ne plus afficher automatiquement', more: 'Voir le guide complet' } },
  pt: { view: { densityLowShort: 'BAIXO', densityMediumShort: 'MÉD', densityHighShort: 'ALTO', renderAutoShort: 'AUTO', renderLowShort: 'ECO', renderMediumShort: 'CLARO', renderHighShort: 'FINO', clockLabel: 'relógio', clockMinutes: 'min', clockAuto: 'AUTO', clockSettings: 'Ajustes do relógio' }, hand: { title: 'Gestos pela câmera', guideButton: 'Guia de gestos', guideTitle: 'Guia de gestos DailyFlora', close: 'Fechar', enable: 'Ativar câmera', restart: 'Reativar' }, shortcuts: { title: 'CONTROLES DE TELA CHEIA', intro: 'Estas teclas funcionam na vista diária do buquê.', fullscreen: 'Entrar ou sair da tela cheia', escape: 'Fechar este guia e depois sair da tela cheia', dates: 'Ir para o dia anterior ou seguinte', arrowZoom: 'Aproximar ou afastar o buquê', zoom: 'Aproximar ou afastar o buquê', random: 'Abrir uma data aleatória', reset: 'Restaurar a vista inicial', preset: 'Trocar a rota da câmera', rotation: 'Pausar ou retomar a rotação', interface: 'Ocultar ou mostrar a interface', view: 'Abrir ou fechar VISTA', help: 'Abrir este guia novamente', dismiss: 'Não mostrar automaticamente outra vez', more: 'Ver o guia completo' } },
  it: { view: { densityLowShort: 'BASSO', densityMediumShort: 'MED', densityHighShort: 'ALTO', renderAutoShort: 'AUTO', renderLowShort: 'ECO', renderMediumShort: 'CHIARO', renderHighShort: 'FINE', clockLabel: 'orologio', clockMinutes: 'min', clockAuto: 'AUTO', clockSettings: 'Impostazioni orologio' }, hand: { title: 'Gesti con la camera', guideButton: 'Guida ai gesti', guideTitle: 'Guida ai gesti DailyFlora', close: 'Chiudi', enable: 'Attiva camera', restart: 'Riattiva' }, shortcuts: { title: 'COMANDI A SCHERMO INTERO', intro: 'Questi tasti funzionano nella vista del bouquet quotidiano.', fullscreen: 'Entrare o uscire dallo schermo intero', escape: 'Chiudere questa guida, poi uscire dallo schermo intero', dates: 'Passare al giorno precedente o successivo', arrowZoom: 'Avvicinarsi o allontanarsi dal bouquet', zoom: 'Avvicinarsi o allontanarsi dal bouquet', random: 'Aprire una data casuale', reset: 'Ripristinare la vista iniziale', preset: 'Cambiare il percorso della camera', rotation: 'Mettere in pausa o riprendere la rotazione', interface: 'Nascondere o mostrare l’interfaccia', view: 'Aprire o chiudere VISTA', help: 'Riaprire questa guida', dismiss: 'Non mostrare più automaticamente', more: 'Vedi la guida completa' } },
  ja: { view: { densityLowShort: '少', densityMediumShort: '中', densityHighShort: '多', renderAutoShort: '自動', renderLowShort: '省', renderMediumShort: '清', renderHighShort: '精', clockLabel: '時計', clockMinutes: '分', clockAuto: '自動', clockSettings: '時計の設定' }, hand: { title: 'カメラジェスチャー', guideButton: 'ジェスチャーの使い方', guideTitle: 'DailyFlora ジェスチャーの使い方', close: '閉じる', enable: 'カメラを有効にする', restart: '再開する' }, shortcuts: { title: '全画面のキー操作', intro: '毎日の花束画面で使えるキーです。', fullscreen: '全画面の開始と終了', escape: '案内を閉じ、その後に全画面を終了', dates: '前の日、次の日へ移動', arrowZoom: '花束に近づく、離れる', zoom: '花束に近づく、離れる', random: '別の日をランダムに開く', reset: '最初の視点に戻す', preset: 'カメラの経路プリセットを変更', rotation: '自動回転を止める、再開する', interface: '画面表示を隠す、戻す', view: 'VIEW を開く、閉じる', help: 'この案内をもう一度開く', dismiss: '今後は自動で表示しない', more: '詳しい使い方を見る' } }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], controlLocaleOverrides[locale]);
}

const handGestureLocaleOverrides: Record<Locale, TranslationTree> = {
  en: { hand: { gestureTableTitle: 'DailyFlora hand gestures', indexLabel: 'Either hand ☝', indexAction: 'Cycle bouquet density', victoryLabel: 'Either hand ✌', victoryAction: 'Cycle render detail', threeLabel: 'Either hand, three fingers', threeAction: 'Toggle clock mode (custom recognition)', thumbLabel: 'Either hand 👍', thumbAction: 'Resume or stop the automatic camera', fourLabel: 'Either hand, four fingers', fourAction: 'Request fullscreen; confirm on screen (thumb folded)', fistLabel: 'Either hand ✊', fistAction: 'Safety brake: stop all controls', pinchLabel: 'Right thumb + index', pinchAction: 'Pinch when close; hold and move on X / Y', openLabel: 'Either hand fully open', openAction: 'Push or pull depth (direction reversed)', curledLabel: 'Either hand slightly closed', curledAction: 'Move the palm to rotate the camera', twoHandsLabel: 'Both hands visible', twoHandsAction: 'Spread acceleration assists zoom' } },
  'zh-CN': { hand: { gestureTableTitle: 'DAILYFLORA 手势表', indexLabel: '任一手 ☝', indexAction: '切换疏密程度', victoryLabel: '任一手 ✌', victoryAction: '切换精细程度', threeLabel: '任一手三指', threeAction: '切换时钟（自定义识别）', thumbLabel: '任一手 👍', thumbAction: '自动镜头恢复 / 停止', fourLabel: '任一手四指', fourAction: '请求进入全屏，点击屏幕提示确认（拇指收起）', fistLabel: '任一手 ✊', fistAction: '安全刹车，停止全部控制', pinchLabel: '右拇指 + 食指', pinchAction: '靠近即 pinch，按住移动 X / Y', openLabel: '任一手完全张开', openAction: 'depth 推进 / 拉远（已反向）', curledLabel: '任一手稍微合拢', curledAction: '移动手掌旋转镜头', twoHandsLabel: '两只手同时出现', twoHandsAction: 'spread 加速度辅助缩放' } },
  es: { hand: { gestureTableTitle: 'Gestos de DailyFlora', indexLabel: 'Cualquier mano ☝', indexAction: 'Cambiar la densidad del ramo', victoryLabel: 'Cualquier mano ✌', victoryAction: 'Cambiar el nivel de detalle', threeLabel: 'Tres dedos, cualquier mano', threeAction: 'Alternar el reloj (reconocimiento propio)', thumbLabel: 'Cualquier mano 👍', thumbAction: 'Reanudar o detener la cámara automática', fourLabel: 'Cuatro dedos, cualquier mano', fourAction: 'Solicitar pantalla completa y confirmar en pantalla (pulgar plegado)', fistLabel: 'Cualquier mano ✊', fistAction: 'Freno de seguridad: detener todos los controles', pinchLabel: 'Pulgar e índice derechos', pinchAction: 'Pinza al acercarlos; mantener y mover en X / Y', openLabel: 'Cualquier mano abierta', openAction: 'Avanzar o alejar con profundidad (invertida)', curledLabel: 'Cualquier mano algo cerrada', curledAction: 'Mover la palma para rotar la cámara', twoHandsLabel: 'Las dos manos visibles', twoHandsAction: 'La aceleración de apertura ayuda al zoom' } },
  fr: { hand: { gestureTableTitle: 'Gestes DailyFlora', indexLabel: 'Une main ☝', indexAction: 'Changer la densité du bouquet', victoryLabel: 'Une main ✌', victoryAction: 'Changer le niveau de détail', threeLabel: 'Trois doigts, une main', threeAction: 'Basculer l’horloge (reconnaissance dédiée)', thumbLabel: 'Une main 👍', thumbAction: 'Relancer ou arrêter la caméra automatique', fourLabel: 'Quatre doigts, une main', fourAction: 'Demander le plein écran puis confirmer à l’écran (pouce replié)', fistLabel: 'Une main ✊', fistAction: 'Frein de sécurité : arrêter toutes les commandes', pinchLabel: 'Pouce et index droits', pinchAction: 'Pincer en les rapprochant, maintenir et déplacer en X / Y', openLabel: 'Une main complètement ouverte', openAction: 'Avancer ou reculer en profondeur (sens inversé)', curledLabel: 'Une main légèrement refermée', curledAction: 'Déplacer la paume pour faire tourner la caméra', twoHandsLabel: 'Les deux mains visibles', twoHandsAction: 'L’accélération d’écartement aide au zoom' } },
  pt: { hand: { gestureTableTitle: 'Gestos do DailyFlora', indexLabel: 'Qualquer mão ☝', indexAction: 'Alternar a densidade do buquê', victoryLabel: 'Qualquer mão ✌', victoryAction: 'Alternar o nível de detalhe', threeLabel: 'Três dedos, qualquer mão', threeAction: 'Alternar o relógio (reconhecimento próprio)', thumbLabel: 'Qualquer mão 👍', thumbAction: 'Retomar ou parar a câmera automática', fourLabel: 'Quatro dedos, qualquer mão', fourAction: 'Solicitar tela cheia e confirmar na tela (polegar recolhido)', fistLabel: 'Qualquer mão ✊', fistAction: 'Freio de segurança: parar todos os controles', pinchLabel: 'Polegar e indicador direitos', pinchAction: 'Pinça ao aproximar; segure e mova em X / Y', openLabel: 'Qualquer mão totalmente aberta', openAction: 'Avançar ou afastar por profundidade (invertida)', curledLabel: 'Qualquer mão um pouco fechada', curledAction: 'Mover a palma para girar a câmera', twoHandsLabel: 'As duas mãos visíveis', twoHandsAction: 'A aceleração de abertura auxilia o zoom' } },
  it: { hand: { gestureTableTitle: 'Gesti DailyFlora', indexLabel: 'Una mano ☝', indexAction: 'Cambia la densità del bouquet', victoryLabel: 'Una mano ✌', victoryAction: 'Cambia il livello di dettaglio', threeLabel: 'Tre dita, una mano', threeAction: 'Attiva o disattiva l’orologio (riconoscimento dedicato)', thumbLabel: 'Una mano 👍', thumbAction: 'Riprende o ferma la camera automatica', fourLabel: 'Quattro dita, una mano', fourAction: 'Richiedi lo schermo intero e conferma sullo schermo (pollice chiuso)', fistLabel: 'Una mano ✊', fistAction: 'Freno di sicurezza: ferma tutti i controlli', pinchLabel: 'Pollice e indice destri', pinchAction: 'Pinch quando si avvicinano; tieni e sposta in X / Y', openLabel: 'Una mano completamente aperta', openAction: 'Avanza o allontana con la profondità (invertita)', curledLabel: 'Una mano leggermente chiusa', curledAction: 'Muovi il palmo per ruotare la camera', twoHandsLabel: 'Entrambe le mani visibili', twoHandsAction: 'L’accelerazione di apertura aiuta lo zoom' } },
  ja: { hand: { gestureTableTitle: 'DailyFlora 手の操作', indexLabel: 'どちらかの手 ☝', indexAction: '花束の密度を切り替える', victoryLabel: 'どちらかの手 ✌', victoryAction: '描画の細かさを切り替える', threeLabel: 'どちらかの手で三本指', threeAction: '時計を切り替える（独自認識）', thumbLabel: 'どちらかの手 👍', thumbAction: '自動カメラを再開、停止する', fourLabel: 'どちらかの手で四本指', fourAction: '全画面をリクエストし、画面上で確認する（親指を閉じる）', fistLabel: 'どちらかの手 ✊', fistAction: '安全停止：すべての操作を止める', pinchLabel: '右手の親指 + 人差し指', pinchAction: '近づけて pinch、保ったまま X / Y に動かす', openLabel: 'どちらかの手を完全に開く', openAction: 'depth で寄る、引く（方向反転済み）', curledLabel: 'どちらかの手を少し閉じる', curledAction: '手のひらを動かしてカメラを回す', twoHandsLabel: '両手を同時に表示', twoHandsAction: 'spread の加速度でズームを補助する' } }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], handGestureLocaleOverrides[locale]);
}

const handFullscreenLocaleOverrides: Record<Locale, TranslationTree> = {
  en: { hand: { fullscreenGestureReady: 'Four fingers recognized. Fullscreen needs one click.', fullscreenGestureButton: 'Enter fullscreen', fullscreenGestureDismiss: 'Dismiss fullscreen request', fullscreenGestureFailed: 'Fullscreen was blocked. Use the fullscreen button or press F.' } },
  'zh-CN': { hand: { fullscreenGestureReady: '已识别四指；浏览器要求点击确认全屏。', fullscreenGestureButton: '进入全屏', fullscreenGestureDismiss: '关闭全屏提示', fullscreenGestureFailed: '浏览器阻止了全屏，请使用全屏按钮或按 F。' } },
  es: { hand: { fullscreenGestureReady: 'Cuatro dedos reconocidos. La pantalla completa necesita un clic.', fullscreenGestureButton: 'Pantalla completa', fullscreenGestureDismiss: 'Cerrar solicitud', fullscreenGestureFailed: 'El navegador bloqueó la pantalla completa. Usa el botón o pulsa F.' } },
  fr: { hand: { fullscreenGestureReady: 'Quatre doigts reconnus. Le plein écran demande un clic.', fullscreenGestureButton: 'Plein écran', fullscreenGestureDismiss: 'Fermer la demande', fullscreenGestureFailed: 'Le navigateur a bloqué le plein écran. Utilisez le bouton ou F.' } },
  pt: { hand: { fullscreenGestureReady: 'Quatro dedos reconhecidos. A tela cheia requer um clique.', fullscreenGestureButton: 'Tela cheia', fullscreenGestureDismiss: 'Fechar pedido', fullscreenGestureFailed: 'O navegador bloqueou a tela cheia. Use o botão ou pressione F.' } },
  it: { hand: { fullscreenGestureReady: 'Quattro dita riconosciute. Lo schermo intero richiede un clic.', fullscreenGestureButton: 'Schermo intero', fullscreenGestureDismiss: 'Chiudi richiesta', fullscreenGestureFailed: 'Il browser ha bloccato lo schermo intero. Usa il pulsante o premi F.' } },
  ja: { hand: { fullscreenGestureReady: '四本指を認識しました。全画面にはクリック確認が必要です。', fullscreenGestureButton: '全画面にする', fullscreenGestureDismiss: '全画面の確認を閉じる', fullscreenGestureFailed: '全画面が拒否されました。ボタンまたは F キーを使用してください。' } }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], handFullscreenLocaleOverrides[locale]);
}

const handPanelLocaleOverrides: Record<Locale, TranslationTree> = {
  en: { hand: { statusOff: 'Enable the camera; recognition runs only in this page.', statusLoading: 'The camera is ready. Loading the hand-recognition model…', statusRequesting: 'Allow this page to use the camera.', statusRunning: 'Camera is on. Place both hands in view.', statusModelError: 'The camera is ready, but the hand model could not be loaded.', statusError: 'The camera could not be started.', cameraOff: 'CAMERA OFF', cameraLoading: 'LOADING MODEL', cameraRequesting: 'ALLOW CAMERA', modelError: 'MODEL ERROR', cameraError: 'CAMERA ERROR', retryModel: 'Retry model', swapLabel: 'Left/right correction', swapHint: 'On by default; turn off if hands are reversed', rightHand: 'RIGHT', leftHand: 'LEFT', notDetected: 'Not detected', rightGesture: 'Right gesture', leftGesture: 'Left gesture', indexPinch: 'Index pinch', rightDepth: 'Right depth', leftDepth: 'Left depth', rightOpen: 'Right openness', leftOpen: 'Left openness', spreadAcceleration: 'Two-hand acceleration', actualOutput: 'ACTUAL OUTPUT', waitingCamera: 'Waiting for camera', mode: 'MODE', idle: 'IDLE', handsUnit: 'HAND', poseThumb: 'Thumb up', poseFist: 'Fist', posePoint: 'Pointing', poseVictory: 'Victory', poseThree: 'Three fingers', poseFour: 'Four fingers', poseOpen: 'Open palm', poseUnknown: 'Unknown', poseNone: 'No gesture' } },
  'zh-CN': { hand: { statusOff: '点击启用后，识别完全在当前网页中运行。', statusLoading: '摄像头已开启，正在加载手部识别模型…', statusRequesting: '请允许网页使用摄像头。', statusRunning: '摄像头已开启，请把双手放进画面。', statusModelError: '摄像头已经可用，但手势模型加载失败。', statusError: '摄像头无法启动，请检查浏览器权限。', cameraOff: '摄像头关闭', cameraLoading: '正在加载模型', cameraRequesting: '等待摄像头权限', modelError: '模型错误', cameraError: '摄像头错误', retryModel: '重试模型', swapLabel: '左右手校正', swapHint: '默认开启；识别反了可关闭', rightHand: '右手', leftHand: '左手', notDetected: '未检测', rightGesture: '右手势', leftGesture: '左手势', indexPinch: '食指 PINCH', rightDepth: '右 DEPTH', leftDepth: '左 DEPTH', rightOpen: '右张开', leftOpen: '左张开', spreadAcceleration: '双手加速度', actualOutput: '实际输出', waitingCamera: '等待摄像头', mode: '模式', idle: '待机', handsUnit: '只手', poseThumb: '点赞', poseFist: '握拳', posePoint: '食指向上', poseVictory: '胜利手势', poseThree: '三指', poseFour: '四指', poseOpen: '完全张开', poseUnknown: '未知', poseNone: '无手势' } },
  es: { hand: { statusOff: 'Activa la cámara; el reconocimiento ocurre solo en esta página.', statusLoading: 'La cámara está lista. Cargando el modelo de manos…', statusRequesting: 'Permite que esta página use la cámara.', statusRunning: 'Cámara activa. Coloca las dos manos en imagen.', statusModelError: 'La cámara está lista, pero no se pudo cargar el modelo.', statusError: 'No se pudo iniciar la cámara.', cameraOff: 'CÁMARA APAGADA', cameraLoading: 'CARGANDO MODELO', cameraRequesting: 'PERMITIR CÁMARA', modelError: 'ERROR DEL MODELO', cameraError: 'ERROR DE CÁMARA', retryModel: 'Reintentar modelo', swapLabel: 'Corrección izquierda/derecha', swapHint: 'Activa por defecto; apágala si las manos están invertidas', rightHand: 'DERECHA', leftHand: 'IZQUIERDA', notDetected: 'No detectada', rightGesture: 'Gesto derecho', leftGesture: 'Gesto izquierdo', indexPinch: 'Pinza de índice', rightDepth: 'Profundidad derecha', leftDepth: 'Profundidad izquierda', rightOpen: 'Apertura derecha', leftOpen: 'Apertura izquierda', spreadAcceleration: 'Aceleración de dos manos', actualOutput: 'SALIDA ACTUAL', waitingCamera: 'Esperando cámara', mode: 'MODO', idle: 'ESPERA', handsUnit: 'MANO', poseThumb: 'Pulgar arriba', poseFist: 'Puño', posePoint: 'Índice arriba', poseVictory: 'Victoria', poseThree: 'Tres dedos', poseFour: 'Cuatro dedos', poseOpen: 'Palma abierta', poseUnknown: 'Desconocido', poseNone: 'Sin gesto' } },
  fr: { hand: { statusOff: 'Activez la caméra ; la reconnaissance reste dans cette page.', statusLoading: 'La caméra est prête. Chargement du modèle de mains…', statusRequesting: 'Autorisez cette page à utiliser la caméra.', statusRunning: 'Caméra active. Placez les deux mains dans l’image.', statusModelError: 'La caméra est prête, mais le modèle n’a pas pu être chargé.', statusError: 'La caméra n’a pas pu démarrer.', cameraOff: 'CAMÉRA ARRÊTÉE', cameraLoading: 'CHARGEMENT MODÈLE', cameraRequesting: 'AUTORISER LA CAMÉRA', modelError: 'ERREUR MODÈLE', cameraError: 'ERREUR CAMÉRA', retryModel: 'Réessayer le modèle', swapLabel: 'Correction gauche/droite', swapHint: 'Activée par défaut ; désactivez-la si les mains sont inversées', rightHand: 'DROITE', leftHand: 'GAUCHE', notDetected: 'Non détectée', rightGesture: 'Geste droit', leftGesture: 'Geste gauche', indexPinch: 'Pinch index', rightDepth: 'Profondeur droite', leftDepth: 'Profondeur gauche', rightOpen: 'Ouverture droite', leftOpen: 'Ouverture gauche', spreadAcceleration: 'Accélération des deux mains', actualOutput: 'SORTIE ACTUELLE', waitingCamera: 'En attente de la caméra', mode: 'MODE', idle: 'VEILLE', handsUnit: 'MAIN', poseThumb: 'Pouce levé', poseFist: 'Poing', posePoint: 'Index levé', poseVictory: 'Victoire', poseThree: 'Trois doigts', poseFour: 'Quatre doigts', poseOpen: 'Paume ouverte', poseUnknown: 'Inconnu', poseNone: 'Aucun geste' } },
  pt: { hand: { statusOff: 'Ative a câmera; o reconhecimento acontece apenas nesta página.', statusLoading: 'A câmera está pronta. Carregando o modelo de mãos…', statusRequesting: 'Permita que esta página use a câmera.', statusRunning: 'Câmera ativa. Coloque as duas mãos na imagem.', statusModelError: 'A câmera está pronta, mas o modelo não pôde ser carregado.', statusError: 'Não foi possível iniciar a câmera.', cameraOff: 'CÂMERA DESLIGADA', cameraLoading: 'CARREGANDO MODELO', cameraRequesting: 'PERMITIR CÂMERA', modelError: 'ERRO DO MODELO', cameraError: 'ERRO DE CÂMERA', retryModel: 'Tentar modelo novamente', swapLabel: 'Correção esquerda/direita', swapHint: 'Ativa por padrão; desligue se as mãos estiverem invertidas', rightHand: 'DIREITA', leftHand: 'ESQUERDA', notDetected: 'Não detectada', rightGesture: 'Gesto direito', leftGesture: 'Gesto esquerdo', indexPinch: 'Pinça do indicador', rightDepth: 'Profundidade direita', leftDepth: 'Profundidade esquerda', rightOpen: 'Abertura direita', leftOpen: 'Abertura esquerda', spreadAcceleration: 'Aceleração das duas mãos', actualOutput: 'SAÍDA ATUAL', waitingCamera: 'Aguardando câmera', mode: 'MODO', idle: 'ESPERA', handsUnit: 'MÃO', poseThumb: 'Polegar para cima', poseFist: 'Punho', posePoint: 'Indicador para cima', poseVictory: 'Vitória', poseThree: 'Três dedos', poseFour: 'Quatro dedos', poseOpen: 'Palma aberta', poseUnknown: 'Desconhecido', poseNone: 'Sem gesto' } },
  it: { hand: { statusOff: 'Attiva la camera; il riconoscimento resta in questa pagina.', statusLoading: 'La camera è pronta. Caricamento del modello delle mani…', statusRequesting: 'Consenti a questa pagina di usare la camera.', statusRunning: 'Camera attiva. Porta entrambe le mani nell’inquadratura.', statusModelError: 'La camera è pronta, ma il modello non è stato caricato.', statusError: 'Impossibile avviare la camera.', cameraOff: 'CAMERA SPENTA', cameraLoading: 'CARICAMENTO MODELLO', cameraRequesting: 'CONSENTI CAMERA', modelError: 'ERRORE MODELLO', cameraError: 'ERRORE CAMERA', retryModel: 'Riprova modello', swapLabel: 'Correzione sinistra/destra', swapHint: 'Attiva di default; disattivala se le mani sono invertite', rightHand: 'DESTRA', leftHand: 'SINISTRA', notDetected: 'Non rilevata', rightGesture: 'Gesto destro', leftGesture: 'Gesto sinistro', indexPinch: 'Pinch indice', rightDepth: 'Profondità destra', leftDepth: 'Profondità sinistra', rightOpen: 'Apertura destra', leftOpen: 'Apertura sinistra', spreadAcceleration: 'Accelerazione a due mani', actualOutput: 'USCITA ATTUALE', waitingCamera: 'In attesa della camera', mode: 'MODALITÀ', idle: 'ATTESA', handsUnit: 'MANO', poseThumb: 'Pollice alzato', poseFist: 'Pugno', posePoint: 'Indice alzato', poseVictory: 'Vittoria', poseThree: 'Tre dita', poseFour: 'Quattro dita', poseOpen: 'Palmo aperto', poseUnknown: 'Sconosciuto', poseNone: 'Nessun gesto' } },
  ja: { hand: { statusOff: 'カメラを有効にすると、このページ内だけで認識します。', statusLoading: 'カメラは準備完了です。手の認識モデルを読み込んでいます…', statusRequesting: 'このページのカメラ使用を許可してください。', statusRunning: 'カメラが有効です。両手を画面に入れてください。', statusModelError: 'カメラは使用できますが、手のモデルを読み込めませんでした。', statusError: 'カメラを開始できませんでした。', cameraOff: 'カメラ停止', cameraLoading: 'モデル読込中', cameraRequesting: 'カメラを許可', modelError: 'モデルエラー', cameraError: 'カメラエラー', retryModel: 'モデルを再試行', swapLabel: '左右の補正', swapHint: '初期設定はオン。左右が逆ならオフにします', rightHand: '右手', leftHand: '左手', notDetected: '未検出', rightGesture: '右手の形', leftGesture: '左手の形', indexPinch: '人差し指 PINCH', rightDepth: '右 DEPTH', leftDepth: '左 DEPTH', rightOpen: '右手の開き', leftOpen: '左手の開き', spreadAcceleration: '両手の加速度', actualOutput: '現在の出力', waitingCamera: 'カメラ待機中', mode: 'モード', idle: '待機', handsUnit: '手', poseThumb: '親指を上げる', poseFist: '握りこぶし', posePoint: '人差し指を上げる', poseVictory: 'ピース', poseThree: '三本指', poseFour: '四本指', poseOpen: '手を開く', poseUnknown: '不明', poseNone: '手勢なし' } }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], handPanelLocaleOverrides[locale]);
}

const handPrivacyLocaleOverrides: Record<Locale, TranslationTree> = {
  en: { hand: { privacyLink: 'Camera and privacy notice' } },
  'zh-CN': { hand: { privacyLink: '摄像头与隐私说明' } },
  es: { hand: { privacyLink: 'Aviso de cámara y privacidad' } },
  fr: { hand: { privacyLink: 'Caméra et confidentialité' } },
  pt: { hand: { privacyLink: 'Aviso de câmera e privacidade' } },
  it: { hand: { privacyLink: 'Informativa su camera e privacy' } },
  ja: { hand: { privacyLink: 'カメラとプライバシーについて' } }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], handPrivacyLocaleOverrides[locale]);
}

const handRuntimeLocaleOverrides: Record<Locale, TranslationTree> = {
  en: { hand: { autoCamera: 'Automatic camera', on: 'ON', off: 'OFF', brake: 'Brake', move: 'Move', rotate: 'Rotate', zoom: 'Zoom', depth: 'Depth', spread: 'Spread', pinch: 'Pinch', modeIdle: 'IDLE', modeGesture: 'GESTURE', modeBrake: 'BRAKE', modeXy: 'XY MOVE', modeDepth: 'DEPTH', modeSpread: 'SPREAD', modeRotate: 'ROTATE', modeCooldown: 'COOLDOWN', allControlStop: 'ALL CONTROL STOP', noHands: 'NO HANDS', calibratingPinch: 'CALIBRATING RIGHT PINCH', ready: 'READY' } },
  'zh-CN': { hand: { autoCamera: '自动镜头', on: '开启', off: '关闭', brake: '安全刹车', move: '移动', rotate: '旋转', zoom: '缩放', depth: '远近', spread: '双手展开', pinch: '捏合', modeIdle: '待机', modeGesture: '手势指令', modeBrake: '安全刹车', modeXy: '平移构图', modeDepth: '远近控制', modeSpread: '双手缩放', modeRotate: '旋转镜头', modeCooldown: '等待下一指令', allControlStop: '全部控制已停止', noHands: '未检测到手', calibratingPinch: '正在校准右手捏合', ready: '就绪' } },
  es: { hand: { autoCamera: 'Cámara automática', on: 'ACTIVA', off: 'DETENIDA', brake: 'Freno', move: 'Mover', rotate: 'Girar', zoom: 'Zoom', depth: 'Profundidad', spread: 'Apertura', pinch: 'Pinza', modeIdle: 'ESPERA', modeGesture: 'GESTO', modeBrake: 'FRENO', modeXy: 'MOVER XY', modeDepth: 'PROFUNDIDAD', modeSpread: 'APERTURA', modeRotate: 'GIRO', modeCooldown: 'PAUSA', allControlStop: 'CONTROLES DETENIDOS', noHands: 'SIN MANOS', calibratingPinch: 'CALIBRANDO PINZA DERECHA', ready: 'LISTA' } },
  fr: { hand: { autoCamera: 'Caméra automatique', on: 'ACTIVE', off: 'ARRÊTÉE', brake: 'Frein', move: 'Déplacer', rotate: 'Pivoter', zoom: 'Zoom', depth: 'Profondeur', spread: 'Écartement', pinch: 'Pincement', modeIdle: 'VEILLE', modeGesture: 'GESTE', modeBrake: 'FREIN', modeXy: 'DÉPLACEMENT XY', modeDepth: 'PROFONDEUR', modeSpread: 'ÉCARTEMENT', modeRotate: 'ROTATION', modeCooldown: 'PAUSE', allControlStop: 'COMMANDES ARRÊTÉES', noHands: 'AUCUNE MAIN', calibratingPinch: 'CALIBRAGE DU PINCEMENT DROIT', ready: 'PRÊT' } },
  pt: { hand: { autoCamera: 'Câmera automática', on: 'ATIVA', off: 'PARADA', brake: 'Freio', move: 'Mover', rotate: 'Girar', zoom: 'Zoom', depth: 'Profundidade', spread: 'Abertura', pinch: 'Pinça', modeIdle: 'ESPERA', modeGesture: 'GESTO', modeBrake: 'FREIO', modeXy: 'MOVER XY', modeDepth: 'PROFUNDIDADE', modeSpread: 'ABERTURA', modeRotate: 'ROTAÇÃO', modeCooldown: 'PAUSA', allControlStop: 'CONTROLES PARADOS', noHands: 'SEM MÃOS', calibratingPinch: 'CALIBRANDO PINÇA DIREITA', ready: 'PRONTA' } },
  it: { hand: { autoCamera: 'Camera automatica', on: 'ATTIVA', off: 'FERMA', brake: 'Freno', move: 'Sposta', rotate: 'Ruota', zoom: 'Zoom', depth: 'Profondità', spread: 'Apertura', pinch: 'Pinch', modeIdle: 'ATTESA', modeGesture: 'GESTO', modeBrake: 'FRENO', modeXy: 'SPOSTAMENTO XY', modeDepth: 'PROFONDITÀ', modeSpread: 'APERTURA', modeRotate: 'ROTAZIONE', modeCooldown: 'PAUSA', allControlStop: 'COMANDI ARRESTATI', noHands: 'NESSUNA MANO', calibratingPinch: 'CALIBRAZIONE PINCH DESTRO', ready: 'PRONTA' } },
  ja: { hand: { autoCamera: '自動カメラ', on: 'オン', off: '停止', brake: '安全停止', move: '移動', rotate: '回転', zoom: '拡大・縮小', depth: '前後', spread: '両手の開き', pinch: 'つまむ', modeIdle: '待機', modeGesture: '手の指示', modeBrake: '安全停止', modeXy: '位置を移動', modeDepth: '前後を調整', modeSpread: '両手で拡大・縮小', modeRotate: 'カメラを回転', modeCooldown: '次の操作を待機', allControlStop: 'すべての操作を停止', noHands: '手を検出していません', calibratingPinch: '右手のつまみを調整中', ready: '準備完了' } }
};

for (const locale of locales) {
  translations[locale] = deepMerge(translations[locale], handRuntimeLocaleOverrides[locale]);
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.replace('_', '-').toLowerCase();
  if (normalized === 'zh' || normalized === 'zh-cn' || normalized === 'zh-hans') return 'zh-CN';
  return locales.find((locale) => locale.toLowerCase() === normalized || normalized.startsWith(`${locale.toLowerCase()}-`)) ?? null;
}

export function readSavedLocale(): Locale | null {
  try {
    return normalizeLocale(window.localStorage.getItem(localeStorageKey));
  } catch {
    return null;
  }
}

export function detectInitialLocale(): Locale {
  const saved = readSavedLocale();
  if (saved) return saved;
  const browserLocale = [navigator.language, ...(navigator.languages || [])]
    .map((value) => normalizeLocale(value))
    .find(Boolean);
  return browserLocale || 'en';
}

export function saveLocale(locale: Locale) {
  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    // Keep language switching usable when storage is unavailable.
  }
}

export function getTranslation(locale: Locale, key: string): string {
  if (key.startsWith("aboutStory.")) {
    const aboutKey = key.slice("aboutStory.".length) as keyof (typeof aboutTranslations)["en"];
    return aboutTranslations[locale][aboutKey] ?? aboutTranslations.en[aboutKey] ?? key;
  }
  const read = (tree: TranslationTree): string | undefined => {
    let current: string | TranslationTree | undefined = tree;
    for (const part of key.split('.')) {
      if (!current || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
  };
  return read(translations[locale]) ?? read(translations.en) ?? key;
}

export function formatTranslation(locale: Locale, key: string, values: Record<string, string | number> = {}) {
  return getTranslation(locale, key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

export function configureDocument(locale: Locale, page: string, basePath = '/') {
  document.documentElement.lang = localeButtons[locale].lang;
  document.documentElement.dir = 'ltr';
  document.title = getTranslation(locale, `meta.${page}Title`);
  const description = getTranslation(locale, page === 'terms' || page === 'privacy' || page === 'credits' || page === 'copyright' ? 'meta.legalDescription' : `meta.${page}Description`);
  const descriptionNode = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionNode) descriptionNode.content = description;
  upsertLink('canonical', stripLocalePrefix(window.location.href));
  for (const nextLocale of locales) {
    upsertLink('alternate', localizeUrl(nextLocale, basePath), nextLocale);
  }
  upsertLink('alternate', localizeUrl('en', basePath), 'x-default');
  upsertMeta('property', 'og:title', document.title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:site_name', 'DailyFlora');
  upsertMeta('property', 'og:locale', locale === 'zh-CN' ? 'zh_CN' : locale);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let node = document.querySelector<HTMLLinkElement>(selector);
  if (!node) {
    node = document.createElement('link');
    node.rel = rel;
    if (hreflang) node.hreflang = hreflang;
    document.head.append(node);
  }
  node.href = href;
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let node = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attribute, key);
    document.head.append(node);
  }
  node.content = content;
}

function stripLocalePrefix(href: string) {
  const url = new URL(href);
  const parts = url.pathname.split('/').filter(Boolean);
  if (normalizeLocale(parts[0])) {
    parts.shift();
    url.pathname = `/${parts.join('/')}${url.pathname.endsWith('/') ? '/' : ''}`;
  }
  return url.href;
}

function localizeUrl(locale: Locale, basePath: string) {
  const url = new URL(stripLocalePrefix(window.location.href));
  const path = basePath.replace(/^\//, '').replace(/\/$/, '');
  url.pathname = locale === 'en' ? `/${path ? `${path}/` : ''}` : `/${locale}/${path ? `${path}/` : ''}`;
  return url.href;
}

export function setupLocaleSwitcher(
  root: HTMLElement | null,
  currentLocale: Locale,
  onChange: (locale: Locale) => void
) {
  if (!root) return;
  (root as HTMLElement & { __dailyfloraLocaleChange?: (locale: Locale) => void }).__dailyfloraLocaleChange = onChange;
  root.setAttribute('aria-label', getTranslation(currentLocale, 'common.language') || 'Language');
  root.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
    const locale = normalizeLocale(button.dataset.language) || 'en';
    const config = localeButtons[locale];
    button.textContent = config.label;
    button.setAttribute('aria-label', config.aria);
    button.setAttribute('aria-pressed', String(locale === currentLocale));
    button.toggleAttribute('aria-current', locale === currentLocale);
    button.disabled = locale === currentLocale;
    if (button.dataset.localeButtonBound !== 'true') {
      button.dataset.localeButtonBound = 'true';
      button.addEventListener('click', () => {
        const nextLocale = normalizeLocale(button.dataset.language);
        if (!nextLocale || button.disabled) return;
        (root as HTMLElement & { __dailyfloraLocaleChange?: (locale: Locale) => void }).__dailyfloraLocaleChange?.(nextLocale);
      });
    }
  });
  if (root.dataset.localeSwitcherBound === 'true') return;
  root.dataset.localeSwitcherBound = 'true';
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-language]'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next = buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
    next.focus();
  });
}
