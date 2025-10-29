import { Routes, Route } from 'react-router-dom'
import StudentPage from './routes/StudentPage'
import InstructorPage from './routes/InstructorPage'
import Homepage from './routes/Homepage'

import Nav from './components/nav'

function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/students" element={<StudentPage />} />
        <Route path="/instructors" element={<InstructorPage />} />
      </Routes>
    </>
  )
}

export default App
