import { Link } from '@tanstack/react-router'

import { useEffect, useState } from 'react'
import { Home, ListTodo, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { data: session, isPending } = authClient.useSession()
  const [isSignedIn, setIsSignedIn] = useState(false)

  const handleSignout = async () => {
    try {
      await authClient.signOut()
      // throw new Error('Signout failed')
      // toast.success('Signed out successfully')
      setIsSignedIn(false)
    } catch (err) {
      console.error('Signout failed')
      toast.error('Signout failed')
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
      <header className="relative z-50 px-6 py-2 h-20 pt-4 flex justify-between items-center bg-core-primary text-white">
        <div className="flex justify-start items-center gap-2 font-recoleta font-black">
          <Link to="/">
            <h1 className="text-2xl">sloth.</h1>
          </Link>
        </div>

        <nav className="z-30 flex items-center gap-2 text-sm">
          {/* <Button variant="ghostNav" size="sm" asChild>
            <Link
              to="/"
              className="group w-fit px-3 py-2 flex items-center gap-1 rounded-lg transition-colors"
              // activeProps={{ className: 'font-bold' }}
            >
              <Home
                className="size-3 opacity-50 group-data-[status=active]:opacity-100"
                strokeWidth={2.5}
              />
              <span className="font-bold">Home</span>
            </Link>
          </Button> */}

          {isSignedIn && (
            <Button variant="ghostNav" size="sm" asChild>
              <Link
                to="/todos"
                className="group w-fit px-3 py-2 flex items-center gap-1 rounded-lg transition-colors"
              >
                <ListTodo
                  className="size-3 opacity-50 group-data-[status=active]:opacity-100"
                  strokeWidth={2.5}
                />
                <span className="font-bold">Todos</span>
              </Link>
            </Button>
          )}

          {!isSignedIn && (
            <>
              <Button variant="ghostNav" size="sm" asChild>
                <Link
                  to="/signin"
                  className="group w-fit px-3 py-2 flex items-center gap-1 rounded-lg transition-colors"
                >
                  <LogIn
                    className="size-3 opacity-50 group-data-[status=active]:opacity-100"
                    strokeWidth={2.5}
                  />
                  <span className="font-bold">Sign in</span>
                </Link>
              </Button>
            </>
          )}

          {isSignedIn && (
            <Button
              variant="default"
              size="sm"
              className="w-fit px-3 py-2 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer"
              onClick={handleSignout}
            >
              <LogOut className="size-3 opacity-100" strokeWidth={2.5} />
              <span className="font-bold">Logout</span>
            </Button>
          )}
        </nav>

        <div className="nav-splitter" />
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
