import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Контакты — Персональная CRM',
  description: 'Управляйте личными и деловыми контактами. Быстрый ввод, теги, напоминания и интеграция с Google Contacts.',
  keywords: 'CRM, контакты, нетворкинг, управление контактами, Google Contacts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
