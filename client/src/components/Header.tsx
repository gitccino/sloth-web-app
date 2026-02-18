import { Link, useLocation } from '@tanstack/react-router'
import { ListTodo, LogIn, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { useNavStore } from '@/lib/store'
import { SlothLogo } from '@/constants/assets'

export default function Header() {
  const location = useLocation()
  const { data: session, isPending } = authClient.useSession()
  const isSignedIn = !isPending && !!session

  const display = useNavStore((state) => state.display)

  // const toggleDisplay = useNavStore((state) => state.toggleDisplay)

  if (isSignedIn && location.pathname === '/todos') {
    return null
  }

  const handleSignout = async () => {
    try {
      await authClient.signOut()
    } catch (err) {
      console.error('Signout failed')
      toast.error('Signout failed')
    }
  }

  return (
    <motion.div
      animate={display ? 'visible' : 'hidden'}
      variants={{
        hidden: {
          y: -75,
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 50,
            duration: 0.2,
          },
        },
        visible: {
          y: 0,
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 50,
          },
        },
      }}
    >
      <header className="z-50 relative px-6 py-2 h-20 flex justify-between items-center bg-sloth-background text-sloth-foreground">
        <div className="flex justify-start items-center gap-2 font-recoleta font-black">
          <Link to="/" className="flex items-center gap-3">
            <img src={SlothLogo} className="size-8 rounded-md" />
            <h1 className="text-2xl">Sloth</h1>
          </Link>
        </div>

        <nav className="z-30 flex items-center gap-2 text-sm">
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

        {/* <div className="z-10 nav-splitter" /> */}
      </header>
    </motion.div>
  )
}
