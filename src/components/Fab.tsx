import { Link } from 'react-router-dom'

export function Fab() {
  return (
    <Link to="/guide/new" className="fab" aria-label="新建攻略">
      +
    </Link>
  )
}
