import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { getRegions } from '@/server/listings'
import {
  ArendatorProfileForm, PasswordForm, ProfileForm,
} from './settings-forms'

export const metadata: Metadata = { title: 'Sozlamalar' }

export default async function SettingsPage() {
  const user = await requireUser('/kabinet/sozlamalar')

  const [profile, regions] = await Promise.all([
    prisma.arendatorProfile.findUnique({
      where: { userId: user.id },
      select: {
        companyName: true, legalName: true, inn: true, about: true,
        address: true, regionId: true, website: true, telegram: true,
        instagram: true, workingHours: true, isVerified: true, slug: true,
      },
    }),
    getRegions(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Sozlamalar</h1>
        <p className="mt-1.5 text-sm text-muted">
          Profil, kompaniya maʼlumotlari va xavfsizlik
        </p>
      </div>

      <ProfileForm
        fullName={user.fullName}
        email={user.email ?? ''}
        phone={user.phone}
      />

      <ArendatorProfileForm
        isNew={!profile}
        regions={regions.map((r) => ({ id: r.id, name: r.name }))}
        profile={{
          companyName: profile?.companyName ?? '',
          legalName: profile?.legalName ?? '',
          inn: profile?.inn ?? '',
          about: profile?.about ?? '',
          address: profile?.address ?? '',
          regionId: profile?.regionId ?? '',
          website: profile?.website ?? '',
          telegram: profile?.telegram ?? '',
          instagram: profile?.instagram ?? '',
          workingHours: profile?.workingHours ?? '',
        }}
      />

      <PasswordForm />
    </div>
  )
}
