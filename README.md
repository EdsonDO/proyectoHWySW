# SIGAI · Sistema Integral de Gestión de Activos Informáticos

Plataforma web institucional para la administración de inventario de hardware y software, mantenimiento preventivo/predictivo/correctivo, órdenes de trabajo, historial de repotenciación, planificación, evaluación de ciclo de vida y reportes ejecutivos.

## Arquitectura del proyecto

El sistema sigue principios **SOLID** y **KISS** con módulos nativos ES6 sin dependencias externas de compilación:

```text
├── index.html
├── vercel.json
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── core/           Utilidades base (configuración, fechas locales, sanitización, router, bus de eventos, validadores)
    ├── data/           Catálogos y conjunto de datos institucionales base
    ├── repositories/   Adaptadores de almacenamiento y repositorio genérico de colecciones
    ├── services/       Capa de servicios transaccionales, sesiones, auditoría, evaluación y reportes
    ├── ui/             Componentes reutilizables, gráficos, modales, iconos y notificaciones
    ├── styles/         Sistema de diseño modular (tokens, base, layout, componentes, vistas e impresión)
    └── modules/        13 módulos funcionales + autenticación institucional
```

## Módulos incluidos

1. **Dashboard**: KPIs operativos, gráficos dinámicos, alertas activas y actividad reciente.
2. **Inventario de hardware**: Registro, edición, búsqueda, filtros multicriterio y baja patrimonial.
3. **Inventario de software**: Control de programas instalados, parches, detección de software no autorizado y gestión de licencias.
4. **Fichas técnicas**: Expediente integral por equipo en 7 pestañas con formato optimizado para impresión.
5. **Mantenimiento de hardware**: Registro de intervenciones con niveles y checklist preventivo.
6. **Mantenimiento de software**: Intervenciones, checklist y tablero de seguimiento predictivo.
7. **Órdenes de trabajo**: Flujo de tickets (`Pendiente → Asignada → En proceso → Resuelta → Cerrada`) con bitácora.
8. **Historial técnico y repotenciación**: Registro acumulativo de cambios de RAM/almacenamiento y línea de tiempo unificada.
9. **Planificación**: Calendario mensual interactivo con control de conflictos de agenda por técnico.
10. **Evaluación y repotenciación**: Motor de reglas para diagnóstico de ciclo de vida y recomendaciones priorizadas.
11. **Reportes institucionales**: 15 reportes filtrables con exportación a Excel (CSV UTF-8) e impresión PDF.
12. **Áreas y asignaciones**: Distribución por área institucional y trazabilidad de traslados.
13. **Configuración y administración**: Estado de colecciones, exportación/restauración de respaldos JSON y bitácora de auditoría.

## Ejecución local

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Despliegue en Vercel

El proyecto incluye `vercel.json` configurado con rutas limpias, cabeceras de seguridad y reescritura SPA. Basta con importar el repositorio en Vercel sin configuración adicional de build.
