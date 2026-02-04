import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AlertCircleIcon, KeyRound, Mail, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { InputWithIcon } from '@/components/ui/inputwithicon'
// import { WarningMessage } from '@/components/WarningMessage'
import { Button } from '@/components/ui/button'
import { WarningMessage } from '@/components/WarningMessage'
import { authClient } from '@/lib/auth-client'
import { Loading } from '@/components/Loading'
import { Alert, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/signin')({
  component: RouteComponent,
})

type SigninData = Record<'email' | 'password', string>
type FormErrorState = Record<'email' | 'password', string>

function RouteComponent() {
  const router = useRouter()
  const [signinData, setSigninData] = useState<SigninData>({
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrorState>({
    email: '',
    password: '',
  })
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  const validationMessages = useMemo(() => {
    return {
      email: {
        invalid: 'Enter a valid email address',
      },
    }
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    const formData = new FormData(form)
    const formDataObj = Object.fromEntries(formData) as SigninData

    const _formErrors: Partial<FormErrorState> = {}
    const focusElementId = e.target.id
    if (focusElementId === 'email') {
      const emailInput = form.elements.namedItem(
        'email',
      ) as HTMLInputElement | null
      if (emailInput && emailInput.validity.valid) {
        _formErrors.email = ''
      }

      if (emailInput && !emailInput.validity.valid) {
        if (!emailInput.validity.valueMissing) {
          _formErrors.email = validationMessages.email.invalid
        }
      }
    }

    setSigninData(formDataObj)
    setFormErrors((prev) => ({ ...prev, ..._formErrors }))
  }

  const isFormValid = useMemo(() => {
    return (
      signinData.email !== '' &&
      signinData.password !== '' &&
      Object.values(formErrors).every((error) => error === '')
    )
  }, [signinData, formErrors])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    try {
      await authClient.signIn
        .email({
          email: signinData.email,
          password: signinData.password,
        })
        .then(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          router.navigate({ to: '/todos' })
        })
      // throw new Error('Signin failed')
      toast.success('Signed in successfully')
    } catch (err) {
      setAuthError('An unexpected error occured')
      console.error('Signup failed', err)
      toast.error('Signin failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-64px)] pt-30 bg-background">
      <Card className="w-full max-w-sm shadow-none">
        <CardHeader className="px-8">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>We Are Happy To See You Again</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bt mb-8 p-1 rounded-full flex gap-1">
            <Button
              className="h-8 flex-1 font-bold text-neutral rounded-full text-sm flex items-center justify-center"
              asChild
            >
              <Link to="/signin">Sign in</Link>
            </Button>

            <Button
              variant="ghost"
              className={`h-8 flex-1 font-bold text-muted-foreground rounded-full text-sm flex items-center justify-center`}
              asChild
            >
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>

          <form onChange={handleFormChange} onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 mb-4">
              <div className="grid gap-1">
                <InputWithIcon
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                  endIcon={Mail}
                  className={`rounded-full h-12`}
                />
                <WarningMessage
                  name="username"
                  message={formErrors.email}
                  className="px-4"
                />
              </div>
              <div className="grid gap-1">
                <InputWithIcon
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  pattern="[A-Za-z0-9@]+"
                  minLength={8}
                  maxLength={30}
                  // value={signupData.password}
                  disabled={loading}
                  required
                  endIcon={KeyRound}
                  className={`rounded-full h-12`}
                />
                <WarningMessage
                  name="password"
                  message={formErrors.password}
                  className="px-4"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className={`h-12 w-full font-bold text-neutral rounded-full cursor-pointer`}
            >
              {loading ? <Loading>Signing in...</Loading> : 'Sign in'}
            </Button>
            {authError && (
              <Alert variant="destructive" className="border-0">
                <AlertCircleIcon />
                <AlertTitle>{authError}</AlertTitle>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
