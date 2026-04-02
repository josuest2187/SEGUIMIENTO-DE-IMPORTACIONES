# 📊 Guía de Sincronización Excel - LUFUSSA

## ✅ Implementación Completa

### 🎯 ¿Qué se implementó?

Se ha integrado un **sistema híbrido** que combina lo mejor de SQLite y Excel:

- **Base de datos SQLite** como fuente principal (más rápida y eficiente)
- **Sincronización automática** desde el archivo `importaciones.xlsx`
- **Botones en el Dashboard** para sincronizar con un clic

---

## 🚀 Cómo Usar

### Opción 1: Sincronizar desde importaciones.xlsx (Recomendado)

1. Asegúrate que tu archivo `importaciones.xlsx` está en la raíz del proyecto
2. Accede a la aplicación en http://localhost:3000
3. Inicia sesión con las credenciales:
   - Email: `admin@lufussa.com`
   - Password: `admin123`
4. Ve a la sección **"Pedidos"** desde el menú
5. Haz clic en el botón **"Sincronizar importaciones.xlsx"** (color teal)
6. ¡Listo! Los 1,661 pedidos se cargarán automáticamente

### Opción 2: Cargar otro archivo Excel

1. En la sección de Pedidos o Envíos
2. Haz clic en **"Cargar otro Excel"** (color gris)
3. Selecciona cualquier archivo Excel desde tu computadora
4. El sistema detectará automáticamente si son Pedidos o Envíos

---

## 📁 Estructura de Datos

### Archivo Excel (importaciones.xlsx)

**Columnas principales:**
- Pedido
- Proveedor
- Modelo
- Material
- Num. de Material
- Cantidad
- Moneda
- Precio neto
- Valor neto de pedido
- Estado
- Factura
- ETD (Fecha de Salida)
- ETA (Fecha de Llegada)
- Tipo Transporte
- Prioridad
- Puerto Origen/Destino
- AWB/BL
- Agente Aduanal
- Observaciones

### Base de Datos SQLite (lufussa.db)

Los datos se almacenan en:
- Tabla: `orders`
- Formato: JSON serializado
- Actualización: UPSERT (inserta o actualiza)

---

## 🔄 Flujo de Trabajo Recomendado

```
1. Actualiza importaciones.xlsx con nuevos pedidos
2. Haz clic en "Sincronizar importaciones.xlsx"
3. Los datos se actualizan en SQLite automáticamente
4. Continúa trabajando en el sistema normalmente
5. Los cambios persisten en la base de datos
```

---

## 💡 Ventajas de esta Implementación

✅ **Rendimiento**: SQLite es mucho más rápido para consultas y filtros  
✅ **Persistencia**: Los datos se guardan permanentemente  
✅ **Flexibilidad**: Puedes editar el Excel externamente y re-sincronizar  
✅ **No duplica**: Los registros se actualizan si ya existen  
✅ **Multi-formato**: Acepta diferentes formatos de columnas Excel  
✅ **Conversión automática**: Fechas y monedas se formatean correctamente  

---

## 🛠️ Mantenimiento

### Agregar más pedidos

1. **Método 1 - Excel**: Agrega nuevas filas a `importaciones.xlsx` y sincroniza
2. **Método 2 - Manual**: Usa el botón "Nuevo Pedido" en la interfaz
3. **Método 3 - API**: POST a `/api/orders` con los datos

### Respaldo de datos

Los datos se guardan automáticamente en:
- `lufussa.db` (SQLite)
- Puedes exportar a Excel desde la sección "Reportes"
- Usa Ctrl+S para crear respaldos manuales

### Resetear datos

Si necesitas borrar todo y empezar de nuevo:
```bash
rm lufussa.db
npm run dev
# Luego sincroniza de nuevo desde Excel
```

---

## 📊 Estadísticas Actuales

**Pedidos sincronizados**: 1,661 registros  
**Proveedores únicos**: ~50+  
**Base de datos**: lufussa.db (SQLite)  
**Tamaño aprox**: ~2-3 MB  

---

## 🐛 Solución de Problemas

### "Archivo no encontrado"
- Verifica que `importaciones.xlsx` esté en la raíz del proyecto
- El nombre debe ser exactamente: `importaciones.xlsx`

### "Error al sincronizar"
- Revisa que el Excel tenga las columnas correctas
- Asegúrate que no esté abierto en otro programa

### No se cargan los datos
- Refresca la página (F5)
- Revisa la consola del navegador (F12)
- Verifica que el servidor esté corriendo

---

## 📞 Contacto

Para soporte adicional, contacta al administrador del sistema.

**Desarrollado para**: LUFUSSA - Luz y Fuerza San Lorenzo S.A  
**Versión**: 1.0.0  
**Fecha**: Marzo 2026
