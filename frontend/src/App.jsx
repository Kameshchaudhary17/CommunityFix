
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import './App.css'
import LandingPage from './pages/Landing'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MunicipalityDashboard from './pages/MunicipalityDashboard'
import ReportPage from './pages/ReportPage'
import MyReport from './pages/MyReport'
import AdminDashboard from './pages/AdminDashboard'
import AddMunicipality from './pages/AddMunicipality'
import ReportDetail from './pages/ReportDetail'
import Suggestion from './pages/Suggestion'
import UserManagement from './pages/UserManagement'
import ReportManagement from './pages/ReportManagement'
import MySuggestion from './pages/MySuggestion'
import Profile from './pages/Profile'
import SuggestionManagement from './pages/SuggestionManagement'


function App() {
  return (
  <>
    <BrowserRouter>
     <Routes>
      <Route path = '/' element = {<LandingPage />}/>
      <Route path = '/sidebar' element = {<Sidebar />}/>
      <Route path = '/header' element = {<Header />}/>
      <Route path = '/login' element = {<Login />}/>
      <Route path = '/signup' element = {<Signup />}/>
      <Route path = '/home' element = {<Home />}/>
      <Route path = '/user' element = {<UserManagement />}/>
      <Route path = '/report' element = {<ReportPage />}/>
      <Route path = '/reportmanagement' element = {<ReportManagement />}/>
      <Route path = '/myreport' element = {<MyReport />}/>
      <Route path = '/municipality' element = {<MunicipalityDashboard />}/>
      <Route path = '/admin' element = {<AdminDashboard />}/>
      <Route path = '/profile' element = {<Profile />}/>
      <Route path = '/register' element = {< AddMunicipality />}/>
      <Route path = '/suggestion' element = {< Suggestion />}/>
      <Route path = '/mysuggestion' element = {< MySuggestion />}/>
      <Route path = '/reportdetail/:reportId' element = {< ReportDetail />}/>
      <Route path = '/suggestionmanagement' element = {< SuggestionManagement />}/>
      
     </Routes>
     </BrowserRouter>
  </>
  )
}

export default App
