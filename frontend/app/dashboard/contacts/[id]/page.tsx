'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import styles from './page.module.css'

interface Contact {
  id: number; name: string; phone?: string; email?: string;
  telegram?: string; company?: string; position?: string;
  notes?: string; photo_base64?: string;
  category_id?: number; category?: { id: number; name: string; color: string; icon: string };
  tags: { id: number; tag: string }[];
  google_contact_id?: string; created_at: string; updated_at?: string;
}
interface TimelineEvent {
  id: number; event_type: string; description?: string; created_at: string;
}
interface Category {
  id: number; name: string; color: string; icon: string;
}

export default function ContactDetailPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = Number(params.id)

  const [contact, setContact] = useState<Contact | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContact()
    api.getCategories().then(setCategories).catch(() => {})
  }, [contactId])

  const loadContact = async () => {
    try {
      const [c, t] = await Promise.all([
        api.getContact(contactId),
        api.getTimeline(contactId),
      ])
      setContact(c)
      setTimeline(t)
      setForm({
        name: c.name, phone: c.phone || '', email: c.email || '',
        telegram: c.telegram || '', company: c.company || '',
        position: c.position || '', notes: c.notes || '',
        category_id: c.category_id || '',
      })
    } catch {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    try {
      await api.updateContact(contactId, {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
      })
      setEditing(false)
      loadContact()
    } catch {}
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    try {
      await api.addTags(contactId, [newTag.trim()])
      setNewTag('')
      loadContact()
    } catch {}
  }

  const handleRemoveTag = async (tag: string) => {
    try {
      await api.removeTag(contactId, tag)
      loadContact()
    } catch {}
  }

  const handleDelete = async () => {
    if (!confirm('Удалить контакт? Это действие необратимо.')) return
    try {
      await api.deleteContact(contactId)
      router.push('/dashboard')
    } catch {}
  }

  const openTelegram = (username: string) => {
    window.open(`https://t.me/${username.replace('@', '')}`, '_blank')
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const eventIcons: Record<string, string> = {
    created: '✨', updated: '✏️', synced: '🔄',
    tags_added: '🏷️', file_added: '📎', reminder_set: '🔔',
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
  if (!contact) return null

  return (
    <div>
      <div className={styles.back}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>
          ← Назад
        </button>
      </div>

      <div className={styles.contactHeader}>
        <div className="avatar avatar-lg">
          {contact.photo_base64 ? (
            <img src={contact.photo_base64} alt={contact.name} />
          ) : getInitials(contact.name)}
        </div>
        <div className={styles.contactHeaderInfo}>
          <div className={styles.contactName}>{contact.name}</div>
          <div className={styles.contactCompany}>
            {[contact.position, contact.company].filter(Boolean).join(' в ')}
          </div>
        </div>
        <div className={styles.contactHeaderActions}>
          {contact.telegram && (
            <button className="quick-action quick-action-tg" onClick={() => openTelegram(contact.telegram!)}>
              💬 Telegram
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? '✕ Отмена' : '✏️ Редактировать'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className={styles.editForm}>
          <div className={styles.formRow}>
            <div className="input-group">
              <label className="input-label">Имя</label>
              <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Telegram</label>
              <input className="input-field" value={form.telegram} onChange={e => setForm({...form, telegram: e.target.value})} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className="input-group">
              <label className="input-label">Телефон</label>
              <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className="input-group">
              <label className="input-label">Компания</label>
              <input className="input-field" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Должность</label>
              <input className="input-field" value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Категория</label>
            <select className="input-field" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
              <option value="">Без категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Заметки</label>
            <textarea className="input-field" rows={4} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <button className="btn btn-primary" onClick={handleSave}>💾 Сохранить</button>

          <div className={styles.deleteZone}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Удалить контакт</button>
          </div>
        </div>
      ) : (
        <>
          {/* Info Grid */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Контактная информация</div>
            <div className={styles.infoGrid}>
              {contact.phone && (
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>📞 Телефон</div>
                  <div className={styles.infoValue}>{contact.phone}</div>
                </div>
              )}
              {contact.email && (
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>📧 Email</div>
                  <div className={styles.infoValue}>{contact.email}</div>
                </div>
              )}
              {contact.telegram && (
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>💬 Telegram</div>
                  <div className={styles.infoValue}>{contact.telegram}</div>
                </div>
              )}
              {contact.category && (
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>🏷️ Категория</div>
                  <div className={styles.infoValue}>{contact.category.icon} {contact.category.name}</div>
                </div>
              )}
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>📅 Добавлен</div>
                <div className={styles.infoValue}>{formatDate(contact.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Теги</div>
            <div className={styles.tagsRow}>
              {contact.tags.map(t => (
                <span key={t.id} className="tag tag-default">
                  #{t.tag}
                  <span className="tag-remove" onClick={() => handleRemoveTag(t.tag)}>✕</span>
                </span>
              ))}
              <input
                className={styles.tagInput}
                placeholder="+ тег"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              />
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Заметки</div>
              <div className={styles.notes}>{contact.notes}</div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>История</div>
              {timeline.map(e => (
                <div key={e.id} className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>{eventIcons[e.event_type] || '📌'}</div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineText}>{e.description}</div>
                    <div className={styles.timelineDate}>{formatDate(e.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
