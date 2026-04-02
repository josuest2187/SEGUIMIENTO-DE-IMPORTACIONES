# 🤖 Guía de Configuración de IA - LUFUSSA

## 📝 Descripción General

El sistema LUFUSSA incluye dos funcionalidades de Inteligencia Artificial impulsadas por Google Gemini:

1. **🤖 Asistente Logístico**: Chatbot interactivo que responde preguntas sobre tus pedidos y envíos
2. **✨ Perspectivas de IA Logística**: Análisis automático que genera insights y recomendaciones

---

## ⚙️ Configuración Inicial

### Paso 1: Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en **"Create API Key"** o **"Crear clave de API"**
4. Copia la clave generada (comienza con `AIza...`)

### Paso 2: Configurar en el Sistema

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Pega tu API key después de `GEMINI_API_KEY=`
3. Debería verse así:

```env
# Configuración de Gemini AI (Opcional)
GEMINI_API_KEY=AIzaSyC_TU_API_KEY_AQUI

PORT=3000
NODE_ENV=development
```

4. Guarda el archivo
5. Reinicia el servidor:
   ```bash
   npm run dev
   ```

---

## 🚀 Uso de las Funcionalidades

### 🤖 Asistente Logístico

**Ubicación**: Botón flotante en la esquina inferior derecha

**Qué puede hacer:**
- Buscar información de pedidos específicos
- Consultar estado de envíos
- Calcular valores totales
- Dar recomendaciones basadas en datos
- Responder preguntas sobre proveedores

**Ejemplos de preguntas:**
```
- ¿Cuántos pedidos tengo pendientes?
- Muéstrame información del pedido 4800008726
- ¿Cuál es el proveedor con más pedidos?
- ¿Qué envíos están retrasados?
- Dame un resumen de las importaciones de este mes
```

**Características especiales:**
- Respuestas en español
- Links clickeables a pedidos/envíos mencionados
- Historial de conversación
- Minimizable para no interrumpir tu trabajo

---

### ✨ Perspectivas de IA Logística

**Ubicación**: Sección en el Dashboard principal

**Qué hace:**
- Analiza automáticamente tus datos logísticos
- Identifica riesgos potenciales
- Sugiere optimizaciones
- Detecta oportunidades de ahorro

**Tipos de Insights:**
1. **🔵 Optimización**: Mejoras en procesos o eficiencia
2. **🔴 Riesgo**: Alertas sobre problemas potenciales
3. **💰 Costo**: Análisis de gastos y oportunidades de ahorro

**Cómo usar:**
1. Ve al Dashboard principal
2. Busca la sección "PERSPECTIVAS DE IA LOGÍSTICA"
3. Haz clic en **"Generar Insights"**
4. Espera unos segundos mientras Gemini analiza
5. Revisa las recomendaciones generadas

---

## 🔒 Seguridad

✅ **Tu API key está protegida**:
- Solo se usa en el servidor backend
- Nunca se expone al navegador
- Las llamadas se realizan de forma segura

✅ **Tus datos son privados**:
- Los datos se envían temporalmente a Gemini solo durante las consultas
- No se almacenan en servidores externos
- Solo se usan para generar respuestas

---

## ❓ Solución de Problemas

### "Servicio de IA no disponible"

**Problema**: No configuraste la API key o está vacía

**Solución**:
1. Verifica que `.env.local` tenga la API key
2. Asegúrate que no haya espacios extras
3. Reinicia el servidor (`npm run dev`)

### "Error al procesar la consulta"

**Posibles causas**:
- API key inválida o expirada
- Límite de cuota de Gemini alcanzado
- Problema de conexión a internet

**Solución**:
1. Verifica tu API key en [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Revisa tu cuota de uso
3. Genera una nueva API key si es necesario

### Las funciones de IA no aparecen

**Problema**: El servidor no se reinició después de configurar la API key

**Solución**:
1. Detén el servidor (Ctrl+C)
2. Ejecuta `npm run dev` nuevamente
3. Espera a que cargue completamente

---

## 💡 Mejores Prácticas

### Para el Asistente:
✅ Sé específico en tus preguntas
✅ Menciona números de pedido cuando sea relevante
✅ Pide aclaraciones si la respuesta no es clara

### Para Insights:
✅ Genera insights regularmente (semanalmente)
✅ Actúa sobre las recomendaciones de alto impacto
✅ Compara insights a lo largo del tiempo

---

## 📊 Límites y Cuotas

**Plan Gratuito de Gemini**:
- 60 solicitudes por minuto
- 1,500 solicitudes por día
- Suficiente para uso normal del sistema

**Si necesitas más**:
- Considera actualizar a un plan de pago de Google Cloud
- Contacta a Google para aumentar límites

---

## 🆘 Soporte

Si las funcionalidades de IA no funcionan después de seguir esta guía:

1. Verifica que el archivo `.env.local` esté guardado
2. Revisa la consola del servidor (terminal) por errores
3. Abre la consola del navegador (F12) y busca errores
4. Contacta al equipo de soporte técnico

---

## 🔄 Actualizaciones

**Modelo actual**: Gemini 2.0 Flash (experimental)

Las funcionalidades de IA se mejoran constantemente. Mantén tu sistema actualizado para obtener las últimas mejoras.

---

## 📞 Contacto

**Desarrollado para**: LUFUSSA - Luz y Fuerza San Lorenzo S.A  
**Versión**: 1.0.0  
**Fecha**: Marzo 2026

---

**¿Sin API Key?** El sistema funciona perfectamente sin las funciones de IA. Solo no tendrás acceso al Asistente Logístico ni a los Insights automáticos. Todas las demás funcionalidades (pedidos, envíos, reportes, etc.) funcionan normalmente.
