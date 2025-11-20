import { type ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Nav from './components/nav';
import Homepage from './routes/Homepage';
import InstructorPage from './routes/InstructorPage';
import StudentPage from './routes/StudentPage';
import QuizPage from './routes/QuizPage';
import QuizCreatePage from './routes/QuizCreatePage';
import { AuthProvider, useAuth } from './authentication/AuthContext';

type RoleRouteProps = {
  allowedRole: 'Instructor' | 'Student';
  children: ReactElement;
};

function RoleRoute({ allowedRole, children }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return user.role === allowedRole ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route
          path="/instructors"
          element={
            <RoleRoute allowedRole="Instructor">
              <InstructorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/quiz-create"
          element={
            <RoleRoute allowedRole="Instructor">
              <QuizCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/quiz-create/:quizId"
          element={
            <RoleRoute allowedRole="Instructor">
              <QuizCreatePage />
            </RoleRoute>
          }
        />
        <Route
          path="/students"
          element={
            <RoleRoute allowedRole="Student">
              <StudentPage />
            </RoleRoute>
          }
        />
        <Route
          path="/quiz/:quizId"
          element={
            <RoleRoute allowedRole="Student">
              <QuizPage />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
