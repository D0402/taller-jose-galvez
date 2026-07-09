import pool from './db.js'

export default async function handler(req, res) {

  if (req.method === 'GET') {

    try {
      const result = await pool.query(
        `SELECT id, nombre, categoria, stock, precio, descripcion
         FROM inventario
         ORDER BY categoria, nombre`
      )

      res.json(result.rows)

    } catch (err) {
      res.status(500).json({ error: err.message })
    }

  } else if (req.method === 'POST') {

    const { nombre, categoria, stock, precio, descripcion } = req.body

    try {
      await pool.query(
        `INSERT INTO inventario
        (nombre, categoria, stock, precio, descripcion)
        VALUES ($1, $2, $3, $4, $5)`,
        [nombre, categoria, stock, precio, descripcion || '']
      )

      res.status(201).json({
        success: true
      })

    } catch (err) {
      res.status(500).json({
        error: err.message
      })
    }

  } else if (req.method === 'DELETE') {

    const { id } = req.body

    try {

      const result = await pool.query(
        `DELETE FROM inventario
         WHERE id = $1
         RETURNING *`,
        [id]
      )

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Producto no encontrado'
        })
      }

      res.json({
        success: true,
        producto: result.rows[0]
      })

    } catch (err) {
      res.status(500).json({
        error: err.message
      })
    }

  } else {

    res.status(405).json({
      error: 'Método no permitido'
    })

  }

}