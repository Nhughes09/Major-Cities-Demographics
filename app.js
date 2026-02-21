// ─── APP STATE ───
let selectedCity = 'new-york';
let comparisonCities = [];
let currentYearIndex = 0;
let chartType = 'stacked';
let mainChart = null;
let comparisonCharts = {};
let animationTimer = null;
let animatingCity = null;

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  computeTotalPop();
  renderCityGrid('all');
  renderRegionalOverview();
  selectCity('new-york');
  buildLegend();
  bindEvents();
  setTimeout(() => document.getElementById('loading').classList.add('hidden'), 600);
});

function computeTotalPop() {
  let total = 0;
  for (const key in CITIES_DATA) total += CITIES_DATA[key].data[0].population;
  document.getElementById('total-pop-stat').textContent = (total / 1000).toFixed(1);
}

// ─── CITY GRID ───
function renderCityGrid(region) {
  const grid = document.getElementById('city-grid');
  grid.innerHTML = '';
  const keys = region === 'all'
    ? Object.keys(CITIES_DATA)
    : Object.keys(CITIES_DATA).filter(k => CITIES_DATA[k].region === region);

  keys.forEach((key, i) => {
    const city = CITIES_DATA[key];
    const d = city.data[currentYearIndex];
    const card = document.createElement('div');
    card.className = 'city-card' + (key === selectedCity ? ' selected' : '') + (key === animatingCity ? ' playing' : '');
    card.dataset.city = key;
    card.style.animationDelay = `${i * 0.04}s`;

    const miniBar = Object.entries(d.groups)
      .sort((a, b) => b[1] - a[1])
      .map(([g, v]) => `<div class="bar-seg" style="width:${v}%;background:${ETHNIC_COLORS[g] || '#888'}" data-group="${g}"></div>`)
      .join('');

    card.innerHTML = `
      <h3>${city.name}</h3>
      <div class="country">${city.country}</div>
      <div class="card-year-overlay" id="year-overlay-${key}">${d.year}</div>
      <div class="card-bar" id="card-bar-${key}">${miniBar}</div>
      <div class="card-legend" id="card-legend-${key}"></div>
      <div class="pop-label" id="pop-label-${key}">Population (${d.year})</div>
      <div class="pop-value" id="pop-value-${key}">${d.population.toFixed(1)}M</div>
      <div class="play-hint"><span class="play-icon">▶</span> Click to simulate</div>
    `;
    grid.appendChild(card);
  });
}

// ─── CARD ANIMATION ───
function stopAnimation() {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }
  if (animatingCity) {
    const card = document.querySelector(`.city-card[data-city="${animatingCity}"]`);
    if (card) card.classList.remove('playing');
    animatingCity = null;
  }
}

function playProjection(key) {
  // If already playing this city, stop
  if (animatingCity === key) {
    stopAnimation();
    return;
  }
  stopAnimation();

  animatingCity = key;
  selectedCity = key;
  const city = CITIES_DATA[key];
  const card = document.querySelector(`.city-card[data-city="${key}"]`);
  if (!card) return;

  // highlight
  document.querySelectorAll('.city-card').forEach(c => {
    c.classList.remove('selected', 'playing');
  });
  card.classList.add('selected', 'playing');

  // update main chart header
  document.getElementById('viz-city-name').textContent = `${city.name}, ${city.country}`;

  let step = 0;
  const totalSteps = city.data.length; // 16 steps (0-15)

  function tick() {
    if (step >= totalSteps || animatingCity !== key) {
      // finished
      if (animatingCity === key) {
        card.classList.remove('playing');
        card.classList.add('finished');
        setTimeout(() => card.classList.remove('finished'), 1500);
        animatingCity = null;
        animationTimer = null;
      }
      return;
    }

    currentYearIndex = step;
    const d = city.data[step];

    // Update card bar segments
    const barEl = document.getElementById(`card-bar-${key}`);
    if (barEl) {
      const sorted = Object.entries(d.groups).sort((a, b) => b[1] - a[1]);
      barEl.innerHTML = sorted.map(([g, v]) =>
        `<div class="bar-seg" style="width:${v}%;background:${ETHNIC_COLORS[g] || '#888'}" data-group="${g}"></div>`
      ).join('');
    }

    // Update card legend
    const legendEl = document.getElementById(`card-legend-${key}`);
    if (legendEl) {
      const sorted = Object.entries(d.groups).sort((a, b) => b[1] - a[1]).slice(0, 3);
      legendEl.innerHTML = sorted.map(([g, v]) =>
        `<div class="card-legend-item"><span class="card-legend-dot" style="background:${ETHNIC_COLORS[g] || '#888'}"></span>${g.split('/')[0]} ${v.toFixed(0)}%</div>`
      ).join('');
    }

    // Update year overlay
    const yearEl = document.getElementById(`year-overlay-${key}`);
    if (yearEl) {
      yearEl.textContent = d.year;
      yearEl.classList.add('visible');
    }

    // Update population
    const popLabel = document.getElementById(`pop-label-${key}`);
    const popValue = document.getElementById(`pop-value-${key}`);
    if (popLabel) popLabel.textContent = `Population (${d.year})`;
    if (popValue) popValue.textContent = `${d.population.toFixed(1)}M`;

    // Sync timeline slider
    const slider = document.getElementById('timeline');
    slider.value = step;
    document.getElementById('current-year').textContent = d.year;

    // Update main chart & snapshot bar
    renderMainChart();
    updateSnapshotBar();

    step++;
  }

  // Start immediately, then every 400ms
  tick();
  animationTimer = setInterval(tick, 400);
}

// ─── SELECT CITY ───
function selectCity(key) {
  selectedCity = key;
  document.querySelectorAll('.city-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.city === key);
  });
  const city = CITIES_DATA[key];
  document.getElementById('viz-city-name').textContent = `${city.name}, ${city.country}`;
  renderMainChart();
  updateSnapshotBar();
}

// ─── MAIN CHART ───
function renderMainChart() {
  const ctx = document.getElementById('main-chart');
  if (mainChart) mainChart.destroy();

  const city = CITIES_DATA[selectedCity];
  const years = city.data.map(d => d.year);
  const groups = Object.keys(city.data[0].groups);

  if (chartType === 'stacked') {
    const datasets = groups.map(g => ({
      label: g,
      data: city.data.map(d => d.groups[g] || 0),
      backgroundColor: ETHNIC_COLORS[g] || '#888',
      borderColor: 'transparent',
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5
    }));
    mainChart = new Chart(ctx, {
      type: 'line',
      data: { labels: years, datasets },
      options: stackedOpts('Percentage (%)')
    });
  } else if (chartType === 'bar') {
    const d = city.data[currentYearIndex];
    const sorted = Object.entries(d.groups).sort((a, b) => b[1] - a[1]);
    mainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          data: sorted.map(s => s[1]),
          backgroundColor: sorted.map(s => ETHNIC_COLORS[s[0]] || '#888'),
          borderRadius: 6, barPercentage: 0.7
        }]
      },
      options: barOpts(`${city.name} — ${city.data[currentYearIndex].year}`)
    });
  } else {
    const d = city.data[currentYearIndex];
    const sorted = Object.entries(d.groups).sort((a, b) => b[1] - a[1]);
    mainChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sorted.map(s => s[0]),
        datasets: [{
          data: sorted.map(s => s[1]),
          backgroundColor: sorted.map(s => ETHNIC_COLORS[s[0]] || '#888'),
          borderColor: '#111827', borderWidth: 2
        }]
      },
      options: doughnutOpts(`${city.name} — ${city.data[currentYearIndex].year}`)
    });
  }
}

function stackedOpts(title) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f0f2f5',
        bodyColor: '#9ca3af', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        padding: 12, cornerRadius: 8,
        callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%` }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', font: { size: 11 } } },
      y: { stacked: true, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', callback: v => v + '%', font: { size: 11 } } }
    },
    interaction: { mode: 'index', intersect: false }
  };
}

function barOpts(title) {
  return {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, color: '#f0f2f5', font: { family: 'Outfit', size: 14, weight: 600 }, padding: { bottom: 16 } },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f0f2f5',
        bodyColor: '#9ca3af', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        padding: 12, cornerRadius: 8,
        callbacks: { label: ctx => `${ctx.raw.toFixed(1)}%` }
      }
    },
    scales: {
      x: { max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6b7280', callback: v => v + '%' } },
      y: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } }
    }
  };
}

function doughnutOpts(title) {
  return {
    responsive: true, maintainAspectRatio: false, cutout: '55%',
    plugins: {
      legend: { display: false },
      title: { display: true, text: title, color: '#f0f2f5', font: { family: 'Outfit', size: 14, weight: 600 }, padding: { bottom: 16 } },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)', titleColor: '#f0f2f5',
        bodyColor: '#9ca3af', padding: 12, cornerRadius: 8,
        callbacks: { label: ctx => `${ctx.label}: ${ctx.raw.toFixed(1)}%` }
      }
    }
  };
}

// ─── SNAPSHOT BAR ───
function updateSnapshotBar() {
  const bar = document.getElementById('snapshot-bar');
  const city = CITIES_DATA[selectedCity];
  const d = city.data[currentYearIndex];
  const sorted = Object.entries(d.groups).sort((a, b) => b[1] - a[1]);
  bar.innerHTML = sorted.map(([g, v]) =>
    `<div class="segment" style="width:${v}%;background:${ETHNIC_COLORS[g] || '#888'}" title="${g}: ${v.toFixed(1)}%"></div>`
  ).join('');
}

// ─── LEGEND ───
function buildLegend() {
  const legend = document.getElementById('legend');
  legend.innerHTML = Object.entries(ETHNIC_COLORS)
    .map(([name, color]) => `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div>${name}</div>`)
    .join('');
}

// ─── COMPARISON ───
function renderComparison() {
  const grid = document.getElementById('comparison-grid');
  grid.innerHTML = '';
  Object.values(comparisonCharts).forEach(c => c.destroy());
  comparisonCharts = {};

  if (comparisonCities.length < 2) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">Shift-click at least 2 cities to compare.</p>';
    return;
  }

  comparisonCities.slice(0, 4).forEach(key => {
    const city = CITIES_DATA[key];
    const card = document.createElement('div');
    card.className = 'comparison-card';
    card.innerHTML = `<h3>${city.name}</h3><div class="comparison-chart-container"><canvas id="comp-${key}"></canvas></div>`;
    grid.appendChild(card);

    const groups = Object.keys(city.data[0].groups);
    const datasets = groups.map(g => ({
      label: g,
      data: city.data.map(d => d.groups[g] || 0),
      backgroundColor: ETHNIC_COLORS[g] || '#888',
      borderColor: 'transparent', fill: true, tension: 0.35, pointRadius: 0
    }));
    comparisonCharts[key] = new Chart(document.getElementById(`comp-${key}`), {
      type: 'line',
      data: { labels: city.data.map(d => d.year), datasets },
      options: stackedOpts('')
    });
  });
}

// ─── REGIONAL OVERVIEW ───
function renderRegionalOverview() {
  const grid = document.getElementById('regional-grid');
  grid.innerHTML = '';
  for (const [region, cityKeys] of Object.entries(REGIONS)) {
    const card = document.createElement('div');
    card.className = 'regional-card';
    const totalPop2025 = cityKeys.reduce((s, k) => s + CITIES_DATA[k].data[0].population, 0);
    const totalPop2100 = cityKeys.reduce((s, k) => s + CITIES_DATA[k].data[15].population, 0);
    const growth = ((totalPop2100 - totalPop2025) / totalPop2025 * 100).toFixed(0);

    // find dominant group change
    const agg2025 = {};
    const agg2100 = {};
    cityKeys.forEach(k => {
      const d25 = CITIES_DATA[k].data[0].groups;
      const d100 = CITIES_DATA[k].data[15].groups;
      for (const g in d25) agg2025[g] = (agg2025[g] || 0) + d25[g];
      for (const g in d100) agg2100[g] = (agg2100[g] || 0) + d100[g];
    });
    const top2025 = Object.entries(agg2025).sort((a, b) => b[1] - a[1])[0];
    const top2100 = Object.entries(agg2100).sort((a, b) => b[1] - a[1])[0];

    card.innerHTML = `
      <h3>${region}</h3>
      <div class="stat-row"><span class="label">Cities tracked</span><span class="value">${cityKeys.length}</span></div>
      <div class="stat-row"><span class="label">Pop 2025</span><span class="value">${totalPop2025.toFixed(1)}M</span></div>
      <div class="stat-row"><span class="label">Pop 2100</span><span class="value">${totalPop2100.toFixed(1)}M</span></div>
      <div class="stat-row"><span class="label">Growth</span><span class="value" style="color:${parseFloat(growth) >= 0 ? '#7BC4A8' : '#E8786B'}">${growth > 0 ? '+' : ''}${growth}%</span></div>
      <div class="stat-row"><span class="label">Top 2025</span><span class="value">${top2025[0]}</span></div>
      <div class="stat-row"><span class="label">Top 2100</span><span class="value">${top2100[0]}</span></div>
    `;
    grid.appendChild(card);
  }
}

// ─── EVENTS ───
function bindEvents() {
  // Region tabs
  document.querySelectorAll('.region-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.region-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderCityGrid(tab.dataset.region);
    });
  });

  // City click — plays projection animation
  document.getElementById('city-grid').addEventListener('click', e => {
    const card = e.target.closest('.city-card');
    if (!card) return;
    const key = card.dataset.city;

    if (e.shiftKey) {
      stopAnimation();
      if (comparisonCities.includes(key)) {
        comparisonCities = comparisonCities.filter(k => k !== key);
      } else if (comparisonCities.length < 4) {
        comparisonCities.push(key);
      }
      renderComparison();
      document.querySelectorAll('.city-card').forEach(c => {
        c.classList.toggle('selected', comparisonCities.includes(c.dataset.city) || c.dataset.city === selectedCity);
      });
    } else {
      // Play the projection animation
      playProjection(key);
      // Scroll chart into view
      setTimeout(() => {
        document.getElementById('explorer').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  });

  // Timeline
  document.getElementById('timeline').addEventListener('input', e => {
    currentYearIndex = parseInt(e.target.value);
    const year = 2025 + currentYearIndex * 5;
    document.getElementById('current-year').textContent = year;

    if (chartType !== 'stacked') renderMainChart();
    updateSnapshotBar();

    // Update active region grid
    const activeRegion = document.querySelector('.region-tab.active').dataset.region;
    renderCityGrid(activeRegion);
  });

  // Chart type buttons
  document.querySelectorAll('.viz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.viz-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chartType = btn.dataset.chart;
      renderMainChart();
    });
  });

  // Nav smooth scroll
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
      a.classList.add('active');
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function toggleMethodology() {
  document.getElementById('methodology').classList.toggle('collapsed');
}
