import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { normalizarTelefono, enviarWhatsApp } from './api/whatsapp.js'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4
})

const JWT_SECRET = process.env.JWT_SECRET || 'jose_galvez_secret_2024'
const PORT = process.env.PORT || 3001
const WHATSAPP_PUBLICO = process.env.WHATSAPP_PUBLIC_NUMBER || ''

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

async function asegurarColumnas() {
  try {
    await pool.query(`
      ALTER TABLE reparaciones
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(32)
    `)
  } catch (err) {
    console.warn('No se pudo asegurar columna telefono:', err.message)
  }
}

asegurarColumnas()

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
        estado,
        telefono
      FROM reparaciones
      WHERE estado != 'Entregado'
      ORDER BY id DESC
    `)

    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/reparaciones', async (req, res) => {
  const { cliente, equipo, falla, telefono } = req.body
  const tel = normalizarTelefono(telefono)

  try {
    const result = await pool.query(
      `INSERT INTO reparaciones
        (cliente, equipo, falla, progreso, estado, telefono)
       VALUES ($1, $2, $3, 0, 'Recibido', $4)
       RETURNING id`,
      [cliente, equipo, falla, tel || null]
    )

    const ordenId = result.rows[0].id

    // Aviso inicial al cliente por WhatsApp
    if (tel) {
      await enviarWhatsApp({
        to: tel,
        body:
          `🔧 *Servicio Técnico José Gálvez*\n` +
          `Hola ${cliente}, registramos tu equipo *${equipo}*.\n` +
          `Orden #${ordenId}.\n\n` +
          `Responde a este chat de WhatsApp para hablar con el taller. ` +
          `El administrador te escribe desde la página web.`,
      })
    }

    res.status(201).json({ success: true, id: ordenId })
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

// 🟢 1. RUTA DE VENTAS ACTIVAS CORREGIDA (Sin alias rotos)
app.get('/api/ventas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id,
        v.cliente,
        v.total,
        v.fecha,
        v.estado,
        i.nombre AS producto,         -- 👈 Trae el nombre del producto real
        vd.cantidad,                 -- 👈 Trae la cantidad comprada
        vd.precio_unitario
      FROM ventas v
      LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
      LEFT JOIN inventario i ON vd.inventario_id = i.id
      WHERE COALESCE(v.estado, '') NOT IN ('Entregado', 'Cancelado')
      ORDER BY v.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en GET /api/ventas:", err);
    res.status(500).json({ error: err.message });
  }
});

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
// HISTORIAL
// =========================

// 🟢 2. RUTA DE HISTORIAL DE VENTAS CORREGIDA
app.get('/api/historial/ventas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id,
        v.cliente,
        v.total,
        v.fecha,
        v.estado,
        i.nombre AS producto,
        vd.cantidad,
        vd.precio_unitario
      FROM ventas v
      LEFT JOIN venta_detalle vd ON v.id = vd.venta_id
      LEFT JOIN inventario i ON vd.inventario_id = i.id
      WHERE COALESCE(v.estado, '') IN ('Entregado', 'Cancelado')
      ORDER BY v.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en GET /api/historial/ventas:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/historial/reparaciones', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, cliente, equipo, falla, progreso, estado
      FROM reparaciones
      WHERE estado = 'Entregado'
      ORDER BY id DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
// =========================
// MENSAJES (CHAT)
// Admin → escribe en la web → se reenvía por WhatsApp al cliente
// Cliente → responde por WhatsApp → webhook → aparece en la web
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

app.get('/api/whatsapp/info', (_req, res) => {
  res.json({
    numeroPublico: WHATSAPP_PUBLICO,
    configurado: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
    ),
  })
})

app.post('/api/mensajes', async (req, res) => {
  const { reparacion_id, autor, nombre, contenido } = req.body
  const autorNorm = String(autor || '').toLowerCase().trim()

  if (!reparacion_id || !autor || !nombre || !contenido) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' })
  }

  // Solo el admin puede publicar mensajes desde la API web
  if (autorNorm !== 'admin') {
    return res.status(403).json({
      error: 'El cliente debe escribir por WhatsApp, no desde la web.',
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO mensajes (reparacion_id, autor, nombre, contenido, fecha)
       VALUES ($1, 'admin', $2, $3, NOW())
       RETURNING id, fecha`,
      [reparacion_id, nombre || 'Administrador', contenido.trim()]
    )

    const rep = await pool.query(
      `SELECT id, cliente, equipo, telefono FROM reparaciones WHERE id = $1`,
      [reparacion_id]
    )
    const orden = rep.rows[0]
    let whatsapp = { ok: false, skipped: true }

    if (orden?.telefono) {
      whatsapp = await enviarWhatsApp({
        to: orden.telefono,
        body:
          `🔧 *Taller José Gálvez* — Orden #${orden.id}\n` +
          `(${orden.equipo})\n\n` +
          `${contenido.trim()}\n\n` +
          `_Responde este mensaje para continuar el chat._`,
      })
    }

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      fecha: result.rows[0].fecha,
      whatsapp,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Webhook Twilio WhatsApp (cliente escribe aquí).
 * Configurar en Twilio: POST https://TU_DOMINIO/api/whatsapp/webhook
 */
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const fromRaw = req.body.From || '' // whatsapp:+51999...
    const body = String(req.body.Body || '').trim()
    const tel = normalizarTelefono(fromRaw.replace(/^whatsapp:/i, ''))

    if (!tel || !body) {
      res.type('text/xml').send('<Response></Response>')
      return
    }

    // Opcional: el cliente puede escribir "#12 mensaje" para fijar la orden
    let reparacionId = null
    let contenido = body
    const matchOrden = body.match(/^#(\d+)\s*([\s\S]*)$/)
    if (matchOrden) {
      reparacionId = Number(matchOrden[1])
      contenido = (matchOrden[2] || '').trim() || body
    }

    let orden
    if (reparacionId) {
      const r = await pool.query(
        `SELECT id, cliente, telefono FROM reparaciones
         WHERE id = $1 AND estado != 'Entregado'`,
        [reparacionId]
      )
      orden = r.rows[0]
      // Si el teléfono no coincide, no aceptar
      if (orden && normalizarTelefono(orden.telefono) !== tel) {
        orden = null
      }
    }

    if (!orden) {
      const r = await pool.query(
        `SELECT id, cliente, telefono FROM reparaciones
         WHERE regexp_replace(COALESCE(telefono, ''), '[^0-9]', '', 'g') = $1
           AND estado != 'Entregado'
         ORDER BY id DESC
         LIMIT 1`,
        [tel]
      )
      orden = r.rows[0]
    }

    if (!orden) {
      await enviarWhatsApp({
        to: tel,
        body:
          'No encontramos una orden activa con este número. ' +
          'Indica al taller tu WhatsApp al registrar el equipo, o escribe: #NÚMERO tu mensaje',
      })
      res.type('text/xml').send('<Response></Response>')
      return
    }

    await pool.query(
      `INSERT INTO mensajes (reparacion_id, autor, nombre, contenido, fecha)
       VALUES ($1, 'cliente', $2, $3, NOW())`,
      [orden.id, orden.cliente || 'Cliente', contenido]
    )

    res.type('text/xml').send('<Response></Response>')
  } catch (err) {
    console.error('Error webhook WhatsApp:', err)
    res.type('text/xml').send('<Response></Response>')
  }
})


// =========================
// SERVIDOR
// =========================

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.log('ℹ️ WhatsApp: configura TWILIO_* y WHATSAPP_PUBLIC_NUMBER en .env')
  }
})