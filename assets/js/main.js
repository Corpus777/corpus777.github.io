/* ==========================================================================
   Vlad Bucur — site behaviour (no dependencies)
   1. Theme toggle   [data-theme-toggle]  light/dark, persisted in localStorage
   2. Mobile nav     [data-nav-toggle]    disclosure for #site-nav
   3. Header state   [data-site-header]   hairline once the page scrolls
   4. Current section highlight in the nav (aria-current="location")
   Every block is guarded, so the same file works on index.html, case-study
   pages, and anything added later.
   The anti-flash theme script lives inline in each page's <head>.
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

  /* 2. Mobile navigation --------------------------------------------------- */

  var header = document.querySelector('[data-site-header]');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = navToggle ? document.getElementById(navToggle.getAttribute('aria-controls')) : null;

  if (header && navToggle && nav) {
    var setNavOpen = function (open) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      header.classList.toggle('is-nav-open', open);
    };
    var isNavOpen = function () {
      return navToggle.getAttribute('aria-expanded') === 'true';
    };

    navToggle.addEventListener('click', function () {
      setNavOpen(!isNavOpen());
    });

    // Close after choosing a destination.
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNavOpen(false);
    });

    // Close on Escape and return focus to the toggle.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isNavOpen()) {
        setNavOpen(false);
        navToggle.focus();
      }
    });

    // Close when clicking anywhere outside the header.
    document.addEventListener('click', function (event) {
      if (isNavOpen() && !header.contains(event.target)) setNavOpen(false);
    });

    // Close when keyboard focus moves out of the header, so the open panel never hides it.
    header.addEventListener('focusout', function (event) {
      if (isNavOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setNavOpen(false);
    });

    // Reset when the layout switches to the desktop nav (matches the CSS breakpoint).
    if (window.matchMedia) {
      var desktopQuery = window.matchMedia('(min-width: 48em)');
      var onDesktopChange = function () {
        if (desktopQuery.matches) setNavOpen(false);
      };
      if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onDesktopChange);
      else if (desktopQuery.addListener) desktopQuery.addListener(onDesktopChange);
    }
  }

  /* 3. Header hairline on scroll -------------------------------------------- */

  if (header) {
    var ticking = false;
    var updateHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    updateHeader();
  }

  /* 4. Current-section highlight -------------------------------------------- */

  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.site-nav__link[href^="#"]')
  );

  if (navLinks.length && 'IntersectionObserver' in window) {
    var linkFor = {};
    navLinks.forEach(function (link) {
      linkFor[link.getAttribute('href').slice(1)] = link;
    });

    var setCurrent = function (id) {
      navLinks.forEach(function (link) {
        if (link === linkFor[id]) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' }); // a thin band across the middle of the viewport

    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    // Elements marked [data-nav-clear] (the hero) clear the highlight when in view.
    document.querySelectorAll('[data-nav-clear][id]').forEach(function (el) {
      observer.observe(el);
    });
  }
})();
