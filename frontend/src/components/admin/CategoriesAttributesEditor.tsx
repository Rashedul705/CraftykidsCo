'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Check,
  X,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { SampleCategory } from '@/lib/sample-data';
import { AttributeItem, AttributeOption } from '@/lib/store';

interface CategoriesAttributesEditorProps {
  onCategoriesChanged?: () => void;
}

const PRESET_COLORS = [
  '#FFE8D6', // Pastel Peach
  '#E1F5FE', // Soft Sky Blue
  '#E8F5E9', // Mint Green
  '#FCE4EC', // Soft Pink
  '#FFF9C4', // Soft Yellow
  '#EDE7F6', // Lavender
  '#F5E6D3', // Warm Cream
];

export default function CategoriesAttributesEditor({
  onCategoriesChanged,
}: CategoriesAttributesEditorProps) {
  // Navigation: 'categories' | 'attributes'
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'attributes'>('categories');

  // Categories state
  const [categories, setCategories] = useState<SampleCategory[]>([]);
  const [searchCategory, setSearchCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Attributes state
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [searchAttribute, setSearchAttribute] = useState('');
  const [loadingAttributes, setLoadingAttributes] = useState(true);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state: Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SampleCategory | null>(null);
  const [catNameBn, setCatNameBn] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [catBadgeColor, setCatBadgeColor] = useState('#FFE8D6');
  const [catChildren, setCatChildren] = useState<{ slug: string; nameBn: string; nameEn: string }[]>([]);
  const [newSubNameBn, setNewSubNameBn] = useState('');
  const [newSubNameEn, setNewSubNameEn] = useState('');
  const [isUploadingCatImage, setIsUploadingCatImage] = useState(false);
  const [selectedAttrCodes, setSelectedAttrCodes] = useState<string[]>([]);
  const [categoryToDelete, setCategoryToDelete] = useState<SampleCategory | null>(null);

  // Modals state: Attribute
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeItem | null>(null);
  const [attrNameBn, setAttrNameBn] = useState('');
  const [attrNameEn, setAttrNameEn] = useState('');
  const [attrCode, setAttrCode] = useState('');
  const [attrType, setAttrType] = useState('select');
  const [attrCategories, setAttrCategories] = useState<string[]>(['ALL']);
  const [attrOptions, setAttrOptions] = useState<AttributeOption[]>([]);
  const [newOptLabelBn, setNewOptLabelBn] = useState('');
  const [newOptLabelEn, setNewOptLabelEn] = useState('');
  const [newOptValue, setNewOptValue] = useState('');
  const [attributeToDelete, setAttributeToDelete] = useState<AttributeItem | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Load Categories & Attributes
  // ---------------------------------------------------------------------------
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchAttributes = async () => {
    try {
      setLoadingAttributes(true);
      const res = await fetch('/api/attributes');
      const data = await res.json();
      if (data.success && data.attributes) {
        setAttributes(data.attributes);
      }
    } catch (err) {
      console.error('Error fetching attributes:', err);
    } finally {
      setLoadingAttributes(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // ImgBB Upload Handler
  // ---------------------------------------------------------------------------
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCatImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setCatImageUrl(data.url);
        showToast('Image uploaded successfully to ImgBB CDN!');
      } else {
        showToast('Image upload failed. Please try again.');
      }
    } catch {
      showToast('Error uploading image.');
    } finally {
      setIsUploadingCatImage(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Category Modal Handlers
  // ---------------------------------------------------------------------------
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatNameBn('');
    setCatNameEn('');
    setCatSlug('');
    setCatDescription('');
    setCatImageUrl('https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg');
    setCatBadgeColor('#FFE8D6');
    setCatChildren([]);
    setSelectedAttrCodes([]);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: SampleCategory) => {
    setEditingCategory(cat);
    setCatNameBn(cat.nameBn || '');
    setCatNameEn(cat.nameEn || '');
    setCatSlug(cat.slug || '');
    setCatDescription(cat.description || '');
    setCatImageUrl(cat.imageUrl || '');
    setCatBadgeColor(cat.badgeColor || '#FFE8D6');
    setCatChildren(cat.children ? [...cat.children] : []);

    // Extract attached attribute codes
    const codes = (cat.attributes || []).map((a) => a.code);
    setSelectedAttrCodes(codes);
    setIsCategoryModalOpen(true);
  };

  const handleAddSubCategory = () => {
    if (!newSubNameBn.trim() || !newSubNameEn.trim()) return;
    const subSlug = newSubNameEn
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    setCatChildren([...catChildren, { slug: subSlug, nameBn: newSubNameBn.trim(), nameEn: newSubNameEn.trim() }]);
    setNewSubNameBn('');
    setNewSubNameEn('');
  };

  const handleRemoveSubCategory = (index: number) => {
    setCatChildren(catChildren.filter((_, i) => i !== index));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameBn.trim() || !catNameEn.trim()) {
      alert('Category name in both Bangla and English is required.');
      return;
    }

    const slug =
      catSlug.trim() ||
      catNameEn
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

    // Build associated attributes payload
    const attachedAttributes = attributes
      .filter((a) => selectedAttrCodes.includes(a.code))
      .map((a) => ({
        code: a.code,
        nameBn: a.nameBn,
        nameEn: a.nameEn,
        options: a.options,
      }));

    const payload = {
      nameBn: catNameBn.trim(),
      nameEn: catNameEn.trim(),
      slug,
      description: catDescription.trim(),
      imageUrl: catImageUrl.trim() || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg',
      badgeColor: catBadgeColor,
      children: catChildren,
      attributes: attachedAttributes,
    };

    try {
      setIsSaving(true);
      let res;
      if (editingCategory) {
        // Edit mode (PUT)
        res = await fetch(`/api/categories/${editingCategory.slug || (editingCategory as any)._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode (POST)
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(
          editingCategory
            ? `Category '${catNameEn}' updated successfully!`
            : `New Category '${catNameEn}' created successfully!`
        );
        setIsCategoryModalOpen(false);
        fetchCategories();
        if (onCategoriesChanged) onCategoriesChanged();
      } else {
        alert(data.message || 'Failed to save category');
      }
    } catch (err: any) {
      alert('Error saving category: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const targetSlug = categoryToDelete.slug || (categoryToDelete as any)._id;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/categories/${targetSlug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Category '${categoryToDelete.nameEn}' deleted successfully.`);
        setCategoryToDelete(null);
        fetchCategories();
        if (onCategoriesChanged) onCategoriesChanged();
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (err: any) {
      alert('Error deleting category: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Attribute Modal Handlers
  // ---------------------------------------------------------------------------
  const openAddAttributeModal = () => {
    setEditingAttribute(null);
    setAttrNameBn('');
    setAttrNameEn('');
    setAttrCode('');
    setAttrType('select');
    setAttrCategories(['ALL']);
    setAttrOptions([]);
    setNewOptLabelBn('');
    setNewOptLabelEn('');
    setNewOptValue('');
    setIsAttributeModalOpen(true);
  };

  const openEditAttributeModal = (attr: AttributeItem) => {
    setEditingAttribute(attr);
    setAttrNameBn(attr.nameBn);
    setAttrNameEn(attr.nameEn);
    setAttrCode(attr.code);
    setAttrType(attr.type || 'select');
    setAttrCategories(attr.categories && attr.categories.length > 0 ? [...attr.categories] : ['ALL']);
    setAttrOptions(attr.options ? [...attr.options] : []);
    setNewOptLabelBn('');
    setNewOptLabelEn('');
    setNewOptValue('');
    setIsAttributeModalOpen(true);
  };

  const handleAddOption = () => {
    if (!newOptLabelBn.trim() || !newOptLabelEn.trim()) return;
    const val =
      newOptValue.trim() ||
      newOptLabelEn
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    setAttrOptions([
      ...attrOptions,
      { labelBn: newOptLabelBn.trim(), labelEn: newOptLabelEn.trim(), value: val },
    ]);
    setNewOptLabelBn('');
    setNewOptLabelEn('');
    setNewOptValue('');
  };

  const handleRemoveOption = (index: number) => {
    setAttrOptions(attrOptions.filter((_, i) => i !== index));
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrNameBn.trim() || !attrNameEn.trim()) {
      alert('Attribute name in both Bangla and English is required.');
      return;
    }

    const code =
      attrCode.trim() ||
      attrNameEn
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

    const payload = {
      nameBn: attrNameBn.trim(),
      nameEn: attrNameEn.trim(),
      code,
      type: attrType,
      categories: attrCategories,
      options: attrOptions,
    };

    try {
      setIsSaving(true);
      let res;
      if (editingAttribute) {
        // Edit mode (PUT)
        res = await fetch(`/api/attributes/${editingAttribute.code || editingAttribute.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode (POST)
        res = await fetch('/api/attributes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(
          editingAttribute
            ? `Attribute '${attrNameEn}' updated successfully!`
            : `New Attribute '${attrNameEn}' created successfully!`
        );
        setIsAttributeModalOpen(false);
        fetchAttributes();
      } else {
        alert(data.message || 'Failed to save attribute');
      }
    } catch (err: any) {
      alert('Error saving attribute: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttribute = async () => {
    if (!attributeToDelete) return;
    const targetCode = attributeToDelete.code || attributeToDelete.id;

    try {
      setIsSaving(true);
      const res = await fetch(`/api/attributes/${targetCode}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Attribute '${attributeToDelete.nameEn}' deleted.`);
        setAttributeToDelete(null);
        fetchAttributes();
      } else {
        alert(data.message || 'Failed to delete attribute');
      }
    } catch (err: any) {
      alert('Error deleting attribute: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered lists for search
  // ---------------------------------------------------------------------------
  const filteredCategories = useMemo(() => {
    if (!searchCategory.trim()) return categories;
    const q = searchCategory.toLowerCase();
    return categories.filter(
      (c) =>
        c.nameEn?.toLowerCase().includes(q) ||
        c.nameBn?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
    );
  }, [categories, searchCategory]);

  const filteredAttributes = useMemo(() => {
    if (!searchAttribute.trim()) return attributes;
    const q = searchAttribute.toLowerCase();
    return attributes.filter(
      (a) =>
        a.nameEn?.toLowerCase().includes(q) ||
        a.nameBn?.toLowerCase().includes(q) ||
        a.code?.toLowerCase().includes(q)
    );
  }, [attributes, searchAttribute]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#2E7D32] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <Check className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Dual Sub-Tabs */}
      <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-[#D32F2F] block">
            Taxonomy & Catalog Architecture
          </span>
          <h2 className="font-heading font-black text-2xl text-[#1A1A1A]">
            Categories & Attributes Management
          </h2>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Create, edit, and organize product categories, sub-categories, specifications, and variation attributes.
          </p>
        </div>

        {/* Dual Tabs Selector */}
        <div className="flex items-center gap-2 p-1.5 bg-[#FAF7F2] rounded-2xl border border-[#EFEAE2] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-[#D32F2F] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('attributes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'attributes'
                ? 'bg-[#D32F2F] text-white shadow-sm'
                : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Attributes & Variations ({attributes.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: CATEGORIES
         ===================================================================== */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
              <input
                type="text"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                placeholder="Search category by name or slug..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>

            <button
              type="button"
              onClick={openAddCategoryModal}
              className="px-4 py-2.5 rounded-2xl bg-[#D32F2F] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#B71C1C] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>

          {/* Categories Grid */}
          {loadingCategories ? (
            <div className="py-12 text-center text-xs text-[#6B6B6B]">Loading categories from database...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B6B6B] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EFEAE2]">
              No categories found. Click "+ Add New Category" to create your first category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div
                  key={cat.slug}
                  className="rounded-2xl border border-[#EFEAE2] bg-[#FAF7F2] p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={cat.imageUrl || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg'}
                          alt={cat.nameEn}
                          className="w-14 h-14 rounded-xl object-cover border border-[#EFEAE2] shadow-2xs group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: cat.badgeColor || '#FFE8D6' }}
                              title={`Badge Color: ${cat.badgeColor || '#FFE8D6'}`}
                            />
                            <h3 className="font-heading font-black text-sm text-[#1A1A1A]">
                              {cat.nameBn}
                            </h3>
                          </div>
                          <span className="text-xs text-[#6B6B6B] font-medium block">
                            {cat.nameEn}
                          </span>
                          <span className="text-[10px] text-[#8C8C8C] font-mono">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditCategoryModal(cat)}
                          title="Edit Category"
                          className="p-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#1A1A1A] hover:bg-[#FAF7F2] hover:text-[#D32F2F] transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          title="Delete Category"
                          className="p-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#D32F2F] hover:bg-red-50 transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {cat.description && (
                      <p className="text-xs text-[#6B6B6B] line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    )}

                    {/* Sub-categories */}
                    {cat.children && cat.children.length > 0 && (
                      <div className="pt-2 border-t border-[#EFEAE2] space-y-1.5">
                        <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                          Sub-categories ({cat.children.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.children.map((sub) => (
                            <span
                              key={sub.slug}
                              className="px-2 py-0.5 rounded-lg bg-white border border-[#EFEAE2] text-[10px] text-[#2B2B2B] font-medium"
                            >
                              ↳ {sub.nameBn || sub.nameEn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Associated Attributes */}
                    {cat.attributes && cat.attributes.length > 0 && (
                      <div className="pt-2 border-t border-[#EFEAE2] space-y-1.5">
                        <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                          Linked Attributes ({cat.attributes.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.attributes.map((a) => (
                            <span
                              key={a.code}
                              className="px-2 py-0.5 rounded-lg bg-[#E1F5FE] text-[#0288D1] border border-[#B3E5FC] text-[10px] font-bold"
                            >
                              🏷️ {a.nameEn || a.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: ATTRIBUTES & VARIATIONS
         ===================================================================== */}
      {activeSubTab === 'attributes' && (
        <div className="bg-white rounded-3xl border border-[#EFEAE2] p-6 shadow-xs space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
              <input
                type="text"
                value={searchAttribute}
                onChange={(e) => setSearchAttribute(e.target.value)}
                placeholder="Search attribute by name or code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:outline-hidden focus:border-[#D32F2F]"
              />
            </div>

            <button
              type="button"
              onClick={openAddAttributeModal}
              className="px-4 py-2.5 rounded-2xl bg-[#D32F2F] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#B71C1C] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Attribute</span>
            </button>
          </div>

          {/* Attributes List */}
          {loadingAttributes ? (
            <div className="py-12 text-center text-xs text-[#6B6B6B]">Loading attributes...</div>
          ) : filteredAttributes.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B6B6B] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#EFEAE2]">
              No attributes found. Click "+ Add New Attribute" to create specifications or product variants.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAttributes.map((attr) => (
                <div
                  key={attr.code || attr.id}
                  className="rounded-2xl border border-[#EFEAE2] bg-[#FAF7F2] p-5 flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#D32F2F]">
                            <Tag className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="font-heading font-black text-sm text-[#1A1A1A]">
                              {attr.nameBn} ({attr.nameEn})
                            </h3>
                            <span className="text-[10px] text-[#8C8C8C] font-mono">
                              code: {attr.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditAttributeModal(attr)}
                          title="Edit Attribute"
                          className="p-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#1A1A1A] hover:bg-[#FAF7F2] hover:text-[#D32F2F] transition-all cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttributeToDelete(attr)}
                          title="Delete Attribute"
                          className="p-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#D32F2F] hover:bg-red-50 transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Target Categories */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#8C8C8C] uppercase">Applies to:</span>
                      {attr.categories && attr.categories.includes('ALL') ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] text-[10px] font-bold">
                          All Categories
                        </span>
                      ) : (
                        (attr.categories || []).map((catSlug) => (
                          <span
                            key={catSlug}
                            className="px-2 py-0.5 rounded-lg bg-white border border-[#EFEAE2] text-[10px] text-[#2B2B2B]"
                          >
                            {catSlug}
                          </span>
                        ))
                      )}
                    </div>

                    {/* Option Values */}
                    <div className="space-y-1.5 pt-2 border-t border-[#EFEAE2]">
                      <span className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider block">
                        Values / Options ({attr.options?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(attr.options || []).map((opt) => (
                          <div
                            key={opt.value}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#EFEAE2] text-xs flex items-center gap-1.5 shadow-2xs"
                          >
                            <span className="font-bold text-[#1A1A1A]">{opt.labelBn}</span>
                            <span className="text-[10px] text-[#6B6B6B]">({opt.labelEn})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT CATEGORY MODAL
         ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-[#EFEAE2] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <span className="text-[10px] font-bold text-[#D32F2F] uppercase tracking-wider block">
                  {editingCategory ? 'Update Existing Category' : 'Create New Category'}
                </span>
                <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                  {editingCategory ? `Edit: ${editingCategory.nameEn}` : 'Add New Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-[#6B6B6B] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* Names in Bn & En */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Category Name (Bangla) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={catNameBn}
                    onChange={(e) => setCatNameBn(e.target.value)}
                    placeholder="যেমন: মোমের রঙ ও ক্লে"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Category Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={catNameEn}
                    onChange={(e) => {
                      setCatNameEn(e.target.value);
                      if (!editingCategory) {
                        setCatSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                        );
                      }
                    }}
                    placeholder="e.g. Wax Crayons & Clay"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* URL Slug & Badge Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">URL Slug</label>
                  <input
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="e.g. wax-crayons"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs font-mono focus:border-[#D32F2F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Theme / Badge Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catBadgeColor}
                      onChange={(e) => setCatBadgeColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-xl border border-[#EFEAE2] bg-white cursor-pointer"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setCatBadgeColor(col)}
                          className="w-6 h-6 rounded-lg border border-black/10 transition-transform hover:scale-110 cursor-pointer"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Enter detailed category overview..."
                  className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                />
              </div>

              {/* Category Image with ImgBB upload */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <label className="font-bold text-[#1A1A1A] block">
                  Category Thumbnail Image
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={catImageUrl || 'https://i.ibb.co/fYKWySHX/craftykidsco-little-bug-adventure.jpg'}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-[#EFEAE2] shadow-2xs"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      value={catImageUrl}
                      onChange={(e) => setCatImageUrl(e.target.value)}
                      placeholder="Paste image URL or upload below..."
                      className="w-full p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EFEAE2] text-[#D32F2F] font-bold text-xs hover:bg-[#FAF7F2] cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingCatImage ? 'Uploading to ImgBB...' : 'Upload to ImgBB CDN'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingCatImage}
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Sub-categories Builder */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1A1A1A] block">
                    Sub-categories / Child Nodes
                  </label>
                  <span className="text-[10px] text-[#8C8C8C]">
                    {catChildren.length} sub-categories
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={newSubNameBn}
                    onChange={(e) => setNewSubNameBn(e.target.value)}
                    placeholder="Sub-cat Name (Bangla)"
                    className="p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs"
                  />
                  <div className="flex gap-1.5">
                    <input
                      value={newSubNameEn}
                      onChange={(e) => setNewSubNameEn(e.target.value)}
                      placeholder="Sub-cat Name (English)"
                      className="flex-1 p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubCategory}
                      className="px-3 py-2 rounded-xl bg-[#D32F2F] text-white font-bold text-xs hover:bg-[#B71C1C] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {catChildren.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {catChildren.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-white border border-[#EFEAE2] text-xs font-medium flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{sub.nameBn} ({sub.nameEn})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubCategory(idx)}
                          className="text-[#8C8C8C] hover:text-[#D32F2F]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Attributes Selector */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <label className="font-bold text-[#1A1A1A] block">
                  Link Associated Attributes
                </label>
                <p className="text-[11px] text-[#6B6B6B]">
                  Select attributes that apply to products in this category:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {attributes.map((attr) => {
                    const checked = selectedAttrCodes.includes(attr.code);
                    return (
                      <label
                        key={attr.code}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          checked
                            ? 'bg-[#E1F5FE] border-[#0288D1] text-[#0288D1] font-bold'
                            : 'bg-white border-[#EFEAE2] text-[#2B2B2B]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttrCodes([...selectedAttrCodes, attr.code]);
                            } else {
                              setSelectedAttrCodes(selectedAttrCodes.filter((c) => c !== attr.code));
                            }
                          }}
                          className="rounded text-[#0288D1]"
                        />
                        <span>{attr.nameBn} ({attr.nameEn})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold hover:bg-[#EFEAE2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#D32F2F] text-white font-bold hover:bg-[#B71C1C] cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT ATTRIBUTE MODAL
         ========================================================================= */}
      {isAttributeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-[#EFEAE2] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2]">
              <div>
                <span className="text-[10px] font-bold text-[#D32F2F] uppercase tracking-wider block">
                  {editingAttribute ? 'Update Existing Attribute' : 'Create New Attribute'}
                </span>
                <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                  {editingAttribute ? `Edit: ${editingAttribute.nameEn}` : 'Add New Attribute'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAttributeModalOpen(false)}
                className="p-1 rounded-full text-[#6B6B6B] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttribute} className="space-y-4 text-xs">
              {/* Names in Bn & En */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Attribute Name (Bangla) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={attrNameBn}
                    onChange={(e) => setAttrNameBn(e.target.value)}
                    placeholder="যেমন: বয়স সীমা / রঙ / থিম"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">
                    Attribute Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={attrNameEn}
                    onChange={(e) => {
                      setAttrNameEn(e.target.value);
                      if (!editingAttribute) {
                        setAttrCode(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                        );
                      }
                    }}
                    placeholder="e.g. Age Group / Color / Theme"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Code & Display Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">System Code</label>
                  <input
                    required
                    value={attrCode}
                    onChange={(e) => setAttrCode(e.target.value)}
                    placeholder="e.g. ageGroup, theme, packSize"
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs font-mono focus:border-[#D32F2F] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Input Style</label>
                  <select
                    value={attrType}
                    onChange={(e) => setAttrType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EFEAE2] text-xs focus:border-[#D32F2F] focus:outline-hidden"
                  >
                    <option value="select">Dropdown Select</option>
                    <option value="radio">Radio Buttons / Pills</option>
                    <option value="color">Color Swatch</option>
                  </select>
                </div>
              </div>

              {/* Applicable Categories */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <label className="font-bold text-[#1A1A1A] block">
                  Applicable Categories
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#1A1A1A]">
                    <input
                      type="checkbox"
                      checked={attrCategories.includes('ALL')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAttrCategories(['ALL']);
                        } else {
                          setAttrCategories([]);
                        }
                      }}
                      className="rounded text-[#D32F2F]"
                    />
                    <span>All Categories (Global Specification)</span>
                  </label>

                  {!attrCategories.includes('ALL') && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EFEAE2]">
                      {categories.map((c) => (
                        <label
                          key={c.slug}
                          className="flex items-center gap-2 cursor-pointer text-xs text-[#2B2B2B]"
                        >
                          <input
                            type="checkbox"
                            checked={attrCategories.includes(c.slug)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAttrCategories([...attrCategories.filter((x) => x !== 'ALL'), c.slug]);
                              } else {
                                setAttrCategories(attrCategories.filter((x) => x !== c.slug));
                              }
                            }}
                            className="rounded text-[#D32F2F]"
                          />
                          <span>{c.nameBn} ({c.nameEn})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Option Values Builder */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFEAE2]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1A1A1A] block">
                    Option Values & Swatches
                  </label>
                  <span className="text-[10px] text-[#8C8C8C]">
                    {attrOptions.length} values defined
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    value={newOptLabelBn}
                    onChange={(e) => setNewOptLabelBn(e.target.value)}
                    placeholder="Label (Bangla)"
                    className="p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs"
                  />
                  <input
                    value={newOptLabelEn}
                    onChange={(e) => setNewOptLabelEn(e.target.value)}
                    placeholder="Label (English)"
                    className="p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs"
                  />
                  <div className="flex gap-1.5">
                    <input
                      value={newOptValue}
                      onChange={(e) => setNewOptValue(e.target.value)}
                      placeholder="Code / Value"
                      className="flex-1 p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-2 rounded-xl bg-[#D32F2F] text-white font-bold text-xs hover:bg-[#B71C1C] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {attrOptions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {attrOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white border border-[#EFEAE2] text-xs flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1A1A1A]">{opt.labelBn}</span>
                          <span className="text-[#6B6B6B]">({opt.labelEn})</span>
                          <span className="text-[10px] text-[#8C8C8C] font-mono">[{opt.value}]</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-[#8C8C8C] hover:text-[#D32F2F] p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-[#EFEAE2]">
                <button
                  type="button"
                  onClick={() => setIsAttributeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold hover:bg-[#EFEAE2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#D32F2F] text-white font-bold hover:bg-[#B71C1C] cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? 'Saving...' : editingAttribute ? 'Update Attribute' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL: CATEGORY
         ========================================================================= */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2] text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                Delete Category?
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                Are you sure you want to delete category{' '}
                <strong className="text-[#1A1A1A]">"{categoryToDelete.nameEn}"</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold text-xs hover:bg-[#EFEAE2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDeleteCategory}
                className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white font-bold text-xs hover:bg-[#B71C1C] cursor-pointer"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL: ATTRIBUTE
         ========================================================================= */}
      {attributeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#EFEAE2] text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#1A1A1A]">
                Delete Attribute?
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                Are you sure you want to delete attribute{' '}
                <strong className="text-[#1A1A1A]">"{attributeToDelete.nameEn}"</strong>?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAttributeToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#6B6B6B] font-bold text-xs hover:bg-[#EFEAE2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleDeleteAttribute}
                className="px-4 py-2 rounded-xl bg-[#D32F2F] text-white font-bold text-xs hover:bg-[#B71C1C] cursor-pointer"
              >
                {isSaving ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
