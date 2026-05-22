/* ============================================================
   Ralvie AI Frontdesk — page interactions
   Nav, mobile menu, scroll reveals, counters, 3D card tilt.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- sticky nav state ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- header: menu, dropdowns, mega tabs ---- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  function closeItems() {
    document.querySelectorAll('.nav-item.open').forEach(function (it) {
      it.classList.remove('open');
      var b = it.querySelector('.nav-link');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function closeMenu() {
    menu.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    closeItems();
  }

  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) closeItems();
  });

  /* expand/collapse a section (accordion on mobile, click-to-pin on desktop) */
  document.querySelectorAll('.nav-item > .nav-link').forEach(function (btn) {
    var item = btn.parentElement;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !item.classList.contains('open');
      closeItems();
      if (willOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* close panels when clicking outside the nav */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item')) closeItems();
  });

  /* clicking a real link closes the menu */
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });

  /* products mega-menu tab switching */
  document.querySelectorAll('.mega-tab').forEach(function (tab) {
    function activate() {
      var pane = document.getElementById(tab.dataset.tab);
      if (!pane) return;
      var scope = tab.closest('.mega-products');
      scope.querySelectorAll('.mega-tab').forEach(function (t) { t.classList.remove('is-active'); });
      scope.querySelectorAll('.mega-pane').forEach(function (p) { p.classList.remove('is-active'); });
      tab.classList.add('is-active');
      pane.classList.add('is-active');
    }
    tab.addEventListener('click', activate);
    tab.addEventListener('mouseenter', activate);
  });

  /* reset menu state when crossing the desktop/mobile breakpoint */
  var mq = window.matchMedia('(min-width: 981px)');
  var onMq = function () { closeMenu(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq);
  else if (mq.addListener) mq.addListener(onMq);

  /* ---- scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          ro.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---- stagger sibling reveals within a grid ---- */
  ['.channel-grid', '.cap-grid', '.steps', '.stat-grid'].forEach(function (sel) {
    var grid = document.querySelector(sel);
    if (!grid) return;
    Array.prototype.forEach.call(grid.children, function (child, i) {
      child.style.transitionDelay = (i * 0.08) + 's';
    });
  });

  /* ---- animated stat counters ---- */
  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    var dur = 1500, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('.stat-num[data-count]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    counters.forEach(function (el) {
      var d = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = parseFloat(el.dataset.count).toFixed(d) + (el.dataset.suffix || '');
    });
  } else {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---- 3D tilt on capability cards ---- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.cap-card.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'rotateY(' + (px * 13).toFixed(2) + 'deg) rotateX(' + (-py * 13).toFixed(2) +
          'deg) translateY(-6px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---- channel card -> light up matching orbit node in the 3D scene ---- */
  document.querySelectorAll('.channel-card[data-channel]').forEach(function (card) {
    var key = card.dataset.channel;
    card.addEventListener('pointerenter', function () {
      card.classList.add('active');
      if (window.__ralvieScene) window.__ralvieScene.highlight(key);
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('active');
      if (window.__ralvieScene) window.__ralvieScene.highlight(null);
    });
  });
})();
