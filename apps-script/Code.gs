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

  // Carpeta de Drive donde viven los PDFs descargables (ID de la URL de la carpeta)
  DRIVE_FOLDER_ID: '1mO5Y84aARU3tTosNhwOEy3uQl6o_r7QN',

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

/** Obtiene el PDF: por ID directo (fileId) o por nombre dentro de la carpeta de guías. */
function getPdf(doc) {
  if (doc.fileId) return DriveApp.getFileById(doc.fileId);
  var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var files = folder.getFilesByName(doc.file);
  if (!files.hasNext()) throw new Error('PDF no encontrado en Drive: ' + doc.file);
  return files.next();
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
