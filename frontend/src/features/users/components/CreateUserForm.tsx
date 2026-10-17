import CustomSelect from "../../../components/ui/CustomSelect";
import type { Role } from "../../../types";

interface Props {
    newName: string;
    setNewName: (v: string) => void;
    newPass: string;
    setNewPass: (v: string) => void;
    newRole: Role;
    setNewRole: (v: Role) => void;
    newBirthDate: string;
    setNewBirthDate: (v: string) => void;
    currentUserRole: Role;
    msg: string;
    onSubmit: (e?: React.MouseEvent) => void;
    onCancel: () => void;
}

export default function CreateUserForm({
    newName,
    setNewName,
    newPass,
    setNewPass,
    newRole,
    setNewRole,
    newBirthDate,
    setNewBirthDate,
    currentUserRole,
    msg,
    onSubmit,
    onCancel
}: Props) {
    return (
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
                        ...(currentUserRole === "developer" ? [{ value: "manager", label: "Gerente" } as const] : [])
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
                    onClick={onSubmit}
                    className="bg-success text-white border-none cursor-pointer font-bold hover:brightness-110 active:scale-95 transition-all"
                    style={{ flex: 1, padding: '0.75em 1em', fontSize: '0.85em', borderRadius: '0.5em' }}
                >
                    CREAR USUARIO
                </button>
                <button
                    onClick={onCancel}
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
    );
}
