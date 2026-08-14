const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(__dirname, "..");
const siteOrigin = "https://clickie.io";
const legacyRedirectsPath = path.join(__dirname, "legacy-redirects.js");
const outputDir = path.join(siteRoot, "content", "seo");
const csvOutputPath = path.join(outputDir, "url-inventory.csv");
const mdOutputPath = path.join(outputDir, "url-inventory.md");

const ignoredDirectories = new Set([
  ".git",
  ".agents",
  ".codex",
  "node_modules",
  "assets",
  "Imagenes",
  "apps-script",
  "content",
]);

function walkHtmlFiles(dir, root = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(root, absolutePath);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }
      files.push(...walkHtmlFiles(absolutePath, root));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(relativePath);
    }
  }

  return files;
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMatch(contents, pattern) {
  const match = contents.match(pattern);
  return match ? decodeHtml(match[1].trim()) : "";
}

function publicUrlFromPath(relativePath) {
  const normalized = relativePath.split(path.sep).join("/");
  if (normalized === "index.html") {
    return `${siteOrigin}/`;
  }
  if (normalized.endsWith("/index.html")) {
    return `${siteOrigin}/${normalized.slice(0, -"index.html".length)}`;
  }
  return `${siteOrigin}/${normalized}`;
}

function parseRedirectTarget(contents) {
  const scriptTarget = extractMatch(contents, /window\.location\.replace\("([^"]+)"\)/u);
  if (scriptTarget) {
    return scriptTarget;
  }

  const refreshTarget = extractMatch(contents, /<meta http-equiv="refresh" content="[^"]*url=([^"]+)"\s*\/?>/iu);
  return refreshTarget;
}

function absolutizeUrl(value, baseUrl) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch (error) {
    return value;
  }
}

function parseLegacyRedirectConfig() {
  const source = fs.readFileSync(legacyRedirectsPath, "utf8");
  const payload = source.replace(/^window\.CLICKIE_LEGACY_REDIRECTS\s*=\s*/u, "").trim().replace(/;$/u, "");
  return JSON.parse(payload);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/u.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildRows() {
  const htmlFiles = walkHtmlFiles(siteRoot).sort((a, b) => a.localeCompare(b, "es"));
  const rows = [];

  for (const relativePath of htmlFiles) {
    const absolutePath = path.join(siteRoot, relativePath);
    const contents = fs.readFileSync(absolutePath, "utf8");
    const publicUrl = publicUrlFromPath(relativePath);
    const canonicalUrlRaw = extractMatch(contents, /<link rel="canonical" href="([^"]+)"\s*\/?>/iu);
    const canonicalUrl = absolutizeUrl(canonicalUrlRaw, publicUrl);
    const title = extractMatch(contents, /<title>([^<]+)<\/title>/iu);
    const redirectTarget = absolutizeUrl(parseRedirectTarget(contents), publicUrl);
    const hasRedirect =
      Boolean(redirectTarget) &&
      (contents.includes('http-equiv="refresh"') || contents.includes("window.location.replace"));
    const is404 = relativePath === "404.html";
    const isSnapshot = relativePath.startsWith("content/hubspot-site-export");

    let kind = "activa";
    let status = "200";
    let target = canonicalUrl || publicUrl;
    let notes = "";

    if (is404) {
      kind = "error";
      status = "404";
      target = "scripts/legacy-redirects.js";
      notes = "Página de error con fallback JS para URLs antiguas.";
    } else if (isSnapshot) {
      kind = "snapshot";
      status = "archivo";
      notes = "Copia histórica de HubSpot dentro del repo; revisar si debe quedar fuera del deploy.";
    } else if (hasRedirect) {
      kind = "redireccionada";
      status = "legacy";
      target = redirectTarget;
      notes = "Stub legacy con meta refresh y window.location.replace.";
    } else if (canonicalUrl && canonicalUrl !== publicUrl) {
      kind = "duplicada";
      status = "revisar";
      target = canonicalUrl;
      notes = "La URL publicada no coincide con su canonical.";
    }

    rows.push({
      source: "archivo",
      kind,
      status,
      publicUrl,
      target,
      repoPath: relativePath,
      title,
      notes,
    });
  }

  const legacyConfig = parseLegacyRedirectConfig();

  for (const [legacyPath, target] of Object.entries(legacyConfig.exact)) {
    rows.push({
      source: "legacy-map-exact",
      kind: "redireccionada",
      status: "legacy",
      publicUrl: `${siteOrigin}${legacyPath}`,
      target,
      repoPath: "scripts/legacy-redirects.js",
      title: "",
      notes: "Regla exacta atendida por 404 fallback.",
    });
  }

  for (const [normalizedSlug, target] of Object.entries(legacyConfig.normalized)) {
    rows.push({
      source: "legacy-map-normalized",
      kind: "redireccionada",
      status: "legacy",
      publicUrl: `${siteOrigin}/${normalizedSlug}`,
      target,
      repoPath: "scripts/legacy-redirects.js",
      title: "",
      notes: "Patrón normalizado; captura variantes con acentos, mayúsculas, guiones y .html.",
    });
  }

  for (const [prefix, target] of Object.entries(legacyConfig.prefixes)) {
    rows.push({
      source: "legacy-map-prefix",
      kind: "redireccionada",
      status: "legacy",
      publicUrl: `${siteOrigin}${prefix}*`,
      target,
      repoPath: "scripts/legacy-redirects.js",
      title: "",
      notes: "Prefijo legacy cubierto por 404 fallback.",
    });
  }

  return rows;
}

function buildSummary(rows) {
  const count = (predicate) => rows.filter(predicate).length;
  const active = count((row) => row.source === "archivo" && row.kind === "activa");
  const redirectedFiles = count((row) => row.source === "archivo" && row.kind === "redireccionada");
  const redirectRules = count((row) => row.source.startsWith("legacy-map"));
  const errorPages = count((row) => row.kind === "error");
  const snapshots = count((row) => row.kind === "snapshot");
  const duplicatesToReview = count((row) => row.kind === "duplicada");

  return {
    total: rows.length,
    active,
    redirectedFiles,
    redirectRules,
    errorPages,
    snapshots,
    duplicatesToReview,
  };
}

function buildMarkdown(rows, summary, generatedAt) {
  const activeExamples = rows
    .filter((row) => row.source === "archivo" && row.kind === "activa")
    .slice(0, 8)
    .map((row) => `- ${row.publicUrl}`)
    .join("\n");

  const redirectExamples = rows
    .filter((row) => row.kind === "redireccionada")
    .slice(0, 8)
    .map((row) => `- ${row.publicUrl} -> ${row.target}`)
    .join("\n");

  const snapshotExamples = rows
    .filter((row) => row.kind === "snapshot")
    .slice(0, 5)
    .map((row) => `- ${row.publicUrl}`)
    .join("\n");

  const snapshotSection = summary.snapshots
    ? `- Existen snapshots HTML heredados de HubSpot dentro del repo que conviene mantener fuera de la ruta pública:
${snapshotExamples || "- Sin resultados."}`
    : `- No quedan snapshots HTML de HubSpot dentro de la ruta pública del sitio.`;

  return `# Inventario de URLs Clickie

Fecha de generación: ${generatedAt}

## Resumen
- Total de registros inventariados: ${summary.total}
- URLs activas detectadas en archivos publicados: ${summary.active}
- URLs legacy con archivo de redirección: ${summary.redirectedFiles}
- Reglas adicionales de redirección en \`scripts/legacy-redirects.js\`: ${summary.redirectRules}
- Páginas de error/control: ${summary.errorPages}
- Snapshots HTML heredados dentro del repo: ${summary.snapshots}
- URLs con canonical distinto para revisar manualmente: ${summary.duplicatesToReview}

## Criterio
- Se clasificaron como activas las páginas HTML públicas que no son stubs de redirección.
- Se clasificaron como redireccionadas las URLs legacy con \`meta refresh\`, \`window.location.replace\` o reglas del fallback de \`404.html\`.
- Se clasificaron como snapshots las copias HTML de HubSpot guardadas fuera de la ruta pública del sitio, porque son material de archivo y no deberían competir con las URLs canónicas.

## Muestras de URLs activas
${activeExamples || "- Sin resultados."}

## Muestras de URLs redireccionadas
${redirectExamples || "- Sin resultados."}

## Riesgos detectados
- La versión canónica actual del blog vive bajo \`/recursos/blog/*.html\`, mientras que muchas URLs históricas siguen existiendo como stubs legacy en la raíz del sitio.
- \`404.html\` depende de \`scripts/legacy-redirects.js\` para rescatar URLs antiguas no cubiertas por archivos físicos.
${snapshotSection}

## Archivo maestro
- El detalle completo está en \`content/seo/url-inventory.csv\`.
`;
}

function main() {
  const generatedAt = process.env.URL_INVENTORY_DATE || new Date().toISOString().slice(0, 10);
  const rows = buildRows().sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind.localeCompare(b.kind, "es");
    }
    return a.publicUrl.localeCompare(b.publicUrl, "es");
  });

  const summary = buildSummary(rows);
  const csvHeader = ["source", "kind", "status", "public_url", "target_or_canonical", "repo_path", "title", "notes"];
  const csvLines = [
    csvHeader.join(","),
    ...rows.map((row) =>
      [
        row.source,
        row.kind,
        row.status,
        row.publicUrl,
        row.target,
        row.repoPath,
        row.title,
        row.notes,
      ].map(csvEscape).join(",")
    ),
  ];

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(csvOutputPath, `${csvLines.join("\n")}\n`);
  fs.writeFileSync(mdOutputPath, `${buildMarkdown(rows, summary, generatedAt)}\n`);

  console.log(
    JSON.stringify(
      {
        csvOutputPath,
        mdOutputPath,
        summary,
      },
      null,
      2
    )
  );
}

main();
