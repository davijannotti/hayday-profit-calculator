// Hay Day Profit Calculator - Main JavaScript (Pro Edition)

let allItems = [];

// DOM Elements
const levelSlider = document.getElementById('level-slider');
const levelInput = document.getElementById('level-input');
const levelDisplay = document.getElementById('level-display');
const afkSelect = document.getElementById('afk-select');
const profitModeSelect = document.getElementById('profit-mode-select');
const slotsSlider = document.getElementById('slots-slider');
const slotsDisplay = document.getElementById('slots-display');
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

// Populate building select options dynamically based on selected category
function populateBuildingFilter() {
  const selectedCategory = categorySelect.value;
  buildingSelect.innerHTML = '<option value="ALL">Todas as Origens</option>';

  const buildings = new Set();
  allItems.forEach(item => {
    if (!item.building) return;

    if (selectedCategory === 'ALL' || item.category === selectedCategory) {
      buildings.add(item.building);
    }
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
function getCategoryIcon(category) {
  if (category === 'CROPS') return '🌱';
  if (category === 'TREES') return '🌳';
  return '🏭';
}

// Calculate AFK Session Profit
function calculateSessionProfit(item, afkHours, slotsCount, isNetMode) {
  const basePrice = isNetMode ? item.netProfit : item.maxPrice;
  
  if (item.category !== 'MACHINES') {
    // Crops/Trees are limited by time or fixed yield
    // Rate of yield per hour during AFK period
    const produced = Math.max(1, Math.floor(afkHours / (item.timeHours || 0.0833)));
    return produced * basePrice;
  }

  // For Machines: limited by machine slots during the AFK period
  const productionTimePerItem = item.timeHours || 0.1;
  const itemsFitInAfkWindow = Math.floor(afkHours / productionTimePerItem);
  const maxItemsProduced = Math.min(slotsCount, itemsFitInAfkWindow);
  const actualItemsProduced = Math.max(1, maxItemsProduced);

  return actualItemsProduced * basePrice;
}

// Render filtered and sorted items
function render() {
  const currentLevel = parseInt(levelInput.value) || 1;
  const currentAfkHours = parseFloat(afkSelect.value) || 2.0;
  const isNetMode = profitModeSelect.value === 'NET';
  const currentSlots = parseInt(slotsSlider.value) || 3;
  const currentSort = sortSelect.value;
  const currentCategory = categorySelect.value;
  const currentBuilding = buildingSelect.value;
  const searchText = searchInput.value.toLowerCase().trim();

  slotsDisplay.textContent = `${currentSlots} Slots`;

  // 1. Process items with calculated session metrics
  let processedItems = allItems.map(item => {
    const sessionProfit = calculateSessionProfit(item, currentAfkHours, currentSlots, isNetMode);
    return {
      ...item,
      sessionProfit: sessionProfit,
      effectivePerHour: currentAfkHours > 0 ? (sessionProfit / currentAfkHours) : sessionProfit
    };
  });

  // 2. Filter items
  let filtered = processedItems.filter(item => {
    const isUnlocked = item.level <= currentLevel;
    
    let matchesCategory = true;
    if (currentCategory !== 'ALL') {
      matchesCategory = item.category === currentCategory;
    }

    let matchesBuilding = true;
    if (currentBuilding !== 'ALL') {
      matchesBuilding = item.building === currentBuilding;
    }

    const matchesSearch = !searchText || item.name.toLowerCase().includes(searchText);

    return isUnlocked && matchesCategory && matchesBuilding && matchesSearch;
  });

  // 3. Sort items
  filtered.sort((a, b) => {
    if (currentSort === 'sessionProfit') {
      return b.sessionProfit - a.sessionProfit;
    }
    if (currentSort === 'timeHours') {
      return a.timeHours - b.timeHours;
    }
    return b[currentSort] - a[currentSort];
  });

  // 4. Update Metrics Banner
  countUnlockedEl.textContent = filtered.length;

  if (filtered.length > 0) {
    const topItem = filtered[0];
    topItemNameEl.textContent = topItem ? topItem.name : '-';
    topItemProfitEl.textContent = topItem ? `${formatCurrency(topItem.sessionProfit)} / acesso` : '$0';
  } else {
    topItemNameEl.textContent = '-';
    topItemProfitEl.textContent = '$0';
  }

  // 5. Render Grid Cards
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

    const isSessionHighlight = currentSort === 'sessionProfit';
    const isProfitHighlight = currentSort === 'maxPerHour';
    const isPriceHighlight = currentSort === 'maxPrice';
    const isXpHighlight = currentSort === 'xpPerHour';
    const icon = getCategoryIcon(item.category);

    const toolBadge = item.toolReq 
      ? `<div class="stat-row tool-warning"><span class="stat-label">🧰 Remoção:</span><span class="tool-val">${item.toolReq}</span></div>`
      : '';

    // Bottleneck Badge
    let bottleneckBadge = '';
    if (item.category === 'MACHINES') {
      if (item.bottleneck === 'HIGH') {
        bottleneckBadge = `<span class="badge badge-high" title="Exige ingredientes escassos de Laticínio/Açúcar">🔴 Gargalo Alto</span>`;
      } else if (item.bottleneck === 'MED') {
        bottleneckBadge = `<span class="badge badge-med" title="Exige ovos, leite, bacon ou pão">🟡 Gargalo Médio</span>`;
      } else {
        bottleneckBadge = `<span class="badge badge-easy" title="Apenas colheitas/plantio básico">🟢 Fácil / Sem Gargalo</span>`;
      }
    }

    // Ingredients List String
    const ingredientsText = item.ingredients && item.ingredients.length > 0
      ? item.ingredients.map(i => `${i.count}x ${i.item}`).join(', ')
      : 'Sem ingredientes adicionais';

    card.innerHTML = `
      <div>
        <div class="card-top">
          <h3 class="item-title">${item.name}</h3>
          <span class="item-level-tag">Lvl ${item.level}</span>
        </div>
        <div class="item-building-row">
          <div class="item-building">
            <span>${icon}</span> ${item.building || 'Desconhecido'}
          </div>
          ${bottleneckBadge}
        </div>
      </div>

      <div class="item-stats">
        <div class="stat-row highlight-row">
          <span class="stat-label">🏆 Lucro por Acesso (${currentAfkHours}h):</span>
          <span class="stat-val ${isSessionHighlight ? 'highlight' : ''}">${formatCurrency(item.sessionProfit)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">💰 Preço / Lucro Liq.:</span>
          <span class="stat-val ${isPriceHighlight ? 'primary-highlight' : ''}">${formatCurrency(isNetMode ? item.netProfit : item.maxPrice)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">⚡ Lucro Teórico / Hr:</span>
          <span class="stat-val ${isProfitHighlight ? 'highlight' : ''}">${formatCurrency(item.maxPerHour)}/hr</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">⏱️ Tempo Produção:</span>
          <span class="stat-val">${formatTime(item.timeHours)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">⭐ XP por Hora:</span>
          <span class="stat-val ${isXpHighlight ? 'primary-highlight' : ''}">${item.xpPerHour ? Math.round(item.xpPerHour) + ' XP/hr' : '-'}</span>
        </div>
        ${toolBadge}
        ${item.category === 'MACHINES' ? `<div class="ingredients-info"><strong>Ingredientes:</strong> ${ingredientsText}</div>` : ''}
      </div>
    `;

    itemsGrid.appendChild(card);
  });
}

// Event Listeners
levelSlider.addEventListener('input', (e) => syncLevel(e.target.value));
levelInput.addEventListener('input', (e) => syncLevel(e.target.value));
afkSelect.addEventListener('change', render);
profitModeSelect.addEventListener('change', render);
slotsSlider.addEventListener('input', render);
sortSelect.addEventListener('change', render);
categorySelect.addEventListener('change', () => {
  populateBuildingFilter();
  render();
});
buildingSelect.addEventListener('change', render);
searchInput.addEventListener('input', render);

// Initial Load
loadData();
