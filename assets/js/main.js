// Portfolio — Ira Eliezer
// Interactivité légère : header au scroll, reveal animations, menu mobile, formulaire

(function () {
  'use strict';

  // ---------- Header on scroll ----------
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Mobile nav toggle ----------
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  // ---------- Active nav link ----------
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // ---------- Contact form ----------
  const form = document.querySelector('#contact-form');
  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi en cours...';

      const data = new FormData(form);

      // Option 1 : Web3Forms (gratuit, sans backend)
      // Remplace YOUR_ACCESS_KEY par ta clé : https://web3forms.com (gratuit)
      const accessKey = form.dataset.accessKey;

      if (accessKey && accessKey !== 'YOUR_ACCESS_KEY') {
        try {
          const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: data
          });
          const json = await res.json();
          if (json.success) {
            status.classList.add('success');
            status.textContent = 'Message envoyé ! Je reviens vers vous très vite.';
            form.reset();
          } else {
            throw new Error(json.message || 'Erreur');
          }
        } catch (err) {
          status.classList.add('error');
          status.textContent = "Une erreur s'est produite. Réessayez ou écrivez-moi directement par email.";
        }
      } else {
        // Fallback : mailto (ouvre le client mail)
        const nom = data.get('nom') || '';
        const prenom = data.get('prenom') || '';
        const objet = data.get('objet') || 'Contact via portfolio';
        const message = data.get('message') || '';
        const body = `${message}\n\n— ${prenom} ${nom}`;
        window.location.href = `mailto:eliezeriras@gmail.com?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(body)}`;
        status.classList.add('success');
        status.textContent = 'Ouverture de votre client mail...';
      }

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
  }
})();
