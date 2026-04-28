'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface Reminder {
  id: number; contact_id: number; contact_name: string;
  remind_at: string; text: string; is_done: boolean; created_at: string;
}

export default function RemindersPage() {
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try { setReminders(await api.getReminders(filter || undefined)) } catch {}
    setLoading(false)
  }

  const handleDone = async (id: number) => {
    try { await api.markReminderDone(id); load() } catch {}
  }

  const handleDelete = async (id: number) => {
    try { await api.deleteReminder(id); load() } catch {}
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const isOverdue = (d: string) => new Date(d) < new Date()

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>🔔 Напоминания</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { key: '', label: 'Активные' },
          { key: 'overdue', label: '⚠️ Просроченные' },
          { key: 'upcoming', label: '📅 Предстоящие' },
          { key: 'done', label: '✅ Выполненные' },
        ].map(f => (
          <button key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.key)}
          >{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <h3>Нет напоминаний</h3>
          <p>Создайте напоминание из карточки контакта</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reminders.map(r => (
            <div key={r.id} className="card card-static" style={{
              padding: 16, display: 'flex', alignItems: 'center', gap: 14,
              opacity: r.is_done ? 0.5 : 1,
              borderColor: !r.is_done && isOverdue(r.remind_at) ? 'rgba(239,68,68,0.3)' : undefined,
            }}>
              <button
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: r.is_done ? '2px solid var(--accent-green)' : '2px solid var(--border)',
                  background: r.is_done ? 'rgba(5,150,105,0.15)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 14, color: 'var(--accent-green)',
                  flexShrink: 0,
                }}
                onClick={() => !r.is_done && handleDone(r.id)}
              >
                {r.is_done ? '✓' : ''}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, textDecoration: r.is_done ? 'line-through' : 'none' }}>
                  {r.text}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                  <span
                    style={{ cursor: 'pointer', color: 'var(--accent-purple)' }}
                    onClick={() => router.push(`/dashboard/contacts/${r.contact_id}`)}
                  >
                    👤 {r.contact_name}
                  </span>
                  <span style={{ color: !r.is_done && isOverdue(r.remind_at) ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                    🕐 {formatDate(r.remind_at)}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)} style={{ color: 'var(--text-muted)' }}>
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
