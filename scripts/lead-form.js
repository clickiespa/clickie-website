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

  // Dominios de correo personales/genéricos: se exige correo de empresa
  var FREE_MAIL = ['gmail', 'googlemail', 'hotmail', 'outlook', 'live', 'msn', 'yahoo',
    'ymail', 'icloud', 'me', 'mac', 'aol', 'protonmail', 'proton', 'gmx', 'zoho',
    'yandex', 'mail', 'email', 'terra', 'latinmail', 'inbox', 'rocketmail'];

  function isFreeMail(email) {
    var dominio = (email.split('@')[1] || '').toLowerCase();
    return FREE_MAIL.indexOf(dominio.split('.')[0]) !== -1;
  }

  function getAnalytics() {
    return window.clickieAnalytics || null;
  }

  function trackFormView(docId, docName, formType, onceKey) {
    var analytics = getAnalytics();

    if (!analytics) return;

    analytics.trackOnce(onceKey, function () {
      analytics.trackFormView({
        form_id: docId,
        form_type: formType,
        content_type: 'caso_de_negocio',
        document_name: docName || docId,
        delivery_method: 'email'
      });
    });
  }

  function bindTrackedFormStart(form, docId, docName, formType, onceKey) {
    var analytics = getAnalytics();

    if (!analytics) return;

    analytics.bindFormStart(form, {
      once_key: onceKey,
      form_id: docId,
      form_type: formType,
      content_type: 'caso_de_negocio',
      document_name: docName || docId,
      delivery_method: 'email'
    });
  }

  function trackLeadSuccess(docId, docName, formType) {
    var analytics = getAnalytics();

    if (!analytics) return;

    analytics.trackLead({
      form_id: docId,
      form_type: formType,
      lead_source: 'website',
      content_type: 'caso_de_negocio',
      document_name: docName || docId,
      delivery_method: 'email'
    });

    analytics.trackDownload({
      form_id: docId,
      form_type: formType,
      content_type: 'caso_de_negocio',
      document_name: docName || docId,
      file_extension: 'pdf',
      delivery_method: 'email'
    });
  }

  function formHtml(submitLabel) {
    return '' +
      '<div class="form-grid form-grid--lead">' +
      '<div class="form-group">' +
        '<label class="form-label">Nombre *</label>' +
        '<input class="form-input" type="text" name="nombre" required autocomplete="given-name" placeholder="Tu nombre">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Apellido *</label>' +
        '<input class="form-input" type="text" name="apellido" required autocomplete="family-name" placeholder="Tu apellido">' +
      '</div>' +
      '<div class="form-group full-width">' +
        '<label class="form-label">Correo de empresa *</label>' +
        '<input class="form-input" type="email" name="email" required autocomplete="email" placeholder="tu@empresa.com">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Número de teléfono</label>' +
        '<input class="form-input" type="tel" name="telefono" autocomplete="tel" placeholder="+56 9 1234 5678">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Cargo</label>' +
        '<input class="form-input" type="text" name="cargo" autocomplete="organization-title" placeholder="Tu cargo">' +
      '</div>' +
      '<div class="form-group full-width">' +
        '<label class="form-label">Nombre de empresa *</label>' +
        '<input class="form-input" type="text" name="empresa" required autocomplete="organization" placeholder="Nombre de tu empresa">' +
      '</div>' +
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

  function bindSubmit(form, docId, docName, formType, onSuccess) {
    bindTrackedFormStart(
      form,
      docId,
      docName,
      formType,
      'form-start:' + formType + ':' + window.location.pathname + ':' + docId
    );

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var nombre = form.nombre.value.trim();
      var apellido = form.apellido.value.trim();
      var email = form.email.value.trim();
      var empresa = form.empresa.value.trim();
      var errorEl = form.querySelector('.lead-form-error');
      errorEl.style.display = 'none';

      if (!nombre || !apellido || !empresa || !EMAIL_RE.test(email)) {
        errorEl.textContent = 'Por favor completa los campos obligatorios (*) con datos válidos.';
        errorEl.style.display = 'block';
        return;
      }
      if (isFreeMail(email)) {
        errorEl.textContent = 'Por favor usa tu correo de empresa (no correos personales como Gmail, Hotmail o Yahoo).';
        errorEl.style.display = 'block';
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      var data = new URLSearchParams();
      data.append('nombre', nombre);
      data.append('apellido', apellido);
      data.append('email', email);
      data.append('telefono', form.telefono.value.trim());
      data.append('empresa', empresa);
      data.append('cargo', form.cargo.value.trim());
      data.append('website', form.website.value);
      data.append('docId', docId);
      data.append('pagina', window.location.pathname);

      fetch(ENDPOINT, { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.error || 'error');
          trackLeadSuccess(docId, docName, formType);
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
    trackFormView(docId, docId, 'inline_lead_form', 'form-view:inline:' + window.location.pathname + ':' + docId);
    bindSubmit(container.querySelector('form'), docId, docId, 'inline_lead_form', function (email) {
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

    trackFormView(docId, docName, 'caso_modal', 'form-view:modal:' + window.location.pathname + ':' + docId);
    bindSubmit(body.querySelector('form'), docId, docName, 'caso_modal', function (email) {
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

  /* ── Modo 3: formulario de contacto (sin documento) ─────── */

  var INDUSTRIAS = ['Supermercados', 'Farmacias', 'Banca', 'Tiendas de Conveniencia',
    'Cadenas de Comida', 'Cafeterías', 'Tiendas por Departamento',
    'Sucursales de Atención a Público', 'Industria / Manufactura', 'Otro'];

  function contactFormHtml() {
    return '' +
      '<div class="form-grid form-grid--lead">' +
      '<div class="form-group">' +
        '<label class="form-label">Nombre *</label>' +
        '<input class="form-input" type="text" name="nombre" required autocomplete="given-name" placeholder="Tu nombre">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Apellido *</label>' +
        '<input class="form-input" type="text" name="apellido" required autocomplete="family-name" placeholder="Tu apellido">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Correo *</label>' +
        '<input class="form-input" type="email" name="email" required autocomplete="email" placeholder="tu@empresa.com">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label">Número de teléfono</label>' +
        '<input class="form-input" type="tel" name="telefono" autocomplete="tel" placeholder="+56 9 1234 5678">' +
      '</div>' +
      '<div class="form-group full-width">' +
        '<label class="form-label">Nombre de la empresa *</label>' +
        '<input class="form-input" type="text" name="empresa" required autocomplete="organization" placeholder="Nombre de tu empresa">' +
      '</div>' +
      '<div class="form-group full-width">' +
        '<label class="form-label">Industria</label>' +
        '<select class="form-select" name="industria">' +
          '<option value="">Selecciona</option>' +
          INDUSTRIAS.map(function (i) { return '<option value="' + i + '">' + i + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div class="form-group full-width">' +
        '<label class="form-label">Mensaje</label>' +
        '<textarea class="form-textarea" name="mensaje" rows="4" placeholder="Cuéntanos sobre tu empresa y tu desafío energético"></textarea>' +
      '</div>' +
      '</div>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" ' +
        'style="position:absolute;left:-9999px;height:0;overflow:hidden" aria-hidden="true">' +
      '<button type="submit" class="btn btn-primary form-submit">Enviar mensaje →</button>' +
      '<p class="lead-form-error" style="display:none;color:#c0392b;font-size:14px;margin-top:10px"></p>';
  }

  function buildContactForm(container) {
    var formType = container.getAttribute('data-form-type') || 'contacto';
    container.innerHTML = '<form class="lead-form contact-lead-form" novalidate>' + contactFormHtml() + '</form>';
    var form = container.querySelector('form');

    var analytics = getAnalytics();
    if (analytics) {
      analytics.trackOnce('form-view:' + formType + ':' + window.location.pathname, function () {
        analytics.trackFormView({ form_id: formType, form_type: formType, delivery_method: 'email' });
      });
      analytics.bindFormStart(form, {
        once_key: 'form-start:' + formType + ':' + window.location.pathname,
        form_id: formType,
        form_type: formType
      });
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var nombre = form.nombre.value.trim();
      var apellido = form.apellido.value.trim();
      var email = form.email.value.trim();
      var empresa = form.empresa.value.trim();
      var errorEl = form.querySelector('.lead-form-error');
      errorEl.style.display = 'none';

      if (!nombre || !apellido || !empresa || !EMAIL_RE.test(email)) {
        errorEl.textContent = 'Por favor completa los campos obligatorios (*) con datos válidos.';
        errorEl.style.display = 'block';
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      var data = new URLSearchParams();
      data.append('tipo', 'contacto');
      data.append('nombre', nombre);
      data.append('apellido', apellido);
      data.append('email', email);
      data.append('telefono', form.telefono.value.trim());
      data.append('empresa', empresa);
      data.append('industria', form.industria.value);
      data.append('mensaje', form.mensaje.value.trim());
      data.append('origen', formType);
      data.append('website', form.website.value);
      data.append('pagina', window.location.pathname);

      fetch(ENDPOINT, { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.error || 'error');
          if (analytics) {
            analytics.trackLead({ form_id: formType, form_type: formType, lead_source: 'website' });
            analytics.trackContact({ form_id: formType, form_type: formType });
          }
          container.innerHTML = '<div class="form-success show" style="display:block">' +
            '&#9989; ¡Gracias! Recibimos tu mensaje y te contactaremos dentro de las próximas 24 horas hábiles. ' +
            'Te enviamos una confirmación a <strong>' + escapeHtml(email) + '</strong>.' +
          '</div>';
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Enviar mensaje →';
          errorEl.textContent = 'Hubo un problema al enviar. Inténtalo de nuevo o escríbenos a hola@clickie.io.';
          errorEl.style.display = 'block';
        });
    });
  }

  /* ── Auto-init ─────────────────────────────────────────── */

  function init() {
    document.querySelectorAll('[data-lead-form]').forEach(buildInlineForm);
    document.querySelectorAll('[data-contact-form]').forEach(buildContactForm);
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
