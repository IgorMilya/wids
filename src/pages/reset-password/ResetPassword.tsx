import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useResetPasswordRequestMutation,
  useResetPasswordConfirmMutation,
} from 'store/api'
import { ROUTES } from 'routes/routes.utils'
import { Button } from 'UI'

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [requestReset, { isLoading: requesting }] = useResetPasswordRequestMutation()
  const [confirmReset, { isLoading: confirming }] = useResetPasswordConfirmMutation()

  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    try {
      await requestReset({ email }).unwrap()
      setStep('confirm')
      setInfo('Reset code sent to your email.')
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Failed to send reset code.')
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    try {
      await confirmReset({ email, code, new_password: newPassword }).unwrap()
      setInfo('Password updated. Redirecting to login...')
      setTimeout(() => navigate(ROUTES.LOGIN), 1500)
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Failed to update password.')
    }
  }

  return (
    <div className="flex h-screen w-full justify-center items-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 w-[350px]">
        {step === 'request' ? (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center">Reset Password</h2>
            <form onSubmit={handleRequest} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-secondary"
                />
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {info && <div className="text-green-600 text-sm text-center">{info}</div>}

              <Button
                type="submit"
                disabled={requesting}
                variant="secondary"
                className="!py-2 !rounded !transition"
              >
                {requesting ? 'Sending...' : 'Send reset code'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center">Enter Reset Code</h2>
            <form onSubmit={handleConfirm} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-secondary"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-secondary"
                />
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}
              {info && <div className="text-green-600 text-sm text-center">{info}</div>}

              <Button
                type="submit"
                disabled={confirming}
                variant="primary"
                className="!bg-green-600 !text-white !py-2 !rounded hover:!bg-green-700 !transition"
              >
                {confirming ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          </>
        )}

        <Button
          type="button"
          onClick={() => navigate(ROUTES.LOGIN)}
          variant="outline"
          className="!mt-4 !w-full !text-center !text-sm !text-secondary hover:!underline !bg-transparent !p-0 !normal-laptop:w-full !large-laptop:w-full !wide-screen:w-full !small-laptop:w-full !justify-center"
        >
          Back to Login
        </Button>
      </div>
    </div>
  )
}

export default ResetPassword

