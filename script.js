(function () {
  'use strict';

  var track = document.getElementById('track');
  var trackInner = document.getElementById('trackInner');
  var header = document.getElementById('header');
  var progressBar = document.getElementById('progressBar');
  var scrollHint = document.getElementById('scrollHint');
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  var panels = document.querySelectorAll('.panel');
  var navLinks = document.querySelectorAll('.nav-link');
  var dots = document.querySelectorAll('.dot');
  var logo = document.querySelector('.logo');

  var SLIDE_MS = 900;
  var WHEEL_COOLDOWN = 1000;
  var WHEEL_THRESHOLD = 40;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileQuery = window.matchMedia('(max-width: 900px)');
  var isMobile = function () { return mobileQuery.matches; };

  var currentPanel = 0;
  var isTransitioning = false;
  var wheelLocked = false;
  var wheelAccum = 0;

  function goToPanel(index, instant) {
    if (index < 0 || index >= panels.length) return;
    if (!isMobile() && isTransitioning && index === currentPanel) return;

    currentPanel = index;

    if (isMobile()) {
      panels[index].scrollIntoView({
        behavior: instant || prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    } else {
      if (instant || prefersReducedMotion) {
        trackInner.classList.add('no-transition');
        trackInner.style.transform = 'translate3d(-' + (index * 100) + '%, 0, 0)';
        requestAnimationFrame(function () {
          trackInner.classList.remove('no-transition');
        });
      } else {
        isTransitioning = true;
        trackInner.style.transform = 'translate3d(-' + (index * 100) + '%, 0, 0)';
        setTimeout(function () { isTransitioning = false; }, SLIDE_MS);
      }
    }

    updateUI(index);
    revealPanel(index);

    if (index > 0 && scrollHint) {
      scrollHint.classList.add('hidden');
    }
  }

  function updateUI(index) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', parseInt(link.dataset.panel, 10) === index);
    });

    dots.forEach(function (dot) {
      dot.classList.toggle('active', parseInt(dot.dataset.panel, 10) === index);
    });

    header.classList.toggle('scrolled', index > 0);

    var ratio = panels.length > 1 ? index / (panels.length - 1) : 0;
    progressBar.style.transform = 'scale3d(' + ratio + ', 1, 1)';
  }

  function revealPanel(index) {
    var panel = panels[index];
    if (!panel) return;

    panel.querySelectorAll('.reveal, .timeline').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  function handleWheel(e) {
    if (isMobile() || prefersReducedMotion) return;

    e.preventDefault();

    if (wheelLocked || isTransitioning) return;

    var delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    wheelAccum += delta;

    if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return;

    var direction = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;

    var next = currentPanel + direction;
    if (next < 0 || next >= panels.length) return;

    wheelLocked = true;
    setTimeout(function () { wheelLocked = false; }, WHEEL_COOLDOWN);

    goToPanel(next);
  }

  function bindNavigation() {
    document.querySelectorAll('a[data-panel], button[data-panel]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var index = parseInt(el.dataset.panel, 10);
        if (isNaN(index)) return;

        e.preventDefault();
        wheelAccum = 0;
        goToPanel(index);

        if (nav.classList.contains('open')) {
          nav.classList.remove('open');
          navToggle.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function bindMobileMenu() {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !navToggle.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initMobileScroll() {
    var scrollTimer;

    function onMobileScroll() {
      if (!isMobile()) return;

      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var closest = 0;
        var closestDist = Infinity;

        panels.forEach(function (panel, i) {
          var rect = panel.getBoundingClientRect();
          var dist = Math.abs(rect.top);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        });

        if (closest !== currentPanel) {
          currentPanel = closest;
          updateUI(closest);
          revealPanel(closest);
        }
      }, 100);
    }

    window.addEventListener('scroll', onMobileScroll, { passive: true });
  }

  function initKeyboardNav() {
    document.addEventListener('keydown', function (e) {
      if (isMobile()) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentPanel < panels.length - 1) goToPanel(currentPanel + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentPanel > 0) goToPanel(currentPanel - 1);
      }
    });
  }

  function initWheel() {
    window.addEventListener('wheel', handleWheel, { passive: false });
  }

  function initReducedMotion() {
    if (!prefersReducedMotion) return;
    document.querySelectorAll('.reveal, .timeline').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  function handleResize() {
    if (isMobile()) {
      trackInner.style.transform = '';
      trackInner.classList.remove('no-transition');
    } else {
      goToPanel(currentPanel, true);
    }
  }

  bindNavigation();
  bindMobileMenu();
  initMobileScroll();
  initKeyboardNav();
  initReducedMotion();

  if (!isMobile() && !prefersReducedMotion) {
    initWheel();
  }

  window.addEventListener('resize', handleResize);

  if (logo) {
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      goToPanel(0);
    });
  }

  goToPanel(0, true);
})();
