// Hay Day Profit Calculator - Main JavaScript

let allItems = [];

// DOM Elements
const levelSlider = document.getElementById('level-slider');
const levelInput = document.getElementById('level-input');
const levelDisplay = document.getElementById('level-display');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select');
const buildingSelect = document.getElementById('building-select');
const searchInput = document.getElementById('search-input');
const itemsGrid = document.getElementById('items-grid');
const emptyState = document.getElementById('empty-state');

// Metric Banner Elements
const countUnlockedEl = document.getElementById('count-unlocked');
const topItemNameEl = document.getElementById('top-item-name');
const topItemProfitEl = document.getElementById('top-item-profit');

// Fetch items data
async function loadData() {
  try {
    const res = await fetch('data.json');
    allItems = await res.json();
    populateBuildingFilter();
    render();
  } catch (err) {
    console.error('Erro ao carregar data.json:', err);
  }
}

// Populate building select options dynamically
function populateBuildingFilter() {
  const selectedCategory = categorySelect.value;
  buildingSelect.innerHTML = '<option value="ALL">Todas as Origens</option>';

  const buildings = new Set();
  allItems.forEach(item => {
    if (!item.building) return;

    // Filter buildings based on category selection
    const isCrop = item.building === 'Plantio / Cultivo';
    const isTree = item.building === 'Árvores & Arbustos';
    const isMachine = !isCrop && !isTree;

    if (selectedCategory === 'CROPS' && isCrop) buildings.add(item.building);
    else if (selectedCategory === 'TREES' && isTree) buildings.add(item.building);
    else if (selectedCategory === 'MACHINES' && isMachine) buildings.add(item.building);
    else if (selectedCategory === 'ALL') buildings.add(item.building);
  });

  const sortedBuildings = Array.from(buildings).sort();
  sortedBuildings.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b;
    buildingSelect.appendChild(opt);
  });
}

// Sync level slider & level input
function syncLevel(val) {
  const num = Math.max(1, Math.min(130, parseInt(val) || 1));
  levelSlider.value = num;
  levelInput.value = num;
  levelDisplay.textContent = `Level ${num}`;
  render();
}

// Format production time nicely
function formatTime(hours) {
  if (!hours || hours === 0) return '0 min';
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Format currency
function formatCurrency(val) {
  if (val === undefined || val === null) return '$0';
  return `$${Math.round(val).toLocaleString('pt-BR')}`;
}

// Helper to determine category icon
function getCategoryIcon(building) {
  if (building === 'Plantio / Cultivo') return '🌱';
  if (building === 'Árvores & Arbustos') return '🍎';
  return '🏭';
}

// Render filtered and sorted items
function render() {
  const currentLevel = parseInt(levelInput.value) || 1;
  const currentSort = sortSelect.value;
  const currentCategory = categorySelect.value;
  const currentBuilding = buildingSelect.value;
  const searchText = searchInput.value.toLowerCase().trim();

  // 1. Filter items
  let filtered = allItems.filter(item => {
    const isUnlocked = item.level <= currentLevel;
    const matchesBuilding = currentBuilding === 'ALL' || item.building === currentBuilding;
    const matchesSearch = !searchText || item.name.toLowerCase().includes(searchText);

    const isCrop = item.building === 'Plantio / Cultivo';
    const isTree = item.building === 'Árvores & Arbustos';
    const isMachine = !isCrop && !isTree;

    let matchesCategory = true;
    if (currentCategory === 'CROPS') matchesCategory = isCrop;
    else if (currentCategory === 'TREES') matchesCategory = isTree;
    else if (currentCategory === 'MACHINES') matchesCategory = isMachine;

    return isUnlocked && matchesCategory && matchesBuilding && matchesSearch;
  });

  // 2. Sort items
  filtered.sort((a, b) => {
    if (currentSort === 'timeHours') {
      return a.timeHours - b.timeHours; // Ascending time
    }
    return b[currentSort] - a[currentSort]; // Descending profit/price/xp
  });

  // 3. Update Metrics Banner
  countUnlockedEl.textContent = filtered.length;

  if (filtered.length > 0) {
    const topByProfit = [...filtered].sort((a, b) => b.maxPerHour - a.maxPerHour)[0];
    topItemNameEl.textContent = topByProfit ? topByProfit.name : '-';
    topItemProfitEl.textContent = topByProfit ? `${formatCurrency(topByProfit.maxPerHour)}/hr` : '$0/hr';
  } else {
    topItemNameEl.textContent = '-';
    topItemProfitEl.textContent = '$0/hr';
  }

  // 4. Render Grid Cards
  itemsGrid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';

    const isProfitHighlight = currentSort === 'maxPerHour';
    const isPriceHighlight = currentSort === 'maxPrice';
    const isXpHighlight = currentSort === 'xpPerHour';
    const icon = getCategoryIcon(item.building);

    card.innerHTML = `
      <div>
        <div class="card-top">
          <h3 class="item-title">${item.name}</h3>
          <span class="item-level-tag">Lvl ${item.level}</span>
        </div>
        <div class="item-building">
          <span>${icon}</span> ${item.building || 'Desconhecido'}
        </div>
      </div>

      <div class="item-stats">
        <div class="stat-row">
          <span class="stat-label">⚡ Lucro / Hora:</span>
          <span class="stat-val ${isProfitHighlight ? 'highlight' : ''}">${formatCurrency(item.maxPerHour)}/hr</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">💰 Preço Máximo:</span>
          <span class="stat-val ${isPriceHighlight ? 'primary-highlight' : ''}">${formatCurrency(item.maxPrice)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">⏱️ Tempo Produção:</span>
          <span class="stat-val">${formatTime(item.timeHours)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">⭐ XP por Hora:</span>
          <span class="stat-val ${isXpHighlight ? 'primary-highlight' : ''}">${item.xpPerHour ? Math.round(item.xpPerHour) + ' XP/hr' : '-'}</span>
        </div>
      </div>
    `;

    itemsGrid.appendChild(card);
  });
}

// Event Listeners
levelSlider.addEventListener('input', (e) => syncLevel(e.target.value));
levelInput.addEventListener('input', (e) => syncLevel(e.target.value));
sortSelect.addEventListener('change', render);
categorySelect.addEventListener('change', () => {
  populateBuildingFilter();
  render();
});
buildingSelect.addEventListener('change', render);
searchInput.addEventListener('input', render);

// Initial Load
loadData();
