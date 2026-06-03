// Admin Dashboard Module
// Full CRUD interface for managing players, tiers, and rankings

const Admin = {
  currentPlayerId: null,
  players: [],

  async init() {
    try {
      await Auth.requireAdmin();
      this.showDashboard();
      this.initTabs();
      this.initAddForm();
      await this.loadPlayers();
    } catch (err) {
      this.showLogin();
    }
  },

  // ── Auth UI ──
  showLogin() {
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login').style.display = 'flex';
  },

  showDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    const display = document.getElementById('admin-email-display');
    if (display && Auth.getCurrentUser()) {
      display.textContent = Auth.getCurrentUser().email;
    }
  },

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password';
      errorEl.style.display = 'block';
      return;
    }

    if (!Auth.isAdmin(email)) {
      errorEl.textContent = 'Access denied: admin credentials required';
      errorEl.style.display = 'block';
      return;
    }

    try {
      await Auth.login(email, password);
      errorEl.style.display = 'none';
      this.showDashboard();
      await this.loadPlayers();
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed';
      errorEl.style.display = 'block';
    }
  },

  async handleLogout() {
    await Auth.logout();
    this.showLogin();
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
  },

  // ── Tabs ──
  initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(tab.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  },

  // ── Load Players ──
  async loadPlayers() {
    try {
      this.players = await PlayerData.getAll();
      this.renderManageList();
    } catch (err) {
      App.toast('Failed to load players: ' + err.message, 'error');
    }
  },

  renderManageList() {
    const container = document.getElementById('manage-player-list');
    if (!container) return;

    if (this.players.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No players found.</p></div>';
      return;
    }

    container.innerHTML = this.players.map(p => {
      const initial = p.username ? p.username.charAt(0).toUpperCase() : '?';
      const avatarHtml = p.avatar
        ? `<img src="${App.escapeHtml(p.avatar)}" alt="">`
        : `<div class="admin-player-avatar-placeholder">${initial}</div>`;
      return `
        <div class="admin-player-item" onclick="Admin.editPlayer('${p.id}')">
          ${avatarHtml}
          <div class="admin-player-info">
            <div class="admin-player-name">${App.escapeHtml(p.username || 'Unknown')}</div>
            <div class="admin-player-detail">#${p.overallRank || '--'} · ${App.escapeHtml(p.title || 'No title')}</div>
          </div>
          <span class="admin-player-edit">Edit →</span>
        </div>
      `;
    }).join('');
  },

  // ── Add Player ──
  initAddForm() {
    const form = document.getElementById('add-player-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      await this.saveNewPlayer();
    });
  },

  async saveNewPlayer() {
    const data = this.collectFormData('add');
    if (!data.username) {
      App.toast('Username is required', 'error');
      return;
    }

    try {
      await PlayerData.add(data);
      App.toast('Player added successfully!', 'success');
      document.getElementById('add-player-form').reset();
      await this.loadPlayers();
    } catch (err) {
      App.toast('Failed to add player: ' + err.message, 'error');
    }
  },

  // ── Edit Player ──
  async editPlayer(id) {
    this.currentPlayerId = id;
    const player = await PlayerData.getById(id);
    if (!player) {
      App.toast('Player not found', 'error');
      return;
    }

    this.populateForm('edit', player);

    // Switch to edit tab
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="edit-panel"]').classList.add('active');
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('edit-panel').classList.add('active');
  },

  async saveEditPlayer() {
    if (!this.currentPlayerId) return;
    const data = this.collectFormData('edit');

    try {
      await PlayerData.update(this.currentPlayerId, data);
      App.toast('Player updated successfully!', 'success');
      await this.loadPlayers();
    } catch (err) {
      App.toast('Failed to update player: ' + err.message, 'error');
    }
  },

  async deletePlayer() {
    if (!this.currentPlayerId) {
      App.toast('No player selected', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await PlayerData.delete(this.currentPlayerId);
      App.toast('Player deleted', 'success');
      this.currentPlayerId = null;
      document.getElementById('edit-player-form').reset();
      await this.loadPlayers();
    } catch (err) {
      App.toast('Failed to delete player: ' + err.message, 'error');
    }
  },

  // ── Search ──
  initSearch() {
    const input = document.getElementById('admin-search-input');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      const items = document.querySelectorAll('.admin-player-item');
      items.forEach(item => {
        const name = item.querySelector('.admin-player-name');
        if (name) {
          item.style.display = name.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        }
      });
    });
  },

  // ── Form Helpers ──
  collectFormData(prefix) {
    const get = (id) => {
      const el = document.getElementById(`${prefix}-${id}`);
      return el ? el.value.trim() : '';
    };

    return {
      username: get('username'),
      avatar: get('avatar'),
      region: get('region'),
      title: get('title'),
      points: parseInt(get('points')) || 0,
      overallRank: parseInt(get('overallrank')) || 0,
      namemc: get('namemc'),
      discord: get('discord'),
      tiers: {
        ltms: get('tier-ltms'),
        vanilla: get('tier-vanilla'),
        uhc: get('tier-uhc'),
        pot: get('tier-pot'),
        nethop: get('tier-nethop'),
        smp: get('tier-smp'),
        sword: get('tier-sword'),
        axe: get('tier-axe'),
        mace: get('tier-mace')
      }
    };
  },

  populateForm(prefix, player) {
    const set = (id, value) => {
      const el = document.getElementById(`${prefix}-${id}`);
      if (el) el.value = value || '';
    };

    set('username', player.username);
    set('avatar', player.avatar);
    set('region', player.region);
    set('title', player.title);
    set('points', player.points);
    set('overallrank', player.overallRank);
    set('namemc', player.namemc);
    set('discord', player.discord);

    const tierFields = ['ltms', 'vanilla', 'uhc', 'pot', 'nethop', 'smp', 'sword', 'axe', 'mace'];
    tierFields.forEach(t => {
      const val = player.tiers && player.tiers[t] ? player.tiers[t] : '';
      const el = document.getElementById(`${prefix}-tier-${t}`);
      if (el) el.value = val;
    });
  },

  previewPlayer() {
    const data = this.collectFormData('edit');
    if (!data.username) {
      App.toast('Enter a username first', 'error');
      return;
    }

    App.toast(`Previewing ${data.username} — save to persist changes`, 'info');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Admin.init();
});
