'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import styles from '../auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ email, password })
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
          <p className={styles.subtitle}>Войдите в свой аккаунт</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              id="login-email"
              type="email" className="input-field" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input
              id="login-password"
              type="password" className="input-field" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Войти'}
          </button>
        </form>

        <div className={styles.switchLink}>
          Нет аккаунта? <a onClick={() => router.push('/auth/register')}>Создать</a>
        </div>
      </div>
    </div>
  )
}
