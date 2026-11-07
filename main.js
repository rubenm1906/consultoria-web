/* Talyx — comportamiento del sitio (se carga con defer) */
(function () {
  'use strict';

  var CALENDLY_URL = 'https://calendly.com/rubenmarin19/consultoria-estragetica';
  var FORM_ENDPOINT = 'https://formspree.io/f/xblownlg';

  document.documentElement.classList.add('js');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Navbar: sombra al hacer scroll + menú móvil ---- */
  var navbar = $('.navbar');
  var toTop = $('.to-top');
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (navbar) navbar.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('.nav-toggle');
  var links = $('.nav-links');
  function setMenu(open) {
    if (!toggle || !links) return;
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (navbar && open) navbar.classList.add('scrolled');
    else onScroll();
  }
  if (toggle) toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---- Animaciones de entrada ---- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Calendly: se carga solo cuando se necesita ---- */
  var calendlyPromise = null;
  function loadCalendly() {
    if (calendlyPromise) return calendlyPromise;
    calendlyPromise = new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(css);
      var s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { calendlyPromise = null; reject(new Error('calendly')); };
      document.head.appendChild(s);
    });
    return calendlyPromise;
  }
  function openCalendly() {
    loadCalendly().then(function () {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    }).catch(function () {
      window.open(CALENDLY_URL, '_blank', 'noopener');
    });
  }
  $$('[data-open-calendly]').forEach(function (b) {
    b.addEventListener('click', openCalendly);
    // precarga al acercarse con el ratón o el dedo
    ['pointerenter', 'touchstart', 'focus'].forEach(function (ev) { b.addEventListener(ev, loadCalendly, { once: true, passive: true }); });
  });

  /* ---- Modal de contacto ---- */
  var dialog = $('#contactDialog');
  var form = $('#contactForm');
  var successView = $('#formSuccess');
  var formView = $('#formView');

  function openDialog() {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  }
  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  }
  $$('[data-open-form]').forEach(function (b) { b.addEventListener('click', openDialog); });
  $$('[data-close-dialog]').forEach(function (b) { b.addEventListener('click', closeDialog); });
  if (dialog) {
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeDialog(); });
    dialog.addEventListener('close', function () {
      // al cerrar el diálogo tras un envío correcto, restaura el formulario
      if (successView && !successView.hidden) {
        successView.hidden = true;
        if (formView) formView.hidden = false;
      }
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = $('button[type="submit"]', form);
      var errBox = $('.form-error', form);
      var label = btn.textContent;
      var data = new FormData(form);
      var name = String(data.get('name') || '').trim().split(/\s+/)[0] || '';

      if (errBox) errBox.hidden = true;
      btn.disabled = true;
      btn.textContent = form.dataset.sending || '…';

      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          $('#thankYouTitle').textContent = (form.dataset.thanks || '').replace('{name}', name);
          formView.hidden = true;
          successView.hidden = false;
          form.reset();
        })
        .catch(function () {
          if (errBox) { errBox.textContent = form.dataset.error || 'Error'; errBox.hidden = false; }
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  var bookBtn = $('#bookFromSuccess');
  if (bookBtn) bookBtn.addEventListener('click', function () { closeDialog(); openCalendly(); });
})();
