import { useState, useEffect, useCallback } from "react";
import CustomSelect from "../../../components/ui/CustomSelect";
import type { User, Role, UIScale, LayoutOrientation } from "../../../types";
import SettingsControls from "../../../components/ui/SettingsControls";
import SecurityModal from "../../../components/ui/SecurityModal";

type Props = {
    user: User; // Usuario actualmente autenticado
    users: User[]; // Todos los usuarios
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

// Componente interno para confirmación de eliminación (patrón copiado de MenuEditor)
const DeleteConfirmBtn = ({ id, activeId, setActiveId, onDelete }: { id: string, activeId: string | null, setActiveId: (id: string | null) => void, onDelete: () => void }) => {
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
            className={`font-bold cursor-pointer transition-all px-[1em] py-[0.5em] text-[0.85em] rounded-[0.4em] border text-white ${
                isConfirming ? 'bg-red-700 border-red-200' : 'bg-danger border-white'
            }`}
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
    // Estados de menú
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [mode, setMode] = useState<Mode>('normal');

    // Estado de creación
    const [newName, setNewName] = useState("");
    const [newPass, setNewPass] = useState("");
    const [newRole, setNewRole] = useState<Role>("waiter");

    // Estado de edición
    const [editingUsername, setEditingUsername] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPass, setEditPass] = useState("");
    const [editRole, setEditRole] = useState<Role>("waiter");
    const [editActive, setEditActive] = useState(true);
    const [editBirthDate, setEditBirthDate] = useState("");

    const [newBirthDate, setNewBirthDate] = useState("");
    const [infoUser, setInfoUser] = useState<User | null>(null);
    const [revealPassword, setRevealPassword] = useState(false);

    // Estados del modal de seguridad personalizado
    const [pendingAction, setPendingAction] = useState<{ type: 'create' | 'edit' | 'delete' | 'reveal', data?: string | null } | null>(null);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    // Estado de eliminación
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [msg, setMsg] = useState("");

    const resetMode = useCallback(() => {
        setMode('normal');
        setEditingUsername(null);
        setShowUserMenu(false);
        setShowCreateInput(false);
        setConfirmDeleteId(null);
        setMsg("");
    }, []);

    // Cerrar menús al hacer clic afuera
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
    }, [mode, resetMode]);

    // Verificación de permisos: Solo Desarrollador y Gerente pueden acceder
    if (user.role === "waiter") {
        return <div className="text-text-main p-5">Acceso denegado</div>;
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

        // Lógica de permisos
        if (user.role === "manager" && newRole === "developer") {
            setMsg("Los gerentes no pueden crear desarrolladores");
            return;
        }
        if (user.role === "manager" && newRole === "manager") {
            setMsg("Los gerentes solo pueden crear meseros");
            return;
        }


        // Validación de edad
        const birth = new Date(newBirthDate + 'T00:00:00'); // Forzar hora local
        const todayDate = new Date();
        let age = todayDate.getFullYear() - birth.getFullYear();
        const m = todayDate.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < birth.getDate())) { age--; }

        if (age < 18) { setMsg("Debe ser mayor de 18 años"); return; }
        if (age > 100) { setMsg("Fecha de nacimiento no válida (Max 100 años)"); return; }


        // En lugar de prompt, mostrar modal personalizado
        setPendingAction({ type: 'create', data: null });
        setShowSecurityModal(true);
    };

    const confirmAddUser = () => {
        const today = new Date().toISOString().split('T')[0];
        const randomId = Math.random().toString(36).substring(2, 9).toUpperCase(); // ej. "X7A2B9C"
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

        // Restablecer formulario
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

        // En lugar de prompt, mostrar modal personalizado
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
        setEditActive(targetUser.active !== false); // Predeterminado a verdadero si es indefinido
        setEditBirthDate(targetUser.birthDate || "");
    };

    const saveEdit = (originalUsername: string) => {
        if (!editName || !editPass || !editBirthDate) return;

        // Validación de edad
        const birth = new Date(editBirthDate + 'T00:00:00'); // Forzar hora local
        const todayDate = new Date();
        let age = todayDate.getFullYear() - birth.getFullYear();
        const m = todayDate.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < birth.getDate())) { age--; }

        if (age < 18) { alert("El usuario debe ser mayor de 18 años"); return; }
        if (age > 100) { alert("Fecha de nacimiento no válida (Max 100 años)"); return; }

        // En lugar de prompt, mostrar modal personalizado
        setPendingAction({ type: 'edit', data: originalUsername });
        setShowSecurityModal(true);
    };

    const confirmSaveEdit = (originalUsername: string) => {
        // Verificar si el nombre cambió y entra en conflicto
        if (editName.toLowerCase() !== originalUsername.toLowerCase() && users.find(u => u.username.toLowerCase() === editName.toLowerCase())) {
            alert("Nombre de usuario ya existe");
            return;
        }

        // Lógica de permisos para edición
        if (user.role === "manager" && editRole === "developer") {
            alert("No puedes asignar rol de desarrollador");
            return;
        }

        const updatedUsers = users.map(u => {
            if (u.username === originalUsername) {
                // Verificar si hubo cambio de estado
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

    // Función auxiliar para verificar si el usuario actual puede editar/eliminar al usuario objetivo
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
                    <div className="flex items-center flex-wrap gap-3">
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

                    {/* Botón del menú principal */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                if (mode !== 'normal') {
                                    resetMode();
                                } else {
                                    setShowUserMenu(!showUserMenu);
                                    setShowCreateInput(false);
                                }
                            }}
                            className={`btn-primary ${
                                mode === 'delete_selection' ? '!bg-danger' : mode === 'edit_selection' ? '!bg-warning !text-black' : ''
                            }`}
                            style={{
                                height: '2.2em',
                                fontSize: '0.85em',
                                padding: '0 1.25em',
                                borderRadius: '0.75em'
                            }}
                        >
                            {mode === 'delete_selection' ? 'MODO ELIMINAR' : mode === 'edit_selection' ? 'MODO EDITAR' : 'Opciones de Usuario ▼'}
                        </button>

                        {/* Menú desplegable */}
                        {showUserMenu && mode === 'normal' && (
                            <div
                                className="glass-card absolute top-full right-0 mt-2 z-50 shadow-2xl border border-card-border p-0 overflow-hidden"
                                style={{
                                    width: 'min(92vw, 22em)',
                                    borderRadius: '0.75em'
                                }}
                            >
                                {!showCreateInput ? (
                                    <>
                                        <div
                                            onClick={() => setShowCreateInput(true)}
                                            className="cursor-pointer border-b border-card-border flex items-center hover:bg-card-hover transition-colors"
                                            style={{
                                                padding: '1em 1.25em',
                                                fontSize: '0.9em',
                                                gap: '0.75em'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.25em' }}>👤+</span>
                                            <span style={{ fontWeight: 600 }}>Crear Nuevo Usuario</span>
                                        </div>
                                        <div
                                            onClick={() => { setMode('edit_selection'); setShowUserMenu(false); }}
                                            className="cursor-pointer border-b border-card-border flex items-center hover:bg-card-hover transition-colors"
                                            style={{
                                                padding: '1em 1.25em',
                                                fontSize: '0.9em',
                                                gap: '0.75em'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.25em' }}>✎</span>
                                            <span style={{ fontWeight: 600 }}>Editar Usuario</span>
                                        </div>
                                        <div
                                            onClick={() => { setMode('delete_selection'); setShowUserMenu(false); }}
                                            className="cursor-pointer border-b border-card-border flex items-center text-danger hover:bg-card-hover transition-colors"
                                            style={{
                                                padding: '1em 1.25em',
                                                fontSize: '0.9em',
                                                gap: '0.75em'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.25em' }}>🗑</span>
                                            <span style={{ fontWeight: 600 }}>Eliminar Usuario</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '1.5em' }} className="cursor-default" onClick={e => e.stopPropagation()}>
                                        <h4
                                            className="m-0 font-extrabold border-b border-card-border tracking-tight"
                                            style={{ fontSize: '1em', marginBottom: '1.25em', paddingBottom: '0.6em' }}
                                        >
                                            NUEVO USUARIO
                                        </h4>

                                        <div className="form-group" style={{ marginBottom: '1em' }}>
                                            <label className="form-label" style={{ fontSize: '0.75em' }}>NOMBRE</label>
                                            <input
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                placeholder="Ej: Juan Pérez"
                                                className="w-full bg-input-bg border border-input-border text-text-main box-border outline-none focus:border-primary"
                                                style={{ padding: '0.65em 0.85em', fontSize: '0.85em', borderRadius: '0.5em' }}
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '1em' }}>
                                            <label className="form-label" style={{ fontSize: '0.75em' }}>CONTRASEÑA</label>
                                            <input
                                                value={newPass}
                                                onChange={e => setNewPass(e.target.value)}
                                                placeholder="****"
                                                type="password"
                                                className="w-full bg-input-bg border border-input-border text-text-main box-border outline-none focus:border-primary"
                                                style={{ padding: '0.65em 0.85em', fontSize: '0.85em', borderRadius: '0.5em' }}
                                            />
                                        </div>

                                        <div className="form-group" style={{ marginBottom: '1em' }}>
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

                                        <div className="form-group" style={{ marginBottom: '1.5em' }}>
                                            <label className="form-label" style={{ fontSize: '0.75em' }}>FECHA DE NACIMIENTO</label>
                                            <input
                                                type="date"
                                                value={newBirthDate}
                                                onChange={e => setNewBirthDate(e.target.value)}
                                                className="w-full bg-input-bg border border-input-border text-text-main box-border outline-none focus:border-primary"
                                                style={{ padding: '0.65em 0.85em', fontSize: '0.85em', borderRadius: '0.5em' }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75em' }}>
                                            <button
                                                onClick={handleAddUser}
                                                className="bg-success text-white border-none cursor-pointer font-bold hover:brightness-110 active:scale-95 transition-all"
                                                style={{ flex: 1, padding: '0.75em 1em', fontSize: '0.85em', borderRadius: '0.5em' }}
                                            >
                                                CREAR USUARIO
                                            </button>
                                            <button
                                                onClick={() => { setShowCreateInput(false); setMsg(""); }}
                                                className="bg-card-hover text-text-main border border-card-border cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
                                                style={{ width: '3em', padding: '0.75em 0', fontSize: '0.85em', borderRadius: '0.5em' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        {msg && (
                                            <div
                                                className={`text-center ${
                                                    msg.includes("exitosamente")
                                                        ? "bg-success/10 text-success"
                                                        : "bg-danger/10 text-danger"
                                                }`}
                                                style={{ marginTop: '1em', fontSize: '0.85em', padding: '0.75em', borderRadius: '0.5em' }}
                                            >
                                                {msg}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <h1 className="page-main-title">GESTIÓN DE USUARIOS</h1>

                <div className="flex flex-col gap-6">
                    {[
                        { title: 'Gerente:', role: 'manager' },
                        { title: 'Meseros:', role: 'waiter' }
                    ].map(section => {
                        const filteredUsers = users
                            .filter(u => u.role === section.role)
                            .sort((a, b) => {
                                // Poner usuarios desactivados (manualmente inactivos) al final
                                const aInactive = a.active === false;
                                const bInactive = b.active === false;
                                if (aInactive && !bInactive) return 1;
                                if (!aInactive && bInactive) return -1;
                                // De lo contrario ordenar por el orden original del arreglo (simulando orden de creación)
                                return 0;
                            });

                        if (filteredUsers.length === 0) return null;

                        return (
                            <div key={section.role}>
                                <h2 className="text-[0.9em] text-text-secondary mb-3 uppercase tracking-wider font-semibold">
                                    {section.title}
                                </h2>
                                <div className="card-grid">
                                    {filteredUsers.map(u => {
                                        const isWaitress = u.role === 'waiter';
                                        const isManuallyActive = u.active !== false;
                                        const isEffectivelyActive = isWaitress ? (isManuallyActive && isShiftOpen) : isManuallyActive;
                                        const statusText = isEffectivelyActive ? 'ACTIVO' : (!isManuallyActive ? 'INACTIVO' : 'TURNO CERRADO');

                                        return (
                                            <div
                                                key={u.username}
                                                className={`glass-card relative overflow-hidden transition-all border ${
                                                    isEffectivelyActive
                                                        ? 'border-success shadow-lg shadow-primary/20 opacity-100'
                                                        : (!isManuallyActive ? 'border-danger opacity-80' : 'border-card-border opacity-80')
                                                }`}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {/* Botón de información */}
                                                {editingUsername !== u.username && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setInfoUser(u) }}
                                                        className="absolute bottom-2 right-2 w-[1.75em] h-[1.75em] rounded-[0.4em] border border-card-border bg-card-hover text-text-main cursor-pointer text-[0.75em] flex items-center justify-center z-[5] hover:bg-primary/20 hover:text-primary transition-all font-bold"
                                                    >
                                                        i
                                                    </button>
                                                )}

                                                {/* Capa superpuesta del modo eliminar */}
                                                {mode === 'delete_selection' && canManageUser(u) && (
                                                    <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
                                                        <DeleteConfirmBtn
                                                            id={u.username}
                                                            activeId={confirmDeleteId}
                                                            setActiveId={setConfirmDeleteId}
                                                            onDelete={() => handleDelete(u.username)}
                                                        />
                                                    </div>
                                                )}

                                                {/* Capa superpuesta del modo editar */}
                                                {mode === 'edit_selection' && editingUsername !== u.username && canManageUser(u) && (
                                                    <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEdit(u); }}
                                                            className="bg-primary text-white border-2 border-white px-[1.25em] py-[0.5em] text-[0.9em] font-bold cursor-pointer rounded-[0.5em] hover:brightness-110 active:scale-95 transition-all"
                                                        >
                                                            EDITAR
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Contenido de tarjeta de usuario O formulario de edición */}
                                                {editingUsername === u.username ? (
                                                    <div className="flex flex-col gap-3 opacity-100" onClick={e => e.stopPropagation()}>
                                                        <h4 className="m-0 mb-2 text-sm font-extrabold text-primary border-b border-primary/20 pb-1.5">
                                                            EDITAR PERFIL
                                                        </h4>

                                                        <div className="form-group">
                                                            <label className="form-label text-[0.65em]">NOMBRE</label>
                                                            <input
                                                                value={editName}
                                                                onChange={e => setEditName(e.target.value)}
                                                                className="w-full p-2 text-sm bg-input-bg border border-input-border text-text-main rounded-md box-border outline-none focus:border-primary"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label text-[0.65em]">CLAVE</label>
                                                            <input
                                                                value={editPass}
                                                                onChange={e => setEditPass(e.target.value)}
                                                                className="w-full p-2 text-sm bg-input-bg border border-input-border text-text-main rounded-md box-border outline-none focus:border-primary"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label text-[0.65em]">NACIMIENTO</label>
                                                            <input
                                                                type="date"
                                                                value={editBirthDate}
                                                                onChange={e => setEditBirthDate(e.target.value)}
                                                                className="w-full p-2 text-sm bg-input-bg border border-input-border text-text-main rounded-md box-border outline-none focus:border-primary"
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
                                                        <div className="flex items-center gap-3 bg-card-hover p-2 rounded-md">
                                                            <div
                                                                onClick={() => {
                                                                    const newVal = !editActive;
                                                                    if (u.role === 'waiter' && !isShiftOpen && newVal) {
                                                                        alert("No se puede activar un mesero con el turno cerrado");
                                                                        return;
                                                                    }
                                                                    setEditActive(newVal);
                                                                }}
                                                                className={`w-[50px] h-6 rounded relative cursor-pointer transition-all border border-white/10 ${
                                                                    editActive ? 'bg-success' : 'bg-input-border'
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`w-[18px] h-[18px] bg-white rounded-[2px] absolute top-[2px] transition-all ${
                                                                        editActive ? 'left-[28px]' : 'left-[2px]'
                                                                    }`}
                                                                />
                                                            </div>
                                                            <span className={`text-[0.75em] font-bold ${
                                                                editActive ? 'text-success' : 'text-text-muted'
                                                            }`}>
                                                                {editActive ? 'USUARIO ACTIVO' : 'USUARIO DESHABILITADO'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => saveEdit(u.username)}
                                                                className="flex-1 bg-success text-white border-none p-3 rounded-lg cursor-pointer font-bold text-xs hover:brightness-110 active:scale-95 transition-all"
                                                            >
                                                                GUARDAR
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUsername(null)}
                                                                className="bg-card-hover text-text-main border-none p-3 rounded-lg cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-start">
                                                            <div className={`font-bold text-[1.15em] ${isEffectivelyActive ? 'text-text-main' : 'text-text-muted'}`}>
                                                                {u.username}
                                                            </div>
                                                            <div className={`text-[0.65em] px-[0.6em] py-[0.2em] rounded-[0.4em] border ${
                                                                isEffectivelyActive
                                                                    ? 'bg-success/15 border-success/30 text-success font-bold'
                                                                    : (!isManuallyActive
                                                                        ? 'bg-danger/15 border-danger/30 text-danger font-bold'
                                                                        : 'bg-card-hover border-transparent text-text-muted')
                                                            }`}>
                                                                {statusText}
                                                            </div>
                                                        </div>
                                                        <div className="opacity-70 text-[0.85em] mt-[0.3em] capitalize">
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

                {/* Modal de información */}
                {infoUser && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
                        onClick={() => { setInfoUser(null); setRevealPassword(false); }}
                    >
                        <div
                            className="glass-card w-full max-w-[min(92vw,26rem)] p-[clamp(1.5rem,4vw,2rem)] cursor-default box-border"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="m-0 text-xl text-text-main">Información de Usuario</h3>
                                <button
                                    onClick={() => { setInfoUser(null); setRevealPassword(false); }}
                                    className="bg-transparent border-none text-text-main text-2xl cursor-pointer p-0 hover:text-primary transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="form-label text-[0.7em]">ID DE USUARIO</label>
                                    <div className="text-base font-bold text-primary font-mono mt-1">{infoUser.id}</div>
                                </div>
                                <div>
                                    <label className="form-label text-[0.7em]">NOMBRE</label>
                                    <div className="text-lg font-bold mt-1 text-text-main">{infoUser.username}</div>
                                </div>

                                <div>
                                    <label className="form-label text-[0.7em]">CONTRASEÑA</label>
                                    <div className="flex items-center gap-3 mt-1">
                                        {/* Verificación de permisos: Los gerentes no pueden ver contraseñas de otros gerentes */}
                                        {!(user.role === 'manager' && infoUser.role === 'manager' && user.id !== infoUser.id) ? (
                                            !revealPassword ? (
                                                <>
                                                    <div className="text-lg font-bold font-mono text-text-main">********</div>
                                                    <button
                                                        onClick={() => {
                                                            setPendingAction({ type: 'reveal', data: null });
                                                            setShowSecurityModal(true);
                                                        }}
                                                        className="bg-primary text-white border-none px-3 py-1.5 rounded text-[0.7em] cursor-pointer font-bold hover:brightness-110 transition-all"
                                                    >
                                                        VER
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="text-lg font-bold font-mono text-success">{infoUser.password}</div>
                                            )
                                        ) : (
                                            <div className="text-lg font-bold font-mono text-text-muted opacity-50">RESTRICTED</div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label text-[0.7em]">DÍAS TRABAJADOS</label>
                                        <div className="text-lg font-bold text-primary mt-1">{infoUser.loginDates?.length || 0}</div>
                                    </div>
                                    <div>
                                        <label className="form-label text-[0.7em]">NACIMIENTO</label>
                                        <div className="text-base mt-1 text-text-main">{infoUser.birthDate || 'N/A'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label text-[0.7em]">REGISTRO</label>
                                    <div className="text-sm opacity-80 mt-1 text-text-main">{infoUser.registrationDate || 'N/A'}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => { setInfoUser(null); setRevealPassword(false); }}
                                className="w-full mt-10 p-4 rounded-xl border-none bg-primary text-white font-bold cursor-pointer hover:brightness-110 active:scale-98 transition-all"
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                )}


                {/* Modal de seguridad compartido */}
                <SecurityModal
                    isOpen={showSecurityModal}
                    onClose={() => { setShowSecurityModal(false); setPendingAction(null); }}
                    onConfirm={() => {
                        if (pendingAction) {
                            if (pendingAction.type === 'create') confirmAddUser();
                            else if (pendingAction.type === 'edit' && pendingAction.data) confirmSaveEdit(pendingAction.data);
                            else if (pendingAction.type === 'delete' && pendingAction.data) confirmDelete(pendingAction.data);
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
