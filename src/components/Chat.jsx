import React, { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Chat({ reparacionId, autor, nombre, telefonoCliente }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [waInfo, setWaInfo] = useState({ numeroPublico: '', configurado: false });
  const chatContainerRef = useRef(null);

  const esAdmin = (autor || '').toLowerCase().trim() === 'admin';

  const formatearNombre = (str) => {
    if (!str) return 'Usuario';
    return str.includes('@') ? str.split('@')[0] : str;
  };

  const cargarMensajes = async () => {
    try {
      const res = await fetch(`${API}/mensajes?reparacion_id=${reparacionId}`);
      const data = await res.json();
      setMensajes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarMensajes();
    const intervalo = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervalo);
  }, [reparacionId]);

  useEffect(() => {
    fetch(`${API}/whatsapp/info`)
      .then((r) => r.json())
      .then(setWaInfo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!esAdmin || !texto.trim()) return;
    setEnviando(true);
    setAviso('');

    try {
      const res = await fetch(`${API}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reparacion_id: reparacionId,
          autor: 'admin',
          nombre: 'Administrador',
          contenido: texto.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAviso(data.error || 'No se pudo enviar');
        return;
      }
      if (data.whatsapp?.skipped) {
        setAviso('Guardado en el chat. WhatsApp no está configurado en el servidor.');
      } else if (data.whatsapp && data.whatsapp.ok === false) {
        setAviso(data.whatsapp.error || 'No se pudo enviar por WhatsApp (revisa el teléfono).');
      } else if (!telefonoCliente) {
        setAviso('Guardado. Esta orden no tiene teléfono WhatsApp registrado.');
      }
      setTexto('');
      cargarMensajes();
    } catch (err) {
      console.error(err);
      setAviso('Error de red al enviar.');
    } finally {
      setEnviando(false);
    }
  };

  const numeroWa = waInfo.numeroPublico || '';
  const linkWa = numeroWa
    ? `https://wa.me/${String(numeroWa).replace(/\D/g, '')}?text=${encodeURIComponent(`#${reparacionId} `)}`
    : null;

  return (
    <div style={{
      border: '2px solid #94a3b8', borderRadius: '12px',
      overflow: 'hidden', marginTop: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <div style={{
        background: '#4f46e5', padding: '12px 16px',
        borderBottom: '2px solid #3730a3'
      }}>
        <p style={{ margin: 0, color: 'white', fontSize: '13px', fontWeight: '600' }}>
          💬 Chat de la orden
        </p>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '11px' }}>
          {esAdmin
            ? 'Tú escribes aquí · el cliente recibe y responde por WhatsApp'
            : 'Solo lectura · responde al taller por WhatsApp'}
        </p>
      </div>

      <div
        ref={chatContainerRef}
        style={{
          height: '240px', overflowY: 'auto', padding: '14px',
          background: '#f1f5f9', display: 'flex',
          flexDirection: 'column', gap: '10px',
          borderBottom: '2px solid #94a3b8'
        }}
      >
        {mensajes.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', margin: 'auto' }}>
            {esAdmin
              ? 'Aún no hay mensajes. Escribe al cliente; se enviará por WhatsApp.'
              : 'Cuando el taller te escriba, verás los mensajes aquí y en WhatsApp.'}
          </p>
        ) : (
          mensajes.map(msg => {
            const msgAutor = (msg.autor || '').toLowerCase().trim();
            const esMio = esAdmin ? msgAutor === 'admin' : msgAutor === 'cliente';

            let nombreEnPantalla = formatearNombre(msg.nombre);
            if (msgAutor === 'admin') nombreEnPantalla = 'Administrador';
            if (msgAutor === 'cliente') nombreEnPantalla = nombreEnPantalla || 'Cliente (WhatsApp)';

            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: esMio ? 'flex-end' : 'flex-start'
              }}>
                <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '3px', fontWeight: '500' }}>
                  {nombreEnPantalla}
                  {msgAutor === 'cliente' ? ' · WhatsApp' : ''}
                  {' · '}
                  {new Date(msg.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div style={{
                  background: esMio ? '#4f46e5' : '#ffffff',
                  color: esMio ? 'white' : '#1e293b',
                  padding: '9px 14px',
                  borderRadius: esMio ? '12px 12px 0 12px' : '12px 12px 12px 0',
                  fontSize: '13px', maxWidth: '75%',
                  border: esMio ? '2px solid #3730a3' : '2px solid #cbd5e1',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  fontWeight: '500'
                }}>
                  {msg.contenido}
                </div>
              </div>
            );
          })
        )}
      </div>

      {esAdmin ? (
        <form onSubmit={enviar} style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          padding: '12px 14px', background: '#fff', borderTop: '2px solid #94a3b8'
        }}>
          {!telefonoCliente && (
            <p style={{ margin: 0, fontSize: '12px', color: '#b45309', background: '#fffbeb', padding: '8px', borderRadius: '8px' }}>
              ⚠️ Esta orden no tiene WhatsApp. Agrégalo al registrar el ingreso para poder escribirle al cliente.
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Mensaje al cliente (se envía por WhatsApp)..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: '8px',
                border: '1.5px solid #94a3b8', fontSize: '13px',
                outline: 'none', color: '#1e293b', background: '#f8fafc',
                fontWeight: '500'
              }}
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              style={{
                background: enviando || !texto.trim() ? '#94a3b8' : '#25D366',
                color: 'white', border: 'none',
                padding: '9px 18px', borderRadius: '8px',
                fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {enviando ? '...' : 'Enviar WA'}
            </button>
          </div>
          {aviso && (
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{aviso}</p>
          )}
        </form>
      ) : (
        <div style={{
          padding: '14px', background: '#ecfdf5', borderTop: '2px solid #94a3b8',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#065f46', fontWeight: '500' }}>
            Para hablar con el taller, escribe por WhatsApp
            {numeroWa ? ` al ${numeroWa}` : ''}.
          </p>
          {linkWa ? (
            <a
              href={linkWa}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block', background: '#25D366', color: '#fff',
                padding: '10px 18px', borderRadius: '8px', fontSize: '13px',
                fontWeight: '600', textDecoration: 'none'
              }}
            >
              Abrir WhatsApp
            </a>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              El número de WhatsApp del taller se configura en el servidor (WHATSAPP_PUBLIC_NUMBER).
            </p>
          )}
          <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#64748b' }}>
            Tip: puedes empezar con <code>#{reparacionId}</code> y tu mensaje.
          </p>
        </div>
      )}
    </div>
  );
}
