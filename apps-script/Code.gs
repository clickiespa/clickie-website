/**
 * Clickie — Backend de descarga de guías (reemplazo de HubSpot)
 *
 * Flujo: el formulario del sitio hace POST aquí → se registra el lead en
 * Google Sheets → se envía la guía por correo al visitante → (opcional)
 * se notifica al equipo comercial.
 *
 * Despliegue: Implementar > Nueva implementación > Aplicación web
 *   - Ejecutar como: yo (tu cuenta @clickie.io)
 *   - Acceso: cualquier persona
 * La URL resultante (termina en /exec) se pega en scripts/lead-form.js
 */

// ========================= CONFIGURACIÓN =========================

var CONFIG = {
  // ID de la Google Sheet donde se guardan los leads (de la URL de la hoja)
  SHEET_ID: '1fcVPZXd2B80EniwvGFmmoJYx_oyI5M5_cmtmj7sEd_o',
  SHEET_NAME: 'Leads',

  // Remitente y notificaciones.
  // FROM_ADDRESS debe ser la cuenta que ejecuta el script o un alias
  // "Enviar como" configurado en Gmail (ver README).
  FROM_NAME: 'Clickie',
  FROM_ADDRESS: 'hola@clickie.io',
  REPLY_TO: 'hola@clickie.io',
  NOTIFY_EMAIL: 'nicolas.llevenes@clickie.io', // '' para desactivar aviso interno

  // Carpetas de Drive donde viven los PDFs descargables.
  // Los PDFs se buscan por nombre en ambas, así que mover archivos entre
  // ellas no rompe nada. Nombres usados por organizarDrive().
  DRIVE_FOLDER_ID: '1mO5Y84aARU3tTosNhwOEy3uQl6o_r7QN', // Guías de casos de negocio
  FOLDER_CASOS: 'Guías de casos de negocio',
  FOLDER_GUIAS: 'Guías Pagina Web Clickie',

  // Dominios de correo personales/genéricos que se rechazan (se exige correo de empresa)
  FREE_MAIL: ['gmail', 'googlemail', 'hotmail', 'outlook', 'live', 'msn', 'yahoo',
    'ymail', 'icloud', 'me', 'mac', 'aol', 'protonmail', 'proton', 'gmx', 'zoho',
    'yandex', 'mail', 'email', 'terra', 'latinmail', 'inbox', 'rocketmail'],

  // Catálogo de documentos descargables.
  // file = nombre exacto del PDF dentro de la carpeta de Drive.
  // fileId = alternativa: ID directo del archivo en Drive.
  DOCS: {
    'guia-evaluacion-financiera': {
      name: 'Energía: el costo que sí puedes reducir — Cómo evaluar financieramente un proyecto de eficiencia energética',
      fileId: '13BqfALR0etM69DT5Wbwj-kvp2ggFyroh'
    },
    'guia-cafeterias': {
      name: 'Guía de Eficiencia Energética en Cafeterías',
      file: 'Clickie_Guia_Cafeterias.pdf'
    },
    'guia-tiendas': {
      name: 'Guía de Eficiencia Energética en Tiendas por Departamento',
      file: 'Clickie_Guia_Tiendas_por_Departamento.pdf'
    },
    'guia-tarifas-electricas': {
      name: 'Guía de Tarifas Eléctricas para Empresas en Chile',
      fileId: '1jrGwuzHdtk6bDdio8zk0VW7suZyY3BvG'
    },
    'caso-banca': {
      name: 'Caso de Negocio — Banca',
      file: 'Clickie_Caso_Negocio_Banca.pdf'
    },
    'caso-cadenas-comida': {
      name: 'Caso de Negocio — Cadenas de Comida',
      file: 'Clickie_Caso_Negocio_Cadenas_de_Comida.pdf'
    },
    'caso-cafeterias': {
      name: 'Caso de Negocio — Cafeterías',
      file: 'Clickie_Caso_Negocio_Cafeterias.pdf'
    },
    'caso-farmacias': {
      name: 'Caso de Negocio — Farmacias',
      file: 'Clickie_Caso_Negocio_Farmacias.pdf'
    },
    'caso-sucursales-atencion': {
      name: 'Caso de Negocio — Sucursales de Atención a Público',
      file: 'Clickie_Caso_Negocio_Sucursales_Atencion_Publico.pdf'
    },
    'caso-supermercados': {
      name: 'Caso de Negocio — Supermercados',
      file: 'Clickie_Caso_Negocio_Supermercados.pdf'
    },
    'caso-tiendas-conveniencia': {
      name: 'Caso de Negocio — Tiendas de Conveniencia',
      file: 'Clickie_Caso_Negocio_Tiendas_de_Conveniencia.pdf'
    },
    'caso-tiendas-departamento': {
      name: 'Caso de Negocio — Tiendas por Departamento',
      file: 'Clickie_Caso_Negocio_Tiendas_por_Departamento.pdf'
    }
  }
};

// ========================= ENDPOINT =========================

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // Honeypot anti-spam: los bots llenan este campo oculto, los humanos no.
    if (p.website) return jsonResponse({ ok: true });

    // Ruta 1: formulario de contacto/cotización (sin documento)
    if (String(p.tipo || '') === 'contacto') return handleContacto(p);

    var nombre = String(p.nombre || '').trim();
    var apellido = String(p.apellido || '').trim();
    var email = String(p.email || '').trim().toLowerCase();
    var telefono = String(p.telefono || '').trim();
    var empresa = String(p.empresa || '').trim();
    var cargo = String(p.cargo || '').trim();
    var docId = String(p.docId || '').trim();
    var pagina = String(p.pagina || '').trim();

    if (!nombre || !isValidEmail(email)) {
      return jsonResponse({ ok: false, error: 'Datos inválidos' });
    }
    if (isFreeMail(email)) {
      return jsonResponse({ ok: false, error: 'Por favor usa tu correo de empresa' });
    }
    var doc = CONFIG.DOCS[docId];
    if (!doc) {
      return jsonResponse({ ok: false, error: 'Documento no encontrado' });
    }

    saveLead([new Date(), nombre, apellido, email, telefono, empresa, cargo, doc.name, pagina]);
    sendDocumentEmail(nombre, email, doc);
    if (CONFIG.NOTIFY_EMAIL) notifyTeam(nombre + ' ' + apellido, email, telefono, empresa, cargo, doc);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Error interno: ' + err.message });
  }
}

// ========================= CONTACTO =========================

var CONTACT_HEADERS = ['Fecha', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Empresa', 'Industria', 'Mensaje', 'Origen', 'Página'];

function handleContacto(p) {
  var nombre = String(p.nombre || '').trim();
  var apellido = String(p.apellido || '').trim();
  var email = String(p.email || '').trim().toLowerCase();
  var telefono = String(p.telefono || '').trim();
  var empresa = String(p.empresa || '').trim();
  var industria = String(p.industria || '').trim();
  var mensaje = String(p.mensaje || '').trim();
  var origen = String(p.origen || 'contacto').trim();
  var pagina = String(p.pagina || '').trim();

  if (!nombre || !isValidEmail(email)) {
    return jsonResponse({ ok: false, error: 'Datos inválidos' });
  }

  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName('Contactos') || ss.insertSheet('Contactos');
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CONTACT_HEADERS.length).setValues([CONTACT_HEADERS]).setFontWeight('bold');
  }
  sheet.appendRow([new Date(), nombre, apellido, email, telefono, empresa, industria, mensaje, origen, pagina]);

  // Aviso al equipo comercial
  if (CONFIG.NOTIFY_EMAIL) {
    GmailApp.sendEmail(
      CONFIG.NOTIFY_EMAIL,
      'Nuevo contacto web: ' + nombre + ' ' + apellido + (empresa ? ' (' + empresa + ')' : ''),
      'Nombre: ' + nombre + ' ' + apellido + '\nEmail: ' + email +
      '\nTeléfono: ' + (telefono || '—') + '\nEmpresa: ' + (empresa || '—') +
      '\nIndustria: ' + (industria || '—') + '\nOrigen: ' + origen +
      '\n\nMensaje:\n' + (mensaje || '—') +
      '\n\nContactos: https://docs.google.com/spreadsheets/d/' + CONFIG.SHEET_ID
    );
  }

  // Confirmación breve al remitente
  GmailApp.sendEmail(email, 'Recibimos tu mensaje — Clickie', '', {
    name: CONFIG.FROM_NAME,
    from: CONFIG.FROM_ADDRESS,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: buildContactoHtml(nombre)
  });

  return jsonResponse({ ok: true });
}

function buildContactoHtml(primerNombre) {
  return '' +
  '<div style="margin:0;padding:0;background:#f4f5fb;font-family:Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb;padding:32px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">' +
          '<tr><td style="background:#191947;padding:28px 40px;">' +
            '<span style="color:#ffffff;font-size:24px;font-weight:bold;">Clickie</span>' +
            '<span style="color:#f5c542;font-size:24px;">&#10022;</span>' +
          '</td></tr>' +
          '<tr><td style="padding:36px 40px 32px;">' +
            '<h1 style="margin:0 0 16px;font-size:22px;color:#191947;">¡Gracias ' + primerNombre + '!</h1>' +
            '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">' +
              'Recibimos tu mensaje y nuestro equipo te contactará dentro de las próximas 24 horas hábiles.' +
            '</p>' +
            '<p style="margin:0;font-size:13px;color:#9a9ab0;line-height:1.5;">' +
              'Clickie — Gestión de energía inteligente para redes multisucursal en LATAM · <a href="https://clickie.io" style="color:#5b5bd6;">clickie.io</a>' +
            '</p>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</div>';
}

// ========================= LÓGICA =========================

var LEAD_HEADERS = ['Fecha', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Empresa', 'Cargo', 'Documento', 'Página origen'];

function saveLead(row) {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.insertSheet(CONFIG.SHEET_NAME);
  // Actualiza el encabezado si faltan columnas (migración de esquema)
  var firstCell = sheet.getLastRow() > 0 ? sheet.getRange(1, 1).getValue() : '';
  if (sheet.getLastRow() === 0 || (firstCell === 'Fecha' && sheet.getLastColumn() < LEAD_HEADERS.length)) {
    sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]).setFontWeight('bold');
  }
  sheet.appendRow(row);
}

function sendDocumentEmail(nombre, email, doc) {
  var pdf = getPdf(doc);
  var primerNombre = nombre.split(' ')[0];

  GmailApp.sendEmail(email, 'Tu guía de Clickie: ' + doc.name, '', {
    name: CONFIG.FROM_NAME,
    from: CONFIG.FROM_ADDRESS,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: buildEmailHtml(primerNombre, doc.name),
    attachments: [pdf.getAs(MimeType.PDF)]
  });
}

function notifyTeam(nombre, email, telefono, empresa, cargo, doc) {
  GmailApp.sendEmail(
    CONFIG.NOTIFY_EMAIL,
    'Nuevo lead: ' + nombre + (empresa ? ' (' + empresa + ')' : ''),
    'Nombre: ' + nombre + '\nEmail: ' + email + '\nTeléfono: ' + (telefono || '—') +
    '\nEmpresa: ' + (empresa || '—') + '\nCargo: ' + (cargo || '—') +
    '\nDocumento: ' + doc.name + '\n\nLeads: https://docs.google.com/spreadsheets/d/' + CONFIG.SHEET_ID
  );
}

// ========================= PLANTILLA DE CORREO =========================

function buildEmailHtml(primerNombre, docName) {
  return '' +
  '<div style="margin:0;padding:0;background:#f4f5fb;font-family:Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5fb;padding:32px 16px;">' +
      '<tr><td align="center">' +
        '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">' +
          '<tr><td style="background:#191947;padding:28px 40px;">' +
            '<span style="color:#ffffff;font-size:24px;font-weight:bold;">Clickie</span>' +
            '<span style="color:#f5c542;font-size:24px;">&#10022;</span>' +
          '</td></tr>' +
          '<tr><td style="padding:36px 40px 8px;">' +
            '<h1 style="margin:0 0 16px;font-size:22px;color:#191947;">¡Hola ' + primerNombre + '! Aquí está tu guía &#128196;</h1>' +
            '<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#4a4a68;">' +
              'Gracias por tu interés. Adjuntamos <strong>' + docName + '</strong> en formato PDF.' +
            '</p>' +
            '<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4a68;">' +
              '¿Quieres ver cómo se ven estos números en tu red? Conversemos.' +
            '</p>' +
            '<a href="https://clickie.io/index.html#contacto" style="display:inline-block;background:#f5c542;color:#191947;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:999px;text-decoration:none;">Agendar una reunión con Clickie</a>' +
          '</td></tr>' +
          '<tr><td style="padding:28px 40px 32px;">' +
            '<p style="margin:0;font-size:13px;color:#9a9ab0;line-height:1.5;">' +
              'Clickie — Gestión de energía inteligente para redes multisucursal en LATAM.<br>' +
              '<a href="https://clickie.io" style="color:#5b5bd6;">clickie.io</a>' +
            '</p>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
    '</table>' +
  '</div>';
}

/**
 * Obtiene el PDF: por ID directo (fileId) o por nombre, buscando en las
 * carpetas de guías y de casos de negocio. Al buscar en ambas, reordenar
 * los archivos en Drive no rompe las descargas.
 */
function getPdf(doc) {
  if (doc.fileId) return DriveApp.getFileById(doc.fileId);
  var carpetas = [carpetaGuias(), DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID)];
  for (var i = 0; i < carpetas.length; i++) {
    if (!carpetas[i]) continue;
    var files = carpetas[i].getFilesByName(doc.file);
    if (files.hasNext()) return files.next();
  }
  throw new Error('PDF no encontrado en Drive: ' + doc.file);
}

/** Carpeta de guías de la web (por nombre); null si no existe. */
function carpetaGuias() {
  var it = DriveApp.getFoldersByName(CONFIG.FOLDER_GUIAS);
  return it.hasNext() ? it.next() : null;
}

/**
 * Ordena Drive: mueve los PDFs de guías a "Guías Pagina Web Clickie" y deja
 * los casos de negocio en "Guías de casos de negocio". Ejecutar manualmente.
 */
function organizarDrive() {
  var destinoGuias = carpetaGuias() || DriveApp.createFolder(CONFIG.FOLDER_GUIAS);
  var casos = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);

  // Nombres de archivo de las guías (según el catálogo DOCS)
  var nombresGuias = [];
  Object.keys(CONFIG.DOCS).forEach(function (k) {
    if (k.indexOf('guia-') === 0 && CONFIG.DOCS[k].file) nombresGuias.push(CONFIG.DOCS[k].file);
  });
  // Además, la guía financiera y la de tarifas se referencian por fileId
  var porId = ['guia-evaluacion-financiera', 'guia-tarifas-electricas'];

  var movidos = [];
  // 1. Mover por nombre desde la carpeta de casos
  nombresGuias.forEach(function (nombre) {
    var it = casos.getFilesByName(nombre);
    while (it.hasNext()) {
      var f = it.next();
      f.moveTo(destinoGuias);
      movidos.push(nombre);
    }
  });
  // 2. Mover las que se referencian por ID (estén donde estén)
  porId.forEach(function (k) {
    var doc = CONFIG.DOCS[k];
    if (!doc || !doc.fileId) return;
    var f = DriveApp.getFileById(doc.fileId);
    f.moveTo(destinoGuias);
    movidos.push(f.getName());
  });

  Logger.log('Carpeta de guías: ' + destinoGuias.getId());
  Logger.log('Movidos a "' + CONFIG.FOLDER_GUIAS + '": ' + (movidos.length ? movidos.join(', ') : 'ninguno'));
  Logger.log('--- Contenido final ---');
  logCarpeta(destinoGuias);
  logCarpeta(casos);
}

function logCarpeta(folder) {
  var nombres = [];
  var it = folder.getFiles();
  while (it.hasNext()) nombres.push(it.next().getName());
  nombres.sort();
  Logger.log(folder.getName() + ' (' + nombres.length + '): ' + nombres.join(' | '));
}

/** true si el dominio del correo es un proveedor personal (Gmail, Hotmail, etc.) */
function isFreeMail(email) {
  var dominio = email.split('@')[1] || '';
  var base = dominio.split('.')[0];
  return CONFIG.FREE_MAIL.indexOf(base) !== -1;
}

// ========================= UTILIDADES =========================

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Prueba manual desde el editor: ejecutar y revisar que llegue el correo. */
function testEnvio() {
  var doc = CONFIG.DOCS['guia-evaluacion-financiera'];
  saveLead([new Date(), 'Prueba', 'Interna', CONFIG.REPLY_TO, '', 'Clickie', 'Test', doc.name, 'test-manual']);
  sendDocumentEmail('Prueba', CONFIG.REPLY_TO, doc);
}

// ========================= UTILIDAD: CORREGIR GUÍAS =========================
// Copia los decks de Google Slides, reemplaza los enlaces de HubSpot por el
// formulario de contacto de clickie.io, exporta a PDF y los deja en la
// carpeta de guías de Drive con el nombre canónico. Ejecutar manualmente.

function fixGuias() {
  var trabajos = [
    { deckId: '1_t59JOgsGihee0G_uB7KqOwa7dfqGdikWktEA-5PX9Q', out: 'Clickie_Guia_Tiendas_por_Departamento.pdf' },
    { deckId: '1KN7YNBlBcRnFmqN6iQc0AH6rYpJvi1fWaNekkpFAxNM', out: 'Clickie_Guia_Cafeterias.pdf' }
  ];
  var NUEVO_LINK = 'https://clickie.io/index.html#contacto';
  var folder = carpetaGuias() || DriveApp.createFolder(CONFIG.FOLDER_GUIAS);

  trabajos.forEach(function (t) {
    var copia = DriveApp.getFileById(t.deckId).makeCopy('tmp-' + t.out, folder);
    var pres = SlidesApp.openById(copia.getId());
    var cambiados = 0;
    pres.getSlides().forEach(function (slide) {
      slide.getPageElements().forEach(function (el) {
        cambiados += fixLinksEnElemento(el, NUEVO_LINK);
      });
    });
    pres.saveAndClose();
    // Borra versiones anteriores del PDF con el mismo nombre
    var previos = folder.getFilesByName(t.out);
    while (previos.hasNext()) previos.next().setTrashed(true);
    folder.createFile(DriveApp.getFileById(copia.getId()).getAs('application/pdf')).setName(t.out);
    copia.setTrashed(true);
    Logger.log(t.out + ': ' + cambiados + ' enlaces corregidos');
  });

  // Renombra el PDF de tarifas al nombre canónico si se subió con otro nombre
  var archivos = folder.getFiles();
  while (archivos.hasNext()) {
    var f = archivos.next();
    if (/tarifas/i.test(f.getName()) && f.getName() !== 'Clickie_Guia_Tarifas_Electricas.pdf' && /pdf$/i.test(f.getName())) {
      f.setName('Clickie_Guia_Tarifas_Electricas.pdf');
      Logger.log('Renombrado PDF de tarifas');
    }
  }
}

function fixLinksEnElemento(el, nuevo) {
  var n = 0;
  var tipo = el.getPageElementType();
  if (tipo == SlidesApp.PageElementType.GROUP) {
    el.asGroup().getChildren().forEach(function (c) { n += fixLinksEnElemento(c, nuevo); });
    return n;
  }
  var conLink = null;
  if (tipo == SlidesApp.PageElementType.SHAPE) conLink = el.asShape();
  else if (tipo == SlidesApp.PageElementType.IMAGE) conLink = el.asImage();
  if (conLink && conLink.getLink) {
    var link = conLink.getLink();
    if (link && link.getUrl && link.getUrl() && esLinkHubspot(link.getUrl())) {
      conLink.setLinkUrl(nuevo);
      n++;
    }
  }
  if (tipo == SlidesApp.PageElementType.SHAPE) {
    n += fixLinksEnTexto(el.asShape().getText(), nuevo);
  }
  if (tipo == SlidesApp.PageElementType.TABLE) {
    var tabla = el.asTable();
    for (var r = 0; r < tabla.getNumRows(); r++)
      for (var c = 0; c < tabla.getNumColumns(); c++)
        n += fixLinksEnTexto(tabla.getCell(r, c).getText(), nuevo);
  }
  return n;
}

function fixLinksEnTexto(texto, nuevo) {
  var n = 0;
  texto.getRuns().forEach(function (run) {
    var link = run.getTextStyle().getLink();
    if (link && link.getUrl && link.getUrl() && esLinkHubspot(link.getUrl())) {
      run.getTextStyle().setLinkUrl(nuevo);
      n++;
    }
  });
  return n;
}

function esLinkHubspot(url) {
  return /hubspot|meetings\.|hs-sites|hsforms|hs\.com|calendly/i.test(url);
}

/**
 * Limpia duplicados en la carpeta de guías: manda a la papelera las
 * versiones antiguas subidas a mano (las que empiezan con
 * "Guía-Eficiencia-..."), solo si existe el PDF canónico que las reemplaza.
 */
function limpiarDuplicados() {
  var folder = carpetaGuias();
  if (!folder) return Logger.log('No existe la carpeta de guías');

  var canonicos = ['Clickie_Guia_Cafeterias.pdf', 'Clickie_Guia_Tiendas_por_Departamento.pdf'];
  var existeCanonico = {};
  canonicos.forEach(function (n) { existeCanonico[n] = folder.getFilesByName(n).hasNext(); });

  Logger.log('--- Antes ---');
  logCarpeta(folder);

  // Se buscan por patrón porque los nombres traen acentos con codificación distinta
  var aBorrar = [];
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    var n = f.getName();
    // Solo las versiones antiguas: empiezan con "Guía-Eficiencia-Energetica"
    if (/^Gu[ií]a[-_ ]?Eficiencia/i.test(n)) {
      var reemplazo = /cafeter/i.test(n) ? canonicos[0] : canonicos[1];
      if (!existeCanonico[reemplazo]) {
        Logger.log('OJO: sin reemplazo (' + reemplazo + '), NO se borra: ' + n);
        continue;
      }
      aBorrar.push({ f: f, n: n, kb: Math.round(f.getSize() / 1024), reemplazo: reemplazo });
    }
  }

  aBorrar.forEach(function (d) {
    Logger.log('Papelera: ' + d.n + ' (' + d.kb + ' KB) — reemplazado por ' + d.reemplazo);
    d.f.setTrashed(true);
  });
  if (!aBorrar.length) Logger.log('No se encontraron duplicados');

  Logger.log('--- Después ---');
  logCarpeta(folder);
}

/** Restaura la guía financiera si quedó en la papelera por error. */
function restaurarFinanciera() {
  var f = DriveApp.getFileById(CONFIG.DOCS['guia-evaluacion-financiera'].fileId);
  Logger.log('Antes -> ' + f.getName() + ' | en papelera: ' + f.isTrashed());
  if (f.isTrashed()) f.setTrashed(false);
  var destino = carpetaGuias();
  if (destino) f.moveTo(destino);
  Logger.log('Después -> ' + f.getName() + ' | en papelera: ' + f.isTrashed());
  logCarpeta(carpetaGuias());
}
