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

  // Fetch cart
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart({
        items: [],
        total: 0,
      });

      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/cart");

      setCart(response.data.cart);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add product
  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await api.post("/cart", {
        product_id: productId,
        quantity,
      });

      setCart(response.data.cart);

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Update quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await api.put(
        `/cart/${productId}`,
        {
          quantity,
        }
      );

      setCart(response.data.cart);

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Remove item
  const removeFromCart = async (productId) => {
    try {
      const response = await api.delete(
        `/cart/${productId}`
      );

      setCart(response.data.cart);

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      const response = await api.delete("/cart");

      setCart(response.data.cart);

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const value = {
    cart,
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