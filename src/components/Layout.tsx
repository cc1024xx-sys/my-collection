import { Outlet, useNavigate, useLocation } from 'react-router-dom'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="app">
      <header className="header">
        {isHome ? (
          <h1 className="header-title">我的攻略</h1>
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
