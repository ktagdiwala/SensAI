import { NavLink, useNavigate } from 'react-router-dom';
import MainIcon from '../assets/Mainicon.svg';
import { useAuth } from '../authentication/AuthContext';

export default function Nav() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  //logic for handling when a link is active and clicked
  const baseClasses = 'flex px-3 py-2 text-black text-lg'
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${baseClasses} ${isActive ? 'font-bold' : ''}`

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="flex gap-10 text-black m-5">
      <div className="flex items-center gap-3">
        <img src={MainIcon} alt="Main icon" className="w-12 h-12" />
        <h1 className="flex px-3 py-2 text-black text-lg">SensAI</h1>
      </div>
      <NavLink to="/" className={linkClass}>Home</NavLink>
      {user?.role === 'Instructor' && (
        <>
          <NavLink to="/instructors" className={linkClass}>Instructors</NavLink>
          <NavLink to="/instructor/analytics" className={linkClass}>Analytics</NavLink>
          <NavLink to="/quiz-create" className={linkClass}>Create Quiz</NavLink>
        </>
      )}
      {user?.role === 'Student' && (
        <>
          <NavLink to="/students" className={linkClass}>Students</NavLink>
        </>
      )}
      {user && (
        <NavLink to="/account" className={linkClass}>Account</NavLink>
      )}
      {user && (
        <button
          onClick={handleLogout}
          className="ml-auto rounded-full bg-canvas-light-blue px-4 py-2 text-white text-sm font-semibold hover:bg-blue-600"
        >
          Logout
        </button>
      )}
    </nav>
  );
}