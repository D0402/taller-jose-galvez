import pool from './db.js'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { cliente, items } = req.body
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
      const ventaResult = await client.query(
        `INSERT INTO ventas (cliente, total) VALUES ($1, $2) RETURNING id`,
        [cliente || 'Cliente', total]
      )
      const ventaId = ventaResult.rows[0].id
      for (const item of items) {
        await client.query(
          `INSERT INTO venta_detalle (venta_id, inventario_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)`,
          [ventaId, item.id, item.cantidad, item.precio]
        )
        await client.query(
          `UPDATE inventario SET stock = stock - $1 WHERE id = $2`,
          [item.cantidad, item.id]
        )
      }
      await client.query('COMMIT')
      res.json({ success: true, ventaId })
    } catch (err) {
      await client.query('ROLLBACK')
      res.status(500).json({ error: err.message })
    } finally {
      client.release()
    }
  } else if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT v.id, v.cliente, v.total, v.fecha,
                vd.cantidad, vd.precio_unitario,
                i.nombre as producto
         FROM ventas v
         JOIN venta_detalle vd ON vd.venta_id = v.id
         JOIN inventario i ON i.id = vd.inventario_id
         ORDER BY v.fecha DESC`
      )
      res.json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}