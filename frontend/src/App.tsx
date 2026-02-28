import { useState, useEffect } from 'react';
import SetupWizard from './features/setup/components/SetupWizard';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './features/users/components/UserManagement';
import MenuEditor from './features/menu/components/MenuEditor';
import History from './features/history/components/History';
import ShiftManagement from './features/shifts/components/ShiftManagement';
import AuditLog from './pages/AuditLog';
import TaxSettings from './pages/TaxSettings';
import Promotions from './features/promotions/components/Promotions';
import SalesRecords from './features/history/components/SalesRecords';
import VisualSettings from './pages/VisualSettings';
import SupplyManagement from './features/inventory/components/SupplyManagement';
import type { User, MenuItem, Order, UIScale, LayoutOrientation, Shift, Theme, AuditLogEntry, AuditAction, AuditConfig, TaxConfig, Promotion, SupplyItem } from './types';
import './App.css';

// ... (INITIAL_USERS and INITIAL_MENU remain same, not shown here to save space, but relying on existing context) 
const INITIAL_USERS: User[] = [
  { id: 'dev-001', username: 'Desarrollador', role: 'developer', password: 'DEVELOPERON', registrationDate: '2026-01-01', birthDate: '1990-01-01', loginDates: [] },
  { id: 'mgr-001', username: 'Gerente', role: 'manager', password: '123', registrationDate: '2026-01-01', birthDate: '1985-05-15', loginDates: [] },
  { id: 'wait-001', username: 'Mesero', role: 'waiter', password: '123', registrationDate: '2026-01-01', birthDate: '1998-10-20', loginDates: [] },
];


const INITIAL_MENU: MenuItem[] = [
  { id: '1', name: 'Hamburguesa', price: 10, category: 'Comida', type: 'alimento', available: true },
  { id: '2', name: 'Refresco', price: 2, category: 'Bebidas', type: 'bebida', available: true },
  { id: '3', name: 'Papas Fritas', price: 3, category: 'Extras', type: 'alimento', available: true },
];

const DEFAULT_AUDIT_CONFIG: AuditConfig = {
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

const DEFAULT_TAX_CONFIG: TaxConfig = {
  enabled: false,
  name: 'IVA',
  percentage: 16,
  mode: 'exclusive',
  rounding: 'total'
};

type View = 'login' | 'dashboard' | 'gestion' | 'menu_editor' | 'menu_ordering' | 'historial' | 'turno_gestion' | 'audit_log' | 'tax_settings' | 'promotions' | 'registro_ventas' | 'visual_settings' | 'inventory';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('login');

  // Independent scale states for each major view
  const [dashboardScale, setDashboardScale] = useState<UIScale>('medium');
  const [gestionScale, setGestionScale] = useState<UIScale>('medium');
  const [menuEditorScale, setMenuEditorScale] = useState<UIScale>('medium');
  const [menuOrderingScale, setMenuOrderingScale] = useState<UIScale>('medium');
  const [historyScale, setHistoryScale] = useState<UIScale>('medium');
  const [turnoScale, setTurnoScale] = useState<UIScale>('medium');
  const [promotionsScale, setPromotionsScale] = useState<UIScale>('medium');
  const [ticketWidth, setTicketWidth] = useState<number>(80);

  // Independent orientation states
  const [dashboardOrientation, setDashboardOrientation] = useState<LayoutOrientation>('vertical');
  const [gestionOrientation, setGestionOrientation] = useState<LayoutOrientation>('vertical');
  const [menuEditorOrientation, setMenuEditorOrientation] = useState<LayoutOrientation>('vertical');
  const [menuOrderingOrientation, setMenuOrderingOrientation] = useState<LayoutOrientation>('vertical');
  const [historyOrientation, setHistoryOrientation] = useState<LayoutOrientation>('vertical');
  const [turnoOrientation, setTurnoOrientation] = useState<LayoutOrientation>('horizontal');
  const [promotionsOrientation, setPromotionsOrientation] = useState<LayoutOrientation>('horizontal');

  // Visual Settings
  const [loginTheme, setLoginTheme] = useState<Theme>(() => (localStorage.getItem('rp_login_theme') as Theme) || 'dark');
  const [theme, setTheme] = useState<Theme>(loginTheme);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [isPreviewingSetup, setIsPreviewingSetup] = useState(false);
  const [globalScale, setGlobalScale] = useState<number>(() => {
    const saved = localStorage.getItem('rp_global_scale');
    return saved ? Number(saved) : 1;
  });
  const [performanceMode, setPerformanceMode] = useState<boolean>(() => localStorage.getItem('rp_performance_mode') === 'true');
  const [showImages, setShowImages] = useState<boolean>(() => {
    const saved = localStorage.getItem('rp_show_images');
    return saved === null ? true : saved === 'true';
  });

  // Promotions State
  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('rp_promotions');
    return saved ? JSON.parse(saved) : [];
  });

  // Inventory (Supplies) State
  const [supplies, setSupplies] = useState<SupplyItem[]>(() => {
    const saved = localStorage.getItem('rp_supplies');
    return saved ? JSON.parse(saved) : [];
  });

  // Save Inventory
  useEffect(() => {
    localStorage.setItem('rp_supplies', JSON.stringify(supplies));
  }, [supplies]);

  // Load theme preferences based on user or login state
  useEffect(() => {
    if (user) {
      const savedUserTheme = localStorage.getItem(`theme_${user.username}`) as Theme;
      setTheme(savedUserTheme || 'dark');

      // Restore UI scales and other preferences
      const savedDash = localStorage.getItem(`uiScale_dashboard_${user.username}`);
      const savedGest = localStorage.getItem(`uiScale_gestion_${user.username}`);
      const savedMenuEdit = localStorage.getItem(`uiScale_menu_editor_${user.username}`) || localStorage.getItem(`uiScale_menu_${user.username}`);
      const savedMenuOrder = localStorage.getItem(`uiScale_menu_ordering_${user.username}`) || localStorage.getItem(`uiScale_menu_${user.username}`);
      const savedHist = localStorage.getItem(`uiScale_history_${user.username}`);
      const savedTurno = localStorage.getItem(`uiScale_turno_${user.username}`);
      const savedPromotions = localStorage.getItem(`uiScale_promotions_${user.username}`);
      const savedDashOrient = localStorage.getItem(`layoutOrientation_dashboard_${user.username}`);
      const savedGestOrient = localStorage.getItem(`layoutOrientation_gestion_${user.username}`);
      const savedMenuEditOrient = localStorage.getItem(`layoutOrientation_menu_editor_${user.username}`) || localStorage.getItem(`layoutOrientation_${user.username}`);
      const savedMenuOrderOrient = localStorage.getItem(`layoutOrientation_menu_ordering_${user.username}`) || localStorage.getItem(`layoutOrientation_${user.username}`);
      const savedHistOrient = localStorage.getItem(`layoutOrientation_history_${user.username}`);
      const savedTurnoOrient = localStorage.getItem(`layoutOrientation_turno_${user.username}`);
      const savedPromotionsOrient = localStorage.getItem(`layoutOrientation_promotions_${user.username}`);
      const savedTicketWidth = localStorage.getItem(`ticketWidth_${user.username}`);

      if (savedDash) setDashboardScale(savedDash as UIScale);
      if (savedGest) setGestionScale(savedGest as UIScale);
      if (savedMenuEdit) setMenuEditorScale(savedMenuEdit as UIScale);
      if (savedMenuOrder) setMenuOrderingScale(savedMenuOrder as UIScale);
      if (savedHist) setHistoryScale(savedHist as UIScale);
      if (savedTurno) setTurnoScale(savedTurno as UIScale);
      if (savedPromotions) setPromotionsScale(savedPromotions as UIScale);

      if (savedDashOrient) setDashboardOrientation(savedDashOrient as LayoutOrientation);
      if (savedGestOrient) setGestionOrientation(savedGestOrient as LayoutOrientation);
      if (savedMenuEditOrient) setMenuEditorOrientation(savedMenuEditOrient as LayoutOrientation);
      if (savedMenuOrderOrient) setMenuOrderingOrientation(savedMenuOrderOrient as LayoutOrientation);
      if (savedHistOrient) setHistoryOrientation(savedHistOrient as LayoutOrientation);
      if (savedTurnoOrient) setTurnoOrientation(savedTurnoOrient as LayoutOrientation);
      if (savedPromotionsOrient) setPromotionsOrientation(savedPromotionsOrient as LayoutOrientation);
      if (savedTicketWidth) setTicketWidth(Number(savedTicketWidth));

      const savedAnim = localStorage.getItem(`animations_${user.username}`);
      if (savedAnim) setAnimationsEnabled(savedAnim === 'true');
    } else {
      setTheme(loginTheme);
    }
  }, [user, loginTheme]);

  // Apply Theme, Animations classes and Global Scale
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--global-scale', globalScale.toString());
    if (!animationsEnabled) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }

    if (performanceMode) {
      document.body.classList.add('performance-mode');
    } else {
      document.body.classList.remove('performance-mode');
    }
  }, [theme, animationsEnabled, performanceMode]);

  // Save UI settings only when user is logged in
  useEffect(() => { if (user) localStorage.setItem(`uiScale_dashboard_${user.username}`, dashboardScale); }, [dashboardScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`uiScale_gestion_${user.username}`, gestionScale); }, [gestionScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`uiScale_menu_editor_${user.username}`, menuEditorScale); }, [menuEditorScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`uiScale_menu_ordering_${user.username}`, menuOrderingScale); }, [menuOrderingScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`uiScale_history_${user.username}`, historyScale); }, [historyScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`uiScale_turno_${user.username}`, turnoScale); }, [turnoScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`uiScale_promotions_${user.username}`, promotionsScale); }, [promotionsScale, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_dashboard_${user.username}`, dashboardOrientation); }, [dashboardOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_gestion_${user.username}`, gestionOrientation); }, [gestionOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_menu_editor_${user.username}`, menuEditorOrientation); }, [menuEditorOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_menu_ordering_${user.username}`, menuOrderingOrientation); }, [menuOrderingOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_history_${user.username}`, historyOrientation); }, [historyOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_turno_${user.username}`, turnoOrientation); }, [turnoOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`layoutOrientation_promotions_${user.username}`, promotionsOrientation); }, [promotionsOrientation, user]);
  useEffect(() => { if (user) localStorage.setItem(`ticketWidth_${user.username}`, ticketWidth.toString()); }, [ticketWidth, user]);
  useEffect(() => { if (user) localStorage.setItem(`animations_${user.username}`, animationsEnabled.toString()); }, [animationsEnabled, user]);
  useEffect(() => { localStorage.setItem('rp_global_scale', globalScale.toString()); }, [globalScale]);
  useEffect(() => { localStorage.setItem('rp_performance_mode', performanceMode.toString()); }, [performanceMode]);
  useEffect(() => { localStorage.setItem('rp_show_images', showImages.toString()); }, [showImages]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Handle theme updates manually to avoid race conditions during login/logout
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (user) {
      localStorage.setItem(`theme_${user.username}`, newTheme);
    } else {
      setLoginTheme(newTheme);
      localStorage.setItem('rp_login_theme', newTheme);
    }
  };

  // Persistence logic - Initializing states with localStorage if available
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem('rp_setup_complete') === 'true';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rp_users');
    return saved ? JSON.parse(saved) : (localStorage.getItem('rp_setup_complete') === 'true' ? INITIAL_USERS : []); // Only load defaults if setup was previously done (legacy) or empty if new logic
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('rp_categories');
    return saved ? JSON.parse(saved) : ['Comida', 'Bebidas', 'Extras'];
  });

  const [subCategories, setSubCategories] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('rp_subcategories');
    return saved ? JSON.parse(saved) : {};
  });

  const [sections, setSections] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('rp_sections');
    return saved ? JSON.parse(saved) : {};
  });

  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('rp_menu');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [history, setHistory] = useState<Order[]>(() => {
    // Reset order history as requested by user
    localStorage.removeItem('rp_history');
    return [];
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem('rp_shifts');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentShiftId, setCurrentShiftId] = useState<string | null>(() => {
    return localStorage.getItem('rp_currentShiftId');
  });

  // Audit Log State
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('rp_auditLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditConfig, setAuditConfig] = useState<AuditConfig>(() => {
    const saved = localStorage.getItem('rp_auditConfig');
    return saved ? JSON.parse(saved) : DEFAULT_AUDIT_CONFIG;
  });

  const [taxConfig, setTaxConfig] = useState<TaxConfig>(() => {
    const saved = localStorage.getItem('rp_taxConfig');
    return saved ? JSON.parse(saved) : DEFAULT_TAX_CONFIG;
  });

  // Helper to log actions
  const logAction = (action: AuditAction, details: string, entityId?: string) => {
    if (!user) return; // Should not happen if logged in

    // Check if action is enabled (audit_config_update and tax_config_update are ALWAYS enabled)
    if (action !== 'audit_config_update' && action !== 'tax_config_update' && !auditConfig[action]) return;

    const newEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      action,
      details,
      entityId
    };
    setAuditLog(prev => [newEntry, ...prev].slice(0, 100));
  };

  const toggleAuditAction = (action: AuditAction) => {
    if (action === 'audit_config_update' || action === 'tax_config_update') return;

    const actionLabels: Record<string, string> = {
      user_login: 'Inicio de Sesión',
      user_logout: 'Cierre de Sesión',
      user_create: 'Crear Usuario',
      user_update: 'Actualizar Usuario',
      user_delete: 'Eliminar Usuario',
      user_status_change: 'Estado Usuario',
      shift_open: 'Abrir Turno',
      shift_close: 'Cerrar Turno',
      menu_create: 'Crear Producto',
      menu_update: 'Editar Producto',
      menu_delete: 'Eliminar Producto',
      menu_stock_toggle: 'Disponibilidad (Stock)',
      category_create: 'Crear Categoría',
      category_rename: 'Renombrar Categoría',
      category_delete: 'Eliminar Categoría',
      subcategory_create: 'Crear Subcategoría',
      subcategory_rename: 'Renombrar Subcategoría',
      subcategory_delete: 'Eliminar Subcategoría',
      section_create: 'Crear Sección',
      section_rename: 'Renombrar Sección',
      section_delete: 'Eliminar Sección',
      ticket_reprint: 'Reimpresión de Ticket',
      promotion_create: 'Crear Promoción',
      promotion_update: 'Editar Promoción',
      promotion_delete: 'Eliminar Promoción',
      promotion_toggle: 'Estado de la Promoción'
    };

    const newValue = !auditConfig[action];
    setAuditConfig((prev: AuditConfig) => ({ ...prev, [action]: newValue }));

    const label = actionLabels[action] || action;
    logAction('audit_config_update', `Configuración cambiada: ${label} ahora está ${newValue ? 'activada' : 'desactivada'}`);
  };

  // Derived state
  const isShiftOpen = !!currentShiftId;

  // Sync state to localStorage on changes
  useEffect(() => { localStorage.setItem('rp_users', JSON.stringify(users)); }, [users]);

  // Seed temporary users if missing (requested for testing)
  useEffect(() => {
    const hasGerente = users.some(u => u.username === 'Gerente');
    const hasMesero = users.some(u => u.username === 'Mesero');
    if (!hasGerente || !hasMesero) {
      const missingUsers = INITIAL_USERS.filter(u =>
        (u.username === 'Gerente' && !hasGerente) ||
        (u.username === 'Mesero' && !hasMesero)
      );
      if (missingUsers.length > 0) {
        setUsers(prev => [...prev, ...missingUsers]);
      }
    }
  }, [users]);
  useEffect(() => { localStorage.setItem('rp_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('rp_subcategories', JSON.stringify(subCategories)); }, [subCategories]);
  useEffect(() => { localStorage.setItem('rp_sections', JSON.stringify(sections)); }, [sections]);
  useEffect(() => { localStorage.setItem('rp_menu', JSON.stringify(menu)); }, [menu]);
  useEffect(() => { localStorage.setItem('rp_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('rp_shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => {
    if (currentShiftId) localStorage.setItem('rp_currentShiftId', currentShiftId);
    else localStorage.removeItem('rp_currentShiftId');
  }, [currentShiftId]);
  useEffect(() => { localStorage.setItem('rp_promotions', JSON.stringify(promotions)); }, [promotions]);
  useEffect(() => { localStorage.setItem('rp_auditLogs', JSON.stringify(auditLog)); }, [auditLog]);
  useEffect(() => { localStorage.setItem('rp_auditConfig', JSON.stringify(auditConfig)); }, [auditConfig]);
  useEffect(() => { localStorage.setItem('rp_taxConfig', JSON.stringify(taxConfig)); }, [taxConfig]);


  const handleLogin = (loggedInUser: User) => {
    const today = new Date().toISOString().split('T')[0];

    // Track unique login dates
    setUsers(prev => prev.map(u => {
      if (u.username === loggedInUser.username) {
        const dates = u.loginDates || [];
        if (!dates.includes(today)) {
          return { ...u, loginDates: [...dates, today] };
        }
      }
      return u;
    }));

    // Find the updated user to set as the active user
    const updatedUser = users.find(u => u.username === loggedInUser.username) || loggedInUser;
    setUser(updatedUser);
    setView('dashboard');

    // Log Login (Directly here since we have user context)
    // Only if enabled in config
    if (auditConfig.user_login) {
      const loginEntry: AuditLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userId: loggedInUser.id,
        username: loggedInUser.username,
        action: 'user_login',
        details: 'Usuario inició sesión',
        entityId: loggedInUser.id
      };
      setAuditLog(prev => [loginEntry, ...prev].slice(0, 100));
    }
  };

  const handleLogout = () => {
    if (user) {
      if (auditConfig.user_logout) {
        const logoutEntry: AuditLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userId: user.id,
          username: user.username,
          action: 'user_logout',
          details: 'Usuario cerró sesión',
          entityId: user.id
        };
        setAuditLog(prev => [logoutEntry, ...prev].slice(0, 100));
      }
    }

    setUser(null);
    setView('login');
  };

  const goBack = () => setView('dashboard');

  const handleSetupComplete = (devPassword: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newDev: User = {
      id: 'dev-001',
      username: 'Desarrollador',
      role: 'developer',
      password: devPassword, // Set user defined password
      registrationDate: today,
      birthDate: '1990-01-01',
      loginDates: []
    };

    // We also initialize other default users for testing as requested
    const initialUsersWithDev = [
      newDev,
      ...INITIAL_USERS.filter(u => u.username !== 'Desarrollador') // Add Gerente and Mesero
    ];

    setUsers(initialUsersWithDev);
    setIsSetupComplete(true);
    localStorage.setItem('rp_users', JSON.stringify(initialUsersWithDev));
    localStorage.setItem('rp_setup_complete', 'true');

    // Auto-login the dev
    handleLogin(newDev);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div className="watermark">Synkode®<br /><span style={{ fontSize: '12px', opacity: 0.8 }}>Version 0.2.0</span></div>

      {(!isSetupComplete || isPreviewingSetup) ? (
        <SetupWizard
          onComplete={isPreviewingSetup ? () => setIsPreviewingSetup(false) : handleSetupComplete}
          theme={theme}
          setTheme={updateTheme}
        />
      ) : (!user) ? (
        <Login
          users={users}
          onLogin={handleLogin}
          isShiftOpen={isShiftOpen}
          onShowSetup={() => setIsPreviewingSetup(true)}
          theme={theme}
          setTheme={updateTheme}
        />
      ) : view === 'dashboard' ? (
        <Dashboard
          user={user}
          goTo={(page) => setView(page)}
          onLogout={handleLogout}
          uiScale={dashboardScale}
          setUiScale={setDashboardScale}
          layoutOrientation={dashboardOrientation}
          setLayoutOrientation={setDashboardOrientation}
          isShiftOpen={isShiftOpen}
          taxConfig={taxConfig}
        />
      ) : view === 'visual_settings' ? (
        <VisualSettings
          theme={theme}
          setTheme={updateTheme}
          animationsEnabled={animationsEnabled}
          setAnimationsEnabled={setAnimationsEnabled}
          globalScale={globalScale}
          setGlobalScale={setGlobalScale}
          performanceMode={performanceMode}
          setPerformanceMode={setPerformanceMode}
          showImages={showImages}
          setShowImages={setShowImages}
          back={goBack}
          user={user}
        />
      ) : view === 'gestion' ? (
        <UserManagement
          user={user}
          users={users}
          setUsers={setUsers}
          back={goBack}
          uiScale={gestionScale}
          setUiScale={setGestionScale}
          layoutOrientation={gestionOrientation}
          setLayoutOrientation={setGestionOrientation}
          isShiftOpen={isShiftOpen}
          logAction={logAction}
        />
      ) : (view === 'menu_ordering' || view === 'menu_editor') ? (
        <MenuEditor
          user={user}
          menu={menu}
          setMenu={setMenu}
          categories={categories}
          setCategories={setCategories}
          subCategories={subCategories}
          setSubCategories={setSubCategories}
          sections={sections}
          setSections={setSections}
          back={goBack}
          isOrderingMode={view === 'menu_ordering'}
          setHistory={setHistory}
          history={history}
          uiScale={view === 'menu_ordering' ? menuOrderingScale : menuEditorScale}
          setUiScale={view === 'menu_ordering' ? setMenuOrderingScale : setMenuEditorScale}
          layoutOrientation={view === 'menu_ordering' ? menuOrderingOrientation : menuEditorOrientation}
          setLayoutOrientation={view === 'menu_ordering' ? setMenuOrderingOrientation : setMenuEditorOrientation}
          currentShiftId={currentShiftId}
          logAction={logAction}
          ticketWidth={ticketWidth}
          setTicketWidth={setTicketWidth}
          taxConfig={taxConfig}
          promotions={promotions}
          showImages={showImages}
        />
      ) : view === 'promotions' && user ? (
        <Promotions
          back={() => setView('dashboard')}
          promotions={promotions}
          setPromotions={setPromotions}
          menu={menu}
          categories={categories}
          subCategories={subCategories}
          sections={sections}
          uiScale={promotionsScale}
          setUiScale={setPromotionsScale}
          layoutOrientation={promotionsOrientation}
          setLayoutOrientation={setPromotionsOrientation}
          logAction={logAction}
          user={user}
        />
      ) : view === 'historial' && user ? (
        <History
          user={user}
          history={history}
          back={goBack}
          uiScale={historyScale}
          setUiScale={setHistoryScale}
          layoutOrientation={historyOrientation}
          setLayoutOrientation={setHistoryOrientation}
          ticketWidth={ticketWidth}
          setTicketWidth={setTicketWidth}
          shifts={shifts}
          currentShiftId={currentShiftId}
          logAction={logAction}
        />
      ) : view === 'registro_ventas' && user ? (
        <SalesRecords
          history={history}
          shifts={shifts}
          currentShiftId={currentShiftId}
          back={goBack}
          uiScale={dashboardScale}
          setUiScale={setDashboardScale}
          layoutOrientation={dashboardOrientation}
          setLayoutOrientation={setDashboardOrientation}
        />
      ) : view === 'inventory' && user ? (
        <SupplyManagement
          supplies={supplies}
          setSupplies={setSupplies}
          back={goBack}
          logAction={logAction}
        />
      ) : view === 'turno_gestion' && user ? (
        <ShiftManagement
          user={user}
          back={goBack}
          isShiftOpen={isShiftOpen}
          shifts={shifts}
          setShifts={setShifts}
          currentShiftId={currentShiftId}
          setCurrentShiftId={setCurrentShiftId}
          history={history}
          uiScale={turnoScale}
          setUiScale={setTurnoScale}
          layoutOrientation={turnoOrientation}
          setLayoutOrientation={setTurnoOrientation}
          logAction={logAction}
        />
      ) : view === 'audit_log' && user ? (
        <AuditLog
          user={user}
          auditLog={auditLog}
          users={users}
          back={goBack}
          uiScale={dashboardScale} // Use dashboard scale 
          setUiScale={setDashboardScale}
          layoutOrientation={dashboardOrientation}
          setLayoutOrientation={setDashboardOrientation}
          auditConfig={auditConfig}
          toggleAuditAction={toggleAuditAction}
        />
      ) : view === 'tax_settings' && user?.role === 'developer' ? (
        <TaxSettings
          user={user}
          taxConfig={taxConfig}
          setTaxConfig={setTaxConfig}
          back={goBack}
          uiScale={dashboardScale}
          layoutOrientation={dashboardOrientation}
          logAction={logAction}
        />
      ) : (
        <div style={{ padding: 20, color: 'white' }}>
          <h1>Página no encontrada o en construcción: {view}</h1>
          <button onClick={goBack}>Volver al panel</button>
        </div>
      )}
    </div>
  );
}

export default App;
