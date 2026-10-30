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

  // Autenticación
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // ===== NUEVO: Panel de administración =====
  const [view, setView] = useState('store'); // 'store' o 'admin'
  const [adminTab, setAdminTab] = useState('reportes'); // 'reportes', 'usuarios', 'comprobante'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState({ clientName: '', productId: '', paymentMethod: 'Efectivo' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // ===== NUEVO: Cargar datos de administración =====
  const loadAdminData = () => {
    fetch(API + '/api/stats', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(setStats)
      .catch(() => showToast('No se pudieron cargar los reportes'));

    fetch(API + '/api/users', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(setUsers)
      .catch(() => showToast('No se pudieron cargar los usuarios'));

    fetch(API + '/api/purchases', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(res => res.json())
      .then(setPurchases)
      .catch(() => showToast('No se pudieron cargar los comprobantes'));
  };

  const handleAuth = (e) => {
    e.preventDefault();
    const url = authMode === 'login' ? API + '/api/login' : API + '/api/register';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setAuthError('');
        } else {
          setAuthError(data.error || 'Error de autenticación');
        }
      })
      .catch(() => setAuthError('No se pudo conectar al servidor'));
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setCart([]);
    setView('store');
  };

  useEffect(() => {
    if (!token) return;
    fetch(API + '/api/products', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => {
        if (res.status === 401) {
          setToken('');
          localStorage.removeItem('token');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) { setProducts(data); setLoading(false); }
      })
      .catch(() => setLoading(false));
  }, [token]);

  // ===== NUEVO: Cargar datos admin al entrar a la vista =====
  useEffect(() => {
    if (view === 'admin' && token) loadAdminData();
  }, [view, token]);

  const addProduct = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', parseFloat(price));
    formData.append('category', cat);
    formData.append('image', image);

    fetch(API + '/api/products', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
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
    fetch(API + `/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    })
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
      headers: { 'Authorization': 'Bearer ' + token },
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

  // ===== NUEVO: Generar comprobante =====
  const generatePurchase = (e) => {
    e.preventDefault();
    fetch(API + '/api/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(purchaseForm)
    })
      .then(res => res.json())
      .then(purchase => {
        if (purchase.error) return showToast(purchase.error);
        setPurchases([purchase, ...purchases]);
        setPurchaseForm({ clientName: '', productId: '', paymentMethod: 'Efectivo' });
        showToast('🧾 Comprobante ' + purchase.receipt_number + ' generado');
      })
      .catch(() => showToast('No se pudo generar el comprobante'));
  };

  const downloadCSV = () => {
    if (!stats) return;
    const rows = [
      ['Métrica', 'Valor'],
      ['Total productos', stats.totalProducts],
      ['Total usuarios', stats.totalUsers],
      ['Total compras', stats.totalPurchases],
      ...stats.byCategory.map(c => ['Productos en ' + c.category, c.count])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-tienda.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Reporte descargado');
  };

  // PANTALLA DE LOGIN si no hay token
  if (!token) {
    return (
      <div className="App">
        <header className="header">
          <div>
            <p className="kicker">DETALLES QUE ILUMINAN</p>
            <h1>Tienda de Accesorios</h1>
            <p className="subtitle">Inicia sesión para ver la tienda.</p>
          </div>
        </header>

        <section className="panel add-panel">
          <div className="panel-heading">
            <div className="icon-circle">
              <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2>{authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
              <p className="panel-copy">
                {authMode === 'login' ? 'Accede para ver la tienda' : 'Regístrate para comenzar'}
              </p>
            </div>
          </div>
          <form className="add-form" onSubmit={handleAuth}>
            <div>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {authError && <p style={{ color: '#c0392b', fontWeight: 600 }}>{authError}</p>}
            <div className="submit-cell">
              <button type="submit" className="btn-purple">
                {authMode === 'login' ? 'Entrar' : 'Registrarme'}
              </button>
            </div>
            <p className="panel-copy">
              {authMode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </form>
        </section>
      </div>
    );
  }

  if (loading) return <div className="loading">Cargando catálogo...</div>;

  // ===== NUEVO: Vista de ADMINISTRACIÓN =====
  if (view === 'admin') {
    return (
      <div className="App">
        <header className="header">
          <div>
            <p className="kicker">DETALLES QUE ILUMINAN</p>
            <h1>Administración</h1>
            <p className="subtitle">Gestiona los reportes, usuarios y comprobantes de tu tienda.</p>
          </div>
          <div className="header-actions">
            <button className="btn-cancel" onClick={() => setView('store')}>← Volver a la tienda</button>
            <button className="btn-cancel" onClick={logout}>Cerrar sesión</button>
          </div>
        </header>

        <nav className="admin-tabs">
          <button
            className={adminTab === 'reportes' ? 'active' : ''}
            onClick={() => setAdminTab('reportes')}
          >📊 Reportes</button>
          <button
            className={adminTab === 'usuarios' ? 'active' : ''}
            onClick={() => setAdminTab('usuarios')}
          >👤 Usuarios</button>
          <button
            className={adminTab === 'comprobante' ? 'active' : ''}
            onClick={() => setAdminTab('comprobante')}
          >🧾 Comprobante</button>
        </nav>

        {/* SECCIÓN REPORTES */}
        {adminTab === 'reportes' && (
          <section className="panel admin-panel">
            <div className="panel-heading">
              <div className="icon-circle">
                <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div>
                <h2>Reportes</h2>
                <p className="panel-copy">Estadísticas generales de tu tienda.</p>
              </div>
            </div>

            {!stats ? (
              <p className="panel-copy">Cargando estadísticas...</p>
            ) : (
              <>
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalProducts}</div>
                    <div className="stat-label">Productos</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Usuarios</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalPurchases}</div>
                    <div className="stat-label">Compras</div>
                  </div>
                </div>

                <div className="report-block">
                  <h3>Productos por categoría</h3>
                  {stats.byCategory.length === 0 ? (
                    <p className="panel-copy">Sin productos registrados.</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr><th>Categoría</th><th>Cantidad</th></tr>
                      </thead>
                      <tbody>
                        {stats.byCategory.map((c, i) => (
                          <tr key={i}><td>{c.category}</td><td>{c.count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <button className="btn-purple" onClick={downloadCSV} style={{ maxWidth: 260 }}>
                  📥 Descargar reporte CSV
                </button>
              </>
            )}
          </section>
        )}

        {/* SECCIÓN USUARIOS */}
        {adminTab === 'usuarios' && (
          <section className="panel admin-panel">
            <div className="panel-heading">
              <div className="icon-circle">
                <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h2>Usuarios</h2>
                <p className="panel-copy">Usuarios registrados en la tienda.</p>
              </div>
            </div>

            {users.length === 0 ? (
              <p className="panel-copy">No hay usuarios registrados.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Email</th><th>Fecha de registro</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* SECCIÓN COMPROBANTE */}
        {adminTab === 'comprobante' && (
          <>
            <section className="panel admin-panel">
              <div className="panel-heading">
                <div className="icon-circle">
                  <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2>Generar comprobante</h2>
                  <p className="panel-copy">Crea un comprobante de compra (baucher).</p>
                </div>
              </div>

              <form className="add-form" onSubmit={generatePurchase}>
                <div>
                  <label>Nombre del cliente</label>
                  <input
                    placeholder="Ej. María López"
                    value={purchaseForm.clientName}
                    onChange={e => setPurchaseForm({ ...purchaseForm, clientName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Producto</label>
                  <select
                    value={purchaseForm.productId}
                    onChange={e => setPurchaseForm({ ...purchaseForm, productId: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — ${parseFloat(p.price).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Forma de pago</label>
                  <select
                    value={purchaseForm.paymentMethod}
                    onChange={e => setPurchaseForm({ ...purchaseForm, paymentMethod: e.target.value })}
                  >
                    <option>Efectivo</option>
                    <option>Tarjeta</option>
                    <option>Transferencia</option>
                  </select>
                </div>
                <div className="submit-cell">
                  <button type="submit" className="btn-purple">🧾 Generar comprobante</button>
                </div>
              </form>
            </section>

            <section className="panel admin-panel">
              <div className="panel-heading">
                <div className="icon-circle">
                  <svg className="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h2>Historial de comprobantes</h2>
                  <p className="panel-copy">Comprobantes generados.</p>
                </div>
              </div>

              {purchases.length === 0 ? (
                <p className="panel-copy">Aún no hay comprobantes.</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>N°</th><th>Cliente</th><th>Producto</th><th>Precio</th><th>Pago</th><th>Fecha</th></tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.id}>
                        <td>{p.receipt_number}</td>
                        <td>{p.client_name}</td>
                        <td>{p.product_name}</td>
                        <td>${parseFloat(p.price).toFixed(2)}</td>
                        <td>{p.payment_method}</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  // ===== VISTA DE LA TIENDA (original) =====
  return (
    <div className="App">
      <header className="header">
        <div>
          <p className="kicker">DETALLES QUE ILUMINAN</p>
          <h1>Tienda de Accesorios</h1>
          <p className="subtitle">Una selección especial de piezas para expresar tu estilo cada día.</p>
        </div>
        <div className="header-actions">
          <button className="btn-cancel" onClick={() => setView('admin')}>⚙️ Administración</button>
          <button className="btn-cancel" onClick={logout}>Cerrar sesión</button>
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
