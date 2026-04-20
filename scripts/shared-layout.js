(function () {
  var currentScript = document.currentScript;
  var GA_MEASUREMENT_ID = "G-TYPPJZ22DC";
  var HUBSPOT_PORTAL_ID = "46669151";

  if (!currentScript) {
    return;
  }

  var siteRootUrl = new URL("../", currentScript.src);
  var currentUrl = new URL(window.location.href);

  function ensureSharedAssets() {
    var head = document.head;

    if (head && !document.querySelector('link[data-shared-fontawesome="true"]')) {
      var fa = document.createElement("link");
      fa.rel = "stylesheet";
      fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
      fa.setAttribute("data-shared-fontawesome", "true");
      head.appendChild(fa);
    }
  }

  function ensureThirdPartyIntegrations() {
    var head = document.head;

    if (!head) {
      return;
    }

    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID + '"]')) {
      var gaLoader = document.createElement("script");
      gaLoader.async = true;
      gaLoader.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
      gaLoader.setAttribute("data-shared-ga-loader", "true");
      head.appendChild(gaLoader);
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    if (!window.__clickieGaInitialized) {
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID);
      window.__clickieGaInitialized = true;
    }

    if (
      !document.getElementById("hs-script-loader") &&
      !document.querySelector('script[src*="js.hs-scripts.com/' + HUBSPOT_PORTAL_ID + '.js"]')
    ) {
      var hubspotLoader = document.createElement("script");
      hubspotLoader.type = "text/javascript";
      hubspotLoader.id = "hs-script-loader";
      hubspotLoader.async = true;
      hubspotLoader.defer = true;
      hubspotLoader.src = "https://js.hs-scripts.com/" + HUBSPOT_PORTAL_ID + ".js";
      head.appendChild(hubspotLoader);
    }
  }

  function normalizePath(pathname) {
    return pathname.replace(/\/+$/, "") || "/";
  }

  function siteUrl(path) {
    return new URL(path, siteRootUrl).href;
  }

  function isCurrentPage(path) {
    return currentPath === normalizePath(new URL(path, siteRootUrl).pathname);
  }

  function dropdownItemClass(path, extraClass) {
    var classes = "mega-item";

    if (extraClass) {
      classes += " " + extraClass;
    }

    if (path && isCurrentPage(path)) {
      classes += " mega-item--active";
    }

    return classes;
  }

  var currentPath = normalizePath(currentUrl.pathname);
  var homePath = normalizePath(new URL("index.html", siteRootUrl).pathname);
  var rootPath = normalizePath(siteRootUrl.pathname);
  var isHome = currentPath === homePath || currentPath === rootPath;
  var navbarClass = isHome ? "navbar" : "navbar scrolled";
  var logoHref = isHome ? "#hero" : siteUrl("index.html");
  var serviciosHref = isHome ? "#servicios" : siteUrl("index.html#servicios");
  var historiasHref = isHome ? "#historias" : siteUrl("index.html#historias");
  var recursosHref = isHome ? "#recursos" : siteUrl("index.html#recursos");
  var contactoHref = isHome ? "#contacto" : siteUrl("index.html#contacto");
  function mobileItemClass(path, extraClass) {
    var classes = "menu-item";

    if (extraClass) {
      classes += " " + extraClass;
    }

    if (path && isCurrentPage(path)) {
      classes += " active";
    }

    return classes;
  }

  var mobileCaseLink = isHome
    ? "<a href=\"#recursos\" class=\"" + mobileItemClass(null, "hidden") + "\" onclick=\"setTimeout(()=>openLeadModal('caso-oxxo','Caso de Éxito OXXO'),300)\"><i class=\"fa-solid fa-chart-line mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Caso de Éxito OXXO</span></a>"
    : "<a href=\"" + siteUrl("recursos/casos-de-exito.html") + "\" class=\"" + mobileItemClass("recursos/casos-de-exito.html", "hidden") + "\"><i class=\"fa-solid fa-chart-line mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Caso de Éxito OXXO</span></a>";

  var mobileMenu = ""
    + "<div class=\"mobile-menu menu-mobile\" id=\"mobileMenu\" role=\"dialog\" aria-modal=\"true\">"
    + "  <button class=\"mobile-menu-close menu-close\" id=\"mobileClose\" aria-label=\"Cerrar menú\"><i class=\"fa-solid fa-xmark\" aria-hidden=\"true\"></i></button>"
    + "  <button class=\"mobile-servicios-toggle menu-section-title\"><span>Servicios</span><i class=\"fa-solid fa-chevron-down dropdown-chevron menu-chevron\" aria-hidden=\"true\"></i></button>"
    + "  <div class=\"mobile-servicios-sub menu-section\">"
    + "    <a href=\"" + siteUrl("servicios/ubm.html") + "\" class=\"" + mobileItemClass("servicios/ubm.html") + "\"><i class=\"fa-solid fa-file-lines mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>UBM — Gestión de Suministros</span></a>"
    + "    <a href=\"" + siteUrl("servicios/ems.html") + "\" class=\"" + mobileItemClass("servicios/ems.html") + "\"><i class=\"fa-solid fa-chart-column mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>EMS — Monitoreo y Optimización</span></a>"
    + "    <a href=\"" + siteUrl("servicios/bms.html") + "\" class=\"" + mobileItemClass("servicios/bms.html") + "\"><i class=\"fa-solid fa-desktop mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>BMS — Control Inteligente</span></a>"
    + "    <a href=\"" + siteUrl("servicios/remarcacion.html") + "\" class=\"" + mobileItemClass("servicios/remarcacion.html") + "\"><i class=\"fa-solid fa-bolt mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Remarcación y Submetering</span></a>"
    + "    <div class=\"mobile-sub-divider menu-divider\"></div>"
    + "    <span class=\"mobile-subheading menu-subheading\">Por Rubro</span>"
    + "    <a href=\"" + siteUrl("servicios/gestion-retail.html") + "\" class=\"" + mobileItemClass("servicios/gestion-retail.html") + "\"><i class=\"fa-solid fa-store mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Retail</span></a>"
    + "    <a href=\"" + siteUrl("servicios/eficiencia-energetica.html") + "\" class=\"" + mobileItemClass("servicios/eficiencia-energetica.html") + "\"><i class=\"fa-solid fa-industry mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Industria</span></a>"
    + "  </div>"
    + "  <button class=\"mobile-historias-toggle menu-section-title\"><span>Historias de éxito</span><i class=\"fa-solid fa-chevron-down dropdown-chevron menu-chevron\" aria-hidden=\"true\"></i></button>"
    + "  <div class=\"mobile-historias-sub menu-section\">"
    + "    <a href=\"" + siteUrl("historias/oxxo.html") + "\" class=\"" + mobileItemClass("historias/oxxo.html") + "\"><i class=\"fa-solid fa-store mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>OXXO</span></a>"
    + "    <a href=\"" + siteUrl("historias/starbucks.html") + "\" class=\"" + mobileItemClass("historias/starbucks.html") + "\"><i class=\"fa-solid fa-mug-hot mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Starbucks</span></a>"
    + "    <a href=\"" + siteUrl("historias/copec.html") + "\" class=\"" + mobileItemClass("historias/copec.html") + "\"><i class=\"fa-solid fa-gas-pump mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>COPEC</span></a>"
    + "    <a href=\"" + siteUrl("historias/lipigas.html") + "\" class=\"" + mobileItemClass("historias/lipigas.html") + "\"><i class=\"fa-solid fa-fire-flame-simple mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>LIPIGAS</span></a>"
    + "    <a href=\"" + siteUrl("historias/tattersall.html") + "\" class=\"" + mobileItemClass("historias/tattersall.html") + "\"><i class=\"fa-solid fa-building mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Tattersall</span></a>"
    + "    <a href=\"" + siteUrl("historias/renova.html") + "\" class=\"" + mobileItemClass("historias/renova.html", "hidden") + "\"><i class=\"fa-solid fa-leaf mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>RENOVA</span></a>"
    + "    <a href=\"" + siteUrl("historias/preunic.html") + "\" class=\"" + mobileItemClass("historias/preunic.html") + "\"><i class=\"fa-solid fa-bag-shopping mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Preunic</span></a>"
    + "    <a href=\"" + siteUrl("historias/la-araucana.html") + "\" class=\"" + mobileItemClass("historias/la-araucana.html") + "\"><i class=\"fa-solid fa-leaf mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>La Araucana</span></a>"
    + "  </div>"
    + "  <button class=\"mobile-recursos-toggle menu-section-title\"><span>Recursos</span><i class=\"fa-solid fa-chevron-down dropdown-chevron menu-chevron\" aria-hidden=\"true\"></i></button>"
    + "  <div class=\"mobile-recursos-sub menu-section\">"
    + "    <a href=\"" + siteUrl("recursos/guias.html") + "\" class=\"" + mobileItemClass("recursos/guias.html") + "\"><i class=\"fa-solid fa-book-open mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Guías de Ahorro Energético</span></a>"
    +      mobileCaseLink
    + "    <a href=\"" + siteUrl("recursos/encuesta-madurez.html") + "\" class=\"" + mobileItemClass("recursos/encuesta-madurez.html") + "\"><i class=\"fa-solid fa-list-check mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Encuesta de Madurez Energética</span></a>"
    + "    <a href=\"https://www.youtube.com/@clickie4338\" target=\"_blank\" rel=\"noopener\" class=\"" + mobileItemClass(null) + "\"><i class=\"fa-solid fa-circle-play mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Canal de YouTube</span></a>"
    + "  </div>"
    + "  <button class=\"mobile-nosotros-toggle menu-section-title\"><span>Nosotros</span><i class=\"fa-solid fa-chevron-down dropdown-chevron menu-chevron\" aria-hidden=\"true\"></i></button>"
    + "  <div class=\"mobile-nosotros-sub menu-section\">"
    + "    <a href=\"" + siteUrl("nosotros.html") + "\" class=\"" + mobileItemClass("nosotros.html") + "\"><i class=\"fa-solid fa-bullseye mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Nuestros Valores</span></a>"
    + "    <a href=\"" + siteUrl("nosotros/prensa.html") + "\" class=\"" + mobileItemClass("nosotros/prensa.html") + "\"><i class=\"fa-solid fa-newspaper mobile-sub-icon menu-item-icon\" aria-hidden=\"true\"></i><span>Clickie en la Prensa</span></a>"
    + "  </div>"
    + "  <a href=\"" + contactoHref + "\" class=\"nav-link menu-section-title menu-link-primary\">Contacto</a>"
    + "  <a href=\"https://app.clickie.io/\" class=\"nav-link menu-link-secondary\" target=\"_blank\" rel=\"noopener\">Iniciar sesión</a>"
    + "  <div class=\"menu-cta\">"
    + "    <a href=\"" + siteUrl("cotiza.html") + "\" class=\"btn btn-primary\">Cotiza aquí</a>"
    + "  </div>"
    + "</div>";

  var navbar = ""
    + "<nav class=\"" + navbarClass + "\" id=\"navbar\" role=\"navigation\" aria-label=\"Navegación principal\">"
    + "  <div class=\"container\">"
    + "    <div class=\"navbar-inner\">"
    + "      <a href=\"" + logoHref + "\" class=\"navbar-logo\" aria-label=\"Clickie inicio\">"
    + "        Clickie"
    + "      </a>"
    + "      <div class=\"navbar-nav\">"
    + "        <div class=\"nav-dropdown\" id=\"navDropdownServicios\">"
    + "          <a href=\"" + serviciosHref + "\" class=\"nav-link nav-link-dropdown\">Servicios <svg class=\"dropdown-chevron\" width=\"10\" height=\"6\" viewBox=\"0 0 10 6\" fill=\"none\"><path d=\"M1 1L5 5L9 1\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></a>"
    + "          <div class=\"mega-dropdown mega-dropdown--services\" id=\"megaDropdownServicios\">"
    + "            <div class=\"mega-dropdown-inner mega-dropdown-layout mega-dropdown-layout--services\">"
    + "              <div class=\"mega-dropdown-section\">"
    + "                <span class=\"mega-dropdown-section-title\">POR SOLUCIÓN</span>"
    + "                <div class=\"mega-dropdown-items\">"
    + "                  <a href=\"" + siteUrl("servicios/ubm.html") + "\" class=\"" + dropdownItemClass("servicios/ubm.html") + "\">"
    + "                    <div class=\"mega-item-icon\"><i class=\"fa-solid fa-file-invoice\" aria-hidden=\"true\"></i></div>"
    + "                    <div class=\"mega-item-content\"><strong>UBM</strong></div>"
    + "                  </a>"
    + "                  <a href=\"" + siteUrl("servicios/ems.html") + "\" class=\"" + dropdownItemClass("servicios/ems.html") + "\">"
    + "                    <div class=\"mega-item-icon\"><i class=\"fa-solid fa-chart-column\" aria-hidden=\"true\"></i></div>"
    + "                    <div class=\"mega-item-content\"><strong>EMS</strong></div>"
    + "                  </a>"
    + "                  <a href=\"" + siteUrl("servicios/bms.html") + "\" class=\"" + dropdownItemClass("servicios/bms.html") + "\">"
    + "                    <div class=\"mega-item-icon\"><i class=\"fa-solid fa-sliders\" aria-hidden=\"true\"></i></div>"
    + "                    <div class=\"mega-item-content\"><strong>BMS</strong></div>"
    + "                  </a>"
    + "                  <a href=\"" + siteUrl("servicios/remarcacion.html") + "\" class=\"" + dropdownItemClass("servicios/remarcacion.html") + "\">"
    + "                    <div class=\"mega-item-icon\"><i class=\"fa-solid fa-bolt\" aria-hidden=\"true\"></i></div>"
    + "                    <div class=\"mega-item-content\"><strong>Remarcación</strong></div>"
    + "                  </a>"
    + "                </div>"
    + "              </div>"
    + "              <div class=\"mega-dropdown-section\">"
    + "                <span class=\"mega-dropdown-section-title\">POR RUBRO</span>"
    + "                <div class=\"mega-dropdown-items\">"
    + "                  <a href=\"" + siteUrl("servicios/gestion-retail.html") + "\" class=\"" + dropdownItemClass("servicios/gestion-retail.html") + "\">"
    + "                    <div class=\"mega-item-icon\"><i class=\"fa-solid fa-store\" aria-hidden=\"true\"></i></div>"
    + "                    <div class=\"mega-item-content\"><strong>Retail</strong></div>"
    + "                  </a>"
    + "                  <a href=\"" + siteUrl("servicios/eficiencia-energetica.html") + "\" class=\"" + dropdownItemClass("servicios/eficiencia-energetica.html") + "\">"
    + "                    <div class=\"mega-item-icon\"><i class=\"fa-solid fa-industry\" aria-hidden=\"true\"></i></div>"
    + "                    <div class=\"mega-item-content\"><strong>Industria</strong></div>"
    + "                  </a>"
    + "                </div>"
    + "              </div>"
    + "            </div>"
    + "          </div>"
    + "        </div>"
    + "        <div class=\"nav-dropdown\" id=\"navDropdownHistorias\">"
    + "          <a href=\"" + historiasHref + "\" class=\"nav-link nav-link-dropdown\">Historias de éxito <svg class=\"dropdown-chevron\" width=\"10\" height=\"6\" viewBox=\"0 0 10 6\" fill=\"none\"><path d=\"M1 1L5 5L9 1\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></a>"
    + "          <div class=\"mega-dropdown mega-dropdown--compact mega-dropdown--historias\" id=\"megaDropdownHistorias\">"
    + "            <div class=\"mega-dropdown-inner mega-dropdown-layout mega-dropdown-layout--compact-1col\">"
    + "              <div class=\"mega-dropdown-section\">"
    + "                <span class=\"mega-dropdown-section-title\">CASOS DESTACADOS</span>"
    + "                <div class=\"mega-dropdown-items mega-dropdown-items--stories-simple\">"
    + "                  <a href=\"" + siteUrl("historias/oxxo.html") + "\" class=\"" + dropdownItemClass("historias/oxxo.html", "mega-item--story-logo") + "\" aria-label=\"OXXO\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/oxxo.png") + "\" alt=\"OXXO\" class=\"mega-item-logo mega-item-logo--oxxo\" /></div></a>"
    + "                  <a href=\"" + siteUrl("historias/starbucks.html") + "\" class=\"" + dropdownItemClass("historias/starbucks.html", "mega-item--story-logo") + "\" aria-label=\"Starbucks\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/starbucks.png") + "\" alt=\"Starbucks\" class=\"mega-item-logo mega-item-logo--starbucks\" /></div></a>"
    + "                  <a href=\"" + siteUrl("historias/copec.html") + "\" class=\"" + dropdownItemClass("historias/copec.html", "mega-item--story-logo") + "\" aria-label=\"COPEC\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/copec.svg") + "\" alt=\"COPEC\" class=\"mega-item-logo mega-item-logo--copec\" /></div></a>"
    + "                  <a href=\"" + siteUrl("historias/lipigas.html") + "\" class=\"" + dropdownItemClass("historias/lipigas.html", "mega-item--story-logo") + "\" aria-label=\"Lipigas\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/lipigas.png") + "\" alt=\"Lipigas\" class=\"mega-item-logo mega-item-logo--lipigas\" /></div></a>"
    + "                  <a href=\"" + siteUrl("historias/tattersall.html") + "\" class=\"" + dropdownItemClass("historias/tattersall.html", "mega-item--story-logo") + "\" aria-label=\"Tattersall\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/tattersall.png") + "\" alt=\"Tattersall\" class=\"mega-item-logo mega-item-logo--tattersall\" /></div></a>"
    + "                  <a href=\"" + siteUrl("historias/preunic.html") + "\" class=\"" + dropdownItemClass("historias/preunic.html", "mega-item--story-logo") + "\" aria-label=\"Preunic\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/preunic.png") + "\" alt=\"Preunic\" class=\"mega-item-logo mega-item-logo--preunic\" /></div></a>"
    + "                  <a href=\"" + siteUrl("historias/la-araucana.html") + "\" class=\"" + dropdownItemClass("historias/la-araucana.html", "mega-item--story-logo") + "\" aria-label=\"La Araucana\"><div class=\"mega-item-logo-wrap\"><img src=\"" + siteUrl("assets/logos/la-araucana.png") + "\" alt=\"La Araucana\" class=\"mega-item-logo mega-item-logo--la-araucana\" /></div></a>"
    + "                </div>"
    + "              </div>"
    + "            </div>"
    + "          </div>"
    + "        </div>"
    + "        <div class=\"nav-dropdown\" id=\"navDropdownRecursos\">"
    + "          <a href=\"" + recursosHref + "\" class=\"nav-link nav-link-dropdown\">Recursos <svg class=\"dropdown-chevron\" width=\"10\" height=\"6\" viewBox=\"0 0 10 6\" fill=\"none\"><path d=\"M1 1L5 5L9 1\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></a>"
    + "          <div class=\"mega-dropdown mega-dropdown--compact mega-dropdown--recursos\" id=\"megaDropdownRecursos\">"
    + "            <div class=\"mega-dropdown-inner mega-dropdown-layout mega-dropdown-layout--compact-2col\">"
    + "              <div class=\"mega-dropdown-section\">"
    + "                <span class=\"mega-dropdown-section-title\">APRENDER</span>"
    + "                <div class=\"mega-dropdown-items\">"
    + "                  <a href=\"" + siteUrl("recursos/guias.html") + "\" class=\"" + dropdownItemClass("recursos/guias.html") + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-book-open\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>Guías</strong></div></a>"
    + "                  <a href=\"https://blog.clickie.io\" target=\"_blank\" rel=\"noopener\" class=\"" + dropdownItemClass(null) + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-pen-nib\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>Blog</strong></div></a>"
    + "                  <a href=\"https://www.youtube.com/@clickie4338\" target=\"_blank\" rel=\"noopener\" class=\"" + dropdownItemClass(null) + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-circle-play\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>YouTube</strong></div></a>"
    + "                </div>"
    + "              </div>"
    + "              <div class=\"mega-dropdown-section\">"
    + "                <span class=\"mega-dropdown-section-title\">EVALUAR</span>"
    + "                <div class=\"mega-dropdown-items\">"
    + "                  <a href=\"" + siteUrl("recursos/casos-de-exito.html") + "\" class=\"" + dropdownItemClass("recursos/casos-de-exito.html", "hidden") + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-chart-line\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>Casos de éxito</strong></div></a>"
    + "                  <a href=\"" + siteUrl("recursos/encuesta-madurez.html") + "\" class=\"" + dropdownItemClass("recursos/encuesta-madurez.html") + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-list-check\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>Encuesta</strong></div></a>"
    + "                </div>"
    + "              </div>"
    + "            </div>"
    + "          </div>"
    + "        </div>"
    + "        <div class=\"nav-dropdown\" id=\"navDropdownNosotros\">"
    + "          <a href=\"" + siteUrl("nosotros.html") + "\" class=\"nav-link nav-link-dropdown\">Nosotros <svg class=\"dropdown-chevron\" width=\"10\" height=\"6\" viewBox=\"0 0 10 6\" fill=\"none\"><path d=\"M1 1L5 5L9 1\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></a>"
    + "          <div class=\"mega-dropdown mega-dropdown--compact mega-dropdown--nosotros\" id=\"megaDropdownNosotros\">"
    + "            <div class=\"mega-dropdown-inner mega-dropdown-layout mega-dropdown-layout--compact-1col\">"
    + "              <div class=\"mega-dropdown-section\">"
    + "                <div class=\"mega-dropdown-items\">"
    + "                  <a href=\"" + siteUrl("nosotros.html") + "\" class=\"" + dropdownItemClass("nosotros.html") + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-bullseye\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>Nuestros valores</strong></div></a>"
    + "                  <a href=\"" + siteUrl("nosotros/prensa.html") + "\" class=\"" + dropdownItemClass("nosotros/prensa.html") + "\"><div class=\"mega-item-icon\"><i class=\"fa-solid fa-newspaper\" aria-hidden=\"true\"></i></div><div class=\"mega-item-content\"><strong>Clickie en la prensa</strong></div></a>"
    + "                </div>"
    + "              </div>"
    + "            </div>"
    + "          </div>"
    + "        </div>"
    + "        <a href=\"" + contactoHref + "\" class=\"nav-link\">Contacto</a>"
    + "        <a href=\"https://blog.clickie.io\" class=\"nav-link\" target=\"_blank\" rel=\"noopener\">Blog</a>"
    + "      </div>"
    + "      <div class=\"navbar-actions\">"
    + "        <a href=\"https://app.clickie.io/\" class=\"btn btn-outline btn-sm\" target=\"_blank\" rel=\"noopener\">Iniciar sesión</a>"
    + "        <a href=\"" + siteUrl("cotiza.html") + "\" class=\"btn btn-primary btn-sm\">Cotiza aquí</a>"
    + "      </div>"
    + "      <button class=\"hamburger\" id=\"hamburger\" aria-label=\"Abrir menú móvil\">"
    + "        <span></span><span></span><span></span>"
    + "      </button>"
    + "    </div>"
    + "  </div>"
    + "</nav>";

  var footer = ""
    + "<footer class=\"footer\" role=\"contentinfo\">"
    + "  <div class=\"container\">"
    + "    <div class=\"footer-main\">"
    + "      <div class=\"footer-brand\">"
    + "        <a href=\"" + logoHref + "\" class=\"navbar-logo navbar-logo--light\">"
    + "          Clickie"
    + "        </a>"
    + "        <p>Ayudamos a empresas en Chile y Latinoamérica a optimizar su consumo energético, logrando ahorros reales y operaciones más sostenibles.</p>"
    + "        <div class=\"social-links\">"
    + "          <a href=\"https://www.linkedin.com/company/onclickie\" class=\"social-link\" target=\"_blank\" rel=\"noopener\" aria-label=\"LinkedIn\"><i class=\"fa-solid fa-briefcase\" aria-hidden=\"true\"></i></a>"
    + "          <a href=\"https://www.youtube.com/@clickie4338\" class=\"social-link\" target=\"_blank\" rel=\"noopener\" aria-label=\"YouTube\"><i class=\"fa-solid fa-play\" aria-hidden=\"true\"></i></a>"
    + "          <a href=\"https://blog.clickie.io/\" class=\"social-link\" target=\"_blank\" rel=\"noopener\" aria-label=\"Blog\"><i class=\"fa-solid fa-pen-nib\" aria-hidden=\"true\"></i></a>"
    + "        </div>"
    + "      </div>"
    + "      <div class=\"footer-col\">"
    + "        <h4>Servicios</h4>"
    + "        <div class=\"footer-links\">"
    + "          <a href=\"" + siteUrl("servicios/remarcacion.html") + "\" class=\"footer-link\">Remarcación y Submetering</a>"
    + "          <a href=\"" + siteUrl("servicios/eficiencia-energetica.html") + "\" class=\"footer-link\">Eficiencia Energética</a>"
    + "          <a href=\"" + siteUrl("servicios/gestion-retail.html") + "\" class=\"footer-link\">Gestión Retail</a>"
    + "          <a href=\"" + siteUrl("servicios/gestion-hidrica.html") + "\" class=\"footer-link\">Gestión Hídrica</a>"
    + "          <a href=\"" + siteUrl("servicios/ubm.html") + "\" class=\"footer-link\">UBM</a>"
    + "          <a href=\"" + siteUrl("servicios/ems.html") + "\" class=\"footer-link\">Energy Management System</a>"
    + "        </div>"
    + "      </div>"
    + "      <div class=\"footer-col\">"
    + "        <h4>Historias de éxito</h4>"
    + "        <div class=\"footer-links\">"
    + "          <a href=\"" + siteUrl("historias/oxxo.html") + "\" class=\"footer-link\">OXXO — Tiendas inteligentes</a>"
    + "          <a href=\"" + siteUrl("historias/renova.html") + "\" class=\"footer-link hidden\">RENOVA — Energías renovables</a>"
    + "          <a href=\"" + siteUrl("historias/copec.html") + "\" class=\"footer-link\">COPEC — Estaciones de servicio</a>"
    + "          <a href=\"" + siteUrl("historias/lipigas.html") + "\" class=\"footer-link\">LIPIGAS — Industria gasífera</a>"
    + "          <a href=\"" + siteUrl("historias/la-araucana.html") + "\" class=\"footer-link\">La Araucana — Gestión sostenible</a>"
    + "        </div>"
    + "      </div>"
    + "      <div class=\"footer-col\">"
    + "        <h4>Acceso rápido</h4>"
    + "        <div class=\"footer-links\">"
    + "          <a href=\"https://app.clickie.io/\" class=\"footer-link\" target=\"_blank\">Ingresar a la plataforma</a>"
    + "          <a href=\"https://blog.clickie.io/\" class=\"footer-link\" target=\"_blank\">Blog</a>"
    + "          <a href=\"https://clickie.io/como-monitorear-energia-chile\" class=\"footer-link\" target=\"_blank\">Monitoreo IoT</a>"
    + "          <a href=\"https://clickie.io/monitoreo_de_energia\" class=\"footer-link\" target=\"_blank\">Monitoreo de Energía</a>"
    + "          <a href=\"mailto:hola@clickie.io\" class=\"footer-link\">hola@clickie.io</a>"
    + "        </div>"
    + "      </div>"
    + "    </div>"
    + "    <div class=\"footer-bottom\">"
    + "      <span class=\"footer-copy\">© 2017–2026 Desarrollos y Proyectos Clickie SpA. Todos los derechos reservados.</span>"
    + "      <div class=\"footer-legal\">"
    + "        <a href=\"https://es.clickie.io/tos\" target=\"_blank\" rel=\"noopener\">Términos y condiciones</a>"
    + "        <a href=\"https://es.clickie.io/privacy\" target=\"_blank\" rel=\"noopener\">Política de privacidad</a>"
    + "      </div>"
    + "    </div>"
    + "  </div>"
    + "</footer>";

  function mountLayout(name, markup) {
    var placeholders = document.querySelectorAll("[data-site-shell=\"" + name + "\"]");

    placeholders.forEach(function (placeholder) {
      placeholder.outerHTML = markup;
    });
  }

  ensureSharedAssets();
  ensureThirdPartyIntegrations();
  mountLayout("mobile-menu", mobileMenu);
  mountLayout("navbar", navbar);
  mountLayout("footer", footer);
})();
