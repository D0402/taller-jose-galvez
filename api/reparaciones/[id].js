import pool from '../db.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const { progreso, estado } = req.body
    try {
      await pool.query(
        `UPDATE reparaciones SET progreso = $1, estado = $2 WHERE id = $3`,
        [progreso, estado, id]
      )
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.query(`DELETE FROM reparaciones WHERE id = $1`, [id])
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}