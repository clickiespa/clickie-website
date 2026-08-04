const fs = require("fs");
const path = require("path");
const { site, categories, posts } = require("./blog-posts");

const rootDir = path.resolve(__dirname, "..");
const blogDir = path.join(rootDir, "recursos", "blog");
const blogIndexFile = path.join(rootDir, "recursos", "blog.html");
const robotsFile = path.join(rootDir, "robots.txt");
const sitemapFile = path.join(rootDir, "sitemap.xml");
const excludedHtmlPrefixes = ["recursos/hubspot_notas_blog_clickie "];
const categoryLabelByKey = new Map(categories.map((category) => [category.key, category.label]));
const fontAwesomeStylesheet = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";

function readFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/\n/g, " ");
}

function pageUrl(relativePath) {
  return new URL(relativePath, site.url).href;
}

function slugToUrl(slug) {
  return pageUrl(`recursos/blog/${slug}.html`);
}

function relativeHref(fromRelativePath, toRelativePathWithHash) {
  const [targetPath, hash = ""] = toRelativePathWithHash.split("#");
  const fromDir = path.posix.dirname(fromRelativePath);
  const relativePath = path.posix.relative(fromDir, targetPath) || ".";

  return hash ? `${relativePath}#${hash}` : relativePath;
}

function formatLongDate(isoDate) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${isoDate}T00:00:00`));
}

function formatMonthYear(isoDate) {
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${isoDate}T00:00:00`));
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

function fileExists(relativePath) {
  if (!relativePath || isAbsoluteUrl(relativePath)) {
    return false;
  }

  return fs.existsSync(path.join(rootDir, relativePath));
}

function resolveCoverImage(post) {
  if (post.coverImage && isAbsoluteUrl(post.coverImage)) {
    return post.coverImage;
  }

  if (post.coverImage && fileExists(post.coverImage)) {
    return post.coverImage;
  }

  return site.defaultOgImage;
}

function resolveCoverAlt(post) {
  return post.coverAlt || post.title;
}

function buildImageSrc(prefix, imagePath) {
  return isAbsoluteUrl(imagePath) ? imagePath : `${prefix}${imagePath}`;
}

function estimateReadingTime(html) {
  const plain = stripTags(html);
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function shouldKeepStrong(text) {
  const plain = stripTags(text);

  if (!plain) {
    return false;
  }

  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (/^\d+\./.test(plain) && wordCount <= 8) {
    return true;
  }

  if (plain.endsWith(":") && wordCount <= 3) {
    return true;
  }

  if (wordCount <= 3 && plain.length <= 30) {
    return true;
  }

  if (wordCount <= 4 && plain.length <= 24) {
    return true;
  }

  return false;
}

function reduceBoldUsage(html) {
  const withoutHeadingStrong = html
    .replace(/<h2([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h2>/g, "<h2$1>$2</h2>")
    .replace(/<h3([^>]*)>\s*<strong>([\s\S]*?)<\/strong>\s*<\/h3>/g, "<h3$1>$2</h3>");

  return withoutHeadingStrong.replace(/<strong>([\s\S]*?)<\/strong>/g, (match, content) => {
    return shouldKeepStrong(content) ? match : content;
  });
}

function replaceFirstTextOccurrence(html, phrase, replacement) {
  if (!phrase) {
    return html;
  }

  const tokens = html.split(/(<[^>]+>)/g);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token || token.startsWith("<")) {
      continue;
    }

    const phraseIndex = token.indexOf(phrase);

    if (phraseIndex === -1) {
      continue;
    }

    tokens[index] = `${token.slice(0, phraseIndex)}${replacement}${token.slice(phraseIndex + phrase.length)}`;
    return tokens.join("");
  }

  return html;
}

function applyArticleHighlight(html, highlightPhrase) {
  if (!highlightPhrase) {
    return html;
  }

  if (highlightPhrase) {
    const strongWrapped = `<strong>${highlightPhrase}</strong>`;
    const strongHighlight = `<span class="article-highlight">${highlightPhrase}</span>`;

    if (html.includes(strongWrapped)) {
      return html.replace(strongWrapped, strongHighlight);
    }
  }

  const highlighted = replaceFirstTextOccurrence(
    html,
    highlightPhrase,
    `<span class="article-highlight">${highlightPhrase}</span>`
  );

  if (highlighted !== html) {
    return highlighted;
  }

  return html.replace(/<strong>([\s\S]*?)<\/strong>/, '<span class="article-highlight">$1</span>');
}

function sanitizeArticleHtml(html, post) {
  const icon = (name) => `<i class="fa-solid ${name} article-inline-icon" aria-hidden="true"></i> `;

  const withoutEmojiNoise = html
    .replace(/title="<i class="fa-solid [^"]+" aria-hidden="true"><\/i>\s*([^"]+)"/g, 'title="$1"')
    .replace(/title="🎥\s*([^"]+)"/g, 'title="$1"')
    .replace(/title="📹\s*([^"]+)"/g, 'title="$1"')
    .replace(/title="📽️\s*([^"]+)"/g, 'title="$1"')
    .replace(/target="_new"/g, 'target="_blank"')
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<button\b[^>]*>\s*<\/button>/g, "")
    .replace(/<p>(?:\s|&nbsp;)*<\/p>/g, "")
    .replace(/💬\s*/g, icon("fa-comment"))
    .replace(/📅\s*/g, icon("fa-calendar-days"))
    .replace(/👉\s*/g, icon("fa-arrow-right"))
    .replace(/📽️\s*/g, icon("fa-circle-play"))
    .replace(/📹\s*/g, icon("fa-circle-play"))
    .replace(/🎥\s*/g, icon("fa-circle-play"))
    .replace(/📩\s*/g, icon("fa-envelope"))
    .replace(/❄️\s*/g, icon("fa-snowflake"))
    .replace(/🔥\s*/g, icon("fa-fire"))
    .replace(/💸\s*/g, icon("fa-sack-dollar"))
    .replace(/🏢\s*/g, icon("fa-building"))
    .replace(/👥\s*/g, icon("fa-users"))
    .replace(/🌍\s*/g, icon("fa-earth-americas"))
    .replace(/🔗\s*/g, icon("fa-link"))
    .replace(/🌤️\s*/g, icon("fa-cloud-sun"))
    .replace(/✔\s*/g, icon("fa-check"))
    .replace(/<span class="article-highlight">([\s\S]*?)<\/span>/g, "$1");

  const normalizedEmphasis = reduceBoldUsage(withoutEmojiNoise);
  return applyArticleHighlight(normalizedEmphasis, post.highlightPhrase);
}

function readSourcePost(sourceFile) {
  const html = readFile(sourceFile);
  const highlightMatch = html.match(/<!-- ARTICLE_HIGHLIGHT:\s*(.*?)\s*-->/);
  const markerBodyMatch = html.match(/<!-- ARTICLE_CONTENT_START -->[\s\S]*?<div class="article-content">([\s\S]*?)<\/div>\s*<!-- ARTICLE_CONTENT_END -->/);
  const markerTagsMatch = html.match(/<!-- ARTICLE_TAGS_START -->[\s\S]*?<div class="article-tags">([\s\S]*?)<\/div>[\s\S]*?<!-- ARTICLE_TAGS_END -->/);
  const bodyMatch = markerBodyMatch || html.match(/<div class="article-content">([\s\S]*?)<\/div>[\s\S]*?<div class="article-footer">/);
  const tagsMatch = markerTagsMatch || html.match(/<div class="article-tags">([\s\S]*?)<\/div>/);

  if (!bodyMatch) {
    throw new Error(`No se pudo extraer .article-content desde ${sourceFile}`);
  }

  const tags = [];

  if (tagsMatch) {
    const rawTags = tagsMatch[1].match(/>(#[^<]+)</g) || [];
    rawTags.forEach((rawTag) => {
      tags.push(rawTag.slice(1, -1).trim());
    });
  }

  return {
    bodyHtml: bodyMatch[1].trim(),
    tags,
    highlightPhrase: highlightMatch ? highlightMatch[1].trim() : ""
  };
}

function cleanTag(tag) {
  return tag.replace(/^#/, "").trim();
}

function resolveCategoryLabel(categoryKey) {
  const label = categoryLabelByKey.get(categoryKey);

  if (!label) {
    throw new Error(`Categoría no reconocida: ${categoryKey}`);
  }

  return label;
}

function buildShareUrls(post) {
  const url = slugToUrl(post.slug);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(post.title);

  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`${post.title}\n\n${url}`)}`
  };
}

function buildRelatedPosts(allPosts, currentPost, limit) {
  const sameCategory = allPosts.filter(
    (post) => post.slug !== currentPost.slug && post.categoryKey === currentPost.categoryKey
  );
  const recentOthers = allPosts.filter(
    (post) => post.slug !== currentPost.slug && post.categoryKey !== currentPost.categoryKey
  );

  return sameCategory.concat(recentOthers).slice(0, limit);
}

function renderStructuredData(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderPostCard(post) {
  const coverImage = resolveCoverImage(post);
  const coverAlt = resolveCoverAlt(post);

  return `        <a href="blog/${post.slug}.html" class="blog-card" data-category="${escapeAttribute(post.categoryKey)}">
          <div class="blog-card-img"><img src="${escapeAttribute(buildImageSrc("../", coverImage))}" alt="${escapeAttribute(coverAlt)}" class="image-cover-fill" loading="lazy" decoding="async" /></div>
          <div class="blog-card-body">
            <span class="blog-card-tag">${escapeHtml(post.categoryLabel.toUpperCase())}</span>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.description)}</p>
            <div class="blog-card-meta"><span>${escapeHtml(formatMonthYear(post.publishedAt))}</span><span>·</span><span>${post.readingTime} min</span></div>
            <span class="blog-card-cta">Leer más →</span>
          </div>
        </a>`;
}

function renderRelatedCard(post) {
  const coverImage = resolveCoverImage(post);
  const coverAlt = resolveCoverAlt(post);

  return `        <a href="${escapeAttribute(post.slug)}.html" class="blog-card">
          <div class="blog-card-img"><img src="${escapeAttribute(buildImageSrc("../../", coverImage))}" alt="${escapeAttribute(coverAlt)}" class="image-cover-fill" loading="lazy" decoding="async" /></div>
          <div class="blog-card-body">
            <span class="blog-card-tag">${escapeHtml(post.categoryLabel.toUpperCase())}</span>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.description)}</p>
            <span class="blog-card-cta">Leer más →</span>
          </div>
        </a>`;
}

function buildBreadcrumbJsonLd(post) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: pageUrl("index.html")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Recursos",
        item: pageUrl("index.html#recursos")
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Blog",
        item: pageUrl(site.blogIndexPath)
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: slugToUrl(post.slug)
      }
    ]
  };
}

function renderArticlePage(post, allPosts, previousPost, nextPost) {
  const relatedPosts = buildRelatedPosts(allPosts, post, 3);
  const share = buildShareUrls(post);
  const articlePath = `recursos/blog/${post.slug}.html`;
  const canonicalUrl = slugToUrl(post.slug);
  const articleCoverImage = resolveCoverImage(post);
  const articleCoverAlt = resolveCoverAlt(post);
  const imageUrl = isAbsoluteUrl(articleCoverImage) ? articleCoverImage : pageUrl(articleCoverImage);
  const keywords = (post.tags || []).map(cleanTag);
  const hasTags = keywords.length > 0;
  const homeHref = relativeHref(articlePath, site.homePath);
  const resourcesHref = `${homeHref}#recursos`;
  const blogHref = relativeHref(articlePath, site.blogIndexPath);
  const ctaPrimaryHref = relativeHref(articlePath, site.ctaPrimaryPath);
  const ctaSecondaryHref = relativeHref(articlePath, site.ctaSecondaryPath);
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [imageUrl],
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,
    author: {
      "@type": "Organization",
      name: site.name
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: {
        "@type": "ImageObject",
        url: pageUrl(site.publisherLogo)
      }
    },
    mainEntityOfPage: canonicalUrl,
    articleSection: post.categoryLabel,
    ...(hasTags ? { keywords } : {})
  };
  const nextTarget = nextPost || allPosts[0];
  const prevLink = previousPost ? `<link rel="prev" href="${escapeAttribute(slugToUrl(previousPost.slug))}" />` : "";
  const nextLink = `<link rel="next" href="${escapeAttribute(slugToUrl(nextTarget.slug))}" />`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)} | Blog Clickie</title>
  <meta name="description" content="${escapeAttribute(post.description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta name="author" content="Clickie" />
  <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
  ${prevLink}
  ${nextLink}
  <meta property="og:locale" content="es_CL" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Clickie" />
  <meta property="og:title" content="${escapeAttribute(post.title)}" />
  <meta property="og:description" content="${escapeAttribute(post.description)}" />
  <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
  <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
  <meta property="article:published_time" content="${post.publishedAt}" />
  <meta property="article:modified_time" content="${post.modifiedAt}" />
  <meta property="article:section" content="${escapeAttribute(post.categoryLabel)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeAttribute(post.title)}" />
  <meta name="twitter:description" content="${escapeAttribute(post.description)}" />
  <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />
  <link rel="icon" type="image/png" href="../../assets/favicon-navbar.png" sizes="256x256" />
  <link rel="stylesheet" href="${fontAwesomeStylesheet}" />
  <link rel="stylesheet" href="../../styles/main.css" />
  ${renderStructuredData(articleStructuredData)}
  ${renderStructuredData(buildBreadcrumbJsonLd(post))}
</head>
<body>
<div data-site-shell="mobile-menu"></div>
<div data-site-shell="navbar"></div>

<section class="subpage-hero subpage-hero--flush">
  <div class="container article-hero">
    <div class="breadcrumb"><a href="${escapeAttribute(homeHref)}">Inicio</a> / <a href="${escapeAttribute(resourcesHref)}">Recursos</a> / <a href="${escapeAttribute(blogHref)}">Blog</a> / <span>${escapeHtml(post.title)}</span></div>
    <div class="article-meta">
      <span class="tag">${escapeHtml(post.categoryLabel)}</span>
      <span><i class="fa-solid fa-calendar-days" aria-hidden="true"></i> ${escapeHtml(formatLongDate(post.publishedAt))}</span>
      <span>·</span>
      <span>${post.readingTime} min de lectura</span>
    </div>
    <h1>${escapeHtml(post.title)}</h1>
    <p class="article-subtitle">${escapeHtml(post.subtitle)}</p>
  </div>
</section>

<section class="section section-surface-white">
  <div class="container">
    <img src="${escapeAttribute(buildImageSrc("../../", articleCoverImage))}" alt="${escapeAttribute(articleCoverAlt)}" class="article-cover article-cover-display" fetchpriority="high" />

    <div class="article-content">
${post.bodyHtml}
    </div>

    <div class="article-footer">
${hasTags ? `      <div class="article-tags">
${(post.tags || []).map((tag) => `        <span>#${escapeHtml(cleanTag(tag))}</span>`).join("\n")}
      </div>
` : ""}
      <div class="article-share">
        <span>Compartir:</span>
        <a href="${escapeAttribute(share.linkedin)}" target="_blank" rel="noopener" aria-label="Compartir en LinkedIn" title="LinkedIn"><i class="fa-solid fa-briefcase" aria-hidden="true"></i></a>
        <a href="${escapeAttribute(share.x)}" target="_blank" rel="noopener" aria-label="Compartir en X" title="X"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i></a>
        <a href="${escapeAttribute(share.email)}" aria-label="Compartir por email" title="Email"><i class="fa-solid fa-envelope" aria-hidden="true"></i></a>
      </div>
    </div>

    <div class="article-navigation">
      <a href="${escapeAttribute(homeHref)}" class="article-nav-card article-nav-card--home">
        <span class="article-nav-eyebrow">Volver al inicio</span>
        <strong>Ir al sitio principal de Clickie</strong>
        <span class="article-nav-copy">Servicios, casos de éxito y contacto.</span>
      </a>
      <a href="${escapeAttribute(`${nextTarget.slug}.html`)}" class="article-nav-card article-nav-card--next">
        <span class="article-nav-eyebrow">Leer siguiente</span>
        <strong>${escapeHtml(nextTarget.title)}</strong>
        <span class="article-nav-copy">Continúa explorando el blog de Clickie.</span>
      </a>
    </div>

    <div class="related-articles">
      <h2>Artículos relacionados</h2>
      <div class="blog-grid">
${relatedPosts.map(renderRelatedCard).join("\n")}
      </div>
    </div>
  </div>
</section>

<section class="cta-banner">
  <div class="container"><div class="cta-inner">
    <h2>${escapeHtml(site.ctaTitle)}</h2>
    <p>${escapeHtml(site.ctaBody)}</p>
    <div class="cta-actions">
      <a href="${escapeAttribute(ctaPrimaryHref)}" class="btn btn-outline-dark btn-lg">${escapeHtml(site.ctaPrimaryLabel)}</a>
      <a href="${escapeAttribute(ctaSecondaryHref)}" class="btn btn-primary btn-lg">${escapeHtml(site.ctaSecondaryLabel)} →</a>
    </div>
  </div></div>
</section>

<div data-site-shell="footer"></div>
<script src="../../scripts/shared-layout.js"></script>
<script src="../../scripts/main.js"></script>
</body>
</html>
`;
}

function renderBlogIndex(allPosts) {
  const homeHref = relativeHref(site.blogIndexPath, site.homePath);
  const resourcesHref = `${homeHref}#recursos`;
  const guidesHref = relativeHref(site.blogIndexPath, site.guidesIndexPath);
  const ctaPrimaryHref = relativeHref(site.blogIndexPath, site.ctaPrimaryPath);
  const socialPreviewPost = allPosts.find(
    (post) => post.coverImage && (isAbsoluteUrl(post.coverImage) || fileExists(post.coverImage))
  ) || allPosts[0];
  const socialPreviewImage = resolveCoverImage(socialPreviewPost);
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Clickie",
    description: "Artículos, casos de éxito y tendencias sobre eficiencia energética, gestión inteligente y sostenibilidad empresarial.",
    url: pageUrl(site.blogIndexPath)
  };
  const itemListStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: allPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: slugToUrl(post.slug),
      name: post.title
    }))
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog Clickie | Energía, eficiencia y sostenibilidad</title>
  <meta name="description" content="Artículos sobre eficiencia energética, sostenibilidad, casos de éxito y tendencias para empresas multisucursal en Latinoamérica." />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${escapeAttribute(pageUrl(site.blogIndexPath))}" />
  <meta property="og:locale" content="es_CL" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Clickie" />
  <meta property="og:title" content="Blog Clickie | Energía, eficiencia y sostenibilidad" />
  <meta property="og:description" content="Artículos sobre eficiencia energética, sostenibilidad, casos de éxito y tendencias para empresas multisucursal en Latinoamérica." />
  <meta property="og:url" content="${escapeAttribute(pageUrl(site.blogIndexPath))}" />
  <meta property="og:image" content="${escapeAttribute(isAbsoluteUrl(socialPreviewImage) ? socialPreviewImage : pageUrl(socialPreviewImage))}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Blog Clickie | Energía, eficiencia y sostenibilidad" />
  <meta name="twitter:description" content="Artículos sobre eficiencia energética, sostenibilidad, casos de éxito y tendencias para empresas multisucursal en Latinoamérica." />
  <meta name="twitter:image" content="${escapeAttribute(isAbsoluteUrl(socialPreviewImage) ? socialPreviewImage : pageUrl(socialPreviewImage))}" />
  <link rel="icon" type="image/png" href="../assets/favicon-navbar.png" sizes="256x256" />
  <link rel="stylesheet" href="${fontAwesomeStylesheet}" />
  <link rel="stylesheet" href="../styles/main.css" />
  ${renderStructuredData(blogStructuredData)}
  ${renderStructuredData(itemListStructuredData)}
</head>
<body>
<div data-site-shell="mobile-menu"></div>
<div data-site-shell="navbar"></div>

<section class="subpage-hero subpage-hero--blog">
  <div class="container">
    <div class="breadcrumb"><a href="${escapeAttribute(homeHref)}">Inicio</a> / <a href="${escapeAttribute(resourcesHref)}">Recursos</a> / Blog</div>
    <h1>Blog de <span class="accent">Energía y Sostenibilidad</span></h1>
    <p class="hero-desc">Una biblioteca de ideas prácticas para reducir costos, profesionalizar la gestión energética y convertir sostenibilidad en ventaja competitiva.</p>
  </div>
</section>

<section class="section section-surface-white">
  <div class="container">
    <div class="blog-filters">
${categories.map((category) => `      <button class="blog-filter-btn${category.key === "all" ? " active" : ""}" data-filter="${escapeAttribute(category.key)}">${escapeHtml(category.label)}</button>`).join("\n")}
    </div>

    <div class="blog-grid" id="blogGrid">
${allPosts.map(renderPostCard).join("\n")}
    </div>
    <div class="blog-pagination" id="blogPagination" aria-label="Paginación del blog"></div>
  </div>
</section>

<section class="cta-banner">
  <div class="container"><div class="cta-inner">
    <h2>¿Quieres optimizar la energía de tu empresa?</h2>
    <p>Habla con nuestros expertos y descubre cómo Clickie puede ayudarte.</p>
    <div class="cta-actions">
      <a href="${escapeAttribute(ctaPrimaryHref)}" class="btn btn-outline-dark btn-lg">Hablar con un experto</a>
      <a href="${escapeAttribute(guidesHref)}" class="btn btn-primary btn-lg">Ver guías gratuitas →</a>
    </div>
  </div></div>
</section>

<div data-site-shell="footer"></div>

<script>
const pageSize = 12;
const blogGrid = document.getElementById('blogGrid');
const pagination = document.getElementById('blogPagination');
const cards = Array.from(document.querySelectorAll('.blog-card'));
const filterButtons = Array.from(document.querySelectorAll('.blog-filter-btn'));
let currentFilter = 'all';
let currentPage = 1;

function getFilteredCards() {
  return cards.filter((card) => currentFilter === 'all' || card.dataset.category === currentFilter);
}

function scrollBlogToTop() {
  blogGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createPaginationButton(label, page, options = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'blog-pagination-btn';
  button.textContent = label;

  if (options.active) {
    button.classList.add('active');
    button.setAttribute('aria-current', 'page');
  }

  if (options.disabled) {
    button.disabled = true;
  } else {
    button.addEventListener('click', () => {
      currentPage = page;
      applyBlogListing();
      scrollBlogToTop();
    });
  }

  return button;
}

function renderPagination(totalPages) {
  pagination.innerHTML = '';
  pagination.classList.toggle('blog-pagination-hidden', totalPages <= 1);

  if (totalPages <= 1) {
    return;
  }

  pagination.appendChild(
    createPaginationButton('Anterior', currentPage - 1, { disabled: currentPage === 1 })
  );

  for (let page = 1; page <= totalPages; page += 1) {
    pagination.appendChild(
      createPaginationButton(String(page), page, { active: page === currentPage })
    );
  }

  pagination.appendChild(
    createPaginationButton('Siguiente', currentPage + 1, { disabled: currentPage === totalPages })
  );
}

function applyBlogListing() {
  const filteredCards = getFilteredCards();
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const visibleCards = new Set(filteredCards.slice(start, start + pageSize));

  cards.forEach((card) => {
    const visible = visibleCards.has(card);
    card.classList.toggle('blog-filtered-hidden', !visible);
  });

  renderPagination(totalPages);
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    applyBlogListing();
  });
});

applyBlogListing();
</script>

<script src="../scripts/shared-layout.js"></script>
<script src="../scripts/main.js"></script>
</body>
</html>
`;
}

function buildSitemap() {
  const htmlFiles = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      if (entry.name.startsWith(".")) {
        return;
      }

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (excludedHtmlPrefixes.some((prefix) => relativePath.startsWith(prefix))) {
        return;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
        return;
      }

      if (!entry.isFile() || !entry.name.endsWith(".html")) {
        return;
      }

      htmlFiles.push(relativePath);
    });
  }

  walk(rootDir);

  const urls = htmlFiles
    .sort()
    .map((relativePath) => {
      const stat = fs.statSync(path.join(rootDir, relativePath));
      const lastmod = stat.mtime.toISOString().slice(0, 10);

      return `  <url>
    <loc>${escapeHtml(pageUrl(relativePath.replace(/\\/g, "/")))}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${pageUrl("sitemap.xml")}
`;
}

function main() {
  const generatedOn = new Date().toISOString().slice(0, 10);
  const enrichedPosts = posts
    .map((post) => {
      const source = readSourcePost(post.sourceFile);
      const normalizedPost = {
        ...post,
        categoryLabel: resolveCategoryLabel(post.categoryKey),
        highlightPhrase: source.highlightPhrase
      };

      return {
        ...normalizedPost,
        bodyHtml: sanitizeArticleHtml(source.bodyHtml, normalizedPost),
        coverAlt: post.coverAlt || post.title,
        readingTime: post.readingTime || estimateReadingTime(source.bodyHtml),
        tags: source.tags,
        modifiedAt: generatedOn
      };
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  enrichedPosts.forEach((post, index) => {
    const previousPost = index === 0 ? null : enrichedPosts[index - 1];
    const nextPost = index === enrichedPosts.length - 1 ? null : enrichedPosts[index + 1];
    const pageHtml = renderArticlePage(post, enrichedPosts, previousPost, nextPost);

    writeFile(path.join(blogDir, `${post.slug}.html`), pageHtml);
  });

  writeFile(blogIndexFile, renderBlogIndex(enrichedPosts));
  writeFile(sitemapFile, buildSitemap());
  writeFile(robotsFile, buildRobots());

  console.log(`Blog generado: ${enrichedPosts.length} artículos, índice, sitemap y robots.`);
}

main();
