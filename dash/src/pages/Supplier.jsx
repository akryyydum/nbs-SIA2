import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SupplierBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '',
    author: '',
    price: '',
    category: '',
    description: '',
    image: '',
    stock: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch supplier's own books from SupplierBook database
  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Use the correct backend endpoint for SupplierBook
      const res = await axios.get(
        `/api/suppliers/${user._id}/supplierBook`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setBooks(res.data);
    } catch (err) {
      setBooks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.token && user?._id) fetchBooks();
    // eslint-disable-next-line
  }, [user]);

  // Open modal for add/edit
  const handleAdd = () => {
    setEditing(null);
    setForm({
      title: '',
      author: '',
      price: '',
      category: '',
      description: '',
      image: '',
      stock: 0,
    });
    setModalOpen(true);
  };
  const handleEdit = (book) => {
    setEditing(book._id);
    setForm({
      title: book.title,
      author: book.author,
      price: book.price,
      category: book.category,
      description: book.description,
      image: book.image,
      stock: book.stock,
    });
    setModalOpen(true);
  };

  // Save (add or update) to SupplierBook database
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(
          `/api/suppliers/${user._id}/supplierBook/${editing}`,
          form,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      } else {
        await axios.post(
          `/api/suppliers/${user._id}/supplierBook`,
          form,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      }
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      alert('Failed to save book: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete from SupplierBook database
  const handleDelete = async (bookId) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await axios.delete(
        `/api/suppliers/${user._id}/supplierBook/${bookId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      fetchBooks();
    } catch (err) {
      alert('Failed to delete book');
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-red-700">My Supplier Books</h2>
      <button
        className="mb-4 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded shadow"
        onClick={handleAdd}
      >
        + Add Book
      </button>
      <div className="bg-white rounded-xl shadow p-4">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-red-100">
              <th>Title</th>
              <th>Author</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Description</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">No books found</td>
              </tr>
            ) : books.map(book => (
              <tr key={book._id} className="hover:bg-red-50 transition">
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>₱{Number(book.price).toFixed(2)}</td>
                <td>{book.stock}</td>
                <td>{book.category}</td>
                <td className="max-w-xs truncate">{book.description}</td>
                <td>
                  {book.image && (
                    <img src={book.image} alt={book.title} className="h-12 w-12 object-cover rounded shadow mx-auto" />
                  )}
                </td>
                <td>
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => handleEdit(book)}
                  >Edit</button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(book._id)}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-red-700">
              {editing ? 'Edit Book' : 'Add Book'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="author"
                placeholder="Author"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
                min="0"
                step="0.01"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                required
                min="0"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="image"
                placeholder="Image URL"
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              />
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded flex-1">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border flex-1"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierBooks;

// No changes needed in this file for the WebSocket error.
