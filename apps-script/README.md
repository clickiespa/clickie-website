# Backend de descarga de guías (Apps Script)

Reemplaza los formularios de HubSpot. El código vive en `Code.gs` y se ejecuta
como aplicación web en la cuenta Google Workspace de Clickie.

## Puesta en marcha (una sola vez)

1. **Google Sheet de leads**: crear una hoja llamada "Clickie — Leads Guías".
   Copiar su ID (el texto largo en la URL entre `/d/` y `/edit`) en
   `CONFIG.SHEET_ID` de `Code.gs`.

2. **PDFs en Drive**: subir las guías a una carpeta de Drive (NO al repositorio,
   para que nadie las descargue sin dejar su correo). Copiar el ID de cada PDF
   (URL del archivo, entre `/d/` y `/view`) en `CONFIG.DOCS` de `Code.gs`.

3. **Crear el script**: ir a [script.google.com](https://script.google.com) con
   la cuenta @clickie.io → Nuevo proyecto → pegar el contenido de `Code.gs`.

4. **Probar**: en el editor, ejecutar la función `testEnvio` → autorizar los
   permisos que pide Google (Sheets, Drive, Gmail) → verificar que llegue el
   correo con el PDF adjunto y que aparezca la fila en la Sheet.

5. **Publicar**: Implementar → Nueva implementación → Aplicación web:
   - Ejecutar como: **yo** (la cuenta @clickie.io)
   - Quién tiene acceso: **cualquier persona**

   Copiar la URL resultante (termina en `/exec`) en `ENDPOINT` de
   `scripts/lead-form.js`.

## Agregar el formulario a una página

```html
<div data-lead-form data-doc-id="guia-tarifas-electricas"></div>
...
<script src="../scripts/lead-form.js"></script>
```

El `data-doc-id` debe existir en `CONFIG.DOCS` del script.

## Agregar una guía nueva

1. Subir el PDF a la carpeta de Drive y copiar su ID.
2. Agregar la entrada en `CONFIG.DOCS` de `Code.gs` (en script.google.com).
3. Implementar → Administrar implementaciones → editar → Nueva versión.
4. Poner el `<div data-lead-form ...>` en la página de la guía.

## Remitente hola@clickie.io

Los correos salen desde `hola@clickie.io`. Para que Gmail lo permita, la cuenta
que ejecuta el script debe poder "Enviar como" esa dirección. Dos opciones:

- **Si hola@ es un alias o grupo**: en Gmail de la cuenta que ejecuta el script →
  Configuración → Cuentas → "Enviar como" → agregar `hola@clickie.io`.
- **Si hola@ es una cuenta propia**: crear el script directamente con esa cuenta.

Si Gmail no reconoce la dirección, el envío fallará — verificar esto antes de
publicar (la función `testEnvio` sirve para probarlo).

## Notas

- Límite de envío de Gmail con Workspace: ~1.500 correos/día (sobra para leads).
- El correo sale con SPF/DKIM del dominio clickie.io → buena entregabilidad.
- Anti-spam: campo honeypot oculto; los envíos de bots se descartan en silencio.
- Los leads quedan en la Sheet: Fecha, Nombre, Email, Empresa, Documento, Página.
