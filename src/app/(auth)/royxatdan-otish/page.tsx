import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/guards'
import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Roʻyxatdan oʻtish',
  description: 'Arendator platformasida hisob yarating',
}

export default async function RegisterPage(props: PageProps<'/royxatdan-otish'>) {
  const user = await getCurrentUser()
  if (user) redirect('/kabinet')

  const searchParams = await props.searchParams
  const asArendator = searchParams.rol === 'arendator'

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text">Roʻyxatdan oʻtish</h1>
      <p className="mt-2 text-sm text-muted">
        Hisobingiz bormi?{' '}
        <Link href="/kirish" className="font-medium text-primary hover:underline">
          Kirish
        </Link>
      </p>

      <RegisterForm defaultArendator={asArendator} />
    </div>
  )
}
