// ─── APP STATE ───
let selectedCity = 'new-york';
let comparisonCities = [];
let currentYearIndex = 0;
let chartType = 'stacked';
let mainChart = null;
let comparisonCharts = {};
let expandedCard = null;
let cardCharts = {};

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
  // Destroy any existing card charts
  Object.values(cardCharts).forEach(c => c.destroy());
  cardCharts = {};
  expandedCard = null;

  const grid = document.getElementById('city-grid');
  grid.innerHTML = '';
  const keys = region === 'all'
    ? Object.keys(CITIES_DATA)
    : Object.keys(CITIES_DATA).filter(k => CITIES_DATA[k].region === region);

  keys.forEach((key, i) => {
    const city = CITIES_DATA[key];
    const d = city.data[0]; // always show 2025 baseline
    const card = document.createElement('div');
    card.className = 'city-card' + (key === selectedCity ? ' selected' : '');
    card.dataset.city = key;
    card.style.animationDelay = `${i * 0.04}s`;

    const miniBar = Object.entries(d.groups)
      .sort((a, b) => b[1] - a[1])
      .map(([g, v]) => `<div class="bar-seg" style="width:${v}%;background:${ETHNIC_COLORS[g] || '#888'}"></div>`)
      .join('');

    card.innerHTML = `
      <h3>${city.name}</h3>
      <div class="country">${city.country}</div>
      <div class="card-bar">${miniBar}</div>
      <div class="card-info">
        <span class="pop-value">${d.population.toFixed(1)}M</span>
        <span class="play-hint">▶ Click to simulate</span>
      </div>
      <div class="card-chart-wrap" id="chart-wrap-${key}">
        <canvas id="card-chart-${key}"></canvas>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ─── EXPAND CARD WITH INLINE CHART ───
function toggleCardChart(key) {
  const card = document.querySelector(`.city-card[data-city="${key}"]`);
  if (!card) return;

  // If already expanded, collapse it
  if (expandedCard === key) {
    card.classList.remove('expanded');
    if (cardCharts[key]) {
      cardCharts[key].destroy();
      delete cardCharts[key];
    }
    expandedCard = null;
    return;
  }

  // Collapse previous
  if (expandedCard) {
    const prev = document.querySelector(`.city-card[data-city="${expandedCard}"]`);
    if (prev) prev.classList.remove('expanded');
    if (cardCharts[expandedCard]) {
      cardCharts[expandedCard].destroy();
      delete cardCharts[expandedCard];
    }
  }

  // Expand this card
  expandedCard = key;
  card.classList.add('expanded');

  // Also select it for the main chart
  selectCity(key);

  // Build stacked bar chart inside card
  setTimeout(() => {
    const canvas = document.getElementById(`card-chart-${key}`);
    if (!canvas) return;
    const city = CITIES_DATA[key];
    const years = city.data.map(d => d.year);
    const groups = Object.keys(city.data[0].groups);

    const datasets = groups.map(g => ({
      label: g,
      data: city.data.map(d => d.groups[g] || 0),
      backgroundColor: ETHNIC_COLORS[g] || '#888',
      borderColor: 'rgba(0,0,0,0.1)',
      borderWidth: 0.5,
      borderSkipped: false,
    }));

    cardCharts[key] = new Chart(canvas, {
      type: 'bar',
      data: { labels: years, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index', intersect: false,
            backgroundColor: 'rgba(10,14,26,0.95)',
            titleColor: '#f0f2f5', bodyColor: '#9ca3af',
            borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            padding: 10, cornerRadius: 6,
            titleFont: { family: 'Inter', size: 12, weight: 600 },
            bodyFont: { family: 'Inter', size: 11 },
            callbacks: {
              title: ctx => `Year ${ctx[0].label}`,
              label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#6b7280', font: { size: 9, family: 'Inter' }, maxRotation: 45 }
          },
          y: {
            stacked: true,
            max: 100,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#6b7280', font: { size: 9 }, callback: v => v + '%', stepSize: 25 }
          }
        }
      }
    });
  }, 50);
}

// ─── SELECT CITY ───
function selectCity(key) {
  selectedCity = key;
  document.querySelectorAll('.city-card').forEach(c => {
    const isSelected = c.dataset.city === key;
    // Don't remove expanded class
    if (isSelected) c.classList.add('selected');
    else c.classList.remove('selected');
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

  // City click — expand card with inline stacked bar chart
  document.getElementById('city-grid').addEventListener('click', e => {
    const card = e.target.closest('.city-card');
    if (!card) return;
    const key = card.dataset.city;

    if (e.shiftKey) {
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
      toggleCardChart(key);
    }
  });

  // Timeline
  document.getElementById('timeline').addEventListener('input', e => {
    currentYearIndex = parseInt(e.target.value);
    const year = 2025 + currentYearIndex * 5;
    document.getElementById('current-year').textContent = year;

    if (chartType !== 'stacked') renderMainChart();
    updateSnapshotBar();
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
