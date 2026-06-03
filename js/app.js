// Main Application Module
// Handles shared functionality: navbar, search, modals, category bar

const App = {
  init() {
    this.initSearch();
    this.initMobileMenu();
    this.initModal();
    this.setActiveCategory();
  },

  // ── Global State ──
  allPlayers: [],

  // ── Toast Notification ──
  toast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  },

  // ── Search ──
  initSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    let debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      if (!q) {
        results.classList.remove('show');
        return;
      }
      debounceTimer = setTimeout(async () => {
        try {
          const matches = await PlayerData.search(q);
          if (matches.length === 0) {
            results.classList.remove('show');
            return;
          }
          results.innerHTML = matches.slice(0, 8).map(p => {
            const initial = p.username ? p.username.charAt(0).toUpperCase() : '?';
            const avatarHtml = p.avatar
              ? `<img src="${this.escapeHtml(p.avatar)}" alt="">`
              : `<div class="search-avatar-placeholder">${initial}</div>`;
            return `<div class="search-result-item" data-player-id="${this.escapeHtml(p.id)}">
              ${avatarHtml}
              <span>${this.escapeHtml(p.username)}</span>
            </div>`;
          }).join('');
          results.classList.add('show');
        } catch (err) {
          console.error('Search error:', err);
        }
      }, 250);
    });

    results.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item');
      if (item) {
        const playerId = item.dataset.playerId;
        if (playerId) {
          this.openPlayerModal(playerId);
        }
        results.classList.remove('show');
        input.value = '';
      }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar-search')) {
        results.classList.remove('show');
      }
    });
  },

  // ── Mobile Menu ──
  initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const links = document.querySelector('.navbar-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      links.classList.toggle('show');
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar') && links.classList.contains('show')) {
        links.classList.remove('show');
      }
    });
  },

  // ── Active Category ──
  setActiveCategory() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
      const href = card.getAttribute('href');
      if (href === currentPath) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    const navLinks = document.querySelectorAll('.navbar-links a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('active', href === currentPath);
    });
  },

  // ── Modal System ──
  initModal() {
    this.modalOverlay = document.getElementById('player-modal');
    this.modalClose = document.getElementById('modal-close');
    if (!this.modalOverlay) return;

    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modalOverlay.addEventListener('click', e => {
      if (e.target === this.modalOverlay) this.closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeModal();
    });
  },

  async openPlayerModal(playerId) {
    if (!this.modalOverlay) return;

    const body = this.modalOverlay.querySelector('.modal-body');
    body.innerHTML = '<div class="loading-spinner"></div>';
    this.modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
      const player = await PlayerData.getById(playerId);
      if (!player) {
        body.innerHTML = '<div class="empty-state"><p>Player not found</p></div>';
        return;
      }
      this.renderModal(player);
    } catch (err) {
      console.error('Modal error:', err);
      body.innerHTML = '<div class="empty-state"><p>Error loading player data</p></div>';
    }
  },

  renderModal(player) {
    const body = this.modalOverlay.querySelector('.modal-body');
    const initial = player.username ? player.username.charAt(0).toUpperCase() : '?';
    const avatarHtml = player.avatar
      ? `<img class="modal-avatar" src="${this.escapeHtml(player.avatar)}" alt="${this.escapeHtml(player.username)}">`
      : `<div class="modal-avatar-placeholder">${initial}</div>`;

    const rankClass = player.overallRank === 1 ? 'gold' : player.overallRank === 2 ? 'silver' : player.overallRank === 3 ? 'bronze' : '';
    const rankDisplay = player.overallRank ? `#${player.overallRank}` : '--';

    // Build tier items
    const tierCategories = [
      { key: 'vanilla', label: 'Vanilla', icon: 'vanilla' },
      { key: 'ltms', label: 'LTMs', icon: 'ltms' },
      { key: 'uhc', label: 'UHC', icon: 'uhc' },
      { key: 'pot', label: 'Pot', icon: 'pot' },
      { key: 'nethop', label: 'NethOP', icon: 'nethop' },
      { key: 'smp', label: 'SMP', icon: 'smp' },
      { key: 'sword', label: 'Sword', icon: 'sword' },
      { key: 'axe', label: 'Axe', icon: 'axe' },
      { key: 'mace', label: 'Mace', icon: 'mace' }
    ];

    const tierItems = tierCategories.map(cat => {
      const tier = player.tiers && player.tiers[cat.key];
      const tierClass = tier ? tier.toLowerCase() : 'none';
      const tierDisplay = tier || '--';
      return `
        <div class="modal-tier-item">
          <img src="assets/icons/${cat.icon}.svg" alt="${cat.label}">
          <span>${cat.label}</span>
          <span class="tier-tag ${tierClass}">${tierDisplay}</span>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div class="modal-player-header">
        ${avatarHtml}
        <div class="modal-player-info">
          <h2>${this.escapeHtml(player.username || 'Unknown')}</h2>
          <div class="player-title">${this.escapeHtml(player.title || 'Unranked')}</div>
          <div class="modal-player-meta">
            ${player.region ? `<span class="region-badge ${player.region.toLowerCase()}">${this.escapeHtml(player.region)}</span>` : ''}
            ${player.namemc ? `<a class="modal-btn-namemc" href="${this.escapeHtml(player.namemc)}" target="_blank" rel="noopener">NameMC ↗</a>` : ''}
          </div>
        </div>
      </div>

      <div class="modal-rank-section">
        <div>
          <div class="modal-rank-label">Overall Rank</div>
          <div class="modal-rank-value ${rankClass}">${rankDisplay}</div>
        </div>
        <div style="text-align:right">
          <div class="modal-rank-label">Points</div>
          <div class="modal-rank-points">${(player.points || 0).toLocaleString()}</div>
        </div>
      </div>

      <div class="modal-tier-section">
        <div class="section-label">Kit Tiers</div>
        <div class="modal-tier-grid">
          ${tierItems}
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-primary" onclick="App.copyUsername('${this.escapeHtml(player.username || '')}')">
          Copy Username
        </button>
        ${player.namemc ? `<a class="modal-btn modal-btn-secondary" href="${this.escapeHtml(player.namemc)}" target="_blank" rel="noopener">Open NameMC</a>` : ''}
        ${player.discord ? `<button class="modal-btn modal-btn-secondary" onclick="App.copyText('${this.escapeHtml(player.discord)}', 'Discord copied!')">Copy Discord</button>` : ''}
      </div>
    `;
  },

  closeModal() {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  },

  copyUsername(username) {
    if (!username) return;
    this.copyText(username, 'Username copied!');
  },

  copyText(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast(message || 'Copied!', 'success');
      }).catch(() => {
        this.fallbackCopy(text, message);
      });
    } else {
      this.fallbackCopy(text, message);
    }
  },

  fallbackCopy(text, message) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.toast(message || 'Copied!', 'success');
    } catch (e) {
      this.toast('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
