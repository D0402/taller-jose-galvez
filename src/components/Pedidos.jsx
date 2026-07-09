import React, { useState, useEffect } from 'react';

export default function Pedidos({ API, token }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/ventas`, { headers });
      const data = await res.json();
      
      // Agrupamos filas duplicadas con el mismo ID de venta
      const agrupados = data.reduce((acc, current) => {
        const encontrado = acc.find(p => p.id === current.id);
        const itemProducto = {
          nombre: current.producto,
          cantidad: current.cantidad,
          precio: current.precio_unitario
        };
        
        if (encontrado) {
          encontrado.productos.push(itemProducto);
        } else {
          acc.push({
            id: current.id,
            cliente: current.cliente,
            total: current.total,
            fecha: current.fecha,
            estado: current.estado || 'Confirmado', // Fallback si está null
            productos: [itemProducto]
          });
        }
        return acc;
      }, []);

      setPedidos(agrupados);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cambiarEstado = async (idVenta, nuevoEstado) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };
  
      // Aseguramos que use la variable API (ej: https://api-tu-backend.com/api/ventas/id)
      const urlDestino = `${API}/ventas/${idVenta}`;
      console.log("🔗 Enviando actualización a:", urlDestino);
  
      const res = await fetch(urlDestino, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ estado: nuevoEstado })
      });
  
      if (res.ok) {
        cargarPedidos(); 
      } else {
        alert("No se pudo actualizar el estado del pedido");
      }
    } catch (err) {
      console.error("Error actualizando pedido:", err);
    }
  };

  const estiloEstado = (estado) => {
    const est = (estado || '').toLowerCase();
    if (est.includes('entrega')) return { bg: '#D1FAE5', color: '#065F46' };
    if (est.includes('cancela')) return { bg: '#FEE2E2', color: '#991B1B' };
    return { bg: '#DBEAFE', color: '#1E40AF' };
  };

  if (cargando) return <p style={{ textAlign: 'center', padding: '20px' }}>Cargando pedidos...</p>;

  return (
    <div style={{ padding: '4px 0' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
        Pedidos del Catálogo
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
        Ventas confirmadas por clientes desde el catálogo
      </p>

      {pedidos.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No hay pedidos registrados.</p>
      ) : (
        pedidos.map((pedido) => {
          const badge = estiloEstado(pedido.estado);
          
          return (
            <div key={pedido.id} style={{
              background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: '12px',
              padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                    👤 {pedido.cliente}
                  </h4>
                  <small style={{ color: '#64748b', fontSize: '12px' }}>
                    Pedido #{pedido.id} — {new Date(pedido.fecha).toLocaleString('es-PE')}
                  </small>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#4f46e5' }}>
                    S/ {Number(pedido.total).toFixed(2)}
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{
                      background: badge.bg, color: badge.color,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>
                      {pedido.estado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de productos agrupados */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Productos</span>
                {pedido.productos.map((prod, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px' }}>
                    <span>{prod.nombre} <small style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>x{prod.cantidad}</small></span>
                    <strong style={{ color: '#1e293b' }}>S/ {Number(prod.precio * prod.cantidad).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              {/* Botonera de cambio de estado */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center', marginRight: 'auto' }}>
                  Acciones del administrador:
                </span>
                
                <button
                  onClick={() => cambiarEstado(pedido.id, 'Entregado')}
                  disabled={pedido.estado === 'Entregado' || pedido.estado === 'Cancelado'}
                  style={{
                    background: pedido.estado === 'Entregado' ? '#cbd5e1' : pedido.estado === 'Cancelado' ? '#f1f5f9' : '#22c55e',
                    color: pedido.estado === 'Cancelado' ? '#94a3b8' : 'white', 
                    border: 'none', padding: '6px 14px', borderRadius: '6px',
                    fontSize: '12px', fontWeight: '600', cursor: pedido.estado === 'Confirmado' ? 'pointer' : 'not-allowed'
                  }}
                >
                  ✓ Entregado
                </button>

                <button
                  onClick={() => cambiarEstado(pedido.id, 'Cancelado')}
                  disabled={pedido.estado === 'Entregado' || pedido.estado === 'Cancelado'}
                  style={{
                    background: 'transparent', 
                    color: pedido.estado === 'Cancelado' ? '#94a3b8' : pedido.estado === 'Entregado' ? '#cbd5e1' : '#ef4444', 
                    border: `1px solid ${pedido.estado === 'Confirmado' ? '#ef4444' : '#cbd5e1'}`,
                    padding: '6px 14px', borderRadius: '6px',
                    fontSize: '12px', fontWeight: '600', cursor: pedido.estado === 'Confirmado' ? 'pointer' : 'not-allowed'
                  }}
                >
                  ✕ Cancelar
                </button>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}