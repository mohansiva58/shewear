import { create } from 'zustand';
import { Product } from './products';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
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
    set((state) => {
      const productId = getProductId(product);
      const existingItem = state.items.find(
        (item) => getProductId(item.product) === productId && item.size === size
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            getProductId(item.product) === productId && item.size === size
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { product, size, quantity }],
      };
    });
  },

  removeItem: (productId, size) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(getProductId(item.product) === productId && item.size === size)
      ),
    }));
  },

  updateQuantity: (productId, size, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        getProductId(item.product) === productId && item.size === size
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      ),
    }));
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
