import {
  CATEGORY_ORDER,
  DAY_LENGTH_SECONDS,
  EMPLOYEES_BY_ID,
  LICENSES,
  LICENSES_BY_ID,
  MAX_DAILY_HISTORY,
  MAX_RECENT_SALES,
  PRODUCTS,
  PRODUCTS_BY_ID,
  STORE_EXPANSIONS,
  STORE_EXPANSIONS_BY_LEVEL,
  STORE_NAMES,
  UPGRADES_BY_ID
} from "./data.js";
import { createEmptyDaySnapshot, syncUnlockedProducts } from "./state.js";

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function randomInt(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function chooseWeighted(entries) {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }

  let roll = Math.random() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.value;
    }
  }
  return entries[entries.length - 1]?.value ?? null;
}

export function getUpgradeCost(upgradeId, currentLevel) {
  const upgrade = UPGRADES_BY_ID.get(upgradeId);
  return Math.round(upgrade.baseCost * upgrade.costGrowth ** currentLevel);
}

export function getEmployeeHireCost(employeeId, currentCount) {
  const employee = EMPLOYEES_BY_ID.get(employeeId);
  return Math.round(employee.baseCost * employee.costGrowth ** currentCount);
}

export function getSupplierDiscount(state) {
  return clamp(state.upgrades.supplier * 0.04, 0, 0.24);
}

export function getEffectiveWholesaleCost(state, product) {
  return roundMoney(product.wholesaleCost * (1 - getSupplierDiscount(state)));
}

export function getUsedCapacity(state) {
  return PRODUCTS.reduce((sum, product) => {
    return sum + state.products[product.id].stock * product.space;
  }, 0);
}

export function getStorageCapacity(state) {
  const expansionBonus = STORE_EXPANSIONS_BY_LEVEL.get(state.storeExpansionLevel)?.capacityBonus ?? 0;
  return 80 + expansionBonus + state.upgrades.storage * 25;
}

export function getDailyTrafficRate(state) {
  const levelBonus = (state.storeLevel - 1) * 0.06;
  const trafficBonus = state.upgrades.traffic * 0.18;
  const shelfBonus = state.upgrades.shelves * 0.04;
  const reputationBonus = Math.max(0, (state.reputation - 50) / 180);
  return 0.65 + levelBonus + trafficBonus + shelfBonus + reputationBonus;
}

export function getPriceDemandMultiplier(product, playerPrice) {
  const priceRatio = playerPrice / product.recommendedPrice;
  if (priceRatio <= 0.72) {
    return 1.75;
  }
  if (priceRatio <= 0.85) {
    return 1.4;
  }
  if (priceRatio <= 1) {
    return 1;
  }
  if (priceRatio <= 1.08) {
    return 0.72;
  }
  if (priceRatio <= 1.18) {
    return 0.42;
  }
  if (priceRatio <= 1.28) {
    return 0.2;
  }
  if (priceRatio <= 1.4) {
    return 0.08;
  }
  if (priceRatio <= 1.55) {
    return 0.03;
  }
  return 0.01;
}

export function getPriceMood(product, playerPrice) {
  const ratio = playerPrice / product.recommendedPrice;
  if (ratio <= 0.8) {
    return { label: "Hot deal", tone: "good" };
  }
  if (ratio <= 1.05) {
    return { label: "Balanced", tone: "neutral" };
  }
  if (ratio <= 1.25) {
    return { label: "Slow mover", tone: "warn" };
  }
  return { label: "Overpriced", tone: "bad" };
}

export function getAvailableProducts(state) {
  return PRODUCTS.filter((product) => state.products[product.id].unlocked);
}

export function getProductsByCategory(state) {
  const grouped = new Map(CATEGORY_ORDER.map((category) => [category, []]));
  PRODUCTS.forEach((product) => {
    grouped.get(product.category).push({
      product,
      state: state.products[product.id]
    });
  });
  return grouped;
}

export function getMissingStockedCategories(state) {
  return CATEGORY_ORDER.filter((category) => {
    const unlockedProductsInCategory = PRODUCTS.filter((product) => {
      return product.category === category && state.products[product.id].unlocked;
    });

    if (!unlockedProductsInCategory.length) {
      return false;
    }

    return !unlockedProductsInCategory.some((product) => state.products[product.id].stock > 0);
  });
}

export function getLowStockProducts(state) {
  return getAvailableProducts(state).filter((product) => {
    const productState = state.products[product.id];
    const lowStockThreshold = Math.max(3, Math.ceil(product.demand / 20));
    return productState.stock > 0 && productState.stock <= lowStockThreshold;
  });
}

function getAutoRestockCandidates(state) {
  return getAvailableProducts(state)
    .map((product) => {
      const productState = state.products[product.id];
      if (productState.stock > 0) {
        return null;
      }
      return {
        product,
        targetStock: clamp(Math.ceil(product.demand / 5), 5, 18)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.product.demand - left.product.demand);
}

export function getSoldOutProducts(state) {
  return getAvailableProducts(state).filter((product) => state.products[product.id].stock === 0);
}

export function getExpansionName(level) {
  const nameIndex = Math.min(STORE_NAMES.length - 1, Math.floor((level - 1) / 2));
  return STORE_NAMES[nameIndex];
}

function getXpThresholdForLevel(level) {
  return 120 + level * level * 95;
}

function applyStoreExperience(state, xpGain) {
  state.storeXp += xpGain;

  let nextThreshold = getXpThresholdForLevel(state.storeLevel);
  let leveledUp = false;

  while (state.storeXp >= nextThreshold) {
    state.storeXp -= nextThreshold;
    state.storeLevel += 1;
    state.reputation = clamp(state.reputation + 2, 1, 100);
    leveledUp = true;
    nextThreshold = getXpThresholdForLevel(state.storeLevel);
  }

  return {
    leveledUp,
    nextThreshold
  };
}

export function getLevelProgress(state) {
  return {
    current: state.storeXp,
    required: getXpThresholdForLevel(state.storeLevel),
    name: getExpansionName(state.storeLevel)
  };
}

function computeReputationTarget(state) {
  const unlockedProducts = getAvailableProducts(state);
  const stockedCount = unlockedProducts.filter((product) => state.products[product.id].stock > 0).length;
  const stockRatio = unlockedProducts.length ? stockedCount / unlockedProducts.length : 1;
  const pricingFairness = unlockedProducts.length
    ? unlockedProducts.reduce((sum, product) => {
      const currentPrice = state.products[product.id].price;
      const ratio = currentPrice / product.recommendedPrice;
      return sum + clamp(1.15 - Math.abs(1 - ratio), 0.45, 1.05);
    }, 0) / unlockedProducts.length
    : 1;

  const base = 46;
  const upgradeBonus = state.upgrades.reputation * 4;
  const levelBonus = (state.storeLevel - 1) * 1.8;
  const stockBonus = stockRatio * 16;
  const fairnessBonus = pricingFairness * 12;
  return clamp(base + upgradeBonus + levelBonus + stockBonus + fairnessBonus, 25, 96);
}

function addSaleLogEntry(state, payload) {
  state.stats.saleLog.unshift(payload);
  state.stats.saleLog = state.stats.saleLog.slice(0, MAX_RECENT_SALES);
}

function registerSale(state, product, quantity) {
  const productState = state.products[product.id];
  const revenue = roundMoney(productState.price * quantity);
  const costBasis = roundMoney(productState.averageCost * quantity);
  const profit = roundMoney(revenue - costBasis);

  productState.stock -= quantity;
  productState.lifetimeUnitsSold += quantity;
  productState.lifetimeRevenue = roundMoney(productState.lifetimeRevenue + revenue);
  productState.lifetimeProfit = roundMoney(productState.lifetimeProfit + profit);

  state.money = roundMoney(state.money + revenue);
  state.totalRevenue = roundMoney(state.totalRevenue + revenue);
  state.totalProfit = roundMoney(state.totalProfit + profit);
  state.stats.lifetimeItemsSold += quantity;

  state.stats.currentDay.revenue = roundMoney(state.stats.currentDay.revenue + revenue);
  state.stats.currentDay.profit = roundMoney(state.stats.currentDay.profit + profit);
  state.stats.currentDay.itemsSold += quantity;
  state.stats.currentDay.productSales[product.id] = (state.stats.currentDay.productSales[product.id] ?? 0) + quantity;

  const xpGain = revenue * 0.45 + quantity * 3;
  const levelResult = applyStoreExperience(state, xpGain);
  addSaleLogEntry(state, {
    day: state.day,
    time: Math.max(0, DAY_LENGTH_SECONDS - Math.floor(state.dayClock)),
    productName: product.name,
    quantity,
    revenue,
    profit
  });

  if (levelResult.leveledUp) {
    return `Store level up. ${state.storeName} is now level ${state.storeLevel}.`;
  }
  return "";
}

function determineBasketQuantity(state, product) {
  const productState = state.products[product.id];
  const priceRatio = productState.price / product.recommendedPrice;
  let maxQuantity = 1;

  if (product.demand >= 75 || priceRatio <= 0.92) {
    maxQuantity += 1;
  }
  if (state.upgrades.shelves >= 3 && product.demand >= 60) {
    maxQuantity += 1;
  }
  if (product.category === "Luxury" || product.category === "Electronics") {
    maxQuantity = Math.min(maxQuantity, 1);
  }

  return clamp(randomInt(1, maxQuantity), 1, productState.stock);
}

function getPurchaseAcceptanceChance(state, product) {
  const demandMultiplier = getPriceDemandMultiplier(product, state.products[product.id].price);
  const reputationBonus = state.reputation / 280;
  const shelfBonus = state.upgrades.shelves * 0.025;
  return clamp(demandMultiplier * 0.82 + reputationBonus + shelfBonus, 0.02, 0.97);
}

function runCustomerVisit(state) {
  if (getMissingStockedCategories(state).length > 0) {
    return "";
  }

  const weightedProducts = getAvailableProducts(state)
    .map((product) => {
      const productState = state.products[product.id];
      if (productState.stock <= 0) {
        return null;
      }
      const demandWeight = product.demand * getPriceDemandMultiplier(product, productState.price);
      const shelfBoost = 1 + state.upgrades.shelves * 0.05;
      return {
        value: product,
        weight: demandWeight * shelfBoost
      };
    })
    .filter(Boolean);

  state.stats.lifetimeCustomers += 1;
  state.stats.currentDay.customers += 1;

  if (!weightedProducts.length) {
    return "";
  }

  const totalAppeal = weightedProducts.reduce((sum, entry) => sum + entry.weight, 0);
  const conversionChance = clamp(
    0.18 +
      totalAppeal / 760 +
      state.reputation / 180 +
      state.upgrades.shelves * 0.025 +
      state.storeLevel * 0.01,
    0.15,
    0.94
  );

  if (Math.random() > conversionChance) {
    return "";
  }

  const basketSize = 1 + (Math.random() < clamp(0.1 + state.upgrades.shelves * 0.04 + state.storeLevel * 0.015, 0.1, 0.4) ? 1 : 0);
  let levelNotice = "";
  const chosenIds = new Set();

  for (let itemIndex = 0; itemIndex < basketSize; itemIndex += 1) {
    const candidates = weightedProducts.filter((entry) => !chosenIds.has(entry.value.id) && state.products[entry.value.id].stock > 0);
    const product = chooseWeighted(candidates);
    if (!product) {
      break;
    }
    chosenIds.add(product.id);

    if (Math.random() > getPurchaseAcceptanceChance(state, product)) {
      continue;
    }

    const quantity = determineBasketQuantity(state, product);
    if (quantity <= 0) {
      continue;
    }
    const notice = registerSale(state, product, quantity);
    if (notice) {
      levelNotice = notice;
    }
  }

  return levelNotice;
}

function closeDay(state) {
  const productSalesEntries = Object.entries(state.stats.currentDay.productSales);
  const bestSellerId = productSalesEntries.sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  const dailySnapshot = createEmptyDaySnapshot(state.day);
  dailySnapshot.revenue = roundMoney(state.stats.currentDay.revenue);
  dailySnapshot.profit = roundMoney(state.stats.currentDay.profit);
  dailySnapshot.itemsSold = state.stats.currentDay.itemsSold;
  dailySnapshot.customers = state.stats.currentDay.customers;
  dailySnapshot.bestSellerId = bestSellerId;

  state.stats.dailyHistory.unshift(dailySnapshot);
  state.stats.dailyHistory = state.stats.dailyHistory.slice(0, MAX_DAILY_HISTORY);
  state.stats.currentDay = {
    revenue: 0,
    profit: 0,
    itemsSold: 0,
    customers: 0,
    productSales: {}
  };
  state.day += 1;
  state.dayClock = 0;
}

function processEmployeeAutoRestock(state) {
  const stockClerks = state.employees["stock-clerk"];
  if (!stockClerks) {
    return;
  }

  const candidates = getAutoRestockCandidates(state);
  if (!candidates.length) {
    return;
  }

  let restocksRemaining = stockClerks;
  for (const candidate of candidates) {
    if (restocksRemaining <= 0) {
      break;
    }

    const quantity = candidate.targetStock;
    const result = buyStock(state, candidate.product.id, quantity);
    if (!result.ok) {
      continue;
    }

    state.lastEmployeeRestock = {
      productId: candidate.product.id,
      productName: candidate.product.name,
      quantity,
      spent: roundMoney(getEffectiveWholesaleCost(state, candidate.product) * quantity),
      atSecond: state.sessionSeconds
    };
    restocksRemaining -= 1;
  }
}

export function tickState(state, seconds = 1) {
  let notice = "";

  for (let second = 0; second < seconds; second += 1) {
    state.sessionSeconds += 1;
    state.dayClock += 1;

    state.customerAccumulator += getDailyTrafficRate(state);
    while (state.customerAccumulator >= 1) {
      state.customerAccumulator -= 1;
      const customerNotice = runCustomerVisit(state);
      if (customerNotice) {
        notice = customerNotice;
      }
    }

    processEmployeeAutoRestock(state);

    const reputationTarget = computeReputationTarget(state);
    state.reputation = roundMoney(state.reputation + (reputationTarget - state.reputation) * 0.06);

    if (state.dayClock >= DAY_LENGTH_SECONDS) {
      closeDay(state);
    }
  }

  return notice;
}

export function buyStock(state, productId, quantity) {
  syncUnlockedProducts(state);
  const product = PRODUCTS_BY_ID.get(productId);
  const productState = state.products[productId];
  const parsedQuantity = Math.floor(quantity);

  if (!product || !productState.unlocked) {
    return { ok: false, message: "That product is still locked." };
  }
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return { ok: false, message: "Choose a valid restock quantity." };
  }

  const usedCapacity = getUsedCapacity(state);
  const freeCapacity = getStorageCapacity(state) - usedCapacity;
  const spaceNeeded = parsedQuantity * product.space;
  if (spaceNeeded > freeCapacity) {
    return { ok: false, message: "Not enough storage space for that delivery." };
  }

  const unitCost = getEffectiveWholesaleCost(state, product);
  const totalCost = roundMoney(unitCost * parsedQuantity);
  if (totalCost > state.money) {
    return { ok: false, message: "You do not have enough cash for that wholesale order." };
  }

  const currentInventoryValue = roundMoney(productState.averageCost * productState.stock);
  state.money = roundMoney(state.money - totalCost);
  state.totalSpentOnInventory = roundMoney(state.totalSpentOnInventory + totalCost);
  productState.stock += parsedQuantity;
  productState.lastWholesalePrice = unitCost;
  productState.averageCost = roundMoney((currentInventoryValue + totalCost) / productState.stock);
  productState.lifetimeUnitsPurchased += parsedQuantity;

  return {
    ok: true,
    message: `Bought ${parsedQuantity} ${product.name} for $${totalCost.toFixed(2)}.`
  };
}

export function restockLowStock(state) {
  const lowStockProducts = getLowStockProducts(state);
  if (!lowStockProducts.length) {
    return { ok: false, message: "Nothing is low on stock right now." };
  }

  let itemsRestocked = 0;
  let totalSpend = 0;

  for (const product of lowStockProducts.sort((left, right) => right.demand - left.demand)) {
    const productState = state.products[product.id];
    const targetStock = clamp(Math.ceil(product.demand / 5), 5, 18);
    const quantity = Math.max(0, targetStock - productState.stock);
    if (quantity === 0) {
      continue;
    }
    const result = buyStock(state, product.id, quantity);
    if (result.ok) {
      itemsRestocked += quantity;
      totalSpend = roundMoney(totalSpend + getEffectiveWholesaleCost(state, product) * quantity);
    }
  }

  if (!itemsRestocked) {
    return { ok: false, message: "No low-stock items could be afforded or stored." };
  }

  return {
    ok: true,
    message: `Restocked ${itemsRestocked} units across low-stock shelves for $${totalSpend.toFixed(2)}.`
  };
}

export function setProductPrice(state, productId, nextPrice) {
  const product = PRODUCTS_BY_ID.get(productId);
  const productState = state.products[productId];
  const parsedPrice = Number(nextPrice);

  if (!product || !productState.unlocked) {
    return { ok: false, message: "That product is still locked." };
  }
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0.5) {
    return { ok: false, message: "Enter a valid selling price of at least $0.50." };
  }

  productState.price = roundMoney(parsedPrice);
  return {
    ok: true,
    message: `${product.name} is now priced at $${productState.price.toFixed(2)}.`
  };
}

export function buyLicense(state, licenseId) {
  const license = LICENSES_BY_ID.get(licenseId);
  const beforeAvailableCount = getAvailableProducts(state).length;
  if (!license) {
    return { ok: false, message: "That license does not exist." };
  }
  if (state.licensesOwned[licenseId]) {
    return { ok: false, message: "You already own that license." };
  }
  if (license.prerequisiteId && !state.licensesOwned[license.prerequisiteId]) {
    const prerequisite = LICENSES_BY_ID.get(license.prerequisiteId);
    return { ok: false, message: `Buy ${prerequisite.name} first.` };
  }
  if (state.money < license.cost) {
    return { ok: false, message: "You do not have enough cash for that license." };
  }

  state.money = roundMoney(state.money - license.cost);
  state.licensesOwned[licenseId] = true;
  syncUnlockedProducts(state);
  state.reputation = clamp(state.reputation + 3, 1, 100);
  const unlockedNow = getAvailableProducts(state).length - beforeAvailableCount;

  return {
    ok: true,
    message: `${license.name} purchased. ${unlockedNow > 0 ? `${unlockedNow} products are live now.` : "More products will appear as you expand the store."}`
  };
}

export function buyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES_BY_ID.get(upgradeId);
  if (!upgrade) {
    return { ok: false, message: "That upgrade does not exist." };
  }

  const currentLevel = state.upgrades[upgradeId];
  if (currentLevel >= upgrade.maxLevel) {
    return { ok: false, message: `${upgrade.name} is already maxed out.` };
  }

  const cost = getUpgradeCost(upgradeId, currentLevel);
  if (state.money < cost) {
    return { ok: false, message: "You do not have enough cash for that upgrade." };
  }

  state.money = roundMoney(state.money - cost);
  state.upgrades[upgradeId] += 1;
  if (upgradeId === "reputation") {
    state.reputation = clamp(state.reputation + 4, 1, 100);
  }

  return {
    ok: true,
    message: `${upgrade.name} upgraded to level ${state.upgrades[upgradeId]}.`
  };
}

export function hireEmployee(state, employeeId) {
  const employee = EMPLOYEES_BY_ID.get(employeeId);
  if (!employee) {
    return { ok: false, message: "That employee role does not exist." };
  }

  const currentCount = state.employees[employeeId];
  const hireCost = getEmployeeHireCost(employeeId, currentCount);
  if (state.money < hireCost) {
    return { ok: false, message: "You do not have enough cash to hire that employee." };
  }

  state.money = roundMoney(state.money - hireCost);
  state.employees[employeeId] += 1;

  return {
    ok: true,
    message: `${employee.name} hired. Auto-restock coverage improved.`
  };
}

export function expandStore(state) {
  const currentExpansion = STORE_EXPANSIONS_BY_LEVEL.get(state.storeExpansionLevel);
  const nextExpansion = STORE_EXPANSIONS_BY_LEVEL.get(state.storeExpansionLevel + 1);
  const beforeAvailableCount = getAvailableProducts(state).length;

  if (!nextExpansion) {
    return { ok: false, message: "Your store is already at the maximum expansion size." };
  }
  if (state.money < nextExpansion.cost) {
    return { ok: false, message: "You do not have enough cash to expand the store yet." };
  }

  state.money = roundMoney(state.money - nextExpansion.cost);
  state.storeExpansionLevel = nextExpansion.level;
  state.storeName = nextExpansion.name;
  syncUnlockedProducts(state);

  const unlockedNow = getAvailableProducts(state).length - beforeAvailableCount;
  return {
    ok: true,
    message: `${currentExpansion.name} expanded into ${nextExpansion.name}. ${unlockedNow} additional products are now available.`
  };
}

export function getStoreSnapshot(state) {
  const unlockedProducts = getAvailableProducts(state);
  const usedCapacity = getUsedCapacity(state);
  const capacity = getStorageCapacity(state);
  const lowStockCount = getLowStockProducts(state).length;
  const soldOutCount = getSoldOutProducts(state).length;
  const missingCategories = getMissingStockedCategories(state);
  const levelProgress = getLevelProgress(state);
  const currentDay = state.stats.currentDay;
  const currentBestSellerId = Object.entries(currentDay.productSales)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  const stockClerks = state.employees["stock-clerk"];
  const nextClerkCost = getEmployeeHireCost("stock-clerk", stockClerks);
  const currentExpansion = STORE_EXPANSIONS_BY_LEVEL.get(state.storeExpansionLevel);
  const nextExpansion = STORE_EXPANSIONS_BY_LEVEL.get(state.storeExpansionLevel + 1) ?? null;

  return {
    unlockedProductCount: unlockedProducts.length,
    usedCapacity,
    capacity,
    freeCapacity: capacity - usedCapacity,
    lowStockCount,
    soldOutCount,
    missingCategories,
    salesBlockedByCategoryCoverage: missingCategories.length > 0,
    levelProgress,
    currentDay,
    currentBestSellerId,
    trafficRate: getDailyTrafficRate(state),
    expansion: {
      current: currentExpansion,
      next: nextExpansion
    },
    employees: {
      stockClerks,
      nextClerkCost,
      restockRateLabel: stockClerks ? "Instantly refills sold-out items" : "No automatic restocking yet",
      lastRestock: state.lastEmployeeRestock
    },
    averageDailyProfit: state.stats.dailyHistory.length
      ? roundMoney(state.stats.dailyHistory.reduce((sum, day) => sum + day.profit, 0) / state.stats.dailyHistory.length)
      : currentDay.profit,
    topProducts: [...PRODUCTS]
      .sort((left, right) => state.products[right.id].lifetimeProfit - state.products[left.id].lifetimeProfit)
      .slice(0, 3),
    nextLicense: LICENSES.find((license) => !state.licensesOwned[license.id]) ?? null
  };
}

export function getBestSellerName(bestSellerId) {
  return bestSellerId ? PRODUCTS_BY_ID.get(bestSellerId)?.name ?? "Unknown" : "None";
}
