/* ─────────────────────────────────────────────
   CLICKIE — Main JavaScript
   ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ─────────────────── */
  const navbar = document.getElementById('navbar');
  const alwaysScrolled = navbar.classList.contains('scrolled');
  const onScroll = () => {
    if (alwaysScrolled) return;
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Mobile menu ──────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  hamburger?.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose?.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  /* ── Mega dropdown (hover for desktop) ── */
  const dropdownIds = ['navDropdownServicios', 'navDropdownRecursos', 'navDropdownHistorias', 'navDropdownNosotros'];
  const dropdowns = dropdownIds.map(id => document.getElementById(id)).filter(Boolean);

  if (dropdowns.length) {
    const overlay = document.createElement('div');
    overlay.className = 'mega-dropdown-overlay';
    document.body.appendChild(overlay);

    function closeAllDropdowns() {
      dropdowns.forEach(d => d.classList.remove('open'));
      overlay.classList.remove('visible');
    }

    let closeTimer = null;

    dropdowns.forEach(dd => {
      const trigger = dd.querySelector('.nav-link-dropdown');
      if (!trigger) return;

      // Prevent click from scrolling the page
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
      });

      // Open on hover
      dd.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        closeAllDropdowns();
        dd.classList.add('open');
        overlay.classList.add('visible');
      });

      // Close on mouse leave with small delay
      dd.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(closeAllDropdowns, 200);
      });

      // Close when clicking a link inside the dropdown
      dd.querySelectorAll('.mega-dropdown a').forEach(link => {
        link.addEventListener('click', closeAllDropdowns);
      });
    });

    // Keep dropdown open when hovering the mega-dropdown panel
    dropdowns.forEach(dd => {
      const megaPanel = dd.querySelector('.mega-dropdown');
      if (!megaPanel) return;
      megaPanel.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
      });
      megaPanel.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(closeAllDropdowns, 200);
      });
    });

    overlay.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllDropdowns();
    });
  }

  /* ── Mobile Servicios submenu toggle ────────── */
  const mobileServiciosToggle = document.querySelector('.mobile-servicios-toggle');
  const mobileServiciosSub = document.querySelector('.mobile-servicios-sub');

  if (mobileServiciosToggle && mobileServiciosSub) {
    mobileServiciosToggle.addEventListener('click', () => {
      mobileServiciosToggle.classList.toggle('open');
      mobileServiciosSub.classList.toggle('open');
    });
    mobileServiciosSub.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ── Mobile Recursos submenu toggle ────────── */
  const mobileRecursosToggle = document.querySelector('.mobile-recursos-toggle');
  const mobileRecursosSub = document.querySelector('.mobile-recursos-sub');

  if (mobileRecursosToggle && mobileRecursosSub) {
    mobileRecursosToggle.addEventListener('click', () => {
      mobileRecursosToggle.classList.toggle('open');
      mobileRecursosSub.classList.toggle('open');
    });
    mobileRecursosSub.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ── Mobile Nosotros submenu toggle ────────── */
  const mobileNosotrosToggle = document.querySelector('.mobile-nosotros-toggle');
  const mobileNosotrosSub = document.querySelector('.mobile-nosotros-sub');

  if (mobileNosotrosToggle && mobileNosotrosSub) {
    mobileNosotrosToggle.addEventListener('click', () => {
      mobileNosotrosToggle.classList.toggle('open');
      mobileNosotrosSub.classList.toggle('open');
    });
    mobileNosotrosSub.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ── Mobile Historias submenu toggle ────────── */
  const mobileHistoriasToggle = document.querySelector('.mobile-historias-toggle');
  const mobileHistoriasSub = document.querySelector('.mobile-historias-sub');

  if (mobileHistoriasToggle && mobileHistoriasSub) {
    mobileHistoriasToggle.addEventListener('click', () => {
      mobileHistoriasToggle.classList.toggle('open');
      mobileHistoriasSub.classList.toggle('open');
    });
    mobileHistoriasSub.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });
  }

  /* ── Intersection Observer for animations ─── */
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(
    '.fade-in, .fade-in-left, .fade-in-right, .how-step, .metric-card, .testimonial-card'
  ).forEach(el => fadeObserver.observe(el));

  /* ── How-steps staggered delay ────────────── */
  document.querySelectorAll('.how-step').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.12}s`;
  });
  document.querySelectorAll('.metric-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
  });
  document.querySelectorAll('.testimonial-card').forEach((el, i) => {
    el.style.transitionDelay = `${i * 0.1}s`;
  });

  /* ── Hero image slider ───────────────────── */
  const heroSlider = document.querySelector('[data-hero-slider]');
  const heroSlides = heroSlider?.querySelectorAll('.hero-image-slide') || [];

  if (heroSlides.length > 1) {
    let currentSlide = 0;

    const setActiveSlide = (nextIndex) => {
      heroSlides[currentSlide]?.classList.remove('is-active');
      heroSlides[nextIndex]?.classList.add('is-active');
      currentSlide = nextIndex;
    };

    window.setInterval(() => {
      const nextIndex = (currentSlide + 1) % heroSlides.length;
      setActiveSlide(nextIndex);
    }, 4500);
  }

  /* ── Story image rotators ────────────────── */
  document.querySelectorAll('.story-image-rotator').forEach((rotator) => {
    const images = rotator.querySelectorAll('img');
    let index = 0;

    if (images.length <= 1) return;

    window.setInterval(() => {
      images[index]?.classList.remove('is-active');
      index = (index + 1) % images.length;
      images[index]?.classList.add('is-active');
    }, 4000);
  });

  /* ── Counter animation ────────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el) {
    const target  = parseFloat(el.dataset.count);
    const suffix  = el.dataset.suffix || '';
    const prefix  = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const duration = 1800;
    const frameRate = 16;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = easeOut(frame / totalFrames);
      const current  = target * progress;
      el.textContent = prefix + formatNumber(current, decimals) + suffix;
      if (frame === totalFrames) {
        el.textContent = prefix + formatNumber(target, decimals) + suffix;
        clearInterval(timer);
      }
    }, frameRate);
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatNumber(n, decimals) {
    if (n >= 1000) {
      const formatted = Math.round(n).toLocaleString('es-CL');
      return formatted;
    }
    return n.toFixed(decimals);
  }

  /* ── Smooth scrolling for anchor links ────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Analytics ───────────────────────────── */
  const analytics = window.clickieAnalytics;
  const normalizePath = (pathname) => pathname.replace(/\/+$/, '') || '/';
  const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const currentPath = normalizePath(window.location.pathname);
  const isHomePage = currentPath === '/' || currentPath.endsWith('/index.html');
  const pageGroup = analytics?.getPageGroup?.(currentPath) || null;
  const trackedPageGroups = new Set(['home', 'soluciones', 'recursos', 'contacto', 'calculadora']);

  const getAbsoluteUrl = (href) => {
    try {
      return new URL(href, window.location.href);
    } catch (error) {
      return null;
    }
  };

  const getElementLabel = (element) => normalizeText(
    element?.getAttribute('data-doc-name')
    || element?.getAttribute('aria-label')
    || element?.getAttribute('title')
    || element?.textContent
  );

  const getElementArea = (element) => {
    const area = element?.closest(
      'section[id], section[class], nav, footer, .cta-banner, .guia-card, .resource-card, .story-cta-clean, .video-section'
    );

    if (!area) return 'sitio';
    if (area.id) return area.id;

    const className = Array.from(area.classList || []).find((name) => !name.startsWith('fade-'));
    return className || area.tagName.toLowerCase();
  };

  const isYouTubeUrl = (url) => {
    const host = url?.hostname || '';
    return host.includes('youtube.com') || host.includes('youtu.be');
  };

  const isContactDestination = (href, url) => {
    if (!href) return false;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return true;
    if (href === '#contacto') return true;
    return normalizePath(url?.pathname || '').endsWith('/cotiza.html');
  };

  const getContactType = (href, url) => {
    if (href.startsWith('mailto:')) return 'email';
    if (href.startsWith('tel:')) return 'telefono';
    if (href === '#contacto') return 'seccion_contacto';
    if (normalizePath(url?.pathname || '').endsWith('/cotiza.html')) return 'cotizacion';
    return 'contacto';
  };

  const isCalculatorDestination = (url) => normalizePath(url?.pathname || '').endsWith('/recursos/calculadora.html');
  const getYouTubeVideoId = (url) => {
    if (!url) return '';
    if (url.hostname.includes('youtu.be')) {
      return normalizeText(url.pathname.replace(/^\//, ''));
    }
    if (url.hostname.includes('youtube.com')) {
      return normalizeText(url.searchParams.get('v') || url.pathname.split('/').pop());
    }
    return '';
  };

  if (analytics && trackedPageGroups.has(pageGroup)) {
    analytics.trackOnce(`page-group:${currentPath}`, () => {
      analytics.trackEvent(`view_${pageGroup}_page`, {
        page_group: pageGroup,
        page_path: currentPath,
        page_title: document.title
      });
    });
  }

  if (analytics && isHomePage) {
    analytics.trackOnce(`home-section:${currentPath}:home`, () => {
      analytics.trackEvent('view_home_section', {
        page_group: 'home',
        page_section: 'home',
        page_path: currentPath,
        page_title: document.title
      });
    });

    const trackedSections = [
      {
        id: 'servicios',
        name: 'soluciones',
        eventName: 'view_soluciones_section',
        virtualPath: '/#soluciones',
        pageTitle: 'Clickie | Soluciones'
      },
      {
        id: 'recursos',
        name: 'recursos',
        eventName: 'view_recursos_section',
        virtualPath: '/#recursos',
        pageTitle: 'Clickie | Recursos'
      },
      {
        id: 'contacto',
        name: 'contacto',
        eventName: 'view_contacto_section',
        virtualPath: '/#contacto',
        pageTitle: 'Clickie | Contacto'
      }
    ];

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const section = trackedSections.find((item) => item.id === entry.target.id);
        if (!section) return;

        analytics.trackOnce(`home-section:${currentPath}:${section.name}`, () => {
          analytics.trackEvent(section.eventName, {
            page_group: 'home',
            page_section: section.name,
            page_path: currentPath,
            page_title: document.title
          });

          analytics.trackSectionView(section.name, {
            page_group: 'home',
            virtual_path: section.virtualPath,
            page_title: section.pageTitle
          });
        });
      });
    }, {
      threshold: 0.45,
      rootMargin: '-10% 0px -30% 0px'
    });

    trackedSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        sectionObserver.observe(element);
      }
    });
  }

  if (analytics) {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const url = href ? getAbsoluteUrl(href) : null;
      const label = getElementLabel(target);
      const area = getElementArea(target);
      const destination = href
        ? (url ? `${normalizePath(url.pathname)}${url.hash || ''}` : href)
        : (target.getAttribute('data-doc-id') || target.id || '');
      const isCta = target.matches('.btn, .resource-btn, .guia-card, .guia-card-cta, .story-video-preview, .mega-featured-card, .social-link');

      if (isCta) {
        analytics.trackCtaClick({
          cta_text: label,
          cta_destination: destination,
          cta_area: area,
          cta_style: target.className
        });
      }

      if (href && isYouTubeUrl(url)) {
        analytics.trackVideoStart({
          video_id: getYouTubeVideoId(url),
          video_title: label || 'Video externo',
          video_provider: 'youtube',
          video_location: area,
          video_action: 'outbound_click'
        });
      }

      if (href && isContactDestination(href, url)) {
        analytics.trackContact({
          contact_type: getContactType(href, url),
          cta_text: label,
          cta_destination: destination,
          cta_area: area
        });
      }

      if (href && isCalculatorDestination(url)) {
        analytics.trackEvent('click_calculadora', analytics.getPageContext({
          cta_text: label,
          cta_destination: destination,
          cta_area: area
        }));
      }
    }, true);
  }

  /* ── Contact form ─────────────────────────── */
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = 'Mensaje enviado ✓';
      successMsg.classList.add('show');
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Enviar mensaje';
        btn.disabled = false;
        successMsg.classList.remove('show');
      }, 4000);
    }, 1200);
  });

  /* ── Lead capture modal ────────────────────── */
  const modal = document.getElementById('leadModal');
  const modalClose = document.getElementById('modalClose');
  const leadForm = document.getElementById('leadForm');
  const modalFormSection = document.getElementById('modalFormSection');
  const modalSuccess = document.getElementById('modalSuccess');

  // Open modal
  window.openLeadModal = function(resourceId, resourceName) {
    document.getElementById('leadResourceId').value = resourceId;
    document.getElementById('modalResourceName').textContent =
      `Completa tus datos para descargar: ${resourceName}`;
    modalFormSection.style.display = 'block';
    modalSuccess.classList.remove('show');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    analytics?.trackOnce(`form-view:lead-modal:${currentPath}:${resourceId}`, () => {
      analytics.trackFormView({
        form_id: resourceId,
        form_type: 'lead_modal',
        content_type: 'recurso',
        document_name: resourceName,
        delivery_method: 'email'
      });
    });
  };

  // Close modal
  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  analytics?.bindFormStart(leadForm, {
    once_key: `form-start:lead-modal:${currentPath}`,
    form_id: 'lead_modal',
    form_type: 'lead_modal',
    content_type: 'recurso',
    delivery_method: 'email'
  });

  // Submit lead form
  leadForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('leadName').value.trim();
    const email = document.getElementById('leadEmail').value.trim();
    const company = document.getElementById('leadCompany').value.trim();
    const resourceId = document.getElementById('leadResourceId').value;

    if (!name || !email || !company) return;

    // Save lead to localStorage
    const leads = JSON.parse(localStorage.getItem('clickie_leads') || '[]');
    leads.push({
      name, email, company, resourceId,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('clickie_leads', JSON.stringify(leads));

    analytics?.trackLead({
      form_id: resourceId || 'lead_modal',
      form_type: 'lead_modal',
      lead_source: 'website',
      content_type: 'recurso',
      delivery_method: 'email'
    });

    analytics?.trackDownload({
      form_id: resourceId || 'lead_modal',
      form_type: 'lead_modal',
      content_type: 'recurso',
      file_extension: 'pdf',
      delivery_method: 'email'
    });

    // Show success
    modalFormSection.style.display = 'none';
    modalSuccess.classList.add('show');
    leadForm.reset();

    // Auto-close after 3s
    setTimeout(closeModal, 3000);
  });

});

/* ── Video click-to-play ─────────────────── */
function playClickieVideo(wrapper) {
  window.clickieAnalytics?.trackVideoStart({
    video_id: 'DXF10lbkIf4',
    video_title: 'Video Clickie',
    video_provider: 'youtube',
    video_location: 'video-clickie',
    video_action: 'inline_play'
  });

  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube.com/embed/DXF10lbkIf4?autoplay=1&rel=0';
  iframe.title = 'Revoluciona tu Consumo Energético con Clickie';
  iframe.frameBorder = '0';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  wrapper.innerHTML = '';
  wrapper.appendChild(iframe);
  wrapper.classList.remove('has-thumbnail');
  wrapper.style.cursor = 'default';
  wrapper.onclick = null;
}
