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
    [].concat(els).forEach(function (el) { el.classList.add('motion-done'); });
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
  // Wymiary Lenisa aktualne po każdym przeliczeniu (pin, obrazy, fonty)
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

  /* ---------- 1. Hero ---------- */
  var hero = $('#hero');
  if (hero) {
    var heroCopy = claim($('.hero-copy', hero));
    var heroVisual = claim($('.hero-visual', hero));
    var heroProofs = claim($('.hero-proofs', hero));
    var h1 = $('h1', heroCopy);
    var h1Html = h1.innerHTML;

    // H1 na linie wizualne, każda w masce
    (function splitLines() {
      var words = [];
      Array.prototype.slice.call(h1.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) { words.push({ text: w, cls: '' }); });
        } else if (node.nodeType === 1 && node.tagName !== 'BR') {
          node.textContent.split(/\s+/).filter(Boolean).forEach(function (w) { words.push({ text: w, cls: node.className }); });
        } else if (node.tagName === 'BR') {
          words.push({ br: true });
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
    var infoCard = $('.hero-info-card', heroVisual);
    var machineImg = $('.hero-machine img', heroVisual);

    gsap.set([$('.eyebrow', heroCopy), $('.hero-lead', heroCopy), $('.hero-actions', heroCopy), infoCard], { opacity: 0, y: 24 });
    gsap.set(h1Lines, { yPercent: 105 });
    gsap.set(machineImg, { opacity: 0, y: 32 });
    gsap.set($$('.hero-info-card li', heroVisual).concat($$('li', heroProofs)), { opacity: 0, y: 16 });

    gsap.timeline({ defaults: { ease: EASE }, delay: 0.05 })
      .to($('.eyebrow', heroCopy), { opacity: 1, y: 0, duration: 0.5 }, 0)
      .to(h1Lines, { yPercent: 0, duration: 0.75, stagger: 0.1 }, 0.08)
      .to(machineImg, { opacity: 1, y: 0, duration: 0.9 }, 0.2)
      .to($('.hero-lead', heroCopy), { opacity: 1, y: 0, duration: 0.6 }, 0.35)
      .to($('.hero-actions', heroCopy), { opacity: 1, y: 0, duration: 0.6 }, 0.45)
      .to(infoCard, { opacity: 1, y: 0, duration: 0.6 }, 0.45)
      .to($$('.hero-info-card li', heroVisual), { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 }, 0.55)
      .to($$('li', heroProofs), { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 }, 0.6)
      .eventCallback('onComplete', function () {
        // Linie wracają do zwykłego H1 (poprawne łamanie przy zmianie szerokości)
        h1.innerHTML = h1Html;
      });

    // Trzy warstwy w różnym tempie
    var heroScrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to($('.hero-bg__img', hero), { yPercent: 35, ease: 'none', scrollTrigger: heroScrub });
    gsap.to($('.hero-bg', hero), {
      '--layer-y': function () { return hero.offsetHeight * 0.18 + 'px'; },
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
    gsap.to($('.hero-machine', heroVisual), { y: -40, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo(heroCopy, { opacity: 1 }, {
      opacity: 0.25,
      ease: 'none',
      immediateRender: false,
      scrollTrigger: { trigger: hero, start: 'top+=15% top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- 2. Jak to działa ---------- */
  var how = $('#jak-to-dziala');
  if (how) {
    var howGrid = $('.how-grid', how);
    var howVisual = claim($('.how-visual', how));
    var steps = $$('.process-step', how);
    var dots = $$('.process-track__dot', how);
    var lines = $$('.process-track__line', how);
    var markers = $$('.process-marker', how);
    var details = $('.process-details', how);
    var detailItems = $$('li', details);
    var summary = $('summary', details);

    var mmHow = gsap.matchMedia();

    // Wejście (desktop i mobile): etapy, schemat, szczegóły
    mmHow.add('all', function () {
      var track = $('.process-track', how);
      var image = $('.process-diagram__image', how);
      gsap.set(steps, { opacity: 0, y: 20 });
      gsap.set(track, { opacity: 0 });
      gsap.set([image, details], { opacity: 0, y: 28 });
      onceInView(howVisual, 'top 85%', function () {
        gsap.timeline({ defaults: { ease: EASE } })
          .to(steps, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, clearProps: 'opacity,transform' }, 0)
          .to(track, { opacity: 1, duration: 0.6, clearProps: 'opacity' }, 0.2)
          .to(image, { opacity: 1, y: 0, duration: 0.9, clearProps: 'opacity,transform' }, 0.25)
          .to(details, { opacity: 1, y: 0, duration: 0.6, clearProps: 'opacity,transform' }, 0.45);
      });
    });

    mmHow.add('(min-width: 1024px) and (min-height: 720px)', function () {
      var wasOpen = details.open;
      details.open = true;
      how.classList.add('how-pinned');

      if (howGrid.offsetHeight > window.innerHeight - headerOffset() - 16) {
        details.open = wasOpen;
        how.classList.remove('how-pinned');
        return;
      }

      var blockToggle = function (e) { e.preventDefault(); };
      summary.addEventListener('click', blockToggle);

      var active = -1;
      function setActive(i) {
        active = i;
        steps.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
        markers.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
        detailItems.forEach(function (el, j) { el.classList.toggle('is-active', j === i); });
        dots.forEach(function (el, j) { el.classList.toggle('is-reached', j <= i); });
      }
      function update(p) {
        var n = steps.length;
        var i = Math.min(n - 1, Math.floor(p * n));
        // Linia do następnego etapu wypełnia się w ostatnich 30% bieżącego etapu
        lines.forEach(function (line, j) {
          var fill = Math.max(0, Math.min(1, (p * n - j - 0.7) / 0.3));
          line.style.setProperty('--fill', fill.toFixed(3));
        });
        if (i !== active) setActive(i);
      }
      update(0);

      var st = ScrollTrigger.create({
        trigger: howGrid,
        start: function () { return 'center center+=' + headerOffset() / 2; },
        end: function () { return '+=' + window.innerHeight * 4.5; },
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { update(self.progress); }
      });

      var onStepClick = function (event) {
        var k = steps.indexOf(event.currentTarget);
        lenis.scrollTo(st.start + (st.end - st.start) * (k + 0.5) / steps.length);
      };
      steps.forEach(function (el) { el.addEventListener('click', onStepClick); });

      return function () {
        steps.forEach(function (el) {
          el.removeEventListener('click', onStepClick);
          el.classList.remove('is-active');
        });
        summary.removeEventListener('click', blockToggle);
        markers.concat(detailItems).forEach(function (el) { el.classList.remove('is-active'); });
        dots.forEach(function (el) { el.classList.remove('is-reached'); });
        lines.forEach(function (el) { el.style.removeProperty('--fill'); });
        how.classList.remove('how-pinned');
        details.open = wasOpen;
      };
    });
  }

  /* ---------- 3. Rodzaje wag ---------- */
  var typeCards = $$('.type-card').map(claim);
  if (typeCards.length) {
    typeCards.forEach(function (card) {
      gsap.set(card, { opacity: 0, y: 32 });
      gsap.set($('.type-card__media', card), { clipPath: CLIP_HIDDEN });
      gsap.set($('.type-card__body', card), { opacity: 0, y: 16 });
    });
    ScrollTrigger.batch(typeCards, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        var tl = gsap.timeline({ defaults: { ease: EASE } });
        var parts = [];
        batch.forEach(function (card, i) {
          var media = $('.type-card__media', card);
          var body = $('.type-card__body', card);
          parts.push(media, body);
          tl.to(card, { opacity: 1, y: 0, duration: 0.7 }, i * 0.1)
            .to(media, { clipPath: CLIP_SHOWN, duration: 0.9 }, i * 0.1)
            .to(body, { opacity: 1, y: 0, duration: 0.6 }, i * 0.1 + 0.15);
        });
        tl.eventCallback('onComplete', function () { done(batch.concat(parts)); });
      }
    });
  }

  var compare = claim($('.compare-block'));
  if (compare) {
    var compareHead = [$('h3', compare), $('.section-text', compare)];
    var compareRows = $$('tr', compare);
    gsap.set(compareHead, { opacity: 0, y: 24 });
    gsap.set($('.table-wrap', compare), { opacity: 0 });
    gsap.set(compareRows, { opacity: 0, y: 16 });
    onceInView(compare, 'top 85%', function () {
      gsap.timeline({ defaults: { ease: EASE } })
        .to(compareHead, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 0)
        .to($('.table-wrap', compare), { opacity: 1, duration: 0.6 }, 0.15)
        .to(compareRows, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.25);
    });
  }

  /* ---------- 4. Zastosowania ---------- */
  var appCards = $$('.app-card').map(claim);
  if (appCards.length) {
    appCards.forEach(function (card) {
      gsap.set(card, { opacity: 0, y: 32, clipPath: 'inset(100% 0% 0% 0% round 14px)' });
      gsap.set($('figcaption', card), { opacity: 0 });
    });
    ScrollTrigger.batch(appCards, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        var tl = gsap.timeline({ defaults: { ease: EASE } });
        var captions = batch.map(function (card) { return $('figcaption', card); });
        tl.to(batch, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 0.9, stagger: 0.08 }, 0)
          .to(captions, { opacity: 1, duration: 0.5, stagger: 0.08 }, 0.3);
        tl.eventCallback('onComplete', function () { done(batch.concat(captions)); });
      }
    });

    // Paralaksa zdjęć w ramkach (desktop)
    gsap.matchMedia().add('(min-width: 1024px)', function () {
      appCards.forEach(function (card) {
        var img = $('img', card);
        gsap.set(img, { scale: 1.15 });
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    });
  }

  /* ---------- 5. Korzyści ---------- */
  var benefits = $('#korzysci');
  if (benefits) {
    benefits.classList.add('is-parallax');
    gsap.fromTo($('.section-benefits__bg img', benefits), { yPercent: -16.67 }, {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: benefits, start: 'top bottom', end: 'bottom top', scrub: true }
    });

    var benefitCards = $$('.benefit-card', benefits).map(claim);
    gsap.set(benefitCards, { opacity: 0, y: 32 });
    ScrollTrigger.batch(benefitCards, {
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

  /* ---------- 6. Legalizacja i kalibracja ---------- */
  var serviceWrap = claim($('.service-cards'));
  var serviceCards = $$('.service-card').map(claim);
  if (serviceCards.length) {
    serviceCards.forEach(function (card) {
      gsap.set(card, { opacity: 0, y: 24 });
      gsap.set($('.service-card__media', card), { clipPath: CLIP_HIDDEN });
      gsap.set($('.service-card__body', card), { opacity: 0, y: 12 });
    });
    ScrollTrigger.batch(serviceCards, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        var tl = gsap.timeline({ defaults: { ease: EASE } });
        var parts = [];
        batch.forEach(function (card, i) {
          var media = $('.service-card__media', card);
          var body = $('.service-card__body', card);
          parts.push(media, body);
          tl.to(card, { opacity: 1, y: 0, duration: 0.7 }, i * 0.1)
            .to(media, { clipPath: CLIP_SHOWN, duration: 0.9 }, i * 0.1)
            .to(body, { opacity: 1, y: 0, duration: 0.6 }, i * 0.1 + 0.15);
        });
        tl.eventCallback('onComplete', function () { done(batch.concat(parts, serviceWrap ? [serviceWrap] : [])); });
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
