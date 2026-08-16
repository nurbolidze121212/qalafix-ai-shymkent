import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-[100dvh] bg-white text-slate-950">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg">
        Перейти к основному содержимому
      </a>
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 pb-[calc(5.6rem+env(safe-area-inset-bottom))] pt-2 md:pb-10 md:pt-8">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
