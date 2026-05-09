'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/store/useHabitStore';
import { Category } from '@/types';
import { 
  X, Check, Plus, Trash2, Edit2, GripVertical,
  Activity, Book, Brain, Briefcase, Camera, 
  Code, Coffee, Coins, Dumbbell, Gamepad, 
  GraduationCap, Heart, Home, Image, Laptop, 
  Languages, Lightbulb, Music, Palette, Pill, 
  Plane, Play, Rocket, ShoppingCart, Smile, 
  Star, Target, Tv, Utensils, Zap 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


const ICONS = {
  Activity, Book, Brain, Briefcase, Camera, 
  Code, Coffee, Coins, Dumbbell, Gamepad, 
  GraduationCap, Heart, Home, Image, Laptop, 
  Languages, Lightbulb, Music, Palette, Pill, 
  Plane, Play, Rocket, ShoppingCart, Smile, 
  Star, Target, Tv, Utensils, Zap 
};

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

interface SortableCategoryItemProps {
  cat: Category;
  startEdit: (cat: Category) => void;
  deleteCategory: (id: string) => void;
}

function SortableCategoryItem({ cat, startEdit, deleteCategory }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 0,
    position: 'relative' as const,
  };

  const IconComp = (ICONS as any)[cat.icon] || Activity;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700 transition-all group",
        isDragging && "bg-zinc-800/80 border-zinc-600 shadow-xl"
      )}
    >
      <div className="flex items-center gap-3">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-1"
        >
          <GripVertical size={14} />
        </button>
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
        >
          <IconComp size={18} />
        </div>
        <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => startEdit(cat)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 transition-all"
        >
          <Edit2 size={14} />
        </button>
        <button 
          onClick={() => {
            if (window.confirm("Delete this category? Habits in this category will become ungrouped.")) {
              deleteCategory(cat.id);
            }
          }}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useHabitStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Activity');
  const [color, setColor] = useState(COLORS[0]);
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setIcon('Activity');
    setColor(COLORS[0]);
    setParentId(undefined);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      await updateCategory(editingId, { name, icon, color, parentId });
    } else {
      await addCategory({ name, icon, color, parentId });
    }
    resetForm();
  };

  const startEdit = (cat: Category) => {
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setParentId(cat.parentId);
    setEditingId(cat.id);
    setIsAdding(true);
  };


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      const reordered = arrayMove(categories, oldIndex, newIndex).map((cat, index) => ({
        ...cat,
        order: index,
      }));

      reorderCategories(reordered);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-xl font-bold text-zinc-100">Manage Categories</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Left Side: List */}
          <div className="w-full md:w-1/2 border-r border-zinc-800 overflow-y-auto p-4 space-y-2">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Your Categories</span>
              {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="p-1 rounded-md bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 transition-all"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            {categories.length === 0 && !isAdding && (
              <div className="text-center py-12 text-zinc-600 italic">
                No categories yet.
              </div>
            )}

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={categories.map(c => c.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {categories.filter(c => !c.parentId).map((parent) => (
                    <div key={parent.id} className="space-y-2">
                      <SortableCategoryItem 
                        cat={parent}
                        startEdit={startEdit}
                        deleteCategory={deleteCategory}
                      />
                      {/* Sub-categories */}
                      <div className="pl-6 border-l border-zinc-800 space-y-2 ml-2">
                        {categories
                          .filter(c => c.parentId === parent.id)
                          .map((child) => (
                            <SortableCategoryItem 
                              key={child.id}
                              cat={child}
                              startEdit={startEdit}
                              deleteCategory={deleteCategory}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Ungrouped/Orphaned subcategories if any */}
                  {categories.filter(c => c.parentId && !categories.some(p => p.id === c.parentId)).map(orphan => (
                    <SortableCategoryItem 
                      key={orphan.id}
                      cat={orphan}
                      startEdit={startEdit}
                      deleteCategory={deleteCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>


          {/* Right Side: Form */}
          <div className="w-full md:w-1/2 p-6 bg-zinc-900/30 overflow-y-auto">
            {isAdding ? (
              <form onSubmit={handleSave} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Category Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fitness"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Parent Category (Optional)</label>
                  <select
                    value={parentId || ''}
                    onChange={(e) => setParentId(e.target.value || undefined)}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm appearance-none"
                  >
                    <option value="">None (Top Level)</option>
                    {categories
                      .filter(c => c.id !== editingId && !c.parentId) // Only top-level categories can be parents
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Icon</label>
                  <div className="grid grid-cols-6 gap-2 bg-zinc-800/30 p-2 rounded-xl h-40 overflow-y-auto border border-zinc-800">
                    {Object.entries(ICONS).map(([key, IconComp]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIcon(key)}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-zinc-700",
                          icon === key ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500"
                        )}
                      >
                        <IconComp size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center",
                          color === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "opacity-60"
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check size={10} className="text-white" />}
                      </button>
                    ))}
                    <div className="relative w-6 h-6 group">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div 
                        className={cn(
                          "w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center transition-all bg-zinc-800",
                          !COLORS.includes(color) && "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110"
                        )}
                        style={{ backgroundColor: !COLORS.includes(color) ? color : undefined }}
                      >
                        {!COLORS.includes(color) ? (
                          <Check size={10} className="text-white" />
                        ) : (
                          <Plus size={10} className="text-zinc-500 group-hover:text-zinc-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-white text-zinc-950 font-bold py-2.5 rounded-xl hover:bg-zinc-200 transition-colors shadow-lg"
                  >
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-zinc-500">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                  <Plus size={32} className="opacity-20" />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-sm">Select a category to edit or create a new one to organize your habits.</p>
                </div>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  Create New Category
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
