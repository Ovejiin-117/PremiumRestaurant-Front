import { useState, useMemo, useEffect, useRef } from 'react';
import type { AuditLogEntry, User, UIScale, LayoutOrientation, AuditAction, AuditConfig } from '../types';
import SettingsControls from '../components/ui/SettingsControls';

interface Props {
    user: User;
    auditLog: AuditLogEntry[];
    users: User[];
    back: () => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    auditConfig: AuditConfig;
    toggleAuditAction: (action: AuditAction) => void;
}

const ACTION_OPTIONS: { value: AuditAction | "all", label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'user_login', label: 'Inicio de Sesión' },
    { value: 'user_logout', label: 'Cierre de Sesión' },
    { value: 'user_create', label: 'Crear Usuario' },
    { value: 'user_update', label: 'Actualizar Usuario' },
    { value: 'user_delete', label: 'Eliminar Usuario' },
    { value: 'user_status_change', label: 'Estado Usuario' },
    { value: 'shift_open', label: 'Abrir Turno' },
    { value: 'shift_close', label: 'Cerrar Turno' },
    { value: 'menu_create', label: 'Crear Producto' },
    { value: 'menu_update', label: 'Editar Producto' },
    { value: 'menu_delete', label: 'Eliminar Producto' },
    { value: 'menu_stock_toggle', label: 'Disponibilidad (Stock)' },
    { value: 'category_create', label: 'Crear Categoría' },
    { value: 'category_rename', label: 'Renombrar Categoría' },
    { value: 'category_delete', label: 'Eliminar Categoría' },
    { value: 'subcategory_create', label: 'Crear Subcategoría' },
    { value: 'subcategory_rename', label: 'Renombrar Subcategoría' },
    { value: 'subcategory_delete', label: 'Eliminar Subcategoría' },
    { value: 'section_create', label: 'Crear Sección' },
    { value: 'section_rename', label: 'Renombrar Sección' },
    { value: 'section_delete', label: 'Eliminar Sección' },
    { value: 'ticket_reprint', label: 'Reimpresión de Ticket' },
    { value: 'audit_config_update', label: 'Configuración de Auditoría' },
    { value: 'tax_config_update', label: 'Configuración de Impuestos' },
    { value: 'promotion_create', label: 'Crear Promoción' },
    { value: 'promotion_update', label: 'Editar Promoción' },
    { value: 'promotion_delete', label: 'Eliminar Promoción' },
    { value: 'promotion_toggle', label: 'Estado de la Promoción' }
];

// --- Subcomponent: Robust Searchable Dropdown ---
const FilterDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    label
}: {
    value: string,
    onChange: (val: string) => void,
    options: { value: string, label: string }[],
    placeholder: string,
    label: string
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search term to selected value on close if no new value picked
                setIsTyping(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync input with value when not typing
    useEffect(() => {
        if (!isTyping) {
            const current = options.find(o => o.value === value);
            setSearchTerm(current ? current.label : "");
        }
    }, [value, isTyping, options]);

    // Derived filtered options
    const filtered = useMemo(() => {
        // Show all if the search term exactly matches the current selected label (meaning user hasn't typed a new search yet)
        const current = options.find(o => o.value === value);
        if (current && searchTerm === current.label && !isTyping) return options;

        return options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm, value, isTyping]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setIsTyping(false);
    };

    return (
        <div ref={wrapperRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5em', width: '100%', position: 'relative' }}>
            <label style={{ fontSize: '0.75em', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{label}</label>

            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={searchTerm}
                    placeholder={placeholder}
                    onClick={() => setIsOpen(true)}
                    onFocus={(e) => {
                        setIsOpen(true);
                        e.target.select();
                    }}
                    onChange={(e) => {
                        setIsTyping(true);
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    style={{
                        width: '100%',
                        padding: '0.75em 2.5em 0.75em 1em',
                        background: 'var(--input-bg)',
                        border: isOpen ? '1px solid var(--primary-color)' : '1px solid var(--card-border)',
                        borderRadius: '0.5em',
                        color: 'var(--text-color)',
                        fontSize: '0.95em',
                        outline: 'none',
                        transition: 'all 0.2s',
                        cursor: 'text',
                        boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                        boxSizing: 'border-box'
                    }}
                />

                {/* Arrow Icon */}
                <div style={{
                    position: 'absolute',
                    right: '1em',
                    top: '50%',
                    transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
                    transition: 'transform 0.2s',
                    pointerEvents: 'none',
                    opacity: 0.5,
                    fontSize: '0.8em',
                    color: 'var(--text-color)'
                }}>▼</div>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        maxHeight: '280px',
                        overflowY: 'auto',
                        background: 'var(--card-bg)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '14px',
                        zIndex: 9999,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        padding: '6px',
                        animation: 'selectSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        scrollbarWidth: 'none'
                    }}>
                        {filtered.length > 0 ? (
                            filtered.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        background: opt.value === value ? 'var(--primary-color-alpha-20)' : 'transparent',
                                        color: opt.value === value ? 'var(--primary-color)' : 'var(--text-color)',
                                        fontSize: '0.9em',
                                        fontWeight: opt.value === value ? 'bold' : '500',
                                        marginBottom: '2px',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = opt.value === value ? 'var(--primary-color-alpha-20)' : 'var(--card-hover-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = opt.value === value ? 'var(--primary-color-alpha-20)' : 'transparent'}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5, fontStyle: 'italic', fontSize: '0.9em', color: 'var(--text-color)' }}>
                                No se encontraron resultados
                            </div>
                        )}
                        <style>{`
                            @keyframes selectSlideIn {
                                from { opacity: 0; transform: translateY(-12px) scale(0.95); }
                                to { opacity: 1; transform: translateY(0) scale(1); }
                            }
                            div::-webkit-scrollbar { display: none; }
                        `}</style>
                    </div>
                )}

            </div>
        </div>
    );
};


export default function AuditLog({
    user, auditLog, users, back,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation,
    auditConfig, toggleAuditAction
}: Props) {
    const [filterUser, setFilterUser] = useState("all");
    const [filterAction, setFilterAction] = useState<AuditAction | "all">("all");
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Prepare User Options (Unique from log + registered users)
    const userOptions = useMemo(() => {
        const uniqueNames = new Set([...users.map(u => u.username), ...auditLog.map(l => l.username)]);
        return [
            { value: 'all', label: 'Todos' },
            ...Array.from(uniqueNames).sort().map(u => ({ value: u, label: u }))
        ];
    }, [users, auditLog]);

    // Sorting
    const sortedLog = useMemo(() => {
        return [...auditLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditLog]);

    // Filtering
    const filteredLog = useMemo(() => {
        return sortedLog.filter(entry => {
            if (filterUser !== "all" && entry.username !== filterUser) return false;
            if (filterAction !== "all" && entry.action !== filterAction) return false;
            return true;
        });
    }, [sortedLog, filterUser, filterAction]);

    const toggleExpand = (id: string) => {
        const next = new Set(expandedEntries);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedEntries(next);
    };

    const getActionMeta = (action: AuditAction) => {
        switch (action) {
            case 'user_create': return { color: '#22c55e', icon: '👤+', label: 'Alta Usuario' };
            case 'user_delete': return { color: '#ef4444', icon: '👤-', label: 'Baja Usuario' };
            case 'user_update': return { color: '#f59e0b', icon: '👤✎', label: 'Edición Usuario' };
            case 'user_status_change': return { color: '#f59e0b', icon: '👤⚡', label: 'Estado Usuario' };
            case 'user_login': return { color: '#3b82f6', icon: '🔑', label: 'Inicio Sesión' };
            case 'user_logout': return { color: '#64748b', icon: '🚪', label: 'Cierre Sesión' };

            case 'shift_open': return { color: '#22c55e', icon: '🕒', label: 'Inicio Turno' };
            case 'shift_close': return { color: '#ef4444', icon: '🏁', label: 'Fin Turno' };

            case 'menu_create': return { color: '#8b5cf6', icon: '🍔+', label: 'Nuevo Producto' };
            case 'menu_update': return { color: '#3b82f6', icon: '🍔✎', label: 'Editar Producto' };
            case 'menu_delete': return { color: '#ef4444', icon: '🍔-', label: 'Eliminar Prod.' };
            case 'menu_stock_toggle': return { color: '#10b981', icon: '📦', label: 'Stock Producto' };

            case 'category_create': return { color: '#8b5cf6', icon: '📂+', label: 'Nueva Categoría' };
            case 'category_rename': return { color: '#3b82f6', icon: '📂✎', label: 'Renombrar Categoría' };
            case 'category_delete': return { color: '#ef4444', icon: '📂-', label: 'Eliminar Categoría' };

            case 'subcategory_create': return { color: '#8b5cf6', icon: '📁+', label: 'Nueva Subcategoría' };
            case 'subcategory_rename': return { color: '#3b82f6', icon: '📁✎', label: 'Renombrar Subcategoría' };
            case 'subcategory_delete': return { color: '#ef4444', icon: '📁-', label: 'Eliminar Subcategoría' };

            case 'section_create': return { color: '#8b5cf6', icon: '📑+', label: 'Nueva Sección' };
            case 'section_rename': return { color: '#3b82f6', icon: '📑✎', label: 'Renombrar Sección' };
            case 'section_delete': return { color: '#ef4444', icon: '📑-', label: 'Eliminar Sección' };

            case 'ticket_reprint': return { color: '#eab308', icon: '🖨️', label: 'Reimpresión de Ticket' };
            case 'audit_config_update': return { color: '#ec4899', icon: '🛡️', label: 'Configuración de Auditoría' };
            case 'tax_config_update': return { color: '#06b6d4', icon: '💰', label: 'Configuración de Impuestos' };
            case 'promotion_create': return { color: '#f97316', icon: '🏷️+', label: 'Nueva Promoción' };
            case 'promotion_update': return { color: '#f97316', icon: '🏷️✎', label: 'Editar Promoción' };
            case 'promotion_delete': return { color: '#ef4444', icon: '🏷️-', label: 'Eliminar Promoción' };
            case 'promotion_toggle': return { color: '#f97316', icon: '🏷️⚡', label: 'Estado de la Promoción' };

            default: return { color: '#94a3b8', icon: '📝', label: 'Evento' };
        }
    };

    const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4em' }}>

                {/* Header */}
                <div className="title-bar" style={{ marginBottom: '2em' }}>
                    <div>
                        <button onClick={back} className="btn-back" style={{ marginBottom: "1em" }}>
                            ← Volver al panel
                        </button>

                        <h1 style={{ margin: 0, fontSize: '2em', fontWeight: 600 }}>Registros de auditoría</h1>
                    </div>
                    <SettingsControls
                        uiScale={uiScale} setUiScale={setUiScale}
                        layoutOrientation={layoutOrientation} setLayoutOrientation={setLayoutOrientation}
                        showOrientation={false}
                    />
                </div>

                {/* Filter Grid */}
                {/* Filter Grid */}
                <div style={{
                    display: 'flex',
                    gap: '2em',
                    marginBottom: '2em',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        flex: '0 1 18em',
                        minWidth: '15em',
                        background: 'var(--card-bg)',
                        padding: '1.2em',
                        borderRadius: '1em',
                        border: '1px solid var(--card-border)',
                        boxSizing: 'border-box'
                    }}>
                        <FilterDropdown
                            label="Filtrar por Usuario"
                            placeholder="Buscar usuario..."
                            value={filterUser}
                            onChange={setFilterUser}
                            options={userOptions}
                        />
                    </div>
                    <div style={{
                        flex: '0 1 18em',
                        minWidth: '15em',
                        background: 'var(--card-bg)',
                        padding: '1.2em',
                        borderRadius: '1em',
                        border: '1px solid var(--card-border)',
                        boxSizing: 'border-box'
                    }}>
                        <FilterDropdown
                            label="Filtrar por Acción"
                            placeholder="Buscar acción..."
                            value={filterAction}
                            onChange={(v) => setFilterAction(v as AuditAction | "all")}
                            options={ACTION_OPTIONS}
                        />
                    </div>

                    {/* Developer Configuration Button */}
                    {user.role === 'developer' && (
                        <div style={{
                            flex: '0 0 auto',
                            display: 'flex',
                            alignItems: 'flex-end',
                            paddingBottom: '0.2em'
                        }}>
                            <button
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                style={{
                                    background: isConfigOpen ? 'var(--primary-color)' : 'var(--card-bg)',
                                    color: isConfigOpen ? 'white' : 'var(--text-color)',
                                    border: '1px solid var(--card-border)',
                                    borderRadius: '1em',
                                    padding: '1.2em 1.5em',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75em',
                                    fontSize: '0.9em',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box',
                                    height: '100%'
                                }}
                            >
                                <span style={{ fontSize: '1.2em' }}>⚙️</span>
                                Configuración
                                <span style={{
                                    transform: isConfigOpen ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s',
                                    opacity: 0.5
                                }}>▼</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Developer Config Panel */}
                {isConfigOpen && user.role === 'developer' && (
                    <div className="glass-card" style={{
                        marginBottom: '2em',
                        padding: '1.5em',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5em' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                                <span style={{ opacity: 0.7 }}>🛡️</span> Control de Registro de Acciones
                            </h3>
                            <span style={{ fontSize: '0.8em', opacity: 0.5 }}>Las acciones desactivadas no se guardarán en el historial.</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '1em'
                        }}>
                            {ACTION_OPTIONS.filter(opt => opt.value !== 'all')
                                .sort((a, b) => {
                                    const aPerm = a.value === 'audit_config_update' || a.value === 'tax_config_update';
                                    const bPerm = b.value === 'audit_config_update' || b.value === 'tax_config_update';
                                    if (aPerm && !bPerm) return 1;
                                    if (!aPerm && bPerm) return -1;
                                    return 0;
                                })
                                .map(opt => {
                                    const action = opt.value as AuditAction;
                                    const isPermanent = action === 'audit_config_update' || action === 'tax_config_update';

                                    return (
                                        <label
                                            key={opt.value}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75em',
                                                padding: '0.75em',
                                                background: 'var(--card-hover-bg)',
                                                borderRadius: '0.5em',
                                                cursor: isPermanent ? 'not-allowed' : 'pointer',
                                                opacity: isPermanent ? 0.6 : 1,
                                                border: '1px solid var(--card-border)',
                                                transition: 'transform 0.1s'
                                            }}
                                            onMouseEnter={e => !isPermanent && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                            onMouseLeave={e => !isPermanent && (e.currentTarget.style.transform = 'translateY(0)')}
                                        >
                                            <div
                                                onClick={() => !isPermanent && toggleAuditAction(action)}
                                                style={{
                                                    width: '50px', height: '24px',
                                                    background: (isPermanent || auditConfig[action]) ? 'var(--primary-color)' : 'var(--input-border)',
                                                    borderRadius: '4px', position: 'relative',
                                                    cursor: isPermanent ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    opacity: isPermanent ? 0.6 : 1,
                                                    flexShrink: 0
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                                    position: 'absolute', top: '2px', left: (isPermanent || auditConfig[action]) ? '28px' : '2px',
                                                    transition: 'all 0.2s'
                                                }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: '0.85em', fontWeight: 500, lineHeight: 1.2, wordBreak: 'break-word' }}>{opt.label}</span>
                                                {isPermanent && <span style={{ fontSize: '0.7em', opacity: 0.5 }}>Permanente</span>}
                                            </div>
                                        </label>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                    {filteredLog.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4em', opacity: 0.5 }}>
                            <div style={{ fontSize: '3em', marginBottom: '1em' }}>🔍</div>
                            <h3 style={{ fontSize: '1.5em' }}>No se encontraron registros</h3>
                            <p style={{ fontSize: '1em' }}>Intenta ajustar los filtros de búsqueda.</p>
                        </div>
                    ) : (
                        filteredLog.map(entry => {
                            const meta = getActionMeta(entry.action);
                            const isExpanded = expandedEntries.has(entry.id);

                            return (
                                <div key={entry.id} className="glass-card" style={{
                                    padding: 0,
                                    borderLeft: `4px solid ${meta.color}`,
                                    transition: 'transform 0.1s',
                                    overflow: 'visible' // Important for Z-index if needed
                                }}>
                                    {/* Card Header (Clickable) */}
                                    <div
                                        onClick={() => toggleExpand(entry.id)}
                                        style={{
                                            padding: '1em',
                                            display: 'flex',
                                            gap: '1em',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {/* Icon Box */}
                                        <div style={{
                                            width: '2.75em', height: '2.75em', borderRadius: '0.75em',
                                            background: `${meta.color}20`, color: meta.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.25em', flexShrink: 0
                                        }}>
                                            {meta.icon}
                                        </div>

                                        {/* Main Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2em' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1em', color: 'var(--text-color)' }}>{entry.username}</span>
                                                <span style={{ fontSize: '0.8em', opacity: 0.5, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                                    {formatDate(entry.timestamp)} • {formatTime(entry.timestamp)}
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.9em',
                                                color: 'var(--text-secondary)',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: isExpanded ? 'normal' : 'nowrap'
                                            }}>
                                                {entry.details}
                                            </div>
                                        </div>

                                        {/* Chevron */}
                                        <div style={{
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s',
                                            opacity: 0.5,
                                            fontSize: '1em'
                                        }}>▼</div>
                                    </div>

                                    {/* Expanded Metadata */}
                                    {isExpanded && (
                                        <div style={{
                                            padding: '1em',
                                            background: 'var(--card-hover-bg)',
                                            borderTop: '1px solid var(--card-border)',
                                            fontSize: '0.85em',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '1em'
                                        }}>
                                            <div>
                                                <div style={{ opacity: 0.5, fontSize: '0.7em', textTransform: 'uppercase' }}>Tipo de Acción</div>
                                                <div style={{ color: meta.color }}>{meta.label}</div>
                                            </div>
                                            <div>
                                                <div style={{ opacity: 0.5, fontSize: '0.7em', textTransform: 'uppercase' }}>ID del Evento</div>
                                                <div style={{ fontFamily: 'monospace', opacity: 0.8 }}>{entry.id}</div>
                                            </div>
                                            {entry.entityId && (
                                                <div>
                                                    <div style={{ opacity: 0.5, fontSize: '0.7em', textTransform: 'uppercase' }}>ID Entidad Afectada</div>
                                                    <div style={{ fontFamily: 'monospace', opacity: 0.8 }}>{entry.entityId}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
