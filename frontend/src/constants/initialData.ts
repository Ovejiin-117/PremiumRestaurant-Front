import type { User, MenuItem, AuditConfig, TaxConfig } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'dev-001', username: 'Desarrollador', role: 'developer', password: 'DEVELOPERON', registrationDate: '2026-01-01', birthDate: '1990-01-01', loginDates: [] },
  { id: 'mgr-001', username: 'Gerente', role: 'manager', password: '123', registrationDate: '2026-01-01', birthDate: '1985-05-15', loginDates: [] },
  { id: 'wait-001', username: 'Mesero', role: 'waiter', password: '123', registrationDate: '2026-01-01', birthDate: '1998-10-20', loginDates: [] },
];

export const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Hamburguesa', price: 10, category: 'Comida', type: 'alimento', available: true },
  { id: '2', name: 'Refresco', price: 2, category: 'Bebidas', type: 'bebida', available: true },
  { id: '3', name: 'Papas Fritas', price: 3, category: 'Extras', type: 'alimento', available: true },
];

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  user_login: false,
  user_logout: false,
  shift_open: true,
  shift_close: true,
  user_create: true,
  user_update: true,
  user_delete: true,
  user_status_change: true,
  menu_create: true,
  menu_update: true,
  menu_delete: true,
  menu_stock_toggle: true,
  category_create: true,
  category_rename: true,
  category_delete: true,
  subcategory_create: true,
  subcategory_rename: true,
  subcategory_delete: true,
  section_create: true,
  section_rename: true,
  section_delete: true,
  ticket_reprint: true,
  audit_config_update: true,
  tax_config_update: true,
  promotion_create: true,
  promotion_update: true,
  promotion_delete: true,
  promotion_toggle: true,
  supply_create: true,
  supply_update: true,
  supply_delete: true,
  supply_stock_adjust: true
};

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  enabled: false,
  name: 'IVA',
  percentage: 16,
  mode: 'exclusive',
  rounding: 'total'
};
