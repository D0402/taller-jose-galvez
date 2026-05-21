import pool from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'jose_galvez_secret_2024'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { correo, password } = req.body
  try {
    const result = await pool.query(
      `SELECT id, correo, password, rol FROM usuarios WHERE correo = $1`,
      [correo]
    )
    const usuario = result.rows[0]
    if (!usuario) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })

    const valida = await bcrypt.compare(password, usuario.password)
    if (!valida) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, rol: usuario.rol, correo: usuario.correo })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}