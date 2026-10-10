import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { getRegions } from '@/server/listings'
import { getMessages } from '@/i18n/server'
import {
  ArendatorProfileForm, PasswordForm, ProfileForm,
} from './settings-forms'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).cabinet.meta.settings }
}

export default async function SettingsPage() {
  const user = await requireUser('/kabinet/sozlamalar')
  const t = (await getMessages()).cabinet.settings

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
        <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">{t.title}</h1>
        <p className="mt-1.5 text-sm text-muted">
          {t.subtitle}
        </p>
      </div>

      <ProfileForm
        fullName={user.fullName}
        email={user.email ?? ''}
        phone={user.phone}
      />

      <ArendatorProfileForm
        isNew={!profile}
        regions={regions.map((r) => ({ id: r.id, name: r.name, slug: r.slug }))}
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
