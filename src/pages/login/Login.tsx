import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Formik, FormikHelpers } from 'formik'
import ReCAPTCHA from 'react-google-recaptcha'
import { useLoginMutation, api } from 'store/api'
import { useDispatch } from 'react-redux'
import { loginUser } from 'store/reducers/user.slice'
import { ROUTES } from 'routes/routes.utils'
import { Input, Button } from 'UI'
import { initialValues, validationSchema } from './LoginForm.utils'
import { saveNetworkCache, enableGuestMode, getDeviceId } from 'utils'

//TODO:
interface LoginFormValues {
  email: string
  password: string
}

export const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

  const handleSubmit = async (
    values: LoginFormValues,
    actions: FormikHelpers<LoginFormValues>
  ) => {
    setError('')

    if (!captchaToken) {
      setError('Please complete the captcha.')
      actions.setSubmitting(false)
      return
    }

    try {
      const response = await login({
        email: values.email,
        password: values.password,
        captcha_token: captchaToken,
      }).unwrap()

      console.log('Login response:', response)

      // Reset RTK Query cache to ensure fresh data for the new user
      dispatch(api.util.resetApiState())

      dispatch(
        loginUser({
          user: { id: response.user_id, username: response.username ?? null },
          token: response.token,
          refresh_token: response.refresh_token,
        })
      )

      try {
        const deviceId = await getDeviceId()
        console.log('deviceId', deviceId);
        await saveNetworkCache(deviceId, [], [])
      } catch (error) {
        console.error('Failed to cache networks:', error)
      }

      recaptchaRef.current?.reset()
      setCaptchaToken(null)

      navigate('/scanner')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err?.data?.error || err?.data?.message || 'Login failed. Please try again.')
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
      actions.setSubmitting(false)
    }
  }

  const handleGuestLogin = async () => {
    try {
      await enableGuestMode()
      navigate(ROUTES.SCANNER)
    } catch (error) {
      console.error('Failed to enable guest mode:', error)
      navigate(ROUTES.SCANNER)
    }
  }

  return (
    <div className="flex h-screen w-full justify-center items-center bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-6 small-laptop:p-8 w-full max-w-[350px] normal-laptop:max-w-[380px] large-laptop:max-w-[400px]">
        <h2 className="text-xl small-laptop:text-2xl font-semibold mb-4 small-laptop:mb-6 text-center">
          Login
        </h2>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={false}
        >
          <Form 
            className="flex flex-col gap-4"
            noValidate
          >
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
              disabled={isLoading}
              variant="secondary"
              className="!py-2 !rounded !transition"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
        </Formik>

        <div className="mt-4 flex flex-col gap-2 text-sm text-center">
          <Button
            type="button"
            onClick={() => navigate(ROUTES.RESET_PASSWORD)}
            variant="outline"
            className="!text-secondary hover:!underline !bg-transparent !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto !justify-center"
          >
            Forgot password?
          </Button>
          <Button
            type="button"
            onClick={() => navigate(ROUTES.REGISTRATION)}
            variant="outline"
            className="!text-secondary hover:!underline !bg-transparent !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto !justify-center"
          >
            Need an account? Register
          </Button>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleGuestLogin}
              variant="outline"
              className="!text-gray-600 hover:!text-gray-800 !font-medium !bg-transparent !p-0 !w-auto !normal-laptop:w-auto !large-laptop:w-auto !wide-screen:w-auto !small-laptop:w-auto !justify-center"
            >
              Login as Guest
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Use offline mode with cached networks
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
