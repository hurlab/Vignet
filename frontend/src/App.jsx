import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import NotFound from './pages/NotFound.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const Vaccine = lazy(() => import('./pages/Vaccine.jsx'))
const VacNet = lazy(() => import('./pages/VacNet.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Faqs = lazy(() => import('./pages/Faqs.jsx'))
const VacPair = lazy(() => import('./pages/VacPair.jsx'))
const Enrichment = lazy(() => import('./pages/Enrichment.jsx'))
const Compare = lazy(() => import('./pages/Compare.jsx'))
const VOExplorer = lazy(() => import('./pages/VOExplorer.jsx'))
const VacSummarAI = lazy(() => import('./pages/VacSummarAI.jsx'))
const VaccineAssistant = lazy(() => import('./pages/VaccineAssistant.jsx'))
const AnalyzeText = lazy(() => import('./pages/AnalyzeText.jsx'))
const Report = lazy(() => import('./pages/Report.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))

function usePageTracking() {
  const location = useLocation()
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: '/vignet' + location.pathname + location.search,
      })
    }
  }, [location])
}

function App() {
  usePageTracking()

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="vaccine" element={<Vaccine />} />
            <Route path="vacnet" element={<VacNet />} />
            <Route path="about" element={<About />} />
            <Route path="faqs" element={<Faqs />} />
            <Route path="vacpair" element={<VacPair />} />
            <Route path="enrichment" element={<Enrichment />} />
            <Route path="compare" element={<Compare />} />
            <Route path="vo-explorer" element={<VOExplorer />} />
            <Route path="vacsummarai" element={<VacSummarAI />} />
            <Route path="assistant" element={<VaccineAssistant />} />
            <Route path="analyze" element={<AnalyzeText />} />
            <Route path="report" element={<Report />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
