const state = {
  selectedOffset: 0,
  matches: [],
  standings: [],
  search: ''
};

const api = {
  scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
  standings: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings'
};

const el = {
  matches: document.getElementById('matches'),
  tableBody: document.getElementById('tableBody'),
  statusText: document.getElementById('statusText'),
  dateTabs: document.getElementById('dateTabs'),
  refreshBtn: document.getElementById('refreshBtn'),
  themeBtn: document.getElementById('themeBtn'),
  searchInput: document.getElementById('searchInput')
};

init();

function init() {
  applySavedTheme();
  wireEvents();
  loadAll();
}

function wireEvents() {
  el.dateTabs.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-offset]');
    if (!button) return;

    state.selectedOffset = Number(button.dataset.offset);
    [...el.dateTabs.querySelectorAll('button')].forEach((b) => b.classList.remove('active'));
    button.classList.add('active');

    await loadMatches();
  });

  el.refreshBtn.addEventListener('click', loadAll);

  el.themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('plfs-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    syncThemeToggle();
  });

  el.searchInput.addEventListener('input', () => {
    state.search = el.searchInput.value.trim().toLowerCase();
    renderMatches();
    renderTable();
  });
}

function applySavedTheme() {
  if (localStorage.getItem('plfs-theme') === 'dark') {
    document.body.classList.add('dark');
  }
  syncThemeToggle();
}

function syncThemeToggle() {
  const dark = document.body.classList.contains('dark');
  el.themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
}

async function loadAll() {
  el.statusText.textContent = 'Loading live data...';

  await Promise.all([loadMatches(), loadStandings()]);
}

async function loadMatches() {
  try {
    const date = offsetToYYYYMMDD(state.selectedOffset);
    const res = await fetch(`${api.scoreboard}?dates=${date}`);
    if (!res.ok) throw new Error('Could not load matches');

    const data = await res.json();
    state.matches = Array.isArray(data.events) ? data.events : [];
    el.statusText.textContent = `Live data source: ESPN • ${formatHeaderDate(state.selectedOffset)}`;
    renderMatches();
  } catch (error) {
    state.matches = [];
    el.statusText.textContent = 'Live feed unavailable right now. Please try refresh.';
    renderMatches();
  }
}

async function loadStandings() {
  try {
    const res = await fetch(api.standings);
    if (!res.ok) throw new Error('Could not load standings');

    const data = await res.json();
    const entries = data?.children?.[0]?.standings?.entries || [];

    state.standings = entries.map((entry, idx) => {
      const stats = statMap(entry.stats || []);
      return {
        rank: Number(stats.rank ?? idx + 1),
        team: entry.team?.displayName || entry.team?.name || 'Team',
        logo: entry.team?.logos?.[0]?.href || '',
        played: Number(stats.gamesPlayed ?? 0),
        won: Number(stats.wins ?? 0),
        drawn: Number(stats.ties ?? 0),
        lost: Number(stats.losses ?? 0),
        gf: Number(stats.pointsFor ?? 0),
        ga: Number(stats.pointsAgainst ?? 0),
        gd: Number(stats.pointDifferential ?? 0),
        points: Number(stats.points ?? 0)
      };
    });

    renderTable();
  } catch (error) {
    state.standings = [];
    renderTable();
  }
}

function renderMatches() {
  const q = state.search;
  const list = state.matches.filter((event) => {
    if (!q) return true;
    return (event.name || '').toLowerCase().includes(q);
  });

  if (!list.length) {
    el.matches.innerHTML = '<p class="muted">No matches found for this date.</p>';
    return;
  }

  el.matches.innerHTML = list.map(renderMatchCard).join('');
}

function renderMatchCard(event) {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');

  const statusType = event.status?.type?.state || 'pre';
  const isLive = statusType === 'in';
  const badgeText = event.status?.type?.shortDetail || event.status?.type?.description || 'Scheduled';

  const homeName = home?.team?.displayName || 'Home';
  const awayName = away?.team?.displayName || 'Away';

  const homeScore = home?.score ?? '-';
  const awayScore = away?.score ?? '-';

  const homeLogo = home?.team?.logo || home?.team?.logos?.[0]?.href || '';
  const awayLogo = away?.team?.logo || away?.team?.logos?.[0]?.href || '';

  return `
    <article class="match">
      <div class="row">
        <strong>${safeText(comp?.venue?.fullName || event.venue?.fullName || 'Premier League')}</strong>
        <span class="badge ${isLive ? 'live' : ''}">${safeText(badgeText)}</span>
      </div>
      <div class="row">
        <div class="team">
          ${homeLogo ? `<img src="${homeLogo}" alt="${safeText(homeName)} logo" />` : ''}
          <span>${safeText(homeName)}</span>
        </div>
        <span class="score">${safeText(String(homeScore))}</span>
      </div>
      <div class="row">
        <div class="team">
          ${awayLogo ? `<img src="${awayLogo}" alt="${safeText(awayName)} logo" />` : ''}
          <span>${safeText(awayName)}</span>
        </div>
        <span class="score">${safeText(String(awayScore))}</span>
      </div>
    </article>
  `;
}

function renderTable() {
  const q = state.search;
  const rows = state.standings.filter((row) => {
    if (!q) return true;
    return row.team.toLowerCase().includes(q);
  });

  if (!rows.length) {
    el.tableBody.innerHTML = '<tr><td colspan="10">No table rows found.</td></tr>';
    return;
  }

  el.tableBody.innerHTML = rows
    .map((row) => {
      const rowClass = row.rank <= 4 ? 'top4' : row.rank >= 18 ? 'bottom3' : '';
      return `
        <tr class="${rowClass}">
          <td>${row.rank}</td>
          <td>
            <div class="team">
              ${row.logo ? `<img src="${row.logo}" alt="${safeText(row.team)} logo" />` : ''}
              <span>${safeText(row.team)}</span>
            </div>
          </td>
          <td>${row.played}</td>
          <td>${row.won}</td>
          <td>${row.drawn}</td>
          <td>${row.lost}</td>
          <td>${row.gf}</td>
          <td>${row.ga}</td>
          <td>${row.gd}</td>
          <td><strong>${row.points}</strong></td>
        </tr>
      `;
    })
    .join('');
}

function offsetToYYYYMMDD(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function formatHeaderDate(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function statMap(stats) {
  const map = {};
  for (const item of stats) {
    if (item.name) map[item.name] = item.value;
  }
  return map;
}

function safeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
