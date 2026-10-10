import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/guards'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Kirish',
  description: 'Arendator hisobingizga kiring',
}

export default async function LoginPage(props: PageProps<'/kirish'>) {
  const user = await getCurrentUser()
  if (user) redirect('/kabinet')

  const searchParams = await props.searchParams
  const next = typeof searchParams.next === 'string' ? searchParams.next : undefined

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">Hisobga kirish</h1>
      <p className="mt-2 text-sm text-muted">
        Hisobingiz yoʻqmi?{' '}
        <Link href="/royxatdan-otish" className="font-medium text-primary hover:underline">
          Roʻyxatdan oʻting
        </Link>
      </p>

      <LoginForm next={next} />
    </div>
  )
}
