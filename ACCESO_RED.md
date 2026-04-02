# 🌐 Guía de Acceso desde Otros Equipos en la Red

## 📋 Configuración Completada

✅ El servidor ya está configurado para aceptar conexiones desde otros equipos en la red local.

## 🚀 Cómo Acceder

### Desde el Equipo Principal (donde corre el servidor)

```
http://localhost:3000
```

### Desde Otros Equipos en la Misma Red

1. **Inicia el servidor** en el equipo principal:
   ```powershell
   npm run dev
   ```

2. **Busca la IP local** que aparece en la consola al iniciar. Ejemplo:
   ```
   🌐 Acceso desde Otros Equipos en la Red:
      http://192.168.1.100:
   ```

3. **En otro equipo** de la red, abre un navegador y escribe:
   ```
   http://[IP_DEL_SERVIDOR]:3000
   ```
   Ejemplo: `http://192.168.1.100:3000`

## 🔍 Cómo Encontrar la IP Manualmente

Si necesitas encontrar la IP del equipo servidor manualmente:

### Windows (PowerShell):
```powershell
ipconfig
```
Busca "Adaptador de LAN inalámbrica" o "Adaptador de Ethernet" y encuentra la línea:
```
Dirección IPv4: 192.168.x.x
```

### Windows (CMD):
```cmd
ipconfig | findstr IPv4
```

## ✅ Requisitos

- ✅ Ambos equipos deben estar en la **misma red WiFi o LAN**
- ✅ El **firewall de Windows** debe permitir el puerto 3000
- ✅ El servidor debe estar **corriendo** en el equipo principal
3000
## 🛡️ Configurar Firewall de Windows

Si no puedes acceder desde otros equipos, es probable que el firewall esté bloqueando el puerto:

### Método 1: Permitir Puerto 3000

1. Abre **Windows Defender Firewall**
2. Click en "Configuración avanzada"
3. Click en "Reglas de entrada" (izquierda)
4. Click en "Nueva regla..." (derecha)
5. Selecciona "Puerto" → Siguiente
6. TCP, puerto específico: **3000** → Siguiente
7. Permitir la conexión → Siguiente
8. Todas las opciones marcadas → Siguiente
9. Nombre: "LUFUSSA Sistema" → Finalizar

### Método 2: Permitir Node.js (Más fácil)

1. Abre **Windows Defender Firewall**
2. Click en "Permitir una aplicación..."
3. Click en "Cambiar la configuración"
4. Click en "Permitir otra aplicación..."
5. Busca `node.exe` (usualmente en `C:\Program Files\nodejs\node.exe`)
6. Agrega y marca "Privada" y "Pública"

### Comando PowerShell (Como Administrador):

```powershell
New-NetFirewallRule -DisplayName "LUFUSSA Sistema" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## 🧪 Probar la Conexión

Desde otro equipo en la red:

### 1. Ping al servidor
```cmd
ping 192.168.x.x
```
Debe responder correctamente.

### 2. Probar el puerto con telnet
```cmd
telnet 192.168.x.x 3000
```
Si se conecta, el servidor está accesible.

### 3. Usar navegador
Abre Chrome/Edge y ve a:
```
http://192.168.x.x:3000
```

## 📱 Acceso desde Celular

1. Conéctate a la **misma WiFi** que el servidor
2. Abre el navegador del celular
3. Escribe: `http://192.168.x.x:3000`
4. ¡Listo! Puedes usar el sistema desde el celular

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Este acceso solo funciona en la **red local (LAN)**. 

- ✅ **Seguro**: Dentro de tu oficina/casa
- ❌ **NO accesible**: Desde Internet externo
- 💡 **Recomendación**: Usa contraseñas fuertes

## 🌍 Acceso desde Internet (Opcional Avanzado)

Si necesitas acceso desde Internet externo:

1. **Port Forwarding** en el router (puerto 3000 → IP del servidor)
2. **IP Pública** del router (busca "cuál es mi IP")
3. **Dominio** (opcional, con servicios como No-IP o DuckDNS)
4. **SSL/HTTPS** (recomendado para seguridad)

⚠️ Esto requiere conocimientos avanzados de redes.

## ❓ Problemas Comunes

### "No se puede acceder al sitio"
- ✅ Verifica que ambos equipos estén en la misma red
- ✅ Verifica que el servidor esté corriendo
- ✅ Revisa el firewall de Windows

### "Conexión rechazada"
- ✅ Verifica que el puerto 3000 esté abierto en el firewall
- ✅ Asegúrate de usar la IP correcta

### "ERR_CONNECTION_TIMED_OUT"
- ✅ El firewall está bloqueando la conexión
- ✅ Sigue los pasos de configuración del firewall arriba

### La página carga pero dice "Error de red"
- ✅ El frontend carga pero no puede conectar con el backend
- ✅ Verifica que ambos puertos (5173 y 3000) estén abiertos

## 📞 Soporte

Si necesitas ayuda adicional, verifica:
1. Los mensajes en la consola al iniciar `npm run dev`
2. La IP que aparece en "Acceso desde Otros Equipos"
3. Que el firewall permita las conexiones

---

**Nota**: La configuración ya está completa. Solo necesitas iniciar el servidor y conectarte usando la IP que aparece en la consola.
