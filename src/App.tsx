import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { GuideDetailPage } from './pages/GuideDetailPage'
import { GuideFormPage } from './pages/GuideFormPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/guide/new" element={<GuideFormPage />} />
          <Route path="/guide/:id" element={<GuideDetailPage />} />
          <Route path="/guide/:id/edit" element={<GuideFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
