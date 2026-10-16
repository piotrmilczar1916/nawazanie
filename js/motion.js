/* ==========================================================================
   nawazanie.pl — ruch sterowany scrollem (Lenis + GSAP ScrollTrigger)
   Ładowany przed script.js. Elementy przejęte przez ten plik dostają
   [data-motion], dzięki czemu script.js pomija je w swoim reveal.
   ========================================================================== */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap || !window.ScrollTrigger || !window.Lenis) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Odpowiednik --ease: cubic-bezier(.16, 1, .3, 1)
  var EASE = 'expo.out';
  var CLIP_HIDDEN = 'inset(100% 0% 0% 0%)';
  var CLIP_SHOWN = 'inset(0% 0% 0% 0%)';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Przejęcie elementu: zdejmuje reveal z CSS/script.js */
  function claim(el) {
    if (!el) return el;
    el.setAttribute('data-motion', '');
    el.classList.remove('reveal', 'is-visible');
    return el;
  }

  /* Po wejściu: przywraca hover (transform/transition z CSS) */
  function done(els) {
    gsap.set(els, { clearProps: 'transform,opacity,clipPath' });
    els.forEach(function (el) { el.classList.add('motion-done'); });
  }

  /* Jednorazowe wejście w widok */
  function onceInView(trigger, start, play) {
    ScrollTrigger.create({ trigger: trigger, start: start, once: true, onEnter: play });
  }

  /* Pozycja w dokumencie bez transformacji (reveal przesuwa elementy o 24px) */
  function pageTop(el) {
    var top = 0;
    while (el) {
      top += el.offsetTop;
      el = el.offsetParent;
    }
    return top;
  }

  function headerOffset() {
    var inner = $('.header-inner');
    return inner ? inner.offsetHeight : 80;
  }

  /* ---------- Lenis ---------- */
  var lenis = new window.Lenis({
    duration: 1.1,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
  });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  // Wymiary Lenisa aktualne po każdym przeliczeniu (obrazy, fonty)
  ScrollTrigger.addEventListener('refresh', function () { lenis.resize(); });

  /* Kotwice przez Lenis z offsetem pod nagłówek */
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    var link = event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('skip-link')) return;
    var id = link.getAttribute('href').slice(1);
    var target = id && document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    lenis.start();
    lenis.resize();
    lenis.scrollTo(pageTop(target) - headerOffset());
    if (history.pushState) history.pushState(null, '', '#' + id);
  });

  /* Menu mobilne zatrzymuje Lenisa */
  var navToggle = $('.nav-toggle');
  if (navToggle && window.MutationObserver) {
    new MutationObserver(function () {
      if (navToggle.getAttribute('aria-expanded') === 'true') lenis.stop();
      else lenis.start();
    }).observe(navToggle, { attributes: true, attributeFilter: ['aria-expanded'] });
  }

  /* ---------- Hero ---------- */
  var hero = $('#hero');
  if (hero) {
    var heroCopy = claim($('.hero-copy', hero));
    var heroVisual = claim($('.hero-visual', hero));
    var heroFacts = claim($('.hero-facts', hero));
    var h1 = $('h1', heroCopy);
    var h1Html = h1.innerHTML;

    // H1 na linie wizualne, każda w masce
    (function splitLines() {
      var words = [];
      Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) { words.push({ text: w, cls: '' }); });
        } else if (node.nodeType === 1 && node.tagName === 'BR') {
          words.push({ br: true });
        } else if (node.nodeType === 1) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) { words.push({ text: w, cls: node.className }); });
        }
      });
      h1.innerHTML = '';
      var spans = [];
      words.forEach(function (w) {
        if (w.br) { h1.appendChild(document.createElement('br')); return; }
        var s = document.createElement('span');
        s.textContent = w.text;
        if (w.cls) s.className = w.cls;
        h1.appendChild(s);
        h1.appendChild(document.createTextNode(' '));
        spans.push(s);
      });
      var lines = [];
      var lastTop = null;
      spans.forEach(function (s) {
        if (s.offsetTop !== lastTop) { lines.push([]); lastTop = s.offsetTop; }
        lines[lines.length - 1].push(s);
      });
      h1.innerHTML = '';
      lines.forEach(function (line) {
        var mask = document.createElement('span');
        var inner = document.createElement('span');
        mask.className = 'h1-line';
        line.forEach(function (s, i) {
          if (i) inner.appendChild(document.createTextNode(' '));
          inner.appendChild(s);
        });
        mask.appendChild(inner);
        h1.appendChild(mask);
      });
    })();

    var h1Lines = $$('.h1-line > span', h1);
    var machine = $('.hero-machine', heroVisual);
    var tag = $('.hero-tag', heroVisual);
    var factItems = $$('li', heroFacts);

    gsap.set([$('.hero-lead', heroCopy), $('.hero-actions', heroCopy)], { opacity: 0, y: 24 });
    gsap.set(h1Lines, { yPercent: 105 });
    gsap.set(heroVisual, { opacity: 0 });
    gsap.set(machine, { y: 36 });
    gsap.set(tag, { opacity: 0, y: 16 });
    gsap.set(factItems, { opacity: 0, y: 16 });

    gsap.timeline({ defaults: { ease: EASE }, delay: 0.05 })
      .to(h1Lines, { yPercent: 0, duration: 0.75, stagger: 0.1 }, 0)
      .to(heroVisual, { opacity: 1, duration: 0.8 }, 0.15)
      .to(machine, { y: 0, duration: 1 }, 0.15)
      .to($('.hero-lead', heroCopy), { opacity: 1, y: 0, duration: 0.6 }, 0.35)
      .to($('.hero-actions', heroCopy), { opacity: 1, y: 0, duration: 0.6 }, 0.45)
      .to(tag, { opacity: 1, y: 0, duration: 0.5, clearProps: 'transform' }, 0.6)
      .to(factItems, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 }, 0.6)
      .eventCallback('onComplete', function () {
        // Wracamy do zwykłego H1 (poprawne łamanie przy zmianie szerokości)
        h1.innerHTML = h1Html;
      });

    // Głębia: tło najwolniej, linie szybciej, urządzenie lekko w górę
    var heroScrub = function () {
      return { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    };
    gsap.to($('.hero-bg__img', hero), { yPercent: 25, ease: 'none', scrollTrigger: heroScrub() });
    gsap.to($('.hero-bg', hero), {
      '--layer-y': function () { return hero.offsetHeight * 0.15 + 'px'; },
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
    gsap.to(machine.querySelector('img'), { y: -40, ease: 'none', scrollTrigger: heroScrub() });
  }

  /* ---------- Modele ---------- */
  $$('.model').forEach(function (model) {
    claim(model);
    var media = $('.model__media', model);
    var bodyParts = $$('.model__body > *', model);
    gsap.set(media, { clipPath: CLIP_HIDDEN });
    gsap.set(bodyParts, { opacity: 0, y: 24 });
    onceInView(model, 'top 80%', function () {
      gsap.timeline({ defaults: { ease: EASE } })
        .to(media, { clipPath: CLIP_SHOWN, duration: 1 }, 0)
        .to(bodyParts, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, clearProps: 'opacity,transform' }, 0.15)
        .eventCallback('onComplete', function () { done([media, model]); });
    });

    // Lekka paralaksa zdjęcia w ramce (desktop)
    gsap.matchMedia().add('(min-width: 1024px)', function () {
      gsap.fromTo($('img', media), { y: 30 }, {
        y: -30,
        ease: 'none',
        scrollTrigger: { trigger: model, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  });

  /* ---------- Jak działa: etapy po kolei, linia łączy etapy ---------- */
  var stepsList = $('.steps');
  if (stepsList) {
    var steps = $$('.step', stepsList).map(claim);
    gsap.set(steps, { opacity: 0, y: 28 });
    stepsList.style.setProperty('--steps-line', '0');
    onceInView(stepsList, 'top 80%', function () {
      gsap.timeline({ defaults: { ease: EASE } })
        .to(steps, { opacity: 1, y: 0, duration: 0.7, stagger: 0.14 }, 0)
        .to(stepsList, { '--steps-line': 1, duration: 1.1, ease: 'power2.inOut' }, 0.1)
        .eventCallback('onComplete', function () { done(steps); });
    });
  }

  /* ---------- Zastosowania ---------- */
  var appCards = $$('.app-card').map(claim);
  if (appCards.length) {
    gsap.set(appCards, { opacity: 0, y: 28, clipPath: 'inset(100% 0% 0% 0% round 14px)' });
    ScrollTrigger.batch(appCards, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 14px)',
          duration: 0.9, stagger: 0.07, ease: EASE,
          onComplete: function () { done(batch); }
        });
      }
    });

    // Paralaksa zdjęć w ramkach (desktop)
    gsap.matchMedia().add('(min-width: 1024px)', function () {
      $$('.app-card__media img').forEach(function (img) {
        gsap.set(img, { scale: 1.12 });
        gsap.fromTo(img, { yPercent: -5 }, {
          yPercent: 5,
          ease: 'none',
          scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    });
  }

  /* ---------- Korzyści ---------- */
  var benefits = $('#korzysci');
  if (benefits) {
    benefits.classList.add('is-parallax');
    gsap.fromTo($('.section-benefits__bg img', benefits), { yPercent: -16.67 }, {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: benefits, start: 'top bottom', end: 'bottom top', scrub: true }
    });

    var benefitItems = $$('.benefit', benefits).map(claim);
    gsap.set(benefitItems, { opacity: 0, y: 24 });
    ScrollTrigger.batch(benefitItems, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: EASE,
          onComplete: function () { done(batch); }
        });
      }
    });
  }

  /* ---------- Odświeżenie po załadowaniu obrazów i fontów ---------- */
  var refreshTimer;
  function queueRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 150);
  }
  $$('img').forEach(function (img) {
    if (!img.complete) img.addEventListener('load', queueRefresh, { once: true });
  });
  window.addEventListener('load', queueRefresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
})();
