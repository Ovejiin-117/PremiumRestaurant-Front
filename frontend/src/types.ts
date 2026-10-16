export type Role = 'developer' | 'manager' | 'waiter';

export interface User {
    id: string;
    username: string;
    role: Role;
    password?: string;
    active?: boolean;
    birthDate?: string;
    registrationDate?: string;
    loginDates?: string[]; // Arreglo de cadenas únicas en formato YYYY-MM-DD
}


export type Category = string;

export interface SupplyItem {
    id: string;
    name: string;
    currentStock: number;
    unit: 'gr' | 'ml' | 'unit' | 'kg' | 'lt';
    minStock: number;
    category: string;
}

export type ItemType = 'alimento' | 'bebida' | 'objeto';

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: Category;
    type: ItemType;
    description?: string;
    image?: string;
    available: boolean;
    subcategory?: string;
    section?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
}

export interface Shift {
    id: string;
    startTime: string; // Cadena en formato ISO
    endTime?: string;  // Cadena en formato ISO
}

export interface Order {
    id: string;
    items: OrderItem[];
    total: number;
    subtotal?: number;
    tax?: number;
    orderedBy: string; // Nombre de usuario
    createdAt: string; // Cadena en formato ISO
    shiftId: string;
}

export type UIScale = 'small' | 'medium' | 'large';
export type LayoutOrientation = 'horizontal' | 'vertical';
export type Theme = 'light' | 'dark';

export interface TaxConfig {
    enabled: boolean;
    name: string;
    percentage: number;
    mode: 'inclusive' | 'exclusive';
    rounding: 'total' | 'item';
}

export type PromotionType = 'percentage' | 'quantity_offer' | 'combo'; // oferta por cantidad = NxM

export interface Promotion {
    id: string;
    name: string;
    type: PromotionType;
    value?: number; // Para porcentaje (ej. 20)
    pay?: number;   // Para NxM: Paga N
    take?: number;  // Para NxM: Lleva M
    targetItemIds: string[]; // Lista de IDs de MenuItem
    active: boolean;
    validityMode: 'permanent' | 'date_range';
    startDate?: string; // Cadena en formato ISO
    endDate?: string;   // Cadena en formato ISO
    daysOfWeek?: number[]; // 0=Dom, 1=Lun, ..., 6=Sáb
}

export type AuditAction = 'user_login' | 'user_logout' | 'shift_open' | 'shift_close' | 'user_create' | 'user_update' | 'user_delete' | 'user_status_change' | 'menu_create' | 'menu_update' | 'menu_delete' | 'menu_stock_toggle' | 'category_create' | 'category_rename' | 'category_delete' | 'subcategory_create' | 'subcategory_rename' | 'subcategory_delete' | 'section_create' | 'section_rename' | 'section_delete' | 'ticket_reprint' | 'audit_config_update' | 'tax_config_update' | 'promotion_create' | 'promotion_update' | 'promotion_delete' | 'promotion_toggle' | 'supply_create' | 'supply_update' | 'supply_delete' | 'supply_stock_adjust';

export type AuditConfig = Record<AuditAction, boolean>;

export interface AuditLogEntry {
    id: string;
    timestamp: string; // Cadena en formato ISO
    userId: string;
    username: string; // Capturado al momento del evento
    action: AuditAction;
    details: string; // Descripción legible para humanos
    entityId?: string; // ID del objeto afectado (usuario, producto, etc.)
}
