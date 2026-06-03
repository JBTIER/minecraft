// Rankings Module
// Renders rankings tables and tier column layouts on category pages

const Rankings = {
  currentCategory: 'overall',

  async init() {
    this.detectCategory();
    await this.render();
  },

  detectCategory() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const map = {
      'index.html': 'overall',
      'rankings.html': 'overall',
      'ltms.html': 'ltms',
      'vanilla.html': 'vanilla',
      'uhc.html': 'uhc',
      'pot.html': 'pot',
      'nethop.html': 'nethop',
      'smp.html': 'smp',
      'sword.html': 'sword',
      'axe.html': 'axe',
      'mace.html': 'mace'
    };
    this.currentCategory = map[path] || 'overall';
  },

  async render() {
    try {
      const players = await PlayerData.getAll();

      // Render rankings table if it exists
      this.renderTable(players);

      // Render tier columns if it exists
      this.renderTiers(players);

      // Update page title
      this.updatePageTitle();
    } catch (err) {
      console.error('Rankings render error:', err);
      const tbody = document.getElementById('rankings-body');
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-secondary);">Failed to load rankings. Make sure Firebase is configured correctly.</td></tr>';
      }
    }
  },

  renderTable(players) {
    const tbody = document.getElementById('rankings-body');
    if (!tbody) return;

    if (players.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-secondary);">No players found. Add players from the admin panel.</td></tr>';
      return;
    }

    tbody.innerHTML = players.map(p => {
      const rankClass = p.overallRank === 1 ? 'gold' : p.overallRank === 2 ? 'silver' : p.overallRank === 3 ? 'bronze' : 'default';
      const rankDisplay = p.overallRank ? p.overallRank : '--';
      const initial = p.username ? p.username.charAt(0).toUpperCase() : '?';
      const avatarHtml = p.avatar
        ? `<img class="player-avatar" src="${App.escapeHtml(p.avatar)}" alt="${App.escapeHtml(p.username)}">`
        : `<div class="player-avatar-placeholder">${initial}</div>`;

      const tierCircles = this.getTierCircles(p);

      return `
        <tr onclick="App.openPlayerModal('${p.id}')">
          <td>
            <span class="rank-badge ${rankClass}">${rankDisplay}</span>
          </td>
          <td>
            <div class="player-cell">
              ${avatarHtml}
              <div class="player-info">
                <div class="player-name">${App.escapeHtml(p.username || 'Unknown')}</div>
                <div class="player-title">${App.escapeHtml(p.title || '')}</div>
                <div class="player-points">${(p.points || 0).toLocaleString()} pts</div>
              </div>
            </div>
          </td>
          <td>
            ${p.region ? `<span class="region-badge ${p.region.toLowerCase()}">${App.escapeHtml(p.region)}</span>` : '<span class="region-badge" style="opacity:0.3;">--</span>'}
          </td>
          <td>
            <div class="tier-ratings">
              ${tierCircles}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  getTierCircles(player) {
    const tiers = player.tiers || {};
    const categories = ['vanilla', 'ltms', 'uhc', 'pot', 'nethop', 'smp', 'sword', 'axe', 'mace'];
    return categories.map(cat => {
      const tier = tiers[cat];
      if (!tier) return '';
      const cls = tier.toLowerCase();
      return `
        <div class="tier-rating">
          <div class="tier-circle ${cls}">${tier.replace('T', '')}</div>
          <span class="tier-label">${App.escapeHtml(tier)}</span>
        </div>
      `;
    }).join('');
  },

  renderTiers(players) {
    const container = document.getElementById('kit-tiers-container');
    if (!container) return;

    if (this.currentCategory === 'overall' || this.currentCategory === 'rankings') {
      container.innerHTML = '';
      return;
    }

    const categoryPlayers = players.filter(p =>
      p.tiers && p.tiers[this.currentCategory]
    );

    const tierKeys = ['ht1', 'ht2', 'ht3', 'lt1', 'lt2'];
    const tierLabels = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'];
    const tierColors = ['tier-1', 'tier-2', 'tier-3', 'tier-4', 'tier-5'];

    const tiered = { ht1: [], ht2: [], ht3: [], lt1: [], lt2: [] };
    categoryPlayers.forEach(p => {
      const t = (p.tiers[this.currentCategory] || '').toLowerCase();
      if (tiered[t]) {
        tiered[t].push(p);
      }
    });

    container.innerHTML = tierKeys.map((key, i) => {
      const playersInTier = tiered[key];
      const playersHtml = playersInTier.length > 0
        ? playersInTier.map(p => {
            const initial = p.username ? p.username.charAt(0).toUpperCase() : '?';
            const avatarHtml = p.avatar
              ? `<img class="tier-player-avatar" src="${App.escapeHtml(p.avatar)}" alt="${App.escapeHtml(p.username)}">`
              : `<div class="tier-player-avatar-placeholder">${initial}</div>`;
            const rankDisplay = p.overallRank ? `#${p.overallRank}` : '';
            return `
              <div class="tier-player" onclick="App.openPlayerModal('${p.id}')">
                ${avatarHtml}
                <div class="tier-player-info">
                  <div class="tier-player-name">${App.escapeHtml(p.username || 'Unknown')}</div>
                  <div class="tier-player-rank">${rankDisplay}</div>
                </div>
              </div>
            `;
          }).join('')
        : '<div class="tier-empty">No players</div>';

      return `
        <div class="tier-column">
          <div class="tier-column-header ${tierColors[i]}">${tierLabels[i]}</div>
          <div class="tier-players">${playersHtml}</div>
        </div>
      `;
    }).join('');
  },

  updatePageTitle() {
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    if (!titleEl) return;

    const names = {
      overall: { title: 'Overall Rankings', subtitle: 'Top players ranked across all gamemodes' },
      ltms: { title: 'LTMs Rankings', subtitle: 'Limited Time Modes leaderboard' },
      vanilla: { title: 'Vanilla Rankings', subtitle: 'Vanilla gameplay leaderboard' },
      uhc: { title: 'UHC Rankings', subtitle: 'Ultra Hard Core leaderboard' },
      pot: { title: 'Pot Rankings', subtitle: 'PvP Potion leaderboard' },
      nethop: { title: 'NethOP Rankings', subtitle: 'Nether OP leaderboard' },
      smp: { title: 'SMP Rankings', subtitle: 'Survival Multiplayer leaderboard' },
      sword: { title: 'Sword Rankings', subtitle: 'Sword PvP leaderboard' },
      axe: { title: 'Axe Rankings', subtitle: 'Axe PvP leaderboard' },
      mace: { title: 'Mace Rankings', subtitle: 'Mace PvP leaderboard' }
    };

    const info = names[this.currentCategory] || names.overall;
    titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Rankings.init();
});
