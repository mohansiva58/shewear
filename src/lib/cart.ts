import { create } from 'zustand';
import { Product } from './products';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity?: number) => boolean;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => boolean;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const getProductId = (product: Product): string => {
  return product.id || product._id || product.productId || '';
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product, size, quantity = 1) => {
    // Check if product has stock
    if (product.stock !== undefined && product.stock <= 0) {
      return false;
    }

    set((state) => {
      const productId = getProductId(product);
      const existingItem = state.items.find(
        (item) => getProductId(item.product) === productId && item.size === size
      );

      const totalQuantity = existingItem 
        ? existingItem.quantity + quantity 
        : quantity;

      // Check if quantity exceeds stock
      if (product.stock !== undefined && totalQuantity > product.stock) {
        return state;
      }

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            getProductId(item.product) === productId && item.size === size
              ? { ...item, quantity: totalQuantity }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { product, size, quantity }],
      };
    });
    return true;
  },

  removeItem: (productId, size) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(getProductId(item.product) === productId && item.size === size)
      ),
    }));
  },

  updateQuantity: (productId, size, quantity) => {
    const state = get();
    const item = state.items.find(
      (item) => getProductId(item.product) === productId && item.size === size
    );

    if (!item) return false;

    // Check if new quantity exceeds stock
    if (item.product.stock !== undefined && quantity > item.product.stock) {
      return false;
    }

    set((state) => ({
      items: state.items.map((item) =>
        getProductId(item.product) === productId && item.size === size
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    }));
    return true;
  },

  clearCart: () => set({ items: [] }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },
}));
