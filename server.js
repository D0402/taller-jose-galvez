import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
})

const JWT_SECRET = process.env.JWT_SECRET || 'jose_galvez_secret_2024'
const PORT = process.env.PORT || 3001

const app = express()

app.use(cors())
app.use(express.json())

// =========================
// MIDDLEWARE
// =========================

const verificarToken = (req, res, next) => {
  const auth = req.headers.authorization

  if (!auth)
    return res.status(401).json({ error: 'Token requerido' })

  try {
    req.usuario = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

// =========================
// LOGIN
// =========================

app.post('/api/auth/login', async (req, res) => {
  const { correo, password } = req.body

  try {
    const result = await pool.query(
      `SELECT id, correo, password, rol
       FROM usuarios
       WHERE correo=$1`,
      [correo]
    )

    const usuario = result.rows[0]

    if (!usuario)
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      })

    const ok = await bcrypt.compare(password, usuario.password)

    if (!ok)
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      })

    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    )

    res.json({
      token,
      rol: usuario.rol,
      correo: usuario.correo
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =========================
// REPARACIONES
// =========================

app.get('/api/reparaciones', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
      id,
      cliente,
      equipo,
      falla,
      progreso,
      estado
      FROM reparaciones
      ORDER BY id DESC
    `)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/reparaciones', async (req, res) => {
  const { cliente, equipo, falla } = req.body

  try {
    await pool.query(`
      INSERT INTO reparaciones
      (cliente,equipo,falla,progreso,estado)
      VALUES
      ($1,$2,$3,0,'Recibido')
    `, [cliente, equipo, falla])

    res.status(201).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/reparaciones/:id', async (req, res) => {
  const { progreso, estado } = req.body

  try {
    await pool.query(`
      UPDATE reparaciones
      SET progreso=$1,
      estado=$2
      WHERE id=$3
    `, [progreso, estado, req.params.id])

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/reparaciones/:id', async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM reparaciones WHERE id=$1`,
      [req.params.id]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =========================
// INVENTARIO
// =========================

app.get('/api/inventario', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
      id,
      nombre,
      categoria,
      stock,
      precio,
      descripcion
      FROM inventario
      WHERE activo=true
      AND stock>0
      ORDER BY categoria,nombre
    `)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/inventario', async (req, res) => {
  const {
    nombre,
    categoria,
    stock,
    precio,
    descripcion
  } = req.body

  try {
    await pool.query(`
      INSERT INTO inventario
      (nombre, categoria, stock, precio, descripcion, activo)
      VALUES
      ($1,$2,$3,$4,$5,TRUE)
    `, [nombre, categoria, stock, precio, descripcion])

    res.status(201).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/inventario/:id', async (req, res) => {
  const {
    nombre,
    categoria,
    precio,
    stock,
    descripcion
  } = req.body

  try {
    await pool.query(`
      UPDATE inventario
      SET
      nombre=$1,
      categoria=$2,
      precio=$3,
      stock=$4,
      descripcion=$5
      WHERE id=$6
    `, [nombre, categoria, precio, stock, descripcion, req.params.id])

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/inventario/:id', async (req, res) => {
  try {
    await pool.query(`
      UPDATE inventario
      SET activo=false
      WHERE id=$1
    `, [req.params.id])

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})


// =========================
// VENTAS
// =========================

app.post('/api/ventas', async (req, res) => {
  const { cliente, items } = req.body
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const total = items.reduce(
      (s, i) => s + i.precio * i.cantidad,
      0
    )

    const venta = await client.query(
      `
      INSERT INTO ventas(cliente,total)
      VALUES($1,$2)
      RETURNING id
      `,
      [cliente || 'Cliente', total]
    )

    const ventaId = venta.rows[0].id

    for (const item of items) {
      await client.query(
        `
        INSERT INTO venta_detalle
        (venta_id, inventario_id, cantidad, precio_unitario)
        VALUES($1,$2,$3,$4)
        `,
        [ventaId, item.id, item.cantidad, item.precio]
      )

      await client.query(
        `
        UPDATE inventario
        SET stock=stock-$1
        WHERE id=$2
        `,
        [item.cantidad, item.id]
      )
    }

    await client.query('COMMIT')

    res.json({
      success: true,
      ventaId
    })

  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.get('/api/ventas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
      v.id,
      v.cliente,
      v.total,
      v.fecha,
      v.estado,  -- 👈 Agregamos el estado aquí
      vd.cantidad,
      vd.precio_unitario,
      i.nombre AS producto
      FROM ventas v
      JOIN venta_detalle vd ON vd.venta_id=v.id
      JOIN inventario i ON i.id=vd.inventario_id
      ORDER BY v.fecha DESC
    `)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Nuevo endpoint para actualizar el estado del pedido (Entregado / Cancelado)
app.put('/api/ventas/:id', async (req, res) => {
  const { estado } = req.body
  const { id } = req.params

  if (!estado) {
    return res.status(400).json({ error: 'El campo estado es requerido' })
  }

  try {
    await pool.query(
      `UPDATE ventas 
       SET estado = $1 
       WHERE id = $2`,
      [estado, id]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =========================
// MENSAJES (CHAT) - NUEVO
// =========================

app.get('/api/mensajes', async (req, res) => {
  const { reparacion_id } = req.query

  if (!reparacion_id) {
    return res.status(400).json({ error: 'Falta el parámetro reparacion_id' })
  }

  try {
    const result = await pool.query(
      `SELECT id, reparacion_id, autor, nombre, contenido, fecha
       FROM mensajes
       WHERE reparacion_id = $1
       ORDER BY fecha ASC`,
      [reparacion_id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/mensajes', async (req, res) => {
  const { reparacion_id, autor, nombre, contenido } = req.body

  if (!reparacion_id || !autor || !nombre || !contenido) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO mensajes (reparacion_id, autor, nombre, contenido, fecha)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, fecha`,
      [reparacion_id, autor, nombre, contenido.trim()]
    )

    res.status(201).json({ 
      success: true, 
      id: result.rows[0].id, 
      fecha: result.rows[0].fecha 
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// =========================
// SERVIDOR
// =========================

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
})