import React, { useState, useEffect } from 'react';

export default function Pedidos({ API, token }) {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarVentas = async () => {
    try {
      const res = await fetch(`${API}/ventas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();

      const agrupadas = data.reduce((acc, row) => {
        const id = row.id;
        if (!acc[id]) {
          acc[id] = {
            id,
            cliente: row.cliente,
            total: row.total,
            fecha: row.fecha,
            items: []
          };
        }
        acc[id].items.push({
          producto: row.producto,
          cantidad: row.cantidad,
          precio: row.precio_unitario
        });
        return acc;
      }, {});

      setVentas(Object.values(agrupadas).reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  if (cargando) return (
    <p style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>
      Cargando pedidos...
    </p>
  );

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
        Pedidos del Catálogo
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
        Ventas confirmadas por clientes desde el catálogo
      </p>

      {ventas.length === 0 ? (
        <div style={{
          background: '#fff', border: '2px solid #94a3b8',
          borderRadius: '12px', padding: '40px',
          textAlign: 'center', color: '#64748b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          No hay pedidos confirmados aún.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ventas.map(venta => (
            <div key={venta.id} style={{
              background: '#fff',
              border: '2px solid #94a3b8',
              borderRadius: '12px', padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              {/* Cabecera */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '16px',
                paddingBottom: '16px', borderBottom: '2px solid #e2e8f0'
              }}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', margin: '0 0 4px' }}>
                    👤 {venta.cliente}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    Pedido #{venta.id} — {new Date(venta.fecha).toLocaleDateString('es-PE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '700', fontSize: '20px', color: '#3b82f6', margin: '0 0 6px' }}>
                    S/ {Number(venta.total).toFixed(2)}
                  </p>
                  <span style={{
                    background: '#dbeafe', color: '#1e40af',
                    fontSize: '11px', padding: '3px 10px',
                    borderRadius: '10px', fontWeight: '600',
                    border: '1px solid #93c5fd'
                  }}>
                    ✓ Confirmado
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{
                background: '#f8fafc', borderRadius: '8px',
                padding: '12px', border: '1.5px solid #cbd5e1'
              }}>
                <p style={{
                  fontSize: '11px', color: '#64748b', fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  margin: '0 0 8px'
                }}>
                  Productos
                </p>
                {venta.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '13px', padding: '6px 0',
                    borderBottom: idx < venta.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>
                      {item.producto}
                      <span style={{
                        background: '#e2e8f0', color: '#64748b',
                        fontSize: '11px', padding: '1px 6px',
                        borderRadius: '6px', marginLeft: '6px', fontWeight: '600'
                      }}>
                        x{item.cantidad}
                      </span>
                    </span>
                    <span style={{ color: '#0f172a', fontWeight: '600' }}>
                      S/ {(Number(item.precio) * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: '10px', paddingTop: '10px',
                  borderTop: '2px solid #cbd5e1',
                  fontWeight: '700', fontSize: '14px'
                }}>
                  <span style={{ color: '#475569' }}>Total</span>
                  <span style={{ color: '#3b82f6' }}>S/ {Number(venta.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}