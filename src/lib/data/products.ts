import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'pepsi-500ml',
    name: 'Pepsi 500ml',
    price: 40,
    image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&h=300&fit=crop',
    category: 'Beverages',
    isAgeRestricted: false,
    taxRate: 6,
    depositAmount: 1,
  },
  {
    id: 'coca-cola-classic',
    name: 'Coca Cola Classic',
    price: 35,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=300&fit=crop',
    category: 'Beverages',
    isAgeRestricted: false,
    taxRate: 12,
    depositAmount: 1,
  },
  {
    id: 'fanta-orange',
    name: 'Fanta Orange',
    price: 35,
    image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=200&h=300&fit=crop',
    category: 'Beverages',
    isAgeRestricted: false,
    taxRate: 12,
    depositAmount: 1,
  },
  {
    id: 'sprite-500ml',
    name: 'Sprite 500ml',
    price: 35,
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=200&h=300&fit=crop',
    category: 'Beverages',
    isAgeRestricted: false,
    taxRate: 12,
    depositAmount: 1,
  },
  {
    id: 'red-bull',
    name: 'Red Bull Energy',
    price: 45,
    image: 'https://images.unsplash.com/photo-1613217970109-ae3d8dbe8e17?w=200&h=300&fit=crop',
    category: 'Energy Drinks',
    isAgeRestricted: false,
    taxRate: 12,
    depositAmount: 1,
  },
  {
    id: 'beer-lager',
    name: 'Premium Lager',
    price: 55,
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=200&h=300&fit=crop',
    category: 'Alcoholic Beverages',
    isAgeRestricted: true,
    taxRate: 25,
    depositAmount: 1,
  },
  {
    id: 'wine-red',
    name: 'Red Wine 375ml',
    price: 120,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=200&h=300&fit=crop',
    category: 'Alcoholic Beverages',
    isAgeRestricted: true,
    taxRate: 25,
  },
  {
    id: 'snickers',
    name: 'Snickers Bar',
    price: 25,
    image: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=200&h=300&fit=crop',
    category: 'Snacks',
    isAgeRestricted: false,
    taxRate: 12,
  },
];

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((p) => p.id === id);
};

export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
};

export const getProductsByCategory = (category: string): Product[] => {
  return mockProducts.filter((p) => p.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(mockProducts.map((p) => p.category))];
};
