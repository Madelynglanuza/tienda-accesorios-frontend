import { useState, useEffect } from 'react';
import './App.css';

const API = 'https://tienda-accesorios.onrender.com';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState([]);

  // Formulario añadir
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cat, setCat] = useState('Joyería y Bisutería');
  const [image, setImage] = useState('');

  // Formulario editar
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    fetch(API + '/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addProduct = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', parseFloat(price));
    formData.append('category', cat);
    formData.append('image', image);

    fetch(API + '/api/products', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(newProduct => {
        setProducts([...products, newProduct]);
        setName(''); setPrice(''); setImage('');
        showToast('✨ Producto agregado al catálogo');
      });
  };

  const deleteProduct = (id) => {
    fetch(API + `/api/products/${id}`, { method: 'DELETE' })
      .then(() => setProducts(products.filter(p => p.id !== id)));
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditPrice(p.price);
    setEditCat(p.category);
    setEditImage(p.image);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('price', parseFloat(editPrice));
    formData.append('category', editCat);
    formData.append('image', editFile);
    formData.append('existingImage', editImage);

    fetch(API + `/api/products/${editId}`, {
      method: 'PUT',
      body: formData
    })
      .then(res => res.json())
      .then(updated => {
        setProducts(products.map(p => p.id === updated.id ? updated : p));
        setEditId(null);
        setEditFile(null);
      });
  };

  const addToCart = (p) => {
    setCart([...cart, p]);
    showToast('🛒 ' + p.name + ' agregado al carrito');
  };

  const removeFromCart = (i) => {
    setCart(cart.filter((_, idx) => idx !== i));
    showToast('🗑️ Artículo eliminado del carrito');
  };

  const cartTotal = cart.reduce((sum, p) => sum + parseFloat(p.price), 0);

  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filtered = category === 'Todos'
    ? products
    : products.filter(p => p.category === category);

  if (loading) return <div className="loading">Cargando catálogo...</div>;

  return (
    <div className="App">
      <header className="header">
        <div>
          <p className="kicker">DETALLES QUE ILUMINAN</p>
          <h1>Tienda de Accesorios</h1>
          <p className="subtitle">Una selección especial de piezas para expresar tu estilo cada día.</p>
        </div>
      </header>

      <section className="panel cart">
        <div className="cart-left">
          <div className="cart-icon">
            <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <h2>Tu carrito</h2>
            <p>
              <span id="cart-count">{cart.length}</span> artículos seleccionados ·{' '}
              <strong>${cartTotal.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {showCart && (
          <section className="panel cart-drawer">
            <div className="drawer-head">
              <h2>Mis artículos</h2>
              <button className="btn-cancel" onClick={() => setShowCart(false)}>Cerrar</button>
            </div>
            {cart.length === 0 ? (
              <p className="empty-cart">Tu carrito está vacío. ¡Agrega algo!</p>
            ) : (
              <div className="drawer-list">
                {cart.map((item, i) => (
                  <div className="drawer-item" key={i}>
                    <img src={item.image ? (item.image.startsWith('http') ? item.image : API + item.image) : ''} alt={item.name} />
                    <div className="drawer-info">
                      <h4>{item.name}</h4>
                      <p className="price">${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                    <button className="btn-remove-item" onClick={() => removeFromCart(i)}>✕</button>
                  </div>
                ))}
                <div className="drawer-total">
                  <strong>Total:</strong> ${cartTotal.toFixed(2)}
                </div>
              </div>
            )}
          </section>
        )}

        <button className="btn-cart-view" onClick={() => setShowCart(true)}>
          Ver mis artículos
        </button>
      </section>

      <section className="panel add-panel">
        <div className="panel-heading">
          <div className="icon-circle">
            <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div>
            <h2>Añadir un accesorio</h2>
            <p className="panel-copy">Completa los detalles para sumar una nueva pieza al catálogo.</p>
          </div>
        </div>
        <form className="add-form" onSubmit={addProduct}>
          <div>
            <label>Nombre del producto</label>
            <input placeholder="Ej. Collar de perlas" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label>Precio</label>
            <input placeholder="0.00" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          <div>
            <label>Categoría</label>
            <select value={cat} onChange={e => setCat(e.target.value)}>
              <option>Joyería y Bisutería</option>
              <option>Accesorios para el Cabello</option>
              <option>Bolsos y Marroquinería</option>
              <option>Complementos de Estilo</option>
            </select>
          </div>
          <div>
            <label>Imagen del producto</label>
            <div className="file-upload">
              <input type="file" id="file-input" accept="image/*" onChange={e => setImage(e.target.files[0])} />
              <label htmlFor="file-input" className="file-btn">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {image ? image.name : 'Elegir archivo'}
              </label>
            </div>
          </div>
          <div className="submit-cell">
            <button type="submit" className="btn-purple">
              <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar
            </button>
          </div>
        </form>
      </section>

      {editId && (
        <section className="panel add-panel">
          <div className="panel-heading">
            <div className="icon-circle">
              <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
              </svg>
            </div>
            <div>
              <h2>Editar producto #{editId}</h2>
              <p className="panel-copy">Modifica los detalles del accesorio.</p>
            </div>
          </div>
          <form className="add-form" onSubmit={saveEdit}>
            <div>
              <label>Nombre del producto</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div>
              <label>Precio</label>
              <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} required />
            </div>
            <div>
              <label>Categoría</label>
              <select value={editCat} onChange={e => setEditCat(e.target.value)}>
                <option>Joyería y Bisutería</option>
                <option>Accesorios para el Cabello</option>
                <option>Bolsos y Marroquinería</option>
                <option>Complementos de Estilo</option>
              </select>
            </div>
            <div>
              <label>Imagen del producto {editImage && '(actual: ' + editImage.split('/').pop() + ')'}</label>
              <input type="file" accept="image/*" onChange={e => setEditFile(e.target.files[0])} />
            </div>
            <div className="submit-cell">
              <button type="submit" className="btn-purple">
                <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Guardar
              </button>
              <button type="button" className="btn-cancel" onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <section className="catalog">
        <div className="catalog-heading">
          <div>
            <p className="kicker">ELIGE TUS FAVORITOS</p>
            <h2 className="catalog-title">Nuestro catálogo</h2>
          </div>
          <nav className="filters">
            {categories.map(c => (
              <button
                key={c}
                className={category === c ? 'active' : ''}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </nav>
        </div>

        <div className="product-grid">
          {filtered.map(p => (
            <div key={p.id} className="product-card">
              <img src={p.image ? (p.image.startsWith('http') ? p.image : API + p.image) : ''} alt={p.name} />
              <div className="card-body">
                <div className="card-top">
                  <div>
                    <span className="category">{p.category}</span>
                    <h3>{p.name}</h3>
                  </div>
                  <p className="price">${parseFloat(p.price).toFixed(2)}</p>
                </div>
                <button className="btn-cart" onClick={() => addToCart(p)}>
                  <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Agregar al carrito
                </button>
                <div className="card-actions">
                  <button className="btn-edit" onClick={() => startEdit(p)}>
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                    </svg>
                    Editar
                  </button>
                  <button className="btn-delete" onClick={() => deleteProduct(p.id)}>
                    <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="empty-products">
            <svg className="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12l4 6-10 13L2 9z" />
              <path d="M11 3L8 9l4 13 4-13-3-6" />
              <path d="M2 9h20" />
            </svg>
            <h3>No hay productos en esta categoría</h3>
            <p>Añade un accesorio para verlo aquí.</p>
          </div>
        )}
      </section>
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
