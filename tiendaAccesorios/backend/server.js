const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'umcqoky9renenjdeyox1',
  host: 'bzxckpsolzkbqyngc3mw-postgresql.services.clever-cloud.com',
  database: 'bzxckpsolzkbqyngc3mw',
  password: 'gwx7hiNbGgudu0GShS0Qy60Xe9ZUhW',
  port: 50013,
});

const app = express();
app.use(cors());
app.use(express.json());

// GET: Obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Crear un nuevo producto
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, category, image } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO products (name, price, category, image) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, category, image]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Editar un producto
app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, category, image } = req.body;
    const { rows } = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, category = $3, image = $4
       WHERE id = $5 RETURNING *`,
      [name, price, category, image, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Eliminar un producto
app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
