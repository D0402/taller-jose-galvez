import React from 'react';

export default function Gestion({ reparaciones, API, onUpdate }) {
  return (
    <div className="gestion-container">

      {/* 1. FORMULARIO: REGISTRAR REPARACIÓN */}
      <div className="form-container">
        <h3>➕ Nuevo Ingreso Técnico (Orden de Trabajo)</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          await fetch(`${API}/reparaciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, progreso: 0, estado: 'Recibido' })
          });
          onUpdate();
          e.target.reset();
        }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            name="cliente"
            type="text"
            placeholder="Nombre del Cliente"
            className="input-field"
            style={{ flex: 1 }}
            required
          />
          <input name="equipo" placeholder="Equipo (Ej: Laptop Asus)" className="input-field" style={{ flex: 1 }} required />
          <input name="falla" placeholder="Falla reportada" className="input-field" style={{ flex: 1 }} required />
          <button type="submit" className="btn-save" style={{ padding: '0 25px' }}>Guardar Equipo</button>
        </form>
      </div>


      {/* 2. TABLA DE CONTROL DE PROGRESO */}
<div className="form-container">
  <h3 style={{ color: 'var(--blue-primary)' }}>🛠️ Control de Taller (Equipos en Reparación)</h3>
  <table className="admin-table">
    <thead>
      <tr>
        <th>Equipo / Cliente</th>
        <th>Etapas de Reparación</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {reparaciones.length === 0 ? (
        <tr>
          <td colSpan="3" style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No hay órdenes de servicio activas.
          </td>
        </tr>
      ) : (
        reparaciones.map(rep => {
          const progreso = Number(rep.progreso ?? rep.PROGRESO ?? 0);
          const id = rep.id ?? rep.ID;
        
          const etapas = [
            { label: 'Análisis y diagnóstico', valor: 25 },
            { label: 'Desmantelación', valor: 50 },
            { label: 'Cambio del accesorio dañado', valor: 75 },
            { label: 'Ensamblaje y probado', valor: 100 },
          ];
        
          const actualizarProgreso = async (nuevoProgreso) => {
            await fetch(`${API}/reparaciones/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                progreso: nuevoProgreso,
                estado: nuevoProgreso === 100 ? 'Listo para entrega' : nuevoProgreso === 0 ? 'Recibido' : 'En Reparación'
              })
            });
            onUpdate();
          };
        
          const handleCheck = async (valorEtapa, checked) => {
            if (checked) {
              await actualizarProgreso(valorEtapa);
            } else {
              const etapaAnterior = etapas.find(e => e.valor === valorEtapa);
              const indexActual = etapas.indexOf(etapaAnterior);
              const nuevoProgreso = indexActual === 0 ? 0 : etapas[indexActual - 1].valor;
              await actualizarProgreso(nuevoProgreso);
            }
          };
        
          return (
            <tr key={id} style={{ borderBottom: '2px solid #1e293b' }}>
              <td style={{ paddingTop: '16px', paddingBottom: '16px', verticalAlign: 'top' }}>
                <strong>{rep.equipo ?? rep.EQUIPO}</strong><br />
                <small style={{ color: 'var(--text-gray)' }}>
                  Cliente: {rep.cliente ?? rep.CLIENTE} (Orden #{id})
                </small>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    <span>Progreso</span>
                    <span>{progreso}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progreso}%`, height: '100%', borderRadius: '10px',
                      background: progreso === 100 ? '#22c55e' : progreso >= 50 ? '#3b82f6' : '#f59e0b',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </td>
        
              <td style={{ paddingTop: '16px', paddingBottom: '16px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {etapas.map((etapa, index) => {
                    const completada = progreso >= etapa.valor;
                    const habilitada = index === 0 || progreso >= etapas[index - 1].valor;
                    return (
                      <label key={etapa.valor} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: habilitada ? 'pointer' : 'not-allowed',
                        opacity: habilitada ? 1 : 0.4
                      }}>
                        <input
                          type="checkbox"
                          checked={completada}
                          disabled={!habilitada}
                          onChange={e => handleCheck(etapa.valor, e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: habilitada ? 'pointer' : 'not-allowed' }}
                        />
                        <span style={{
                          fontSize: '13px',
                          color: completada ? '#22c55e' : '#94a3b8',
                          textDecoration: completada ? 'line-through' : 'none',
                          fontWeight: completada ? '500' : '400'
                        }}>
                          {completada ? '✓ ' : ''}{etapa.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </td>
        
              <td style={{ paddingTop: '16px', paddingBottom: '16px', verticalAlign: 'top' }}>
                <button
                  onClick={async () => {
                    const id = rep.id ?? rep.ID;
                    if (confirm('¿Seguro que deseas eliminar esta orden de servicio?')) {
                      await fetch(`${API}/reparaciones/${id}`, { method: 'DELETE' });
                      onUpdate();
                    }
                  }}
                  style={{ background: 'transparent', color: 'var(--red-danger)', border: '1px solid var(--red-danger)', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

      {/* 3. FORMULARIO: REGISTRAR NUEVO ITEM EN INVENTARIO */}
      <div className="form-container" style={{ borderTop: '2px dashed #333', marginTop: '40px', paddingTop: '30px' }}>
        <h3>📦 Registrar Ítem en Inventario (Repuestos o Venta Directa)</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target));
          await fetch(`${API}/inventario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          onUpdate();
          e.target.reset();
        }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input name="nombre" placeholder="Nombre del Producto/Repuesto" className="input-field" style={{ flex: 2, minWidth: '200px' }} required />

          <select name="categoria" className="input-field" style={{ flex: 1, minWidth: '150px' }} required>
            <option value="Repuesto">🔧 Repuesto Técnico</option>
            <option value="Hardware">💻 Hardware / Componentes</option>
            <option value="Software">💿 Software / Licencias</option>
            <option value="Periferico">🖱️ Periféricos / Accesorios</option>
          </select>

          <input name="stock" type="number" placeholder="Stock inicial" className="input-field" style={{ flex: 1, minWidth: '100px' }} required />
          <input name="precio" type="number" step="0.01" placeholder="Precio S/" className="input-field" style={{ flex: 1, minWidth: '100px' }} required />
          <input name="descripcion" placeholder="Descripción corta (Opcional)" className="input-field" style={{ flex: 2, minWidth: '200px' }} />

          <button type="submit" className="btn-save" style={{ background: '#22c55e', padding: '0 25px', width: '100%', marginTop: '5px' }}>
            ➕ Añadir al Inventario General
          </button>
        </form>
      </div>

    </div>
  );
}