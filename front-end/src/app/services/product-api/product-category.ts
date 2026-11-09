// Must match the backend ProductCategory enum names exactly.
export const PRODUCT_CATEGORIES = [
  'ELECTRONICS',
  'CLOTHING',
  'SHOES',
  'ACCESSORIES',
  'HOME_AND_GARDEN',
  'BEAUTY_AND_PERSONAL_CARE',
  'HEALTH_AND_WELLNESS',
  'SPORTS_AND_OUTDOORS',
  'TOYS_AND_GAMES',
  'BOOKS_AND_STATIONERY',
  'FOOD_AND_BEVERAGES',
  'JEWELRY_AND_WATCHES',
  'FURNITURE',
  'AUTOMOTIVE',
  'PET_SUPPLIES',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// "HOME_AND_GARDEN" -> "Home and garden"
export const categoryLabel = (category: ProductCategory): string => {
  const text = category.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Display only: the emoji is never sent to the backend, only the enum name is.
const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  ELECTRONICS: '📱',
  CLOTHING: '👕',
  SHOES: '👟',
  ACCESSORIES: '👜',
  HOME_AND_GARDEN: '🏡',
  BEAUTY_AND_PERSONAL_CARE: '💄',
  HEALTH_AND_WELLNESS: '🧘',
  SPORTS_AND_OUTDOORS: '⚽',
  TOYS_AND_GAMES: '🧸',
  BOOKS_AND_STATIONERY: '📚',
  FOOD_AND_BEVERAGES: '🍔',
  JEWELRY_AND_WATCHES: '💍',
  FURNITURE: '🛋️',
  AUTOMOTIVE: '🚗',
  PET_SUPPLIES: '🐾',
};

export const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((value) => ({
  value, // sent to the backend
  label: categoryLabel(value),
  emoji: CATEGORY_EMOJI[value],
}));