// frontend/src/context/CartContext.jsx
import React, { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // { platId, nom, prix, image_url, quantite }

  const addItem = (plat) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.platId === plat.id);
      if (existing) {
        return prev.map((it) =>
          it.platId === plat.id ? { ...it, quantite: it.quantite + 1 } : it
        );
      }
      return [
        ...prev,
        {
          platId: plat.id,
          nom: plat.nom,
          prix: Number(plat.prix || 0),
          image_url: plat.image_url || null,
          quantite: 1,
        },
      ];
    });
  };

  const removeItem = (platId) => {
    setItems((prev) => prev.filter((it) => it.platId !== platId));
  };

  const updateQuantity = (platId, quantite) => {
    setItems((prev) =>
      prev
        .map((it) =>
          it.platId === platId ? { ...it, quantite: Math.max(1, quantite) } : it
        )
        .filter((it) => it.quantite > 0)
    );
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, it) => sum + it.quantite, 0);
    const totalAmount = items.reduce(
      (sum, it) => sum + it.quantite * (Number(it.prix) || 0),
      0
    );
    return { totalItems, totalAmount };
  }, [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, ...totals }),
    [items, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
