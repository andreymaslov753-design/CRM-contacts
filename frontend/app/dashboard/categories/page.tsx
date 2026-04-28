'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Category {
  id: number; name: string; color: string; icon: string; sort_order: number; contacts_count: number;
}

const EMOJI_OPTIONS = ['💼', '👤', '⚽', '📚', '🎯', '🎨', '🔬', '🌍', '🏠', '🎵', '❤️', '🔵']
const COLOR_OPTIONS = ['#7c3aed', '#059669', '#f59e0b', '#3b82f6', '#db2777', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316', '#14b8a6']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showNew, setShowNew] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', color: '#7c3aed', icon: '📁' })

  useEffect(() => { load() }, [])
  const load = async () => {
    try { setCategories(await api.getCategories()) } catch {}
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    try {
      await api.createCategory(form)
      setForm({ name: '', color: '#7c3aed', icon: '📁' })
      setShowNew(false)
      load()
    } catch {}
  }

  const handleUpdate = async (id: number) => {
    try {
      await api.updateCategory(id, form)
      setEditId(null)
      load()
    } catch {}
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить категорию? Контакты станут "без категории".')) return
    try { await api.deleteCategory(id); load() } catch {}
  }

  const startEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, color: cat.color, icon: cat.icon })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>🏷️ Категории</h1>
        <button className="btn btn-primary" onClick={() => { setShowNew(!showNew); setEditId(null) }}>
          {showNew ? '✕ Закрыть' : '＋ Создать'}
        </button>
      </div>

      {showNew && (
        <div className="card card-static" style={{ marginBottom: 16, padding: 20 }}>
          <div className="input-group">
            <label className="input-label">Название</label>
            <input className="input-field" placeholder="Название категории" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            <div>
              <label className="input-label">Иконка</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: form.icon === e ? '2px solid var(--accent-purple)' : '1px solid var(--border)', background: form.icon === e ? 'rgba(124,58,237,0.1)' : 'var(--bg-input)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Цвет</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!form.name.trim()}>
            💾 Создать
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {categories.map(cat => (
          <div key={cat.id} className="card card-static" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            {editId === cat.id ? (
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <input className="input-field" style={{ flex: 1 }} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(cat.id)}>💾</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>✕</button>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))}
                      style={{ width: 30, height: 30, borderRadius: 6, border: form.icon === e ? '2px solid var(--accent-purple)' : '1px solid var(--border)', background: form.icon === e ? 'rgba(124,58,237,0.1)' : 'var(--bg-input)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {e}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{cat.name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cat.contacts_count} контактов</span>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(cat)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(cat.id)} style={{ color: 'var(--accent-red)' }}>🗑</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
