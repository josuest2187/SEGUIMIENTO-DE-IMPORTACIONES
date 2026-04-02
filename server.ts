import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import XLSX from "xlsx";
import fs from "fs";
import os from "os";
import multer from "multer";

// Load environment variables from .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lufussa.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    company TEXT
  );

  CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    data TEXT
  );
`);

// Seed admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (id, name, email, password, role, company) VALUES (?, ?, ?, ?, ?, ?)")
    .run("admin-1", "Administrador", "admin@lufussa.com", "admin123", "admin", "Lufussa");
  
  // Seed the user from context if known
  db.prepare("INSERT OR IGNORE INTO users (id, name, email, password, role, company) VALUES (?, ?, ?, ?, ?, ?)")
    .run("user-josue", "Josue", "josuest2187@gmail.com", "lufussa2026", "admin", "Lufussa");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Configurar directorio de uploads
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Servir archivos estáticos desde /uploads
  app.use('/uploads', express.static(uploadsDir));

  // Configurar multer para subida de archivos
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generar nombre único: timestamp-nombreoriginal
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: (req, file, cb) => {
      // Aceptar PDFs e imágenes
      const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF e imágenes (JPG, PNG, GIF, WEBP)'));
      }
    }
  });

  // --- API ROUTES ---

  // Endpoint para subir documentos
  app.post("/api/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        success: true,
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl
        }
      });
    } catch (error) {
      console.error('Error al subir archivo:', error);
      res.status(500).json({ success: false, message: 'Error al subir el archivo' });
    }
  });

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    
    console.log('\n🔐 LOGIN ATTEMPT:');
    console.log('  📧 Email recibido:', email);
    console.log('  🔑 Password recibido:', password);
    
    // Verificar si el email existe
    const userByEmail = db.prepare("SELECT id, name, email, role, company, password FROM users WHERE email = ?").get(email);
    console.log('  👤 Usuario encontrado por email:', userByEmail ? `✅ ${userByEmail.name}` : '❌ NO EXISTE');
    
    if (userByEmail) {
      console.log('  🔐 Password en BD:', userByEmail.password);
      console.log('  ⚖️  Passwords coinciden:', userByEmail.password === password ? '✅ SÍ' : '❌ NO');
    }
    
    const user = db.prepare("SELECT id, name, email, role, company FROM users WHERE email = ? AND password = ?").get(email, password);
    
    if (user) {
      // Verificar modo mantenimiento
      const settingsRow = db.prepare("SELECT data FROM settings WHERE id = 'main'").get();
      if (settingsRow) {
        const settings = JSON.parse((settingsRow as any).data);
        if (settings.maintenanceMode && (user as any).role !== 'admin') {
          console.log('  🚧 LOGIN RECHAZADO: Sistema en modo mantenimiento\n');
          return res.status(503).json({ 
            success: false, 
            message: "🚧 El sistema está en mantenimiento. Solo los administradores pueden acceder en este momento. Por favor, intenta más tarde."
          });
        }
      }
      
      console.log('  ✅ LOGIN EXITOSO\n');
      res.json({ success: true, user });
    } else {
      console.log('  ❌ LOGIN FALLIDO\n');
      res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
  });

  // Users Management
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, company FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { name, email, password, role, company } = req.body;
    
    console.log('\n👤 CREAR USUARIO:');
    console.log('  📧 Email:', email);
    console.log('  🔑 Password:', password);
    console.log('  👔 Role:', role);
    console.log('  🏢 Company:', company);
    
    // Verificar si el email ya existe
    const existingUser = db.prepare("SELECT email FROM users WHERE email = ?").get(email);
    if (existingUser) {
      console.log('  ❌ Email ya existe\n');
      return res.status(400).json({ success: false, message: "El correo electrónico ya está registrado" });
    }

    // Crear ID único
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      db.prepare("INSERT INTO users (id, name, email, password, role, company) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, name, email, password, role || 'user', company);
      
      const newUser = db.prepare("SELECT id, name, email, role, company FROM users WHERE id = ?").get(id);
      console.log('  ✅ Usuario creado exitosamente:', newUser);
      console.log('  🔍 Password guardado en BD:', password);
      console.log('');
      res.json({ success: true, user: newUser });
    } catch (error) {
      console.error('  ❌ Error al crear usuario:', error);
      console.log('');
      res.status(500).json({ success: false, message: "Error al crear usuario" });
    }
  });

  app.put("/api/users/:email", (req, res) => {
    const { email } = req.params;
    const { name, password, role } = req.body;
    
    try {
      if (password) {
        // Si se proporciona contraseña, actualizarla
        db.prepare("UPDATE users SET name = ?, password = ?, role = ? WHERE email = ?")
          .run(name, password, role, email);
      } else {
        // Si no hay contraseña, no actualizarla
        db.prepare("UPDATE users SET name = ?, role = ? WHERE email = ?")
          .run(name, role, email);
      }
      
      const updatedUser = db.prepare("SELECT id, name, email, role, company FROM users WHERE email = ?").get(email);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al actualizar usuario" });
    }
  });

  app.delete("/api/users/:email", (req, res) => {
    const { email } = req.params;
    
    try {
      db.prepare("DELETE FROM users WHERE email = ?").run(email);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al eliminar usuario" });
    }
  });

  // Shipments
  app.get("/api/shipments", (req, res) => {
    // Headers anti-caché
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const rows = db.prepare("SELECT data FROM shipments").all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
  });

  app.post("/api/shipments", (req, res) => {
    const shipment = req.body;
    db.prepare("INSERT OR REPLACE INTO shipments (id, data) VALUES (?, ?)")
      .run(shipment.id, JSON.stringify(shipment));
    res.json({ success: true });
  });

  app.post("/api/shipments/bulk", (req, res) => {
    const shipments = req.body;
    const insert = db.prepare("INSERT OR REPLACE INTO shipments (id, data) VALUES (?, ?)");
    const transaction = db.transaction((items) => {
      for (const item of items) insert.run(item.id, JSON.stringify(item));
    });
    transaction(shipments);
    res.json({ success: true });
  });

  app.put("/api/shipments/:id", (req, res) => {
    const shipment = { ...req.body, id: req.params.id };
    db.prepare("INSERT OR REPLACE INTO shipments (id, data) VALUES (?, ?)")
      .run(shipment.id, JSON.stringify(shipment));
    res.json({ success: true });
  });

  app.delete("/api/shipments/:id", (req, res) => {
    db.prepare("DELETE FROM shipments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Orders
  app.get("/api/orders", (req, res) => {
    // Headers anti-caché para forzar actualización
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const rows = db.prepare("SELECT data FROM orders").all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
  });

  app.post("/api/orders", (req, res) => {
    const order = req.body;
    db.prepare("INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)")
      .run(order.id, JSON.stringify(order));
    res.json({ success: true });
  });

  app.post("/api/orders/bulk", (req, res) => {
    const orders = req.body;
    const insert = db.prepare("INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)");
    const transaction = db.transaction((items) => {
      for (const item of items) insert.run(item.id, JSON.stringify(item));
    });
    transaction(orders);
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", (req, res) => {
    db.prepare("DELETE FROM orders WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vendors
  app.get("/api/vendors", (req, res) => {
    const rows = db.prepare("SELECT data FROM vendors").all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
  });

  app.post("/api/vendors", (req, res) => {
    const vendor = req.body;
    db.prepare("INSERT OR REPLACE INTO vendors (id, data) VALUES (?, ?)")
      .run(vendor.id, JSON.stringify(vendor));
    res.json({ success: true });
  });

  // Templates
  app.get("/api/templates", (req, res) => {
    const rows = db.prepare("SELECT data FROM templates").all();
    res.json(rows.map((r: any) => JSON.parse(r.data)));
  });

  app.post("/api/templates", (req, res) => {
    const template = req.body;
    db.prepare("INSERT OR REPLACE INTO templates (id, data) VALUES (?, ?)")
      .run(template.id, JSON.stringify(template));
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const row = db.prepare("SELECT data FROM settings WHERE id = 'main'").get();
    res.json(row ? JSON.parse((row as any).data) : null);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    db.prepare("INSERT OR REPLACE INTO settings (id, data) VALUES ('main', ?)")
      .run(JSON.stringify(settings));
    res.json({ success: true });
  });

  // Excel Sync (Bidirectional with Data Protection)
  app.post("/api/sync/excel", (req, res) => {
    try {
      const excelPath = path.join(process.cwd(), "importaciones.xlsx");
      
      if (!fs.existsSync(excelPath)) {
        console.error(`❌ Archivo no encontrado en: ${excelPath}`);
        return res.status(404).json({ 
          success: false, 
          message: `Archivo importaciones.xlsx no encontrado en ${excelPath}` 
        });
      }

      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      console.log(`📊 Sincronizando ${data.length} registros desde Excel...`);
      
      // 🔍 DEBUG: Ver columnas disponibles y primeros 3 registros
      if (data.length > 0) {
        console.log('🔍 Columnas detectadas en Excel:', Object.keys(data[0]));
        console.log('🔍 Muestra de primeros 3 registros (Tipo Transporte):');
        data.slice(0, 3).forEach((row: any, idx: number) => {
          const transporteExcel = row['Tipo Transporte'] || row['Tipo de Transporte'] || row['Transporte'] || row['Tipo transporte'];
          console.log(`   ${idx + 1}. Tipo Transporte en Excel: "${transporteExcel}" → Normalizado: ${transporteExcel ? 'detectado' : 'VACÍO'}`);
        });
      }

      // Helper function to convert Excel serial date to ISO string
      const excelDateToISO = (serial: any) => {
        if (!serial || serial === '') return '';
        if (typeof serial === 'string') return serial;
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info.toISOString().split('T')[0];
      };

      // Helper to normalize transport type
      let transportLogCount = 0; // Contador para limitar logs
      const normalizeTransport = (tipo: string): 'maritimo' | 'aereo' | 'terrestre' | '-' => {
        const t = (tipo || '').toLowerCase().trim();
        const shouldLog = transportLogCount < 5; // Solo loguear primeros 5
        
        if (shouldLog) {
          console.log(`🔍 DEBUG normalizeTransport:`);
          console.log(`   - Entrada (tipo): "${tipo}" (length: ${tipo?.length || 0})`);
          console.log(`   - Después de limpiar (t): "${t}" (length: ${t.length})`);
          console.log(`   - Es vacío (!t): ${!t}`);
        }
        
        if (!t || t === '') {
          if (shouldLog) console.log(`   ✅ Tipo de transporte VACÍO → Retornando guion (-)`);
          transportLogCount++;
          return '-'; // Por defecto: guion cuando está vacío
        }
        
        let resultado: 'maritimo' | 'aereo' | 'terrestre' | '-';
        if (t.includes('mar') || t.includes('ship') || t.includes('marítimo')) {
          resultado = 'maritimo';
        } else if (t.includes('aer') || t.includes('air') || t.includes('aéreo') || t.includes('avión')) {
          resultado = 'aereo';
        } else if (t.includes('terr') || t.includes('truck') || t.includes('camión')) {
          resultado = 'terrestre';
        } else {
          if (shouldLog) console.log(`   ⚠️  Tipo de transporte "${tipo}" no reconocido → Retornando guion (-)`);
          resultado = '-';
        }
        
        if (shouldLog) console.log(`   ✅ Transporte detectado: "${tipo}" → ${resultado}`);
        transportLogCount++;
        return resultado;
      };

      // 🔄 PASO 1: Leer datos existentes de la base de datos
      const existingOrdersRows = db.prepare("SELECT id, data FROM orders").all();
      const existingOrdersMap = new Map();
      existingOrdersRows.forEach((row: any) => {
        const order = JSON.parse(row.data);
        existingOrdersMap.set(order.id, order);
      });

      console.log(`📦 Base de datos actual: ${existingOrdersMap.size} pedidos`);

      // 🔄 PASO 2: Procesar datos del Excel (SOLO LECTURA)
      const orders = data.map((row: any, index: number) => {
        const pedido = String(row['Pedido'] || '').trim();
        const numMaterial = String(row['Num. de Material'] || '').trim();
        const uniqueId = `${pedido}-${numMaterial}-${index}`;

        // Buscar si ya existe en la BD
        const existingOrder = existingOrdersMap.get(uniqueId);

        // Función helper: Excel es SIEMPRE la fuente de verdad
        // Si Excel está vacío, usar el valor por defecto (NO restaurar de BD)
        const getValue = (excelValue: any, defaultValue: any = '') => {
          const cleaned = String(excelValue || '').trim();
          // Si Excel tiene valor, usar Excel
          if (cleaned && cleaned !== '') return cleaned;
          // Si Excel está vacío, usar default (respetar que el usuario lo borró)
          return defaultValue;
        };

        const getNumberValue = (excelValue: any, defaultValue: number = 0) => {
          const num = Number(excelValue);
          // Si es un número válido (incluso 0), usarlo
          if (!isNaN(num)) return num;
          // Si no es número válido, usar default
          return defaultValue;
        };

        return {
          id: uniqueId,
          pedido: getValue(row['Pedido'], pedido),
          numMaterial: getValue(row['Num. de Material'], numMaterial),
          material: getValue(row['Material']),
          modelo: getValue(row['Modelo']),
          proveedor: getValue(row['Proveedor']),
          cantPed: getNumberValue(row['Cantidad'], 0),
          valorNeto: getValue(row['Valor neto de pedido'] || row['Precio neto'], '0'),
          moneda: getValue(row['Moneda'], 'USD'),
          estado: getValue(row['Estado'], 'Pendiente'),
          factura: getValue(row['Factura']),
          pend: getNumberValue(row['Cant. Pend'], getNumberValue(row['Cantidad'], 0)),
          // 🚛✈️🚢 Tipo de Transporte: Probar múltiples variaciones de nombre de columna
          transp: normalizeTransport(
            getValue(
              row['Tipo Transporte'] || row['Tipo de Transporte'] || row['Transporte'] || row['Tipo transporte'] || row['Modo Transporte'] || row['Modo de Transporte']
            )
          ),
          precioNetoUnitario: getValue(row['Precio neto'], '0'),
          cantidadFacturada: getNumberValue(row['Cant. Fact'], 0),
          etd: excelDateToISO(row['ETD']) || '',
          eta: excelDateToISO(row['ETA']) || '',
          fechaFactura: excelDateToISO(row['Fecha de Pedido']) || '',
          prioridad: getValue(row['Prioridad'], ''),
          // Campos adicionales del sistema que SOLO están en BD (no en Excel)
          estatusLogistico: existingOrder?.estatusLogistico || getValue(row['Estatus Logístico'], ''),
          agenteAduanal: existingOrder?.agenteAduanal || getValue(row['Agente Aduanal'], ''),
          observaciones: existingOrder?.observaciones || getValue(row['Observaciones'], ''),
          puertoOrigen: existingOrder?.puertoOrigen || getValue(row['Puerto Origen'], ''),
          puertoDestino: existingOrder?.puertoDestino || getValue(row['Puerto Destino'], ''),
          awbBl: existingOrder?.awbBl || getValue(row['AWB/BL'], ''),
          reconciled: existingOrder?.reconciled || false,
          docs: existingOrder?.docs || [],
          history: existingOrder?.history || []
        };
      });

      // 🔄 PASO 3: Sincronización bidireccional inteligente
      // Solo escribe al Excel datos que el usuario agregó en el programa
      // NO escribe valores por defecto ni elimina datos del Excel
      console.log(`✍️  Preparando sincronización bidireccional inteligente...`);
      
      // Crear un nuevo worksheet con los datos actualizados
      const updatedData = orders.map((order: any) => {
        // Para cada campo, usar Excel si existe, sino usar BD solo si tiene valor real
        const excelRow = data.find((r: any) => {
          const pedido = String(r['Pedido'] || '').trim();
          const numMaterial = String(r['Num. de Material'] || '').trim();
          return pedido === order.pedido && numMaterial === order.numMaterial;
        });

        // Helper: escribir solo si hay valor real (no usar valores por defecto)
        const getOutputValue = (excelValue: any, dbValue: any) => {
          // Si Excel tiene valor, respetarlo siempre
          const excelCleaned = String(excelValue || '').trim();
          if (excelCleaned !== '') return excelValue;
          
          // Si Excel vacío, poner BD solo si tiene valor real
          const dbCleaned = String(dbValue || '').trim();
          if (dbCleaned !== '' && dbCleaned !== '-' && dbCleaned !== 'Media' && dbCleaned !== 'Pendiente' && dbCleaned !== 'USD') {
            return dbValue; // Usuario lo llenó en el programa
          }
          
          // Si ambos vacíos, dejar vacío (NO valor por defecto)
          return '';
        };

        return {
          'Pedido': order.pedido,
          'Num. de Material': order.numMaterial,
          'Material': order.material,
          'Modelo': order.modelo,
          'Proveedor': order.proveedor,
          'Cantidad': order.cantPed,
          'Moneda': getOutputValue(excelRow?.['Moneda'], order.moneda),
          'Precio neto': order.precioNetoUnitario,
          'Valor neto de pedido': order.valorNeto,
          'Estado': getOutputValue(excelRow?.['Estado'], order.estado),
          'Factura': order.factura,
          'Cant. Pend': order.pend,
          'Cant. Fact': order.cantidadFacturada,
          'Tipo Transporte': getOutputValue(
            excelRow?.['Tipo Transporte'], 
            order.transp === 'maritimo' ? 'Marítimo' : 
            order.transp === 'terrestre' ? 'Terrestre' : 
            order.transp === 'aereo' ? 'Aéreo' : ''
          ),
          'ETD': order.etd,
          'ETA': order.eta,
          'Fecha de Pedido': order.fechaFactura,
          'Prioridad': getOutputValue(excelRow?.['Prioridad'], order.prioridad)
        };
      });

      // Crear nuevo worksheet
      const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
      
      // Reemplazar la hoja existente
      workbook.Sheets[sheetName] = newWorksheet;
      
      // Escribir de vuelta al archivo Excel
      try {
        XLSX.writeFile(workbook, excelPath);
        console.log(`💾 Excel actualizado (solo datos del usuario, sin valores por defecto)`);
      } catch (writeError: any) {
        console.warn(`⚠️  No se pudo escribir al Excel (puede estar abierto): ${writeError.message}`);
        // Continuar de todos modos con la importación a la BD
      }

      // 🔄 PASO 4: Actualizar la base de datos
      const insert = db.prepare("INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)");
      const transaction = db.transaction((items) => {
        for (const item of items) {
          insert.run(item.id, JSON.stringify(item));
        }
      });

      transaction(orders);

      console.log(`✅ Sincronización completa (solo lectura): ${orders.length} registros importados desde Excel`);

      res.json({ 
        success: true, 
        count: orders.length,
        message: `${orders.length} pedidos sincronizados (Excel ↔ Sistema)`,
        bidirectional: true
      });

    } catch (error: any) {
      console.error("❌ Error al sincronizar Excel:", error);
      res.status(500).json({ 
        success: false, 
        message: `Error al sincronizar: ${error.message}` 
      });
    }
  });

  // Export changes to Excel (ONLY user-modified data)
  app.post("/api/export-to-excel", (req, res) => {
    try {
      const excelPath = path.join(process.cwd(), "importaciones.xlsx");
      
      if (!fs.existsSync(excelPath)) {
        return res.status(404).json({ 
          success: false, 
          message: 'Archivo importaciones.xlsx no encontrado' 
        });
      }

      console.log('\n📤 EXPORTANDO CAMBIOS AL EXCEL...');

      // Leer Excel actual
      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Leer pedidos de la base de datos
      const dbRows = db.prepare("SELECT data FROM orders").all();
      const dbOrders = dbRows.map((r: any) => JSON.parse(r.data));

      console.log(`📊 Excel actual: ${excelData.length} filas`);
      console.log(`💾 Base de datos: ${dbOrders.length} pedidos`);

      // Crear mapa de Excel por pedido+numMaterial
      const excelMap = new Map();
      excelData.forEach((row: any) => {
        const pedido = String(row['Pedido'] || '').trim();
        const numMaterial = String(row['Num. de Material'] || '').trim();
        const key = `${pedido}-${numMaterial}`;
        excelMap.set(key, row);
      });

      // Helper: Solo exportar si el usuario modificó el valor (no valores por defecto)
      const shouldExport = (dbValue: any, excelValue: any, defaultValue: any) => {
        const dbStr = String(dbValue || '').trim();
        const excelStr = String(excelValue || '').trim();
        const defaultStr = String(defaultValue || '').trim();

        // Si Excel ya tiene valor, no sobrescribir a menos que BD tenga valor diferente
        if (excelStr !== '' && dbStr === excelStr) {
          return false; // No cambió
        }

        // Si BD tiene un valor que NO es el default, exportarlo
        if (dbStr !== '' && dbStr !== defaultStr && dbStr  !== '-') {
          return true; // Usuario modificó
        }

        return false; // Es valor por defecto, no exportar
      };

      // Actualizar solo las filas que existen en Excel
      let modificaciones = 0;
      const updatedData = excelData.map((excelRow: any) => {
        const pedido = String(excelRow['Pedido'] || '').trim();
        const numMaterial = String(excelRow['Num. de Material'] || '').trim();
        
        // Buscar el pedido correspondiente en la BD
        const dbOrder = dbOrders.find((order: any) => 
          order.pedido === pedido && order.numMaterial === numMaterial
        );

        if (!dbOrder) {
          // Si no está en BD, dejar el Excel como está
          return excelRow;
        }

        // Objeto para almacenar cambios
        const updatedRow: any = { ...excelRow };
        let cambiosEnEstaFila = 0;

        // Campos que el usuario puede modificar en el programa
        const fieldsToCheck = [
          { excel: 'Factura', db: dbOrder.factura, default: '' },
          { excel: 'Estado', db: dbOrder.estado, default: 'Pendiente' },
          { excel: 'Prioridad', db: dbOrder.prioridad, default: '' },
          { excel: 'ETD', db: dbOrder.etd, default: '' },
          { excel: 'ETA', db: dbOrder.eta, default: '' },
          { excel: 'Tipo Transporte', db: dbOrder.transp, default: '-', transform: (val: string) => {
            if (val === 'maritimo') return 'Marítimo';
            if (val === 'terrestre') return 'Terrestre';
            if (val === 'aereo') return 'Aéreo';
            return val === '-' ? '' : val;
          }}
        ];

        fieldsToCheck.forEach(field => {
          const dbValue = field.transform ? field.transform(field.db) : field.db;
          
          if (shouldExport(dbValue, excelRow[field.excel], field.default)) {
            updatedRow[field.excel] = dbValue;
            cambiosEnEstaFila++;
            console.log(`  ✏️  ${pedido}: ${field.excel} = "${dbValue}"`);
          }
        });

        if (cambiosEnEstaFila > 0) {
          modificaciones++;
        }

        return updatedRow;
      });

      if (modificaciones === 0) {
        console.log('ℹ️  No hay cambios que exportar al Excel');
        return res.json({
          success: true,
          modificaciones: 0,
          message: 'No hay cambios que exportar'
        });
      }

      // Crear nuevo worksheet con datos actualizados
      const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
      workbook.Sheets[sheetName] = newWorksheet;

      // Intentar escribir al Excel
      try {
        XLSX.writeFile(workbook, excelPath);
        console.log(`✅ Excel actualizado: ${modificaciones} filas modificadas\n`);

        res.json({
          success: true,
          modificaciones,
          message: `${modificaciones} pedido(s) actualizado(s) en el Excel`
        });
      } catch (writeError: any) {
        console.error(`❌ Error al escribir Excel:`, writeError.message);
        
        if (writeError.message.includes('EBUSY') || writeError.message.includes('EPERM')) {
          return res.status(423).json({
            success: false,
            message: '⚠️ No se puede actualizar el Excel porque está abierto. Por favor, cierra el archivo y vuelve a intentar.'
          });
        }

        return res.status(500).json({
          success: false,
          message: `Error al escribir al Excel: ${writeError.message}`
        });
      }

    } catch (error: any) {
      console.error("❌ Error al exportar a Excel:", error);
      res.status(500).json({ 
        success: false, 
        message: `Error al exportar: ${error.message}` 
      });
    }
  });

  // AI Endpoints
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          success: false, 
          message: "Servicio de IA no disponible. Configure GEMINI_API_KEY en .env.local" 
        });
      }

      // Cargar TODOS los datos actuales de la base de datos
      const shipmentRows = db.prepare('SELECT data FROM shipments ORDER BY id DESC').all();
      const allShipments = shipmentRows.map((r: any) => JSON.parse(r.data));
      
      const orderRows = db.prepare('SELECT data FROM orders ORDER BY id DESC').all();
      const allOrders = orderRows.map((r: any) => JSON.parse(r.data));

      // Calcular estadísticas críticas
      const totalOrders = allOrders.length;
      const ordersByStatus = allOrders.reduce((acc: any, o: any) => {
        acc[o.estado] = (acc[o.estado] || 0) + 1;
        return acc;
      }, {});
      
      const criticalOrders = allOrders.filter((o: any) => 
        o.prioridad === 'Urgente' || o.prioridad === 'Alta'
      );
      
      const totalValue = allOrders.reduce((sum: number, o: any) => 
        sum + (parseFloat(o.valorNeto) || 0), 0
      );

      const pendingOrders = allOrders.filter((o: any) => 
        o.estado !== 'Completado' && o.estado !== 'Entregado'
      );

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemContext = `Eres el Asistente Logístico LUFUSSA, un experto en análisis de pedidos de importación y logística internacional.

CONTEXTO DE BASE DE DATOS COMPLETA:
════════════════════════════════════════
📊 ESTADÍSTICAS GENERALES:
- Total de pedidos en sistema: ${totalOrders}
- Valor total de pedidos: $${totalValue.toLocaleString('es-ES', {minimumFractionDigits: 2})}
- Pedidos críticos (prioridad alta/urgente): ${criticalOrders.length}
- Pedidos pendientes: ${pendingOrders.length}

📈 DISTRIBUCIÓN POR ESTADO:
${Object.entries(ordersByStatus).map(([status, count]) => `- ${status}: ${count} pedidos`).join('\n')}

🔍 DATOS COMPLETOS DE ENVÍOS (${allShipments.length} registros):
${JSON.stringify(allShipments.slice(0, 50).map((s: any) => ({ 
  id: s.id, 
  ref: s.referencia, 
  estado: s.estado, 
  origen: s.origen, 
  destino: s.destino, 
  modo: s.modo,
  eta: s.eta,
  etd: s.etd,
  proveedor: s.proveedor
})), null, 2)}
${allShipments.length > 50 ? '... [más datos disponibles en memoria]' : ''}

📦 DATOS COMPLETOS DE PEDIDOS (${allOrders.length} registros):
${JSON.stringify(allOrders.slice(0, 100).map((o: any) => ({ 
  id: o.id,
  pedido: o.pedido,
  proveedor: o.proveedor,
  material: o.material,
  cantidad: o.cantPed,
  pendiente: o.cantPend,
  valor: o.valorNeto,
  moneda: o.moneda,
  estado: o.estado,
  prioridad: o.prioridad,
  eta: o.eta,
  etd: o.etd,
  factura: o.factura,
  observaciones: o.observaciones
})), null, 2)}
${allOrders.length > 100 ? `... [${allOrders.length - 100} pedidos adicionales disponibles en memoria]` : ''}

════════════════════════════════════════
CAPACIDADES Y DIRECTRICES:

✅ PUEDES HACER:
1. Analizar CUALQUIER pedido por número (PO)
2. Identificar pedidos críticos por prioridad, estado o retraso
3. Calcular valores totales, promedios, costos por proveedor
4. Detectar problemas: retrasos en ETA, cantidades pendientes, sin factura
5. Recomendar acciones: seguimiento urgente, contactar proveedores
6. Buscar por proveedor, material, estado, fecha, rango de valores
7. Comparar pedidos, analizar tendencias

📋 FORMATO DE RESPUESTA:
- SIEMPRE menciona números de pedido como: [[PO:4800008090]]
- SIEMPRE menciona referencias de envío como: [[REF:LUF-12345]]
- Esto los hace clickeables para navegación directa
- Sé específico con números, fechas y valores monetarios
- Usa bullets y formato claro para listas
- Si detectas problemas críticos, PRIORÍZALOS al inicio

⚠️ ANÁLISIS CRÍTICO:
- Pedidos con estado "Retrasado" o ETA vencido
- Alta prioridad sin factura o con cantidad pendiente
- Valores altos sin confirmar
- Observaciones que indiquen problemas

Responde SIEMPRE en español, de forma profesional pero accesible.`;

      // Build conversation history
      const contents = messages?.map((m: any) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      })) || [];

      // Add the latest user message with full context
      const lastUserMessage = contents[contents.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        lastUserMessage.parts[0].text = systemContext + "\n\nPREGUNTA DEL USUARIO:\n" + lastUserMessage.parts[0].text;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents
      });

      const text = response.text || "Lo siento, no pude generar una respuesta.";
      res.json({ success: true, response: text });
    } catch (error: any) {
      console.error("❌ AI Chat Error:", error);
      res.status(500).json({ 
        success: false, 
        message: JSON.stringify(error)
      });
    }
  });

  app.post("/api/ai/insights", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          success: false, 
          message: "Servicio de IA no disponible. Configure GEMINI_API_KEY en .env.local" 
        });
      }

      // Cargar TODOS los datos de la base de datos
      const shipmentRows = db.prepare('SELECT data FROM shipments ORDER BY id DESC LIMIT 100').all();
      const allShipments = shipmentRows.map((r: any) => JSON.parse(r.data));
      
      const orderRows = db.prepare('SELECT data FROM orders ORDER BY id DESC LIMIT 200').all();
      const allOrders = orderRows.map((r: any) => JSON.parse(r.data));

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analiza los siguientes datos logísticos de una empresa importadora y genera 3 insights críticos (optimización, riesgo o costo).
      Responde EXCLUSIVAMENTE en formato JSON como un array de objetos con esta estructura:
      [{ "id": "string", "type": "optimization|risk|cost", "title": "string", "content": "string", "recommendation": "string", "impact": "high|medium|low", "timestamp": "ISO date", "actionable": boolean }]

      CONTEXTO:
      - Total envíos analizados: ${allShipments.length}
      - Total pedidos analizados: ${allOrders.length}
      
      DATOS DE ENVÍOS:
      ${JSON.stringify(allShipments.map((s: any) => ({
        id: s.id,
        ref: s.referencia,
        estado: s.estado,
        origen: s.origen,
        destino: s.destino,
        modo: s.modo,
        eta: s.eta,
        etd: s.etd,
        proveedor: s.proveedor,
        costo: s.costoFlete
      })) || [])}
      
      DATOS DE PEDIDOS:
      ${JSON.stringify(allOrders.map((o: any) => ({
        id: o.id,
        pedido: o.pedido,
        proveedor: o.proveedor,
        material: o.material,
        cantidad: o.cantPed,
        pendiente: o.cantPend,
        valor: o.valorNeto,
        moneda: o.moneda,
        estado: o.estado,
        prioridad: o.prioridad,
        eta: o.eta,
        etd: o.etd,
        factura: o.factura,
        observaciones: o.observaciones,
        fechaPedido: o.fechaPedido
      })) || [])}

      PRIORIZA:
      1. Riesgos: pedidos retrasados, alta prioridad sin factura, problemas críticos
      2. Costos: valores altos, análisis por proveedor, optimización de rutas
      3. Optimización: mejoras en procesos, seguimiento, trazabilidad
      
      Menciona números de pedido con formato [[PO:número]] para hacerlos clickeables.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        let jsonStr = response.text.trim();
        // Remove markdown formatting if present
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }
        
        const parsedInsights = JSON.parse(jsonStr);
        res.json({ success: true, insights: parsedInsights });
      } else {
        throw new Error("No se recibió respuesta de la IA");
      }
    } catch (error: any) {
      console.error("❌ AI Insights Error:", error);
      res.status(500).json({ 
        success: false, 
        message: JSON.stringify(error)
      });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    // Obtener la IP local de la máquina
    const networkInterfaces = os.networkInterfaces();
    const localIPs: string[] = [];
    
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        for (const iface of interfaces) {
          // Filtrar solo IPv4 y no localhost
          if (iface.family === 'IPv4' && !iface.internal) {
            localIPs.push(iface.address);
          }
        }
      }
    }

    console.log('\n🚀 ====================================');
    console.log('   SERVIDOR LUFUSSA INICIADO');
    console.log('====================================');
    console.log(`\n📍 Acceso Local:`);
    console.log(`   http://localhost:${PORT}`);
    
    if (localIPs.length > 0) {
      console.log(`\n🌐 Acceso desde Otros Equipos en la Red:`);
      localIPs.forEach(ip => {
        console.log(`   http://${ip}:${PORT}`);
      });
      console.log(`\n💡 Instrucciones para otros equipos:`);
      console.log(`   1. Asegúrate que estén en la misma red WiFi/LAN`);
      console.log(`   2. Abre un navegador y escribe: http://${localIPs[0]}:${PORT}`);
      console.log(`   3. Si no funciona, verifica el firewall de Windows`);
    }
    
    console.log('\n====================================\n');
  });
}

startServer();
