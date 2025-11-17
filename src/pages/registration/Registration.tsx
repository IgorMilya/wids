import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} from 'store/api'
import { useDispatch } from 'react-redux'
import { loginUser } from 'store/reducers/user.slice'
import { ROUTES } from 'routes/routes.utils'

export const Registration = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation()
  const [resendCode, { isLoading: isResending }] = useResendVerificationMutation()

  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    try {
      const response = await register({ email, password }).unwrap()
      console.log('Registration response:', response)

      setStep('verify')
      setInfo('Verification code sent to your email.')
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Registration failed. Please try again.')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    try {
      const response = await verifyEmail({ email, code }).unwrap()

      dispatch(
        loginUser({
          user: { id: response.user_id, username: response.username ?? null },
          token: response.token,
        })
      )

      navigate(ROUTES.DASHBOARD)
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Verification failed. Please try again.')
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

  return (
    <div className="flex h-screen w-full justify-center items-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 w-[360px]">
        {step === 'register' ? (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center">Create account</h2>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
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

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {info && <div className="text-green-600 text-sm text-center">{info}</div>}

              <button
                type="submit"
                disabled={isRegistering}
                className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {isRegistering ? 'Registering…' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="text-sm text-blue-600 hover:underline"
              >
                Already have an account? Login
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-center">Verify your email</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Verification code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {info && <div className="text-green-600 text-sm text-center">{info}</div>}

              <button
                type="submit"
                disabled={isVerifying}
                className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {isVerifying ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="mt-4 w-full text-sm text-blue-600 hover:underline disabled:text-gray-400"
            >
              {isResending ? 'Sending…' : 'Resend verification code'}
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="mt-2 w-full text-sm text-blue-600 hover:underline"
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Registration

