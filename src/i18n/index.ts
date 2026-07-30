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
      legalDescription: 'DailyFlora legal information, credits, privacy, copyright, and usage terms.'
    },
    common: {
      today: "Today's bouquet",
      member: 'My garden',
      about: 'About',
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
      clockMinutes: 'min',
      clockAuto: 'Auto',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      weekdays: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'
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
      eyebrow: 'DailyFlora ID / Local MVP',
      title: 'My garden',
      lead: 'This is the registration entry and the signed-in workspace. For now, accounts, favorites, reference recognition, and generated records stay on this device.',
      todayEyebrow: "Today's bouquet",
      todayTitle: 'Keep today’s bouquet first.',
      stateNone: 'Not created',
      stateReady: 'Created',
      signupPill: 'Signup inside member',
      signupTitle: 'Create your garden',
      signupBody: 'Without an account, this is signup. With one, it becomes your identity and local state.',
      name: 'Your name',
      email: 'Email',
      create: 'Create local garden',
      note: 'No password is stored. Nothing is uploaded. No real database is written yet.',
      favoriteAction: "Save today's bouquet",
      logout: 'Sign out of local account',
      collectionTitle: 'My collection',
      collectionBody: 'Each saved bouquet keeps date, seed, flowerPlan, and a unique code. Empty states stay honest.',
      emptySavedTitle: 'No saved bouquets yet',
      emptySavedBody: 'Return to today’s bouquet and light the heart. The first saved flower will appear here with its code.',
      studioEyebrow: 'Upload to bouquet',
      studioTitle: 'Upload a reference image and create a traceable private bouquet record.',
      studioPill: 'Local only',
      createTitle: 'Create a custom bouquet',
      createBody: 'Reads average image color and preference text to create a mock plan. Old records are not overwritten.',
      chooseImage: 'Choose a reference image',
      chooseHint: 'Bouquet, color mood, or floral detail. Read locally, not uploaded.',
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
      historyBody: 'This is a local MVP ledger: code, seed, source, credit use, and status are saved together.',
      creditsTitle: 'Credits are a ledger first, not a gimmick.',
      creditsPill: 'Mock data',
      toastCreated: 'Local garden created.',
      toastLogout: 'Signed out locally.',
      toastSaved: 'Saved {id}'
    },
    objects: {
      eyebrow: 'Objects, not a shop yet',
      title: 'A digital flower may one day arrive on your table.',
      lead: 'This is not a real shop yet. It is a quiet placeholder for future objects and florist collaborations.',
      primary: 'View object studies',
      secondary: 'Florist plan',
      sectionEyebrow: 'Future merchandise',
      sectionTitle: 'Not merchandise for its own sake, but another way for a bouquet to stay.',
      sectionBody: 'These are product placeholders for tone and display. SKU, price, inventory, packaging, and fulfillment are not open.',
      floristEyebrow: 'Offline florist network',
      floristTitle: 'A flower can leave the screen.',
      floristBody: 'The florist section stays as a collaboration plan: city touchpoints, physical bouquet editions, date-limited materials, and future member benefits.',
      interest: 'Save interest',
      toast: 'Interest saved on this device. No order or form was submitted.'
    },
    platforms: {
      eyebrow: 'DailyFlora across screens',
      title: 'Let the flower stay on the screen you use most.',
      lead: 'The download page is honest before it is beautiful. The web version works now; desktop, mobile, Android APK, and TV modes remain future entries.',
      primary: 'Open web version',
      secondary: 'See platform status',
      sectionEyebrow: 'Platform roadmap',
      sectionTitle: 'The same bouquet can stay differently on different screens.',
      sectionBody: 'Every platform is marked by what is usable now. No fake download buttons.',
      browserStatus: 'MVP available',
      browserBody: 'Open daily bouquets, favorites, the member garden, and project records now.',
      adapting: 'In adaptation',
      planned: 'Planned',
      closed: 'Not open yet',
      follow: 'Follow release',
      toast: 'Saved on this device. No install or subscription was triggered.',
      footer: 'Make the web version stable first. Downloads stay visible, but not pretending to be finished.'
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
      objectsStatement: 'Objects are placeholders. Real ordering waits until it is real.',
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
      about: '关于',
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
      eyebrow: 'DailyFlora ID / 本机 MVP',
      title: '我的花园',
      lead: '这里是注册入口，也是登录后的工作台。现在所有账户、收藏、上传识别和生成记录都只保存在本机。',
      todayEyebrow: 'Today’s bouquet',
      todayTitle: '先把今天这束花留下。',
      stateNone: '未建立',
      stateReady: '已建立',
      signupPill: 'Signup inside member',
      signupTitle: '建立你的花园',
      signupBody: '没有账户时，这里就是注册；有账户时，这里就是身份与状态。',
      name: '怎么称呼你',
      email: '邮箱',
      create: '建立本机花园',
      note: '当前不会保存密码，不会上传资料，不会写入真实数据库。',
      favoriteAction: '收藏今日花束',
      logout: '退出本机账户',
      collectionTitle: '我的收藏',
      collectionBody: '每张收藏都保留日期、seed、flowerPlan 与唯一代码。没有收藏时不虚构数据。',
      emptySavedTitle: '还没有收藏',
      emptySavedBody: '回到今日花束，点右上角爱心。第一束花会带着唯一代码出现在这里。',
      studioEyebrow: 'Upload to bouquet',
      studioTitle: '上传参考图，生成一份可追踪的私人花束记录。',
      studioPill: '仅本机保存',
      createTitle: '新建定制花束',
      createBody: '读取图片平均色与文字偏好，生成一份 mock 方案。旧记录不热修改。',
      chooseImage: '选择一张参考图',
      chooseHint: '花束、色彩氛围、局部花材都可以。本机读取，不上传。',
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
      historyBody: '这组记录是本机 MVP 账本：代码、seed、来源、积分消耗和状态一起保存。',
      creditsTitle: '积分记录先做成账本，不做成噱头。',
      creditsPill: '模拟数据',
      toastCreated: '本机花园已建立。',
      toastLogout: '已退出本机账户。',
      toastSaved: '已保存 {id}'
    },
    objects: {
      eyebrow: 'Objects, not a shop yet',
      title: '数字花，总有一天会来到你的桌面。',
      lead: '这里先不做真实商店，也不假装可以下单。它是未来周边产品和线下花店合作的展示入口。',
      primary: '看周边占位',
      secondary: '线下花店计划',
      sectionEyebrow: 'Future merchandise',
      sectionTitle: '不是把虚拟花变成商品，而是让它拥有另一种停留方式。',
      sectionBody: '以下都是产品坑位，用来提前确认陈列气质。正式 SKU、价格、库存、包装和履约都还没开放。',
      floristEyebrow: 'Offline florist network',
      floristTitle: 'A flower can leave the screen.',
      floristBody: '线下花店板块保留为合作计划：城市体验点、实体花束联名、日期限定花材，以及未来会员的线下权益。',
      interest: '记下兴趣',
      toast: '已在本机记下兴趣。正式开放前，这里不会提交订单或表单。'
    },
    platforms: {
      eyebrow: 'DailyFlora across screens',
      title: '让花停留在你最常用的屏幕上。',
      lead: '下载页先诚实，再好看。当前 Web 版可用；桌面端、手机端、Android APK 与 TV 展示模式都作为未来入口保留，不放假按钮。',
      primary: '打开 Web 版',
      secondary: '查看平台状态',
      sectionEyebrow: 'Platform roadmap',
      sectionTitle: '同一束花，不同屏幕上的停留方式。',
      sectionBody: '每个平台都按“当前能否使用”来标注，不用“敬请期待”糊弄用户。',
      browserStatus: 'MVP 可体验',
      browserBody: '现在可打开每日花束、收藏、个人花园和开发记录。',
      adapting: '适配中',
      planned: '规划中',
      closed: '暂未开放',
      follow: '关注发布',
      toast: '已在本机记下关注。正式下载开放前，这里不会触发安装或订阅。',
      footer: '现在先把 Web 版做好。下载入口保留，但不装成熟。'
    },
    legal: {
      termsTitle: '使用条款',
      privacyTitle: '隐私政策',
      creditsTitle: '致谢与署名',
      copyrightTitle: '版权说明',
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
      objectsStatement: '周边先占位，线下计划保留。真正开放时，再让用户下单。',
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
    common: { today: 'Ramo de hoy', member: 'Mi jardín', about: 'Acerca de', objects: 'Objetos y colaboraciones', platforms: 'Plataformas', collect: 'Guardar este ramo', openWeb: 'Abrir versión web', explore: 'Explorar', system: 'Sistema', version: 'Leer código de versión...', localOnly: 'Guardado solo en este dispositivo' },
    index: { index: 'ÍNDICE', view: 'VISTA', hideView: 'CERRAR', siteMenu: 'Menú de DailyFlora', currentBouquet: 'Ramo de hoy', myGarden: 'Mi jardín', about: 'Acerca de DailyFlora', objects: 'Objetos y colaboraciones', platforms: 'Plataformas', favorite: 'Guardar este ramo', debug: 'Revisión estética', openGarden: 'Abrir mi jardín', favoriteToday: 'Guardar el ramo de hoy', savedToday: 'Ramo guardado', gardenTitle: 'Mi jardín', gardenStatusGuest: 'Inicia sesión para guardar', gardenStatusSigned: '{count} guardados', accountPanelTitleGuest: 'Guarda el ramo de hoy en tu jardín', accountPanelTitleSigned: 'Tu colección DailyFlora', collection: 'Mi colección', emptyTitle: 'Aún no hay ramos guardados', emptyBody: 'Enciende el corazón y este ramo quedará aquí.', referenceTitle: 'Partir de una imagen', referenceBody: 'Lee color y nombre de archivo en este dispositivo para prever un ramo. No se sube nada.', referenceChoose: 'Elegir imagen', referenceGenerate: 'Generar desde la referencia', referenceReading: 'Leyendo la imagen...', referenceReady: 'Se encontró {theme}. Ya puedes generar.', referenceDone: 'Generado desde {theme}. Usa el corazón para guardarlo.' },
    view: { show: 'Mostrar controles', hide: 'Ocultar controles', date: 'Elegir fecha', dateWithName: 'Elegir fecha: {name}', random: 'Ver otra fecha', fullscreen: 'Pantalla completa', handOn: 'Activar gestos', handOff: 'Desactivar gestos', zoomOut: 'Alejar', zoomIn: 'Acercar', density: 'Densidad del ramo', densityLow: 'Más ligero', densityMedium: 'Medio', densityHigh: 'Más denso', render: 'Precisión visual', renderAuto: 'Auto', renderLow: 'Ahorro', renderMedium: 'Claro', renderHigh: 'Detallado', pause: 'Pausar rotación', resume: 'Reanudar rotación', reverse: 'Invertir ruta de cámara', speed: 'Velocidad de cámara', preset: 'Ruta de cámara aleatoria', clock: 'Reloj', showClock: 'Mostrar reloj', hideClock: 'Ocultar reloj', clockMinutes: 'min', clockAuto: 'Auto', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', weekdays: 'Dom,Lun,Mar,Mié,Jue,Vie,Sáb' },
    about: { eyebrow: 'UN RAMO PARA CADA DÍA', title: 'Donde las fechas se encuentran con las flores.', lead: 'En la oscuridad, un ramo toma forma despacio. Cada fecha se vuelve semilla para una flor digital tranquila.', primary: 'Ver la flor de hoy', secondary: 'Mantener un día en flor', quote: 'No es una imagen que tengas que terminar.', manifestoTitle: 'Una pantalla también puede guardar una señal de vida.', principlesTitle: 'No se trata de tener más flores.' },
    member: { title: 'Mi jardín', lead: 'Registro y mesa de trabajo. Por ahora, cuenta, favoritos y registros se guardan solo en este dispositivo.', create: 'Crear jardín local', collectionTitle: 'Mi colección', studioTitle: 'Sube una referencia y crea un ramo privado rastreable.', historyTitle: 'Mis ramos generados', creditsTitle: 'Los créditos son primero un registro, no un reclamo.' },
    platforms: { title: 'Deja que la flor viva en la pantalla que más usas.', lead: 'La web ya está disponible; las demás plataformas permanecen como próximas entradas honestas.', follow: 'Seguir lanzamiento', toast: 'Guardado en este dispositivo. No se inició instalación ni suscripción.' },
    objects: { title: 'Una flor digital puede llegar algún día a tu mesa.', lead: 'Aún no es una tienda real. Es una entrada tranquila para futuros objetos y colaboraciones.', interest: 'Guardar interés', toast: 'Interés guardado en este dispositivo. No se envió pedido ni formulario.' }
  },
  fr: {
    common: { today: 'Bouquet du jour', member: 'Mon jardin', about: 'À propos', objects: 'Objets et collaborations', platforms: 'Plateformes', collect: 'Garder ce bouquet', openWeb: 'Ouvrir la version web', explore: 'Explorer', system: 'Système', version: 'Lire le code de version...' },
    index: { index: 'INDEX', view: 'VUE', hideView: 'FERMER', siteMenu: 'Menu DailyFlora', currentBouquet: 'Bouquet du jour', myGarden: 'Mon jardin', about: 'À propos de DailyFlora', objects: 'Objets et collaborations', platforms: 'Plateformes', favorite: 'Garder ce bouquet', debug: 'Revue esthétique', gardenStatusSigned: '{count} gardés' },
    view: { show: 'Afficher les contrôles', hide: 'Masquer les contrôles', date: 'Choisir la date', random: 'Voir une autre date', fullscreen: 'Plein écran', zoomOut: 'Éloigner', zoomIn: 'Rapprocher', pause: 'Mettre en pause', resume: 'Reprendre', clock: 'Horloge', showClock: 'Afficher l’horloge', hideClock: 'Masquer l’horloge', weekdays: 'Dim,Lun,Mar,Mer,Jeu,Ven,Sam' },
    about: { eyebrow: 'UN BOUQUET POUR CHAQUE JOUR', title: 'Là où les dates rencontrent les fleurs.', lead: 'Dans l’obscurité, un bouquet prend lentement forme. Une date devient une graine, puis un espace, une couleur, une fleur numérique.', primary: 'Voir la fleur du jour', secondary: 'Garder un jour en fleur', quote: 'Ce n’est pas une image qu’il faut finir.' },
    member: { title: 'Mon jardin', lead: 'Inscription et espace personnel. Pour l’instant, tout reste enregistré sur cet appareil.' },
    platforms: { title: 'Laisser la fleur habiter l’écran que vous utilisez le plus.', lead: 'La version web est disponible; les autres écrans restent des entrées à venir.' },
    objects: { title: 'Une fleur numérique pourra un jour rejoindre votre table.', lead: 'Ce n’est pas encore une boutique, mais un espace pour les futurs objets et collaborations.' }
  },
  pt: {
    common: { today: 'Buquê de hoje', member: 'Meu jardim', about: 'Sobre', objects: 'Objetos e colaborações', platforms: 'Plataformas', collect: 'Guardar este buquê', openWeb: 'Abrir versão web', explore: 'Explorar', system: 'Sistema', version: 'Ler código da versão...' },
    index: { index: 'ÍNDICE', view: 'VISTA', hideView: 'FECHAR', currentBouquet: 'Buquê de hoje', myGarden: 'Meu jardim', about: 'Sobre DailyFlora', objects: 'Objetos e colaborações', platforms: 'Plataformas', favorite: 'Guardar este buquê', gardenStatusSigned: '{count} guardados' },
    view: { show: 'Mostrar controles', hide: 'Ocultar controles', date: 'Escolher data', random: 'Ver outra data', fullscreen: 'Tela cheia', zoomOut: 'Afastar', zoomIn: 'Aproximar', pause: 'Pausar rotação', resume: 'Continuar rotação', clock: 'Relógio', weekdays: 'Dom,Seg,Ter,Qua,Qui,Sex,Sáb' },
    about: { eyebrow: 'UM BUQUÊ PARA CADA DIA', title: 'Onde datas encontram flores.', lead: 'No escuro, um buquê se forma devagar. A data vira semente para uma flor digital silenciosa.', primary: 'Ver a flor de hoje', secondary: 'Manter um dia florido', quote: 'Não é uma imagem que você precisa terminar.' },
    member: { title: 'Meu jardim', lead: 'Cadastro e área pessoal. Por enquanto, tudo fica salvo neste dispositivo.' },
    platforms: { title: 'Deixe a flor ficar na tela que você mais usa.', lead: 'A versão web já funciona; as demais plataformas seguem como caminhos futuros.' },
    objects: { title: 'Uma flor digital pode um dia chegar à sua mesa.', lead: 'Ainda não é uma loja, mas um espaço para futuros objetos e colaborações.' }
  },
  it: {
    common: { today: 'Bouquet di oggi', member: 'Il mio giardino', about: 'About', objects: 'Oggetti e collaborazioni', platforms: 'Piattaforme', collect: 'Conserva questo bouquet', openWeb: 'Apri versione web', explore: 'Esplora', system: 'Sistema', version: 'Leggi codice versione...' },
    index: { index: 'INDICE', view: 'VISTA', hideView: 'CHIUDI', currentBouquet: 'Bouquet di oggi', myGarden: 'Il mio giardino', about: 'About DailyFlora', objects: 'Oggetti e collaborazioni', platforms: 'Piattaforme', favorite: 'Conserva questo bouquet', gardenStatusSigned: '{count} salvati' },
    view: { show: 'Mostra controlli', hide: 'Nascondi controlli', date: 'Scegli data', random: 'Vedi un’altra data', fullscreen: 'Schermo intero', zoomOut: 'Allontana', zoomIn: 'Avvicina', pause: 'Pausa rotazione', resume: 'Riprendi rotazione', clock: 'Orologio', weekdays: 'Dom,Lun,Mar,Mer,Gio,Ven,Sab' },
    about: { eyebrow: 'UN BOUQUET PER OGNI GIORNO', title: 'Dove le date incontrano i fiori.', lead: 'Nel buio, un bouquet prende forma lentamente. La data diventa seme per un fiore digitale quieto.', primary: 'Vedi il fiore di oggi', secondary: 'Tenere un giorno in fiore', quote: 'Non è un’immagine da finire.' },
    member: { title: 'Il mio giardino', lead: 'Registrazione e spazio personale. Per ora tutto resta su questo dispositivo.' },
    platforms: { title: 'Lascia il fiore sullo schermo che usi di più.', lead: 'La versione web è disponibile; le altre piattaforme restano aperture future.' },
    objects: { title: 'Un fiore digitale potrà un giorno arrivare sulla tua scrivania.', lead: 'Non è ancora un negozio, ma uno spazio per futuri oggetti e collaborazioni.' }
  },
  ja: {
    common: { today: '今日の花束', member: '私の庭', about: 'About', objects: 'オブジェクトと協業', platforms: 'プラットフォーム', collect: 'この花束を残す', openWeb: 'Web版を開く', explore: '見る', system: 'システム', version: 'バージョンを読む…' },
    index: { index: 'INDEX', view: 'VIEW', hideView: 'CLOSE', siteMenu: 'DailyFlora メニュー', currentBouquet: '今日の花束', myGarden: '私の庭', about: 'DailyFlora について', objects: 'オブジェクトと協業', platforms: 'プラットフォーム', favorite: 'この花束を残す', debug: '美意識レビュー', openGarden: '私の庭を開く', favoriteToday: '今日の花束を保存', savedToday: '保存済み', gardenStatusSigned: '{count} 件保存' },
    view: { show: '表示設定を開く', hide: '表示設定を閉じる', date: '日付を選ぶ', random: '別の日を見る', fullscreen: '全画面', handOn: '手の操作を有効にする', handOff: '手の操作を閉じる', zoomOut: '引く', zoomIn: '寄る', pause: '回転を止める', resume: '回転を再開', reverse: 'カメラ経路を反転', clock: '時計', showClock: '時計を表示', hideClock: '時計を隠す', weekdays: '日,月,火,水,木,金,土' },
    about: { eyebrow: '毎日のための花束', title: '日付と花が、ここで出会う。', lead: '暗い空間の中で、一束の花がゆっくり形になる。日付は種になり、色と茎と余白が静かに育つ。', primary: '今日の花を見る', secondary: 'この日を咲かせておく', quote: 'これは「見終える」ための画像ではありません。' },
    member: { title: '私の庭', lead: '登録と作業場所です。いまはアカウント、保存、生成記録はこの端末だけに残ります。' },
    platforms: { title: 'よく使う画面に、花を置く。', lead: 'Web版はいま使えます。ほかの画面は、正直にこれからの入口として残します。' },
    objects: { title: 'デジタルの花は、いつか机の上にも届くかもしれません。', lead: 'まだ本当のショップではありません。未来のものづくりと協業のための静かな入口です。' }
  }
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
  translations[locale] = deepMerge(translations.en, conciseLocaleOverrides[locale] || {});
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
  });
  if (root.dataset.localeSwitcherBound === 'true') return;
  root.dataset.localeSwitcherBound = 'true';
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const locale = normalizeLocale(target.dataset.language);
    if (!locale || target.disabled) return;
    (root as HTMLElement & { __dailyfloraLocaleChange?: (locale: Locale) => void }).__dailyfloraLocaleChange?.(locale);
  });
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
