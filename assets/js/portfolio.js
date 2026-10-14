/* ==========================================================================
   Portfolio sidebar renderer (no dependencies)
   Builds the "Portfolio" aside on every page from window.PROJECTS, which is
   defined in assets/js/projects-data.js (load that file first).

   Page contract
     <body data-root="./">                        home page
     <body data-root="../../" data-project="slug">  projects/<slug>/index.html
       data-root     prefix that turns a site-root-relative path into one that
                     works from this page (links + images).
       data-project  slug of the project this page is about; its card gets
                     aria-current="page" and is scrolled into view.
     <aside data-portfolio>
       [data-portfolio-filters]  chip row (kept hidden below 2 categories)
       [data-portfolio-status]   polite live region ("3 projects shown")
       [data-portfolio-list]     cards, groups or the empty state

   The DOM is built with createElement/textContent only; data is never
   parsed as HTML.
   ========================================================================== */
(function () {
  'use strict';

  var aside = document.querySelector('[data-portfolio]');
  var list = aside && aside.querySelector('[data-portfolio-list]');
  if (!list) return;

  // Firefox makes scroll containers tab stops even when they hold links; the
  // cards are the stops, so keep the container itself out of the Tab order.
  list.setAttribute('tabindex', '-1');

  var filterBar = aside.querySelector('[data-portfolio-filters]');
  var statusEl = aside.querySelector('[data-portfolio-status]');

  var ROOT = normaliseRoot(document.body.getAttribute('data-root'));
  var CURRENT = (document.body.getAttribute('data-project') || '').trim();
  var GITHUB_URL = 'https://github.com/Corpus777';
  var SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var ALL = ''; // filter value for the "All" chip
  var ICONS = {
    arrow: ['M5 12h14M13 6l6 6-6 6'],
    external: ['M7 17 17 7M8 7h9v9'],
    pin: ['M9 4h6l-1 6 3 3H7l3-3-1-6z', 'M12 13v7'],
    doc: [
      'M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z',
      'M14 3v5h5M8.5 12.5h7M8.5 16h4.5'
    ]
  };
  var MINOR_WORDS = ['a', 'an', 'and', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];

  var eagerCovers = false; // flipped once the page is idle (see bottom)
  var projects = readProjects(window.PROJECTS);
  var categories = uniqueCategories(projects);
  var active = ALL;

  /* Data ------------------------------------------------------------------ */

  function isText(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function readProjects(raw) {
    if (!Array.isArray(raw)) return [];
    var seen = {};
    var out = [];
    raw.forEach(function (p, index) {
      var ok = p && typeof p === 'object' && isText(p.slug) && SLUG_PATTERN.test(p.slug) &&
        isText(p.title) && !seen[p.slug];
      if (!ok) {
        if (window.console) {
          console.warn('portfolio: skipped window.PROJECTS[' + index + '] (needs a unique lowercase-hyphen "slug" and a "title").');
        }
        return;
      }
      seen[p.slug] = true;
      out.push({
        slug: p.slug,
        title: p.title.trim(),
        summary: isText(p.summary) ? p.summary.trim() : '',
        category: isText(p.category) ? p.category.trim() : 'Other',
        tags: Array.isArray(p.tags) ? p.tags.filter(isText).map(function (t) { return t.trim(); }).slice(0, 4) : [],
        year: p.year == null ? '' : String(p.year).trim(),
        image: isText(p.image) ? p.image.trim() : '',
        pinned: p.pinned === true
      });
    });
    return out;
  }

  // Categories in order of first appearance (the data is newest first).
  function uniqueCategories(items) {
    var result = [];
    items.forEach(function (p) {
      if (result.indexOf(p.category) === -1) result.push(p.category);
    });
    return result;
  }

  function normaliseRoot(value) {
    var r = (value || '').trim() || './';
    return r.charAt(r.length - 1) === '/' ? r : r + '/';
  }

  // Site-root-relative path -> path from this page. Full http(s) URLs pass through.
  function resolve(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return ROOT + path.replace(/^(\.\/|\/)+/, '');
  }

  function initials(title) {
    var words = title.split(/[\s\-–—_/:.]+/).filter(function (w) {
      return /[A-Za-z0-9À-ɏ]/.test(w);
    });
    var major = words.filter(function (w) {
      return MINOR_WORDS.indexOf(w.toLowerCase()) === -1;
    });
    return (major.length ? major : words).slice(0, 2).map(function (w) {
      return w.replace(/[^A-Za-z0-9À-ɏ]/g, '').charAt(0);
    }).join('').toUpperCase();
  }

  /* DOM helpers ----------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(name, className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', name === 'doc' ? '1.4' : '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (className) svg.setAttribute('class', className);
    ICONS[name].forEach(function (d) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    return svg;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function newTabNote() {
    return el('span', 'visually-hidden', ' (opens in a new tab)');
  }

  /* Builders -------------------------------------------------------------- */

  function placeholder(p) {
    var box = el('span', 'card__placeholder');
    box.setAttribute('aria-hidden', 'true');
    box.appendChild(el('span', 'card__initials', initials(p.title)));
    return box;
  }

  function buildCard(p) {
    var isCurrent = p.slug === CURRENT;
    var card = el('li', isCurrent ? 'card is-current' : 'card');

    // Thumbnail (decorative: the title says what it is).
    var media = el('div', 'card__media');
    if (p.image) {
      var img = el('img', 'card__img');
      img.alt = '';
      img.width = 1200;
      img.height = 750;
      img.loading = eagerCovers ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        clear(media);
        media.appendChild(placeholder(p));
      });
      img.src = resolve(p.image);
      media.appendChild(img);
    } else {
      media.appendChild(placeholder(p));
    }
    card.appendChild(media);

    var body = el('div', 'card__body');
    var head = el('div', 'card__head');
    var title = el('h4', 'card__title');
    var link = el('a', 'card__link');
    link.href = ROOT + 'projects/' + p.slug + '/';
    if (isCurrent) link.setAttribute('aria-current', 'page');
    link.appendChild(el('span', 'card__title-text', p.title));
    link.appendChild(icon('arrow', 'card__arrow'));
    title.appendChild(link);
    head.appendChild(title);
    if (p.year) head.appendChild(el('span', 'card__year', p.year));
    body.appendChild(head);

    if (p.summary) body.appendChild(el('p', 'card__summary', p.summary));

    if (p.tags.length) {
      var tags = el('ul', 'tag-list card__tags');
      tags.setAttribute('role', 'list');
      tags.setAttribute('aria-label', 'Tags');
      p.tags.forEach(function (t) {
        tags.appendChild(el('li', 'tag', t));
      });
      body.appendChild(tags);
    }

    card.appendChild(body);
    return card;
  }

  // Card titles are always h4 under an h3 group heading. In a filtered view
  // the heading is kept for screen readers but hidden visually.
  function buildGroup(name, items, options) {
    var group = el('div', 'portfolio__group');
    var heading = el('h3', 'portfolio__group-title' + (options.hideTitle ? ' visually-hidden' : ''));
    if (options.pinned) heading.appendChild(icon('pin'));
    heading.appendChild(document.createTextNode(name));
    group.appendChild(heading);

    var cards = el('ul', 'cards');
    cards.setAttribute('role', 'list');
    items.forEach(function (p) {
      cards.appendChild(buildCard(p));
    });
    group.appendChild(cards);
    return group;
  }

  function buildEmpty() {
    var box = el('div', 'portfolio__empty');
    box.appendChild(icon('doc', 'portfolio__empty-icon'));
    box.appendChild(el('p', 'eyebrow', 'Forthcoming'));
    box.appendChild(el('p', 'portfolio__empty-title', 'First write-ups coming soon.'));
    box.appendChild(el('p', 'portfolio__empty-text',
      'Personal projects will be published here as short case studies, each with its code and a write-up.'));
    var link = el('a', 'portfolio__empty-link text-link');
    link.href = GITHUB_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.appendChild(document.createTextNode('Follow along on GitHub'));
    link.appendChild(icon('external'));
    link.appendChild(newTabNote());
    box.appendChild(link);
    return box;
  }

  /* Rendering ------------------------------------------------------------- */

  function visibleProjects() {
    return active === ALL ? projects : projects.filter(function (p) {
      return p.category === active;
    });
  }

  function render() {
    clear(list);

    if (!projects.length) {
      list.appendChild(buildEmpty());
      return;
    }

    if (active !== ALL) {
      list.appendChild(buildGroup(active, visibleProjects(), { hideTitle: true }));
      return;
    }

    var pinned = projects.filter(function (p) { return p.pinned; });
    if (pinned.length) list.appendChild(buildGroup('Pinned', pinned, { pinned: true }));

    categories.forEach(function (cat) {
      var items = projects.filter(function (p) {
        return !p.pinned && p.category === cat;
      });
      if (items.length) list.appendChild(buildGroup(cat, items, {}));
    });
  }

  function announce(message) {
    if (!statusEl) return;
    // Clear first so an identical message is still announced.
    statusEl.textContent = '';
    window.setTimeout(function () {
      statusEl.textContent = message;
    }, 60);
  }

  function setFilter(value) {
    if (value === active) return;
    active = value;
    filterBar.querySelectorAll('.chip').forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-category') === active ? 'true' : 'false');
    });
    render();
    list.scrollTop = 0;
    var count = visibleProjects().length;
    announce(count + (count === 1 ? ' project' : ' projects') + ' shown');
  }

  function buildFilters() {
    if (!filterBar || categories.length < 2) return;
    [ALL].concat(categories).forEach(function (cat) {
      var chip = el('button', 'chip', cat === ALL ? 'All' : cat);
      chip.type = 'button';
      chip.setAttribute('data-category', cat);
      chip.setAttribute('aria-pressed', cat === active ? 'true' : 'false');
      chip.addEventListener('click', function () {
        setFilter(cat);
      });
      filterBar.appendChild(chip);
    });
    filterBar.hidden = false;
  }

  // On a project page, bring its card into view inside the scrolling list.
  // Only when the list is its own scroll container: in the stacked mobile
  // layout this would scroll the whole page away from the article.
  function revealCurrent() {
    var card = list.querySelector('.card.is-current');
    if (!card) return;
    var overflowY = window.getComputedStyle(list).overflowY;
    if (overflowY !== 'auto' && overflowY !== 'scroll') return;

    var box = list.getBoundingClientRect();
    var rect = card.getBoundingClientRect();
    if (rect.top >= box.top && rect.bottom <= box.bottom) return;

    // The first card in a group scrolls with its group heading, not under it.
    var target = card.parentNode.firstElementChild === card ? card.closest('.portfolio__group') : card;
    var top = Math.max(0, list.scrollTop + (target.getBoundingClientRect().top - box.top) - 16);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      list.scrollTop = top;
    }
  }

  buildFilters();
  render();

  // Covers start lazy so the first paint stays light, then load in the
  // background once the page is idle: printing captures before late lazy
  // images finish, so waiting for beforeprint alone is too late.
  function loadAllCovers() {
    eagerCovers = true;
    list.querySelectorAll('img[loading="lazy"]').forEach(function (img) {
      img.loading = 'eager';
    });
  }
  window.addEventListener('load', function () {
    if (window.requestIdleCallback) window.requestIdleCallback(loadAllCovers, { timeout: 3000 });
    else window.setTimeout(loadAllCovers, 1500);
  });
  window.addEventListener('beforeprint', loadAllCovers);

  list.addEventListener('scroll', function () {
    aside.classList.toggle('is-scrolled', list.scrollTop > 2);
  }, { passive: true });

  if (CURRENT) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(revealCurrent);
    else window.addEventListener('load', revealCurrent);
  }
})();
