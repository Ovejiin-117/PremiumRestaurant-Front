export type Role = 'developer' | 'manager' | 'waiter';

export interface User {
    id: string;
    username: string;
    role: Role;
    password?: string;
    active?: boolean;
    birthDate?: string;
    registrationDate?: string;
    loginDates?: string[]; // Array of unique YYYY-MM-DD strings
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

export interface RecipeComponent {
    supplyId: string;
    quantity: number;
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
    recipe?: RecipeComponent[];
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
    startTime: string; // ISO string
    endTime?: string;  // ISO string
}

export interface Order {
    id: string;
    items: OrderItem[];
    total: number;
    orderedBy: string; // Username
    createdAt: string; // ISO string
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

export type PromotionType = 'percentage' | 'quantity_offer' | 'combo'; // quantity_offer = NxM

export interface Promotion {
    id: string;
    name: string;
    type: PromotionType;
    value?: number; // For percentage (e.g., 20)
    pay?: number;   // For NxM: Pay N
    take?: number;  // For NxM: Get M
    targetItemIds: string[]; // List of MenuItem IDs
    active: boolean;
    validityMode: 'permanent' | 'date_range';
    startDate?: string; // ISO string
    endDate?: string;   // ISO string
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

export type AuditAction = 'user_login' | 'user_logout' | 'shift_open' | 'shift_close' | 'user_create' | 'user_update' | 'user_delete' | 'user_status_change' | 'menu_create' | 'menu_update' | 'menu_delete' | 'menu_stock_toggle' | 'category_create' | 'category_rename' | 'category_delete' | 'subcategory_create' | 'subcategory_rename' | 'subcategory_delete' | 'section_create' | 'section_rename' | 'section_delete' | 'ticket_reprint' | 'audit_config_update' | 'tax_config_update' | 'promotion_create' | 'promotion_update' | 'promotion_delete' | 'promotion_toggle' | 'supply_create' | 'supply_update' | 'supply_delete' | 'supply_stock_adjust';

export type AuditConfig = Record<AuditAction, boolean>;

export interface AuditLogEntry {
    id: string;
    timestamp: string; // ISO String
    userId: string;
    username: string; // Captured at event time
    action: AuditAction;
    details: string; // Human readable description
    entityId?: string; // ID of affected object (user, product, etc)
}
