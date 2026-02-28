import { useState, useEffect } from "react";
import CustomSelect from "../../../components/ui/CustomSelect";
import type { User, Role, UIScale, LayoutOrientation } from "../../../types";
import SettingsControls from "../../../components/ui/SettingsControls";
import SecurityModal from "../../../components/ui/SecurityModal";

type Props = {
    user: User; // Current logged in user
    users: User[]; // All users
    setUsers: (users: User[]) => void;
    back: () => void;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    isShiftOpen: boolean;
    logAction: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
};

type Mode = 'normal' | 'delete_selection' | 'edit_selection';

// Internal component for delete confirmation (copied pattern from MenuEditor)
const DeleteConfirmBtn = ({ id, activeId, setActiveId, onDelete, style = {} }: { id: string, activeId: string | null, setActiveId: (id: string | null) => void, onDelete: () => void, style?: React.CSSProperties }) => {
    const isConfirming = activeId === id;
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (isConfirming) {
                    onDelete();
                } else {
                    setActiveId(id);
                }
            }}
            style={{
                background: isConfirming ? '#b91c1c' : '#dc2626',
                color: 'white',
                border: isConfirming ? '2px solid #fecaca' : '1px solid white',
                ...style,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {isConfirming ? 'CONFIRMAR' : 'ELIMINAR'}
        </button>
    );
};

export default function UserManagement({
    user, users, setUsers, back,
    uiScale, setUiScale, layoutOrientation, setLayoutOrientation,
    isShiftOpen, logAction
}: Props) {
    // Menu States
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [mode, setMode] = useState<Mode>('normal');

    // Creation State
    const [newName, setNewName] = useState("");
    const [newPass, setNewPass] = useState("");
    const [newRole, setNewRole] = useState<Role>("waiter");

    // Editing State
    const [editingUsername, setEditingUsername] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPass, setEditPass] = useState("");
    const [editRole, setEditRole] = useState<Role>("waiter");
    const [editActive, setEditActive] = useState(true);
    const [editBirthDate, setEditBirthDate] = useState("");

    const [newBirthDate, setNewBirthDate] = useState("");
    const [infoUser, setInfoUser] = useState<User | null>(null);
    const [revealPassword, setRevealPassword] = useState(false);

    // Custom Security Modal States
    const [pendingAction, setPendingAction] = useState<{ type: 'create' | 'edit' | 'delete' | 'reveal', data: any } | null>(null);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    // Deletion State
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [msg, setMsg] = useState("");

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (mode !== 'normal') {
                resetMode();
            } else {
                setShowUserMenu(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') resetMode();
        };

        window.addEventListener('click', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('click', handleClickOutside);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mode]);

    const resetMode = () => {
        setMode('normal');
        setEditingUsername(null);
        setShowUserMenu(false);
        setShowCreateInput(false);
        setConfirmDeleteId(null);
        setMsg("");
    };

    // Permission check: Only Developer and Manager can access
    if (user.role === "waiter") {
        return <div style={{ color: "var(--text-color)", padding: 20 }}>Acceso denegado</div>;
    }

    const handleAddUser = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!newName || !newPass || !newBirthDate) {
            setMsg("Faltan datos");
            return;
        }
        if (users.find(u => u.username.toLowerCase() === newName.toLowerCase())) {
            setMsg("El usuario ya existe");
            return;
        }

        // Permissions logic
        if (user.role === "manager" && newRole === "developer") {
            setMsg("Los gerentes no pueden crear desarrolladores");
            return;
        }
        if (user.role === "manager" && newRole === "manager") {
            setMsg("Los gerentes solo pueden crear meseros");
            return;
        }


        // Age Validation
        const birth = new Date(newBirthDate + 'T00:00:00'); // Force local time
        const todayDate = new Date();
        let age = todayDate.getFullYear() - birth.getFullYear();
        const m = todayDate.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < birth.getDate())) { age--; }

        if (age < 18) { setMsg("Debe ser mayor de 18 años"); return; }
        if (age > 100) { setMsg("Fecha de nacimiento no válida (Max 100 años)"); return; }


        // Instead of prompt, show custom modal
        setPendingAction({ type: 'create', data: null });
        setShowSecurityModal(true);
    };

    const confirmAddUser = () => {
        const today = new Date().toISOString().split('T')[0];
        const randomId = Math.random().toString(36).substring(2, 9).toUpperCase(); // e.g. "X7A2B9C"
        const newUser: User = {
            id: randomId,
            username: newName,
            password: newPass,
            role: newRole,
            active: true,
            birthDate: newBirthDate,
            registrationDate: today,
            loginDates: []
        };

        setUsers([...users, newUser]);
        logAction('user_create', `Usuario creado: ${newUser.username} (${newUser.role})`, newUser.id);
        setMsg("Usuario creado exitosamente");

        // Reset form
        setNewName("");
        setNewPass("");
        setNewRole("waiter");
        setNewBirthDate("");
        setShowCreateInput(false);
        setShowUserMenu(false);
    };

    const handleDelete = (usernameToDelete: string) => {
        if (usernameToDelete === "Desarrollador") {
            alert("No se puede eliminar al Desarrollador principal");
            return;
        }
        if (usernameToDelete === user.username) {
            alert("No puedes eliminarte a ti mismo");
            return;
        }

        // Instead of prompt, show custom modal
        setPendingAction({ type: 'delete', data: usernameToDelete });
        setShowSecurityModal(true);
    };

    const confirmDelete = (usernameToDelete: string) => {
        const userToDelete = users.find(u => u.username === usernameToDelete);
        if (userToDelete) {
            logAction('user_delete', `Usuario eliminado: ${userToDelete.username}`, userToDelete.id);
        }
        setUsers(users.filter(u => u.username !== usernameToDelete));
        setConfirmDeleteId(null);
    };

    const startEdit = (targetUser: User) => {
        setEditingUsername(targetUser.username);
        setEditName(targetUser.username);
        setEditPass(targetUser.password || "");
        setEditRole(targetUser.role);
        setEditActive(targetUser.active !== false); // Default to true if undefined
        setEditBirthDate(targetUser.birthDate || "");
    };

    const saveEdit = (originalUsername: string) => {
        if (!editName || !editPass || !editBirthDate) return;

        // Age Validation
        const birth = new Date(editBirthDate + 'T00:00:00'); // Force local time
        const todayDate = new Date();
        let age = todayDate.getFullYear() - birth.getFullYear();
        const m = todayDate.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < birth.getDate())) { age--; }

        if (age < 18) { alert("El usuario debe ser mayor de 18 años"); return; }
        if (age > 100) { alert("Fecha de nacimiento no válida (Max 100 años)"); return; }

        // Instead of prompt, show custom modal
        setPendingAction({ type: 'edit', data: originalUsername });
        setShowSecurityModal(true);
    };

    const confirmSaveEdit = (originalUsername: string) => {
        // Check if name changed and conflicts
        if (editName.toLowerCase() !== originalUsername.toLowerCase() && users.find(u => u.username.toLowerCase() === editName.toLowerCase())) {
            alert("Nombre de usuario ya existe");
            return;
        }

        // Permissions logic for edit
        if (user.role === "manager" && editRole === "developer") {
            alert("No puedes asignar rol de desarrollador");
            return;
        }

        const updatedUsers = users.map(u => {
            if (u.username === originalUsername) {
                // Check for status change
                if (u.active !== editActive) {
                    logAction('user_status_change', `Usuario ${editActive ? 'activado' : 'desactivado'}: ${editName}`, u.id);
                }

                const updatedUser = { ...u, username: editName, password: editPass, role: editRole, active: editActive, birthDate: editBirthDate };
                logAction('user_update', `Usuario actualizado: ${updatedUser.username}`, updatedUser.id);
                return updatedUser;
            }
            return u;
        });
        setUsers(updatedUsers);
        setEditingUsername(null);
    };

    // Helper to check if current user can edit/delete target user
    const canManageUser = (targetUser: User) => {
        if (user.role === 'developer') return true;
        if (user.role === 'manager') return targetUser.role === 'waiter';
        return false;
    };


    const handleBackgroundClick = () => {
        if (mode !== 'normal') resetMode();
        setShowUserMenu(false);
    };

    return (
        <div className={`scale-${uiScale}`}>
            <div className="page-container" onClick={handleBackgroundClick}>
                <div className="title-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75em' }}>
                        <button onClick={back} className="btn-back">
                            ← Volver al panel
                        </button>

                        <SettingsControls
                            uiScale={uiScale}
                            setUiScale={setUiScale}
                            layoutOrientation={layoutOrientation}
                            setLayoutOrientation={setLayoutOrientation}
                            showOrientation={false}
                        />
                    </div>

                    {/* Main Menu Button */}
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (mode !== 'normal') {
                                    resetMode();
                                } else {
                                    setShowUserMenu(!showUserMenu);
                                    setShowCreateInput(false);
                                }
                            }}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5em', padding: '0.5em 1em', fontWeight: 'bold', cursor: 'pointer', fontSize: '1em' }}
                        >
                            {mode === 'delete_selection' ? 'MODO ELIMINAR' : mode === 'edit_selection' ? 'MODO EDITAR' : 'Opciones de Usuario ▼'}
                        </button>

                        {/* Dropdown Menu */}
                        {showUserMenu && mode === 'normal' && (
                            <div className="glass-card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.75rem', width: 'clamp(300px, 45vw, 450px)', zIndex: 50, boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid var(--card-border)', padding: 0, overflow: 'hidden' }}>
                                {!showCreateInput ? (
                                    <>
                                        <div onClick={() => setShowCreateInput(true)} style={{ padding: '1.25rem', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--card-hover-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.2em' }}>👤+</span> Crear Nuevo Usuario
                                        </div>
                                        <div onClick={() => { setMode('edit_selection'); setShowUserMenu(false); }} style={{ padding: '1.25rem', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--card-hover-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.2em' }}>✎</span> Editar Usuario
                                        </div>
                                        <div onClick={() => { setMode('delete_selection'); setShowUserMenu(false); }} style={{ padding: '1.25rem', cursor: 'pointer', color: 'var(--danger-color)', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--card-hover-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.2em' }}>🗑</span> Eliminar Usuario
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '2rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1em', fontWeight: '800', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', letterSpacing: '-0.02em' }}>NUEVO USUARIO</h4>

                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.7em' }}>NOMBRE</label>
                                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Juan Pérez" style={{ padding: '0.75rem', fontSize: '0.95em' }} />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.7em' }}>CONTRASEÑA</label>
                                            <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="****" type="password" style={{ padding: '0.75rem', fontSize: '0.95em' }} />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                                            <CustomSelect
                                                label="ROL"
                                                value={newRole}
                                                onChange={(val: string) => setNewRole(val as Role)}
                                                options={[
                                                    { value: "waiter", label: "Mesero" },
                                                    ...(user.role === "developer" ? [{ value: "manager", label: "Gerente" } as const] : [])
                                                ]}
                                                width="100%"
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label" style={{ fontSize: '0.7em' }}>FECHA DE NACIMIENTO</label>
                                            <input type="date" value={newBirthDate} onChange={e => setNewBirthDate(e.target.value)} style={{ padding: '0.75rem', fontSize: '0.95em' }} />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <button onClick={handleAddUser} style={{ flex: 1, background: 'var(--success-color)', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em' }}>CREAR USUARIO</button>
                                            <button onClick={() => { setShowCreateInput(false); setMsg(""); }} style={{ width: '3.5rem', background: 'var(--card-hover-bg)', color: 'var(--text-color)', border: '1px solid var(--card-border)', padding: '0.85rem', borderRadius: '0.5rem', cursor: 'pointer' }}>✕</button>
                                        </div>
                                        {msg && <div style={{ marginTop: "1rem", fontSize: '0.85em', textAlign: 'center', padding: '0.75rem', borderRadius: '0.5rem', background: msg.includes("exitosamente") ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", color: msg.includes("exitosamente") ? "#4ade80" : "#f87171" }}>{msg}</div>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <h1>Gestión de Usuarios</h1>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {[
                        { title: 'Gerente:', role: 'manager' },
                        { title: 'Meseros:', role: 'waiter' }
                    ].map(section => {
                        const filteredUsers = users
                            .filter(u => u.role === section.role)
                            .sort((a, b) => {
                                // Put deactivated (manually inactive) users at the end
                                const aInactive = a.active === false;
                                const bInactive = b.active === false;
                                if (aInactive && !bInactive) return 1;
                                if (!aInactive && bInactive) return -1;
                                // Otherwise sort by original array order (mocking creation order)
                                return 0;
                            });

                        if (filteredUsers.length === 0) return null;

                        return (
                            <div key={section.role}>
                                <h2 style={{ fontSize: '1em', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.title}</h2>
                                <div className="card-grid">
                                    {filteredUsers.map(u => {
                                        const isWaitress = u.role === 'waiter';
                                        const isManuallyActive = u.active !== false;
                                        const isEffectivelyActive = isWaitress ? (isManuallyActive && isShiftOpen) : isManuallyActive;
                                        const statusColor = isEffectivelyActive ? '#4ade80' : (!isManuallyActive ? '#f87171' : '#94a3b8');
                                        const statusText = isEffectivelyActive ? 'ACTIVO' : (!isManuallyActive ? 'INACTIVO' : 'TURNO CERRADO');

                                        return (
                                            <div key={u.username} className="glass-card" style={{
                                                border: `1px solid ${isEffectivelyActive ? 'var(--success-color)' : (!isManuallyActive ? 'var(--danger-color)' : 'var(--card-border)')}`,
                                                boxShadow: isEffectivelyActive ? '0 8px 24px -8px var(--primary-color-alpha-20)' : 'none',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                opacity: isEffectivelyActive ? 1 : 0.8
                                            }} onClick={e => e.stopPropagation()}>

                                                {/* Info Button */}
                                                {editingUsername !== u.username && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setInfoUser(u) }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '8px',
                                                            right: '8px',
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '4px',
                                                            border: '1px solid var(--card-border)',
                                                            background: 'var(--card-hover-bg)',
                                                            color: 'var(--text-color)',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            zIndex: 5
                                                        }}
                                                    >
                                                        i
                                                    </button>
                                                )}

                                                {/* Delete Mode Overlay */}
                                                {mode === 'delete_selection' && canManageUser(u) && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <DeleteConfirmBtn
                                                            id={u.username}
                                                            activeId={confirmDeleteId}
                                                            setActiveId={setConfirmDeleteId}
                                                            onDelete={() => handleDelete(u.username)}
                                                            style={{ padding: '8px 16px', fontSize: '14px', borderRadius: '6px' }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Edit Mode Overlay */}
                                                {mode === 'edit_selection' && editingUsername !== u.username && canManageUser(u) && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEdit(u); }}
                                                            style={{ background: '#2563eb', color: 'white', border: '2px solid white', padding: '0.5em 1.25em', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer', borderRadius: '0.375em' }}
                                                        >
                                                            EDITAR
                                                        </button>
                                                    </div>
                                                )}

                                                {/* User Card Content OR Edit Form */}
                                                {editingUsername === u.username ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 1 }} onClick={e => e.stopPropagation()}>
                                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9em', fontWeight: '800', color: 'var(--primary-color)', borderBottom: `1px solid var(--primary-color-alpha-20)`, paddingBottom: '0.4rem' }}>EDITAR PERFIL</h4>

                                                        <div className="form-group">
                                                            <label className="form-label" style={{ fontSize: '0.65em' }}>NOMBRE</label>
                                                            <input
                                                                value={editName}
                                                                onChange={e => setEditName(e.target.value)}
                                                                style={{ padding: '0.5rem', fontSize: '0.9em' }}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label" style={{ fontSize: '0.65em' }}>CLAVE</label>
                                                            <input
                                                                value={editPass}
                                                                onChange={e => setEditPass(e.target.value)}
                                                                style={{ padding: '0.5rem', fontSize: '0.9em' }}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label" style={{ fontSize: '0.65em' }}>NACIMIENTO</label>
                                                            <input
                                                                type="date"
                                                                value={editBirthDate}
                                                                onChange={e => setEditBirthDate(e.target.value)}
                                                                style={{ padding: '0.5rem', fontSize: '0.9em' }}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <CustomSelect
                                                                label="ROL"
                                                                value={editRole}
                                                                onChange={(val: string) => setEditRole(val as Role)}
                                                                options={[
                                                                    { value: "waiter", label: "Mesero" },
                                                                    ...(user.role === "developer" ? [{ value: "manager", label: "Gerente" } as const] : [])
                                                                ]}
                                                                width="100%"
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--card-hover-bg)', padding: '0.5rem', borderRadius: '0.4rem' }}>
                                                            <div
                                                                onClick={() => {
                                                                    const newVal = !editActive;
                                                                    if (u.role === 'waiter' && !isShiftOpen && newVal) {
                                                                        alert("No se puede activar un mesero con el turno cerrado");
                                                                        return;
                                                                    }
                                                                    setEditActive(newVal);
                                                                }}
                                                                style={{
                                                                    width: '50px', height: '24px', background: editActive ? 'var(--success-color)' : 'var(--input-border)',
                                                                    borderRadius: '4px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)'
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: '18px', height: '18px', background: 'white', borderRadius: '2px',
                                                                    position: 'absolute', top: '2px', left: editActive ? '28px' : '2px',
                                                                    transition: 'all 0.2s'
                                                                }} />
                                                            </div>
                                                            <span style={{ fontSize: '0.75em', fontWeight: 'bold', color: editActive ? 'var(--success-color)' : 'var(--text-muted)' }}>
                                                                {editActive ? 'USUARIO ACTIVO' : 'USUARIO DESHABILITADO'}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                            <button onClick={() => saveEdit(u.username)} style={{ flex: 1, background: 'var(--success-color)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85em' }}>GUARDAR</button>
                                                            <button onClick={() => setEditingUsername(null)} style={{ background: 'var(--card-hover-bg)', color: 'var(--text-color)', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer' }}>✕</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                            <div style={{ fontWeight: "bold", fontSize: "1.1em", color: isEffectivelyActive ? 'var(--text-color)' : 'var(--text-muted)' }}>{u.username}</div>
                                                            <div style={{
                                                                fontSize: '0.65em',
                                                                padding: '0.15em 0.4em',
                                                                borderRadius: '0.25em',
                                                                background: isEffectivelyActive ? 'var(--primary-color-alpha-20)' : (!isManuallyActive ? 'var(--primary-color-alpha-20)' /* using same alpha for red-ish is complex without logic */ : 'var(--card-hover-bg)'),
                                                                color: statusColor,
                                                                border: `1px solid ${isEffectivelyActive ? 'var(--primary-color-alpha-20)' : 'transparent'}`
                                                            }}>
                                                                {statusText}
                                                            </div>
                                                        </div>
                                                        <div style={{ opacity: 0.7, fontSize: "0.85em", marginTop: "0.25em", textTransform: "capitalize" }}>
                                                            {u.role === 'manager' ? 'Gerente' : u.role === 'waiter' ? 'Mesero' : u.role}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Modal */}
                {infoUser && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1.5rem' }}
                        onClick={() => { setInfoUser(null); setRevealPassword(false); }}
                    >
                        <div
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '24rem', padding: '2rem', cursor: 'default' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25em', color: 'var(--text-color)' }}>Información de Usuario</h3>
                                <button onClick={() => { setInfoUser(null); setRevealPassword(false); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.5em', cursor: 'pointer', padding: 0 }}>✕</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.7em' }}>ID DE USUARIO</label>
                                    <div style={{ fontSize: '1em', fontWeight: 'bold', color: 'var(--primary-color)', fontFamily: 'monospace', marginTop: '0.25rem' }}>{infoUser.id}</div>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.7em' }}>NOMBRE</label>
                                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', marginTop: '0.25rem', color: 'var(--text-color)' }}>{infoUser.username}</div>
                                </div>

                                <div>
                                    <label className="form-label" style={{ fontSize: '0.7em' }}>CONTRASEÑA</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                                        {/* Permission check: Managers can't see other managers passwords */}
                                        {!(user.role === 'manager' && infoUser.role === 'manager' && user.id !== infoUser.id) ? (
                                            !revealPassword ? (
                                                <>
                                                    <div style={{ fontSize: '1.1em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-color)' }}>********</div>
                                                    <button
                                                        onClick={() => {
                                                            setPendingAction({ type: 'reveal', data: null });
                                                            setShowSecurityModal(true);
                                                        }}
                                                        style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.4em 0.8em', borderRadius: '0.4rem', fontSize: '0.7em', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        VER
                                                    </button>
                                                </>
                                            ) : (
                                                <div style={{ fontSize: '1.1em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--success-color)' }}>{infoUser.password}</div>
                                            )
                                        ) : (
                                            <div style={{ fontSize: '1.1em', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-muted)', opacity: 0.5 }}>RESTRICTED</div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.7em' }}>DÍAS TRABAJADOS</label>
                                        <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '0.25rem' }}>{infoUser.loginDates?.length || 0}</div>
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.7em' }}>NACIMIENTO</label>
                                        <div style={{ fontSize: '1em', marginTop: '0.25rem' }}>{infoUser.birthDate || 'N/A'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label" style={{ fontSize: '0.7em' }}>REGISTRO</label>
                                    <div style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '0.25rem' }}>{infoUser.registrationDate || 'N/A'}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => { setInfoUser(null); setRevealPassword(false); }}
                                style={{ width: '100%', marginTop: '2.5rem', padding: '1em', borderRadius: '0.75rem', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                )}


                {/* Shared Security Modal */}
                <SecurityModal
                    isOpen={showSecurityModal}
                    onClose={() => { setShowSecurityModal(false); setPendingAction(null); }}
                    onConfirm={() => {
                        if (pendingAction) {
                            if (pendingAction.type === 'create') confirmAddUser();
                            else if (pendingAction.type === 'edit') confirmSaveEdit(pendingAction.data);
                            else if (pendingAction.type === 'delete') confirmDelete(pendingAction.data);
                            else if (pendingAction.type === 'reveal') setRevealPassword(true);
                            setShowSecurityModal(false);
                            setPendingAction(null);
                        }
                    }}
                    userPassword={user.password}
                />
            </div>
        </div>
    );
}
