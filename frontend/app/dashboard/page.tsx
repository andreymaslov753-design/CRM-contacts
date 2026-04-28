'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import styles from './page.module.css'

interface Contact {
  id: number; name: string; phone?: string; email?: string;
  telegram?: string; company?: string; position?: string;
  category_id?: number; category?: { id: number; name: string; color: string; icon: string };
  tags: { id: number; tag: string }[];
  has_photo: boolean; created_at: string;
}
interface Category {
  id: number; name: string; color: string; icon: string;
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickForm, setQuickForm] = useState({ name: '', telegram: '', category_id: '', tags: '' })
  const [saving, setSaving] = useState(false)

  const categoryId = searchParams.get('category_id')
  const tagFilter = searchParams.get('tag')

  const loadContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.q = search
      if (categoryId) params.category_id = Number(categoryId)
      if (tagFilter) params.tag = tagFilter
      const data = await api.getContacts(params)
      setContacts(data)
    } catch {}
    setLoading(false)
  }, [search, categoryId, tagFilter])

  useEffect(() => {
    loadContacts()
    api.getCategories().then(setCategories).catch(() => {})
  }, [loadContacts])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(loadContacts, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleQuickAdd = async () => {
    if (!quickForm.name.trim()) return
    setSaving(true)
    try {
      const tags = quickForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      await api.createContact({
        name: quickForm.name,
        telegram: quickForm.telegram || undefined,
        category_id: quickForm.category_id ? Number(quickForm.category_id) : undefined,
        tags,
      })
      setQuickForm({ name: '', telegram: '', category_id: '', tags: '' })
      setShowQuickAdd(false)
      loadContacts()
    } catch {}
    setSaving(false)
  }

  const openTelegram = (username: string) => {
    const clean = username.replace('@', '')
    window.open(`https://t.me/${clean}`, '_blank')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          {tagFilter ? `#${tagFilter}` : categoryId ? categories.find(c => c.id === Number(categoryId))?.name || 'Контакты' : 'Все контакты'}
          <span className={styles.headerCount}>({contacts.length})</span>
        </h1>
        <button className="btn btn-primary" onClick={() => setShowQuickAdd(!showQuickAdd)}>
          {showQuickAdd ? '✕ Закрыть' : '＋ Добавить'}
        </button>
      </div>

      {/* Quick Add Bar */}
      {showQuickAdd && (
        <div className={styles.quickAdd}>
          <div className={styles.quickAddRow}>
            <div className={styles.quickAddField} style={{ flex: 2 }}>
              <label>Имя *</label>
              <input placeholder="Иван Петров" value={quickForm.name}
                onChange={e => setQuickForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleQuickAdd()} autoFocus />
            </div>
            <div className={styles.quickAddField}>
              <label>Telegram</label>
              <input placeholder="@username" value={quickForm.telegram}
                onChange={e => setQuickForm(f => ({ ...f, telegram: e.target.value }))} />
            </div>
            <div className={styles.quickAddField}>
              <label>Категория</label>
              <select value={quickForm.category_id}
                onChange={e => setQuickForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">—</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className={styles.quickAddField}>
              <label>Теги (через запятую)</label>
              <input placeholder="конференция, инвестор" value={quickForm.tags}
                onChange={e => setQuickForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <div className={styles.quickAddActions}>
              <button className="btn btn-primary btn-sm" onClick={handleQuickAdd} disabled={saving || !quickForm.name.trim()}>
                {saving ? '...' : '💾 Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className={styles.searchBar}>
        <input
          id="search-contacts"
          className={styles.searchInput}
          placeholder="Поиск по имени, компании, телеграму, заметкам..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className={styles.loading}><div className="spinner spinner-lg" /></div>
      ) : contacts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📇</div>
          <h3>Нет контактов</h3>
          <p>{search ? 'Ничего не найдено по запросу' : 'Добавьте первый контакт кнопкой выше'}</p>
        </div>
      ) : (
        <div className={styles.contactsList}>
          {contacts.map((c, i) => (
            <div
              key={c.id}
              className={styles.contactCard}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => router.push(`/dashboard/contacts/${c.id}`)}
            >
              <div className="avatar">
                {getInitials(c.name)}
              </div>
              <div className={styles.contactInfo}>
                <div className={styles.contactName}>
                  {c.name}
                  {c.category && (
                    <span className="cat-badge" style={{
                      background: `${c.category.color}15`,
                      color: c.category.color,
                      border: `1px solid ${c.category.color}30`,
                    }}>
                      {c.category.icon} {c.category.name}
                    </span>
                  )}
                </div>
                <div className={styles.contactMeta}>
                  {c.company && <span>🏢 {c.company}</span>}
                  {c.position && <span>💼 {c.position}</span>}
                  {c.phone && <span>📞 {c.phone}</span>}
                </div>
                {c.tags.length > 0 && (
                  <div className={styles.contactTags}>
                    {c.tags.map(t => (
                      <span key={t.id} className="tag tag-default" onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard?tag=${encodeURIComponent(t.tag)}`)
                      }}>
                        #{t.tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.contactActions}>
                {c.telegram && (
                  <a
                    className={styles.tgLink}
                    onClick={(e) => { e.stopPropagation(); openTelegram(c.telegram!) }}
                    title="Открыть в Telegram"
                  >
                    💬 TG
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
