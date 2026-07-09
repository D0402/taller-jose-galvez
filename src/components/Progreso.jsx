import React from 'react';
import Chat from './Chat';

const colorHeader = (progreso) => {
  if (progreso >= 100) return '#0F6E56';
  if (progreso >= 50) return '#4f46e5';
  return '#1e3a8a';
};

const colorBarra = (progreso) => {
  if (progreso >= 100) return '#10b981';
  if (progreso >= 50) return '#4f46e5';
  return '#3b82f6';
};

const badgeEstado = (estado) => {
  const e = (estado || '').toLowerCase();
  if (e.includes('listo'))    return { bg: '#D1FAE5', color: '#065F46', texto: estado };
  if (e.includes('reparaci')) return { bg: '#FEF3C7', color: '#92400E', texto: estado };
  return { bg: '#DBEAFE', color: '#1E40AF', texto: estado };
};

const mensajePie = (progreso) => {
  if (progreso === 0)                return '📥 Tu equipo fue recibido y está en cola de atención.';
  if (progreso > 0 && progreso < 50) return '🔍 Diagnóstico en proceso, pronto tendremos novedades.';
  if (progreso < 100)                return '⚙️ Reparación en curso, ya va por más de la mitad.';
  return '✅ ¡Tu equipo está listo! Puedes pasar a recogerlo.';
};

export default function Progreso({ reparaciones, sesion }) {
  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
        Mis reparaciones
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
        Seguimiento del estado de tus dispositivos
      </p>

      {reparaciones.length === 0 ? (
        <div style={{
          background: '#fff', border: '2px solid #94a3b8', borderRadius: '12px',
          padding: '40px', textAlign: 'center', color: '#64748b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          No hay órdenes registradas aún.
        </div>
      ) : (
        reparaciones.map((rep) => {
          const id       = rep.ID      ?? rep.id;
          const cliente  = rep.CLIENTE ?? rep.cliente  ?? '';
          const equipo   = rep.EQUIPO  ?? rep.equipo   ?? '';
          const falla    = rep.FALLA   ?? rep.falla    ?? '';
          const progreso = Number(rep.PROGRESO ?? rep.progreso ?? 0);
          const estado   = rep.ESTADO  ?? rep.estado   ?? '';
          const badge    = badgeEstado(estado);

          return (
            <div key={id} style={{
              borderRadius: '12px', overflow: 'hidden',
              marginBottom: '24px',
              border: '2px solid #94a3b8',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {/* Header */}
              <div style={{
                background: colorHeader(progreso),
                padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                    {equipo}
                  </h3>
                  <small style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    Orden #{id} — {cliente}
                  </small>
                </div>
                <span style={{
                  background: badge.bg, color: badge.color,
                  padding: '5px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap'
                }}>
                  {badge.texto}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', background: '#fff' }}>
                {/* Barra */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '500' }}>
                  <span>Progreso</span>
                  <span>{progreso}%</span>
                </div>
                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', border: '1px solid #cbd5e1' }}>
                  <div style={{
                    width: `${progreso}%`, height: '100%',
                    background: colorBarra(progreso),
                    borderRadius: '10px', transition: 'width 0.6s ease'
                  }} />
                </div>

                {/* Detalle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Descripción del problema
                    </p>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{falla}</span>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                    <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Estado actual
                    </p>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{mensajePie(progreso)}</span>
                  </div>
                </div>

                {/* Chat */}
                <Chat
                  reparacionId={id}
                  autor="cliente"
                  nombre={cliente}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}