import type { User } from '../../../types';

interface Props {
    infoUser: User | null;
    currentUser: User;
    revealPassword: boolean;
    onClose: () => void;
    onRequestReveal: () => void;
    canEdit?: boolean;
    onStartEdit?: (u: User) => void;
}

export default function UserInfoModal({
    infoUser,
    currentUser,
    revealPassword,
    onClose,
    onRequestReveal,
    canEdit,
    onStartEdit
}: Props) {
    if (!infoUser) return null;

    const isActive = infoUser.active !== false;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <div
                className="glass-card w-full max-w-[min(92vw,28rem)] p-[clamp(1.5rem,4vw,2rem)] cursor-default box-border shadow-2xl border border-card-border"
                onClick={e => e.stopPropagation()}
            >
                {/* Cabecera uniforme con EditUserModal */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                    <h3 className="m-0 text-xl font-bold text-text-main flex items-center gap-2">
                        <span className="text-primary font-bold">👤</span>
                        Información de Usuario
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
                    {/* Nombre de usuario e ID */}
                    <div className="form-group">
                        <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                            NOMBRE DE USUARIO
                        </label>
                        <div className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border flex items-center justify-between">
                            <span className="font-bold text-text-main">{infoUser.username}</span>
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                ID: {infoUser.id}
                            </span>
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div className="form-group">
                        <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                            CONTRASEÑA
                        </label>
                        <div className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border flex items-center justify-between font-mono">
                            {!(currentUser.role === 'manager' && infoUser.role === 'manager' && currentUser.id !== infoUser.id) ? (
                                !revealPassword ? (
                                    <>
                                        <span className="tracking-widest text-text-secondary">••••••••</span>
                                        <button
                                            type="button"
                                            onClick={onRequestReveal}
                                            className="bg-primary text-white border-none px-3 py-1 rounded-md text-xs cursor-pointer font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
                                        >
                                            VER
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="font-bold text-success tracking-wider">{infoUser.password}</span>
                                        <span className="text-[0.68rem] uppercase font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                                            Visible
                                        </span>
                                    </>
                                )
                            ) : (
                                <span className="text-xs text-text-muted italic">RESTRINGIDO (OTRO GERENTE)</span>
                            )}
                        </div>
                    </div>

                    {/* Fecha de nacimiento */}
                    <div className="form-group">
                        <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                            FECHA DE NACIMIENTO
                        </label>
                        <div className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border flex items-center justify-between">
                            <span>{infoUser.birthDate || 'No registrada'}</span>
                            <span className="opacity-60 text-sm">📅</span>
                        </div>
                    </div>

                    {/* Rol y Registro */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                                ROL DEL USUARIO
                            </label>
                            <div className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main font-bold rounded-lg box-border flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                    infoUser.role === 'developer' ? 'bg-purple-400' : infoUser.role === 'manager' ? 'bg-amber-400' : 'bg-blue-400'
                                }`} />
                                <span className="capitalize">
                                    {infoUser.role === 'developer' ? 'Desarrollador' : infoUser.role === 'manager' ? 'Gerente' : 'Mesero'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="form-label text-xs font-semibold text-text-secondary mb-1.5 block">
                                FECHA DE REGISTRO
                            </label>
                            <div className="w-full p-3 text-sm bg-input-bg border border-input-border text-text-main rounded-lg box-border flex items-center justify-between">
                                <span>{infoUser.registrationDate || 'N/A'}</span>
                                <span className="opacity-60 text-sm">🗓️</span>
                            </div>
                        </div>
                    </div>

                    {/* Estado de la cuenta (Card idéntica a EditUserModal) */}
                    <div
                        className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border mt-1 transition-all ${
                            isActive
                                ? 'bg-success/10 border-success/30'
                                : 'bg-card-hover border-card-border'
                        }`}
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-text-main">
                                Estado de la cuenta
                            </span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        isActive ? 'bg-success animate-pulse' : 'bg-text-muted'
                                    }`}
                                />
                                <span
                                    className={`text-xs font-semibold tracking-wide ${
                                        isActive ? 'text-success' : 'text-text-muted'
                                    }`}
                                >
                                    {isActive ? 'USUARIO ACTIVO' : 'USUARIO DESHABILITADO'}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[0.7rem] uppercase font-semibold text-text-secondary block">
                                Días Trabajados
                            </span>
                            <span className="text-sm font-bold text-primary font-mono">
                                {infoUser.loginDates?.length || 0} {infoUser.loginDates?.length === 1 ? 'turno' : 'turnos'}
                            </span>
                        </div>
                    </div>

                    {/* Botones de acción inferiores */}
                    <div className="flex gap-3 mt-4 pt-2">
                        <button
                            onClick={onClose}
                            className={`${
                                canEdit && onStartEdit ? 'flex-1' : 'w-full'
                            } p-3.5 rounded-xl border border-card-border bg-card-hover text-text-main font-bold cursor-pointer hover:bg-white/10 active:scale-98 transition-all text-sm`}
                        >
                            Cerrar
                        </button>
                        {canEdit && onStartEdit && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onStartEdit(infoUser);
                                }}
                                className="flex-1 p-3.5 rounded-xl border-none bg-primary text-white font-bold cursor-pointer hover:brightness-110 active:scale-98 transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2"
                            >
                                <span>✎</span>
                                Editar Perfil
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
