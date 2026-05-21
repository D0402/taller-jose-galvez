import React, { useState } from 'react';

export default function Inventario({ items, tipo, API, onUpdate, esVendedor, token }) {
  const [carrito, setCarrito] = useState({});
  const [nombreCliente, setNombreCliente] = useState('');
  const [confirmado, setConfirmado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const filtrados = items.filter((item) => {
    const cat = (item.CATEGORIA ?? item.categoria ?? '').trim();
    return tipo === 'repuestos' ? cat === 'Repuesto' : cat !== 'Repuesto';
  });

  const agregar = (item) => {
    const id    = item.ID ?? item.id;
    const stock = Number(item.STOCK ?? item.stock ?? 0);
    if (stock === 0) return;
    setCarrito(prev => {
      const qty = prev[id] || 0;
      if (qty >= stock) return prev;
      return { ...prev, [id]: qty + 1 };
    });
  };

  const cambiar = (id, delta) => {
    setCarrito(prev => {
      const qty = (prev[id] || 0) + delta;
      if (qty <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: qty };
    });
  };

  const totalItems = Object.values(carrito).reduce((a, b) => a + b, 0);
  const totalPrecio = Object.entries(carrito).reduce((sum, [id, qty]) => {
    const item = filtrados.find(i => String(i.ID ?? i.id) === id);
    return sum + (item ? Number(item.PRECIO ?? item.precio) * qty : 0);
  }, 0);

  const confirmarCompra = async () => {
    if (!nombreCliente.trim()) return alert('Por favor ingresa tu nombre.');
    setCargando(true);
    try {
      const itemsPayload = Object.entries(carrito).map(([id, cantidad]) => {
        const item = filtrados.find(i => String(i.ID ?? i.id) === id);
        return { id: Number(id), cantidad, precio: Number(item.PRECIO ?? item.precio) };
      });
      const res = await fetch(`${API}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ cliente: nombreCliente.trim(), items: itemsPayload })
      });
      const data = await res.json();
      if (data.success) {
        const resumen = Object.entries(carrito).map(([id, qty]) => {
          const item = filtrados.find(i => String(i.ID ?? i.id) === id);
          return { nombre: item.NOMBRE ?? item.nombre, qty, precio: Number(item.PRECIO ?? item.precio) };
        });
        setConfirmado({ ventaId: data.ventaId, items: resumen, total: totalPrecio });
        setCarrito({});
        setNombreCliente('');
        onUpdate();
      } else {
        alert('Error al procesar la venta.');
      }
    } catch {
      alert('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  // Pantalla de confirmación
  if (confirmado) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ background: '#111', border: '0.5px solid #0F6E56', borderRadius: '12px', padding: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
          <h2 style={{ color: '#10b981', fontSize: '20px', fontWeight: '500', marginBottom: '6px' }}>
            ¡Pedido confirmado!
          </h2>
          <p style={{ color: '#475569', fontSize: '13px', marginBottom: '20px' }}>
            Orden de venta <strong style={{ color: '#60a5fa' }}>#{confirmado.ventaId}</strong>
          </p>
          <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '14px', textAlign: 'left', marginBottom: '20px' }}>
            {confirmado.items.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8' }}>{i.nombre} <span style={{ color: '#475569' }}>x{i.qty}</span></span>
                <span style={{ color: '#fff' }}>S/ {(i.precio * i.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '0.5px solid #1e293b', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
              <span style={{ color: '#94a3b8' }}>Total</span>
              <span style={{ color: '#10b981' }}>S/ {confirmado.total.toFixed(2)}</span>
            </div>
          </div>
          <p style={{ color: '#475569', fontSize: '12px', marginBottom: '20px' }}>
            Acércate al mostrador para coordinar la entrega
          </p>
          <button onClick={() => setConfirmado(null)} style={{
            background: '#4f46e5', color: 'white', border: 'none',
            padding: '10px 24px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer'
          }}>
            Seguir comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '500', color: '#fff', marginBottom: '4px' }}>
        {tipo === 'repuestos' ? 'Repuestos de taller' : 'Catálogo de productos'}
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
        {tipo === 'productos' ? 'Agrega productos a tu carrito y confirma tu pedido' : 'Inventario de repuestos disponibles'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: tipo === 'productos' ? '1fr 240px' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* Catálogo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {filtrados.length === 0 ? (
            <p style={{ color: '#475569', gridColumn: '1/-1' }}>No hay productos disponibles.</p>
          ) : filtrados.map((item) => {
            const id     = item.ID    ?? item.id;
            const stock  = Number(item.STOCK  ?? item.stock  ?? 0);
            const precio = Number(item.PRECIO ?? item.precio ?? 0);
            const nombre = item.NOMBRE      ?? item.nombre ?? '';
            const desc   = item.DESCRIPCION ?? item.descripcion ?? '';
            const qty    = carrito[id] || 0;

            return (
              <div key={id} style={{
                background: '#111',
                border: `0.5px solid ${qty > 0 ? '#4f46e580' : '#1e293b'}`,
                borderRadius: '12px', padding: '14px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                transition: 'border 0.2s'
              }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>{nombre}</p>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', flex: 1 }}>{desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px', color: '#fff' }}>S/ {precio.toFixed(2)}</strong>
                  <span style={{ fontSize: '11px', color: stock === 0 ? '#ef4444' : stock < 4 ? '#f59e0b' : '#10b981' }}>
                    {stock === 0 ? 'Sin stock' : `Stock: ${stock}`}
                  </span>
                </div>

                {tipo === 'productos' && (
                  stock === 0 ? (
                    <button disabled style={{
                      width: '100%', padding: '8px', background: '#1e293b',
                      color: '#475569', border: 'none', borderRadius: '8px',
                      fontSize: '13px', cursor: 'not-allowed'
                    }}>Sin stock</button>
                  ) : qty > 0 ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: '#0a0a0a', borderRadius: '8px', padding: '6px 10px'
                    }}>
                      <button onClick={() => cambiar(id, -1)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>−</button>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>{qty} en carrito</span>
                      <button onClick={() => cambiar(id, +1)} disabled={qty >= stock} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', opacity: qty >= stock ? 0.3 : 1 }}>+</button>
                    </div>
                  ) : (
                    <button onClick={() => agregar(item)} style={{
                      width: '100%', padding: '8px', background: '#4f46e5',
                      color: 'white', border: 'none', borderRadius: '8px',
                      fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                      🛒 Agregar
                    </button>
                  )
                )}

                {esVendedor && (
                  <button onClick={async () => {
                    if (confirm('¿Eliminar este producto?')) {
                      await fetch(`${API}/inventario/${id}`, {
                        method: 'DELETE',
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                      });
                      onUpdate();
                    }
                  }} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}>
                    🗑️ Dar de baja
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Carrito */}
        {tipo === 'productos' && (
          <div style={{
            background: '#111', border: '0.5px solid #1e293b',
            borderRadius: '12px', padding: '18px',
            position: 'sticky', top: '20px'
          }}>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛒 Tu carrito
              {totalItems > 0 && (
                <span style={{ background: '#4f46e5', color: 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '11px' }}>
                  {totalItems}
                </span>
              )}
            </p>

            {Object.keys(carrito).length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: '#374151', fontSize: '13px' }}>
                Agrega productos al carrito
              </p>
            ) : (
              <>
                {Object.entries(carrito).map(([id, qty]) => {
                  const item   = filtrados.find(i => String(i.ID ?? i.id) === id);
                  if (!item) return null;
                  const precio = Number(item.PRECIO ?? item.precio);
                  return (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #1e293b', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8', flex: 1, paddingRight: '8px' }}>{item.NOMBRE ?? item.nombre}</span>
                      <span style={{ color: '#475569', marginRight: '8px' }}>x{qty}</span>
                      <span style={{ color: '#fff', fontWeight: '500' }}>S/ {(precio * qty).toFixed(2)}</span>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: '500', fontSize: '14px' }}>
                  <span style={{ color: '#94a3b8' }}>Total</span>
                  <span style={{ color: '#4f46e5' }}>S/ {totalPrecio.toFixed(2)}</span>
                </div>

                <input
                  type="text"
                  placeholder="Tu nombre (requerido)"
                  value={nombreCliente}
                  onChange={e => setNombreCliente(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 10px', marginTop: '12px', marginBottom: '8px',
                    background: '#0a0a0a', border: '0.5px solid #1e293b',
                    borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box'
                  }}
                />

                <button onClick={confirmarCompra} disabled={cargando} style={{
                  width: '100%', padding: '10px', background: cargando ? '#065F46' : '#10b981',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: '500', cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                  {cargando ? '⏳ Procesando...' : '✅ Confirmar pedido'}
                </button>

                <button onClick={() => setCarrito({})} style={{
                  width: '100%', marginTop: '6px', background: 'none',
                  border: 'none', color: '#374151', cursor: 'pointer', fontSize: '12px'
                }}>
                  Vaciar carrito
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}