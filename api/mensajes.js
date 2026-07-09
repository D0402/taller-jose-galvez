import pool from './db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { reparacion_id } = req.query
    if (!reparacion_id) return res.status(400).json({ error: 'reparacion_id requerido' })
    try {
      const result = await pool.query(
        `SELECT id, reparacion_id, autor, nombre, contenido, fecha 
         FROM mensajes WHERE reparacion_id = $1 ORDER BY fecha ASC`,
        [reparacion_id]
      )
      res.json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { reparacion_id, autor, nombre, contenido } = req.body
    if (!reparacion_id || !autor || !contenido) return res.status(400).json({ error: 'Faltan campos' })
    try {
      const result = await pool.query(
        `INSERT INTO mensajes (reparacion_id, autor, nombre, contenido) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [reparacion_id, autor, nombre, contenido]
      )
      res.status(201).json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}