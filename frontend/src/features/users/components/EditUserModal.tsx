import type { User, Role } from '../../../types';
import CustomSelect from '../../../components/ui/CustomSelect';

interface Props {
    isOpen: boolean;
    currentUser: User;
    isShiftOpen: boolean;
    editName: string;
    setEditName: (v: string) => void;
    editPass: string;
    setEditPass: (v: string) => void;
    editBirthDate: string;
    setEditBirthDate: (v: string) => void;
    editRole: Role;
    setEditRole: (v: Role) => void;
    editActive: boolean;
    setEditActive: (v: boolean) => void;
    onSave: () => void;
    onClose: () => void;
}

export default function EditUserModal({
    isOpen,
    currentUser,
    isShiftOpen,
    editName,
    setEditName,
    editPass,
    setEditPass,
    editBirthDate,
    setEditBirthDate,
    editRole,
    setEditRole,
    editActive,
    setEditActive,
    onSave,
    onClose
}: Props) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <div
                className="glass-card w-full max-w-[min(92vw,28rem)] p-[clamp(1.5rem,4vw,2rem)] cursor-default box-border shadow-2xl border border-card-border"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                    <h3 className="m-0 text-xl font-bold text-text-main flex items-center gap-2">
                        <span className="text-primary font-bold">✎</span>
                        Editar Perfil de Usuario
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none text-text-secondary text-2xl cursor-pointer p-0 hover:text-text-main transition-colors"
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="form-group">
                        <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                            NOMBRE DE USUARIO
                        </label>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Nombre del usuario"
                            className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                            CONTRASEÑA
                        </label>
                        <input
                            type="text"
                            value={editPass}
                            onChange={e => setEditPass(e.target.value)}
                            placeholder="Contraseña"
                            className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border outline-none focus:border-primary transition-colors font-mono"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                            FECHA DE NACIMIENTO
                        </label>
                        <input
                            type="date"
                            value={editBirthDate}
                            onChange={e => setEditBirthDate(e.target.value)}
                            className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="form-group">
                        <CustomSelect
                            label="ROL"
                            value={editRole}
                            onChange={(val: string) => setEditRole(val as Role)}
                            options={[
                                { value: "waiter", label: "Mesero" },
                                ...(currentUser.role === "developer" ? [{ value: "manager", label: "Gerente" } as const] : [])
                            ]}
                            width="100%"
                        />
                    </div>

                    {/* Switch de estado */}
                    <div
                        onClick={() => {
                            const newVal = !editActive;
                            if (editRole === 'waiter' && !isShiftOpen && newVal) {
                                alert("No se puede activar un mesero con el turno cerrado");
                                return;
                            }
                            setEditActive(newVal);
                        }}
                        className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none mt-1 ${
                            editActive
                                ? 'bg-success/10 border-success/30 hover:bg-success/15 hover:border-success/50'
                                : 'bg-card-hover border-card-border hover:bg-white/5'
                        }`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-text-main">
                                Estado de la cuenta
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        editActive ? 'bg-success animate-pulse' : 'bg-text-muted'
                                    }`}
                                />
                                <span
                                    className={`text-xs font-semibold tracking-wide ${
                                        editActive ? 'text-success' : 'text-text-muted'
                                    }`}
                                >
                                    {editActive ? 'USUARIO ACTIVO' : 'USUARIO DESHABILITADO'}
                                </span>
                            </div>
                        </div>

                        {/* Switch pill */}
                        <div
                            role="switch"
                            aria-checked={editActive}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ease-in-out border ${
                                editActive
                                    ? 'bg-success border-success/40 shadow-[0_0_12px_rgba(34,197,94,0.35)]'
                                    : 'bg-card-border/80 border-white/10'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                                    editActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 mt-4 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 p-3.5 rounded-xl border border-card-border bg-card-hover text-text-main font-bold cursor-pointer hover:bg-white/10 active:scale-98 transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            className="flex-1 p-3.5 rounded-xl border-none bg-success text-white font-bold cursor-pointer hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-success/20 text-sm"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
