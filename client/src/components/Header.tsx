import { Link } from '@tanstack/react-router'

import { useEffect, useState } from 'react'
import { Home, ListTodo, LogIn, LogOut, Network, X } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, isPending } = authClient.useSession()
  const [isSignedIn, setIsSignedIn] = useState(false)

  const handleSignout = async () => {
    try {
      await authClient.signOut()
      // throw new Error('Signout failed')
      toast.success('Signed out successfully')
      setIsSignedIn(false)
    } catch (err) {
      console.error('Signout failed')
      toast.error('Signout failed')
    }
  }

  const handleToast = () => {
    toast('Event has been created.')
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
          <Button variant="ghost" asChild>
            <Link
              to="/"
              className="group w-fit px-3 py-2 flex items-center gap-1.5 rounded-xl transition-colors"
              activeProps={{ className: 'font-bold' }}
            >
              <Home
                size={16}
                className="opacity-50 group-data-[status=active]:opacity-100"
              />
              <span>Home</span>
            </Link>
          </Button>

          {isSignedIn && (
            <Button variant="ghost" asChild>
              <Link
                to="/todos"
                className="w-fit px-3 py-2 flex items-center gap-1.5 rounded-xl transition-colors"
              >
                <ListTodo size={16} className="opacity-50" />
                <span>Todos</span>
              </Link>
            </Button>
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
              variant="outline"
              className="w-fit px-3 py-2 flex items-center gap-1.5 rounded-xl transition-colors cursor-pointer"
              onClick={handleSignout}
            >
              <LogOut size={16} className="opacity-80" />
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
    </>
  )
}
