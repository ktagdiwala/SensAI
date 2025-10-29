import { Routes, Route, Link } from 'react-router-dom'
import StudentPage from './routes/StudentPage'
import InstructorPage from './routes/InstructorPage'
import Homepage from './routes/Homepage'

function App() {
  return (
    <>
      <nav className='flex'>
        <Link to="/students" className='flex-auto'>Students</Link>
        <Link to="/instructors" className='flex-auto'>Instructors</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/students" element={<StudentPage />} />
        <Route path="/instructors" element={<InstructorPage />} />
      </Routes>


    </>
  )
}

export default App
