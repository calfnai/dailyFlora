const tutorialKeys = {
  visitor: 'dailyflora.visitorTutorialDismissed.v1',
  view: 'dailyflora.viewTutorialDismissed.v1',
  fullscreen: 'dailyflora.fullscreenHelpDismissed.v1',
  hand: 'dailyflora.handTutorialDismissed.v1'
} as const;

type TutorialName = keyof typeof tutorialKeys;

function setLanguage(language: 'en' | 'zh') {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll<HTMLElement>('[data-language-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.languagePanel !== language;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-language-choice]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.languageChoice === language));
  });
  window.localStorage.setItem('dailyflora.site-language.v1', language);
}

document.querySelectorAll<HTMLButtonElement>('[data-language-choice]').forEach((button) => {
  button.addEventListener('click', () => {
    const language = button.dataset.languageChoice;
    if (language === 'en' || language === 'zh') setLanguage(language);
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-tutorial]').forEach((button) => {
  button.addEventListener('click', () => {
    const tutorial = button.dataset.tutorial as TutorialName | undefined;
    if (!tutorial || !(tutorial in tutorialKeys)) return;
    window.localStorage.removeItem(tutorialKeys[tutorial]);
    const route = tutorial === 'visitor' ? '../' : `../?tutorial=${tutorial}`;
    window.location.href = route;
  });
});

document.querySelector<HTMLButtonElement>('[data-reset-tutorials]')?.addEventListener('click', () => {
  Object.values(tutorialKeys).forEach((key) => window.localStorage.removeItem(key));
  const status = document.querySelector<HTMLElement>('[data-tutorial-status]');
  if (status) status.textContent = '全部教程提示已恢复。账户、收藏、私人花束、设置与生成记录均未更改。';
});

const storedLanguage = window.localStorage.getItem('dailyflora.site-language.v1');
setLanguage(storedLanguage === 'zh' ? 'zh' : 'en');
