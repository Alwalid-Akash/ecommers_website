import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState({
    items: [],
    total: 0,
  });

  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0 });
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/cart");
      setCart({
        items: response.data.items ?? [],
        total: response.data.total ?? 0,
      });
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    await api.post("/cart", {
      product_id: productId,
      quantity,
    });
    await fetchCart();
  };

  const updateCartItem = async (productId, quantity) => {
    await api.put(`/cart/${productId}`, { quantity });
    await fetchCart();
  };

  const removeFromCart = async (productId) => {
    await api.delete(`/cart/${productId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await api.delete("/cart");
    await fetchCart();
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const value = {
    cart,
    setCart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}