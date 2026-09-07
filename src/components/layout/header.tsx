import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/guards'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { SearchBar } from './search-bar'
import { CompareLink, DesktopNav, MobileNav, ThemeToggle, UserMenu } from './header-nav'

export async function Header() {
  const user = await getCurrentUser()
  const headerUser = user
    ? {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
      <div className="container-page">
        <div className="flex h-16 items-center gap-3">
          <Logo />

          <div className="mx-auto hidden w-full max-w-md lg:block">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <DesktopNav />
            <CompareLink />
            <ThemeToggle />

            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

            {headerUser ? (
              <>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/kabinet/elon/yangi">
                    <Plus /> Eʼlon joylash
                  </Link>
                </Button>
                <UserMenu user={headerUser} />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/kirish">Kirish</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/royxatdan-otish">Eʼlon joylash</Link>
                </Button>
              </>
            )}

            <MobileNav user={headerUser} />
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>
    </header>
  )
}
