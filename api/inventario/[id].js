import pool from '../db.js'

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method === 'DELETE') {
    try {
      await pool.query(`DELETE FROM inventario WHERE id = $1`, [id])
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}