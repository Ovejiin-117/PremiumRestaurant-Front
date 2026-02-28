# Plan de Implementación: Control de Insumos y Recetas (Inventario Derivado)

Este plan detalla la arquitectura y los pasos técnicos para implementar un sistema de inventario basado en insumos técnicos y recetas vinculadas a productos.

---

## 1. 🏗️ Arquitectura de Datos (Modelado)

### Nuevas Entidades en `types.ts`

1.  **`SupplyItem` (Insumo Base)**:
    *   `id`: string
    *   `name`: string (ej: "Carne de Res", "Pan Brioche", "Refresco Cola")
    *   `currentStock`: number (cantidad actual en bodega)
    *   `unit`: 'gr' | 'ml' | 'unit' | 'kg' | 'lt'
    *   `minStock`: number (umbral para alertas de reabastecimiento)
    *   `category`: string (ej: "Carnes", "Abarrotes")

2.  **`RecipeComponent` (Ingrediente)**:
    *   `supplyId`: string (ID del insumo vinculado)
    *   `quantity`: number (cantidad necesaria para 1 unidad del producto)

3.  **Actualización a `MenuItem`**:
    *   Añadir `recipe?: RecipeComponent[]`

---

## 2. 🖥️ Desarrollo de Componentes (UI/UX)

### A. Gestión de Bodega (`SupplyManagement.tsx`)
*   Nueva pantalla bajo el rol de **Manager/Developer**.
*   **Funcionalidades**:
    *   CRUD de insumos (Nombre, Unidad, Stock Inicial, Alerta Mínima).
    *   Lista visual con indicadores de estado:
        *   🟢 **Normal**: Stock > 20% sobre el mínimo.
        *   🟡 **Bajo**: Stock cercano al mínimo.
        *   🔴 **Crítico**: Stock igual o menor al mínimo (Alertas).

### B. Editor de Recetas (Integrado en `MenuEditor.tsx`)
*   Al editar un producto, añadir una pestaña o sección "Receta/Ingredientes".
*   Buscador de insumos para añadir a la receta.
*   Selector de cantidad según la unidad del insumo.

---

## 3. ⚙️ Lógica de Negocio (Backend/Procesamiento)

### A. Motor de Descuento en Cascada
*   Modificar la función de finalización de orden (en `useMenuEditor` o `App.tsx`).
*   **Algoritmo**:
    1.  Al cerrar una cuenta, iterar sobre cada `OrderItem`.
    2.  Buscar si el `MenuItem` tiene una `recipe` definida.
    3.  Si existe, iterar sobre sus componentes y restar `quantity * orderItem.quantity` del `currentStock` del insumo correspondiente.
    4.  Registrar la acción en el `AuditLog`.

### B. Sistema de Alertas Proactivas
*   Hook global que monitoree los niveles de `SupplyItem`.
*   Mostrar una burbuja de notificación en el Dashboard si hay insumos en rojo.

---

## 🗺️ Fases de Implementación

### Fase 1: Estructura y Bodega (2 Días)
- [ ] Crear interfaces en `types.ts`.
- [ ] Implementar `SupplyManagement.tsx` básico con persistencia en `localStorage`.
- [ ] Crear el `AuditAction` para movimientos de inventario.

### Fase 2: Vinculación de Recetas (2 Días)
- [ ] Actualizar el modal de edición de productos para soportar recetas.
- [ ] Implementar lógica de validación (no se puede añadir un insumo inexistente).

### Fase 3: Automatización y Alertas (1 Día)
- [ ] Inyectar el motor de descuento en la lógica de `handleFinalizeOrder`.
- [ ] Desarrollar el widget de alertas de stock crítico para el Dashboard.
- [ ] Pruebas de estrés: Verificar qué pasa si el stock llega a 0 (¿impedir venta o solo alertar?).

---

## 📝 Notas de Diseño Industrial
*   **Unidades de Medida**: El sistema debe manejar conversiones automáticas simples (ej: compras 1kg, usas 150gr).
*   **Seguridad**: El ajuste manual de stock de insumos debe requerir contraseña de Manager.
