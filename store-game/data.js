export const SAVE_KEY = "local_store_tycoon_save_v1";
export const SAVE_VERSION = 1;
export const DAY_LENGTH_SECONDS = 90;
export const MAX_RECENT_SALES = 18;
export const MAX_DAILY_HISTORY = 14;
export const DEFAULT_PURCHASE_QUANTITY = 6;

export const EMPLOYEES = [
  {
    id: "stock-clerk",
    name: "Stock Clerk",
    description: "Instantly buys replacement stock the moment an item sells out, using store cash.",
    baseCost: 1400,
    costGrowth: 1.7
  }
];

export const STORE_NAMES = [
  "Corner Cart",
  "Neighborhood Stop",
  "Main Street Market",
  "Busy Retail Hall",
  "Town Center Store",
  "Regional Outlet",
  "Flagship Emporium"
];

export const STORE_EXPANSIONS = [
  {
    level: 0,
    name: "Corner Cart",
    cost: 0,
    capacityBonus: 0,
    description: "A tiny starter storefront with room for only the most basic essentials."
  },
  {
    level: 1,
    name: "Neighborhood Stop",
    cost: 1200,
    capacityBonus: 20,
    description: "Adds a side aisle, more shelf room, and enough frontage for a wider starter assortment."
  },
  {
    level: 2,
    name: "Main Street Market",
    cost: 4200,
    capacityBonus: 35,
    description: "Turns the shop into a real convenience market with snacks and core grocery staples."
  },
  {
    level: 3,
    name: "Busy Retail Hall",
    cost: 11000,
    capacityBonus: 50,
    description: "Opens a second room so you can carry deeper grocery stock and entry clothing lines."
  },
  {
    level: 4,
    name: "Town Center Store",
    cost: 26000,
    capacityBonus: 70,
    description: "Builds a lifestyle wing for apparel and small electronics with more premium shelving."
  },
  {
    level: 5,
    name: "Regional Outlet",
    cost: 65000,
    capacityBonus: 95,
    description: "A large-format store layout with room for showcase tech and luxury products."
  }
];

export const LICENSES = [
  {
    id: "basic",
    name: "Basic License",
    category: "Basics",
    description: "Lets you sell core household essentials and starter goods.",
    cost: 0,
    prerequisiteId: null,
    unlockProductIds: ["bottled-water", "notebook", "paper-towels"]
  },
  {
    id: "snack",
    name: "Snack License",
    category: "Snacks",
    description: "Adds fast-moving impulse items that keep customers coming back.",
    cost: 900,
    prerequisiteId: "basic",
    unlockProductIds: ["chips", "soda", "candy-bars", "coffee-beans"]
  },
  {
    id: "grocery",
    name: "Grocery License",
    category: "Grocery",
    description: "Introduces pantry staples with dependable daily demand.",
    cost: 2600,
    prerequisiteId: "snack",
    unlockProductIds: ["bread", "pasta", "cereal", "detergent"]
  },
  {
    id: "clothing",
    name: "Clothing License",
    category: "Clothing",
    description: "Opens higher-margin apparel with slower but stronger sales.",
    cost: 7600,
    prerequisiteId: "grocery",
    unlockProductIds: ["socks", "t-shirt", "hoodie"]
  },
  {
    id: "electronics",
    name: "Electronics License",
    category: "Electronics",
    description: "Adds premium accessories that spike profit per sale.",
    cost: 19500,
    prerequisiteId: "clothing",
    unlockProductIds: ["phone-charger", "wireless-earbuds", "bluetooth-speaker"]
  },
  {
    id: "luxury",
    name: "Luxury License",
    category: "Luxury",
    description: "Unlocks rare high-ticket products for a fully built store.",
    cost: 52000,
    prerequisiteId: "electronics",
    unlockProductIds: ["designer-watch", "leather-bag", "premium-headphones"]
  }
];

export const PRODUCTS = [
  {
    id: "bottled-water",
    name: "Bottled Water",
    category: "Basics",
    licenseId: "basic",
    requiredExpansionLevel: 0,
    wholesaleCost: 1.2,
    recommendedPrice: 2.4,
    demand: 86,
    space: 1
  },
  {
    id: "notebook",
    name: "Notebook",
    category: "Basics",
    licenseId: "basic",
    requiredExpansionLevel: 1,
    wholesaleCost: 2.1,
    recommendedPrice: 4.6,
    demand: 44,
    space: 1
  },
  {
    id: "paper-towels",
    name: "Paper Towels",
    category: "Basics",
    licenseId: "basic",
    requiredExpansionLevel: 1,
    wholesaleCost: 3.6,
    recommendedPrice: 6.9,
    demand: 38,
    space: 2
  },
  {
    id: "chips",
    name: "Chips",
    category: "Snacks",
    licenseId: "snack",
    requiredExpansionLevel: 1,
    wholesaleCost: 1.75,
    recommendedPrice: 3.6,
    demand: 78,
    space: 1
  },
  {
    id: "soda",
    name: "Soda",
    category: "Snacks",
    licenseId: "snack",
    requiredExpansionLevel: 1,
    wholesaleCost: 1.0,
    recommendedPrice: 2.25,
    demand: 92,
    space: 1
  },
  {
    id: "candy-bars",
    name: "Candy Bars",
    category: "Snacks",
    licenseId: "snack",
    requiredExpansionLevel: 2,
    wholesaleCost: 0.7,
    recommendedPrice: 1.65,
    demand: 96,
    space: 1
  },
  {
    id: "coffee-beans",
    name: "Coffee Beans",
    category: "Snacks",
    licenseId: "snack",
    requiredExpansionLevel: 2,
    wholesaleCost: 4.5,
    recommendedPrice: 8.9,
    demand: 36,
    space: 2
  },
  {
    id: "bread",
    name: "Bread",
    category: "Grocery",
    licenseId: "grocery",
    requiredExpansionLevel: 2,
    wholesaleCost: 1.95,
    recommendedPrice: 3.95,
    demand: 74,
    space: 1
  },
  {
    id: "pasta",
    name: "Pasta",
    category: "Grocery",
    licenseId: "grocery",
    requiredExpansionLevel: 2,
    wholesaleCost: 1.45,
    recommendedPrice: 3.35,
    demand: 58,
    space: 1
  },
  {
    id: "cereal",
    name: "Cereal",
    category: "Grocery",
    licenseId: "grocery",
    requiredExpansionLevel: 3,
    wholesaleCost: 3.15,
    recommendedPrice: 6.35,
    demand: 52,
    space: 2
  },
  {
    id: "detergent",
    name: "Detergent",
    category: "Grocery",
    licenseId: "grocery",
    requiredExpansionLevel: 3,
    wholesaleCost: 5.3,
    recommendedPrice: 10.9,
    demand: 32,
    space: 2
  },
  {
    id: "socks",
    name: "Socks",
    category: "Clothing",
    licenseId: "clothing",
    requiredExpansionLevel: 3,
    wholesaleCost: 2.9,
    recommendedPrice: 7.6,
    demand: 42,
    space: 1
  },
  {
    id: "t-shirt",
    name: "T-Shirt",
    category: "Clothing",
    licenseId: "clothing",
    requiredExpansionLevel: 3,
    wholesaleCost: 6.6,
    recommendedPrice: 15.6,
    demand: 34,
    space: 2
  },
  {
    id: "hoodie",
    name: "Hoodie",
    category: "Clothing",
    licenseId: "clothing",
    requiredExpansionLevel: 4,
    wholesaleCost: 14.5,
    recommendedPrice: 32,
    demand: 22,
    space: 3
  },
  {
    id: "phone-charger",
    name: "Phone Charger",
    category: "Electronics",
    licenseId: "electronics",
    requiredExpansionLevel: 4,
    wholesaleCost: 8.2,
    recommendedPrice: 18.2,
    demand: 26,
    space: 2
  },
  {
    id: "wireless-earbuds",
    name: "Wireless Earbuds",
    category: "Electronics",
    licenseId: "electronics",
    requiredExpansionLevel: 4,
    wholesaleCost: 18.5,
    recommendedPrice: 42,
    demand: 20,
    space: 2
  },
  {
    id: "bluetooth-speaker",
    name: "Bluetooth Speaker",
    category: "Electronics",
    licenseId: "electronics",
    requiredExpansionLevel: 5,
    wholesaleCost: 26.5,
    recommendedPrice: 58,
    demand: 15,
    space: 3
  },
  {
    id: "designer-watch",
    name: "Designer Watch",
    category: "Luxury",
    licenseId: "luxury",
    requiredExpansionLevel: 5,
    wholesaleCost: 72,
    recommendedPrice: 154,
    demand: 8,
    space: 2
  },
  {
    id: "leather-bag",
    name: "Leather Bag",
    category: "Luxury",
    licenseId: "luxury",
    requiredExpansionLevel: 5,
    wholesaleCost: 96,
    recommendedPrice: 224,
    demand: 6,
    space: 3
  },
  {
    id: "premium-headphones",
    name: "Premium Headphones",
    category: "Luxury",
    licenseId: "luxury",
    requiredExpansionLevel: 5,
    wholesaleCost: 124,
    recommendedPrice: 289,
    demand: 5,
    space: 3
  }
];

export const UPGRADES = [
  {
    id: "storage",
    name: "Bigger Storage",
    description: "Adds more back-room capacity so you can hold larger inventory.",
    baseCost: 650,
    costGrowth: 1.7,
    maxLevel: 8
  },
  {
    id: "shelves",
    name: "Better Shelves",
    description: "Improves product presentation and nudges basket sizes upward.",
    baseCost: 900,
    costGrowth: 1.72,
    maxLevel: 8
  },
  {
    id: "traffic",
    name: "Faster Customer Rate",
    description: "Brings in more shoppers every day through marketing and foot traffic.",
    baseCost: 1200,
    costGrowth: 1.78,
    maxLevel: 8
  },
  {
    id: "reputation",
    name: "Better Reputation",
    description: "Adds a persistent trust bonus that improves conversion.",
    baseCost: 1500,
    costGrowth: 1.75,
    maxLevel: 8
  },
  {
    id: "supplier",
    name: "Cheaper Supplier Prices",
    description: "Negotiates better wholesale rates for every restock.",
    baseCost: 1800,
    costGrowth: 1.85,
    maxLevel: 6
  }
];

export const PRODUCTS_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));
export const LICENSES_BY_ID = new Map(LICENSES.map((license) => [license.id, license]));
export const UPGRADES_BY_ID = new Map(UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
export const EMPLOYEES_BY_ID = new Map(EMPLOYEES.map((employee) => [employee.id, employee]));
export const STORE_EXPANSIONS_BY_LEVEL = new Map(STORE_EXPANSIONS.map((expansion) => [expansion.level, expansion]));

export const CATEGORY_ORDER = ["Basics", "Snacks", "Grocery", "Clothing", "Electronics", "Luxury"];
