# Decisiones de Arquitectura: RestaurantPro

Este documento registra las decisiones estratégicas tomadas para definir el funcionamiento técnico y la implementación del sistema.

## 1. Clasificación del Software
**RestaurantPro** es una **Web App (Aplicación Web)** de alto rendimiento, estructurada como una **SPA (Single Page Application)** utilizando React. 

## 2. Modelo de Despliegue: Híbrido Local
Se ha decidido evitar el hosting en la nube para garantizar la privacidad de los datos, rapidez de respuesta y eliminar costos mensuales.

### Nodo Maestro (Computadora de Caja)
- **Rol**: Actúa como el Servidor Central del local.
- **Tecnología**: Correrá una instancia de la Web App empaquetada con **Electron.js**.
- **Ventajas**: 
    - Se comporta como un programa de escritorio (.exe).
    - Permite **Impresión Silenciosa** (imprime tickets instantáneamente en impresoras térmicas sin confirmación del navegador).
    - Aloja la Base de Datos Central.

### Nodos Secundarios (Meseros, Cocina, Tablets)
- **Rol**: Clientes de consulta y toma de pedidos.
- **Tecnología**: Acceso mediante **Navegador Web** (Chrome/Safari) o App ligera.
- **Conectividad**: Se conectan al Nodo Maestro a través de la Red Local (Wi-Fi/LAN) del negocio. **No requieren internet para operar.**

## 3. Estrategia de Persistencia de Datos
- **Fase Actual**: Uso de `localStorage` para prototipado rápido.
- **Objetivo**: Implementar un **Servidor de Datos Centralizado** en el local.
- **Flujo**: Lo que se venda en cualquier dispositivo se registra en la base de datos de la computadora principal, permitiendo sincronización en tiempo real entre Caja y Meseros.

## 4. Experiencia de Usuario (UI/UX)
- **Navegación**: Se mantiene como SPA (cambios de sección instantáneos sin recarga de página).
- **Escalado Global**: Control maestro de tamaño de fuente (100%, 90%, 80%) aplicado desde la raíz del sistema para adaptarse a diferentes monitores.
- **Consistencia Visual**: Uso de terminología estándar como "Volver al panel" en toda la interfaz.

## 5. Beneficios Técnicos del Enfoque Elegido
- **Autonomía**: El negocio no se detiene si se cae el internet.
- **Privacidad**: Los datos de ventas y clientes nunca salen del local físico.
- **Rendimiento**: Velocidad de red local para una experiencia de usuario extremadamente fluida.
- **Escalabilidad**: Facilidad para añadir nuevas tablets o computadoras simplemente conectándolas al Wi-Fi.

---
*Fecha de última actualización: 2026-02-20*
