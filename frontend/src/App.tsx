import { Routes, Route } from 'react-router-dom'
import SearchPage from './pages/SearchPage'
import ReportPage from './pages/ReportPage'
import MatchPage from './pages/MatchPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/report/:companyName" element={<ReportPage />} />
      <Route path="/match" element={<MatchPage />} />
    </Routes>
  )
}
