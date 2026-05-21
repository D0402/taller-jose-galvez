import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('demo', 10)
console.log(hash)