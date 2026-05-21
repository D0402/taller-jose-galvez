import React from 'react';

export default function Navbar({ view, setView }) {
  
  // Función para determinar si el botón está activo
  const isActive = (currentView) => view === currentView ? 'nav-button active' : 'nav-button';

  return (
    <nav className="navbar">
      <button 
        className={isActive('progreso')} 
        onClick={() => setView('progreso')}
      >
        📉 Ver Progreso
      </button>
      
      <button 
        className={isActive('gestion')} 
        onClick={() => setView('gestion')}
      >
        ⚙️ Gestión (Admin)
      </button>
      
      <button 
        className={isActive('repuestos')} 
        onClick={() => setView('repuestos')}
      >
        🔧 Repuestos
      </button>
      
      <button 
        className={isActive('productos')} 
        onClick={() => setView('productos')}
      >
        💻 Productos
      </button>
    </nav>
  );
}