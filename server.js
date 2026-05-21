import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import oracledb from 'oracledb'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'jose_galvez_secret_2024'
const PORT = 3001
const ORACLE_ROWS = { outFormat: oracledb.OUT_FORMAT_OBJECT }

const app = express()
app.use(cors())
app.use(express.json())

// --- Middlewares de autenticación ---
const verificarToken = (req, res, next) => {
  const auth = req.headers['authorization']
  if (!auth) return res.status(401).json({ error: 'Token requerido' })
  try {
    req.usuario = jwt.verify(auth.split(' ')[1], JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })
  next()
}

async function startServer() {
  try {
    await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    })
    console.log('✅ Pool de conexiones Oracle listo')

    // --- TEST ---
    app.get('/api/test', (req, res) => {
      res.json({ status: 'Servidor funcionando correctamente' })
    })

    // --- AUTENTICACIÓN ---
    app.post('/api/auth/login', async (req, res) => {
      const { correo, password } = req.body
      let conn
      try {
        conn = await oracledb.getConnection()
        const result = await conn.execute(
          `SELECT id, correo, password, rol FROM usuarios WHERE correo = :correo`,
          [correo],
          ORACLE_ROWS
        )
        const usuario = result.rows[0]
        if (!usuario) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })

        const passwordValida = await bcrypt.compare(password, usuario.PASSWORD)
        if (!passwordValida) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })

        const token = jwt.sign(
          { id: usuario.ID, correo: usuario.CORREO, rol: usuario.ROL },
          JWT_SECRET,
          { expiresIn: '8h' }
        )
        res.json({ token, rol: usuario.ROL, correo: usuario.CORREO })
      } catch (err) {
        console.error('Error login:', err)
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    // --- REPARACIONES ---
    app.get('/api/reparaciones', async (req, res) => {
      let conn
      try {
        conn = await oracledb.getConnection()
        const result = await conn.execute(
          `SELECT id, cliente, equipo, falla, progreso, estado FROM reparaciones ORDER BY id DESC`,
          [],
          ORACLE_ROWS
        )
        res.json(result.rows)
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.post('/api/reparaciones', async (req, res) => {
      const { cliente, equipo, falla, progreso, estado } = req.body
      let conn
      try {
        conn = await oracledb.getConnection()
        await conn.execute(
          `INSERT INTO reparaciones (cliente, equipo, falla, progreso, estado)
           VALUES (:cliente, :equipo, :falla, :progreso, :estado)`,
          [cliente, equipo, falla, progreso || 0, estado || 'Recibido'],
          { autoCommit: true }
        )
        res.status(201).send('Reparación guardada')
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.put('/api/reparaciones/:id', async (req, res) => {
      const { progreso, estado } = req.body
      let conn
      try {
        conn = await oracledb.getConnection()
        await conn.execute(
          `UPDATE reparaciones SET progreso = :progreso, estado = :estado WHERE id = :id`,
          [progreso, estado, req.params.id],
          { autoCommit: true }
        )
        res.send('✅ Actualizado correctamente')
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.delete('/api/reparaciones/:id', async (req, res) => {
      let conn
      try {
        conn = await oracledb.getConnection()
        await conn.execute(
          `DELETE FROM reparaciones WHERE id = :id`,
          [req.params.id],
          { autoCommit: true }
        )
        res.send('✅ Eliminado correctamente')
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    // --- INVENTARIO ---
    app.get('/api/inventario', async (req, res) => {
      let conn
      try {
        conn = await oracledb.getConnection()
        const result = await conn.execute(
          `SELECT id, nombre, categoria, stock, precio, descripcion FROM inventario ORDER BY categoria, nombre`,
          [],
          ORACLE_ROWS
        )
        res.json(result.rows)
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.post('/api/inventario', async (req, res) => {
      const { nombre, categoria, stock, precio, descripcion } = req.body
      let conn
      try {
        conn = await oracledb.getConnection()
        await conn.execute(
          `INSERT INTO inventario (nombre, categoria, stock, precio, descripcion)
           VALUES (:nombre, :categoria, :stock, :precio, :descripcion)`,
          [nombre, categoria, stock, precio, descripcion],
          { autoCommit: true }
        )
        res.status(201).send('Item añadido al inventario')
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.delete('/api/inventario/:id', async (req, res) => {
      let conn
      try {
        conn = await oracledb.getConnection()
        await conn.execute(
          `DELETE FROM inventario WHERE id = :id`,
          [req.params.id],
          { autoCommit: true }
        )
        res.send('✅ Item eliminado')
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    // --- VENTAS ---
    app.post('/api/ventas', async (req, res) => {
      const { cliente, items } = req.body
      let conn
      try {
        conn = await oracledb.getConnection()

        const resultVenta = await conn.execute(
          `INSERT INTO ventas (cliente, total, fecha)
           VALUES (:cliente, :total, SYSDATE)
           RETURNING id INTO :id`,
          {
            cliente: cliente || 'Cliente',
            total: items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
            id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
          },
          { autoCommit: false }
        )
        const ventaId = resultVenta.outBinds.id[0]

        for (const item of items) {
          await conn.execute(
            `INSERT INTO venta_detalle (venta_id, inventario_id, cantidad, precio_unitario)
             VALUES (:venta_id, :inventario_id, :cantidad, :precio)`,
            { venta_id: ventaId, inventario_id: item.id, cantidad: item.cantidad, precio: item.precio }
          )
          await conn.execute(
            `UPDATE inventario SET stock = stock - :cantidad WHERE id = :id`,
            { cantidad: item.cantidad, id: item.id }
          )
        }

        await conn.commit()
        res.json({ success: true, ventaId })
      } catch (err) {
        if (conn) await conn.rollback()
        console.error(err)
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.get('/api/ventas', async (req, res) => {
      let conn
      try {
        conn = await oracledb.getConnection()
        const result = await conn.execute(
          `SELECT v.id, v.cliente, v.total, v.fecha,
                  vd.cantidad, vd.precio_unitario,
                  i.nombre as producto
           FROM ventas v
           JOIN venta_detalle vd ON vd.venta_id = v.id
           JOIN inventario i ON i.id = vd.inventario_id
           ORDER BY v.fecha DESC`,
          [],
          ORACLE_ROWS
        )
        res.json(result.rows)
      } catch (err) {
        res.status(500).json({ error: err.message })
      } finally {
        if (conn) await conn.close()
      }
    })

    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${PORT}`)
    })

  } catch (err) {
    console.error('❌ Error crítico al iniciar el servidor:', err)
  }
}

startServer()