import React, { useState, useEffect } from 'react';
import type { MenuItem, User } from '../../../types';
import ItemList from './ItemList';
import ConfirmButton from '../../../components/ui/ConfirmButton';

interface CategoryCardProps {
    cat: string;
    canEdit: boolean;
    showOrderingUI: boolean;
    mode: string;
    setMode: (m: 'normal' | 'delete_selection' | 'edit_cat_selection' | 'edit_sub_selection' | 'edit_sec_selection') => void;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    handleDeleteCategory: (cat: string) => void;
    startRenameCategory: (cat: string) => void;
    editingCatOriginalName: string | null;
    editingCatNewName: string;
    setEditingCatNewName: (s: string) => void;
    saveRenameCategory: () => void;
    modeContext: string | null;
    editItemMode: Record<string, boolean>;
    deleteItemMode: Record<string, boolean>;
    deleteSubCatMode: Record<string, boolean>;
    addingToKey: Record<string, { type: 'item' | 'subcat' | 'section' | null }>;
    cancelAdd: (key: string) => void;
    newSubCatName: string;
    setNewSubCatName: (s: string) => void;
    saveNewSubCat: (cat: string) => void;
    subCategories: Record<string, string[]>;
    handleDeleteSubCategory: (cat: string, sub: string) => void;
    newSectionName: string;
    setNewSectionName: (s: string) => void;
    saveNewSection: (cat: string, sub: string) => void;
    sections: Record<string, string[]>;
    deleteSectionMode: Record<string, boolean>;
    handleDeleteSection: (cat: string, sub: string, sec: string) => void;
    handleDeleteItem: (id: string) => void;
    menu: MenuItem[];
    // Props de ItemList
    startEdit: (item: MenuItem) => void;
    handleAddToOrder: (item: MenuItem) => void;
    user: User;
    // Props de reordenamiento
    isReorderMode: boolean;
    setIsReorderMode: (b: boolean) => void;
    handleReorder: (draggedCat: string, targetCat: string) => void;
    isShiftOpen: boolean;
    // Props de filtrado
    filters: {
        name: string;
        minPrice: string;
        maxPrice: string;
        category: string;
        subcategory: string;
        section: string;
    };
    // Props de renombrado
    editingSubKey: string | null;
    editingSubNewName: string;
    setEditingSubNewName: (s: string) => void;
    startRenameSubCategory: (cat: string, sub: string) => void;
    saveRenameSubCategory: (cat: string, sub: string) => void;
    editingSecKey: string | null;
    editingSecNewName: string;
    setEditingSecNewName: (s: string) => void;
    startRenameSection: (cat: string, sub: string, sec: string) => void;
    saveRenameSection: (cat: string, sub: string, sec: string) => void;
    globalCollapseState: 'expanded' | 'collapsed' | null;
    promotions: import('../../../types').Promotion[];
    onShowDetails?: (item: MenuItem) => void;
    showImages?: boolean;
    setSelectedItemForMenu: (item: MenuItem | null) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = (props) => {
    const {
        cat, canEdit, showOrderingUI, mode, confirmDeleteId, setConfirmDeleteId,
        handleDeleteCategory, startRenameCategory, editingCatOriginalName,
        editingCatNewName, setEditingCatNewName, saveRenameCategory,
        modeContext,
        editItemMode,
        deleteItemMode, deleteSubCatMode,
        addingToKey,
        cancelAdd, newSubCatName, setNewSubCatName, saveNewSubCat,
        subCategories, handleDeleteSubCategory, newSectionName, setNewSectionName,
        saveNewSection, sections, deleteSectionMode,
        handleDeleteSection, handleDeleteItem, menu,
        // Props de ItemList
        startEdit,
        handleAddToOrder, user,
        // Props de reordenamiento
        isReorderMode, setIsReorderMode, handleReorder,
        // Filtros
        filters,
        isShiftOpen,
        // Renombrado
        editingSubKey, editingSubNewName, setEditingSubNewName,
        startRenameSubCategory, saveRenameSubCategory,
        editingSecKey, editingSecNewName, setEditingSecNewName,
        startRenameSection, saveRenameSection,
        globalCollapseState,
        promotions,
        onShowDetails,
        showImages = true,
        setSelectedItemForMenu
    } = props;

    const viewSuffix = showOrderingUI ? 'order' : 'edit';

    const [isCollapsed, setIsCollapsed] = useState(() => {
        const key = `rp_collapsed_cat_${user.username}_${cat}_${viewSuffix}`;
        return localStorage.getItem(key) === 'true';
    });

    const [collapsedSubs, setCollapsedSubs] = useState<Record<string, boolean>>(() => {
        const key = `rp_collapsed_subs_${user.username}_${cat}_${viewSuffix}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {};
    });

    const [collapsedSecs, setCollapsedSecs] = useState<Record<string, boolean>>(() => {
        const key = `rp_collapsed_secs_${user.username}_${cat}_${viewSuffix}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem(`rp_collapsed_cat_${user.username}_${cat}_${viewSuffix}`, isCollapsed.toString());
    }, [isCollapsed, user.username, cat, viewSuffix]);

    useEffect(() => {
        const key = `rp_collapsed_subs_${user.username}_${cat}_${viewSuffix}`;
        localStorage.setItem(key, JSON.stringify(collapsedSubs));
    }, [collapsedSubs, user.username, cat, viewSuffix]);

    useEffect(() => {
        const key = `rp_collapsed_secs_${user.username}_${cat}_${viewSuffix}`;
        localStorage.setItem(key, JSON.stringify(collapsedSecs));
    }, [collapsedSecs, user.username, cat, viewSuffix]);

    const [prevGlobalCollapseState, setPrevGlobalCollapseState] = useState(globalCollapseState);
    // Responder al cambio de alternancia global ajustando el estado durante la renderización
    if (globalCollapseState && prevGlobalCollapseState !== globalCollapseState) {
        setPrevGlobalCollapseState(globalCollapseState);

        if (globalCollapseState === 'expanded') {
            setIsCollapsed(false);
            setCollapsedSubs({});
            setCollapsedSecs({});
        } else if (globalCollapseState === 'collapsed') {
            setIsCollapsed(true);
            const allSubs: Record<string, boolean> = {};
            const allSecs: Record<string, boolean> = {};
            (subCategories[cat] || []).forEach(sub => {
                const subKey = `${cat}::${sub}`;
                allSubs[subKey] = true;
                (sections[subKey] || []).forEach(sec => {
                    allSecs[`${subKey}::${sec}`] = true;
                });
            });
            setCollapsedSubs(allSubs);
            setCollapsedSecs(allSecs);
        }
    }

    const toggleSub = (subKey: string) => {
        setCollapsedSubs(prev => ({ ...prev, [subKey]: !prev[subKey] }));
    };

    const toggleSec = (secKey: string) => {
        setCollapsedSecs(prev => ({ ...prev, [secKey]: !prev[secKey] }));
    };

    // Lógica de pulsación prolongada
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const onPointerDown = (e: React.PointerEvent) => {
        if (!canEdit || isReorderMode) return;
        // No activar en botones o campos de entrada
        if ((e.target as HTMLElement).closest('button, input, .action-menu')) return;

        timerRef.current = setTimeout(() => {
            setIsReorderMode(true);
            if (window.navigator?.vibrate) window.navigator.vibrate(50);
        }, 600);
    };

    const onPointerUp = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    // Manejadores de arrastrar y soltar (Drag and Drop)
    const onDragStart = (e: React.DragEvent) => {
        if (!isReorderMode) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', cat);
        (e.currentTarget as HTMLElement).classList.add('dragging');
    };

    const onDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).classList.remove('dragging');
    };

    const onDragOver = (e: React.DragEvent) => {
        if (!isReorderMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e: React.DragEvent) => {
        if (!isReorderMode) return;
        e.preventDefault();
        const draggedCat = e.dataTransfer.getData('text/plain');
        if (draggedCat && draggedCat !== cat) {
            handleReorder(draggedCat, cat);
        }
    };

    return (
        <div
            className={`glass-card ${isReorderMode ? 'wiggle' : ''}`}
            draggable={isReorderMode}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={e => e.stopPropagation()}
            style={{
                padding: '1rem',
                border: isReorderMode ? '2px solid var(--primary-color)' : undefined,
                position: 'relative',
                overflow: 'visible',
                cursor: isReorderMode ? 'grab' : 'default',
                zIndex: isReorderMode ? 1000 : 1
            }}
        >

            {mode === 'delete_selection' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                    <ConfirmButton
                        id={cat}
                        activeId={confirmDeleteId}
                        setActiveId={setConfirmDeleteId}
                        onAction={() => handleDeleteCategory(cat)}
                        label="ELIMINAR"
                        style={{ padding: '0.75em 1.5em', fontSize: '1.125em', borderRadius: '0.5em' }}
                    />
                </div>
            )}
            {mode === 'edit_cat_selection' && editingCatOriginalName !== cat && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); startRenameCategory(cat); }} style={{ background: 'var(--primary-color)', color: 'white', border: '2px solid white', padding: '0.75em 1.5em', fontSize: '1.125em', fontWeight: 'bold', cursor: 'pointer' }}>EDITAR</button>
                </div>
            )}

            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
                {editingCatOriginalName === cat ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                        <input
                            value={editingCatNewName}
                            onChange={e => setEditingCatNewName(e.target.value)}
                            style={{ flex: 1, padding: '4px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--input-border)' }}
                            autoFocus
                        />
                        <button onClick={(e) => { e.stopPropagation(); saveRenameCategory(); }} style={{ background: 'var(--success-color)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsCollapsed(!isCollapsed)}>
                            <h3 style={{ margin: 0, fontSize: '1.25em' }}>{cat}</h3>
                            <span style={{
                                display: 'inline-block',
                                transition: 'transform 0.2s',
                                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                fontSize: '12px',
                                opacity: 0.7
                            }}>
                                ▼
                            </span>
                        </div>

                    </>
                )}
            </div>

            {!isCollapsed && (
                <>
                    {/* Formularios en la categoría principal */}

                    {canEdit && addingToKey[cat]?.type === 'subcat' && (
                        <div style={{ background: 'var(--primary-color-alpha-20)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '2px dashed var(--primary-color)' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.7em' }}>NUEVA SUBCATEGORÍA</label>
                                <input placeholder="Nombre..." value={newSubCatName} onChange={e => setNewSubCatName(e.target.value)} autoFocus style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--input-border)' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button onClick={() => cancelAdd(cat)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9em' }}>Cancelar</button>
                                <button onClick={() => saveNewSubCat(cat)} style={{ padding: '0.5rem 1.25rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
                            </div>
                        </div>
                    )}

                    <ItemList
                        items={menu.filter((m: MenuItem) => {
                            if (m.category !== cat || m.subcategory || m.section) return false;
                            if (filters.name && !m.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
                            if (filters.minPrice && m.price < Number(filters.minPrice)) return false;
                            if (filters.maxPrice && m.price > Number(filters.maxPrice)) return false;
                            return true;
                        })}
                        cat={cat} canEdit={canEdit} showOrderingUI={showOrderingUI} deleteItemMode={deleteItemMode} editItemMode={editItemMode} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} handleDeleteItem={handleDeleteItem} startEdit={startEdit} handleAddToOrder={handleAddToOrder}
                        isShiftOpen={isShiftOpen}
                        promotions={promotions}
                        onShowDetails={onShowDetails}
                        setSelectedItemForMenu={setSelectedItemForMenu}
                    />

                    {subCategories[cat]
                        ?.filter(sub => !filters.subcategory || sub === filters.subcategory)
                        .map(sub => {
                            const subKey = `${cat}::${sub}`;
                            const isSubCollapsed = !!collapsedSubs[subKey];
                            return (
                                <div key={sub} style={{ marginTop: '16px', borderTop: '1px dashed var(--card-border)', paddingTop: '16px', paddingLeft: '12px', position: 'relative' }}>

                                    {/* SUPERPOSICIÓN DE ELIMINACIÓN DE SUBCATEGORÍA */}
                                    {canEdit && deleteSubCatMode[cat] && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                                            <ConfirmButton
                                                id={cat + ':' + sub}
                                                activeId={confirmDeleteId}
                                                setActiveId={setConfirmDeleteId}
                                                onAction={() => handleDeleteSubCategory(cat, sub)}
                                                label="ELIMINAR"
                                            />
                                        </div>
                                    )}

                                    {/* SUPERPOSICIÓN DE RENOMBRADO DE SUBCATEGORÍA */}
                                    {mode === 'edit_sub_selection' && modeContext === cat && editingSubKey !== subKey && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }} onClick={e => e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); startRenameSubCategory(cat, sub); }} style={{ background: 'var(--primary-color)', color: 'white', border: '2px solid white', padding: '0.5em 1em', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>EDITAR</button>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleSub(subKey)}>
                                            {editingSubKey === subKey ? (
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                                    <input
                                                        value={editingSubNewName}
                                                        onChange={e => setEditingSubNewName(e.target.value)}
                                                        style={{ padding: '2px 6px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--primary-color)', fontSize: '0.9em' }}
                                                        autoFocus
                                                    />
                                                    <button onClick={(e) => { e.stopPropagation(); saveRenameSubCategory(cat, sub); }} style={{ background: 'var(--success-color)', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.1em' }}>{sub}</h4>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        transition: 'transform 0.2s',
                                                        transform: isSubCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                        fontSize: '12px',
                                                        opacity: 0.7,
                                                        color: 'var(--primary-color)'
                                                    }}>
                                                        ▼
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                    </div>

                                    {!isSubCollapsed && (
                                        <>
                                            {/* Formulario para sección en subcategoría */}
                                            {canEdit && addingToKey[subKey]?.type === 'section' && (
                                                <div style={{ background: 'var(--primary-color-alpha-20)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '2px dashed var(--primary-color)' }}>
                                                    <div className="form-group">
                                                        <label className="form-label" style={{ fontSize: '0.7em' }}>NUEVA SECCIÓN</label>
                                                        <input placeholder="Ej: Pequeña, Grande..." value={newSectionName} onChange={e => setNewSectionName(e.target.value)} autoFocus style={{ background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--input-border)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                                        <button onClick={() => cancelAdd(subKey)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--card-border)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9em' }}>Cancelar</button>
                                                        <button onClick={() => saveNewSection(cat, sub)} style={{ padding: '0.5rem 1.25rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
                                                    </div>
                                                </div>
                                            )}


                                            <ItemList
                                                items={menu.filter((m: MenuItem) => {
                                                    if (m.category !== cat || m.subcategory !== sub || m.section) return false;
                                                    if (filters.name && !m.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
                                                    if (filters.minPrice && m.price < Number(filters.minPrice)) return false;
                                                    if (filters.maxPrice && m.price > Number(filters.maxPrice)) return false;
                                                    return true;
                                                })}
                                                cat={cat} canEdit={canEdit} showOrderingUI={showOrderingUI} deleteItemMode={deleteItemMode} editItemMode={editItemMode} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} handleDeleteItem={handleDeleteItem} startEdit={startEdit} handleAddToOrder={handleAddToOrder}
                                                isShiftOpen={isShiftOpen}
                                                promotions={promotions}
                                                onShowDetails={onShowDetails}
                                                showImages={showImages}
                                                setSelectedItemForMenu={setSelectedItemForMenu}
                                            />

                                            {sections[subKey]
                                                ?.filter(sec => !filters.section || sec === filters.section)
                                                .map(sec => {
                                                    const secKey = `${cat}::${sub}::${sec}`;
                                                    const isSecCollapsed = !!collapsedSecs[secKey];
                                                    return (
                                                        <div key={sec} style={{ marginTop: '0.5rem', paddingLeft: '0.75rem', borderLeft: '2px solid var(--primary-color-alpha-20)', position: 'relative' }}>

                                                            {/* SUPERPOSICIÓN DE ELIMINACIÓN DE SECCIÓN */}
                                                            {canEdit && deleteSectionMode[cat] && (
                                                                <div style={{ position: 'absolute', inset: 0, background: 'var(--glass-bg)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
                                                                    <ConfirmButton
                                                                        id={cat + ':' + sub + ':' + sec}
                                                                        activeId={confirmDeleteId}
                                                                        setActiveId={setConfirmDeleteId}
                                                                        onAction={() => handleDeleteSection(cat, sub, sec)}
                                                                        label="ELIMINAR"
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* SUPERPOSICIÓN DE RENOMBRADO DE SECCIÓN */}
                                                            {mode === 'edit_sec_selection' && modeContext === cat && editingSecKey !== secKey && (
                                                                <div style={{ position: 'absolute', inset: 0, background: 'var(--glass-bg)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', backdropFilter: 'blur(4px)' }} onClick={e => e.stopPropagation()}>
                                                                    <button onClick={(e) => { e.stopPropagation(); startRenameSection(cat, sub, sec); }} style={{ background: 'var(--primary-color)', color: 'white', border: '2px solid white', padding: '0.2rem 0.5rem', fontSize: '0.8em', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>EDITAR</button>
                                                                </div>
                                                            )}

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleSec(secKey)}>
                                                                    {editingSecKey === secKey ? (
                                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                                                            <input
                                                                                value={editingSecNewName}
                                                                                onChange={e => setEditingSecNewName(e.target.value)}
                                                                                style={{ padding: '1px 4px', borderRadius: '4px', background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--primary-color)', fontSize: '0.8em', width: '100px' }}
                                                                                autoFocus
                                                                            />
                                                                            <button onClick={(e) => { e.stopPropagation(); saveRenameSection(cat, sub, sec); }} style={{ background: 'var(--success-color)', color: 'white', border: 'none', padding: '1px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>✓</button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <span style={{ fontSize: '0.9em', fontWeight: 'bold', color: 'var(--text-color)' }}>{sec}</span>
                                                                            <span style={{
                                                                                display: 'inline-block',
                                                                                transition: 'transform 0.2s',
                                                                                transform: isSecCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                                                fontSize: '12px',
                                                                                opacity: 0.7,
                                                                                color: 'var(--text-color)'
                                                                            }}>
                                                                                ▼
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {!isSecCollapsed && (
                                                                <>

                                                                    <ItemList
                                                                        items={menu.filter((m: MenuItem) => {
                                                                            if (m.category !== cat || m.subcategory !== sub || m.section !== sec) return false;
                                                                            if (filters.name && !m.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
                                                                            if (filters.minPrice && m.price < Number(filters.minPrice)) return false;
                                                                            if (filters.maxPrice && m.price > Number(filters.maxPrice)) return false;
                                                                            return true;
                                                                        })}
                                                                        cat={cat} canEdit={canEdit} showOrderingUI={showOrderingUI} deleteItemMode={deleteItemMode} editItemMode={editItemMode} confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId} handleDeleteItem={handleDeleteItem} startEdit={startEdit} handleAddToOrder={handleAddToOrder}
                                                                        isShiftOpen={isShiftOpen}
                                                                        promotions={promotions}
                                                                        onShowDetails={onShowDetails}
                                                                        setSelectedItemForMenu={setSelectedItemForMenu}
                                                                    />
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                </>
            )}
        </div>
    );
};

export default CategoryCard;
