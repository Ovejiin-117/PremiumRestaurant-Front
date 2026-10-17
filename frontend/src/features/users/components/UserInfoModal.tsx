import type { User } from '../../../types';

interface Props {
    infoUser: User | null;
    currentUser: User;
    revealPassword: boolean;
    onClose: () => void;
    onRequestReveal: () => void;
}

export default function UserInfoModal({
    infoUser,
    currentUser,
    revealPassword,
    onClose,
    onRequestReveal
}: Props) {
    if (!infoUser) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
            onClick={onClose}
        >
            <div
                className="glass-card w-full max-w-[min(92vw,26rem)] p-[clamp(1.5rem,4vw,2rem)] cursor-default box-border"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="m-0 text-xl text-text-main">Información de Usuario</h3>
                    <button
                        onClick={onClose}
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
                            {!(currentUser.role === 'manager' && infoUser.role === 'manager' && currentUser.id !== infoUser.id) ? (
                                !revealPassword ? (
                                    <>
                                        <div className="text-lg font-bold font-mono text-text-main">********</div>
                                        <button
                                            onClick={onRequestReveal}
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
                    onClick={onClose}
                    className="w-full mt-10 p-4 rounded-xl border-none bg-primary text-white font-bold cursor-pointer hover:brightness-110 active:scale-98 transition-all"
                >
                    CERRAR
                </button>
            </div>
        </div>
    );
}
