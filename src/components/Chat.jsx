import React, { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Chat({ reparacionId, autor, nombre }) {
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const chatContainerRef = useRef(null);

  const rolActivo = (autor || '').toLowerCase().trim();

  // Función para limpiar correos en pantalla (ej: "jimena@gmail.com" -> "jimena")
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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
  
    const autorEnvio = rolActivo === 'admin' ? 'admin' : 'cliente';
    const nombreEnvio = rolActivo === 'admin' ? 'Administrador' : nombre;
  
    try {
      await fetch(`${API}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reparacion_id: reparacionId, 
          autor: autorEnvio, 
          nombre: nombreEnvio,
          contenido: texto.trim() 
        })
      });
      setTexto('');
      cargarMensajes();
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

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
            No hay mensajes aún. ¡Escribe el primero!
          </p>
        ) : (
          mensajes.map(msg => {
            const msgAutor = (msg.autor || '').toLowerCase().trim();
            const esMio = msgAutor === rolActivo;

            // Corrección absoluta basada en el rol del mensaje
            let nombreEnPantalla = formatearNombre(msg.nombre);
            if (msgAutor === 'admin') {
              nombreEnPantalla = 'Administrador';
            }

            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: esMio ? 'flex-end' : 'flex-start'
              }}>
                <span style={{ fontSize: '10px', color: '#64748b', marginBottom: '3px', fontWeight: '500' }}>
                  {nombreEnPantalla} · {new Date(msg.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
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

      <form onSubmit={enviar} style={{
        display: 'flex', gap: '8px', padding: '12px 14px',
        background: '#fff', borderTop: '2px solid #94a3b8'
      }}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
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
            background: enviando || !texto.trim() ? '#94a3b8' : '#4f46e5',
            color: 'white', border: 'none',
            padding: '9px 18px', borderRadius: '8px',
            fontSize: '13px', fontWeight: '600',
            cursor: "pointer"
          }}
        >
          {enviando ? '...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}