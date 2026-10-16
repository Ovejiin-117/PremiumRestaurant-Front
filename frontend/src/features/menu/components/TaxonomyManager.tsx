import React, { useState } from 'react';
import type { UIScale } from '../../../types';
import CustomSelect from '../../../components/ui/CustomSelect';

interface TaxonomyManagerProps {
    categories: string[];
    subCategories: Record<string, string[]>;
    sections: Record<string, string[]>;
    onClose: () => void;
    handlers: {
        handleAddCategory: (name: string) => void;
        handleDeleteCategory: (name: string) => void;
        handleRenameCategory: (oldName: string, newName: string) => void;
        handleAddSubCategory: (cat: string, name: string) => void;
        handleDeleteSubCategory: (cat: string, name: string) => void;
        handleRenameSubCategory: (cat: string, oldName: string, newName: string) => void;
        handleAddSection: (cat: string, sub: string, name: string) => void;
        handleDeleteSection: (cat: string, sub: string, name: string) => void;
        handleRenameSection: (cat: string, sub: string, oldName: string, newName: string) => void;
        isNameUnique: (name: string, excludeId?: string) => boolean;
    };
    uiScale: UIScale;
}

type ModalType = 'CREATE_CAT' | 'CREATE_SUB' | 'CREATE_SEC' | 'EDIT_CAT' | 'EDIT_SUB' | 'EDIT_SEC' | null;

const ActionButton: React.FC<{
    icon: string;
    label: string;
    color: string;
    onClick: () => void;
}> = ({ icon, label, color, onClick }) => (
    <button
        onClick={onClick}
        className="glass-card"
        style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            padding: '1.5rem 1rem', background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            border: `1px solid ${color}30`, borderRadius: '1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer', outline: 'none'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.boxShadow = `0 10px 20px -10px ${color}30`;
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = `${color}30`;
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <span style={{ fontSize: '2rem', filter: `drop-shadow(0 2px 4px ${color}40)` }}>{icon}</span>
        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-color)', textAlign: 'center' }}>{label}</span>
        <div style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gestionar</div>
    </button>
);

const TaxonomyManager: React.FC<TaxonomyManagerProps> = ({
    categories, subCategories, sections, onClose, handlers, uiScale
}) => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [formData, setFormData] = useState({
        name: '',
        oldName: '',
        parentCat: '',
        parentSub: ''
    });

    const resetForm = () => {
        setFormData({ name: '', oldName: '', parentCat: '', parentSub: '' });
        setActiveModal(null);
    };

    const handleAction = () => {
        const { name, oldName, parentCat, parentSub } = formData;
        const trimmedName = name.trim();

        // Verificación de unicidad para creaciones o cambios de nombre
        if (activeModal?.startsWith('CREATE')) {
            if (!handlers.isNameUnique(trimmedName)) {
                alert(`⚠️ Error: El nombre "${trimmedName}" ya existe como categoría, subcategoría, sección o producto. Por favor elige otro.`);
                return;
            }
        } else if (activeModal?.startsWith('EDIT')) {
            if (trimmedName.toLowerCase() !== oldName.toLowerCase() && !handlers.isNameUnique(trimmedName)) {
                alert(`⚠️ Error: El nombre "${trimmedName}" ya está en uso. Por favor elige otro.`);
                return;
            }
        }

        switch (activeModal) {
            case 'CREATE_CAT':
                handlers.handleAddCategory(trimmedName);
                break;
            case 'CREATE_SUB':
                if (!parentCat) return alert("Selecciona una categoría");
                handlers.handleAddSubCategory(parentCat, trimmedName);
                break;
            case 'CREATE_SEC':
                if (!parentCat || !parentSub) return alert("Selecciona categoría y subcategoría");
                handlers.handleAddSection(parentCat, parentSub, trimmedName);
                break;
            case 'EDIT_CAT':
                if (!oldName) return;
                handlers.handleRenameCategory(oldName, trimmedName);
                break;
            case 'EDIT_SUB':
                if (!parentCat || !oldName) return;
                handlers.handleRenameSubCategory(parentCat, oldName, trimmedName);
                break;
            case 'EDIT_SEC':
                if (!parentCat || !parentSub || !oldName) return;
                handlers.handleRenameSection(parentCat, parentSub, oldName, trimmedName);
                break;
        }
        resetForm();
    };

    const handleDelete = () => {
        const { oldName, parentCat, parentSub } = formData;
        if (!oldName) return;

        if (!window.confirm(`¿Estás seguro de eliminar "${oldName}"? Se perderán todos los productos y sub-elementos asociados.`)) return;

        switch (activeModal) {
            case 'EDIT_CAT':
                handlers.handleDeleteCategory(oldName);
                break;
            case 'EDIT_SUB':
                handlers.handleDeleteSubCategory(parentCat, oldName);
                break;
            case 'EDIT_SEC':
                handlers.handleDeleteSection(parentCat, parentSub, oldName);
                break;
        }
        resetForm();
    };

    const renderModal = () => {
        if (!activeModal) return null;

        const isEdit = activeModal.startsWith('EDIT');
        const entityType = activeModal.includes('CAT') ? 'Categoría' : activeModal.includes('SUB') ? 'Subcategoría' : 'Sección';

        return (
            <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
            }} onClick={resetForm}>
                <div className="glass-card" style={{
                    width: '100%', maxWidth: '450px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'modalFadeIn 0.3s ease'
                }} onClick={e => e.stopPropagation()}>

                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{isEdit ? 'Editar' : 'Crear'} {entityType}</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Selectores de padres */}
                        {(activeModal === 'CREATE_SUB' || activeModal === 'EDIT_SUB' || activeModal === 'CREATE_SEC' || activeModal === 'EDIT_SEC') && (
                            <CustomSelect
                                label="Categoría Padre"
                                width="100%"
                                value={formData.parentCat}
                                options={categories.map(c => ({ value: c, label: c }))}
                                onChange={val => setFormData({ ...formData, parentCat: val, parentSub: '', oldName: '' })}
                            />
                        )}

                        {(activeModal === 'CREATE_SEC' || activeModal === 'EDIT_SEC') && (
                            <CustomSelect
                                label="Subcategoría Padre"
                                width="100%"
                                value={formData.parentSub}
                                options={(subCategories[formData.parentCat] || []).map(s => ({ value: s, label: s }))}
                                onChange={val => setFormData({ ...formData, parentSub: val, oldName: '' })}
                                disabled={!formData.parentCat}
                            />
                        )}

                        {/* Selección para edición */}
                        {isEdit && (
                            <CustomSelect
                                label={`Seleccionar ${entityType}`}
                                width="100%"
                                value={formData.oldName}
                                options={(() => {
                                    if (activeModal === 'EDIT_CAT') return categories.map(c => ({ value: c, label: c }));
                                    if (activeModal === 'EDIT_SUB') return (subCategories[formData.parentCat] || []).map(s => ({ value: s, label: s }));
                                    if (activeModal === 'EDIT_SEC') return (sections[`${formData.parentCat}::${formData.parentSub}`] || []).map(s => ({ value: s, label: s }));
                                    return [];
                                })()}
                                onChange={val => setFormData({ ...formData, oldName: val, name: val })}
                                disabled={(activeModal === 'EDIT_SUB' && !formData.parentCat) || (activeModal === 'EDIT_SEC' && !formData.parentSub)}
                            />
                        )}

                        {/* Campo de entrada para nombre */}
                        <div className="form-group">
                            <label className="form-label">Nombre de la {entityType}</label>
                            <input
                                placeholder={`Ej. ${activeModal.includes('CAT') ? 'Desayunos' : activeModal.includes('SUB') ? 'Bebidas Calientes' : 'Cafés'}`}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', background: isEdit ? 'var(--primary-color)' : 'var(--success-color)' }}
                            onClick={handleAction}
                            disabled={!formData.name.trim() || (isEdit && !formData.oldName)}
                        >
                            {isEdit ? 'Guardar Cambios' : `Crear ${entityType}`}
                        </button>

                        {isEdit && formData.oldName && (
                            <button
                                className="btn-back"
                                style={{ width: '100%', borderColor: 'var(--danger-color)', color: 'var(--danger-color)', background: 'transparent' }}
                                onClick={handleDelete}
                            >
                                🗑 Eliminar {entityType}
                            </button>
                        )}

                        <button className="btn-back" style={{ width: '100%' }} onClick={resetForm}>
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
            <div
                className={`scale-${uiScale}`}
                style={{
                    width: '100%', maxWidth: '850px', background: 'var(--bg-color)', maxHeight: '95vh',
                    borderRadius: '1.5rem', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 100px -20px rgba(0, 0, 0, 0.7)', overflow: 'hidden'
                }}
            >
                {/* Encabezado */}
                <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Acomodar categorías
                        </h2>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.5, fontSize: '0.85rem' }}>Organiza la estructura de tu menú</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-back"
                        style={{ minWidth: '32px', height: '32px', padding: 0, borderRadius: '50%', fontSize: '0.8rem' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Cuadrícula de 6 botones */}
                <div style={{
                    padding: '2rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    flex: 1,
                    overflowY: 'auto'
                }}>
                    <ActionButton onClick={() => setActiveModal('CREATE_CAT')} icon="📁" label="Crear Categoría" color="#3b82f6" />
                    <ActionButton onClick={() => setActiveModal('CREATE_SUB')} icon="📂" label="Crear Subcategoría" color="#22c55e" />
                    <ActionButton onClick={() => setActiveModal('CREATE_SEC')} icon="📄" label="Crear Sección" color="#f59e0b" />
                    <ActionButton onClick={() => setActiveModal('EDIT_CAT')} icon="✏️" label="Editar Categoría" color="#3b82f6" />
                    <ActionButton onClick={() => setActiveModal('EDIT_SUB')} icon="📝" label="Editar Subcategoría" color="#22c55e" />
                    <ActionButton onClick={() => setActiveModal('EDIT_SEC')} icon="⚙️" label="Editar Sección" color="#f59e0b" />
                </div>

                {/* Pie de página */}
                <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.01)' }}>
                    <button
                        onClick={onClose}
                        className="btn-primary"
                        style={{ height: '2.5rem', padding: '0 1.5rem', fontSize: '0.9rem' }}
                    >
                        LISTO, VOLVER AL MENÚ
                    </button>
                </div>
            </div>

            {renderModal()}
        </div>
    );
};

export default TaxonomyManager;
