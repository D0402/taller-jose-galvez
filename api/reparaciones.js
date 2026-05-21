import pool from './db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { correo } = req.query
      let query = `SELECT id, cliente, equipo, falla, progreso, estado, correo_cliente FROM reparaciones`
      let params = []
      if (correo) {
        query += ` WHERE correo_cliente = $1`
        params = [correo]
      }
      query += ` ORDER BY id DESC`
      const result = await pool.query(query, params)
      res.json(result.rows)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else if (req.method === 'POST') {
    const { cliente, equipo, falla, correo_cliente } = req.body
    try {
      await pool.query(
        `INSERT INTO reparaciones (cliente, equipo, falla, progreso, estado, correo_cliente) 
         VALUES ($1, $2, $3, 0, 'Recibido', $4)`,
        [cliente, equipo, falla, correo_cliente || '']
      )
      res.status(201).json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  } else {
    res.status(405).end()
  }
}