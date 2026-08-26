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
    const res = await fetch(`data.json?v=${Date.now()}`);
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
  const basePrice = isNetMode ? (item.netProfit !== undefined ? item.netProfit : item.maxPrice) : item.maxPrice;
  const prodTime = item.timeHours && item.timeHours > 0 ? item.timeHours : 0.0833;

  if (item.category !== 'MACHINES') {
    const itemsProduced = Math.max(1, Math.floor(afkHours / prodTime));
    return itemsProduced * basePrice;
  }

  // For Machines: limited by machine slots during the AFK period
  const itemsFitInAfkWindow = Math.floor(afkHours / prodTime);
  const actualItemsProduced = Math.max(1, Math.min(slotsCount, itemsFitInAfkWindow));

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

  // Update UI text for slots slider
  if (slotsDisplay) {
    slotsDisplay.textContent = `${currentSlots} Slots`;
  }

  // 1. Process items with calculated session metrics
  let processedItems = allItems.map(item => {
    const sessionProfit = calculateSessionProfit(item, currentAfkHours, currentSlots, isNetMode);
    const effectivePrice = isNetMode ? (item.netProfit !== undefined ? item.netProfit : item.maxPrice) : item.maxPrice;
    const effectivePerHour = isNetMode ? (item.netPerHour !== undefined ? item.netPerHour : item.maxPerHour) : item.maxPerHour;
    
    return {
      ...item,
      effectivePrice: effectivePrice,
      effectivePerHour: effectivePerHour,
      sessionProfit: sessionProfit
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
    if (currentSort === 'maxPerHour') {
      return b.effectivePerHour - a.effectivePerHour;
    }
    if (currentSort === 'maxPrice') {
      return b.effectivePrice - a.effectivePrice;
    }
    if (currentSort === 'timeHours') {
      return a.timeHours - b.timeHours;
    }
    if (currentSort === 'xpPerHour') {
      return b.xpPerHour - a.xpPerHour;
    }
    return b.sessionProfit - a.sessionProfit;
  });

  // 4. Update Metrics Banner
  if (countUnlockedEl) countUnlockedEl.textContent = filtered.length;

  if (filtered.length > 0) {
    const topItem = filtered[0];
    if (topItemNameEl) topItemNameEl.textContent = topItem ? topItem.name : '-';
    if (topItemProfitEl) {
      if (currentSort === 'sessionProfit') {
        topItemProfitEl.textContent = topItem ? `${formatCurrency(topItem.sessionProfit)} / acesso` : '$0';
      } else if (currentSort === 'maxPerHour') {
        topItemProfitEl.textContent = topItem ? `${formatCurrency(topItem.effectivePerHour)}/hr` : '$0/hr';
      } else if (currentSort === 'maxPrice') {
        topItemProfitEl.textContent = topItem ? formatCurrency(topItem.effectivePrice) : '$0';
      } else {
        topItemProfitEl.textContent = topItem ? `${formatCurrency(topItem.sessionProfit)} / acesso` : '$0';
      }
    }
  } else {
    if (topItemNameEl) topItemNameEl.textContent = '-';
    if (topItemProfitEl) topItemProfitEl.textContent = '$0';
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
    if (item.category === 'MACHINES' && item.bottleneck) {
      if (item.bottleneck === 'HIGH') {
        bottleneckBadge = `<span class="badge badge-high" title="Exige ferramentas da mina (dinamites) ou ingredientes escassos">🔴 Gargalo Alto</span>`;
      } else if (item.bottleneck === 'MED') {
        bottleneckBadge = `<span class="badge badge-med" title="Exige ovos, leite, bacon ou pão">🟡 Gargalo Médio</span>`;
      } else if (item.bottleneck === 'EASY') {
        bottleneckBadge = `<span class="badge badge-easy" title="Apenas plantio básico ou receitas simples">🟢 Sem Gargalo</span>`;
      }
    }

    // Detailed Ingredients List HTML
    let ingredientsHtml = '';
    if (item.category === 'MACHINES' && item.ingredients && item.ingredients.length > 0) {
      const ingListItems = item.ingredients.map(ing => {
        const uPrice = ing.unitPrice ? formatCurrency(ing.unitPrice) : '$0';
        const tPrice = ing.totalPrice ? formatCurrency(ing.totalPrice) : '$0';
        return `<li><span class="ing-name">${ing.count}x ${ing.item}</span> <span class="ing-calc">(${uPrice} un = ${tPrice})</span></li>`;
      }).join('');

      ingredientsHtml = `
        <div class="ingredients-box">
          <div class="ing-header">
            <span>🧬 Receita & Custo dos Ingredientes</span>
            <span class="ing-cost-total">Total: ${formatCurrency(item.ingredientCost || 0)}</span>
          </div>
          <ul class="ing-list">
            ${ingListItems}
          </ul>
          <div class="profit-breakdown">
            <span>Venda ($${item.maxPrice}) - Custo ($${item.ingredientCost || 0}) = </span>
            <strong class="net-value">${formatCurrency(item.netProfit || item.maxPrice)} Líquido</strong>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-header-wrapper">
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

      <div class="card-body-wrapper">
        <div class="item-stats">
          <div class="stat-row highlight-row">
            <span class="stat-label">🏆 Lucro / Acesso (${currentAfkHours}h):</span>
            <span class="stat-val ${isSessionHighlight ? 'highlight' : ''}">${formatCurrency(item.sessionProfit)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">${isNetMode ? '💰 Lucro Líquido Unit.:' : '💰 Preço Máximo Unit.:'}</span>
            <span class="stat-val ${isPriceHighlight ? 'primary-highlight' : ''}">${formatCurrency(item.effectivePrice)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">${isNetMode ? '⚡ Lucro Liq. / Hora:' : '⚡ Lucro Bruto / Hora:'}</span>
            <span class="stat-val ${isProfitHighlight ? 'highlight' : ''}">${formatCurrency(item.effectivePerHour)}/hr</span>
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
          ${ingredientsHtml}
        </div>
      </div>
    `;

    itemsGrid.appendChild(card);
  });
}

// Event Listeners - supporting both input and change for instant slider reactivity
levelSlider.addEventListener('input', (e) => syncLevel(e.target.value));
levelSlider.addEventListener('change', (e) => syncLevel(e.target.value));
levelInput.addEventListener('input', (e) => syncLevel(e.target.value));
levelInput.addEventListener('change', (e) => syncLevel(e.target.value));

afkSelect.addEventListener('change', render);
profitModeSelect.addEventListener('change', render);

slotsSlider.addEventListener('input', (e) => {
  if (slotsDisplay) slotsDisplay.textContent = `${e.target.value} Slots`;
  render();
});
slotsSlider.addEventListener('change', (e) => {
  if (slotsDisplay) slotsDisplay.textContent = `${e.target.value} Slots`;
  render();
});

sortSelect.addEventListener('change', render);
categorySelect.addEventListener('change', () => {
  populateBuildingFilter();
  render();
});
buildingSelect.addEventListener('change', render);
searchInput.addEventListener('input', render);

// Initial Load
loadData();
