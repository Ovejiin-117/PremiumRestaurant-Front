import type { User, UIScale, LayoutOrientation } from "../types";
import SettingsControls from "../components/ui/SettingsControls";

type Props = {
    user: User;
    goTo: (page: "gestion" | "menu_editor" | "menu_ordering" | "historial" | "turno_gestion" | "audit_log" | "tax_settings" | "promotions" | "registro_ventas" | "visual_settings" | "inventory") => void;
    onLogout: () => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    isShiftOpen: boolean;
    taxConfig: import('../types').TaxConfig;
};

export default function Dashboard({
    user, goTo, onLogout,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation,
    isShiftOpen,
    taxConfig
}: Props) {
    const isAdmin = user.role === "developer";
    const isManager = user.role === "manager";
    const canViewManagement = isAdmin || isManager;

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container">
                <div className="title-bar">
                    <div>
                        <div style={{ opacity: 0.8, fontSize: "0.875em" }}>
                            Sesión <span style={{
                                background: isAdmin ? "#a855f7" : isManager ? "#3b82f6" : "#22c55e",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "0.625em",
                                textTransform: "uppercase"
                            }}>{user.role}</span>
                        </div>
                        <div style={{ fontSize: "1.25em", fontWeight: 700 }}>{user.username}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                        <button
                            onClick={onLogout}
                            style={{
                                height: "2.2em",
                                padding: "0 1.25em",
                                borderRadius: "0.75em",
                                border: "1px solid var(--card-border)",
                                background: "var(--card-hover-bg)",
                                color: "var(--text-color)",
                                cursor: "pointer",
                                fontSize: "0.85em",
                                fontWeight: 700,
                                fontFamily: "inherit",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>

                <h1 className="page-main-title">PANEL PRINCIPAL</h1>

                <div className="card-grid">
                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("turno_gestion")}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Gestión de Turno</div>
                                <div style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "2px",
                                    background: isShiftOpen ? "#22c55e" : "#ef4444",
                                    boxShadow: isShiftOpen ? "0 0 8px #22c55e" : "0 0 8px #ef4444"
                                }}></div>
                            </div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Abrir/Cerrar turno y ver estadísticas de ventas.</div>
                        </div>
                    )}

                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("gestion")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Gestión de Usuarios</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>
                                {isAdmin ? "Crear y administrar usuarios del sistema." : "Administrar meseros y usuarios."}
                            </div>
                        </div>
                    )}

                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("menu_editor")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Editor de Menú</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Configurar categorías, subcategorías y productos.</div>
                        </div>
                    )}

                    <div className="glass-card" onClick={() => goTo("menu_ordering")}>
                        <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Menú General</div>
                        <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Ver productos y procesar nuevas órdenes.</div>
                    </div>

                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("promotions")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Editor de Promociones</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Crear y configurar descuentos y ofertas.</div>
                        </div>
                    )}

                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("inventory")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Control de Insumos</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Gestión de inventario base y existencias en bodega.</div>
                        </div>
                    )}

                    <div className="glass-card" onClick={() => goTo("historial")}>
                        <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Historial de Tickets</div>
                        <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Revisar órdenes procesadas y reimprimir tickets.</div>
                    </div>

                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("registro_ventas")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Historial de Ventas</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Visualizar ventas detalladas, filtrar por fechas y ver totales.</div>
                        </div>
                    )}

                    {canViewManagement && (
                        <div className="glass-card" onClick={() => goTo("audit_log")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Registros de Auditoría</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Registro inmutable de actividades y cambios del sistema.</div>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="glass-card" onClick={() => goTo("tax_settings")}>
                            <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Configuración de Impuestos</div>
                            <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>
                                {taxConfig.enabled ? `${taxConfig.name} (${taxConfig.percentage}%) activado.` : "Impuestos actualmente desactivados."}
                            </div>
                        </div>
                    )}

                    <div className="glass-card" onClick={() => goTo("visual_settings")}>
                        <div style={{ fontSize: "1.125em", fontWeight: 700 }}>Configuración Visual</div>
                        <div style={{ opacity: 0.8, marginTop: "0.5em", fontSize: '0.9em' }}>Ajustar tema, animaciones y apariencia del sistema.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
