import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CompareBar } from '@/components/layout/compare-bar'

export default function MainLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CompareBar />
    </>
  )
}
