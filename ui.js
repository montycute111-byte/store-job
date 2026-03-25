import {
  CATEGORY_ORDER,
  DAY_LENGTH_SECONDS,
  EMPLOYEES,
  LICENSES,
  STORE_EXPANSIONS,
  UPGRADES
} from "./data.js";
import {
  getAvailableProducts,
  getBestSellerName,
  getEmployeeHireCost,
  getEffectiveWholesaleCost,
  getLevelProgress,
  getPriceDemandMultiplier,
  getPriceMood,
  getProductsByCategory,
  getStoreSnapshot,
  getUpgradeCost
} from "./simulation.js";

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getCatMood(snapshot) {
  if (snapshot.salesBlockedByCategoryCoverage) {
    return {
      title: "Shop Cat Alert",
      note: `I need at least one item in ${snapshot.missingCategories.join(", ")} before customers start shopping again.`,
      modifier: "cat-mascot--alert"
    };
  }
  if (snapshot.lowStockCount > 0 || snapshot.soldOutCount > 0) {
    return {
      title: "Shelf Patrol",
      note: `${snapshot.lowStockCount} low-stock items and ${snapshot.soldOutCount} sold-out items need attention.`,
      modifier: "cat-mascot--busy"
    };
  }
  if (snapshot.expansion.next) {
    return {
      title: "Expansion Paws",
      note: `Save up for ${snapshot.expansion.next.name}. Bigger store means more products and more room to stock them.`,
      modifier: "cat-mascot--happy"
    };
  }
  return {
    title: "Happy Shop Cat",
    note: "Everything is stocked, polished, and ready for more customers.",
    modifier: "cat-mascot--happy"
  };
}

function renderCatMascot(snapshot) {
  const mood = getCatMood(snapshot);
  return `
    <aside class="cat-mascot ${mood.modifier}">
      <div class="cat-figure" aria-hidden="true">
        <svg class="cat-sprite" viewBox="0 0 96 96" role="img" aria-hidden="true">
          <path d="M24 26 L31 18 L37 28 Z" fill="#8d8576" stroke="#403b34" stroke-width="1.5"/>
          <path d="M59 28 L66 18 L72 26 Z" fill="#8d8576" stroke="#403b34" stroke-width="1.5"/>
          <path d="M27 26 L31 22 L34 28 Z" fill="#e6ded0"/>
          <path d="M62 28 L66 22 L69 26 Z" fill="#e6ded0"/>

          <path d="M18 32 C18 22, 34 16, 48 16 C66 16, 78 24, 78 39 L78 62 C78 74, 65 82, 47 82 C29 82, 18 72, 18 58 Z"
            fill="#6c665c" stroke="#403b34" stroke-width="2"/>
          <path d="M10 42 C9 28, 18 22, 28 22 C32 22, 33 28, 31 33 C28 39, 27 49, 29 58 C30 64, 27 69, 20 69 C14 69, 10 60, 10 42 Z"
            fill="#5c564d" stroke="#403b34" stroke-width="2"/>
          <path d="M17 22 C10 28, 8 38, 9 48" fill="none" stroke="#403b34" stroke-width="2"/>

          <path d="M28 34 C32 29, 40 26, 49 26 C59 26, 67 29, 70 35 C73 42, 71 52, 66 58 C62 63, 55 66, 48 66 C40 66, 33 63, 29 57 C24 50, 23 41, 28 34 Z"
            fill="#a39b8e" stroke="#403b34" stroke-width="2"/>
          <path d="M28 50 C33 47, 40 46, 48 46 C57 46, 64 47, 69 50 C66 60, 58 66, 48 66 C38 66, 31 61, 28 50 Z"
            fill="#ddd5c8"/>
          <path d="M33 31 C38 27, 43 25, 48 25 C53 25, 59 27, 64 31" fill="none" stroke="#545047" stroke-width="2"/>
          <path d="M34 38 L41 36" stroke="#4f4a42" stroke-width="1.6"/>
          <path d="M55 36 L62 38" stroke="#4f4a42" stroke-width="1.6"/>
          <path d="M35 43 L42 42" stroke="#4f4a42" stroke-width="1.6"/>
          <path d="M54 42 L61 43" stroke="#4f4a42" stroke-width="1.6"/>

          <ellipse cx="38" cy="43" rx="5.2" ry="6" fill="#2b4f1f"/>
          <ellipse cx="58" cy="43" rx="5.2" ry="6" fill="#2b4f1f"/>
          <ellipse cx="39" cy="43" rx="2.1" ry="3.6" fill="#111"/>
          <ellipse cx="57" cy="43" rx="2.1" ry="3.6" fill="#111"/>
          <circle cx="37" cy="41" r="1" fill="#fff"/>
          <circle cx="56" cy="41" r="1" fill="#fff"/>

          <path d="M46 49 L50 49 L48 52 Z" fill="#c78d86" stroke="#704b48" stroke-width="1"/>
          <path d="M44 54 C46 56, 50 56, 52 54" fill="none" stroke="#5b4945" stroke-width="1.4" stroke-linecap="round"/>

          <path d="M30 51 L16 48" stroke="#e9e4db" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M30 54 L15 54" stroke="#e9e4db" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M30 57 L17 60" stroke="#e9e4db" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M66 51 L80 48" stroke="#e9e4db" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M66 54 L81 54" stroke="#e9e4db" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M66 57 L79 60" stroke="#e9e4db" stroke-width="1.6" stroke-linecap="round"/>

          <path d="M30 71 L30 87 L22 87 L22 73" fill="#a49b8d" stroke="#403b34" stroke-width="2"/>
          <path d="M42 73 L42 89 L34 89 L34 74" fill="#8e8578" stroke="#403b34" stroke-width="2"/>
          <path d="M60 73 L60 89 L52 89 L52 74" fill="#8e8578" stroke="#403b34" stroke-width="2"/>
          <path d="M72 71 L72 87 L64 87 L64 73" fill="#a49b8d" stroke="#403b34" stroke-width="2"/>
          <path d="M20 87 H32" stroke="#e6dfd1" stroke-width="3" stroke-linecap="round"/>
          <path d="M32 89 H44" stroke="#e6dfd1" stroke-width="3" stroke-linecap="round"/>
          <path d="M50 89 H62" stroke="#e6dfd1" stroke-width="3" stroke-linecap="round"/>
          <path d="M62 87 H74" stroke="#e6dfd1" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="cat-bubble">
        <strong>${escapeHtml(mood.title)}</strong>
        <p>${escapeHtml(mood.note)}</p>
      </div>
    </aside>
  `;
}

function renderTopBar(state, uiState) {
  const snapshot = getStoreSnapshot(state);
  const dayProgress = (state.dayClock / DAY_LENGTH_SECONDS) * 100;

  return `
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Local-only store simulator</p>
        <h1>${escapeHtml(state.storeName)}</h1>
        <p class="hero-text">Buy wholesale, stock shelves, tune prices, unlock licenses, and grow a tiny shop into a serious retail machine.</p>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span>Cash on hand</span>
          <strong>${formatMoney(state.money)}</strong>
        </div>
        <div class="metric-card">
          <span>Total profit</span>
          <strong>${formatMoney(state.totalProfit)}</strong>
        </div>
        <div class="metric-card">
          <span>Day ${state.day}</span>
          <strong>${Math.max(0, DAY_LENGTH_SECONDS - Math.floor(state.dayClock))}s left</strong>
        </div>
      </div>
      <div class="day-track">
        <div class="day-track__label">
          <span>Store Level ${state.storeLevel}</span>
          <span>${snapshot.levelProgress.name}</span>
        </div>
        <div class="progress-shell">
          <div class="progress-fill" style="width:${Math.min(100, (snapshot.levelProgress.current / snapshot.levelProgress.required) * 100)}%"></div>
        </div>
        <div class="day-track__label">
          <span>${snapshot.levelProgress.current.toFixed(0)} / ${snapshot.levelProgress.required.toFixed(0)} XP</span>
          <span>${dayProgress.toFixed(0)}% through the day</span>
        </div>
      </div>
      <div class="notice-row">
        <span class="notice-pill">${escapeHtml(uiState.notice)}</span>
        <span class="save-pill">${escapeHtml(uiState.saveStatus)}</span>
      </div>
      ${renderCatMascot(snapshot)}
    </section>
  `;
}

function renderTabs(uiState) {
  const tabs = [
    ["overview", "Overview"],
    ["inventory", "Inventory"],
    ["supplier", "Supplier"],
    ["pricing", "Pricing"],
    ["progression", "Licenses + Upgrades"],
    ["stats", "Stats"],
    ["settings", "Settings"]
  ];

  return `
    <nav class="tab-row">
      ${tabs.map(([id, label]) => `
        <button
          class="tab-btn ${uiState.activeTab === id ? "active" : ""}"
          data-action="select-tab"
          data-tab="${id}"
        >${label}</button>
      `).join("")}
    </nav>
  `;
}

function renderOverview(state) {
  const snapshot = getStoreSnapshot(state);
  const dayStats = state.stats.currentDay;

  return `
    <section class="content-grid content-grid--overview">
      <article class="panel panel--primary">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Store overview</p>
            <h2>Business pulse</h2>
          </div>
          <button class="action-btn" data-action="restock-low-stock">Restock low stock</button>
        </header>
        <div class="stat-grid">
          <div class="stat-card">
            <span>Reputation</span>
            <strong>${state.reputation.toFixed(0)} / 100</strong>
            <small>Higher reputation increases conversion.</small>
          </div>
          <div class="stat-card">
            <span>Daily sales</span>
            <strong>${formatMoney(dayStats.revenue)}</strong>
            <small>${formatCount(dayStats.itemsSold)} items sold today</small>
          </div>
          <div class="stat-card">
            <span>Daily profit</span>
            <strong>${formatMoney(dayStats.profit)}</strong>
            <small>Best seller: ${escapeHtml(getBestSellerName(snapshot.currentBestSellerId))}</small>
          </div>
          <div class="stat-card">
            <span>Traffic rate</span>
            <strong>${snapshot.trafficRate.toFixed(2)} cust/s</strong>
            <small>Improved by shelves, reputation, level, and upgrades.</small>
          </div>
          <div class="stat-card">
            <span>Storage</span>
            <strong>${snapshot.usedCapacity} / ${snapshot.capacity}</strong>
            <small>${snapshot.freeCapacity} capacity free</small>
          </div>
          <div class="stat-card">
            <span>Store expansion</span>
            <strong>${escapeHtml(snapshot.expansion.current.name)}</strong>
            <small>${snapshot.expansion.next ? `Next upgrade ${formatMoney(snapshot.expansion.next.cost)}` : "Maximum store size reached"}</small>
          </div>
          <div class="stat-card">
            <span>Stock clerks</span>
            <strong>${snapshot.employees.stockClerks}</strong>
            <small>${escapeHtml(snapshot.employees.restockRateLabel)}</small>
          </div>
        </div>
        ${snapshot.employees.lastRestock
          ? `<p class="empty-state">Last auto-restock: ${snapshot.employees.lastRestock.quantity}x ${escapeHtml(snapshot.employees.lastRestock.productName)} for ${formatMoney(snapshot.employees.lastRestock.spent)}.</p>`
          : ""}
        ${snapshot.salesBlockedByCategoryCoverage
          ? `<p class="empty-state">Sales paused. Stock at least one item in each unlocked category: ${escapeHtml(snapshot.missingCategories.join(", "))}.</p>`
          : ""}
        <div class="warning-row">
          <div class="warning-card ${snapshot.lowStockCount ? "warning-card--warn" : ""}">
            <span>Low stock</span>
            <strong>${snapshot.lowStockCount}</strong>
          </div>
          <div class="warning-card ${snapshot.soldOutCount ? "warning-card--bad" : ""}">
            <span>Sold out</span>
            <strong>${snapshot.soldOutCount}</strong>
          </div>
          <div class="warning-card">
            <span>Unlocked products</span>
            <strong>${snapshot.unlockedProductCount}</strong>
          </div>
          <div class="warning-card ${snapshot.salesBlockedByCategoryCoverage ? "warning-card--bad" : ""}">
            <span>Category coverage</span>
            <strong>${snapshot.salesBlockedByCategoryCoverage ? "Blocked" : "Ready"}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Progression</p>
            <h2>Current targets</h2>
          </div>
        </header>
        <div class="goal-list">
          <div class="goal-card">
            <span>Next license</span>
            <strong>${snapshot.nextLicense ? escapeHtml(snapshot.nextLicense.name) : "All licenses owned"}</strong>
            <small>${snapshot.nextLicense ? `${formatMoney(snapshot.nextLicense.cost)} required` : "Every category is unlocked."}</small>
          </div>
          <div class="goal-card">
            <span>Average daily profit</span>
            <strong>${formatMoney(snapshot.averageDailyProfit)}</strong>
            <small>Based on the last ${Math.max(1, state.stats.dailyHistory.length)} day(s).</small>
          </div>
          <div class="goal-card">
            <span>Best earners</span>
            <strong>${snapshot.topProducts.map((product) => product.name).join(", ")}</strong>
            <small>Ranked by lifetime profit contribution.</small>
          </div>
        </div>
      </article>

      <article class="panel panel--wide">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Recent activity</p>
            <h2>Sales feed</h2>
          </div>
        </header>
        <div class="feed-list">
          ${state.stats.saleLog.length
            ? state.stats.saleLog.map((entry) => `
                <div class="feed-item">
                  <div>
                    <strong>${entry.quantity}x ${escapeHtml(entry.productName)}</strong>
                    <p>Day ${entry.day} · ${entry.time}s before close</p>
                  </div>
                  <div class="feed-money">
                    <strong>${formatMoney(entry.revenue)}</strong>
                    <span>Profit ${formatMoney(entry.profit)}</span>
                  </div>
                </div>
              `).join("")
            : `<p class="empty-state">Sales will start appearing here as soon as stocked products are priced and available.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderInventory(state) {
  const groupedProducts = getProductsByCategory(state);

  return `
    <section class="content-grid">
      ${CATEGORY_ORDER.map((category) => {
        const entries = groupedProducts.get(category).filter(({ state: productState }) => productState.unlocked);
        if (!entries.length) {
          return "";
        }
        return `
          <article class="panel panel--wide">
            <header class="panel-head">
              <div>
                <p class="section-kicker">${category}</p>
                <h2>${category} inventory</h2>
              </div>
            </header>
            <div class="product-grid">
              ${entries.map(({ product, state: productState }) => {
                const lowThreshold = Math.max(3, Math.ceil(product.demand / 20));
                const stockLabel = productState.stock === 0
                  ? "Sold out"
                  : productState.stock <= lowThreshold
                    ? "Low stock"
                    : "In stock";
                return `
                  <article class="product-card">
                    <div class="product-card__top">
                      <div>
                        <h3>${escapeHtml(product.name)}</h3>
                        <p>${product.category} · Demand ${product.demand}</p>
                      </div>
                      <span class="status-chip ${productState.stock === 0 ? "status-chip--bad" : productState.stock <= lowThreshold ? "status-chip--warn" : "status-chip--good"}">${stockLabel}</span>
                    </div>
                    <div class="product-metrics">
                      <div><span>Stock</span><strong>${productState.stock}</strong></div>
                      <div><span>Sell price</span><strong>${formatMoney(productState.price)}</strong></div>
                      <div><span>Avg. unit cost</span><strong>${formatMoney(productState.averageCost)}</strong></div>
                      <div><span>Lifetime profit</span><strong>${formatMoney(productState.lifetimeProfit)}</strong></div>
                    </div>
                    <div class="card-actions">
                      <button class="action-btn action-btn--ghost" data-action="restock-product" data-product-id="${product.id}">Restock ${Math.max(4, Math.ceil(product.demand / 12))}</button>
                    </div>
                  </article>
                `;
              }).join("")}
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderSupplier(state, uiState) {
  const groupedProducts = getProductsByCategory(state);

  return `
    <section class="content-grid">
      ${CATEGORY_ORDER.map((category) => {
        const entries = groupedProducts.get(category);
        return `
          <article class="panel panel--wide">
            <header class="panel-head">
              <div>
                <p class="section-kicker">Supplier</p>
                <h2>${category}</h2>
              </div>
            </header>
            <div class="product-grid">
              ${entries.map(({ product, state: productState }) => {
                const wholesalePrice = getEffectiveWholesaleCost(state, product);
                const quantityValue = uiState.purchaseQuantities[product.id] ?? 6;
                const requiredExpansionName = STORE_EXPANSIONS[product.requiredExpansionLevel]?.name ?? "later store expansion";
                const lockReason = !state.licensesOwned[product.licenseId]
                  ? `Unlocked by ${LICENSES.find((license) => license.id === product.licenseId)?.name}.`
                  : `Expand to ${requiredExpansionName} to stock this item.`;
                return `
                  <article class="product-card ${productState.unlocked ? "" : "product-card--locked"}">
                    <div class="product-card__top">
                      <div>
                        <h3>${escapeHtml(product.name)}</h3>
                        <p>${product.category} · ${productState.unlocked ? "Unlocked" : "Locked"}</p>
                      </div>
                      <span class="status-chip ${productState.unlocked ? "status-chip--good" : ""}">${productState.unlocked ? "Ready to buy" : "Need license"}</span>
                    </div>
                    <div class="product-metrics">
                      <div><span>Wholesale</span><strong>${formatMoney(wholesalePrice)}</strong></div>
                      <div><span>Recommended</span><strong>${formatMoney(product.recommendedPrice)}</strong></div>
                      <div><span>Demand</span><strong>${product.demand}</strong></div>
                      <div><span>Storage/use</span><strong>${product.space}</strong></div>
                    </div>
                    <label class="field">
                      <span>Units to buy</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value="${quantityValue}"
                        data-input="quantity"
                        data-product-id="${product.id}"
                        data-focus-id="quantity-${product.id}"
                        ${productState.unlocked ? "" : "disabled"}
                      />
                    </label>
                    <div class="card-actions">
                      <button class="action-btn" data-action="buy-stock" data-product-id="${product.id}" ${productState.unlocked ? "" : "disabled"}>Buy delivery</button>
                    </div>
                    ${productState.unlocked
                      ? ""
                      : `<p class="locked-copy">${lockReason}</p>`}
                  </article>
                `;
              }).join("")}
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderPricing(state, uiState) {
  const unlockedProducts = getAvailableProducts(state);

  return `
    <section class="content-grid">
      <article class="panel panel--wide">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Pricing desk</p>
            <h2>Manual pricing controls</h2>
          </div>
        </header>
        <div class="pricing-grid">
          ${unlockedProducts.map((product) => {
            const productState = state.products[product.id];
            const mood = getPriceMood(product, productState.price);
            const demandMultiplier = getPriceDemandMultiplier(product, productState.price);
            const draftValue = uiState.priceDrafts[product.id] ?? productState.price.toFixed(2);
            return `
              <article class="product-card">
                <div class="product-card__top">
                  <div>
                    <h3>${escapeHtml(product.name)}</h3>
                    <p>${product.category} · Margin ${formatMoney(productState.price - productState.averageCost)} / unit</p>
                  </div>
                  <span class="status-chip status-chip--${mood.tone}">${mood.label}</span>
                </div>
                <div class="product-metrics">
                  <div><span>Current price</span><strong>${formatMoney(productState.price)}</strong></div>
                  <div><span>Recommended</span><strong>${formatMoney(product.recommendedPrice)}</strong></div>
                  <div><span>Wholesale</span><strong>${formatMoney(productState.averageCost)}</strong></div>
                  <div><span>Demand effect</span><strong>${formatPercent(demandMultiplier * 100)}</strong></div>
                </div>
                <label class="field">
                  <span>Set sale price</span>
                  <input
                    type="number"
                    min="0.5"
                    step="0.05"
                    value="${draftValue}"
                    data-input="price"
                    data-product-id="${product.id}"
                    data-focus-id="price-${product.id}"
                  />
                </label>
                <div class="card-actions">
                  <button class="action-btn" data-action="apply-price" data-product-id="${product.id}">Apply price</button>
                  <button class="action-btn action-btn--ghost" data-action="recommended-price" data-product-id="${product.id}">Use recommended</button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </article>
    </section>
  `;
}

function renderProgression(state) {
  const snapshot = getStoreSnapshot(state);
  return `
    <section class="content-grid">
      <article class="panel panel--wide">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Store expansion</p>
            <h2>${escapeHtml(snapshot.expansion.current.name)}</h2>
          </div>
          ${snapshot.expansion.next
            ? `<button class="action-btn" data-action="expand-store" ${state.money < snapshot.expansion.next.cost ? "disabled" : ""}>Expand store</button>`
            : ""}
        </header>
        <div class="goal-list">
          <div class="goal-card">
            <span>Current layout</span>
            <strong>${escapeHtml(snapshot.expansion.current.name)}</strong>
            <small>${escapeHtml(snapshot.expansion.current.description)}</small>
          </div>
          <div class="goal-card">
            <span>Storage bonus</span>
            <strong>+${snapshot.expansion.current.capacityBonus}</strong>
            <small>Expansion capacity stacks with storage upgrades.</small>
          </div>
          <div class="goal-card">
            <span>Next expansion</span>
            <strong>${snapshot.expansion.next ? escapeHtml(snapshot.expansion.next.name) : "Complete"}</strong>
            <small>${snapshot.expansion.next ? `${formatMoney(snapshot.expansion.next.cost)} · ${escapeHtml(snapshot.expansion.next.description)}` : "You already have the largest store layout."}</small>
          </div>
        </div>
      </article>

      <section class="content-grid content-grid--split">
        <article class="panel">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Licenses</p>
            <h2>Category unlocks</h2>
          </div>
        </header>
        <div class="stack-list">
          ${LICENSES.map((license) => {
            const owned = state.licensesOwned[license.id];
            const blocked = license.prerequisiteId && !state.licensesOwned[license.prerequisiteId];
            return `
              <article class="progress-card ${owned ? "progress-card--owned" : ""}">
                <div>
                  <h3>${escapeHtml(license.name)}</h3>
                  <p>${escapeHtml(license.description)}</p>
                </div>
                <div class="progress-meta">
                  <span>${owned ? "Owned" : formatMoney(license.cost)}</span>
                  <button class="action-btn" data-action="buy-license" data-license-id="${license.id}" ${owned || blocked || license.cost === 0 ? "disabled" : ""}>${owned ? "Owned" : blocked ? "Locked" : "Buy license"}</button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </article>

      <article class="panel">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Store upgrades</p>
            <h2>Permanent improvements</h2>
          </div>
        </header>
        <div class="stack-list">
          ${UPGRADES.map((upgrade) => {
            const level = state.upgrades[upgrade.id];
            const cost = getUpgradeCost(upgrade.id, level);
            const maxed = level >= upgrade.maxLevel;
            return `
              <article class="progress-card">
                <div>
                  <h3>${escapeHtml(upgrade.name)}</h3>
                  <p>${escapeHtml(upgrade.description)}</p>
                </div>
                <div class="progress-meta">
                  <span>Lv ${level}${maxed ? ` / ${upgrade.maxLevel}` : ` · ${formatMoney(cost)}`}</span>
                  <button class="action-btn" data-action="buy-upgrade" data-upgrade-id="${upgrade.id}" ${maxed ? "disabled" : ""}>${maxed ? "Maxed" : "Upgrade"}</button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
        <header class="panel-head">
          <div>
            <p class="section-kicker">Employees</p>
            <h2>Auto-restock staff</h2>
          </div>
        </header>
        <div class="stack-list">
          ${EMPLOYEES.map((employee) => {
            const currentCount = state.employees[employee.id];
            const hireCost = getEmployeeHireCost(employee.id, currentCount);
            return `
              <article class="progress-card">
                <div>
                  <h3>${escapeHtml(employee.name)}</h3>
                  <p>${escapeHtml(employee.description)}</p>
                </div>
                <div class="progress-meta">
                  <span>${currentCount} hired · ${formatMoney(hireCost)}</span>
                  <button class="action-btn" data-action="hire-employee" data-employee-id="${employee.id}" ${state.money < hireCost ? "disabled" : ""}>Hire</button>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </article>
      </section>
    </section>
  `;
}

function renderStats(state) {
  const levelProgress = getLevelProgress(state);
  return `
    <section class="content-grid content-grid--split">
      <article class="panel">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Lifetime</p>
            <h2>Business stats</h2>
          </div>
        </header>
        <div class="stat-grid stat-grid--compact">
          <div class="stat-card">
            <span>Total revenue</span>
            <strong>${formatMoney(state.totalRevenue)}</strong>
          </div>
          <div class="stat-card">
            <span>Total profit</span>
            <strong>${formatMoney(state.totalProfit)}</strong>
          </div>
          <div class="stat-card">
            <span>Customers served</span>
            <strong>${formatCount(state.stats.lifetimeCustomers)}</strong>
          </div>
          <div class="stat-card">
            <span>Items sold</span>
            <strong>${formatCount(state.stats.lifetimeItemsSold)}</strong>
          </div>
          <div class="stat-card">
            <span>Store level</span>
            <strong>${state.storeLevel}</strong>
            <small>${levelProgress.name}</small>
          </div>
          <div class="stat-card">
            <span>Inventory spend</span>
            <strong>${formatMoney(state.totalSpentOnInventory)}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Daily history</p>
            <h2>Last ${state.stats.dailyHistory.length || 0} day(s)</h2>
          </div>
        </header>
        <div class="history-list">
          ${state.stats.dailyHistory.length
            ? state.stats.dailyHistory.map((entry) => `
                <div class="history-item">
                  <div>
                    <strong>Day ${entry.day}</strong>
                    <p>${entry.itemsSold} items · ${entry.customers} customers</p>
                  </div>
                  <div class="history-money">
                    <strong>${formatMoney(entry.profit)}</strong>
                    <span>Revenue ${formatMoney(entry.revenue)} · Best seller ${escapeHtml(getBestSellerName(entry.bestSellerId))}</span>
                  </div>
                </div>
              `).join("")
            : `<p class="empty-state">Finish a day to start building historical stats.</p>`}
        </div>
      </article>
    </section>
  `;
}

function renderSettings(state) {
  return `
    <section class="content-grid">
      <article class="panel panel--wide">
        <header class="panel-head">
          <div>
            <p class="section-kicker">Settings</p>
            <h2>Local save controls</h2>
          </div>
        </header>
        <div class="settings-grid">
          <div class="setting-card">
            <span>Save mode</span>
            <strong>Browser local storage only</strong>
            <p>No account, Firebase, Firestore, or cloud sync is used.</p>
          </div>
          <div class="setting-card">
            <span>Last save</span>
            <strong>${new Date(state.saveMeta.lastSavedAt).toLocaleString()}</strong>
            <p>${escapeHtml(state.saveMeta.lastAutoSaveLabel)}</p>
          </div>
          <div class="setting-card">
            <span>Reset progress</span>
            <strong>Start over clean</strong>
            <p>Deletes the local save and rebuilds the starter store.</p>
            <button class="action-btn action-btn--danger" data-action="reset-save">Reset local save</button>
          </div>
        </div>
      </article>
    </section>
  `;
}

export function renderApp(root, state, uiState) {
  const panels = {
    overview: renderOverview(state),
    inventory: renderInventory(state),
    supplier: renderSupplier(state, uiState),
    pricing: renderPricing(state, uiState),
    progression: renderProgression(state),
    stats: renderStats(state),
    settings: renderSettings(state)
  };

  root.innerHTML = `
    <div class="game-shell">
      ${renderTopBar(state, uiState)}
      ${renderTabs(uiState)}
      <main class="main-stage">
        ${panels[uiState.activeTab]}
      </main>
    </div>
  `;
}
