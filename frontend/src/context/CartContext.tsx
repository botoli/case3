import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  totalSum: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  getQuantity: (productId: number) => number;
  clearCart: () => void;
}

const STORAGE_KEY = "novanet-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  }, []);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      if (quantity < 1) return;
      persist(
        (() => {
          const existing = items.find((i) => i.product.id === product.id);
          if (existing) {
            return items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            );
          }
          return [...items, { product, quantity }];
        })()
      );
    },
    [items, persist]
  );

  const removeItem = useCallback(
    (productId: number) => {
      persist(items.filter((i) => i.product.id !== productId));
    },
    [items, persist]
  );

  const updateQuantity = useCallback(
    (productId: number, quantity: number) => {
      if (quantity < 1) {
        removeItem(productId);
        return;
      }
      setItems((prev) => {
        const next = prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        saveCart(next);
        return next;
      });
    },
    [removeItem]
  );

  const getQuantity = useCallback(
    (productId: number) => {
      const item = items.find((i) => i.product.id === productId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalSum = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalCount,
      totalSum,
      addItem,
      removeItem,
      updateQuantity,
      getQuantity,
      clearCart,
    }),
    [items, totalCount, totalSum, addItem, removeItem, updateQuantity, getQuantity, clearCart]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
