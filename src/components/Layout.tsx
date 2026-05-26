import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { BackupPanel } from './BackupPanel'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="app">
      <header className="header">
        {isHome ? (
          <div className="header-home">
            <h1 className="header-title">我的收藏夹</h1>
            <BackupPanel />
          </div>
        ) : (
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate(-1)}
            aria-label="返回"
          >
            ← 返回
          </button>
        )}
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
