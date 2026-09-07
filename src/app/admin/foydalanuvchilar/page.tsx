import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { ROLE_LABELS } from '@/lib/constants'
import { formatDateLong, formatPhone, formatRelative } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { BlockButton } from './block-button'

export const metadata: Metadata = { title: 'Foydalanuvchilar · Admin' }

export default async function AdminUsersPage() {
  const admin = await getCurrentUser()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, fullName: true, phone: true, email: true, role: true,
      isBlocked: true, isPhoneVerified: true, createdAt: true, lastLoginAt: true,
      _count: { select: { listings: true, leads: true } },
    },
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Soʻnggi <span className="tabular font-medium text-text">{users.length}</span> ta
        foydalanuvchi
      </p>

      <div className="overflow-x-auto rounded-[14px] border border-border">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="bg-surface-2 text-left text-[12px] uppercase tracking-wide text-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 text-center font-semibold">Eʼlon</th>
              <th className="px-4 py-3 text-center font-semibold">Ariza</th>
              <th className="px-4 py-3 font-semibold">Roʻyxatdan</th>
              <th className="px-4 py-3 font-semibold">Oxirgi kirish</th>
              <th className="px-4 py-3 text-right font-semibold">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{u.fullName}</p>
                  <p className="tabular text-[12px] text-muted">{formatPhone(u.phone)}</p>
                  {u.email ? (
                    <p className="text-[12px] text-subtle">{u.email}</p>
                  ) : null}
                  {u.isBlocked ? (
                    <Badge variant="danger" size="sm" className="mt-1">
                      Bloklangan
                    </Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      u.role === 'ADMIN' ? 'primary' : u.role === 'ARENDATOR' ? 'default' : 'default'
                    }
                    size="sm"
                  >
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </td>
                <td className="tabular px-4 py-3 text-center text-[13px] text-text">
                  {u._count.listings}
                </td>
                <td className="tabular px-4 py-3 text-center text-[13px] text-text">
                  {u._count.leads}
                </td>
                <td className="px-4 py-3 text-[12px] text-muted">
                  {formatDateLong(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-[12px] text-muted">
                  {u.lastLoginAt ? formatRelative(u.lastLoginAt) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <BlockButton
                    userId={u.id}
                    isBlocked={u.isBlocked}
                    disabled={u.role === 'ADMIN' || u.id === admin?.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
