(() => {
  const root = document.documentElement;
  if (!root.classList.contains("df-gui-v1")) return;

  const languageStorageKey = "dailyflora.gui-language.v4";
  const supportedLanguages = ["en", "zh", "es", "fr", "it", "ja"];
  const languageTags = {
    en: "en",
    zh: "zh-CN",
    es: "es",
    fr: "fr",
    it: "it",
    ja: "ja"
  };
  const languageButtons = Array.from(document.querySelectorAll("[data-language-choice]"));
  const hud = document.querySelector("#hud");
  const siteMenu = document.querySelector("#site-menu");
  const siteMenuPanel = document.querySelector("#site-menu-panel");
  const siteMenuToggle = document.querySelector("#site-menu-toggle");
  const controls = document.querySelector("#controls");
  const controlsPanel = document.querySelector("#controls-panel");
  const controlsToggle = document.querySelector("#controls-toggle");
  const calendarPanelId = "date-calendar";
  const todayButton = document.querySelector("#today-button");
  const datePicker = document.querySelector("#date-picker");
  const shuffleButton = document.querySelector("#shuffle-button");
  const fullscreenButton = document.querySelector("#fullscreen-button");
  const zoomOutButton = document.querySelector("#zoom-out-button");
  const zoomInButton = document.querySelector("#zoom-in-button");
  const pauseButton = document.querySelector("#pause-button");
  const rotationDirectionButton = document.querySelector("#rotation-direction-button");
  const rotationPresetButton = document.querySelector("#rotation-preset-button");
  const rotationSpeed = document.querySelector("#rotation-speed");
  const reviewDashboardLink = document.querySelector("#review-dashboard-link");
  const dailyDate = document.querySelector("#daily-date");
  const dailyThemeCn = document.querySelector("#daily-theme-cn");
  const dailyThemeEn = document.querySelector("#daily-theme-en");
  const flowerPlanEn = document.querySelector("#flower-plan-mark-en");

  const copy = {
    en: {
      brandSystem: "GENERATIVE BOTANICAL SYSTEM",
      kicker: "TODAY'S COMPOSITION",
      index: "INDEX",
      view: "VIEW",
      menuHeading: "DAILYFLORA / INDEX",
      about: "About",
      member: "Member Garden",
      downloads: "Downloads",
      shop: "Bouquet Shop",
      scifi: "SciFi Flora",
      save: "Save This Bouquet",
      review: "Aesthetic Review",
      dateLabel: "DATE",
      compositionPrefix: "DATE-SEEDED COMPOSITION",
      uiLanguage: "Interface language",
      siteNav: "Site index",
      openIndex: "Open site index",
      closeIndex: "Close site index",
      viewingControls: "Viewing controls",
      showView: "Show viewing controls",
      hideView: "Hide viewing controls",
      selectDate: "Choose bouquet date",
      randomDate: "Random existing date",
      fullscreen: "Enter fullscreen",
      zoomControls: "Zoom controls",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      density: "Bouquet density",
      render: "Render detail",
      cameraRoute: "Camera route",
      pause: "Pause rotation",
      resume: "Resume rotation",
      reverse: "Reverse camera route",
      speed: "Camera speed",
      preset: "Random camera preset",
      future: "This bouquet has not been generated yet",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      weekdays: ["S", "M", "T", "W", "T", "F", "S"],
      densityChoices: {
        low: ["LO", "Low bouquet density"],
        medium: ["MID", "Medium bouquet density"],
        high: ["HI", "High bouquet density"]
      },
      renderChoices: {
        auto: ["AUTO", "Automatic render detail"],
        low: ["ECO", "Low-power render"],
        medium: ["CLR", "Clear render"],
        high: ["MAX", "Maximum render detail"]
      }
    },
    zh: {
      brandSystem: "生成式植物系统",
      kicker: "今日花束",
      index: "目录",
      view: "观看",
      menuHeading: "DAILYFLORA / 目录",
      about: "关于",
      member: "个人花园",
      downloads: "下载",
      shop: "花束商店",
      scifi: "科幻花束",
      save: "收藏这束花",
      review: "审美审核",
      dateLabel: "日期",
      compositionPrefix: "日期种子构图",
      uiLanguage: "界面语言",
      siteNav: "站点目录",
      openIndex: "打开站点目录",
      closeIndex: "关闭站点目录",
      viewingControls: "观看控制",
      showView: "显示观看控制",
      hideView: "隐藏观看控制",
      selectDate: "选择花束日期",
      randomDate: "随机已有日期",
      fullscreen: "全屏观看",
      zoomControls: "缩放控制",
      zoomOut: "拉远",
      zoomIn: "拉近",
      density: "花束密度",
      render: "渲染精度",
      cameraRoute: "镜头路线",
      pause: "暂停旋转",
      resume: "继续旋转",
      reverse: "反转镜头路线",
      speed: "镜头速度",
      preset: "随机镜头预设",
      future: "这束花尚未生成",
      previousMonth: "上个月",
      nextMonth: "下个月",
      weekdays: ["日", "一", "二", "三", "四", "五", "六"],
      densityChoices: {
        low: ["疏", "花材少一点"],
        medium: ["中", "花材中等"],
        high: ["密", "花材密一点"]
      },
      renderChoices: {
        auto: ["自", "自动选择清晰度"],
        low: ["省", "省电模式"],
        medium: ["清", "清晰模式"],
        high: ["精", "精细模式"]
      }
    },
    es: {
      brandSystem: "SISTEMA BOTÁNICO GENERATIVO",
      kicker: "COMPOSICIÓN DE HOY",
      index: "ÍNDICE",
      view: "VISTA",
      menuHeading: "DAILYFLORA / ÍNDICE",
      about: "Acerca de",
      member: "Jardín personal",
      downloads: "Descargas",
      shop: "Tienda de ramos",
      scifi: "Flora Sci-Fi",
      save: "Guardar este ramo",
      review: "Revisión estética",
      dateLabel: "FECHA",
      compositionPrefix: "COMPOSICIÓN POR FECHA",
      uiLanguage: "Idioma de la interfaz",
      siteNav: "Índice del sitio",
      openIndex: "Abrir índice del sitio",
      closeIndex: "Cerrar índice del sitio",
      viewingControls: "Controles de vista",
      showView: "Mostrar controles de vista",
      hideView: "Ocultar controles de vista",
      selectDate: "Elegir fecha del ramo",
      randomDate: "Fecha existente al azar",
      fullscreen: "Pantalla completa",
      zoomControls: "Controles de zoom",
      zoomOut: "Alejar",
      zoomIn: "Acercar",
      density: "Densidad del ramo",
      render: "Detalle de renderizado",
      cameraRoute: "Ruta de cámara",
      pause: "Pausar rotación",
      resume: "Reanudar rotación",
      reverse: "Invertir ruta de cámara",
      speed: "Velocidad de cámara",
      preset: "Ruta de cámara aleatoria",
      future: "Este ramo aún no se ha generado",
      previousMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      weekdays: ["D", "L", "M", "X", "J", "V", "S"],
      densityChoices: {
        low: ["BAJ", "Densidad baja"],
        medium: ["MED", "Densidad media"],
        high: ["ALT", "Densidad alta"]
      },
      renderChoices: {
        auto: ["AUTO", "Detalle automático"],
        low: ["ECO", "Render de bajo consumo"],
        medium: ["CLR", "Render claro"],
        high: ["MAX", "Detalle máximo"]
      }
    },
    fr: {
      brandSystem: "SYSTÈME BOTANIQUE GÉNÉRATIF",
      kicker: "COMPOSITION DU JOUR",
      index: "INDEX",
      view: "VUE",
      menuHeading: "DAILYFLORA / INDEX",
      about: "À propos",
      member: "Jardin personnel",
      downloads: "Téléchargements",
      shop: "Boutique de bouquets",
      scifi: "Flore Sci-Fi",
      save: "Enregistrer ce bouquet",
      review: "Revue esthétique",
      dateLabel: "DATE",
      compositionPrefix: "COMPOSITION DATÉE",
      uiLanguage: "Langue de l’interface",
      siteNav: "Index du site",
      openIndex: "Ouvrir l’index du site",
      closeIndex: "Fermer l’index du site",
      viewingControls: "Commandes d’affichage",
      showView: "Afficher les commandes",
      hideView: "Masquer les commandes",
      selectDate: "Choisir la date du bouquet",
      randomDate: "Date existante aléatoire",
      fullscreen: "Plein écran",
      zoomControls: "Commandes de zoom",
      zoomOut: "Éloigner",
      zoomIn: "Rapprocher",
      density: "Densité du bouquet",
      render: "Détail du rendu",
      cameraRoute: "Trajectoire caméra",
      pause: "Mettre la rotation en pause",
      resume: "Reprendre la rotation",
      reverse: "Inverser la trajectoire",
      speed: "Vitesse de caméra",
      preset: "Trajectoire aléatoire",
      future: "Ce bouquet n’a pas encore été généré",
      previousMonth: "Mois précédent",
      nextMonth: "Mois suivant",
      weekdays: ["D", "L", "Ma", "Me", "J", "V", "S"],
      densityChoices: {
        low: ["BAS", "Densité basse"],
        medium: ["MOY", "Densité moyenne"],
        high: ["HAU", "Densité haute"]
      },
      renderChoices: {
        auto: ["AUTO", "Détail automatique"],
        low: ["ÉCO", "Rendu économe"],
        medium: ["NET", "Rendu net"],
        high: ["MAX", "Détail maximal"]
      }
    },
    it: {
      brandSystem: "SISTEMA BOTANICO GENERATIVO",
      kicker: "COMPOSIZIONE DI OGGI",
      index: "INDICE",
      view: "VISTA",
      menuHeading: "DAILYFLORA / INDICE",
      about: "Informazioni",
      member: "Giardino personale",
      downloads: "Download",
      shop: "Negozio di bouquet",
      scifi: "Flora Sci-Fi",
      save: "Salva questo bouquet",
      review: "Revisione estetica",
      dateLabel: "DATA",
      compositionPrefix: "COMPOSIZIONE BASATA SULLA DATA",
      uiLanguage: "Lingua dell’interfaccia",
      siteNav: "Indice del sito",
      openIndex: "Apri indice del sito",
      closeIndex: "Chiudi indice del sito",
      viewingControls: "Controlli di visualizzazione",
      showView: "Mostra controlli",
      hideView: "Nascondi controlli",
      selectDate: "Scegli la data del bouquet",
      randomDate: "Data esistente casuale",
      fullscreen: "Schermo intero",
      zoomControls: "Controlli zoom",
      zoomOut: "Allontana",
      zoomIn: "Avvicina",
      density: "Densità del bouquet",
      render: "Dettaglio di rendering",
      cameraRoute: "Percorso camera",
      pause: "Pausa rotazione",
      resume: "Riprendi rotazione",
      reverse: "Inverti percorso camera",
      speed: "Velocità camera",
      preset: "Percorso casuale",
      future: "Questo bouquet non è ancora stato generato",
      previousMonth: "Mese precedente",
      nextMonth: "Mese successivo",
      weekdays: ["D", "L", "M", "M", "G", "V", "S"],
      densityChoices: {
        low: ["BAS", "Densità bassa"],
        medium: ["MED", "Densità media"],
        high: ["ALT", "Densità alta"]
      },
      renderChoices: {
        auto: ["AUTO", "Dettaglio automatico"],
        low: ["ECO", "Rendering a basso consumo"],
        medium: ["NIT", "Rendering nitido"],
        high: ["MAX", "Dettaglio massimo"]
      }
    },
    ja: {
      brandSystem: "生成植物システム",
      kicker: "今日のブーケ",
      index: "目次",
      view: "表示",
      menuHeading: "DAILYFLORA / 目次",
      about: "概要",
      member: "マイガーデン",
      downloads: "ダウンロード",
      shop: "ブーケショップ",
      scifi: "SF フローラ",
      save: "このブーケを保存",
      review: "美的レビュー",
      dateLabel: "日付",
      compositionPrefix: "日付シード構成",
      uiLanguage: "表示言語",
      siteNav: "サイト目次",
      openIndex: "サイト目次を開く",
      closeIndex: "サイト目次を閉じる",
      viewingControls: "表示コントロール",
      showView: "表示コントロールを開く",
      hideView: "表示コントロールを閉じる",
      selectDate: "ブーケの日付を選択",
      randomDate: "既存の日付をランダム選択",
      fullscreen: "全画面表示",
      zoomControls: "ズームコントロール",
      zoomOut: "縮小",
      zoomIn: "拡大",
      density: "ブーケ密度",
      render: "描画精度",
      cameraRoute: "カメラ軌道",
      pause: "回転を一時停止",
      resume: "回転を再開",
      reverse: "カメラ軌道を反転",
      speed: "カメラ速度",
      preset: "ランダム軌道",
      future: "このブーケはまだ生成されていません",
      previousMonth: "前の月",
      nextMonth: "次の月",
      weekdays: ["日", "月", "火", "水", "木", "金", "土"],
      densityChoices: {
        low: ["疎", "低密度"],
        medium: ["中", "中密度"],
        high: ["密", "高密度"]
      },
      renderChoices: {
        auto: ["自", "自動描画"],
        low: ["省", "省電力描画"],
        medium: ["清", "鮮明描画"],
        high: ["精", "高精細描画"]
      }
    }
  };

  let applyingCopy = false;

  const normalizeLanguage = (language) => supportedLanguages.includes(language) ? language : "en";

  const localTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const currentLanguage = () => normalizeLanguage(root.dataset.language);

  const setTooltip = (element, value) => {
    if (!element) return;
    element.setAttribute("title", value);
    element.setAttribute("aria-label", value);
    if (element.hasAttribute("data-tooltip")) element.setAttribute("data-tooltip", value);
  };

  const visibleBouquetName = () => {
    const element = currentLanguage() === "zh" ? dailyThemeCn : dailyThemeEn;
    return element?.textContent?.trim() || "DailyFlora";
  };

  const syncDynamicCopy = () => {
    const language = currentLanguage();
    const text = copy[language];
    const englishName = dailyThemeEn?.textContent?.trim();
    if (flowerPlanEn) {
      flowerPlanEn.textContent = englishName
        ? `${text.compositionPrefix} / ${englishName.toUpperCase()}`
        : text.compositionPrefix;
    }
    const bouquetName = visibleBouquetName();
    document.title = `DailyFlora — ${bouquetName}`;
    setTooltip(todayButton, `${text.selectDate} · ${bouquetName}`);
    setTooltip(shuffleButton, `${text.randomDate} · ${bouquetName}`);
    if (dailyDate) dailyDate.setAttribute("title", bouquetName);
  };

  const pauseIsActive = () => {
    const path = pauseButton?.querySelector("path")?.getAttribute("d") || "";
    return path.includes("v14l11-7");
  };

  const applyCalendarCopy = () => {
    const panel = document.getElementById(calendarPanelId);
    if (!panel) return;
    const text = copy[currentLanguage()];
    const weekdayCells = panel.querySelectorAll(".calendar-weekdays span");
    weekdayCells.forEach((cell, index) => {
      cell.textContent = text.weekdays[index] || "";
    });
    setTooltip(panel.querySelector('[data-calendar-nav="-1"]'), text.previousMonth);
    setTooltip(panel.querySelector('[data-calendar-nav="1"]'), text.nextMonth);
    panel.querySelectorAll("[data-calendar-date]").forEach((button) => {
      if (button.disabled) button.setAttribute("title", text.future);
    });
  };

  const applyInterfaceCopy = () => {
    if (applyingCopy) return;
    applyingCopy = true;
    const language = currentLanguage();
    const text = copy[language];

    root.lang = languageTags[language];
    if (dailyDate) dailyDate.dataset.label = text.dateLabel;
    document.querySelectorAll("[data-ui-key]").forEach((element) => {
      const key = element.dataset.uiKey;
      if (key && typeof text[key] === "string") element.textContent = text[key];
    });

    const languageToggle = document.querySelector(".global-language-toggle");
    languageToggle?.setAttribute("aria-label", text.uiLanguage);
    siteMenu?.setAttribute("aria-label", text.siteNav);
    controls?.setAttribute("aria-label", text.viewingControls);

    const menuOpen = Boolean(siteMenuPanel && !siteMenuPanel.hidden);
    setTooltip(siteMenuToggle, menuOpen ? text.closeIndex : text.openIndex);
    const controlsOpen = Boolean(controls?.classList.contains("is-expanded"));
    setTooltip(controlsToggle, controlsOpen ? text.hideView : text.showView);

    setTooltip(fullscreenButton, text.fullscreen);
    setTooltip(zoomOutButton, text.zoomOut);
    setTooltip(zoomInButton, text.zoomIn);
    setTooltip(rotationDirectionButton, text.reverse);
    setTooltip(rotationPresetButton, text.preset);
    setTooltip(reviewDashboardLink, text.review);
    if (datePicker) datePicker.setAttribute("aria-label", text.selectDate);
    if (rotationSpeed) rotationSpeed.setAttribute("aria-label", text.speed);
    document.querySelector(".zoom-control")?.setAttribute("aria-label", text.zoomControls);
    document.querySelector(".density-control")?.setAttribute("aria-label", text.density);
    document.querySelector(".render-control")?.setAttribute("aria-label", text.render);
    document.querySelector(".rotation-control")?.setAttribute("aria-label", text.cameraRoute);
    const sliderShell = document.querySelector(".slider-shell");
    sliderShell?.setAttribute("data-tooltip", text.speed);
    const sliderLabel = sliderShell?.querySelector(".sr-only");
    if (sliderLabel) sliderLabel.textContent = text.speed;

    document.querySelectorAll("[data-density-choice]").forEach((button) => {
      const choice = text.densityChoices[button.dataset.densityChoice];
      if (!choice) return;
      button.textContent = choice[0];
      setTooltip(button, choice[1]);
    });

    document.querySelectorAll("[data-render-choice]").forEach((button) => {
      const choice = text.renderChoices[button.dataset.renderChoice];
      if (!choice) return;
      button.textContent = choice[0];
      setTooltip(button, choice[1]);
    });

    setTooltip(pauseButton, pauseIsActive() ? text.resume : text.pause);
    syncDynamicCopy();
    applyCalendarCopy();
    applyingCopy = false;
  };

  const applyLanguage = (language, persist = true) => {
    const nextLanguage = normalizeLanguage(language);
    root.dataset.language = nextLanguage;
    languageButtons.forEach((button) => {
      const active = button.dataset.languageChoice === nextLanguage;
      button.setAttribute("aria-pressed", String(active));
    });
    if (persist) {
      try {
        window.localStorage.setItem(languageStorageKey, nextLanguage);
      } catch {}
    }
    applyInterfaceCopy();
  };

  const syncMenuState = () => {
    const open = Boolean(siteMenuPanel && !siteMenuPanel.hidden);
    document.body.classList.toggle("is-menu-open", open);
    if (open) {
      if (controls && controlsPanel && controlsToggle) {
        controls.classList.remove("is-expanded");
        controls.classList.add("is-collapsed");
        controlsPanel.hidden = true;
        controlsToggle.setAttribute("aria-expanded", "false");
      }
      const calendarPanel = document.getElementById(calendarPanelId);
      if (calendarPanel && !calendarPanel.hidden) {
        calendarPanel.hidden = true;
        todayButton?.setAttribute("aria-expanded", "false");
      }
    }
    applyInterfaceCopy();
  };

  const closeTransientPanels = () => {
    if (siteMenuPanel && siteMenuToggle && !siteMenuPanel.hidden) {
      siteMenuPanel.hidden = true;
      siteMenuToggle.setAttribute("aria-expanded", "false");
    }
    if (controls && controlsPanel && controlsToggle) {
      controls.classList.remove("is-expanded");
      controls.classList.add("is-collapsed");
      controlsPanel.hidden = true;
      controlsToggle.setAttribute("aria-expanded", "false");
    }
    const calendarPanel = document.getElementById(calendarPanelId);
    if (calendarPanel && !calendarPanel.hidden) {
      calendarPanel.hidden = true;
      todayButton?.setAttribute("aria-expanded", "false");
    }
    syncMenuState();
  };

  const patchCalendar = () => {
    const calendarPanel = document.getElementById(calendarPanelId);
    if (!calendarPanel) return;
    const today = localTodayKey();
    calendarPanel.querySelectorAll("[data-calendar-date]").forEach((button) => {
      const dateKey = button.dataset.calendarDate || "";
      const future = dateKey > today;
      button.disabled = future;
      button.classList.toggle("is-future", future);
      button.setAttribute("aria-disabled", String(future));
    });
    const monthLabel = calendarPanel.querySelector(".calendar-header strong")?.textContent?.trim();
    const nextButton = calendarPanel.querySelector('[data-calendar-nav="1"]');
    if (monthLabel && nextButton) {
      const [year, month] = monthLabel.split(".").map(Number);
      const now = new Date();
      const atLatestMonth =
        year > now.getFullYear() ||
        (year === now.getFullYear() && month - 1 >= now.getMonth());
      nextButton.disabled = atLatestMonth;
      nextButton.setAttribute("aria-disabled", String(atLatestMonth));
    }
    applyCalendarCopy();
  };

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.languageChoice));
  });

  if (hud) {
    const hudObserver = new MutationObserver(() => {
      if (hud.classList.contains("is-hidden")) closeTransientPanels();
    });
    hudObserver.observe(hud, { attributes: true, attributeFilter: ["class"] });
  }

  if (siteMenuPanel) {
    const menuObserver = new MutationObserver(syncMenuState);
    menuObserver.observe(siteMenuPanel, { attributes: true, attributeFilter: ["hidden"] });
  }

  if (controls) {
    const controlsObserver = new MutationObserver(() => applyInterfaceCopy());
    controlsObserver.observe(controls, { attributes: true, attributeFilter: ["class"] });
  }

  if (dailyThemeCn || dailyThemeEn) {
    const titleObserver = new MutationObserver(() => {
      if (!applyingCopy) syncDynamicCopy();
    });
    if (dailyThemeCn) titleObserver.observe(dailyThemeCn, { childList: true, characterData: true, subtree: true });
    if (dailyThemeEn) titleObserver.observe(dailyThemeEn, { childList: true, characterData: true, subtree: true });
  }

  const calendarObserver = new MutationObserver(() => patchCalendar());
  calendarObserver.observe(document.body, { childList: true, subtree: true });

  [siteMenuToggle, controlsToggle, pauseButton, rotationDirectionButton, rotationPresetButton].forEach((element) => {
    element?.addEventListener("click", () => window.setTimeout(() => {
      syncMenuState();
      applyInterfaceCopy();
    }, 0));
  });

  if (datePicker) datePicker.max = localTodayKey();

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const dateButton = target.closest("[data-calendar-date]");
      if (dateButton && (dateButton.dataset.calendarDate || "") > localTodayKey()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const nextMonthButton = target.closest('[data-calendar-nav="1"]');
      if (nextMonthButton?.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  datePicker?.addEventListener(
    "change",
    (event) => {
      if (!datePicker.value || datePicker.value <= localTodayKey()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const currentDate = dailyDate?.textContent?.trim();
      datePicker.value = currentDate && currentDate <= localTodayKey() ? currentDate : localTodayKey();
    },
    true
  );

  const randomExistingDate = () => {
    const today = localTodayKey();
    const start = new Date("2026-01-01T00:00:00");
    const end = new Date(`${today}T00:00:00`);
    if (end.getTime() <= start.getTime()) return today;
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((end.getTime() - start.getTime()) / dayMs);
    const result = new Date(start.getTime() + Math.floor(Math.random() * (totalDays + 1)) * dayMs);
    const year = result.getFullYear();
    const month = String(result.getMonth() + 1).padStart(2, "0");
    const day = String(result.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  shuffleButton?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!datePicker) return;
      datePicker.value = randomExistingDate();
      datePicker.dispatchEvent(new Event("change", { bubbles: true }));
    },
    true
  );

  window.addEventListener("focus", () => {
    if (datePicker) datePicker.max = localTodayKey();
    patchCalendar();
    applyInterfaceCopy();
  });

  window.addEventListener("load", () => {
    window.setTimeout(() => applyLanguage(root.dataset.language, false), 0);
    window.setTimeout(() => applyInterfaceCopy(), 400);
  });

  applyLanguage(root.dataset.language, false);
  patchCalendar();
  syncMenuState();
})();
