<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sistema de Seguimiento de Importaciones LUFUSSA

Sistema integral de gestión logística para Luz y Fuerza San Lorenzo S.A con capacidades de IA.

## 🌟 Características

- 📦 **Gestión de Pedidos**: Control completo de órdenes de compra
- 🚢 **Seguimiento de Envíos**: Monitoreo en tiempo real de embarques
- 📊 **Dashboard Analítico**: KPIs y métricas visuales
- 🤖 **Asistente de IA**: Chatbot inteligente para consultas logísticas
- ✨ **Insights de IA**: Análisis predictivo y recomendaciones
- 📈 **Reportes Ejecutivos**: Exportación a PDF y Excel
- 🔄 **Sincronización Excel**: Importación masiva desde archivos xlsx
- 📱 **PWA**: Funciona como app instalable

## 🚀 Inicio Rápido

**Prerrequisitos**: Node.js 18+

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno** (opcional para IA):
   - Copia `.env.example` a `.env.local`
   - Agrega tu `GEMINI_API_KEY` (obtener en [AI Studio](https://aistudio.google.com/app/apikey))

3. **Ejecutar el servidor**:
   ```bash
   npm run dev
   ```

4. **Acceder**: http://localhost:3000

## 👤 Credenciales de Acceso

**Administrador Principal**:
- Email: `admin@lufussa.com`
- Password: `admin123`

## 📚 Documentación

- [📊 Guía de Sincronización Excel](GUIA_SINCRONIZACION.md) - Cómo importar datos desde Excel
- [🤖 Guía de Configuración de IA](GUIA_IA.md) - Configurar Asistente y Perspectivas de IA

## 🔧 Tecnologías

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Express.js + SQLite
- **IA**: Google Gemini 2.0
- **Build**: Vite
- **UI**: Motion (Framer Motion fork)

## 📦 Sincronización de Datos

El sistema incluye sincronización automática con el archivo `importaciones.xlsx`:

```bash
# Desde la interfaz web:
1. Ve a la sección "Pedidos"
2. Haz clic en "Sincronizar importaciones.xlsx"
3. ¡Listo! Los datos se cargan automáticamente
```

Ver [Guía Completa de Sincronización](GUIA_SINCRONIZACION.md) para más detalles.

## 🤖 Funcionalidades de IA

### Asistente Logístico
Chatbot interactivo que responde preguntas sobre pedidos, envíos y proveedores.

### Perspectivas de IA
Análisis automático que identifica:
- 🔵 Oportunidades de optimización
- 🔴 Riesgos potenciales
- 💰 Ahorros en costos

**Configuración**: Ver [Guía de IA](GUIA_IA.md)

## 📂 Estructura del Proyecto

```
lufussa-import-tracking/
├── src/
│   ├── components/        # Componentes React
│   ├── services/          # Servicios de exportación
│   ├── lib/              # Utilidades
│   └── types.ts          # Definiciones TypeScript
├── server.ts             # Servidor Express + SQLite
├── importaciones.xlsx    # Datos de origen
├── lufussa.db           # Base de datos SQLite
└── .env.local           # Configuración (crear manualmente)
```

## 🛠️ Comandos Disponibles

```bash
npm run dev      # Ejecutar servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Verificar errores TypeScript
```

## 🔐 Seguridad

- ✅ Autenticación de usuarios
- ✅ API key protegida en backend
- ✅ Validación de datos
- ✅ Sesiones persistentes

## 📊 Estado del Sistema

- **Total de pedidos**: 1,661+ registros sincronizados
- **Base de datos**: SQLite con transacciones ACID
- **Rendimiento**: Optimizado para miles de registros

## 🐛 Solución de Problemas

### El servidor no inicia
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Las funciones de IA no funcionan
- Verifica que `GEMINI_API_KEY` esté configurada en `.env.local`
- Reinicia el servidor después de agregar la clave
- Ver [Guía de IA](GUIA_IA.md) para más detalles

### Error al sincronizar Excel
- Asegúrate que `importaciones.xlsx` esté en la raíz del proyecto
- Verifica que el archivo no esté abierto en otro programa
- Revisa que tenga las columnas requeridas

## 📝 Notas Importantes

- El sistema funciona **sin API key de IA** (funciones básicas)
- Los datos se guardan en `lufussa.db` (SQLite)
- Puedes exportar/importar datos vía Excel en cualquier momento

## 📞 Soporte

Desarrollado para: **LUFUSSA - Luz y Fuerza San Lorenzo S.A**  
Versión: **1.0.0**  
Fecha: **Marzo 2026**

---

View your app in AI Studio: https://ai.studio/apps/36928d18-6853-4fa6-8351-7e5968d9ae7f
