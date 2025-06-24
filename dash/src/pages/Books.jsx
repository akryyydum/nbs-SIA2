import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBooks, createBook, updateBook, deleteBook as deleteBookApi } from '../api/auth';
import axios from 'axios';

const emptyForm = {
  title: '',
  author: '',
  price: '',
  description: '',
  stock: '',
  image: ''
};

const Books = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await getBooks(user.token);
      setBooks(res.data);
    } catch (err) {
      alert('Failed to fetch books');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line
  }, []);

  // Helper to upload image to a free service (imgbb, cloudinary, etc.)
  const uploadImage = async (file) => {
    const apiKey = 'b78349dac08c6f87391cc8cd173ae1b0'; // <-- replace with your real imgbb API key
    if (!apiKey || apiKey === 'YOUR_IMGBB_API_KEY') {
      // This error is shown because you have not set your imgbb API key.
      // To fix: Get a free API key from https://api.imgbb.com/ and set it here.
      throw new Error('Image upload is not configured. Please set your imgbb API key in the code.');
    }
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) return data.data.url;
    throw new Error(data.error?.message || 'Image upload failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const payload = { ...form, image: imageUrl };
      if (editing) {
        await updateBook(editing, payload, user.token);
      } else {
        await createBook(payload, user.token);
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

  const handleEdit = (b) => {
    setEditing(b._id);
    setForm({
      title: b.title,
      author: b.author,
      price: b.price,
      description: b.description || '',
      stock: b.stock,
      image: b.image || ''
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleDelete = (book) => {
    setEditing(null);
    setForm({
      title: book.title,
      author: book.author,
      price: book.price,
      description: book.description || '',
      stock: book.stock,
      image: book.image || ''
    });
    setImageFile(null);
    if (window.confirm('Delete this book?')) {
      deleteBookApi(book._id, user.token)
        .then(fetchBooks)
        .catch(() => alert('Delete failed'));
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <h2 className="text-2xl font-bold mb-4 text-red-700">Books Management</h2>
      <button
        className="mb-6 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded shadow"
        onClick={handleAdd}
      >
        + Add Book
      </button>
      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-bold"
              onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); setImageFile(null); }}
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
                min="0"
                step="0.01"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                required
                min="0"
                className="w-full border px-3 py-2 rounded"
              />
              <div>
                <label className="block mb-1 text-sm text-red-700 font-semibold">Book Image</label>
                <input
                  type="text"
                  placeholder="Image URL"
                  value={form.image}
                  onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setImageFile(null); }}
                  className="w-full border px-3 py-2 rounded mb-2"
                />
                <div className="flex items-center gap-2">
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        if (e.target.files[0]) {
                          setImageFile(e.target.files[0]);
                          setForm(f => ({ ...f, image: '' }));
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      onClick={e => {
                        e.preventDefault();
                        e.target.previousSibling.click();
                      }}
                    >
                      Choose File
                    </button>
                  </label>
                  {imageFile && (
                    <span className="text-xs text-green-700">{imageFile.name}</span>
                  )}
                </div>
                {(form.image || imageFile) && (
                  <div className="mt-2">
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : form.image}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded shadow"
                    />
                  </div>
                )}
              </div>
              <input
                type="text"
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
                  onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); setImageFile(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div
        className="overflow-x-auto rounded-2xl shadow-2xl border border-red-100"
        style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)'
        }}
      >
        <table className="min-w-full rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-white/70 text-red-700 font-semibold text-lg">
              <th className="px-6 py-3 border-b">Title</th>
              <th className="px-6 py-3 border-b">Author</th>
              <th className="px-6 py-3 border-b">Price</th>
              <th className="px-6 py-3 border-b">Stock</th>
              <th className="px-6 py-3 border-b">Image</th>
              <th className="px-6 py-3 border-b">Description</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">No books found</td>
              </tr>
            ) : books.map(b => (
              <tr key={b._id} className="hover:bg-red-50 transition">
                <td className="border-b px-6 py-3">{b.title}</td>
                <td className="border-b px-6 py-3">{b.author}</td>
                <td className="border-b px-6 py-3">${Number(b.price).toFixed(2)}</td>
                <td className="border-b px-6 py-3">{b.stock}</td>
                <td className="border-b px-6 py-3">
                  {b.image && (
                    <img src={b.image} alt={b.title} className="h-12 w-12 object-cover rounded shadow" />
                  )}
                </td>
                <td className="border-b px-6 py-3 max-w-xs truncate">{b.description}</td>
                <td className="border-b px-6 py-3">
                  <button
                    className="text-blue-600 hover:bg-blue-50 transition rounded px-3 py-1 mr-2"
                    onClick={() => handleEdit(b)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:bg-red-50 transition rounded px-3 py-1"
                    onClick={() => handleDelete(b)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Books;
