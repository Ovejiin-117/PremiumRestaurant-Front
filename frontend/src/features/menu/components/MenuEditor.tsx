import React, { useEffect } from 'react';
import type { MenuItem, User, Order, UIScale, LayoutOrientation } from '../../../types';
import { useMenuEditor } from '../hooks/useMenuEditor';
import { isPromotionActive } from '../../../utils/promotionUtils';
import MenuHeader from './MenuHeader';
import CategoryCard from './CategoryCard';
import OrderPanel from './OrderPanel';
import MenuFilter from './MenuFilter';
import ItemList from './ItemList';
import SecurityModal from '../../../components/ui/SecurityModal';
import AddItemForm from '../../../components/ui/AddItemForm';
import EditItemForm from './EditItemForm';
import TaxonomyManager from './TaxonomyManager';

interface Props {
    user: User;
    menu: MenuItem[];
    setMenu: (menu: MenuItem[]) => void;
    categories: string[];
    setCategories: (categories: string[]) => void;
    subCategories: Record<string, string[]>;
    setSubCategories: (subs: Record<string, string[]>) => void;
    back: () => void;
    isOrderingMode?: boolean;
    sections: Record<string, string[]>;
    setSections: (sections: Record<string, string[]>) => void;
    history: Order[];
    setHistory: React.Dispatch<React.SetStateAction<Order[]>>;
    uiScale: UIScale;
    setUiScale: (s: UIScale) => void;
    layoutOrientation: LayoutOrientation;
    setLayoutOrientation: (o: LayoutOrientation) => void;
    currentShiftId: string | null;
    logAction: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
    ticketWidth: number;
    setTicketWidth: (w: number) => void;
    taxConfig: import('../../../types').TaxConfig;
    promotions: import('../../../types').Promotion[];
    showImages?: boolean;
}

const PromoBanner = ({ promotions }: { promotions: import('../../../types').Promotion[] }) => {
    const activePromos = promotions.filter(p => isPromotionActive(p));
    if (activePromos.length === 0) return null;

    return (
        <div style={{
            marginBottom: '1.5rem',
            overflowX: 'auto',
            display: 'flex',
            gap: '1rem',
            padding: '1rem 0.5rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
        }}>
            {activePromos.map(promo => (
                <div key={promo.id} style={{
                    minWidth: '280px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px',
                        background: 'var(--primary-color)', opacity: 0.05, borderRadius: '50%'
                    }} />

                    <div style={{
                        width: '45px', height: '45px', borderRadius: '12px',
                        background: 'var(--primary-color)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                        boxShadow: '0 4px 10px var(--primary-color-alpha-20)'
                    }}>
                        {promo.type === 'percentage' ? '🏷️' : '🎁'}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                            ¡Promoción Activa!
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '2px' }}>
                            {promo.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {promo.type === 'percentage' ? `${promo.value}% de Descuento` : `${promo.take}x${promo.pay} en productos`}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function MenuEditor(props: Props) {
    const {
        user, back, isOrderingMode, categories,
        subCategories, sections, menu,
        uiScale, setUiScale, layoutOrientation, setLayoutOrientation,
        currentShiftId, logAction, ticketWidth, setTicketWidth, taxConfig, promotions, showImages = true
    } = props;
    const { state, handlers } = useMenuEditor({ ...props, currentShiftId, logAction, promotions });

    const [filters, setFilters] = React.useState({
        name: "",
        minPrice: "",
        maxPrice: "",
        category: "",
        subcategory: "",
        section: "",
        type: ""
    });

    // Custom Security Modal States
    const [pendingAction, setPendingAction] = React.useState<{ type: string, data?: any, callback: () => void } | null>(null);
    const [showSecurityModal, setShowSecurityModal] = React.useState(false);
    const [showExitConfirm, setShowExitConfirm] = React.useState(false);
    const [selectedItemForDetails, setSelectedItemForDetails] = React.useState<MenuItem | null>(null);

    const handleBack = () => {
        if (state.currentOrder.length > 0) {
            setShowExitConfirm(true);
        } else {
            back();
        }
    };

    const requestSecureAction = (actionType: string, callback: () => void, data?: any) => {
        setPendingAction({ type: actionType, callback, data });
        setShowSecurityModal(true);
    };

    const isWaiter = user.role === 'waiter';
    const canEdit = !isWaiter && !isOrderingMode;
    const showOrderingUI = !!isWaiter || !!isOrderingMode;

    // Filter Logic
    const isFiltering = !!(filters.name || filters.minPrice || filters.maxPrice || filters.category || filters.subcategory || filters.section);

    const getFilterScore = (item: MenuItem) => {
        if (!filters.name) return 0;
        const name = item.name.toLowerCase();
        const search = filters.name.toLowerCase();
        if (name === search) return 100;
        if (name.startsWith(search)) return 50;
        if (name.includes(search)) return 10;
        return 0;
    };

    const filteredAndSortedItems = props.menu
        .filter(m => {
            if (filters.category && m.category !== filters.category) return false;
            if (filters.subcategory && m.subcategory !== filters.subcategory) return false;
            if (filters.section && m.section !== filters.section) return false;
            if (filters.name && !m.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
            if (filters.minPrice && m.price < Number(filters.minPrice)) return false;
            if (filters.maxPrice && m.price > Number(filters.maxPrice)) return false;
            if (filters.type && m.type !== filters.type) return false;
            return true;
        })
        .sort((a, b) => getFilterScore(b) - getFilterScore(a))
        .slice(0, 20);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handlers.resetMode();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);

    return (
        <div className={`scale-${uiScale}`}>
            <div
                className="page-container"
                style={{ display: "flex", gap: "2rem", flexDirection: layoutOrientation === 'horizontal' ? 'row' : 'column' }}
                onClick={handlers.handleBackgroundClick}
            >
                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <MenuHeader
                        back={handleBack}
                        canEdit={canEdit}
                        mode={state.mode}
                        showCatMenu={state.showCatMenu}
                        setShowCatMenu={state.setShowCatMenu}
                        showCatInput={state.showCatInput}
                        setShowCatInput={state.setShowCatInput}
                        newCatName={state.newCatName}
                        setNewCatName={state.setNewCatName}
                        handleAddCategory={handlers.handleAddCategory}
                        setMode={state.setMode}
                        uiScale={uiScale}
                        setUiScale={setUiScale}
                        layoutOrientation={layoutOrientation}
                        setLayoutOrientation={setLayoutOrientation}
                        showOrientation={true}
                        setIsReorderMode={state.setIsReorderMode}
                        requestSecureAction={requestSecureAction}
                        onAddProduct={() => state.setShowAddItemGlobal(true)}
                        onShowTaxonomyManager={() => state.setShowTaxonomyManager(true)}
                    />

                    <h1 style={{ marginTop: "1rem", fontSize: "2em" }}>{showOrderingUI ? 'Menú' : 'Editor de Menú'}</h1>

                    {showOrderingUI && <PromoBanner promotions={promotions} />}

                    <MenuFilter
                        onFilterChange={setFilters}
                        categories={props.categories}
                        subcategories={props.subCategories}
                        sections={props.sections}
                        onToggleAll={handlers.toggleGlobalCollapse}
                        globalCollapseState={state.globalCollapseState}
                    />


                    {isFiltering ? (
                        <div className="glass-card" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', opacity: 0.6, fontSize: '0.9em', letterSpacing: '0.05em' }}>RESULTADOS DE BÚSQUEDA</h3>
                            {filteredAndSortedItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                    No se encontraron productos coincidentes.
                                </div>
                            ) : (
                                <ItemList
                                    items={filteredAndSortedItems}
                                    cat="search" // Use a dummy cat for search results
                                    variant="detailed-list"
                                    canEdit={canEdit}
                                    showOrderingUI={showOrderingUI}
                                    deleteItemMode={{}} // No item delete in search mode for now to keep it simple
                                    editItemMode={{}}
                                    confirmDeleteId={state.confirmDeleteId}
                                    setConfirmDeleteId={state.setConfirmDeleteId}
                                    handleDeleteItem={handlers.handleDeleteItem}
                                    startEdit={handlers.startEdit}
                                    handleAddToOrder={handlers.handleAddToOrder}
                                    isShiftOpen={!!currentShiftId}
                                    showBreadcrumbs={true}
                                    promotions={promotions}
                                    showImages={showImages}
                                    onShowDetails={setSelectedItemForDetails}
                                    setSelectedItemForMenu={state.setSelectedItemForMenu}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: layoutOrientation === 'horizontal' ? 'repeat(auto-fill, minmax(18rem, 1fr))' : '1fr',
                            gap: '1rem',
                            paddingBottom: '6.25em',
                            alignItems: 'start'
                        }}>
                            {categories.map(cat => (
                                <CategoryCard
                                    key={cat}
                                    cat={cat}
                                    filters={filters}
                                    promotions={promotions}
                                    canEdit={canEdit}
                                    showOrderingUI={showOrderingUI}
                                    mode={state.mode}
                                    setMode={state.setMode}
                                    confirmDeleteId={state.confirmDeleteId}
                                    setConfirmDeleteId={state.setConfirmDeleteId}
                                    handleDeleteCategory={handlers.handleDeleteCategory}
                                    handleDeleteItem={handlers.handleDeleteItem}
                                    startRenameCategory={handlers.startRenameCategory}
                                    editingCatOriginalName={state.editingCatOriginalName}
                                    editingCatNewName={state.editingCatNewName}
                                    setEditingCatNewName={state.setEditingCatNewName}
                                    saveRenameCategory={handlers.saveRenameCategory}
                                    modeContext={state.modeContext}
                                    editItemMode={state.editItemMode}
                                    deleteItemMode={state.deleteItemMode}
                                    deleteSubCatMode={state.deleteSubCatMode}
                                    addingToKey={state.addingToKey}
                                    cancelAdd={handlers.cancelAdd}
                                    newSubCatName={state.newSubCatName}
                                    setNewSubCatName={state.setNewSubCatName}
                                    saveNewSubCat={handlers.saveNewSubCat}
                                    subCategories={subCategories}
                                    handleDeleteSubCategory={handlers.handleDeleteSubCategory}
                                    newSectionName={state.newSectionName}
                                    setNewSectionName={state.setNewSectionName}
                                    saveNewSection={handlers.saveNewSection}
                                    sections={sections}
                                    deleteSectionMode={state.deleteSectionMode}
                                    handleDeleteSection={handlers.handleDeleteSection}
                                    menu={menu}
                                    // ItemList props
                                    startEdit={handlers.startEdit}
                                    handleAddToOrder={handlers.handleAddToOrder}
                                    user={user}
                                    isShiftOpen={!!currentShiftId}
                                    // Reorder props
                                    isReorderMode={state.isReorderMode}
                                    setIsReorderMode={state.setIsReorderMode}
                                    handleReorder={handlers.handleReorder}
                                    // Filters
                                    // Subcategory & Section rename props
                                    editingSubKey={state.editingSubKey}
                                    editingSubNewName={state.editingSubNewName}
                                    setEditingSubNewName={state.setEditingSubNewName}
                                    startRenameSubCategory={handlers.startRenameSubCategory}
                                    saveRenameSubCategory={handlers.saveRenameSubCategory}
                                    editingSecKey={state.editingSecKey}
                                    editingSecNewName={state.editingSecNewName}
                                    setEditingSecNewName={state.setEditingSecNewName}
                                    startRenameSection={handlers.startRenameSection}
                                    saveRenameSection={handlers.saveRenameSection}
                                    globalCollapseState={state.globalCollapseState}
                                    onShowDetails={setSelectedItemForDetails}
                                    showImages={showImages}
                                    setSelectedItemForMenu={state.setSelectedItemForMenu}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Bill Panel for Ordering Mode */}
                {showOrderingUI && (
                    <OrderPanel
                        currentOrder={state.currentOrder}
                        calculateTotal={handlers.calculateTotal}
                        handleDecreaseQuantity={handlers.handleDecreaseQuantity}
                        handleIncreaseQuantity={handlers.handleIncreaseQuantity}
                        handleRemoveFromOrder={handlers.handleRemoveFromOrder}
                        showNoteInput={state.showNoteInput}
                        setShowNoteInput={state.setShowNoteInput}
                        orderNote={state.orderNote}
                        setOrderNote={state.setOrderNote}
                        handleSubmitOrder={handlers.handleSubmitOrder}
                        isConfirmingOrder={state.isConfirmingOrder}
                        isShiftOpen={!!currentShiftId}
                        ticketWidth={ticketWidth}
                        setTicketWidth={setTicketWidth}
                        taxConfig={taxConfig}
                        promotions={promotions}
                    />
                )}

                {/* Formal Shift Required Modal */}
                {state.showShiftModal && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="glass-card" style={{
                            maxWidth: '450px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '3rem'
                        }}>
                            <div style={{
                                width: '4rem', height: '4rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2em', border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                ⚠️
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5em', fontWeight: 'bold' }}>Acceso Restringido</h2>
                                <p style={{ margin: 0, opacity: 0.7, lineHeight: '1.6', fontSize: '1.1em' }}>
                                    No hay un turno activo en este momento. Es necesario iniciar un turno para poder tomar pedidos o procesar pagos.
                                </p>
                            </div>
                            <button
                                onClick={() => state.setShowShiftModal(false)}
                                style={{
                                    padding: '1rem 2rem', borderRadius: '0.75rem', background: 'var(--primary-color)', color: 'white',
                                    border: 'none', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px var(--primary-color-alpha-20)'
                                }}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                )}

                {/* Exit Confirmation Modal */}
                {showExitConfirm && (
                    <div style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="glass-card" style={{
                            maxWidth: '450px', width: '90%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem', padding: '3rem'
                        }}>
                            <div style={{
                                width: '4rem', height: '4rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2em', border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                🛒
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.5em', fontWeight: 'bold' }}>Pedido en Curso</h2>
                                <p style={{ margin: 0, opacity: 0.7, lineHeight: '1.6', fontSize: '1.1em' }}>
                                    Tienes productos seleccionados en el pedido. Si sales ahora, se perderán estos cambios. ¿Estás seguro de que deseas salir?
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '0.75rem', background: 'var(--card-hover-bg)', color: 'var(--text-color)',
                                        border: '1px solid var(--card-border)', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    Seguir Pidiendo
                                </button>
                                <button
                                    onClick={() => {
                                        setShowExitConfirm(false);
                                        back();
                                    }}
                                    style={{
                                        flex: 1, padding: '1rem', borderRadius: '0.75rem', background: 'var(--danger-color)', color: 'white',
                                        border: 'none', fontWeight: 'bold', fontSize: '1.1em', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px var(--danger-color-alpha-20)'
                                    }}
                                >
                                    Salir y Borrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shared Security Modal */}
                <SecurityModal
                    isOpen={showSecurityModal}
                    onClose={() => { setShowSecurityModal(false); setPendingAction(null); }}
                    onConfirm={() => {
                        if (pendingAction) {
                            pendingAction.callback();
                            setShowSecurityModal(false);
                            setPendingAction(null);
                        }
                    }}
                    userPassword={user.password}
                    title="Seguridad Requerida"
                    message="Esta acción requiere confirmación del administrador."
                />

                {/* Product Details Modal */}
                {selectedItemForDetails && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                    }} onClick={() => setSelectedItemForDetails(null)}>
                        <div className="glass-card" style={{
                            maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center',
                            position: 'relative', border: '1px solid var(--primary-color-alpha-50)'
                        }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedItemForDetails(null)}
                                style={{
                                    position: 'absolute', top: '15px', right: '15px', background: 'none',
                                    border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem'
                                }}
                            >
                                ✕
                            </button>

                            <div style={{
                                width: '100%', aspectRatio: '16/9', borderRadius: '12px',
                                background: 'var(--card-hover-bg)', marginBottom: '1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', border: '1px solid var(--card-border)'
                            }}>
                                {selectedItemForDetails.image ? (
                                    <img
                                        src={selectedItemForDetails.image}
                                        alt={selectedItemForDetails.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div style={{ color: 'var(--text-secondary)', opacity: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '3rem' }}>🖼️</span>
                                        <span>No hay imagen disponible</span>
                                    </div>
                                )}
                            </div>

                            <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)' }}>{selectedItemForDetails.name}</h2>
                            <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
                                ${selectedItemForDetails.price}
                            </div>

                            <div style={{
                                textAlign: 'left', background: 'rgba(255,255,255,0.05)',
                                padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
                                maxHeight: '150px', overflowY: 'auto'
                            }}>
                                <label style={{ display: 'block', fontSize: '0.75em', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Descripción</label>
                                <p style={{ margin: 0, color: 'var(--text-color)', lineHeight: '1.4', fontSize: '0.9em' }}>
                                    {selectedItemForDetails.description || "Sin descripción disponible para este producto."}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setSelectedItemForDetails(null)}
                                    style={{
                                        flex: 1, padding: '12px', borderRadius: '8px',
                                        background: 'var(--card-hover-bg)', color: 'var(--text-color)',
                                        border: '1px solid var(--card-border)', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    Cerrar
                                </button>
                                {canEdit && (
                                    <button
                                        onClick={() => {
                                            const itemToEdit = selectedItemForDetails;
                                            setSelectedItemForDetails(null);
                                            handlers.startEdit(itemToEdit);
                                        }}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '8px',
                                            background: 'var(--primary-color)', color: 'white',
                                            border: 'none', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        Editar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Opciones para Producto (Centralizado) */}
                {state.selectedItemForMenu && (() => {
                    const item = state.selectedItemForMenu;
                    return (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
                        }} onClick={() => state.setSelectedItemForMenu(null)}>
                            <div className="glass-card" style={{
                                maxWidth: '400px', width: '90%', padding: '2.5rem', textAlign: 'center',
                                position: 'relative', border: '1px solid var(--primary-color-alpha-50)',
                                display: 'flex', flexDirection: 'column', gap: '1.5rem'
                            }} onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => state.setSelectedItemForMenu(null)}
                                    style={{
                                        position: 'absolute', top: '15px', right: '15px', background: 'none',
                                        border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem',
                                        lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '32px', height: '32px'
                                    }}
                                >
                                    ✕
                                </button>

                                <div style={{ marginBottom: '0.5rem' }}>
                                    <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', fontSize: '1.5rem' }}>{item.name}</h2>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestión de producto</p>
                                </div>

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <button
                                        onClick={() => {
                                            requestSecureAction('edit_item', () => {
                                                handlers.startEdit(item);
                                                state.setSelectedItemForMenu(null);
                                            });
                                        }}
                                        style={{
                                            padding: '1rem', borderRadius: '12px', background: 'var(--primary-color-alpha-10)',
                                            border: '1px solid var(--primary-color)', color: 'var(--primary-color)', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-color-alpha-20)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-color-alpha-10)'}
                                    >
                                        Editar Producto
                                    </button>

                                    <button
                                        onClick={() => {
                                            requestSecureAction('toggle_availability', () => {
                                                handlers.toggleAvailability(item.id);
                                                state.setSelectedItemForMenu(null);
                                            });
                                        }}
                                        style={{
                                            padding: '1rem', borderRadius: '12px', background: item.available ? 'var(--danger-color-alpha-10)' : 'var(--success-color-alpha-10)',
                                            border: `1px solid ${item.available ? 'var(--danger-color)' : 'var(--success-color)'}`,
                                            color: item.available ? 'var(--danger-color)' : 'var(--success-color)',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = item.available ? 'var(--danger-color-alpha-20)' : 'var(--success-color-alpha-20)'}
                                        onMouseLeave={e => e.currentTarget.style.background = item.available ? 'var(--danger-color-alpha-10)' : 'var(--success-color-alpha-10)'}
                                    >
                                        {item.available ? 'Marcar como Agotado' : 'Marcar como Disponible'}
                                    </button>

                                    <button
                                        onClick={() => {
                                            requestSecureAction('delete_item', () => {
                                                handlers.handleDeleteItem(item.id);
                                                state.setSelectedItemForMenu(null);
                                            });
                                        }}
                                        style={{
                                            padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid var(--danger-color)', color: 'var(--danger-color)', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        Eliminar Producto
                                    </button>
                                </div>

                                <button
                                    onClick={() => state.setSelectedItemForMenu(null)}
                                    style={{
                                        marginTop: '0.5rem', padding: '10px', borderRadius: '8px',
                                        background: 'transparent', border: '1px solid var(--card-border)',
                                        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    );
                })()}

                {/* Global Add Item Form */}
                {state.showAddItemGlobal && (
                    <AddItemForm
                        onSave={(name, price, type, desc, img, cat, sub, sec) => {
                            handlers.saveNewItem(cat!, name, price, type, sub, sec, desc, img);
                            state.setShowAddItemGlobal(false);
                        }}
                        onCancel={() => state.setShowAddItemGlobal(false)}
                        categories={props.categories}
                        subCategories={props.subCategories}
                        sections={props.sections}
                    />
                )}

                {state.editingItemId && (() => {
                    const itemToEdit = props.menu.find(i => i.id === state.editingItemId);
                    if (!itemToEdit) return null;
                    return (
                        <EditItemForm
                            item={itemToEdit}
                            onSave={(name, price, type, cat, sub, sec, desc, img) => {
                                handlers.saveEdit(itemToEdit.id, name, price, type, cat, sub, sec, desc, img);
                            }}
                            onCancel={() => state.setEditingItemId(null)}
                            categories={props.categories}
                            subCategories={props.subCategories}
                            sections={props.sections}
                        />
                    );
                })()}

                {/* Taxonomy Manager */}
                {state.showTaxonomyManager && (
                    <TaxonomyManager
                        categories={props.categories}
                        subCategories={props.subCategories}
                        sections={props.sections}
                        onClose={() => state.setShowTaxonomyManager(false)}
                        uiScale={uiScale}
                        handlers={{
                            handleAddCategory: handlers.handleAddCategory,
                            handleDeleteCategory: handlers.handleDeleteCategory,
                            handleRenameCategory: (old, newVal) => handlers.saveRenameCategory(old, newVal),
                            handleAddSubCategory: (cat, name) => handlers.saveNewSubCat(cat, name),
                            handleDeleteSubCategory: handlers.handleDeleteSubCategory,
                            handleRenameSubCategory: (cat, old, newVal) => handlers.saveRenameSubCategory(cat, old, newVal),
                            handleAddSection: (cat, sub, name) => handlers.saveNewSection(cat, sub, name),
                            handleDeleteSection: handlers.handleDeleteSection,
                            handleRenameSection: (cat, sub, old, newVal) => handlers.saveRenameSection(cat, sub, old, newVal),
                            isNameUnique: handlers.isNameUnique
                        }}
                    />
                )}
            </div>
        </div>
    );
}