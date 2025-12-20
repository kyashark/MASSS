import { useState } from 'react'; 
import ItemForm from '../components/itemForm.jsx';
import ItemList from '../components/itemList.jsx';
import { useItems } from '../hooks/useItem.js';

export default function ItemSection() {
  const [itemToEdit, setItemToEdit] = useState(null); // State to track editing

  const {
    items,
    loading,
    error,
    addItem,
    removeItem,
    updateItem,
  } = useItems();

  // 1. Handle when "Edit" is clicked on a list item
  const handleEditClick = (item) => {
    setItemToEdit(item);
  };

  // 2. Handle when the form submits an update
  const handleUpdate = (updatedItem) => {
    updateItem(updatedItem);
    setItemToEdit(null); // Stop editing after save
  };

  // 3. Handle when user cancels editing
  const handleCancelEdit = () => {
    setItemToEdit(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        
        {/* Pass the new props to ItemForm */}
        <ItemForm 
          onAdd={addItem} 
          onUpdate={handleUpdate}
          itemToEdit={itemToEdit}
          onCancel={handleCancelEdit}
        />

        {loading && (
          <p className="mt-4 text-sm text-gray-500 text-center">
            Loading items...
          </p>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">
            {error}
          </p>
        )}

        {!loading && !error && (
          <ItemList
            items={items}
            onDelete={removeItem}
            onEdit={handleEditClick} 
          />
        )}
      </div>
    </div>
  );
}