import { useEffect, useState } from "react";
import {
  getItems,
  createItem,
  deleteItem,
  updateItem as updateItemApi,
} from "../api/itemApi";

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load Items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Create Item
  const addItem = async (title, category) => {
    try {
      const newItem = await createItem({ title, category });
      setItems((prev) => [...prev, newItem]);
    } catch (err) {
      setError("Failed to add item");
    }
  };

  // Delete Item
  const removeItem = async (itemId) => {
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError("Failed to delete item");
    }
  };

  // Update Item
  const updateItem = async (itemToUpdate) => {
    try {
      const { id, ...updates } = itemToUpdate;

      const updatedItem = await updateItemApi(id, updates);

      setItems((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
    } catch (err) {
      setError("Failed to update item");
    }
  };

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    updateItem,
    refetch: fetchItems,
  };
};