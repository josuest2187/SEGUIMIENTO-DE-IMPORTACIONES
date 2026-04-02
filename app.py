import os
from datetime import date, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, abort
from flask_sqlalchemy import SQLAlchemy

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config['SECRET_KEY'] = 'clave-secreta-importaciones-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'importaciones.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Proveedor(db.Model):
    __tablename__ = 'proveedor'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    pais = db.Column(db.String(100))
    contacto = db.Column(db.String(200))
    email = db.Column(db.String(200))
    telefono = db.Column(db.String(50))
    importaciones = db.relationship('Importacion', backref='proveedor', lazy=True)

    def __repr__(self):
        return f'<Proveedor {self.nombre}>'


class Producto(db.Model):
    __tablename__ = 'producto'
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(50), unique=True, nullable=False)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    unidad_medida = db.Column(db.String(50))
    items = db.relationship('ItemImportacion', backref='producto', lazy=True)

    def __repr__(self):
        return f'<Producto {self.codigo} - {self.nombre}>'


class Importacion(db.Model):
    __tablename__ = 'importacion'
    id = db.Column(db.Integer, primary_key=True)
    numero_referencia = db.Column(db.String(100), unique=True, nullable=False)
    proveedor_id = db.Column(db.Integer, db.ForeignKey('proveedor.id'), nullable=False)
    fecha_orden = db.Column(db.Date, nullable=False)
    fecha_estimada_llegada = db.Column(db.Date)
    fecha_llegada = db.Column(db.Date)
    estado = db.Column(db.String(50), nullable=False, default='Ordenado')
    valor_total = db.Column(db.Float, default=0.0)
    moneda = db.Column(db.String(10), default='USD')
    notas = db.Column(db.Text)
    items = db.relationship('ItemImportacion', backref='importacion', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Importacion {self.numero_referencia}>'

    def calcular_valor_total(self):
        return sum(item.cantidad * item.precio_unitario for item in self.items)


class ItemImportacion(db.Model):
    __tablename__ = 'item_importacion'
    id = db.Column(db.Integer, primary_key=True)
    importacion_id = db.Column(db.Integer, db.ForeignKey('importacion.id'), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey('producto.id'), nullable=False)
    cantidad = db.Column(db.Float, nullable=False)
    precio_unitario = db.Column(db.Float, nullable=False)

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __repr__(self):
        return f'<ItemImportacion importacion={self.importacion_id} producto={self.producto_id}>'


# ---------------------------------------------------------------------------
# Sample data seeding
# ---------------------------------------------------------------------------

def seed_data():
    if Proveedor.query.count() > 0:
        return  # Already seeded

    proveedores = [
        Proveedor(
            nombre='TechSupplies China Co.',
            pais='China',
            contacto='Li Wei',
            email='liwei@techsupplies.cn',
            telefono='+86 10 1234 5678'
        ),
        Proveedor(
            nombre='EuroComponents GmbH',
            pais='Alemania',
            contacto='Hans Müller',
            email='hans.muller@eurocomp.de',
            telefono='+49 30 9876 5432'
        ),
        Proveedor(
            nombre='US Industrial Parts Inc.',
            pais='Estados Unidos',
            contacto='John Smith',
            email='jsmith@usindustrial.com',
            telefono='+1 800 555 0199'
        ),
    ]
    db.session.add_all(proveedores)
    db.session.flush()

    productos = [
        Producto(codigo='MOT-001', nombre='Motor Eléctrico 5HP', descripcion='Motor trifásico 5HP 220V', unidad_medida='Unidad'),
        Producto(codigo='CIR-002', nombre='Circuito Integrado 555', descripcion='Temporizador IC 555 SMD', unidad_medida='Piezas'),
        Producto(codigo='CAB-003', nombre='Cable de Cobre 10mm', descripcion='Cable eléctrico de cobre calibre 10', unidad_medida='Metro'),
        Producto(codigo='VAL-004', nombre='Válvula Solenóide 1/2"', descripcion='Válvula solenóide de acero inoxidable', unidad_medida='Unidad'),
        Producto(codigo='SEN-005', nombre='Sensor de Temperatura PT100', descripcion='Sonda PT100 rango -50°C a 200°C', unidad_medida='Unidad'),
    ]
    db.session.add_all(productos)
    db.session.flush()

    hoy = date.today()

    imp1 = Importacion(
        numero_referencia='IMP-2024-001',
        proveedor_id=proveedores[0].id,
        fecha_orden=hoy - timedelta(days=30),
        fecha_estimada_llegada=hoy + timedelta(days=10),
        estado='En Tránsito',
        moneda='USD',
        notas='Contenedor compartido. Contactar al agente de aduanas antes de llegada.'
    )
    db.session.add(imp1)
    db.session.flush()
    items1 = [
        ItemImportacion(importacion_id=imp1.id, producto_id=productos[0].id, cantidad=5, precio_unitario=450.00),
        ItemImportacion(importacion_id=imp1.id, producto_id=productos[1].id, cantidad=500, precio_unitario=0.85),
    ]
    db.session.add_all(items1)
    imp1.valor_total = sum(i.cantidad * i.precio_unitario for i in items1)

    imp2 = Importacion(
        numero_referencia='IMP-2024-002',
        proveedor_id=proveedores[1].id,
        fecha_orden=hoy - timedelta(days=15),
        fecha_estimada_llegada=hoy + timedelta(days=5),
        estado='En Aduana',
        moneda='EUR',
        notas='Requiere certificado de origen y factura comercial en duplicado.'
    )
    db.session.add(imp2)
    db.session.flush()
    items2 = [
        ItemImportacion(importacion_id=imp2.id, producto_id=productos[3].id, cantidad=20, precio_unitario=75.00),
        ItemImportacion(importacion_id=imp2.id, producto_id=productos[4].id, cantidad=10, precio_unitario=120.00),
    ]
    db.session.add_all(items2)
    imp2.valor_total = sum(i.cantidad * i.precio_unitario for i in items2)

    imp3 = Importacion(
        numero_referencia='IMP-2024-003',
        proveedor_id=proveedores[2].id,
        fecha_orden=hoy - timedelta(days=60),
        fecha_estimada_llegada=hoy - timedelta(days=10),
        fecha_llegada=hoy - timedelta(days=8),
        estado='Entregado',
        moneda='USD',
        notas='Entregado sin novedad. Todo conforme a la orden de compra.'
    )
    db.session.add(imp3)
    db.session.flush()
    items3 = [
        ItemImportacion(importacion_id=imp3.id, producto_id=productos[2].id, cantidad=200, precio_unitario=3.50),
    ]
    db.session.add_all(items3)
    imp3.valor_total = sum(i.cantidad * i.precio_unitario for i in items3)

    db.session.commit()
    print('Datos de prueba creados exitosamente.')


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

ESTADOS = ['Ordenado', 'En Tránsito', 'En Aduana', 'Entregado', 'Cancelado']
MONEDAS = ['USD', 'EUR', 'COP', 'MXN', 'CLP', 'PEN']


def badge_class(estado):
    mapping = {
        'Ordenado': 'badge-ordenado',
        'En Tránsito': 'badge-en-transito',
        'En Aduana': 'badge-en-aduana',
        'Entregado': 'badge-entregado',
        'Cancelado': 'badge-cancelado',
    }
    return mapping.get(estado, 'bg-secondary')


app.jinja_env.globals['badge_class'] = badge_class


# ---------------------------------------------------------------------------
# Routes – Dashboard
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    total = Importacion.query.count()
    ordenadas = Importacion.query.filter_by(estado='Ordenado').count()
    en_transito = Importacion.query.filter_by(estado='En Tránsito').count()
    en_aduana = Importacion.query.filter_by(estado='En Aduana').count()
    entregadas = Importacion.query.filter_by(estado='Entregado').count()
    valor_total = db.session.query(db.func.sum(Importacion.valor_total)).scalar() or 0.0
    recientes = Importacion.query.order_by(Importacion.id.desc()).limit(5).all()
    return render_template(
        'index.html',
        total=total,
        ordenadas=ordenadas,
        en_transito=en_transito,
        en_aduana=en_aduana,
        entregadas=entregadas,
        valor_total=valor_total,
        recientes=recientes,
    )


# ---------------------------------------------------------------------------
# Routes – Importaciones
# ---------------------------------------------------------------------------

@app.route('/importaciones')
def importaciones_lista():
    q = request.args.get('q', '').strip()
    estado_filtro = request.args.get('estado', '').strip()
    query = Importacion.query
    if q:
        query = query.filter(Importacion.numero_referencia.ilike(f'%{q}%'))
    if estado_filtro:
        query = query.filter_by(estado=estado_filtro)
    importaciones = query.order_by(Importacion.id.desc()).all()
    return render_template('importaciones/lista.html', importaciones=importaciones, estados=ESTADOS, q=q, estado_filtro=estado_filtro)


@app.route('/importaciones/nueva', methods=['GET', 'POST'])
def importaciones_nueva():
    proveedores = Proveedor.query.order_by(Proveedor.nombre).all()
    productos = Producto.query.order_by(Producto.nombre).all()
    if request.method == 'POST':
        try:
            ref = request.form['numero_referencia'].strip()
            if Importacion.query.filter_by(numero_referencia=ref).first():
                flash(f'El número de referencia "{ref}" ya existe.', 'danger')
                return render_template('importaciones/nueva.html', proveedores=proveedores, productos=productos, estados=ESTADOS, monedas=MONEDAS)

            fecha_orden = date.fromisoformat(request.form['fecha_orden'])
            fecha_est = request.form.get('fecha_estimada_llegada') or None
            if fecha_est:
                fecha_est = date.fromisoformat(fecha_est)
            fecha_llegada = request.form.get('fecha_llegada') or None
            if fecha_llegada:
                fecha_llegada = date.fromisoformat(fecha_llegada)

            imp = Importacion(
                numero_referencia=ref,
                proveedor_id=int(request.form['proveedor_id']),
                fecha_orden=fecha_orden,
                fecha_estimada_llegada=fecha_est,
                fecha_llegada=fecha_llegada,
                estado=request.form['estado'],
                moneda=request.form.get('moneda', 'USD'),
                notas=request.form.get('notas', '').strip(),
            )
            db.session.add(imp)
            db.session.flush()

            _save_items(imp)
            imp.valor_total = imp.calcular_valor_total()
            db.session.commit()
            flash('Importación creada exitosamente.', 'success')
            return redirect(url_for('importaciones_detalle', id=imp.id))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al crear la importación: {e}', 'danger')

    return render_template('importaciones/nueva.html', proveedores=proveedores, productos=productos, estados=ESTADOS, monedas=MONEDAS)


@app.route('/importaciones/<int:id>')
def importaciones_detalle(id):
    imp = Importacion.query.get_or_404(id)
    return render_template('importaciones/detalle.html', imp=imp)


@app.route('/importaciones/<int:id>/editar', methods=['GET', 'POST'])
def importaciones_editar(id):
    imp = Importacion.query.get_or_404(id)
    proveedores = Proveedor.query.order_by(Proveedor.nombre).all()
    productos = Producto.query.order_by(Producto.nombre).all()
    if request.method == 'POST':
        try:
            ref = request.form['numero_referencia'].strip()
            existing = Importacion.query.filter_by(numero_referencia=ref).first()
            if existing and existing.id != id:
                flash(f'El número de referencia "{ref}" ya existe en otra importación.', 'danger')
                return render_template('importaciones/editar.html', imp=imp, proveedores=proveedores, productos=productos, estados=ESTADOS, monedas=MONEDAS)

            imp.numero_referencia = ref
            imp.proveedor_id = int(request.form['proveedor_id'])
            imp.fecha_orden = date.fromisoformat(request.form['fecha_orden'])
            fecha_est = request.form.get('fecha_estimada_llegada') or None
            imp.fecha_estimada_llegada = date.fromisoformat(fecha_est) if fecha_est else None
            fecha_llegada = request.form.get('fecha_llegada') or None
            imp.fecha_llegada = date.fromisoformat(fecha_llegada) if fecha_llegada else None
            imp.estado = request.form['estado']
            imp.moneda = request.form.get('moneda', 'USD')
            imp.notas = request.form.get('notas', '').strip()

            # Remove old items and re-save
            for item in imp.items:
                db.session.delete(item)
            db.session.flush()

            _save_items(imp)
            imp.valor_total = imp.calcular_valor_total()
            db.session.commit()
            flash('Importación actualizada exitosamente.', 'success')
            return redirect(url_for('importaciones_detalle', id=imp.id))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar la importación: {e}', 'danger')

    return render_template('importaciones/editar.html', imp=imp, proveedores=proveedores, productos=productos, estados=ESTADOS, monedas=MONEDAS)


@app.route('/importaciones/<int:id>/eliminar', methods=['POST'])
def importaciones_eliminar(id):
    imp = Importacion.query.get_or_404(id)
    try:
        db.session.delete(imp)
        db.session.commit()
        flash(f'Importación "{imp.numero_referencia}" eliminada.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error al eliminar: {e}', 'danger')
    return redirect(url_for('importaciones_lista'))


def _save_items(imp):
    indices = request.form.getlist('item_producto_id')
    cantidades = request.form.getlist('item_cantidad')
    precios = request.form.getlist('item_precio_unitario')
    for prod_id, cant, precio in zip(indices, cantidades, precios):
        if prod_id and cant and precio:
            item = ItemImportacion(
                importacion_id=imp.id,
                producto_id=int(prod_id),
                cantidad=float(cant),
                precio_unitario=float(precio),
            )
            db.session.add(item)


# ---------------------------------------------------------------------------
# Routes – Proveedores
# ---------------------------------------------------------------------------

@app.route('/proveedores')
def proveedores_lista():
    proveedores = Proveedor.query.order_by(Proveedor.nombre).all()
    return render_template('proveedores/lista.html', proveedores=proveedores)


@app.route('/proveedores/nuevo', methods=['GET', 'POST'])
def proveedores_nuevo():
    if request.method == 'POST':
        try:
            prov = Proveedor(
                nombre=request.form['nombre'].strip(),
                pais=request.form.get('pais', '').strip(),
                contacto=request.form.get('contacto', '').strip(),
                email=request.form.get('email', '').strip(),
                telefono=request.form.get('telefono', '').strip(),
            )
            db.session.add(prov)
            db.session.commit()
            flash('Proveedor creado exitosamente.', 'success')
            return redirect(url_for('proveedores_lista'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al crear el proveedor: {e}', 'danger')
    return render_template('proveedores/nuevo.html')


@app.route('/proveedores/<int:id>/editar', methods=['GET', 'POST'])
def proveedores_editar(id):
    prov = Proveedor.query.get_or_404(id)
    if request.method == 'POST':
        try:
            prov.nombre = request.form['nombre'].strip()
            prov.pais = request.form.get('pais', '').strip()
            prov.contacto = request.form.get('contacto', '').strip()
            prov.email = request.form.get('email', '').strip()
            prov.telefono = request.form.get('telefono', '').strip()
            db.session.commit()
            flash('Proveedor actualizado exitosamente.', 'success')
            return redirect(url_for('proveedores_lista'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar: {e}', 'danger')
    return render_template('proveedores/editar.html', prov=prov)


@app.route('/proveedores/<int:id>/eliminar', methods=['POST'])
def proveedores_eliminar(id):
    prov = Proveedor.query.get_or_404(id)
    if prov.importaciones:
        flash('No se puede eliminar el proveedor porque tiene importaciones asociadas.', 'danger')
        return redirect(url_for('proveedores_lista'))
    try:
        db.session.delete(prov)
        db.session.commit()
        flash(f'Proveedor "{prov.nombre}" eliminado.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error al eliminar: {e}', 'danger')
    return redirect(url_for('proveedores_lista'))


# ---------------------------------------------------------------------------
# Routes – Productos
# ---------------------------------------------------------------------------

@app.route('/productos')
def productos_lista():
    productos = Producto.query.order_by(Producto.codigo).all()
    return render_template('productos/lista.html', productos=productos)


@app.route('/productos/nuevo', methods=['GET', 'POST'])
def productos_nuevo():
    if request.method == 'POST':
        try:
            codigo = request.form['codigo'].strip()
            if Producto.query.filter_by(codigo=codigo).first():
                flash(f'El código "{codigo}" ya existe.', 'danger')
                return render_template('productos/nuevo.html')
            prod = Producto(
                codigo=codigo,
                nombre=request.form['nombre'].strip(),
                descripcion=request.form.get('descripcion', '').strip(),
                unidad_medida=request.form.get('unidad_medida', '').strip(),
            )
            db.session.add(prod)
            db.session.commit()
            flash('Producto creado exitosamente.', 'success')
            return redirect(url_for('productos_lista'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al crear el producto: {e}', 'danger')
    return render_template('productos/nuevo.html')


@app.route('/productos/<int:id>/editar', methods=['GET', 'POST'])
def productos_editar(id):
    prod = Producto.query.get_or_404(id)
    if request.method == 'POST':
        try:
            codigo = request.form['codigo'].strip()
            existing = Producto.query.filter_by(codigo=codigo).first()
            if existing and existing.id != id:
                flash(f'El código "{codigo}" ya existe en otro producto.', 'danger')
                return render_template('productos/editar.html', prod=prod)
            prod.codigo = codigo
            prod.nombre = request.form['nombre'].strip()
            prod.descripcion = request.form.get('descripcion', '').strip()
            prod.unidad_medida = request.form.get('unidad_medida', '').strip()
            db.session.commit()
            flash('Producto actualizado exitosamente.', 'success')
            return redirect(url_for('productos_lista'))
        except Exception as e:
            db.session.rollback()
            flash(f'Error al actualizar: {e}', 'danger')
    return render_template('productos/editar.html', prod=prod)


@app.route('/productos/<int:id>/eliminar', methods=['POST'])
def productos_eliminar(id):
    prod = Producto.query.get_or_404(id)
    if prod.items:
        flash('No se puede eliminar el producto porque está asociado a importaciones.', 'danger')
        return redirect(url_for('productos_lista'))
    try:
        db.session.delete(prod)
        db.session.commit()
        flash(f'Producto "{prod.nombre}" eliminado.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error al eliminar: {e}', 'danger')
    return redirect(url_for('productos_lista'))


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------

@app.route('/api/productos')
def api_productos():
    productos = Producto.query.order_by(Producto.nombre).all()
    return jsonify([
        {
            'id': p.id,
            'codigo': p.codigo,
            'nombre': p.nombre,
            'unidad_medida': p.unidad_medida or '',
        }
        for p in productos
    ])


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_data()
    app.run(debug=True)
