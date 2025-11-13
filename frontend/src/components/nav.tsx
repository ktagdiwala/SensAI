import { NavLink } from 'react-router-dom'
import MainIcon from '../assets/Mainicon.svg'


export default function Nav() {

    //logic for handling when a link is active and clicked
    const baseClasses = 'flex px-3 py-2 text-black text-lg'
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `${baseClasses} ${isActive ? 'font-bold' : ''}`

  return (
    <nav className="flex gap-10 text-black m-5">
      <div className="flex items-center gap-3">
        <img src={MainIcon} alt="Main icon" className="w-12 h-12" />
        <h1 className="flex px-3 py-2 text-black text-lg">SensAI</h1>
      </div>
      <NavLink to="/" className={linkClass}>Home</NavLink>
      <NavLink to="/instructors" className={linkClass}>Instructors</NavLink>
      <NavLink to="/students" className={linkClass}>Students</NavLink>
    </nav>
  )
}