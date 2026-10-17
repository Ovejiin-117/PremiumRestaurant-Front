import { useState, useEffect, useCallback } from "react";
import type { User, Role, UIScale, LayoutOrientation } from "../../../types";
import SettingsControls from "../../../components/ui/SettingsControls";
import SecurityModal from "../../../components/ui/SecurityModal";
import CreateUserForm from "./CreateUserForm";
import UserCard from "./UserCard";
import UserInfoModal from "./UserInfoModal";
import EditUserModal from "./EditUserModal";

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

    // Estado de eliminación para ConfirmButton
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
            setShowUserMenu(false);
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
    }, [resetMode]);

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

    // Función auxiliar para verificar si el usuario objetivo puede ser editado
    const canEditUser = (targetUser: User) => {
        // El Desarrollador no puede ser editado por nadie, ni siquiera por el mismo desarrollador
        if (targetUser.role === 'developer' || targetUser.username.toLowerCase() === 'desarrollador') return false;
        if (user.role === 'developer') return true;
        if (user.role === 'manager') return targetUser.role === 'waiter';
        return false;
    };

    // Función auxiliar para verificar si el usuario objetivo puede ser eliminado
    const canDeleteUser = (targetUser: User) => {
        // Nadie puede eliminar al desarrollador ni a sí mismo
        if (targetUser.role === 'developer' || targetUser.username.toLowerCase() === 'desarrollador') return false;
        if (targetUser.username === user.username) return false;
        if (user.role === 'developer') return true;
        if (user.role === 'manager') return targetUser.role === 'waiter';
        return false;
    };

    const handleDelete = (usernameToDelete: string) => {
        const target = users.find(u => u.username === usernameToDelete);
        if (target && !canDeleteUser(target)) {
            if (target.role === 'developer' || target.username.toLowerCase() === 'desarrollador') {
                alert("No se puede eliminar al Desarrollador");
            } else if (target.username === user.username) {
                alert("No puedes eliminarte a ti mismo");
            } else {
                alert("No tienes permisos para eliminar a este usuario");
            }
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
        if (!canEditUser(targetUser)) {
            alert("El usuario Desarrollador no puede ser editado");
            return;
        }
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
        // Bloquear edición del Desarrollador
        if (originalUsername.toLowerCase() === "desarrollador" || users.find(u => u.username === originalUsername)?.role === 'developer') {
            alert("El Desarrollador no puede ser editado");
            return;
        }

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


    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !editingUsername) {
            if (mode !== 'normal') resetMode();
            setShowUserMenu(false);
        }
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
                                    <CreateUserForm
                                        newName={newName}
                                        setNewName={setNewName}
                                        newPass={newPass}
                                        setNewPass={setNewPass}
                                        newRole={newRole}
                                        setNewRole={setNewRole}
                                        newBirthDate={newBirthDate}
                                        setNewBirthDate={setNewBirthDate}
                                        currentUserRole={user.role}
                                        msg={msg}
                                        onSubmit={handleAddUser}
                                        onCancel={() => { setShowCreateInput(false); setMsg(""); }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <h1 className="page-main-title">GESTIÓN DE USUARIOS</h1>

                <div className="flex flex-col gap-6">
                    {[
                        ...(user.role === 'developer' ? [{ title: 'Desarrolladores:', role: 'developer' }] : []),
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
                                    {filteredUsers.map(u => (
                                        <UserCard
                                            key={u.username}
                                            u={u}
                                            mode={mode}
                                            isShiftOpen={isShiftOpen}
                                            canEdit={canEditUser(u)}
                                            canDelete={canDeleteUser(u)}
                                            confirmDeleteId={confirmDeleteId}
                                            setConfirmDeleteId={setConfirmDeleteId}
                                            onDelete={handleDelete}
                                            onStartEdit={startEdit}
                                            onOpenInfo={(userToView) => setInfoUser(userToView)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal de información */}
                <UserInfoModal
                    infoUser={infoUser}
                    currentUser={user}
                    revealPassword={revealPassword}
                    onClose={() => { setInfoUser(null); setRevealPassword(false); }}
                    onRequestReveal={() => {
                        setPendingAction({ type: 'reveal', data: null });
                        setShowSecurityModal(true);
                    }}
                    canEdit={infoUser ? canEditUser(infoUser) : false}
                    onStartEdit={startEdit}
                />

                {/* Modal de edición de usuario */}
                <EditUserModal
                    isOpen={Boolean(editingUsername)}
                    currentUser={user}
                    isShiftOpen={isShiftOpen}
                    editName={editName}
                    setEditName={setEditName}
                    editPass={editPass}
                    setEditPass={setEditPass}
                    editBirthDate={editBirthDate}
                    setEditBirthDate={setEditBirthDate}
                    editRole={editRole}
                    setEditRole={setEditRole}
                    editActive={editActive}
                    setEditActive={setEditActive}
                    onSave={() => editingUsername && saveEdit(editingUsername)}
                    onClose={() => setEditingUsername(null)}
                />


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
