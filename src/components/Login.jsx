import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Login({ onLogin }) {
  const [modo, setModo] = useState('admin'); // 'admin' | 'cliente'
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [ordenCliente, setOrdenCliente] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onLogin(data);
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  const handleClienteSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${API}/reparaciones`);
      const reparaciones = await res.json();

      const orden = reparaciones.find(r =>
        String(r.id ?? r.ID) === ordenCliente.trim() &&
        (r.cliente ?? r.CLIENTE ?? '').toLowerCase() === nombreCliente.trim().toLowerCase()
      );

      if (!orden) {
        setError('No se encontró ninguna orden con ese nombre y número.');
        return;
      }

      onLogin({
        token: null,
        rol: 'cliente',
        correo: nombreCliente.trim(),
        nombreCliente: nombreCliente.trim(),
        ordenId: ordenCliente.trim()
      });
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a0a0a'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px 36px',
        width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', background: '#4f46e5',
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.8rem'
          }}>🔧</div>
          <h2 style={{ margin: 0, color: '#111', fontWeight: '700', fontSize: '1.4rem' }}>Servicio Técnico</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.95rem' }}>José Gálvez</p>
        </div>

        {/* Selector de modo */}
        <div style={{ display: 'flex', marginBottom: '24px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
          <button onClick={() => { setModo('cliente'); setError(''); }} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            background: modo === 'cliente' ? '#fff' : 'transparent',
            color: modo === 'cliente' ? '#4f46e5' : '#6b7280',
            fontWeight: modo === 'cliente' ? '600' : '400',
            boxShadow: modo === 'cliente' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>👤 Cliente</button>
          <button onClick={() => { setModo('admin'); setError(''); }} style={{
            flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
            background: modo === 'admin' ? '#fff' : 'transparent',
            color: modo === 'admin' ? '#4f46e5' : '#6b7280',
            fontWeight: modo === 'admin' ? '600' : '400',
            boxShadow: modo === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}>🛠️ Administrador</button>
        </div>

        {/* Formulario Cliente */}
        {modo === 'cliente' && (
          <form onSubmit={handleClienteSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>
                Tu nombre completo
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={nombreCliente}
                onChange={e => setNombreCliente(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', fontSize: '0.95rem',
                  outline: 'none', boxSizing: 'border-box', color: '#111'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>
                Número de orden
              </label>
              <input
                type="text"
                placeholder="Ej: 1"
                value={ordenCliente}
                onChange={e => setOrdenCliente(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', fontSize: '0.95rem',
                  outline: 'none', boxSizing: 'border-box', color: '#111'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={cargando} style={{
              width: '100%', padding: '13px', background: cargando ? '#818cf8' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem',
              fontWeight: '600', cursor: cargando ? 'not-allowed' : 'pointer'
            }}>
              {cargando ? '⏳ Buscando...' : 'Ver mi reparación'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', marginTop: '16px' }}>
              El número de orden te lo proporciona el técnico al dejar tu equipo.
            </p>
          </form>
        )}

        {/* Formulario Admin */}
        {modo === 'admin' && (
          <form onSubmit={handleAdminSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="usuario@ejemplo.com"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', fontSize: '0.95rem',
                  outline: 'none', boxSizing: 'border-box', color: '#111'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: '6px', fontWeight: '500' }}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', fontSize: '0.95rem',
                  outline: 'none', boxSizing: 'border-box', color: '#111'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={cargando} style={{
              width: '100%', padding: '13px', background: cargando ? '#818cf8' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem',
              fontWeight: '600', cursor: cargando ? 'not-allowed' : 'pointer'
            }}>
              {cargando ? '⏳ Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}