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
            name="correo_cliente"
            type="email"
            placeholder="Correo del Cliente"
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
              <th>Progreso (%)</th>
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
              reparaciones.map(rep => (
                <tr key={rep.id ?? rep.ID}>
                  <td>
                    <strong>{rep.equipo ?? rep.EQUIPO}</strong><br />
                    <small style={{ color: 'var(--text-gray)' }}>
                      Cliente: {rep.cliente ?? rep.CLIENTE} (Orden #{rep.id ?? rep.ID})
                    </small>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={rep.progreso ?? rep.PROGRESO}
                      className="input-field"
                      style={{ width: '60px', textAlign: 'center', background: '#000' }}
                      onBlur={async (e) => {
                        const id = rep.id ?? rep.ID;
                        const val = Number(e.target.value);
                        await fetch(`${API}/reparaciones/${id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            progreso: val,
                            estado: val === 100 ? 'Listo para entrega' : 'En Reparación'
                          })
                        });
                        onUpdate();
                      }}
                    /> %
                  </td>
                  <td>
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
              ))
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