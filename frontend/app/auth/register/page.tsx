'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', telegram: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.register(form)
      localStorage.setItem('token', data.access_token)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.authCard}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📇</span>
          <span className={`${styles.logoText} gradient-text`}>Контакты</span>
          <p className={styles.subtitle}>Создайте аккаунт</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Имя</label>
            <input id="register-name" type="text" className="input-field" placeholder="Как вас зовут?"
              value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input id="register-email" type="email" className="input-field" placeholder="your@email.com"
              value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input id="register-password" type="password" className="input-field" placeholder="Минимум 6 символов"
              value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
          </div>
          <div className="input-group">
            <label className="input-label">Telegram (необязательно)</label>
            <input id="register-telegram" type="text" className="input-field" placeholder="@username"
              value={form.telegram} onChange={e => update('telegram', e.target.value)} />
          </div>
          <button id="register-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Создать аккаунт'}
          </button>
        </form>

        <div className={styles.switchLink}>
          Уже есть аккаунт? <a onClick={() => router.push('/auth/login')}>Войти</a>
        </div>
      </div>
    </div>
  )
}
