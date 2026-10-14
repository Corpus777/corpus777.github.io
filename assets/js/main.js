/* ==========================================================================
   Vlad Bucur — site behaviour (no dependencies)
   1. Theme toggle   [data-theme-toggle]   light/dark, persisted in localStorage
   2. Scroll regions [data-scroll-region]  keyboard access to the shell's columns
   The portfolio sidebar is rendered by assets/js/portfolio.js.
   The anti-flash theme script lives inline in each page's <head>.
   Every block is guarded, so the same file works on every page.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'theme';
  var THEME_COLORS = { light: '#F6F3EC', dark: '#131210' }; // keep in sync with --bg
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /* 1. Theme ---------------------------------------------------------------- */

  function readStoredTheme() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (err) {
      return null;
    }
  }

  function storeTheme(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      /* Storage unavailable (private mode, blocked cookies): the choice just won't persist. */
    }
  }

  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }

  function syncThemeUI() {
    var theme = currentTheme();
    var explicit = root.hasAttribute('data-theme');

    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });

    // Browser chrome colour: follow the explicit choice, otherwise restore media defaults.
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
      if (!meta.hasAttribute('data-default')) {
        meta.setAttribute('data-default', meta.getAttribute('content') || '');
      }
      meta.setAttribute('content', explicit ? THEME_COLORS[theme] : meta.getAttribute('data-default'));
    });
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
    button.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      storeTheme(next);
      syncThemeUI();
    });
  });

  // Keep the button state honest when the OS theme changes and no choice was saved.
  if (darkQuery) {
    var onSystemChange = function () {
      if (!readStoredTheme()) syncThemeUI();
    };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
  }

  syncThemeUI();

  /* 2. Scroll regions -------------------------------------------------------
     On large screens the main column scrolls on its own. A scroll container
     with nothing focusable inside can't be scrolled from the keyboard, so it
     becomes a tab stop (tabindex="0", named by its aria-label) exactly while
     it is scrollable and has no focusable content. Otherwise it is set back
     to tabindex="-1", which keeps it a target for the skip link. The HTML
     ships the no-JS default. */

  var regions = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-region]'));
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

  if (regions.length) {
    var isScrollable = function (el) {
      var overflowY = window.getComputedStyle(el).overflowY;
      return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
    };

    var syncRegions = function () {
      regions.forEach(function (el) {
        var needsStop = isScrollable(el) && !el.querySelector(FOCUSABLE);
        el.setAttribute('tabindex', needsStop ? '0' : '-1');
      });
    };

    var queued = false;
    var queueSync = function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        syncRegions();
      });
    };

    syncRegions();
    window.addEventListener('resize', queueSync, { passive: true });
    window.addEventListener('load', queueSync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueSync);
  }
})();
