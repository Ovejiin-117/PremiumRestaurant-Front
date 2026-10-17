interface Props {
    showFilters: boolean;
    filterMinPrice: string;
    setFilterMinPrice: (val: string) => void;
    filterMaxPrice: string;
    setFilterMaxPrice: (val: string) => void;
    filterTime: string;
    setFilterTime: (val: string) => void;
    filterUser: string;
    setFilterUser: (val: string) => void;
    isAdmin: boolean;
    onClear: () => void;
}

export default function HistoryFilterBar({
    showFilters,
    filterMinPrice,
    setFilterMinPrice,
    filterMaxPrice,
    setFilterMaxPrice,
    filterTime,
    setFilterTime,
    filterUser,
    setFilterUser,
    isAdmin,
    onClear
}: Props) {
    if (!showFilters) return null;

    return (
        <div className="glass-card" style={{
            marginBottom: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
        }}>
            <div>
                <label className="form-label" style={{ fontSize: '0.75em' }}>PRECIO ($)</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="number"
                        placeholder="Min"
                        value={filterMinPrice}
                        onChange={e => setFilterMinPrice(e.target.value)}
                        style={{ flex: 1, minWidth: 0, padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }}
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={filterMaxPrice}
                        onChange={e => setFilterMaxPrice(e.target.value)}
                        style={{ flex: 1, minWidth: 0, padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }}
                    />
                </div>
            </div>
            <div>
                <label className="form-label" style={{ fontSize: '0.75em' }}>HORA</label>
                <input
                    type="text"
                    placeholder="HH:mm"
                    value={filterTime}
                    onChange={e => setFilterTime(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }}
                />
            </div>
            {isAdmin && (
                <div>
                    <label className="form-label" style={{ fontSize: '0.75em' }}>USUARIO</label>
                    <input
                        type="text"
                        placeholder="Nombre..."
                        value={filterUser}
                        onChange={e => setFilterUser(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-color)', fontSize: '0.95em' }}
                    />
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                    onClick={onClear}
                    style={{
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--danger-color)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9em',
                        transition: 'all 0.2s'
                    }}
                >
                    LIMPIAR FILTROS
                </button>
            </div>
        </div>
    );
}
