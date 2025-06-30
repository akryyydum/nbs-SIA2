import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaPlus } from 'react-icons/fa';

const tableStyles = {
  textAlign: 'center',
  borderCollapse: 'collapse',
  width: '100%',
};

const cellStyles = {
  textAlign: 'center',
  padding: '8px',
  border: '1px solid #ddd',
};

const imageStyles = {
  display: 'block',
  margin: '0 auto',
  maxWidth: '100px',
};

const emptyForm = {
  title: '',
  author: '',
  price: '',
  description: '',
  category: '',
  stock: '',
  image: '',
};

const SupplierBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [categories] = useState(['Fiction', 'Non-Fiction', 'Science', 'History']);

  useEffect(() => {
    if (user?.token && user?._id) fetchBooks();
    // eslint-disable-next-line
  }, [user]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
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

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
    } catch (err) {
      alert('Failed to upload image');
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = form.image;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        ...form,
        image: imageUrl,
      };

      if (editing) {
        await axios.put(
          `/api/suppliers/${user._id}/books/${editing}`,
          payload,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      } else {
        await axios.post(
          `/api/suppliers/${user._id}/books`,
          payload,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      }

      setForm(emptyForm);
      setEditing(null);
      setImageFile(null);
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error');
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    try {
      const imageUrl = await uploadImage(file);
      setForm((f) => ({ ...f, image: imageUrl }));
    } catch (err) {
      alert('Image upload failed');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleEdit = (book) => {
    setEditing(book._id);
    setForm({
      title: book.title,
      author: book.author,
      price: book.price,
      description: book.description || '',
      category: book.category || '',
      stock: book.stock,
      image: book.image || '',
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await axios.delete(
        `/api/suppliers/${user._id}/books/${bookId}`,
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
      <div className="flex gap-4 mb-6">
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded flex items-center gap-2 shadow"
          onClick={handleAdd}
        >
          <FaPlus />
          Add Book
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setForm(emptyForm);
                setImageFile(null);
              }}
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
                placeholder="Title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                placeholder="Author"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                required
                className="w-full border px-3 py-2 rounded"
              />

              <div className="flex items-center gap-2 mb-2">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    onClick={(e) => e.target.previousSibling.click()}
                  >
                    Choose File
                  </button>
                </label>
                {imageFile && <span className="text-xs text-green-700">{imageFile.name}</span>}
              </div>

              {form.image && (
                <div className="mt-2">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded shadow"
                  />
                </div>
              )}

              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              />
              <select
                value={form.category || ''}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded flex-1">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded border flex-1"
                  onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); setImageFile(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded shadow p-4">
        <h3 className="text-lg font-bold mb-2 text-red-700">Supplier Books Table</h3>
        <table style={tableStyles}>
          <thead>
            <tr style={{ backgroundColor: '#f8f8f8' }}>
              <th style={cellStyles}>Title</th>
              <th style={cellStyles}>Author</th>
              <th style={cellStyles}>Price</th>
              <th style={cellStyles}>Stock</th>
              <th style={cellStyles}>Image</th>
              <th style={cellStyles}>Description</th>
              <th style={cellStyles}>Category</th>
              <th style={cellStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b._id}>
                <td style={cellStyles}>{b.title}</td>
                <td style={cellStyles}>{b.author}</td>
                <td style={cellStyles}>₱{Number(b.price).toFixed(2)}</td>
                <td style={cellStyles}>{b.stock}</td>
                <td style={cellStyles}>
                  {b.image ? (
                    <img src={b.image} alt={b.title} style={imageStyles} />
                  ) : (
                    <span style={{ color: 'gray' }}>No image</span>
                  )}
                </td>
                <td style={cellStyles}>{b.description}</td>
                <td style={cellStyles}>{b.category}</td>
                <td style={cellStyles}>
                  <button onClick={() => handleEdit(b)} style={{ color: 'blue', marginRight: '8px' }}>Edit</button>
                  <button onClick={() => handleDelete(b._id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierBooks;
