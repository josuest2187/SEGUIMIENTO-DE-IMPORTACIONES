/**
 * main.js – Seguimiento de Importaciones
 * Handles dynamic line items in import create/edit forms.
 */

'use strict';

// Cache of products loaded from API
let productosCache = [];

/**
 * Fetch products from the API and store in cache.
 */
async function cargarProductos() {
  if (productosCache.length > 0) return productosCache;
  try {
    const resp = await fetch('/api/productos');
    if (!resp.ok) throw new Error('Error al cargar productos');
    productosCache = await resp.json();
  } catch (err) {
    console.error('No se pudo cargar la lista de productos:', err);
  }
  return productosCache;
}

/**
 * Build a <select> element with all products as options.
 * @param {number|null} selectedId – pre-selected product id (for edit mode)
 */
function construirSelectProducto(selectedId) {
  const sel = document.createElement('select');
  sel.name = 'item_producto_id';
  sel.className = 'form-select form-select-sm';
  sel.required = true;

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccionar producto…';
  sel.appendChild(placeholder);

  productosCache.forEach(function(p) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `[${p.codigo}] ${p.nombre}` + (p.unidad_medida ? ` (${p.unidad_medida})` : '');
    if (selectedId && p.id === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });

  return sel;
}

/**
 * Recalculate subtotal for a single row and update the global total.
 */
function recalcularFila(row) {
  const cantInput = row.querySelector('[name="item_cantidad"]');
  const precioInput = row.querySelector('[name="item_precio_unitario"]');
  const subtotalCell = row.querySelector('.subtotal-cell');

  const cant = parseFloat(cantInput.value) || 0;
  const precio = parseFloat(precioInput.value) || 0;
  const subtotal = cant * precio;
  subtotalCell.textContent = subtotal.toFixed(2);
  recalcularTotal();
}

/**
 * Sum all row subtotals and display in footer.
 */
function recalcularTotal() {
  const tbody = document.getElementById('itemsBody');
  if (!tbody) return;
  let total = 0;
  tbody.querySelectorAll('.subtotal-cell').forEach(function(cell) {
    total += parseFloat(cell.textContent) || 0;
  });
  const totalEl = document.getElementById('totalGlobal');
  if (totalEl) totalEl.textContent = total.toFixed(2);
}

/**
 * Add a new line-item row to the table.
 * @param {number|null} productoId
 * @param {number} cantidad
 * @param {number} precioUnitario
 */
async function agregarFila(productoId, cantidad, precioUnitario) {
  await cargarProductos();

  const tbody = document.getElementById('itemsBody');
  if (!tbody) return;

  const tr = document.createElement('tr');

  // Product cell
  const tdProd = document.createElement('td');
  tdProd.appendChild(construirSelectProducto(productoId || null));
  tr.appendChild(tdProd);

  // Quantity cell
  const tdCant = document.createElement('td');
  const cantInput = document.createElement('input');
  cantInput.type = 'number';
  cantInput.name = 'item_cantidad';
  cantInput.className = 'form-control form-control-sm';
  cantInput.min = '0.001';
  cantInput.step = 'any';
  cantInput.required = true;
  cantInput.value = cantidad != null ? cantidad : '';
  cantInput.addEventListener('input', function() { recalcularFila(tr); });
  tdCant.appendChild(cantInput);
  tr.appendChild(tdCant);

  // Unit price cell
  const tdPrecio = document.createElement('td');
  const precioInput = document.createElement('input');
  precioInput.type = 'number';
  precioInput.name = 'item_precio_unitario';
  precioInput.className = 'form-control form-control-sm';
  precioInput.min = '0';
  precioInput.step = 'any';
  precioInput.required = true;
  precioInput.value = precioUnitario != null ? precioUnitario : '';
  precioInput.addEventListener('input', function() { recalcularFila(tr); });
  tdPrecio.appendChild(precioInput);
  tr.appendChild(tdPrecio);

  // Subtotal cell
  const tdSub = document.createElement('td');
  tdSub.className = 'text-end subtotal-cell';
  const sub = ((cantidad || 0) * (precioUnitario || 0)).toFixed(2);
  tdSub.textContent = sub;
  tr.appendChild(tdSub);

  // Remove button cell
  const tdAcc = document.createElement('td');
  const btnRemove = document.createElement('button');
  btnRemove.type = 'button';
  btnRemove.className = 'btn btn-sm btn-outline-danger btn-remove-item';
  btnRemove.title = 'Eliminar fila';
  btnRemove.innerHTML = '<i class="bi bi-x-lg"></i>';
  btnRemove.addEventListener('click', function() {
    tr.remove();
    recalcularTotal();
  });
  tdAcc.appendChild(btnRemove);
  tr.appendChild(tdAcc);

  tbody.appendChild(tr);
  recalcularTotal();
}

// Wire up the "Add item" button once DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const btnAgregar = document.getElementById('btnAgregarItem');
  if (btnAgregar) {
    btnAgregar.addEventListener('click', function() {
      agregarFila(null, null, null);
    });
  }
});
