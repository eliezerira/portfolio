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

  // ---------- YouTube auto-fetch (RSS via rss2json) ----------
  const ytGrid = document.querySelector('#yt-grid');
  if (ytGrid) loadYouTubeVideos(ytGrid);

  async function loadYouTubeVideos(grid) {
    const channelId = grid.dataset.channelId;
    const excludeId = grid.dataset.exclude || '';
    const limit = parseInt(grid.dataset.limit, 10) || 6;
    const fallback = document.querySelector('#yt-fallback');

    if (!channelId) return;

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('Bad payload');

      const videos = data.items
        .map(item => {
          const id = (item.guid || '').split(':').pop() || extractIdFromLink(item.link);
          return { ...item, videoId: id };
        })
        .filter(v => v.videoId && v.videoId !== excludeId)
        .slice(0, limit);

      if (!videos.length) {
        if (fallback) fallback.hidden = false;
        grid.innerHTML = '';
        return;
      }

      grid.innerHTML = videos.map((v, i) => `
        <article class="video-card reveal ${i > 0 ? 'reveal-delay-' + Math.min(i, 3) : ''}">
          <a href="${escapeAttr(v.link)}" target="_blank" rel="noopener" class="video-thumb-link" aria-label="Regarder : ${escapeAttr(v.title)}">
            <div class="thumb">
              <img src="https://i.ytimg.com/vi/${escapeAttr(v.videoId)}/hqdefault.jpg"
                   alt="${escapeAttr(v.title)}"
                   loading="lazy" />
              <div class="play-overlay" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </a>
          <div class="video-card-body">
            <div class="card-meta">
              <span>${formatDate(v.pubDate)}</span>
            </div>
            <h3>${escapeHtml(v.title)}</h3>
            <a href="${escapeAttr(v.link)}" target="_blank" rel="noopener" class="card-cta">
              Regarder sur YouTube
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
            </a>
          </div>
        </article>
      `).join('');

      // Re-attache l'observer pour les nouveaux .reveal
      grid.querySelectorAll('.reveal').forEach(el => {
        // Force la visibilité (fade-in immédiat) si déjà dans le viewport
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) el.classList.add('in');
      });
    } catch (err) {
      console.error('[YouTube fetch] Échec :', err);
      grid.innerHTML = '';
      if (fallback) fallback.hidden = false;
    }
  }

  function extractIdFromLink(link) {
    if (!link) return '';
    const m = link.match(/[?&]v=([^&]+)/) || link.match(/youtu\.be\/([^?&]+)/);
    return m ? m[1] : '';
  }

  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return ''; }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

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
