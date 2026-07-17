(() => {
  const root = document.documentElement;
  if (!root.classList.contains("df-gui-v1")) return;

  const languageStorageKey = "dailyflora.gui-language.v1";
  const languageButtons = Array.from(
    document.querySelectorAll("[data-language-choice]")
  );
  const hud = document.querySelector("#hud");
  const siteMenuPanel = document.querySelector("#site-menu-panel");
  const siteMenuToggle = document.querySelector("#site-menu-toggle");
  const controls = document.querySelector("#controls");
  const controlsPanel = document.querySelector("#controls-panel");
  const controlsToggle = document.querySelector("#controls-toggle");
  const calendarPanelId = "date-calendar";
  const todayButton = document.querySelector("#today-button");
  const datePicker = document.querySelector("#date-picker");
  const shuffleButton = document.querySelector("#shuffle-button");
  const dailyDate = document.querySelector("#daily-date");

  const localTodayKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyLanguage = (language, persist = true) => {
    const nextLanguage = language === "zh" ? "zh" : "en";
    root.dataset.language = nextLanguage;
    languageButtons.forEach((button) => {
      const active = button.dataset.languageChoice === nextLanguage;
      button.setAttribute("aria-pressed", String(active));
    });
    if (!persist) return;
    try {
      window.localStorage.setItem(languageStorageKey, nextLanguage);
    } catch {
      // A blocked storage context should not prevent the interface from working.
    }
  };

  applyLanguage(root.dataset.language === "zh" ? "zh" : "en", false);

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLanguage(button.dataset.languageChoice);
    });
  });

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
      controlsToggle.setAttribute("aria-label", "Show viewing controls");
      controlsToggle.title = "Show viewing controls";
    }

    const calendarPanel = document.getElementById(calendarPanelId);
    if (calendarPanel && !calendarPanel.hidden) {
      calendarPanel.hidden = true;
      todayButton?.setAttribute("aria-expanded", "false");
    }
  };

  if (hud) {
    const hudObserver = new MutationObserver(() => {
      if (hud.classList.contains("is-hidden")) closeTransientPanels();
    });
    hudObserver.observe(hud, { attributes: true, attributeFilter: ["class"] });
  }

  const patchCalendar = () => {
    const calendarPanel = document.getElementById(calendarPanelId);
    if (!calendarPanel) return;

    const today = localTodayKey();
    calendarPanel
      .querySelectorAll("[data-calendar-date]")
      .forEach((button) => {
        const dateKey = button.dataset.calendarDate || "";
        const future = dateKey > today;
        button.disabled = future;
        button.classList.toggle("is-future", future);
        button.setAttribute("aria-disabled", String(future));
        if (future) button.title = "这束花尚未生成";
      });

    const monthLabel = calendarPanel
      .querySelector(".calendar-header strong")
      ?.textContent?.trim();
    const nextButton = calendarPanel.querySelector(
      '[data-calendar-nav="1"]'
    );
    if (!monthLabel || !nextButton) return;

    const [year, month] = monthLabel.split(".").map(Number);
    const now = new Date();
    const atLatestMonth =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month - 1 >= now.getMonth());
    nextButton.disabled = atLatestMonth;
    nextButton.setAttribute("aria-disabled", String(atLatestMonth));
  };

  if (datePicker) datePicker.max = localTodayKey();

  const calendarObserver = new MutationObserver(() => patchCalendar());
  calendarObserver.observe(document.body, { childList: true, subtree: true });
  patchCalendar();

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const dateButton = target.closest("[data-calendar-date]");
      if (
        dateButton &&
        (dateButton.dataset.calendarDate || "") > localTodayKey()
      ) {
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
      datePicker.value =
        currentDate && currentDate <= localTodayKey()
          ? currentDate
          : localTodayKey();
    },
    true
  );

  const randomExistingDate = () => {
    const today = localTodayKey();
    const earliest = "2026-01-01";
    const start = new Date(`${earliest}T00:00:00`);
    const end = new Date(`${today}T00:00:00`);
    if (end.getTime() <= start.getTime()) return today;
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((end.getTime() - start.getTime()) / dayMs);
    const result = new Date(
      start.getTime() + Math.floor(Math.random() * (totalDays + 1)) * dayMs
    );
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
  });
})();
