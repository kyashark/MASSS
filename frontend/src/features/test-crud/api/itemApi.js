import axiosClient from '../../../api/axiosClient';

// Get all items
export const getItems = async () => {
  const response = await axiosClient.get('/test-crud/');
  return response.data;
};

// Get item by ID
export const getItemById = async (itemId) => {
  const response = await axiosClient.get(`/test-crud/${itemId}`);
  return response.data;
};

// Create new item
export const createItem = async (itemData) => {
  const response = await axiosClient.post('/test-crud/', itemData);
  return response.data;
};

// Update existing item
export const updateItem = async (itemId, itemData) => {
  const response = await axiosClient.put(
    `/test-crud/${itemId}`,
    itemData
  );
  return response.data;
};

// Delete item
export const deleteItem = async (itemId) => {
  const response = await axiosClient.delete(
    `/test-crud/${itemId}`
  );
  return response.data;
};