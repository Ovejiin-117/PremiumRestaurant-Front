import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem, User, Order, Promotion, CartItem, OrderItem } from '../../../types';
import { isPromotionActive } from '../../../utils/promotionUtils';
import { calculateOrderTax } from '../../../utils/taxUtils';

type Mode = 'normal' | 'delete_selection' | 'edit_cat_selection' | 'edit_sub_selection' | 'edit_sec_selection';

interface UseMenuEditorProps {
    user: User;
    menu: MenuItem[];
    setMenu: (menu: MenuItem[]) => void;
    categories: string[];
    setCategories: (categories: string[]) => void;
    subCategories: Record<string, string[]>;
    setSubCategories: (subs: Record<string, string[]>) => void;
    sections: Record<string, string[]>;
    setSections: (sections: Record<string, string[]>) => void;
    history: Order[];
    setHistory: React.Dispatch<React.SetStateAction<Order[]>>;
    currentShiftId: string | null;
    logAction: (action: import('../../../types').AuditAction, details: string, entityId?: string) => void;
    promotions: import('../../../types').Promotion[];
    taxConfig?: import('../../../types').TaxConfig;
}

export const useMenuEditor = ({
    user, menu, setMenu, categories, setCategories, subCategories, setSubCategories, sections, setSections, history, setHistory, currentShiftId, logAction, promotions, taxConfig
}: UseMenuEditorProps) => {
    // Modo global (Nivel de categoría)
    const [showCatMenu, setShowCatMenu] = useState(false);
    const [showCatInput, setShowCatInput] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [mode, setMode] = useState<Mode>('normal');
    const [editingCatOriginalName, setEditingCatOriginalName] = useState<string | null>(null);
    const [editingCatNewName, setEditingCatNewName] = useState('');
    const [modeContext, setModeContext] = useState<string | null>(null);

    // Estado por categoría
    const [openActionMenuCat, setOpenActionMenuCat] = useState<string | null>(null);
    const [openActionMenuSub, setOpenActionMenuSub] = useState<string | null>(null);
    const [deleteSubCatMode, setDeleteSubCatMode] = useState<Record<string, boolean>>({});
    const [deleteSectionMode, setDeleteSectionMode] = useState<Record<string, boolean>>({});
    const [deleteItemMode, setDeleteItemMode] = useState<Record<string, boolean>>({});
    const [editItemMode, setEditItemMode] = useState<Record<string, boolean>>({});

    // Estado de confirmación en 2 pasos
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Estado de adición
    const [addingToKey, setAddingToKey] = useState<Record<string, { type: 'item' | 'subcat' | 'section' | null }>>({});

    const [newSubCatName, setNewSubCatName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');

    // Estado de edición
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPrice, setEditPrice] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImage, setEditImage] = useState('');
    const [editType, setEditType] = useState<import('../../../types').ItemType>('alimento');
    const [editCategory, setEditCategory] = useState('');
    const [editSubcategory, setEditSubcategory] = useState('');
    const [editSection, setEditSection] = useState('');

    const [editingSubKey, setEditingSubKey] = useState<string | null>(null);
    const [editingSubNewName, setEditingSubNewName] = useState('');
    const [editingSecKey, setEditingSecKey] = useState<string | null>(null);
    const [editingSecNewName, setEditingSecNewName] = useState('');

    // Estado del pedido
    const [currentOrder, setCurrentOrder] = useState<CartItem[]>([]);
    const [orderNote, setOrderNote] = useState("");

    const setModeSafe = (newMode: Mode | ((prev: Mode) => Mode)) => {
        setMode(prev => {
            const next = typeof newMode === 'function' ? newMode(prev) : newMode;
            if (next === 'normal') setModeContext(null);
            return next;
        });
    };

    const [showNoteInput, setShowNoteInput] = useState(false);
    const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);

    // Modo de reordenamiento
    const [isReorderMode, setIsReorderMode] = useState(false);

    // Estado de expansión global (inicia siempre colapsado cada vez que se entra al menú)
    const [globalCollapseState, setGlobalCollapseState] = useState<'expanded' | 'collapsed' | null>('collapsed');

    const [showAddItemGlobal, setShowAddItemGlobal] = useState(false);
    const [showTaxonomyManager, setShowTaxonomyManager] = useState(false);
    const [selectedItemForMenu, setSelectedItemForMenu] = useState<MenuItem | null>(null);

    const toggleGlobalCollapse = () => {
        setGlobalCollapseState(prev => (prev === 'expanded' ? 'collapsed' : 'expanded'));
    };

    // Lógica de unicidad y limpieza
    const isNameUnique = (name: string, excludeId?: string) => {
        const lowerName = name.trim().toLowerCase();
        if (!lowerName) return false;

        // Verificar categorías
        if (categories.some(c => c.toLowerCase() === lowerName)) return false;

        // Verificar subcategorías
        if (Object.values(subCategories).some(subs => subs.some(s => s.toLowerCase() === lowerName))) return false;

        // Verificar secciones
        if (Object.values(sections).some(secs => secs.some(s => s.toLowerCase() === lowerName))) return false;

        // Verificar productos
        if (menu.some(m => m.name.toLowerCase() === lowerName && m.id !== excludeId)) return false;

        return true;
    };

    const cleanupHasRun = useRef(false);
    useEffect(() => {
        if (cleanupHasRun.current) return;
        cleanupHasRun.current = true;

        let hasChanged = false;
        let finalMenu = [...menu];
        let finalCategories = [...categories];
        let finalSubCategories = { ...subCategories };
        let finalSections = { ...sections };

        const usedNames = new Set<string>();

        // 1. Limpiar categorías y mapear cambios
        finalCategories = finalCategories.map(cat => {
            let name = cat;
            if (usedNames.has(name.toLowerCase())) {
                name = `Cat ${name}`;
                while (usedNames.has(name.toLowerCase())) name = `${name}*`;
                hasChanged = true;

                if (finalSubCategories[cat]) {
                    finalSubCategories[name] = finalSubCategories[cat];
                    delete finalSubCategories[cat];
                }
                Object.keys(finalSections).forEach(key => {
                    if (key.startsWith(`${cat}::`)) {
                        const newKey = key.replace(`${cat}::`, `${name}::`);
                        finalSections[newKey] = finalSections[key];
                        delete finalSections[key];
                    }
                });
                finalMenu = finalMenu.map(m => m.category === cat ? { ...m, category: name } : m);
            }
            usedNames.add(name.toLowerCase());
            return name;
        });

        // 2. Limpiar subcategorías y mapear cambios
        const updatedSubs: Record<string, string[]> = {};
        Object.entries(finalSubCategories).forEach(([cat, subs]) => {
            updatedSubs[cat] = subs.map(sub => {
                let name = sub;
                if (usedNames.has(name.toLowerCase())) {
                    name = `${cat} ${name}`;
                    while (usedNames.has(name.toLowerCase())) name = `${name}*`;
                    hasChanged = true;

                    const oldSecKey = `${cat}::${sub}`;
                    const newSecKey = `${cat}::${name}`;
                    if (finalSections[oldSecKey]) {
                        finalSections[newSecKey] = finalSections[oldSecKey];
                        delete finalSections[oldSecKey];
                    }
                    finalMenu = finalMenu.map(m => (m.category === cat && m.subcategory === sub) ? { ...m, subcategory: name } : m);
                }
                usedNames.add(name.toLowerCase());
                return name;
            });
        });
        finalSubCategories = updatedSubs;

        // 3. Limpiar secciones y mapear cambios
        const updatedSecs: Record<string, string[]> = {};
        Object.entries(finalSections).forEach(([subKey, secs]) => {
            const [cat, sub] = subKey.split('::');
            updatedSecs[subKey] = secs.map(sec => {
                let name = sec;
                if (usedNames.has(name.toLowerCase())) {
                    name = `${sub} ${name}`;
                    while (usedNames.has(name.toLowerCase())) name = `${name}*`;
                    hasChanged = true;
                    finalMenu = finalMenu.map(m => (m.category === cat && m.subcategory === sub && m.section === sec) ? { ...m, section: name } : m);
                }
                usedNames.add(name.toLowerCase());
                return name;
            });
        });
        finalSections = updatedSecs;

        // 4. Recuperación de huérfanos (Corrección para limpiezas incompletas previas)
        finalMenu = finalMenu.map(m => {
            const item = { ...m };

            // Corregir huérfanos de categoría
            if (item.category && !finalCategories.includes(item.category)) {
                const match = finalCategories.find(c => c.toLowerCase().endsWith(item.category.toLowerCase()));
                if (match) { item.category = match; hasChanged = true; }
            }
            const subKey = `${item.category}::${item.subcategory}`;

            // Corregir huérfanos de subcategoría
            const currentCatSubs = finalSubCategories[item.category] || [];
            if (item.subcategory && !currentCatSubs.includes(item.subcategory)) {
                const subToMatch = item.subcategory.toLowerCase();
                const match = currentCatSubs.find(s => s.toLowerCase().endsWith(subToMatch));
                if (match) { item.subcategory = match; hasChanged = true; }
            }
            // Corregir huérfanos de sección
            const currentSubSecs = finalSections[subKey] || [];
            if (item.section && !currentSubSecs.includes(item.section)) {
                const secToMatch = item.section.toLowerCase();
                const match = currentSubSecs.find(s => s.toLowerCase().endsWith(secToMatch));
                if (match) { item.section = match; hasChanged = true; }
            }
            return item;
        });

        // 5. Unicidad final de nombres de productos
        finalMenu = finalMenu.map(item => {
            let name = item.name;
            if (usedNames.has(name.toLowerCase())) {
                const prefix = item.section || item.subcategory || item.category;
                name = `${prefix} ${name}`;
                while (usedNames.has(name.toLowerCase())) name = `${name}*`;
                hasChanged = true;
            }
            usedNames.add(name.toLowerCase());
            return { ...item, name };
        });

        if (hasChanged) {
            setCategories(finalCategories);
            setSubCategories(finalSubCategories);
            setSections(finalSections);
            setMenu(finalMenu);
        }
    }, [menu, categories, subCategories, sections, setMenu, setCategories, setSubCategories, setSections]);

    const resetMode = () => {
        setMode('normal');
        setEditingCatOriginalName(null);
        setEditingItemId(null);
        setShowCatMenu(false);
        setShowCatInput(false);
        setOpenActionMenuCat(null);
        setOpenActionMenuSub(null);
        setDeleteSubCatMode({});
        setDeleteSectionMode({});
        setDeleteItemMode({});
        setEditItemMode({});
        setAddingToKey({});
        setConfirmDeleteId(null);
        setEditingSubKey(null);
        setEditingSecKey(null);
        setModeContext(null);
    };

    const handleBackgroundClick = () => {
        setOpenActionMenuCat(null);
        setOpenActionMenuSub(null);
        if (confirmDeleteId) setConfirmDeleteId(null);

        const hasActiveModes = mode !== 'normal'
            || Object.values(deleteSubCatMode).some(v => v)
            || Object.values(deleteItemMode).some(v => v)
            || Object.values(editItemMode).some(v => v)
            || Object.values(deleteSectionMode).some(v => v);

        if (hasActiveModes) resetMode();
        setShowCatMenu(false);
        setEditingSubKey(null);
        setEditingSecKey(null);
        setModeContext(null);
    };

    const handleReorder = (draggedCat: string, targetCat: string) => {
        const newCats = [...categories];
        const draggedIdx = newCats.indexOf(draggedCat);
        const targetIdx = newCats.indexOf(targetCat);
        if (draggedIdx === -1 || targetIdx === -1) return;

        newCats.splice(draggedIdx, 1);
        newCats.splice(targetIdx, 0, draggedCat);
        setCategories(newCats);
    };

    const handleAddCategory = (customName?: string) => {
        const nameToAdd = (typeof customName === 'string' ? customName : newCatName).trim();
        if (!nameToAdd) return;
        if (!isNameUnique(nameToAdd)) return alert("El nombre ya está en uso (categoría, subcategoría, sección o producto)");
        setCategories([...categories, nameToAdd]);
        if (!subCategories[nameToAdd]) {
            setSubCategories({
                ...subCategories,
                [nameToAdd]: []
            });
        }
        logAction('category_create', `Categoría creada: ${nameToAdd}`, nameToAdd);
        setNewCatName('');
        setShowCatInput(false);
        setShowCatMenu(false);
    };

    const handleDeleteCategory = (catToDelete: string) => {
        if (catToDelete.toLowerCase() === 'promociones') {
            setConfirmDeleteId(null);
            return;
        }
        const subs = subCategories[catToDelete] || [];
        setMenu(menu.filter(m => m.category !== catToDelete));
        setCategories(categories.filter(c => c !== catToDelete));

        const newSub = { ...subCategories };
        delete newSub[catToDelete];
        setSubCategories(newSub);

        const newSec = { ...sections };
        subs.forEach(sub => {
            delete newSec[`${catToDelete}::${sub}`];
        });
        setSections(newSec);
        logAction('category_delete', `Categoría eliminada: ${catToDelete}`, catToDelete);
        setConfirmDeleteId(null);
    };

    const startRenameCategory = (cat: string) => {
        if (cat.toLowerCase() === 'promociones') return;
        setEditingCatOriginalName(cat);
        setEditingCatNewName(cat);
        setMode('normal');
        setModeContext(null);
    };

    const saveRenameCategory = (orig?: string, newVal?: string) => {
        const original = orig || editingCatOriginalName;
        const value = newVal || editingCatNewName;
        if (!original || !value.trim()) return;
        if (value.toLowerCase() !== original.toLowerCase() && !isNameUnique(value)) {
            alert("Nombre ya está en uso");
            return;
        }
        setCategories(categories.map(c => c === original ? value : c));
        setMenu(menu.map(m => m.category === original ? { ...m, category: value } : m));

        if (value !== original) {
            const newSub = { ...subCategories };
            const subs = newSub[original] || [];
            if (newSub[original]) {
                newSub[value] = newSub[original];
                delete newSub[original];
            }
            setSubCategories(newSub);

            const newSec = { ...sections };
            subs.forEach(s => {
                const oldKey = `${original}::${s}`;
                const newKey = `${value}::${s}`;
                if (newSec[oldKey]) {
                    newSec[newKey] = newSec[oldKey];
                    delete newSec[oldKey];
                }
            });
            setSections(newSec);
        }
        logAction('category_rename', `Categoría renombrada: ${original} -> ${value}`, original);
        setEditingCatOriginalName(null);
        resetMode();
    };

    const handleDeleteSubCategory = (cat: string, sub: string) => {
        const currentSubs = subCategories[cat] || [];
        setSubCategories({
            ...subCategories,
            [cat]: currentSubs.filter(s => s !== sub)
        });

        const sectionKey = `${cat}::${sub}`;
        if (sections[sectionKey]) {
            const newSections = { ...sections };
            delete newSections[sectionKey];
            setSections(newSections);
        }

        setMenu(menu.filter(m => !(m.category === cat && m.subcategory === sub)));
        logAction('subcategory_delete', `Subcategoría eliminada: ${sub} (en ${cat})`, `${cat}::${sub}`);
        setConfirmDeleteId(null);
    };

    const handleDeleteSection = (cat: string, sub: string, sec: string) => {
        const sectionKey = `${cat}::${sub}`;
        const currentSecs = sections[sectionKey] || [];
        setSections({
            ...sections,
            [sectionKey]: currentSecs.filter(s => s !== sec)
        });
        setMenu(menu.filter(m => !(m.category === cat && m.subcategory === sub && m.section === sec)));
        logAction('section_delete', `Sección eliminada: ${sec} (en ${cat} > ${sub})`, `${cat}::${sub}::${sec}`);
        setConfirmDeleteId(null);
    };

    const selectAddType = (key: string, type: 'item' | 'subcat' | 'section') => {
        setAddingToKey({ [key]: { type } });
        setNewSubCatName('');
        setNewSectionName('');
        setOpenActionMenuCat(null);
    };

    const cancelAdd = (key: string) => {
        const newMap = { ...addingToKey };
        delete newMap[key];
        setAddingToKey(newMap);
    };

    const startRenameSubCategory = (cat: string, sub: string) => {
        setEditingSubKey(`${cat}::${sub}`);
        setEditingSubNewName(sub);
        setOpenActionMenuCat(null);
        setMode('normal');
        setModeContext(null);
    };

    const saveRenameSubCategory = (cat: string, originalSub: string, newVal?: string) => {
        const value = newVal || editingSubNewName;
        if (!value.trim()) return;
        if (value.toLowerCase() !== originalSub.toLowerCase() && !isNameUnique(value)) {
            alert("El nombre ya está en uso");
            return;
        }

        const currentSubs = subCategories[cat] || [];
        setSubCategories({
            ...subCategories,
            [cat]: currentSubs.map(s => s === originalSub ? value : s)
        });

        // Actualizar secciones
        const oldKey = `${cat}::${originalSub}`;
        const newKey = `${cat}::${value}`;
        if (sections[oldKey]) {
            const newSecs = { ...sections };
            newSecs[newKey] = newSecs[oldKey];
            delete newSecs[oldKey];
            setSections(newSecs);
        }

        // Actualizar elementos del menú
        setMenu(menu.map(m =>
            (m.category === cat && m.subcategory === originalSub)
                ? { ...m, subcategory: value }
                : m
        ));

        logAction('subcategory_rename', `Subcategoría renombrada: ${originalSub} -> ${value} (en ${cat})`, `${cat}::${originalSub}`);

        setEditingSubKey(null);
    };

    const startRenameSection = (cat: string, sub: string, sec: string) => {
        setEditingSecKey(`${cat}::${sub}::${sec}`);
        setEditingSecNewName(sec);
        setOpenActionMenuSub(null);
        setMode('normal');
        setModeContext(null);
    };

    const saveRenameSection = (cat: string, sub: string, originalSec: string, newVal?: string) => {
        const value = newVal || editingSecNewName;
        if (!value.trim()) return;
        if (value.toLowerCase() !== originalSec.toLowerCase() && !isNameUnique(value)) {
            alert("El nombre ya está en uso");
            return;
        }

        const subKey = `${cat}::${sub}`;
        const currentSecs = sections[subKey] || [];
        setSections({
            ...sections,
            [subKey]: currentSecs.map(s => s === originalSec ? value : s)
        });

        // Actualizar elementos del menú
        setMenu(menu.map(m =>
            (m.category === cat && m.subcategory === sub && m.section === originalSec)
                ? { ...m, section: value }
                : m
        ));

        logAction('section_rename', `Sección renombrada: ${originalSec} -> ${value} (en ${cat} > ${sub})`, `${cat}::${sub}::${originalSec}`);

        setEditingSecKey(null);
    };

    const saveNewSubCat = (cat: string, name?: string) => {
        const value = name || newSubCatName;
        if (!value.trim()) return;
        if (!isNameUnique(value)) return alert("El nombre ya está en uso");
        const currentSubs = subCategories[cat] || [];
        setSubCategories({
            ...subCategories,
            [cat]: [...currentSubs, value]
        });
        logAction('subcategory_create', `Subcategoría creada: ${value} (en ${cat})`, `${cat}::${value}`);
        cancelAdd(cat);
    };

    const saveNewSection = (cat: string, sub: string, name?: string) => {
        const value = name || newSectionName;
        if (!value.trim()) return;
        if (!isNameUnique(value)) return alert("El nombre ya está en uso");
        const key = `${cat}::${sub}`;
        const currentSecs = sections[key] || [];
        setSections({
            ...sections,
            [key]: [...currentSecs, value]
        });
        logAction('section_create', `Sección creada: ${value} (en ${cat} > ${sub})`, `${key}::${value}`);
        cancelAdd(key);
    };

    const saveNewItem = (category: string, name: string, price: string, type: import('../../../types').ItemType, subcategory?: string, section?: string, description?: string, image?: string) => {
        if (!name) return;
        if (!isNameUnique(name)) return alert("El nombre del producto ya está en uso");
        if (Number(price) < 0 || Number(price) > 9999) return;

        const newItem: MenuItem = {
            id: crypto.randomUUID(),
            name: name,
            price: price === '' ? 0 : Number(price),
            category,
            type,
            subcategory,
            section,
            description,
            image,
            available: true
        };

        setMenu([...menu, newItem]);
        logAction('menu_create', `Producto creado: ${newItem.name} (${newItem.price})`, newItem.id);

        const key = section ? `${category}::${subcategory}::${section}` : (subcategory ? `${category}::${subcategory}` : category);
        cancelAdd(key);
    };

    const startEdit = (item: MenuItem) => {
        setEditingItemId(item.id);
        setEditName(item.name);
        setEditPrice(String(item.price));
        setEditDescription(item.description || '');
        setEditImage(item.image || '');
        setEditType(item.type || 'alimento');
        setEditCategory(item.category);
        setEditSubcategory(item.subcategory || '');
        setEditSection(item.section || '');
    };

    const saveEdit = (id: string, name?: string, price?: string, type?: import('../../../types').ItemType, category?: string, subcategory?: string, section?: string, description?: string, image?: string) => {
        const finalName = name ?? editName;
        const finalPrice = price ?? editPrice;
        const finalType = type ?? editType;
        const finalCategory = category ?? editCategory;
        const finalSubcategory = subcategory ?? editSubcategory;
        const finalSection = section ?? editSection;
        const finalDescription = description ?? editDescription;
        const finalImage = image ?? editImage;

        if (Number(finalPrice) < 0 || Number(finalPrice) > 9999) return;
        if (!isNameUnique(finalName, id)) return alert("El nombre ya está en uso");

        const oldItem = menu.find(i => i.id === id);
        if (oldItem) {
            logAction('menu_update', `Producto editado: ${oldItem.name} -> ${finalName}, ${oldItem.price} -> ${finalPrice}`, id);
        }

        setMenu(menu.map(item =>
            item.id === id ? {
                ...item,
                name: finalName,
                price: Number(finalPrice),
                type: finalType,
                category: finalCategory,
                subcategory: finalSubcategory || undefined,
                section: finalSection || undefined,
                description: finalDescription || undefined,
                image: finalImage || undefined
            } : item
        ));
        setEditingItemId(null);
    };

    const toggleAvailability = (id: string) => {
        const item = menu.find(i => i.id === id);
        if (item) {
            const nextStatus = !item.available;
            logAction('menu_stock_toggle', `Stock de "${item.name}" cambiado a: ${nextStatus ? 'DISPONIBLE' : 'AGOTADO'}`, id);
        }
        setMenu(menu.map(item =>
            item.id === id ? { ...item, available: !item.available } : item
        ));
    };

    const handleDeleteItem = (id: string) => {
        const item = menu.find(i => i.id === id);
        if (item) {
            logAction('menu_delete', `Producto eliminado: ${item.name}`, id);
        }
        setMenu(menu.filter(item => item.id !== id));
        setConfirmDeleteId(null);
    };

    const handleAddToOrder = (item: MenuItem) => {
        if (!currentShiftId) {
            setShowShiftModal(true);
            return;
        }
        if (!item.available) {
            return;
        }
        setCurrentOrder([...currentOrder, { menuItem: item, quantity: 1 }]);
        setIsConfirmingOrder(false);
    };

    const handleAddComboToOrder = (promo: Promotion) => {
        if (!currentShiftId) {
            setShowShiftModal(true);
            return;
        }
        if (!promo.targetItemIds || promo.targetItemIds.length === 0) {
            alert("Este combo no tiene productos configurados.");
            return;
        }

        const comboItems: MenuItem[] = [];
        for (const itemId of promo.targetItemIds) {
            const menuItem = menu.find(m => m.id === itemId);
            if (!menuItem) {
                alert("Uno de los productos de este combo no existe en el menú.");
                return;
            }
            if (!menuItem.available) {
                alert(`El producto "${menuItem.name}" del combo no está disponible actualmente.`);
                return;
            }
            comboItems.push(menuItem);
        }

        const productCounts = new Map<string, { menuItem: MenuItem; count: number }>();
        for (const item of comboItems) {
            const existing = productCounts.get(item.id);
            if (existing) {
                existing.count += 1;
            } else {
                productCounts.set(item.id, { menuItem: item, count: 1 });
            }
        }
        const summaryDesc = Array.from(productCounts.values())
            .map(({ menuItem, count }) => count > 1 ? `${count}x ${menuItem.name}` : menuItem.name)
            .join(' + ');

        const comboMenuItem: MenuItem = {
            id: `combo-${promo.id}`,
            name: promo.name,
            price: promo.value ?? 0,
            category: 'Combo Promocional',
            type: 'alimento',
            available: true,
            description: summaryDesc
        };

        const updatedOrder = [...currentOrder];
        const existingIndex = updatedOrder.findIndex(o => o.isCombo && o.comboId === promo.id);
        if (existingIndex !== -1) {
            updatedOrder[existingIndex] = {
                ...updatedOrder[existingIndex],
                quantity: updatedOrder[existingIndex].quantity + 1
            };
        } else {
            updatedOrder.push({
                menuItem: comboMenuItem,
                quantity: 1,
                isCombo: true,
                comboId: promo.id,
                comboProducts: comboItems
            });
        }

        setCurrentOrder(updatedOrder);
        setIsConfirmingOrder(false);
    };

    const handleIncreaseQuantity = (index: number) => {
        setCurrentOrder(currentOrder.map((o, i) =>
            i === index && o.quantity < 99 ? { ...o, quantity: o.quantity + 1 } : o
        ));
        setIsConfirmingOrder(false);
    };

    const handleDecreaseQuantity = (index: number) => {
        setCurrentOrder(currentOrder.map((o, i) =>
            i === index && o.quantity > 1 ? { ...o, quantity: o.quantity - 1 } : o
        ));
        setIsConfirmingOrder(false);
    };

    const handleRemoveFromOrder = (index: number) => {
        setCurrentOrder(currentOrder.filter((_, i) => i !== index));
        setIsConfirmingOrder(false);
    };

    const calculateTotal = () => {
        const now = new Date();
        let total = 0;

        // 1. Sumar combos explícitos directamente
        currentOrder.filter(item => item.isCombo).forEach(item => {
            total += item.menuItem.price * item.quantity;
        });

        // 2. Procesar artículos normales individuales (no combos)
        const normalItems = currentOrder.filter(item => !item.isCombo);
        let itemsPool = normalItems.flatMap(item =>
            Array(item.quantity).fill(item.menuItem)
        );

        // Procesar combos automáticos para artículos normales si los hay
        const comboPromos = promotions.filter(p => p.type === 'combo' && isPromotionActive(p, now));
        comboPromos.sort((a, b) => (b.targetItemIds?.length || 0) - (a.targetItemIds?.length || 0));

        comboPromos.forEach(promo => {
            if (promo.value === undefined || !promo.targetItemIds) return;

            let canApply = true;
            while (canApply) {
                const requiredIds = [...promo.targetItemIds];
                const tempPool = [...itemsPool];
                let matchesAll = true;

                for (const reqId of requiredIds) {
                    const idx = tempPool.findIndex(i => i.id === reqId);
                    if (idx !== -1) {
                        tempPool.splice(idx, 1);
                    } else {
                        matchesAll = false;
                        break;
                    }
                }

                if (matchesAll) {
                    total += promo.value;
                    itemsPool = tempPool;
                } else {
                    canApply = false;
                }
            }
        });

        // Procesar LxM y porcentajes en los artículos normales restantes
        const remainingItemsById = itemsPool.reduce((acc, item) => {
            if (!acc[item.id]) acc[item.id] = { menuItem: item, quantity: 0 };
            acc[item.id].quantity++;
            return acc;
        }, {} as Record<string, { menuItem: MenuItem, quantity: number }>);

        Object.keys(remainingItemsById).forEach(id => {
            const { menuItem, quantity } = remainingItemsById[id];
            const itemPrice = menuItem.price;
            let itemTotal = itemPrice * quantity;

            const applicablePromos = promotions.filter(p =>
                p.targetItemIds.includes(menuItem.id) &&
                p.type !== 'combo' &&
                isPromotionActive(p, now)
            );

            if (applicablePromos.length > 0) {
                let bestTotal = itemTotal;

                applicablePromos.forEach(p => {
                    let promoTotal = itemTotal;

                    if (p.type === 'percentage' && p.value) {
                        promoTotal = itemTotal * (1 - p.value / 100);
                    } else if (p.type === 'quantity_offer' && p.pay && p.take) {
                        const sets = Math.floor(quantity / p.take);
                        const remainder = quantity % p.take;
                        const paidQty = (sets * p.pay) + remainder;
                        promoTotal = paidQty * itemPrice;
                    }

                    if (promoTotal < bestTotal) {
                        bestTotal = promoTotal;
                    }
                });
                itemTotal = bestTotal;
            }

            total += itemTotal;
        });

        return total;
    };

    const handleSubmitOrder = () => {
        if (!currentShiftId) {
            setShowShiftModal(true);
            return;
        }
        if (currentOrder.length === 0) {
            alert("No hay productos en el pedido");
            return;
        }

        if (!isConfirmingOrder) {
            setIsConfirmingOrder(true);
            return;
        }

        const now = new Date();
        const baseTotal = calculateTotal();

        const itemsWithPromos: OrderItem[] = [];

        currentOrder.forEach(o => {
            if (o.isCombo) {
                const productCounts = new Map<string, { menuItem: MenuItem; count: number }>();
                (o.comboProducts || []).forEach(p => {
                    const existing = productCounts.get(p.id);
                    if (existing) {
                        existing.count += 1;
                    } else {
                        productCounts.set(p.id, { menuItem: p, count: 1 });
                    }
                });

                const formattedComboProducts = Array.from(productCounts.values()).map(({ menuItem, count }) => ({
                    menuItemId: menuItem.id,
                    name: menuItem.name,
                    category: menuItem.category,
                    quantity: count,
                    originalPrice: menuItem.price
                }));

                const summaryText = formattedComboProducts
                    .map(cp => cp.quantity > 1 ? `${cp.quantity}x ${cp.name}` : cp.name)
                    .join(' + ');

                itemsWithPromos.push({
                    menuItemId: o.menuItem.id,
                    name: o.menuItem.name,
                    price: o.menuItem.price,
                    quantity: o.quantity,
                    notes: o.notes || orderNote || (summaryText ? `Incluye: ${summaryText}` : undefined),
                    isCombo: true,
                    comboId: o.comboId,
                    comboProducts: formattedComboProducts
                });
            } else {
                const lineBaseTotal = o.menuItem.price * o.quantity;
                const applicablePromos = promotions.filter(p =>
                    p.targetItemIds.includes(o.menuItem.id) &&
                    p.type !== 'combo' &&
                    isPromotionActive(p, now)
                );

                let bestTotal = lineBaseTotal;
                applicablePromos.forEach(p => {
                    let promoTotal = lineBaseTotal;
                    if (p.type === 'percentage' && p.value) {
                        promoTotal = lineBaseTotal * (1 - p.value / 100);
                    } else if (p.type === 'quantity_offer' && p.pay && p.take) {
                        const sets = Math.floor(o.quantity / p.take);
                        const remainder = o.quantity % p.take;
                        promoTotal = (sets * p.pay + remainder) * o.menuItem.price;
                    }
                    if (promoTotal < bestTotal) bestTotal = promoTotal;
                });

                itemsWithPromos.push({
                    menuItemId: o.menuItem.id,
                    name: o.menuItem.name,
                    price: bestTotal / o.quantity,
                    quantity: o.quantity,
                    notes: o.notes || orderNote
                });
            }
        });

        // Verificar si hay un descuento automático restante para items normales
        const itemsSum = itemsWithPromos.reduce((a, b) => a + (b.price * b.quantity), 0);
        const comboDiscount = itemsSum - baseTotal;

        if (comboDiscount > 0.01) {
            itemsWithPromos.push({
                menuItemId: 'promo-discount',
                name: 'DESCUENTO POR PROMOCIÓN / COMBO',
                price: -comboDiscount,
                quantity: 1,
                notes: 'Aplicado automáticamente'
            });
        }

        // Calcular impuestos consistentes con OrderPanel
        const { subtotal, taxAmount, finalTotal } = calculateOrderTax(
            baseTotal,
            taxConfig,
            itemsWithPromos.map(item => ({ price: item.price * item.quantity, quantity: 1 }))
        );

        // Si el impuesto es exclusivo, agregarlo como línea en el ticket para visualización contable
        if (taxConfig?.enabled && taxConfig.mode === 'exclusive' && taxAmount > 0.009) {
            itemsWithPromos.push({
                menuItemId: 'tax-line',
                name: `${taxConfig.name || 'Impuesto'} (${taxConfig.percentage}%)`,
                price: taxAmount,
                quantity: 1,
                notes: 'Impuesto aplicado'
            });
        }

        const newOrder: Order = {
            id: crypto.randomUUID(),
            orderedBy: user.username,
            total: finalTotal,
            subtotal,
            tax: taxAmount,
            createdAt: now.toISOString(),
            items: itemsWithPromos,
            shiftId: currentShiftId || 'no-shift'
        };

        setHistory([newOrder, ...history]);
        setCurrentOrder([]);
        setOrderNote("");
        setShowNoteInput(false);
        setIsConfirmingOrder(false);
    };

    const toggleDeleteSubCatMode = (cat: string) => {
        setDeleteSubCatMode({ [cat]: !deleteSubCatMode[cat] });
        setDeleteSectionMode({});
        setOpenActionMenuCat(null);
        setConfirmDeleteId(null);
    };

    const toggleDeleteSectionMode = (cat: string) => {
        setDeleteSectionMode({ [cat]: !deleteSectionMode[cat] });
        setDeleteSubCatMode({});
        setEditItemMode({});
        setOpenActionMenuCat(null);
        setConfirmDeleteId(null);
    };

    const toggleEditItemMode = (cat: string) => {
        setEditItemMode({ [cat]: !editItemMode[cat] });
        setDeleteItemMode({});
        setDeleteSubCatMode({});
        setDeleteSectionMode({});
        setOpenActionMenuCat(null);
    };

    const toggleDeleteItemMode = (cat: string) => {
        setDeleteItemMode({ [cat]: !deleteItemMode[cat] });
        setOpenActionMenuCat(null);
        setConfirmDeleteId(null);
    };

    return {
        state: {
            showCatMenu, setShowCatMenu, showCatInput, setShowCatInput, newCatName, setNewCatName,
            mode, setMode: setModeSafe, editingCatOriginalName, editingCatNewName, setEditingCatNewName,
            openActionMenuCat, setOpenActionMenuCat, openActionMenuSub, setOpenActionMenuSub,
            deleteSubCatMode, deleteSectionMode, deleteItemMode, editItemMode, confirmDeleteId, setConfirmDeleteId,
            addingToKey,
            newSubCatName, setNewSubCatName, newSectionName, setNewSectionName,
            editingItemId, setEditingItemId, editName, setEditName, editPrice, setEditPrice,
            editDescription, setEditDescription, editImage, setEditImage,
            editType, setEditType,
            editCategory, setEditCategory, editSubcategory, setEditSubcategory, editSection, setEditSection,
            currentOrder, orderNote, setOrderNote, showNoteInput, setShowNoteInput, isConfirmingOrder,
            isReorderMode, setIsReorderMode, showShiftModal, setShowShiftModal,
            editingSubKey, editingSubNewName, setEditingSubNewName,
            editingSecKey, editingSecNewName, setEditingSecNewName,
            modeContext, setModeContext,
            globalCollapseState,
            showAddItemGlobal, setShowAddItemGlobal,
            showTaxonomyManager, setShowTaxonomyManager,
            selectedItemForMenu, setSelectedItemForMenu
        },
        handlers: {
            resetMode, handleBackgroundClick, handleAddCategory, handleDeleteCategory, startRenameCategory, saveRenameCategory,
            handleDeleteSubCategory, handleDeleteSection, selectAddType, cancelAdd, saveNewSubCat, saveNewSection,
            saveNewItem, startEdit, saveEdit, toggleAvailability, handleDeleteItem, handleAddToOrder, handleAddComboToOrder,
            handleIncreaseQuantity, handleDecreaseQuantity, handleRemoveFromOrder, calculateTotal, handleSubmitOrder,
            toggleDeleteSubCatMode, toggleDeleteSectionMode, toggleEditItemMode, toggleDeleteItemMode,
            handleReorder,
            startRenameSubCategory, saveRenameSubCategory,
            startRenameSection, saveRenameSection,
            toggleGlobalCollapse,
            isNameUnique
        }
    };
};
