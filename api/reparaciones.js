import pool from './db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        `SELECT id, cliente, equipo, falla, progreso, estado FROM reparaciones ORDER BY id DESC`
      )
      res.json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { cliente, equipo, falla } = req.body
    try {
      await pool.query(
        `INSERT INTO reparaciones (cliente, equipo, falla, progreso, estado) VALUES ($1, $2, $3, 0, 'Recibido')`,
        [cliente, equipo, falla]
      )
      res.status(201).json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}