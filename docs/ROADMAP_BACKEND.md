# Roadmap General: Evolución RestaurantPro

Este documento detalla el plan estratégico para evolucionar la aplicación hacia un sistema profesional de gestión comercial e industrial, diseñado para correr localmente con capacidades avanzadas.

## 🎯 Objetivo Final
Un sistema robusto y autónomo que no solo gestione ventas, sino que centralice la inteligencia del negocio (inventarios, costos, clientes) en una infraestructura local confiable.

---

## 🗺️ Fases de Implementación Técnica

### Fase 1: Pulido de Interfaz y Lógica (Estado Actual)
- [x] Unificar todos los botones de "Volver al panel".
- [x] Implementar el control de Escalado Global Maestro.
- [x] Estandarización de componentes industriales (Toggles cuadrados, CustomSelects).
- [ ] Implementar transiciones suaves entre paneles para mejorar la fluidez.
- [ ] Refactorizar la lógica de persistencia (`localStorage`) para llamadas a API.

### Fase 2: El Servidor Local y Electron
- [ ] Configurar **Electron.js** para empaquetar la aplicación como un `.exe`.
- [ ] Implementar la **Impresión Silenciosa** para tickets y comandas.
- [ ] Crear un servidor local Node.js para multi-dispositivo.

### Fase 3: Base de Datos Centralizada
- [ ] Diseñar esquema SQL (Usuarios, Menú, Pedidos, Turnos).
- [ ] Migración de datos de `localStorage` a SQLite/PostgreSQL.
- [ ] Sincronización en tiempo real vía WebSockets.

---

## 🚀 Módulos de Gestión de Negocio (Próximamente)

### 1. Control de Insumos y Recetas (Inventario)
- [ ] **Descuento por Ingredientes**: Rebaja automática de insumos base por cada producto vendido.
- [ ] **Alertas de Stock Crítico**: Notificaciones visuales cuando un insumo base esté por agotarse.

### 2. Reportes Ejecutivos y Exportación
- [ ] **Exportación Profesional**: Generación de reportes en PDF/Excel para contabilidad e impuestos.
- [ ] **Análisis de Rendimiento**: Comparativas de ventas mensuales y anuales integradas.

### 3. CRM y Fidelización de Clientes
- [ ] **Base de Datos VIP**: Registro de clientes, preferencias y fechas especiales.
- [ ] **Programa de Lealtad**: Motor de puntos por compra canjeables por premios.

### 4. Operación Visual Avanzada
- [ ] **Mapa de Mesas Dinámico**: Visualización de áreas del local y estado de ocupación en tiempo real.
- [ ] **KDS (Kitchen Display System)**: Pantalla de producción para cocina con tiempos de preparación.

### 5. Control de Gastos y Rentabilidad
- [ ] **Módulo de Egresos**: Registro de pagos a proveedores, servicios y nómina.
- [ ] **Cálculo de Utilidad Neta**: Balance real entre ingresos y egresos operativos.

---

## 📝 Notas de Diseño Críticas
- **Industrial Look**: Mantener la estética densa y técnica para entornos de alta fatiga visual.
- **Resiliencia Local**: El sistema debe funcionar incluso si el servidor pierde conexión a internet.

---

*Última actualización: 2026-02-24*

