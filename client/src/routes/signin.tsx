import {
  Link,
  createFileRoute,
  // redirect,
  useRouter,
} from '@tanstack/react-router'
import { AlertCircleIcon, ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
// import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { InputWithIcon } from '@/components/ui/inputwithicon'
import { Button } from '@/components/ui/button'
import { WarningMessage } from '@/components/WarningMessage'
import { authClient } from '@/lib/auth-client'
import { Loading } from '@/components/Loading'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { useNavStore } from '@/lib/store'
import { RegisterArt } from '@/constants/assets'
// import registerBg2 from '@/assets/register-bg-2.png'

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
  const hideDisplay = useNavStore((state) => state.hideDisplay)

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
    setAuthError('')

    try {
      await authClient.signIn.email(
        {
          email: signinData.email,
          password: signinData.password,
        },
        {
          onRequest: () => {
            setLoading(true)
          },
          onSuccess: async () => {
            // toast.success('Signed in successfully')
            await new Promise((resolve) => setTimeout(resolve, 1000))
            router.navigate({ to: '/todos' })
            // throw redirect({ to: '/todos' })
          },
          onError: (ctx) => {
            // toast.error(ctx.error.message)
            setAuthError(ctx.error.message)
          },
        },
      )
      // throw new Error('Signin failed')
    } catch (err) {
      setAuthError('An unexpected error occured')
      console.error('Signin failed', err)
      // toast.error('Signin failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    hideDisplay()
  }, [hideDisplay])

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-start md:justify-center min-h-[calc(100vh-80px)] px-[5%] bg-sloth-background text-sloth-foreground">
      <Button
        variant="ghostNav"
        size="sm"
        className="self-start md:hidden"
        asChild
      >
        <Link to="/">
          <ArrowLeft size={12} />
          <h1>Back to Home</h1>
        </Link>
      </Button>
      <div className="md:min-h-[600px] w-full md:w-120 text-core-background flex justify-center items-center">
        <img src={RegisterArt} className="w-[50%] md:w-full" />
      </div>
      <div className="md:min-h-[calc(100vh-120px)] w-100 flex flex-col justify-center items-start pb-20">
        <Button
          variant="ghostNav"
          size="sm"
          className="ml-4 hidden md:flex"
          asChild
        >
          <Link to="/">
            <ArrowLeft size={12} />
            <h1>Back to Home</h1>
          </Link>
        </Button>
        <Card className="w-full h-fit shadow-none bg-sloth-background text-sloth-foreground">
          <CardHeader className="w-full flex flex-col items-start gap-1 px-8">
            <CardTitle className="font-oktah-round font-semibold text-2xl md:text-3xl">
              Welcome Back
            </CardTitle>
            <CardDescription className="pl-0.5 font-normal">
              Happy to see you again <br />
              Sign in and pick up where you left off
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    className={`rounded-xl h-12 shadow-none`}
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
                    className={`rounded-xl h-12 shadow-none`}
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
                variant="defaultCore"
                disabled={!isFormValid || loading}
                hidden={!isFormValid}
                className={`h-12 w-full font-medium rounded-xl cursor-pointer`}
              >
                {loading ? <Loading>Signing in...</Loading> : 'Sign in'}
              </Button>
              {authError && (
                <Alert
                  variant="destructive"
                  className="border-0 bg-sloth-background"
                >
                  <AlertCircleIcon strokeWidth={2.5} />
                  <AlertTitle className="font-semibold">{authError}</AlertTitle>
                </Alert>
              )}
            </form>

            <div className="w-full py-3 flex justify-center items-center gap-2 text-sm text-muted-foreground">
              <span>Don't have an account?</span>
              <Link to="/signup" className="text-sloth-foreground">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
