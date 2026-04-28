'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) router.push('/dashboard')
  }, [router])

  return (
    <div className={styles.page}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📇</span>
          <span className="gradient-text">Контакты</span>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-ghost" onClick={() => router.push('/auth/login')}>
            Войти
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/auth/register')}>
            Начать
          </button>
        </div>
      </header>

      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span>✨</span>
            <span>Персональная CRM для нетворкера</span>
          </div>

          <h1 className={styles.heroTitle}>
            Все ваши связи
            <br />
            <span className="gradient-text">в одном месте</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Храните контакты, добавляйте голосовые заметки, ставьте напоминания 
            и синхронизируйте с Google Contacts — всё в одном удобном интерфейсе
          </p>

          <div className={styles.ctaGroup}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/auth/register')}>
              Создать аккаунт
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push('/auth/login')}>
              Войти
            </button>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(22,163,74,0.1)' }}>⚡</div>
            <div>
              <div className={styles.featureDim} style={{ color: 'var(--accent-green)' }}>Quick Add</div>
              <div className={styles.featureText}>Добавляйте контакт за 2 секунды прямо во время разговора</div>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(5,150,105,0.1)' }}>🏷️</div>
            <div>
              <div className={styles.featureDim} style={{ color: 'var(--accent-emerald)' }}>Теги</div>
              <div className={styles.featureText}>Группируйте контакты хэштегами: #конференция, #инвестор, #партнёр</div>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(13,148,136,0.1)' }}>🔔</div>
            <div>
              <div className={styles.featureDim} style={{ color: 'var(--accent-teal)' }}>Follow-up</div>
              <div className={styles.featureText}>Напоминания о follow-up: никогда не забудете написать</div>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ background: 'rgba(0,136,204,0.08)' }}>💬</div>
            <div>
              <div className={styles.featureDim} style={{ color: '#0088cc' }}>Telegram</div>
              <div className={styles.featureText}>Один клик — и вы уже в диалоге с контактом в Telegram</div>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <span className="gradient-text" style={{ fontWeight: 700 }}>Контакты</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Персональная CRM © 2026
        </span>
      </footer>
    </div>
  )
}
