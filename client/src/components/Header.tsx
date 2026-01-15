import { Link } from '@tanstack/react-router'

import { useEffect, useState } from 'react'
import { Home, ListTodo, LogIn, LogOut, Menu, Network, X } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const [isSignedIn, setIsSignedIn] = useState(false)

  const handleSignout = async () => {
    try {
      await authClient.signOut()
      setIsSignedIn(false)
    } catch (err) {
      console.error('Signout failed')
    }
  }

  useEffect(() => {
    if (!isPending && session) {
      setIsSignedIn(true)
    } else {
      setIsSignedIn(false)
    }
  }, [session, isPending])

  return (
    <>
      <header className="px-6 py-2 flex justify-between items-center">
        <div className="flex justify-start items-center gap-2">
          {/* <button
            className="p-1.5 hover:bg-foreground/5 rounded-xs transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button> */}

          <h1>Todos</h1>
        </div>

        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/"
            className="w-fit px-3 py-2 flex items-center gap-1.5 hover:bg-base-300 rounded-xl transition-colors"
            activeProps={{ className: '' }}
          >
            <Home size={16} className="opacity-50" />
            <span>Home</span>
          </Link>

          {isSignedIn && (
            <Link
              to="/todos"
              className="w-fit px-3 py-2 flex items-center gap-1.5 hover:bg-base-300 rounded-xl transition-colors"
            >
              <ListTodo size={16} className="opacity-50" />
              <span>Todos</span>
            </Link>
          )}

          {!isSignedIn && (
            <>
              {/* <Link
                to="/signup"
                className="w-fit px-3 py-2 flex items-center gap-1.5 hover:bg-base-300 rounded-xl transition-colors"
              >
                <LogIn size={16} className="opacity-50" />
                <span>Sign Up</span>
              </Link> */}

              <Link
                to="/signin"
                className="w-fit px-3 py-2 flex items-center gap-1.5 hover:bg-base-300 rounded-xl transition-colors"
              >
                <LogIn size={16} className="opacity-50" />
                <span>Sign in</span>
              </Link>
            </>
          )}

          {isSignedIn && (
            <Button
              className="w-fit px-3 py-2 flex items-center gap-1.5 hover:bg-base-300 rounded-xl transition-colors cursor-pointer"
              onClick={handleSignout}
            >
              <LogOut size={16} className="opacity-50" />
              <span>Logout</span>
            </Button>
          )}

          {/* <Link
            to="/demo/tanstack-query"
            className="w-fit px-3 py-2 flex items-center gap-1.5 hover:bg-base-300 rounded-xl transition-colors"
            activeProps={{ className: '' }}
          >
            <Network size={16} className="opacity-50" />
            <span>TanStack Query</span>
          </Link> */}
        </nav>
      </header>

      {/* <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </header> */}

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Demo Links Start */}

          <Link
            to="/demo/tanstack-query"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Network size={20} />
            <span className="font-medium">TanStack Query</span>
          </Link>

          {/* Demo Links End */}
        </nav>
      </aside>
    </>
  )
}
