import React, { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AlertCircleIcon, KeyRound, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WarningMessage } from '@/components/WarningMessage'
import { InputWithIcon } from '@/components/ui/inputwithicon'
import { authClient } from '@/lib/auth-client'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Loading } from '@/components/Loading'

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
})

type SignupData = Record<
  'username' | 'email' | 'password' | 'confirmPassword',
  string
>
type FormErrorState = Record<
  'username' | 'email' | 'password' | 'confirmPassword',
  string
>

function RouteComponent() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [signupData, setSignupData] = React.useState<SignupData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrorState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session && !isPending) {
      console.log('Already signed in')
      router.navigate({ to: '/todos' })
    }
  }, [session, isPending, router])

  const validationMessages = useMemo(() => {
    return {
      username: {
        required: 'Username is required',
        pattern: 'Username can only contain alphabetic characters',
      },
      email: {
        required: 'Email is required',
        invalid: 'Enter a valid email address',
      },
      password: {
        required: 'Password is required',
        pattern:
          'Password can only include alphabetic characters, numbers and @',
        tooShort: 'Password must be at least 8 characters',
        tooLong: 'Password must be at most 30 characters',
      },
      confirmPassword: {
        required: 'Password confirmation is required',
        mismatch: "Password doesn't match",
      },
    }
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const form = e.currentTarget
    const formData = new FormData(form)
    // const email = formData.get('email')
    // const password = formData.get('password')
    // console.log(email, password)
    const formDataObj = Object.fromEntries(formData) as SignupData

    const formErrors: Partial<FormErrorState> = {}
    const focusElementId = e.target.id
    if (focusElementId === 'username') {
      const usernameInput = form.elements.namedItem(
        'username',
      ) as HTMLInputElement | null
      if (usernameInput && usernameInput.validity.valid) {
        formErrors.username = ''
      }

      if (usernameInput && !usernameInput.validity.valid) {
        formErrors.username = usernameInput.validity.valueMissing
          ? validationMessages.username.required
          : validationMessages.username.pattern
      }
    }

    if (focusElementId === 'email') {
      const emailInput = form.elements.namedItem(
        'email',
      ) as HTMLInputElement | null
      if (emailInput && emailInput.validity.valid) {
        formErrors.email = ''
      }

      if (emailInput && !emailInput.validity.valid) {
        formErrors.email = emailInput.validity.valueMissing
          ? validationMessages.email.required
          : validationMessages.email.invalid
      }
    }

    if (focusElementId === 'password') {
      const passwordInput = form.elements.namedItem(
        'password',
      ) as HTMLInputElement | null
      if (passwordInput && passwordInput.validity.valid) {
        formErrors.password = ''
      }

      if (passwordInput && !passwordInput.validity.valid) {
        if (passwordInput.validity.valueMissing) {
          formErrors.password = validationMessages.password.required
        } else if (passwordInput.validity.patternMismatch) {
          formErrors.password = validationMessages.password.pattern
        } else if (passwordInput.validity.tooShort) {
          formErrors.password = validationMessages.password.tooShort
        } else if (passwordInput.validity.tooLong) {
          formErrors.password = validationMessages.password.tooLong
        }
      }
    }

    if (focusElementId === 'confirmPassword') {
      const confirmPasswordInput = form.elements.namedItem(
        'confirmPassword',
      ) as HTMLInputElement | null

      if (
        confirmPasswordInput &&
        formDataObj.confirmPassword !== formDataObj.password
      ) {
        formErrors.confirmPassword = validationMessages.confirmPassword.mismatch
      }

      if (
        confirmPasswordInput &&
        formDataObj.confirmPassword === formDataObj.password
      ) {
        if (confirmPasswordInput.validity.valueMissing) {
          formErrors.confirmPassword =
            validationMessages.confirmPassword.required
        } else {
          formErrors.confirmPassword = ''
        }
      }
    }

    setSignupData(formDataObj)
    setErrors((prev) => ({ ...prev, ...formErrors }))
  }

  const isFormValid = useMemo(() => {
    return (
      signupData.username !== '' &&
      signupData.email !== '' &&
      signupData.password !== '' &&
      signupData.confirmPassword !== '' &&
      signupData.password === signupData.confirmPassword &&
      Object.values(errors).every((error) => error === '')
    )
  }, [signupData, errors])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    try {
      await authClient.signUp
        .email({
          email: signupData.email,
          password: signupData.password,
          name: signupData.username,
        })
        .then(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          router.navigate({ to: '/todos' })
        })
      // throw new Error('Signup failed')
      toast.success('Account created successfully')
    } catch (err) {
      setAuthError('An unexpected error occured')
      console.error('Signup failed', err)
      toast.error('Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-64px)] pt-30">
      <Card className="w-full max-w-sm shadow-none">
        <CardHeader className="px-8">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>We Are Happy To See You</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bt mb-8 p-1 rounded-full flex gap-1">
            <Button
              variant="ghost"
              className={`h-8 flex-1 font-bold text-muted-foreground rounded-full text-sm flex items-center justify-center`}
              aschild
            >
              <Link to="/signin">Sign in</Link>
            </Button>

            <Button
              className={`h-8 flex-1 font-bold text-neutral rounded-full text-sm flex items-center justify-center`}
              aschild
            >
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>

          <form onChange={handleFormChange} onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 mb-4">
              <div className="grid gap-1">
                <InputWithIcon
                  id="username"
                  name="username"
                  type="username"
                  autoComplete="off"
                  placeholder="Enter your username"
                  pattern="[A-Za-z]+"
                  // value={signupData.username}
                  required
                  disabled={loading}
                  endIcon={User}
                  className={`rounded-full h-12 ${signupData.username && !errors.username ? 'border-success focus-visible:border-success' : signupData.username ? 'border-destructive focus-visible:border-destructive' : ''}`}
                />
                <WarningMessage
                  name="username"
                  message={errors.username}
                  className="px-4"
                />
              </div>
              <div className="grid gap-1">
                <InputWithIcon
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  placeholder="Enter your email"
                  // value={signupData.email}
                  disabled={loading}
                  required
                  endIcon={Mail}
                  className={`rounded-full h-12 ${signupData.email && !errors.email ? 'border-success focus-visible:border-success' : signupData.email ? 'border-destructive focus-visible:border-destructive' : ''}`}
                />
                <WarningMessage
                  name="email"
                  message={errors.email}
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
                  className={`rounded-full h-12 ${signupData.password && !errors.password ? 'border-success focus-visible:border-success' : signupData.password ? 'border-destructive focus-visible:border-destructive' : ''}`}
                />
                <WarningMessage
                  name="password"
                  message={errors.password}
                  className="px-4"
                />
              </div>

              <div className="grid gap-1">
                <InputWithIcon
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  pattern="[A-Za-z0-9@]+"
                  minLength={8}
                  maxLength={30}
                  // value={signupData.confirmPassword}
                  disabled={loading}
                  required
                  endIcon={KeyRound}
                  className={`rounded-full h-12 ${signupData.confirmPassword && !errors.confirmPassword ? 'border-success focus-visible:border-success' : signupData.confirmPassword ? 'border-destructive focus-visible:border-destructive' : ''}`}
                />
                <WarningMessage
                  name="confirmPassword"
                  message={errors.confirmPassword}
                  className="px-4"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className={`h-12 w-full font-bold text-neutral rounded-full cursor-pointer`}
            >
              {loading ? (
                <Loading>Creating account...</Loading>
              ) : (
                'Create account'
              )}
            </Button>
            {authError && (
              <Alert variant="destructive" className="border-0">
                <AlertCircleIcon />
                <AlertTitle>{authError}</AlertTitle>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-3" />
      </Card>
    </div>
  )
}
