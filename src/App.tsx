import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ui/ScrollToTop'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import ReportPage from './pages/ReportPage'
import MapPage from './pages/MapPage'
import DashboardPage from './pages/DashboardPage'
import TechnologyPage from './pages/TechnologyPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="technology" element={<TechnologyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
    </Routes>
    </>
  )
}
