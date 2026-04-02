# 🚢 Programa de Seguimiento de Importaciones

Aplicación web completa desarrollada con **Python/Flask** para el seguimiento y gestión de importaciones empresariales.

---

## Características

- 📦 **Gestión de Importaciones** – Registro completo con número de referencia, proveedor, fechas, estado y artículos.
- 🏢 **Gestión de Proveedores** – Catálogo de proveedores con datos de contacto.
- 🏷️ **Gestión de Productos** – Catálogo de productos con código y unidad de medida.
- 📊 **Dashboard** – Estadísticas en tiempo real: totales por estado y valor acumulado.
- 🔍 **Búsqueda y Filtros** – Búsqueda por referencia y filtro por estado.
- 💰 **Artículos dinámicos** – Líneas de artículos con cálculo automático de subtotales en JavaScript.
- 🎨 **UI Bootstrap 5** – Interfaz responsiva completamente en español.
- 📋 **Estados de seguimiento**: Ordenado → En Tránsito → En Aduana → Entregado

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.10+, Flask 3.0, SQLAlchemy 2.0 |
| Base de datos | SQLite (archivo local `importaciones.db`) |
| Frontend | Bootstrap 5.3, Bootstrap Icons |
| JS | Vanilla JS (sin dependencias externas) |

---

## Instalación y Configuración

### Prerrequisitos

- Python 3.10 o superior
- pip

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/SEGUIMIENTO-DE-IMPORTACIONES.git
cd SEGUIMIENTO-DE-IMPORTACIONES

# 2. Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate.bat    # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Ejecutar la aplicación
python app.py
```

La aplicación estará disponible en [http://localhost:5000](http://localhost:5000).

En el **primer inicio** se crea automáticamente la base de datos SQLite y se cargan datos de ejemplo (3 proveedores, 5 productos y 3 importaciones).

---

## Estructura del Proyecto

```
SEGUIMIENTO-DE-IMPORTACIONES/
├── app.py                        # Aplicación Flask principal (modelos + rutas)
├── requirements.txt              # Dependencias Python
├── importaciones.db              # Base de datos SQLite (generado en runtime)
├── static/
│   ├── css/style.css             # Estilos personalizados
│   └── js/main.js                # Lógica de artículos dinámicos
└── templates/
    ├── base.html                 # Plantilla base (navbar, footer, flash)
    ├── index.html                # Dashboard con estadísticas
    ├── 404.html / 500.html       # Páginas de error
    ├── importaciones/
    │   ├── lista.html            # Listado con búsqueda y filtros
    │   ├── nueva.html            # Formulario de creación
    │   ├── editar.html           # Formulario de edición
    │   └── detalle.html          # Vista detallada
    ├── proveedores/
    │   ├── lista.html
    │   ├── nuevo.html
    │   └── editar.html
    └── productos/
        ├── lista.html
        ├── nuevo.html
        └── editar.html
```

---

## Uso

| Sección | URL | Descripción |
|---------|-----|-------------|
| Dashboard | `/` | Estadísticas generales |
| Importaciones | `/importaciones` | Listado con búsqueda |
| Nueva importación | `/importaciones/nueva` | Crear importación con artículos |
| Proveedores | `/proveedores` | Gestionar proveedores |
| Productos | `/productos` | Gestionar catálogo de productos |
| API productos | `/api/productos` | JSON con todos los productos |

---

## Estados de Importación

| Estado | Color |
|--------|-------|
| Ordenado | 🔵 Azul |
| En Tránsito | 🟡 Amarillo |
| En Aduana | 🟠 Naranja |
| Entregado | 🟢 Verde |
| Cancelado | ⚫ Gris |
AYUDA A SEGUIR LAS IMPORTACIONES DE TU EMPRESA
