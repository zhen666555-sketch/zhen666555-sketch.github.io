(() => {
  'use strict';
  const body = document.body;
  body.dataset.js = 'on';
  const english = document.documentElement.lang === 'en';
  const motion = document.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let preference;
  try { preference = localStorage.getItem('zhen-motion'); } catch { /* Storage is optional. */ }
  function updateMotion() {
    const enabled = preference ? preference === 'on' : !reduced.matches;
    body.dataset.motion = enabled ? 'on' : 'off';
    motion.setAttribute('aria-pressed', String(enabled));
    motion.title = english ? (enabled ? 'Pause motion' : 'Enable motion') : (enabled ? '暂停动态效果' : '开启动效');
    body.dispatchEvent(new Event('motionchange'));
  }
  updateMotion();
  motion.hidden = false;
  motion.addEventListener('click', () => {
    preference = body.dataset.motion === 'on' ? 'off' : 'on';
    try { localStorage.setItem('zhen-motion', preference); } catch { /* Keep this session's choice. */ }
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('#main-nav');
  const menu = document.querySelector('.menu-toggle');
  function closeMenu() {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
  }
  menu.addEventListener('click', () => {
    menu.setAttribute('aria-expanded', String(nav.classList.toggle('is-open')));
  });
  nav.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); }
  });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) closeMenu(); });
  matchMedia('(max-width: 720px)').addEventListener('change', closeMenu);

  const language = header.querySelector('.language-switch a');
  const languagePath = language.getAttribute('href');
  const reader = document.querySelector('.case-reader');
  const cases = new Map();
  let returnTo = null;
  let shown = '';

  if (typeof reader.showModal === 'function') {
    document.querySelectorAll('details.notes, details.archive-item').forEach(details => {
      const row = details.classList.contains('archive-item');
      const project = row ? details : details.closest('article');
      const id = project.id;
      const title = row ? details.querySelector('.archive-name').firstChild.textContent.trim() : project.querySelector('h3').textContent;
      const kind = project.querySelector(row ? '.archive-subtitle' : '.project-type').textContent;
      const question = details.querySelector('.case-question').textContent;
      const entry = document.createElement('a');
      entry.href = '#' + id;
      entry.setAttribute('aria-haspopup', 'dialog');
      if (row) {
        details.removeAttribute('id');
        entry.id = id;
        entry.className = 'archive-entry';
        entry.innerHTML = details.querySelector('summary').innerHTML;
        entry.querySelector('.archive-plus').textContent = '→';
      } else {
        entry.className = 'read-case';
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        entry.append(question, arrow);
      }
      entry.setAttribute('aria-label', title + ' · ' + question);
      details.before(entry);
      details.hidden = true;
      const content = details.querySelector(row ? '.archive-body' : '.notes-body');
      cases.set(id, {title, kind, question, content, entry});
    });
  }

  const pane = reader.querySelector('.reader-page');
  const contents = reader.querySelector('.reader-content');
  const jumper = reader.querySelector('.reader-jump');
  let sections = [];
  jumper.addEventListener('change', () => {
    const section = sections[Number(jumper.value)];
    if (!section) return;
    pane.scrollTop += section.getBoundingClientRect().top - pane.getBoundingClientRect().top - 16;
    section.tabIndex = -1;
    section.focus({preventScroll:true});
    jumper.value = '';
  });
  function showCase(id) {
    if (id === shown) return;
    const item = cases.get(id);
    reader.querySelector('#reader-title').textContent = item.title;
    reader.querySelector('.reader-heading p').textContent = item.kind;
    reader.querySelector('.reader-question').textContent = item.question;
    contents.replaceChildren(item.content.cloneNode(true));
    sections = [reader.querySelector('#reader-title'), ...contents.querySelectorAll('h4,.case-boundary strong')];
    jumper.replaceChildren(new Option(english ? 'Jump to section' : '跳至章节', ''));
    sections.forEach((section,i) => jumper.add(new Option(i ? section.textContent : (english ? 'Overview' : '项目概览'), String(i))));
    reader.querySelector('.reader-language').href = languagePath + '#' + id;
    if (!reader.open) {
      document.body.classList.add('reading-case');
      reader.showModal();
      body.dispatchEvent(new Event('readerchange'));
    }
    pane.scrollTop = 0;
    shown = id;
  }
  function hideCase() {
    if (!reader.open) return;
    const entry = cases.get(shown).entry;
    reader.close();
    document.body.classList.remove('reading-case');
    body.dispatchEvent(new Event('readerchange'));
    (returnTo || entry).focus({preventScroll:true});
    if (!returnTo) entry.scrollIntoView({block:'center'});
    returnTo = null;
    shown = '';
  }
  function syncHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (cases.has(id)) showCase(id);
    else {
      hideCase();
      if (target?.matches('details')) target.open = true;
      else if (target?.matches('article')) {
        const details = target.querySelector('.notes');
        if (details) details.open = true;
      }
    }
    language.setAttribute('href', languagePath + (target ? location.hash : ''));
  }
  window.addEventListener('hashchange', syncHash);
  window.addEventListener('popstate', syncHash);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !cases.has(link.hash.slice(1))) return;
    event.preventDefault();
    returnTo = link;
    history.pushState({portfolioReader:true}, '', link.hash);
    syncHash();
  });
  function returnToPortfolio() {
    if (history.state?.portfolioReader) history.back();
    else {
      history.replaceState(null, '', '#projects');
      syncHash();
    }
  }
  reader.querySelector('.reader-close').addEventListener('click', returnToPortfolio);
  reader.querySelector('.reader-return').addEventListener('click', returnToPortfolio);
  reader.addEventListener('cancel', event => { event.preventDefault(); returnToPortfolio(); });
  reader.addEventListener('click', event => {
    if (event.target !== reader) return;
    const rect = reader.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) returnToPortfolio();
  });
  syncHash();
})();
