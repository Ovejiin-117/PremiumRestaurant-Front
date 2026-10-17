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
                    <div className="flex items-center justify-between gap-3 bg-card-hover p-3 rounded-lg border border-card-border mt-1">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-main">
                                Estado de la cuenta
                            </span>
                            <span className={`text-[0.75em] font-semibold ${
                                editActive ? 'text-success' : 'text-text-muted'
                            }`}>
                                {editActive ? 'USUARIO ACTIVO' : 'USUARIO DESHABILITADO'}
                            </span>
                        </div>

                        <div
                            onClick={() => {
                                const newVal = !editActive;
                                if (editRole === 'waiter' && !isShiftOpen && newVal) {
                                    alert("No se puede activar un mesero con el turno cerrado");
                                    return;
                                }
                                setEditActive(newVal);
                            }}
                            className={`w-[50px] h-6 rounded-full relative cursor-pointer transition-all border border-white/10 shrink-0 ${
                                editActive ? 'bg-success' : 'bg-input-border'
                            }`}
                        >
                            <div
                                className={`w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm ${
                                    editActive ? 'left-[28px]' : 'left-[3px]'
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
