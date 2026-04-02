export interface ShipmentStats {
  inTransit: number;
  arrival: number;
  notice: number;
  inStock: number;
}

export interface User {
  name: string;
  company: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
}

export interface SystemSettings {
  companyName: string;
  logoUrl: string;
  logoSize: number;
  primaryColor: string;
  notificationEmail: string;
  language: 'es' | 'en';
  timezone: string;
  sessionTimeout: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  maintenanceMode: boolean;
  autoBackupInterval: number; // in hours, 0 to disable
  maxBackups: number;
  ordersPageSize: number;
  lastBackupAt?: string;
}

export interface ShipmentDocument {
  id: string;
  name: string;
  type: 'Invoice' | 'BL' | 'Certificate' | 'Packing List' | 'Other';
  uploadDate: string;
  size: string;
  url: string;
  status: 'received' | 'pending';
}

export interface ChangeLog {
  id: string;
  entityId: string;
  entityType: 'shipment' | 'order';
  action: 'create' | 'update' | 'delete' | 'status_change' | 'doc_upload' | 'doc_delete';
  field?: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  userName: string;
  timestamp: string;
  description: string;
}

export interface Shipment {
  id: string;
  modo: 'maritimo' | 'aereo' | 'terrestre';
  referencia: string;
  expedidor: string;
  consignatario: string;
  origen: string;
  destino: string;
  fecha?: string;
  estado?: string;
  // Detailed fields
  referenciaRemitente?: string;
  fechaFactura?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja' | string;
  etd?: string;
  atd?: string;
  eta?: string;
  ata?: string;
  numPedido?: string;
  peso?: string;
  volumen?: string;
  cantidad?: string;
  incoterms?: string;
  tipoLanzamiento?: string;
  aBordo?: string;
  descripcionMercancia?: string;
  recogidaDesde?: string;
  entregarA?: string;
  fechaRealRecogida?: string;
  mercanciasEntregadas?: string;
  puertoCarga?: string;
  puertoDescarga?: string;
  puertoOrigen?: string;
  puertoDestino?: string;
  agenteAduana?: string;
  tipoTransporte?: 'maritimo' | 'aereo' | 'terrestre' | string;
  // Logistics modules
  containerNum?: string;
  customsStatus?: 'Pendiente' | 'En Proceso' | 'Liberado' | 'Retenido';
  customsAgent?: string;
  landedCost?: number;
  dutyAmount?: number;
  taxAmount?: number;
  freightCost?: number;
  insuranceCost?: number;
  otherCosts?: number;
  reconciled?: boolean;
  docs?: ShipmentDocument[];
  history?: ChangeLog[];
}

export interface Vendor {
  id: string;
  name: string;
  defaultCurrency: string;
  defaultTransport: 'maritimo' | 'aereo' | 'terrestre';
  contactEmail?: string;
  paymentTerms?: string;
}

export interface OrderTemplate {
  id: string;
  name: string;
  material: string;
  numMaterial: string;
  proveedor: string;
  cantPed: number;
  moneda: string;
  transp: 'maritimo' | 'aereo' | 'terrestre';
  prioridad?: string;
}

export interface Order {
  id: string;
  pedido: string;
  numMaterial: string;
  material: string;
  proveedor: string;
  cantPed: number;
  valorNeto: string;
  moneda: string;
  estado: string;
  factura: string;
  pend: number;
  transp: 'maritimo' | 'aereo' | 'terrestre' | '-';
  // Detail fields
  modelo?: string;
  etd?: string;
  eta?: string;
  fechaFactura?: string;
  precioNetoUnitario?: string;
  cantidadFacturada?: number;
  prioridad?: 'Alta' | 'Media' | 'Baja' | string;
  // Logistics modules
  estatusLogistico?: string;
  agenteAduanal?: string;
  landedCostUnit?: number;
  reconciled?: boolean;
  docs?: ShipmentDocument[];
  history?: ChangeLog[];
}

export interface ScheduledExport {
  id: string;
  name: string;
  type: 'orders' | 'shipments' | 'inventory';
  format: 'pdf' | 'excel';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string;
  lastRun?: string;
  status: 'active' | 'paused';
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  shipmentId?: string;
  orderId?: string;
}

export interface Backup {
  id: string;
  timestamp: string;
  size: string;
  data: {
    orders: Order[];
    shipments: Shipment[];
    templates: OrderTemplate[];
    vendors: Vendor[];
    settings: SystemSettings;
  };
}

export interface LogisticsInsight {
  id: string;
  type: 'optimization' | 'risk' | 'cost' | 'general';
  title: string;
  content: string;
  recommendation?: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  actionable?: boolean;
}
