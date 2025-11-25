import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReCAPTCHA from 'react-google-recaptcha'
import { useLoginMutation } from 'store/api'
import { useDispatch } from 'react-redux'
import { loginUser } from 'store/reducers/user.slice'
import { ROUTES } from 'routes/routes.utils'

export const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
console.log(siteKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!captchaToken) {
      setError('Please complete the captcha.')
      return
    }

    try {
      const response = await login({ email, password, captcha_token: captchaToken }).unwrap()
      console.log('Registration response:', response)

      // Save user & tokens
      dispatch(
        loginUser({
          user: { id: response.user_id, username: response.username ?? null },
          token: response.token,
          refresh_token: response.refresh_token,
        })
      )

      recaptchaRef.current?.reset()
      setCaptchaToken(null)

      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      // Backend returns {"error": "..."} for failed login
      setError(err?.data?.error || 'Login failed. Please try again.')
      // Reset captcha on failed login so user must complete it again
      recaptchaRef.current?.reset()
      setCaptchaToken(null)
    }
  }

  return (
    <div className="flex h-screen w-full justify-center items-center bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-6 small-laptop:p-8 w-full max-w-[350px] normal-laptop:max-w-[380px] large-laptop:max-w-[400px]">
        <h2 className="text-xl small-laptop:text-2xl font-semibold mb-4 small-laptop:mb-6 text-center">Login</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
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

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-sm text-center">
          <button
            type="button"
            onClick={() => navigate(ROUTES.RESET_PASSWORD)}
            className="text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.REGISTRATION)}
            className="text-blue-600 hover:underline"
          >
            Need an account? Register
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
