import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import Progreso from './components/Progreso';
import Gestion from './components/Gestion';
import Inventario from './components/Inventario';
import Pedidos from './components/Pedidos';
import Historial from './components/Historial';

const API = import.meta.env.VITE_API_URL || '/api'

export default function App() {
  const [sesion, setSesion] = useState(null);
  const [tab, setTab] = useState('progreso');
  const [reparaciones, setReparaciones] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [pedidosNuevos, setPedidosNuevos] = useState(0);
  const ultimoConteo = useRef(0);

  const cargarDatos = async () => {
    try {
      const headers = sesion?.token ? { Authorization: `Bearer ${sesion.token}` } : {};

      const resRep = await fetch(`${API}/reparaciones`, { headers });
      const todasRep = await resRep.json();

      if (sesion?.rol === 'cliente') {
        const suyas = todasRep.filter(r =>
          (r.cliente ?? r.CLIENTE ?? '').toLowerCase() === sesion.correo.toLowerCase()
        );
        setReparaciones(suyas);
      } else {
        setReparaciones(todasRep);
      }

      const resInv = await fetch(`${API}/inventario`, { headers });
      setInventario(await resInv.json());

      // Contar pedidos nuevos solo para admin
      if (sesion?.rol === 'admin') {
        const resVentas = await fetch(`${API}/ventas`, { headers });
        const dataVentas = await resVentas.json();
        const totalVentas = new Set(dataVentas.map(v => v.id)).size;
        if (totalVentas > ultimoConteo.current) {
          setPedidosNuevos(prev => prev + (totalVentas - ultimoConteo.current));
        }
        ultimoConteo.current = totalVentas;
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  useEffect(() => {
    const guardada = localStorage.getItem('sesion_jg');
    if (guardada) setSesion(JSON.parse(guardada));
  }, []);

  useEffect(() => {
    if (sesion) cargarDatos();
  }, [sesion]);

  const handleLogin = (data) => {
    setSesion(data);
    localStorage.setItem('sesion_jg', JSON.stringify(data));
    setTab(data.rol === 'admin' ? 'gestion' : 'progreso');
  };

  const handleLogout = () => {
    setSesion(null);
    localStorage.removeItem('sesion_jg');
    setTab('progreso');
    setPedidosNuevos(0);
    ultimoConteo.current = 0;
  };

  if (!sesion) return <Login onLogin={handleLogin} />;

  const esAdmin = sesion.rol === 'admin';

  const navBtn = (tabName, label) => (
    <button onClick={() => setTab(tabName)} style={{
      background: tab === tabName ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
      border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px',
      fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
      fontWeight: tab === tabName ? '500' : '400'
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{ background: '#4f46e5', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '18px'
            }}>🔧</div>
            <div>
              <p style={{ color: 'white', fontWeight: '500', fontSize: '15px', margin: 0 }}>Servicio Técnico</p>
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>José Gálvez</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              👤 {sesion.correo}
            </span>
            <button onClick={handleLogout} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'white', padding: '6px 14px', borderRadius: '8px',
              fontSize: '12px', cursor: 'pointer'
            }}>
              ↪ Salir
            </button>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {navBtn('progreso', '📋 Mis reparaciones')}
          {navBtn('productos', '📦 Catálogo')}
          {esAdmin && navBtn('gestion', '⚙️ Gestión')}
          {esAdmin && navBtn('repuestos', '🔧 Repuestos')}
          {esAdmin && (
            <button onClick={() => { setTab('pedidos'); setPedidosNuevos(0); }} style={{
              background: tab === 'pedidos' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontWeight: tab === 'pedidos' ? '500' : '400'
            }}>
              🛒 Pedidos
              {pedidosNuevos > 0 && (
                <span style={{
                  background: '#ef4444', color: 'white',
                  borderRadius: '10px', padding: '1px 7px',
                  fontSize: '11px', fontWeight: '600'
                }}>
                  {pedidosNuevos}
                </span>
              )}
            </button>
          )}
          {esAdmin && navBtn('historial', '📊 Historial')}
        </nav>
      </header>

      <main style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {tab === 'progreso' && <Progreso reparaciones={reparaciones} sesion={sesion} />}
        {tab === 'productos' && (
          <Inventario items={inventario} tipo="productos" API={API} onUpdate={cargarDatos} esVendedor={esAdmin} token={sesion.token} />
        )}
        {tab === 'gestion' && esAdmin && (
          <Gestion reparaciones={reparaciones} API={API} onUpdate={cargarDatos} />
        )}
        {tab === 'repuestos' && esAdmin && (
          <Inventario items={inventario} tipo="repuestos" API={API} onUpdate={cargarDatos} esVendedor={esAdmin} token={sesion.token} />
        )}
        {tab === 'pedidos' && esAdmin && (
          <Pedidos API={API} token={sesion.token} />
        )}
        {tab === 'historial' && <Historial API={API} />}
      </main>
    </div>
  );
}