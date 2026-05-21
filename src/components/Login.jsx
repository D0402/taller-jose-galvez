import React, { useState } from 'react';

const API = 'http://localhost:3001/api';

export default function Login({ onLogin }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
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
      onLogin(data); // { token, rol, correo }
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

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
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
                outline: 'none', boxSizing: 'border-box', color: '#111',
                transition: 'border 0.2s'
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
                outline: 'none', boxSizing: 'border-box', color: '#111',
                transition: 'border 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', padding: '10px 14px', borderRadius: '8px',
              fontSize: '0.85rem', marginBottom: '16px'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%', padding: '13px', background: cargando ? '#818cf8' : '#4f46e5',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem',
              fontWeight: '600', cursor: cargando ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {cargando ? '⏳ Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Usuarios de prueba */}
        <div style={{
          marginTop: '24px', background: '#f9fafb', borderRadius: '10px',
          padding: '14px', fontSize: '0.8rem', color: '#6b7280'
        }}>
          <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#374151' }}>Usuarios de prueba:</p>
          <p style={{ margin: '2px 0' }}>
            <strong>Cliente:</strong> <span style={{ color: '#4f46e5' }}>cliente@test.com</span>
          </p>
          <p style={{ margin: '2px 0' }}>
            <strong>Admin:</strong> <span style={{ color: '#4f46e5' }}>admin@test.com</span>
          </p>
          <p style={{ margin: '4px 0 0' }}>
            <strong>Contraseña:</strong> demo
          </p>
        </div>
      </div>
    </div>
  );
}