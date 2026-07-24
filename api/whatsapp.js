/**
 * Envío de mensajes WhatsApp vía Twilio.
 * Si faltan credenciales, no falla la app: solo registra en consola.
 */

function normalizarTelefono(raw) {
  if (!raw) return ''
  let digits = String(raw).replace(/\D/g, '')
  // Perú: si viene 9 dígitos (móvil), anteponer 51
  if (digits.length === 9 && digits.startsWith('9')) {
    digits = `51${digits}`
  }
  return digits
}

function telefonoWhatsApp(raw) {
  const digits = normalizarTelefono(raw)
  return digits ? `whatsapp:+${digits}` : ''
}

async function enviarWhatsApp({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM // ej: whatsapp:+14155238886

  if (!sid || !token || !from) {
    console.warn('⚠️ WhatsApp no configurado (TWILIO_*). Mensaje solo guardado en BD.')
    return { ok: false, skipped: true }
  }

  const destino = telefonoWhatsApp(to)
  if (!destino) {
    return { ok: false, error: 'Teléfono de destino inválido' }
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const params = new URLSearchParams({
    From: from,
    To: destino,
    Body: body,
  })

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Error Twilio WhatsApp:', data)
    return { ok: false, error: data.message || res.statusText }
  }

  return { ok: true, sid: data.sid }
}

export { normalizarTelefono, telefonoWhatsApp, enviarWhatsApp }
