
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import './App.css'
import LandingPage from './pages/Landing'
import MunicipalityDashboard from './pages/MunicipalityDashboard'
import ReportPage from './pages/ReportPage'
import AdminDashboard from './pages/AdminDashboard'
import AddMunicipality from './pages/AddMunicipality'

function App() {
  return (
  <>
    <BrowserRouter>
     <Routes>
      <Route path = '/' element = {<LandingPage />}/>
      <Route path = '/login' element = {<Login />}/>
      <Route path = '/signup' element = {<Signup />}/>
      <Route path = '/home' element = {<Home />}/>
      <Route path = '/report' element = {<ReportPage />}/>
      <Route path = '/municipality' element = {<MunicipalityDashboard />}/>
      <Route path = '/admin' element = {<AdminDashboard />}/>
      <Route path = '/register' element = {< AddMunicipality />}/>
     </Routes>
     </BrowserRouter>
  </>
  )
}

export default App
