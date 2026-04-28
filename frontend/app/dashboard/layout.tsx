'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import styles from './layout.module.css'

interface Category {
  id: number; name: string; color: string; icon: string; contacts_count: number;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }
    loadSidebar()
  }, [])

  const loadSidebar = async () => {
    try {
      const [cats, tgs] = await Promise.all([api.getCategories(), api.getAllTags()])
      setCategories(cats)
      setTags(tgs)
    } catch {}
  }

  const handleCategoryClick = (catId: number | null) => {
    setSelectedCategoryId(catId)
    setSelectedTag(null)
    if (catId === null) {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?category_id=${catId}`)
    }
  }

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag)
    setSelectedCategoryId(null)
    if (tag === selectedTag) {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?tag=${encodeURIComponent(tag)}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const totalContacts = categories.reduce((sum, c) => sum + c.contacts_count, 0)

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.sidebarLogoIcon}>📇</span>
          <span className="gradient-text">Контакты</span>
        </div>

        <nav className={styles.navSection}>
          <div className={styles.navLabel}>Навигация</div>
          <button
            className={`${styles.navItem} ${pathname === '/dashboard' && !selectedCategoryId && !selectedTag ? styles.navItemActive : ''}`}
            onClick={() => handleCategoryClick(null)}
          >
            <span className={styles.navItemIcon}>📋</span>
            Все контакты
            <span className={styles.navItemCount}>{totalContacts}</span>
          </button>
          <button
            className={`${styles.navItem} ${pathname === '/dashboard/reminders' ? styles.navItemActive : ''}`}
            onClick={() => router.push('/dashboard/reminders')}
          >
            <span className={styles.navItemIcon}>🔔</span>
            Напоминания
          </button>
          <button
            className={`${styles.navItem} ${pathname === '/dashboard/categories' ? styles.navItemActive : ''}`}
            onClick={() => router.push('/dashboard/categories')}
          >
            <span className={styles.navItemIcon}>🏷️</span>
            Категории
          </button>
        </nav>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>Категории</div>
          <div className={styles.categoriesList}>
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`${styles.catItem} ${selectedCategoryId === cat.id ? styles.catItemActive : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span className={styles.catDot} style={{ background: cat.color }} />
                <span className={styles.catName}>{cat.icon} {cat.name}</span>
                <span className={styles.catCount}>{cat.contacts_count}</span>
              </div>
            ))}
          </div>
        </div>

        {tags.length > 0 && (
          <div className={styles.navSection}>
            <div className={styles.navLabel}>Теги</div>
            <div className={styles.tagsCloud}>
              {tags.slice(0, 15).map(t => (
                <span
                  key={t.tag}
                  className={`tag ${selectedTag === t.tag ? 'tag-active' : 'tag-default'}`}
                  onClick={() => handleTagClick(t.tag)}
                >
                  #{t.tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Выйти
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
