'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { translations } from '@/components/emergency-dashboard'

export default function PrivacyPage() {
  const { locale, mounted } = useLanguage()

  if (!mounted) return <main className="min-h-screen bg-background" aria-hidden="true" />

  const t = translations[locale]
  return (
    <main className="min-h-screen bg-background px-6 py-12 pb-32 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Link href="/" className="font-mono text-sm font-bold tracking-widest text-primary hover:underline">{t.back_home}</Link>
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs font-bold tracking-[0.2em] text-muted-foreground">{t.legal_label}</p>
          <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">{t.privacy_title}</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.privacy_intro}</p>
        </div>
        <section className="flex flex-col gap-4 border border-border bg-card p-6 leading-relaxed text-muted-foreground sm:p-8">
          <p>{t.privacy_body_one}</p>
          <p>{t.privacy_body_two}</p>
        </section>
      </div>
    </main>
  )
}
