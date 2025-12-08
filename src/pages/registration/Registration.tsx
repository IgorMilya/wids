import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Formik, FormikHelpers } from 'formik'
import {
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} from 'store/api'
import { useDispatch } from 'react-redux'
import { loginUser } from 'store/reducers/user.slice'
import { ROUTES } from 'routes/routes.utils'
import { enableGuestMode } from 'utils/guestMode'
import ReCAPTCHA from 'react-google-recaptcha'
import { Input, Button } from 'UI'
import {
  registerInitialValues,
  registerValidationSchema,
  verifyInitialValues,
  verifyValidationSchema,
} from './RegistrationForm.utils'

interface RegisterFormValues {
  email: string
  password: string
}

interface VerifyFormValues {
  code: string
}

export const Registration = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation()
  const [resendCode, { isLoading: isResending }] = useResendVerificationMutation()

  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

  const handleRegister = async (
    values: RegisterFormValues,
    actions: FormikHelpers<RegisterFormValues>
  ) => {
    setError('')
    setInfo('')

    if (!captchaToken) {
      setError('Please complete the captcha.')
      return
    }

    try {
      const response = await register({
        email: values.email,
        password: values.password,
        captcha_token: captchaToken,
      }).unwrap()

      console.log('Registration response:', response)

      recaptchaRef.current?.reset()
      setCaptchaToken(null)
      setEmail(values.email) // Store email for verification step

      setStep('verify')
      setInfo('Verification code sent to your email.')
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Registration failed. Please try again.')
      // Keep form values - Formik preserves them automatically
    }
  }

  const handleVerify = async (
    values: VerifyFormValues,
    actions: FormikHelpers<VerifyFormValues>
  ) => {
    setError('')
    setInfo('')

    try {
      const response = await verifyEmail({ email, code: values.code }).unwrap()

      dispatch(
        loginUser({
          user: { id: response.user_id, username: response.username ?? null },
          token: response.token,
          refresh_token: response.refresh_token,
        })
      )

      // Clear any existing tour state for new registration
      localStorage.removeItem('wisp_tour_started')
      localStorage.removeItem('wisp_tour_completed')
      
      // Navigate to Scanner where tour will start
      navigate(ROUTES.SCANNER)
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Verification failed. Please try again.')
      // Keep form values - Formik preserves them automatically
    }
  }

  const handleResendCode = async () => {
    setError('')
    setInfo('')

    try {
      await resendCode({ email }).unwrap()
      setInfo('Verification code resent. Check your inbox.')
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Failed to resend verification code.')
    }
  }

  const handleGuestLogin = async () => {
    try {
      await enableGuestMode()
      navigate(ROUTES.SCANNER)
    } catch (error) {
      console.error('Failed to enable guest mode:', error)
      // Still navigate to scanner even if cache fails
      navigate(ROUTES.SCANNER)
    }
  }

  return (
    <div className="flex h-screen w-full justify-center items-center bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-6 small-laptop:p-8 w-full max-w-[360px] normal-laptop:max-w-[400px] large-laptop:max-w-[420px]">
        {step === 'register' ? (
          <>
            <h2 className="text-xl small-laptop:text-2xl font-semibold mb-4 small-laptop:mb-6 text-center">
              Create account
            </h2>
            <Formik
              initialValues={registerInitialValues}
              validationSchema={registerValidationSchema}
              onSubmit={handleRegister}
            >
              <Form className="flex flex-col gap-4">
                <Input
                  name="email"
                  labelText="Email"
                  type="email"
                  placeholder="Enter your email"
                />

                <Input
                  name="password"
                  labelText="Password"
                  type="password"
                  placeholder="Enter your password"
                />

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="text-green-600 text-sm text-center bg-green-50 border border-green-200 rounded px-3 py-2">
                    {info}
                  </div>
                )}

                {siteKey ? (
                  <ReCAPTCHA
                    sitekey={siteKey}
                    ref={recaptchaRef}
                    onChange={(token: string | null) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                ) : (
                  <div className="text-red-600 text-sm text-center">
                    reCAPTCHA key missing. Set VITE_RECAPTCHA_SITE_KEY.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isRegistering}
                  variant="secondary"
                  className="!py-2 !rounded !transition"
                >
                  {isRegistering ? 'Registering…' : 'Register'}
                </Button>

                <Button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  variant="outline"
                  className="!text-sm !text-secondary hover:!underline !bg-transparent !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto !justify-center"
                >
                  Already have an account? Login
                </Button>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Button
                    type="button"
                    onClick={handleGuestLogin}
                    variant="outline"
                    className="!text-sm !text-gray-600 hover:!text-gray-800 !font-medium !bg-transparent !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto !justify-center"
                  >
                    Login as Guest
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Use offline mode with cached networks
                  </p>
                </div>
              </Form>
            </Formik>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-center">Verify your email</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <Formik
              initialValues={verifyInitialValues}
              validationSchema={verifyValidationSchema}
              onSubmit={handleVerify}
            >
              <Form className="flex flex-col gap-4">
                <Input
                  name="code"
                  labelText="Verification code"
                  type="text"
                  placeholder="Enter 6-digit code"
                />

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded px-3 py-2">
                    {error}
                  </div>
                )}
                {info && (
                  <div className="text-green-600 text-sm text-center bg-green-50 border border-green-200 rounded px-3 py-2">
                    {info}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isVerifying}
                  variant="primary"
                  className="!bg-green-600 !text-white !py-2 !rounded hover:!bg-green-700 !transition"
                >
                  {isVerifying ? 'Verifying…' : 'Verify & Continue'}
                </Button>
              </Form>
            </Formik>

            <Button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              variant="outline"
              className="!mt-4 !w-full !text-sm !text-secondary hover:!underline !bg-transparent !p-0 !normal-laptop:w-full !large-laptop:w-full !wide-screen:w-full !small-laptop:w-full !justify-center"
            >
              {isResending ? 'Sending…' : 'Resend verification code'}
            </Button>

            <Button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              variant="outline"
              className="!mt-2 !w-full !text-sm !text-secondary hover:!underline !bg-transparent !p-0 !normal-laptop:w-full !large-laptop:w-full !wide-screen:w-full !small-laptop:w-full !justify-center"
            >
              Back to login
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default Registration
