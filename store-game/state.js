import {
  DEFAULT_PURCHASE_QUANTITY,
  EMPLOYEES,
  LICENSES,
  PRODUCTS,
  SAVE_VERSION,
  STORE_EXPANSIONS,
  UPGRADES
} from "./data.js";

function createProductState(product) {
  return {
    unlocked: product.licenseId === "basic",
    stock: 0,
    price: product.recommendedPrice,
    averageCost: product.wholesaleCost,
    lastWholesalePrice: product.wholesaleCost,
    lifetimeUnitsPurchased: 0,
    lifetimeUnitsSold: 0,
    lifetimeRevenue: 0,
    lifetimeProfit: 0
  };
}

function createEmptyDayStats() {
  return {
    revenue: 0,
    profit: 0,
    itemsSold: 0,
    customers: 0,
    productSales: {}
  };
}

export function createInitialState() {
  const employees = Object.fromEntries(EMPLOYEES.map((employee) => [employee.id, 0]));
  const licensesOwned = Object.fromEntries(LICENSES.map((license) => [license.id, license.id === "basic"]));
  const upgrades = Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0]));
  const products = Object.fromEntries(PRODUCTS.map((product) => [product.id, createProductState(product)]));

  const state = {
    version: SAVE_VERSION,
    money: 450,
    totalRevenue: 0,
    totalProfit: 0,
    totalSpentOnInventory: 0,
    day: 1,
    dayClock: 0,
    sessionSeconds: 0,
    customerAccumulator: 0,
    storeXp: 0,
    storeLevel: 1,
    storeExpansionLevel: 0,
    storeName: STORE_EXPANSIONS[0].name,
    reputation: 52,
    employees,
    autoRestockProgress: 0,
    lastEmployeeRestock: null,
    licensesOwned,
    upgrades,
    products,
    stats: {
      lifetimeCustomers: 0,
      lifetimeItemsSold: 0,
      saleLog: [],
      dailyHistory: [],
      currentDay: createEmptyDayStats()
    },
    saveMeta: {
      lastSavedAt: Date.now(),
      lastAutoSaveLabel: "Fresh start",
      lastLoadedAt: Date.now()
    }
  };

  syncUnlockedProducts(state);
  return state;
}

export function createUiState(gameState) {
  const purchaseQuantities = {};
  const priceDrafts = {};

  Object.entries(gameState.products).forEach(([productId, productState]) => {
    purchaseQuantities[productId] = DEFAULT_PURCHASE_QUANTITY;
    priceDrafts[productId] = productState.price.toFixed(2);
  });

  return {
    activeTab: "overview",
    purchaseQuantities,
    priceDrafts,
    notice: "Local save active. Progress is stored only in this browser.",
    saveStatus: "Loaded local save",
    lastTickLabel: "Idle"
  };
}

export function createEmptyDaySnapshot(day) {
  return {
    day,
    revenue: 0,
    profit: 0,
    itemsSold: 0,
    customers: 0,
    bestSellerId: null
  };
}

export function syncUnlockedProducts(state) {
  Object.entries(state.products).forEach(([productId, productState]) => {
    const product = PRODUCTS.find((entry) => entry.id === productId);
    productState.unlocked = Boolean(
      state.licensesOwned[product.licenseId] &&
      state.storeExpansionLevel >= (product.requiredExpansionLevel ?? 0)
    );
  });
}

export function syncUiStateWithGame(uiState, gameState) {
  Object.entries(gameState.products).forEach(([productId, productState]) => {
    if (!(productId in uiState.purchaseQuantities)) {
      uiState.purchaseQuantities[productId] = DEFAULT_PURCHASE_QUANTITY;
    }
    if (!(productId in uiState.priceDrafts)) {
      uiState.priceDrafts[productId] = productState.price.toFixed(2);
    }
  });
}

function sanitizeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeInteger(value, fallback) {
  return Number.isInteger(value) ? value : fallback;
}

export function normalizeState(rawState) {
  const baseState = createInitialState();
  const saveHasExplicitExpansionLevel = Number.isInteger(rawState?.storeExpansionLevel);

  if (!rawState || typeof rawState !== "object") {
    return baseState;
  }

  baseState.version = SAVE_VERSION;
  baseState.money = Math.max(0, sanitizeNumber(rawState.money, baseState.money));
  baseState.totalRevenue = Math.max(0, sanitizeNumber(rawState.totalRevenue, baseState.totalRevenue));
  baseState.totalProfit = sanitizeNumber(rawState.totalProfit, baseState.totalProfit);
  baseState.totalSpentOnInventory = Math.max(0, sanitizeNumber(rawState.totalSpentOnInventory, baseState.totalSpentOnInventory));
  baseState.day = Math.max(1, sanitizeInteger(rawState.day, baseState.day));
  baseState.dayClock = Math.max(0, sanitizeNumber(rawState.dayClock, baseState.dayClock));
  baseState.sessionSeconds = Math.max(0, sanitizeNumber(rawState.sessionSeconds, baseState.sessionSeconds));
  baseState.customerAccumulator = Math.max(0, sanitizeNumber(rawState.customerAccumulator, 0));
  baseState.storeXp = Math.max(0, sanitizeNumber(rawState.storeXp, baseState.storeXp));
  baseState.storeLevel = Math.max(1, sanitizeInteger(rawState.storeLevel, baseState.storeLevel));
  const inferredExpansionLevel = Math.max(
    0,
    Number.isInteger(rawState.storeExpansionLevel)
      ? rawState.storeExpansionLevel
      : Math.max(
        rawState.licensesOwned?.luxury ? 5 : 0,
        rawState.licensesOwned?.electronics ? 4 : 0,
        rawState.licensesOwned?.clothing ? 3 : 0,
        rawState.licensesOwned?.grocery ? 2 : 0,
        rawState.licensesOwned?.snack ? 1 : 0,
        Math.min(STORE_EXPANSIONS.length - 1, Math.floor((sanitizeInteger(rawState.storeLevel, 1) - 1) / 2))
      )
  );
  baseState.storeExpansionLevel = Math.min(STORE_EXPANSIONS.length - 1, inferredExpansionLevel);
  baseState.storeName = STORE_EXPANSIONS[baseState.storeExpansionLevel].name;
  baseState.reputation = Math.max(1, Math.min(100, sanitizeNumber(rawState.reputation, baseState.reputation)));
  baseState.autoRestockProgress = Math.max(0, sanitizeNumber(rawState.autoRestockProgress, 0));

  if (rawState.employees && typeof rawState.employees === "object") {
    Object.keys(baseState.employees).forEach((employeeId) => {
      baseState.employees[employeeId] = Math.max(0, sanitizeInteger(rawState.employees[employeeId], 0));
    });
  }

  if (rawState.lastEmployeeRestock && typeof rawState.lastEmployeeRestock === "object") {
    baseState.lastEmployeeRestock = {
      productId: typeof rawState.lastEmployeeRestock.productId === "string" ? rawState.lastEmployeeRestock.productId : "",
      productName: typeof rawState.lastEmployeeRestock.productName === "string" ? rawState.lastEmployeeRestock.productName : "",
      quantity: Math.max(0, sanitizeInteger(rawState.lastEmployeeRestock.quantity, 0)),
      spent: Math.max(0, sanitizeNumber(rawState.lastEmployeeRestock.spent, 0)),
      atSecond: Math.max(0, sanitizeNumber(rawState.lastEmployeeRestock.atSecond, 0))
    };
  }

  if (rawState.licensesOwned && typeof rawState.licensesOwned === "object") {
    Object.keys(baseState.licensesOwned).forEach((licenseId) => {
      baseState.licensesOwned[licenseId] = Boolean(rawState.licensesOwned[licenseId]);
    });
    baseState.licensesOwned.basic = true;
  }

  if (rawState.upgrades && typeof rawState.upgrades === "object") {
    Object.keys(baseState.upgrades).forEach((upgradeId) => {
      const fallback = baseState.upgrades[upgradeId];
      baseState.upgrades[upgradeId] = Math.max(0, sanitizeInteger(rawState.upgrades[upgradeId], fallback));
    });
  }

  if (rawState.products && typeof rawState.products === "object") {
    Object.entries(baseState.products).forEach(([productId, defaultState]) => {
      const incoming = rawState.products[productId];
      if (!incoming || typeof incoming !== "object") {
        return;
      }
      defaultState.stock = Math.max(0, sanitizeInteger(incoming.stock, defaultState.stock));
      defaultState.price = Math.max(0.5, sanitizeNumber(incoming.price, defaultState.price));
      defaultState.averageCost = Math.max(0.01, sanitizeNumber(incoming.averageCost, defaultState.averageCost));
      defaultState.lastWholesalePrice = Math.max(0.01, sanitizeNumber(incoming.lastWholesalePrice, defaultState.lastWholesalePrice));
      defaultState.lifetimeUnitsPurchased = Math.max(0, sanitizeInteger(incoming.lifetimeUnitsPurchased, defaultState.lifetimeUnitsPurchased));
      defaultState.lifetimeUnitsSold = Math.max(0, sanitizeInteger(incoming.lifetimeUnitsSold, defaultState.lifetimeUnitsSold));
      defaultState.lifetimeRevenue = Math.max(0, sanitizeNumber(incoming.lifetimeRevenue, defaultState.lifetimeRevenue));
      defaultState.lifetimeProfit = sanitizeNumber(incoming.lifetimeProfit, defaultState.lifetimeProfit);
      defaultState.unlocked = Boolean(incoming.unlocked);
    });
  }

  if (!saveHasExplicitExpansionLevel) {
    const highestExpansionFromOwnedProducts = PRODUCTS.reduce((highest, product) => {
      const productState = baseState.products[product.id];
      const hasTouchedProduct = productState.stock > 0 || productState.lifetimeUnitsPurchased > 0 || productState.lifetimeUnitsSold > 0;
      return hasTouchedProduct ? Math.max(highest, product.requiredExpansionLevel ?? 0) : highest;
    }, baseState.storeExpansionLevel);
    baseState.storeExpansionLevel = Math.min(STORE_EXPANSIONS.length - 1, highestExpansionFromOwnedProducts);
    baseState.storeName = STORE_EXPANSIONS[baseState.storeExpansionLevel].name;
  }

  const incomingStats = rawState.stats;
  if (incomingStats && typeof incomingStats === "object") {
    baseState.stats.lifetimeCustomers = Math.max(0, sanitizeInteger(incomingStats.lifetimeCustomers, 0));
    baseState.stats.lifetimeItemsSold = Math.max(0, sanitizeInteger(incomingStats.lifetimeItemsSold, 0));
    baseState.stats.saleLog = Array.isArray(incomingStats.saleLog)
      ? incomingStats.saleLog.slice(0, 18).filter((entry) => entry && typeof entry === "object")
      : [];
    baseState.stats.dailyHistory = Array.isArray(incomingStats.dailyHistory)
      ? incomingStats.dailyHistory.slice(0, 14).filter((entry) => entry && typeof entry === "object")
      : [];

    const currentDay = incomingStats.currentDay;
    if (currentDay && typeof currentDay === "object") {
      baseState.stats.currentDay = {
        revenue: Math.max(0, sanitizeNumber(currentDay.revenue, 0)),
        profit: sanitizeNumber(currentDay.profit, 0),
        itemsSold: Math.max(0, sanitizeInteger(currentDay.itemsSold, 0)),
        customers: Math.max(0, sanitizeInteger(currentDay.customers, 0)),
        productSales: currentDay.productSales && typeof currentDay.productSales === "object"
          ? { ...currentDay.productSales }
          : {}
      };
    }
  }

  if (rawState.saveMeta && typeof rawState.saveMeta === "object") {
    baseState.saveMeta.lastSavedAt = sanitizeNumber(rawState.saveMeta.lastSavedAt, Date.now());
    baseState.saveMeta.lastAutoSaveLabel = typeof rawState.saveMeta.lastAutoSaveLabel === "string"
      ? rawState.saveMeta.lastAutoSaveLabel
      : baseState.saveMeta.lastAutoSaveLabel;
    baseState.saveMeta.lastLoadedAt = sanitizeNumber(rawState.saveMeta.lastLoadedAt, Date.now());
  }

  syncUnlockedProducts(baseState);
  return baseState;
}
