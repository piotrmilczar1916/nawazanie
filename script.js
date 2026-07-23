(function () {
  'use strict';

  var header = document.getElementById('site-header');
  var navToggle = document.querySelector('.nav-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  var navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  var sections = document.querySelectorAll('main section[id]:not(#hero)');
  var hero = document.getElementById('hero');
  var yearEl = document.getElementById('year');
  var scrollProgress = document.getElementById('scroll-progress');
  var toTop = document.getElementById('to-top');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* Mobile menu */
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.querySelectorAll('.mobile-nav-link, .nav-cta--mobile').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Header scroll + progress bar + to-top */
  function onScroll() {
    var scrollY = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (header) {
      header.classList.toggle('header-scrolled', scrollY > 8);
      header.classList.toggle('header-compact', scrollY > 120);
    }

    if (scrollProgress && docHeight > 0) {
      scrollProgress.style.width = (scrollY / docHeight * 100) + '%';
    }

    if (toTop) {
      toTop.classList.toggle('is-visible', scrollY > 400);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* Active nav link on scroll */
  if (navLinks.length) {
    var observerOptions = {
      rootMargin: '-40% 0px -55% 0px',
      threshold: 0
    };

    function setActiveSection(id) {
      navLinks.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', isActive);
      });
    }

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute('id'));
          }
        });
      },
      observerOptions
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });

    if (hero) {
      var heroObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveSection('jak-to-dziala');
            }
          });
        },
        observerOptions
      );

      heroObserver.observe(hero);
    }
  }

  /* Reveal on scroll */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    document.querySelectorAll('.type-card, .feature-cards li, .info-card, .benefit-item, .faq-item').forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 5) * 70 + 'ms';
      revealObserver.observe(el);
    });
  }

  /* Accordions (benefits + FAQ) */
  document.querySelectorAll('[data-accordion]').forEach(function (accordion) {
    var items = Array.prototype.slice.call(
      accordion.querySelectorAll('.benefit-item, .faq-item')
    );

    function setItemOpen(item, open) {
      var trigger = item.querySelector('button[aria-expanded]');
      var panel = item.querySelector('[role="region"]');
      if (!trigger || !panel) return;

      item.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');

      if (open) {
        panel.hidden = false;
      } else {
        var onEnd = function (event) {
          if (event.propertyName !== 'grid-template-rows') return;
          panel.removeEventListener('transitionend', onEnd);
          if (!item.classList.contains('is-open')) {
            panel.hidden = true;
          }
        };
        panel.addEventListener('transitionend', onEnd);
      }
    }

    items.forEach(function (item) {
      var trigger = item.querySelector('button[aria-expanded]');
      if (!trigger) return;

      trigger.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          setItemOpen(other, other === item ? willOpen : false);
        });
      });
    });
  });

  /* Line flow — etapy (desktop tabs + mobile accordion) */
  var lineTabs = document.querySelectorAll('.line-step-btn[data-line-step]');
  var lineContents = document.querySelectorAll('.line-panel-content[data-line-content]');

  function activateLineStep(idx) {
    lineTabs.forEach(function (tab) {
      var on = parseInt(tab.getAttribute('data-line-step'), 10) === idx;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    lineContents.forEach(function (panel) {
      var on = parseInt(panel.getAttribute('data-line-content'), 10) === idx;
      panel.classList.toggle('is-hidden', !on);
    });
    var activeTab = document.getElementById('line-tab-' + idx);
    var linePanel = document.getElementById('line-panel');
    if (activeTab && linePanel) {
      linePanel.setAttribute('aria-labelledby', activeTab.id);
    }
  }

  lineTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateLineStep(parseInt(tab.getAttribute('data-line-step'), 10));
    });
  });

  function toggleLineAccordion(btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var open = btn.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.line-accordion-trigger').forEach(function (other) {
      other.setAttribute('aria-expanded', 'false');
      var otherPanel = document.getElementById(other.getAttribute('aria-controls'));
      if (otherPanel) {
        otherPanel.classList.remove('is-open');
        otherPanel.hidden = true;
      }
    });

    if (!open && panel) {
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      panel.hidden = false;
    }
  }

  document.querySelectorAll('.line-accordion-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      toggleLineAccordion(btn);
    });
  });

  /* Hero weigh animation meter labels */
  var weighResult = document.querySelector('.weigh-anim__result');
  var weighStatus = document.querySelector('.weigh-anim__status');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (weighResult && weighStatus) {
    var weighSteps = [
      { at: 0, result: '0 g', status: 'Napełnianie głowic…' },
      { at: 2200, result: '68 g', status: 'Analiza kombinacji…' },
      { at: 3400, result: '99,8 g', status: 'Wybrano najlepszą porcję' },
      { at: 4200, result: '100 g', status: 'Zsyp do opakowania' },
      { at: 5200, result: '100 g', status: 'Gotowe — cykl OK' }
    ];
    var weighTimerIds = [];

    function clearWeighTimers() {
      weighTimerIds.forEach(function (id) {
        clearTimeout(id);
      });
      weighTimerIds = [];
    }

    function applyWeighStep(step) {
      weighResult.textContent = step.result;
      weighStatus.textContent = step.status;
    }

    function runWeighCycle() {
      clearWeighTimers();
      weighSteps.forEach(function (step) {
        weighTimerIds.push(setTimeout(function () {
          applyWeighStep(step);
        }, step.at));
      });
    }

    if (reduceMotion) {
      applyWeighStep(weighSteps[weighSteps.length - 1]);
    } else {
      runWeighCycle();
      setInterval(runWeighCycle, 6000);
    }
  }
})();
