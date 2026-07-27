/**
 * Clickie — Formulario de descarga de guías (reemplazo de HubSpot)
 *
 * Dos modos de uso:
 *
 * 1. Formulario inline en la página:
 *    <div data-lead-form data-doc-id="caso-banca"></div>
 *
 * 2. Botón que abre un modal con el formulario:
 *    <button data-caso-modal data-doc-id="caso-banca"
 *            data-doc-name="Caso de Negocio — Banca">Recibir por correo</button>
 *
 * En ambos casos el docId debe existir en el catálogo DOCS del Apps Script.
 */
(function () {
  // URL de la aplicación web de Apps Script (termina en /exec)
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxyC2JN408mB8rUcI3qaeMGaVIUX1z4b8pQyJpJFromfm_GTdodtoW0NfM5SUeFPg/exec';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function formHtml(submitLabel) {
    return '' +
      '<div class="form-group">' +
        '<label class="form-label">Nombre *</label>' +
        '<input class="form-input" type="text" name="nombre" required autocomplete="name" placeholder="Tu nombre">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Correo electrónico *</label>' +
        '<input class="form-input" type="email" name="email" required autocomplete="email" placeholder="tu@empresa.com">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Empresa</label>' +
        '<input class="form-input" type="text" name="empresa" autocomplete="organization" placeholder="Nombre de tu empresa">' +
      '</div>' +
      // Honeypot anti-spam: oculto para humanos, los bots lo llenan
      '<input type="text" name="website" tabindex="-1" autocomplete="off" ' +
        'style="position:absolute;left:-9999px;height:0;overflow:hidden" aria-hidden="true">' +
      '<button type="submit" class="btn btn-primary form-submit">' + submitLabel + '</button>' +
      '<p class="lead-form-error" style="display:none;color:#c0392b;font-size:14px;margin-top:10px"></p>';
  }

  function successHtml(email) {
    return '<div class="form-success show" style="display:block">' +
      '&#9989; ¡Listo! Te enviamos el documento a <strong>' + escapeHtml(email) + '</strong>. ' +
      'Si no lo ves en unos minutos, revisa tu carpeta de spam.' +
    '</div>';
  }

  function bindSubmit(form, docId, onSuccess) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var nombre = form.nombre.value.trim();
      var email = form.email.value.trim();
      var errorEl = form.querySelector('.lead-form-error');
      errorEl.style.display = 'none';

      if (!nombre || !EMAIL_RE.test(email)) {
        errorEl.textContent = 'Por favor completa tu nombre y un correo válido.';
        errorEl.style.display = 'block';
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      var data = new URLSearchParams();
      data.append('nombre', nombre);
      data.append('email', email);
      data.append('empresa', form.empresa.value.trim());
      data.append('website', form.website.value);
      data.append('docId', docId);
      data.append('pagina', window.location.pathname);

      fetch(ENDPOINT, { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.error || 'error');
          onSuccess(email);
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = label;
          errorEl.textContent = 'Hubo un problema al enviar. Inténtalo de nuevo.';
          errorEl.style.display = 'block';
        });
    });
  }

  /* ── Modo 1: formulario inline ─────────────────────────── */

  function buildInlineForm(container) {
    var docId = container.getAttribute('data-doc-id');
    if (!docId) return;

    container.innerHTML = '<form class="lead-form" novalidate>' + formHtml('Recibir por correo') + '</form>';
    bindSubmit(container.querySelector('form'), docId, function (email) {
      container.innerHTML = successHtml(email);
    });
  }

  /* ── Modo 2: modal ─────────────────────────────────────── */

  var modal = null;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'casoLeadModal';
    modal.innerHTML =
      '<div class="modal-content">' +
        '<button class="modal-close" type="button" aria-label="Cerrar">&#10005;</button>' +
        '<div class="caso-modal-body">' +
          '<h3 class="modal-title">Recibe el caso de negocio</h3>' +
          '<p class="modal-subtitle" data-role="doc-name"></p>' +
          '<form class="modal-form" novalidate>' + formHtml('Recibir por correo →') + '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    return modal;
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  window.openCasoLeadModal = function (docId, docName) {
    var m = ensureModal();
    var body = m.querySelector('.caso-modal-body');

    // Reconstruye el formulario limpio en cada apertura
    body.innerHTML =
      '<h3 class="modal-title">Recibe el caso de negocio</h3>' +
      '<p class="modal-subtitle">' + escapeHtml(docName) + ' — te lo enviamos en PDF a tu correo.</p>' +
      '<form class="modal-form" novalidate>' + formHtml('Recibir por correo →') + '</form>';

    bindSubmit(body.querySelector('form'), docId, function (email) {
      body.innerHTML =
        '<h3 class="modal-title">&#127881; ¡Enviado!</h3>' +
        '<p class="modal-subtitle">' + successHtml(email).replace(/^<div[^>]*>|<\/div>$/g, '') + '</p>';
      setTimeout(closeModal, 5000);
    });

    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    var first = body.querySelector('input[name="nombre"]');
    if (first) setTimeout(function () { first.focus(); }, 150);
  };

  /* ── Auto-init ─────────────────────────────────────────── */

  function init() {
    document.querySelectorAll('[data-lead-form]').forEach(buildInlineForm);
    document.querySelectorAll('[data-caso-modal]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        window.openCasoLeadModal(
          btn.getAttribute('data-doc-id'),
          btn.getAttribute('data-doc-name') || 'Caso de negocio'
        );
      });
    });
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
