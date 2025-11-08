import { Routes, Route } from 'react-router-dom'
import StudentPage from './routes/StudentPage'
import InstructorPage from './routes/InstructorPage'
import Homepage from './routes/Homepage'
import QuizCreatePage from './routes/QuizCreatePage'

import Nav from './components/nav'

function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/students" element={<StudentPage />} />
        <Route path="/instructors" element={<InstructorPage />} />
        <Route path="/quiz-create" element={<QuizCreatePage />} />
      </Routes>
    </>
  )
}

export default App
