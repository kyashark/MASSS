import axiosClient from '../../../api/axiosClient';

// Get all tasks
export const getTasks = async () => {
  const response = await axiosClient.get('/schedule/tasks/');
  return response.data;
};

// Get task by ID
export const getTaskById = async (taskId) => {
  const response = await axiosClient.get(`/schedule/tasks/${taskId}`);
  return response.data;
};

// Create new task
export const createTask = async (taskData) => {
  const response = await axiosClient.post('/schedule/tasks/', taskData);
  return response.data;
};

// Update existing task 
export const updateTask = async (taskId, taskData) => {
  const response = await axiosClient.put(
    `/schedule/tasks/${taskId}`,
    taskData
  );
  return response.data;
};


 // Delete task
export const deleteTask = async (taskId) => {
  const response = await axiosClient.delete(
    `/schedule/tasks/${taskId}`
  );
  return response.data;
};

