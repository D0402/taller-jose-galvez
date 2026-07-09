import React, { useState, useEffect } from 'react';

export default function Historial({ API, token }) {
  const [pestaña, setPestaña] = useState('reparaciones'); // 'reparaciones' o 'ventas'
  const [reparaciones, setReparaciones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Cargar datos desde el backend
  const cargarHistorial = async () => {
    setCargando(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // 1. Traer Reparaciones
      const resRep = await fetch(`${API}/historial/reparaciones`, { headers });
      const dataRep = await resRep.json();
      setReparaciones(dataRep);
      // Filtrar solo las que ya estén listas o entregadas
      const filtradasRep = dataRep.filter(r => 
        (r.estado || '').toLowerCase().includes('listo') || 
        (r.estado || '').toLowerCase().includes('entrega')
      );
      setReparaciones(filtradasRep);

      // 2. Traer Ventas del catálogo
      const resVentas = await fetch(`${API}/historial/ventas`, { headers });
      const dataVentas = await resVentas.json();
      
      // Agrupar ventas por ID (igual que en Pedidos)
      const agrupadasVentas = dataVentas.reduce((acc, current) => {
        const encontrado = acc.find(p => p.id === current.id);
        const itemProducto = { nombre: current.producto, cantidad: current.cantidad, precio: current.precio_unitario };
        
        if (encontrado) {
          encontrado.productos.push(itemProducto);
        } else {
          acc.push({
            id: current.id,
            cliente: current.cliente,
            total: current.total,
            fecha: current.fecha,
            estado: current.estado || 'Confirmado',
            productos: [itemProducto]
          });
        }
        return acc;
      }, []);

      // Filtrar en el historial solo las ventas que ya fueron Entregadas o Canceladas
      const filtradasVentas = agrupadasVentas.filter(v => 
        v.estado === 'Entregado' || v.estado === 'Cancelado'
      );
      setVentas(filtradasVentas);

    } catch (err) {
      console.error("Error cargando el historial:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Calcular totales para un pequeño resumen financiero
  const totalGanadoVentas = ventas
    .filter(v => v.estado === 'Entregado')
    .reduce((sum, v) => sum + Number(v.total), 0);

  return (
    <div style={{ padding: '4px 0' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
        📊 Historial General
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        Registro de órdenes completadas y operaciones cerradas.
      </p>

      {/* Selector de sub-pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button 
          onClick={() => setPestaña('reparaciones')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            background: pestaña === 'reparaciones' ? '#4f46e5' : '#f1f5f9',
            color: pestaña === 'reparaciones' ? '#fff' : '#475569',
            border: 'none', transition: 'all 0.2s'
          }}
        >
          🛠️ Reparaciones Terminadas ({reparaciones.length})
        </button>
        <button 
          onClick={() => setPestaña('ventas')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            background: pestaña === 'ventas' ? '#4f46e5' : '#f1f5f9',
            color: pestaña === 'ventas' ? '#fff' : '#475569',
            border: 'none', transition: 'all 0.2s'
          }}
        >
          🛒 Ventas del Catálogo ({ventas.length})
        </button>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando registros históricos...</p>
      ) : pestaña === 'reparaciones' ? (
        /* ================= VISTA REPARACIONES ================= */
        <div>
          {reparaciones.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No hay reparaciones archivadas en el historial todavía.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left', fontSize: '13px', color: '#475569' }}>
                  <th style={{ padding: '12px' }}>Orden</th>
                  <th style={{ padding: '12px' }}>Cliente</th>
                  <th style={{ padding: '12px' }}>Dispositivo</th>
                  <th style={{ padding: '12px' }}>Estado Final</th>
                </tr>
              </thead>
              <tbody>
                {reparaciones.map(rep => (
                  <tr key={rep.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{rep.id}</td>
                    <td style={{ padding: '12px' }}>{rep.cliente}</td>
                    <td style={{ padding: '12px' }}>{rep.equipo}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                        {rep.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ================= VISTA VENTAS ================= */
        <div>
          {/* Dashboard balance rápido */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '14px', borderRadius: '8px', marginBottom: '16px', color: '#065f46' }}>
            💰 Total Recaudado en Caja por Catálogo: <strong>S/ {totalGanadoVentas.toFixed(2)}</strong> (Excluye cancelados)
          </div>

          {ventas.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No hay ventas cerradas en el historial todavía.</p>
          ) : (
            ventas.map(venta => (
              <div key={venta.id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>🛒 Pedido #{venta.id} — {venta.cliente}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(venta.fecha).toLocaleString('es-PE')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: venta.estado === 'Cancelado' ? '#b91c1c' : '#15803d' }}>
                      S/ {Number(venta.total).toFixed(2)}
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{
                        background: venta.estado === 'Cancelado' ? '#FEE2E2' : '#D1FAE5',
                        color: venta.estado === 'Cancelado' ? '#991B1B' : '#065F46',
                        padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600'
                      }}>
                        {venta.estado}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Productos de la venta */}
                <div style={{ fontSize: '12px', color: '#475569', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                  {venta.productos.map((p, i) => (
                    <div key={i}>• {p.nombre} (x{p.cantidad})</div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}