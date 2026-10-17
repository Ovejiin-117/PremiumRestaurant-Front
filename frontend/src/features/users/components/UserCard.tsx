import type { User } from "../../../types";
import ConfirmButton from "../../../components/ui/ConfirmButton";

interface Props {
    u: User;
    mode: 'normal' | 'delete_selection' | 'edit_selection';
    isShiftOpen: boolean;
    canEdit: boolean;
    canDelete: boolean;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    onDelete: (username: string) => void;
    onStartEdit: (u: User) => void;
    onOpenInfo: (u: User) => void;
}

export default function UserCard({
    u,
    mode,
    isShiftOpen,
    canEdit,
    canDelete,
    confirmDeleteId,
    setConfirmDeleteId,
    onDelete,
    onStartEdit,
    onOpenInfo
}: Props) {
    const isWaitress = u.role === 'waiter';
    const isManuallyActive = u.active !== false;
    const isEffectivelyActive = isWaitress ? (isManuallyActive && isShiftOpen) : isManuallyActive;

    const roleName = u.role === 'manager' ? 'Gerente' : u.role === 'waiter' ? 'Mesero' : (u.role === 'developer' ? 'Developer' : u.role);

    const statusDetails = isEffectivelyActive
        ? {
            text: 'ACTIVO',
            badgeClass: 'bg-success/15 border-success/40 text-success',
            dotClass: 'bg-success animate-pulse'
        }
        : (!isManuallyActive
            ? {
                text: 'INACTIVO',
                badgeClass: 'bg-danger/15 border-danger/40 text-danger',
                dotClass: 'bg-danger'
            }
            : {
                text: 'TURNO CERRADO',
                badgeClass: 'bg-warning/15 border-warning/40 text-warning',
                dotClass: 'bg-warning'
            });

    return (
        <div
            className={`glass-card relative overflow-hidden transition-all duration-200 border flex flex-col justify-between ${
                isEffectivelyActive
                    ? 'border-success/40 shadow-md shadow-success/10 hover:border-success/80 hover:shadow-lg hover:shadow-success/20'
                    : (!isManuallyActive
                        ? 'border-danger/40 opacity-75 hover:opacity-100 hover:border-danger/80'
                        : 'border-card-border opacity-85 hover:opacity-100')
            } ${mode === 'normal' ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${
                ((mode === 'edit_selection' && !canEdit) || (mode === 'delete_selection' && !canDelete)) ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            onClick={e => {
                e.stopPropagation();
                if (mode === 'normal') {
                    onOpenInfo(u);
                } else if (mode === 'edit_selection' && canEdit) {
                    onStartEdit(u);
                }
            }}
        >
            {/* Capa superpuesta del modo eliminar */}
            {mode === 'delete_selection' && canDelete && (
                <div className="absolute inset-0 bg-black/85 z-10 flex items-center justify-center p-3">
                    <ConfirmButton
                        id={u.username}
                        activeId={confirmDeleteId}
                        setActiveId={setConfirmDeleteId}
                        onAction={() => onDelete(u.username)}
                        label="ELIMINAR"
                    />
                </div>
            )}

            {/* Capa superpuesta del modo editar */}
            {mode === 'edit_selection' && canEdit && (
                <div className="absolute inset-0 bg-black/85 z-10 flex items-center justify-center p-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onStartEdit(u); }}
                        className="bg-primary text-white border-2 border-white px-[1.25em] py-[0.5em] text-[0.9em] font-bold cursor-pointer rounded-[0.5em] hover:brightness-110 active:scale-95 transition-all shadow-lg"
                    >
                        EDITAR
                    </button>
                </div>
            )}

            {/* Contenido limpio de la tarjeta de usuario */}
            <div className="flex flex-col justify-between h-full gap-2.5">
                {/* Fila 1: Nombre a la izquierda, Botón de info (i) a la derecha */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <span
                        className={`font-bold text-[1.1em] tracking-tight truncate flex-1 min-w-0 ${
                            isEffectivelyActive ? 'text-text-main' : 'text-text-muted'
                        }`}
                        title={u.username}
                    >
                        {u.username}
                    </span>

                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenInfo(u); }}
                        className="w-[1.65em] h-[1.65em] rounded-[0.35em] border border-card-border bg-card-hover text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/10 cursor-pointer text-[0.72em] flex items-center justify-center shrink-0 transition-all font-bold"
                        title="Ver información del usuario"
                        aria-label="Ver información del usuario"
                    >
                        i
                    </button>
                </div>

                {/* Fila 2: Rol a la izquierda, Badge de estado a la derecha */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[0.82em] font-medium text-text-secondary capitalize truncate flex-1 min-w-0">
                        {roleName}
                    </span>

                    <div className={`text-[0.65em] font-extrabold px-[0.65em] py-[0.22em] rounded-[0.4em] border flex items-center gap-1.5 shrink-0 tracking-wider ${statusDetails.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDetails.dotClass}`} />
                        <span>{statusDetails.text}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
