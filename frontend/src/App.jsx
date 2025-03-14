
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import './App.css'
import LandingPage from './pages/Landing'
// import Feature from './pages/Feature'
// import Contact from './pages/Contact'
import MunicipalityDashboard from './pages/MunicipalityDashboard'
import ReportPage from './pages/ReportPage'
import AdminDashboard from './pages/AdminDashboard'
import AddMunicipality from './pages/AddMunicipality'
import ReportDetail from './pages/ReportDetail'
import Suggestion from './pages/Suggestion'
import Profile from './pages/Profile'
import SuggestionManagement from './pages/SuggestionManagement'


function App() {
  return (
  <>
    <BrowserRouter>
     <Routes>
      <Route path = '/' element = {<LandingPage />}/>
      {/* <Route path = '/feature' element = {<Feature />}/>
      <Route path = '/Contact' element = {<Contact />}/> */}
      <Route path = '/login' element = {<Login />}/>
      <Route path = '/signup' element = {<Signup />}/>
      <Route path = '/home' element = {<Home />}/>
      <Route path = '/report' element = {<ReportPage />}/>
      <Route path = '/municipality' element = {<MunicipalityDashboard />}/>
      <Route path = '/admin' element = {<AdminDashboard />}/>
      <Route path = '/profile' element = {<Profile />}/>
      <Route path = '/register' element = {< AddMunicipality />}/>
      <Route path = '/suggestion' element = {< Suggestion />}/>
      <Route path = '/reportdetail/:reportId' element = {< ReportDetail />}/>
      <Route path = '/suggestionmanagement' element = {< SuggestionManagement />}/>
      
     </Routes>
     </BrowserRouter>
  </>
  )
}

export default App
