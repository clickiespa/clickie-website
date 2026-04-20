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

    // Show success
    modalFormSection.style.display = 'none';
    modalSuccess.classList.add('show');
    leadForm.reset();

    // Auto-close after 3s
    setTimeout(closeModal, 3000);
  });

});
