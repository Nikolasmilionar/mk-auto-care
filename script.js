(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Price matrix ---------- */
  var PRICES = {
    small:  { exterior: 15, interior: 25, mini: 30, full: 50, premium: 80 },
    medium: { exterior: 20, interior: 30, mini: 35, full: 60, premium: 100 },
    large:  { exterior: 25, interior: 35, mini: 40, full: 70, premium: 120 }
  };

  function renderPrices(size) {
    var data = PRICES[size];
    if (!data) return;
    var values = document.querySelectorAll('.price-value');
    values.forEach(function (el) {
      var service = el.getAttribute('data-service');
      var numEl = el.querySelector('.price-num');
      var next = data[service];
      if (!numEl || next === undefined) return;
      if (numEl.textContent === String(next)) return;

      if (prefersReducedMotion || !numEl.animate) {
        numEl.textContent = next;
        return;
      }

      var out = numEl.animate(
        [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }],
        { duration: 120, easing: 'ease-in' }
      );
      out.onfinish = function () {
        numEl.textContent = next;
        numEl.animate(
          [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 160, easing: 'ease-out' }
        );
      };
    });
  }

  var sizeInputs = document.querySelectorAll('.size-select input[name="vehicle-size"]');
  sizeInputs.forEach(function (input) {
    input.addEventListener('change', function () {
      if (input.checked) {
        renderPrices(input.value);
        updateBookingSummary();
      }
    });
  });

  /* ---------- Booking preview ---------- */
  var SERVICE_NAMES = {
    exterior: 'Exterior Only Valet',
    interior: 'Interior Only Deep Clean',
    mini: 'Mini Valet',
    full: 'Full Valet',
    premium: 'Premium Valet'
  };

  var bookingSummaryEl = document.getElementById('bookingSummary');
  var bookingServiceBtns = document.querySelectorAll('.booking-service');
  var bookingDayBtns = document.querySelectorAll('.booking-pill[data-day]');
  var bookingTimeBtns = document.querySelectorAll('.booking-pill[data-time]');

  function currentSize() {
    var checked = document.querySelector('.size-select input[name="vehicle-size"]:checked');
    return checked ? checked.value : 'medium';
  }

  function selectFromGroup(buttons, clicked) {
    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn === clicked ? 'true' : 'false');
    });
  }

  function updateBookingSummary() {
    if (!bookingSummaryEl) return;
    var activeService = document.querySelector('.booking-service[aria-pressed="true"]');
    var activeDay = document.querySelector('.booking-pill[data-day][aria-pressed="true"]');
    var activeTime = document.querySelector('.booking-pill[data-time][aria-pressed="true"]');
    if (!activeService || !activeDay || !activeTime) return;

    var service = activeService.getAttribute('data-service');
    var price = PRICES[currentSize()][service];
    var name = SERVICE_NAMES[service];
    var day = activeDay.getAttribute('data-day');
    var time = activeTime.getAttribute('data-time');

    bookingSummaryEl.innerHTML = name + ' &middot; ' + day + ' at ' + time + ' &middot; <strong>&pound;' + price + '</strong>';
  }

  bookingServiceBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectFromGroup(bookingServiceBtns, btn);
      updateBookingSummary();
    });
  });
  bookingDayBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectFromGroup(bookingDayBtns, btn);
      updateBookingSummary();
    });
  });
  bookingTimeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectFromGroup(bookingTimeBtns, btn);
      updateBookingSummary();
    });
  });

  /* ---------- Before / after sliders ---------- */
  function initSlider(slider) {
    var dragging = false;

    function setPos(percent) {
      percent = Math.max(0, Math.min(100, percent));
      slider.style.setProperty('--pos', percent + '%');
      slider.setAttribute('aria-valuenow', Math.round(percent));
    }

    function posFromClientX(clientX) {
      var rect = slider.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    slider.addEventListener('pointerdown', function (e) {
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      setPos(posFromClientX(e.clientX));
    });
    slider.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      setPos(posFromClientX(e.clientX));
    });
    slider.addEventListener('pointerup', function () { dragging = false; });
    slider.addEventListener('pointercancel', function () { dragging = false; });

    slider.addEventListener('keydown', function (e) {
      var current = parseFloat(slider.getAttribute('aria-valuenow')) || 50;
      var step = e.shiftKey ? 20 : 5;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        setPos(current - step);
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        setPos(current + step);
        e.preventDefault();
      } else if (e.key === 'Home') {
        setPos(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        setPos(100);
        e.preventDefault();
      }
    });

    setPos(50);
  }

  document.querySelectorAll('.ba-slider').forEach(initSlider);

  /* ---------- Nav: sticky background state ---------- */
  (function () {
    var nav = document.getElementById('siteNav');
    var hero = document.getElementById('top');
    if (!nav || !hero) return;

    if (!('IntersectionObserver' in window)) {
      nav.classList.add('nav--scrolled');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          nav.classList.remove('nav--scrolled');
        } else {
          nav.classList.add('nav--scrolled');
        }
      });
    }, { threshold: 0 });

    observer.observe(hero);
  })();

  /* ---------- Nav: active link on scroll ---------- */
  (function () {
    var navLinks = document.querySelectorAll('.nav-links a');
    if (!navLinks.length || !('IntersectionObserver' in window)) return;

    var sectionIds = ['top', 'prices', 'before-after', 'how', 'coverage', 'booking'];
    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var linkFor = {};
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      linkFor[id] = link;
    });

    function setActive(id) {
      navLinks.forEach(function (link) { link.classList.remove('is-active'); });
      var active = linkFor[id];
      if (active) active.classList.add('is-active');
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, { threshold: 0, rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(function (section) { observer.observe(section); });
  })();

  /* ---------- Fixed contact button vs. booking widget ---------- */
  (function () {
    var fab = document.getElementById('contactFab');
    var confirmBtn = document.querySelector('.booking-confirm');
    if (!fab || !confirmBtn || !('IntersectionObserver' in window)) return;

    var mobileQuery = window.matchMedia('(max-width: 700px)');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (mobileQuery.matches && entry.isIntersecting) {
          fab.classList.add('is-hidden');
        } else {
          fab.classList.remove('is-hidden');
        }
      });
    }, { threshold: 0 });

    observer.observe(confirmBtn);
  })();

  /* ---------- Missing image placeholders ---------- */
  document.querySelectorAll('.media-slot img').forEach(function (img) {
    var slot = img.closest('.media-slot');
    if (!slot) return;
    function markMissing() { slot.classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    } else {
      img.addEventListener('error', markMissing);
    }
  });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal-left, .reveal-up');

  if (!prefersReducedMotion) {
    (function applyStaggers() {
      var groupSelectors = [
        '.price-row.reveal-up',
        '.booking-service.reveal-up',
        '.booking-days .booking-pill.reveal-up',
        '.booking-times .booking-pill.reveal-up',
        '.contact-list li.reveal-up',
        '.size-select label.reveal-up'
      ];
      groupSelectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (el) {
          var parent = el.parentElement;
          if (parent._staggerIndex === undefined) parent._staggerIndex = 0;
          el.style.transitionDelay = Math.min(parent._staggerIndex * 100, 800) + 'ms';
          parent._staggerIndex++;
        });
      });
    })();
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    revealEls.forEach(function (el) { observer.observe(el); });
  }
})();
