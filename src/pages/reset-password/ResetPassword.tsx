import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, FormikHelpers } from 'formik'
import { object, string, ref } from 'yup'
import {
  useResetPasswordRequestMutation,
  useResetPasswordConfirmMutation,
} from 'store/api'
import { ROUTES } from 'routes/routes.utils'
import { Button } from 'UI'
import Input from 'UI/input/Input'
import { validationUser } from 'utils/validation'

const requestResetInitialValues = {
  email: '',
}

const requestResetValidationSchema = object().shape({
  email: validationUser.email(true),
})

const confirmResetInitialValues = {
  code: '',
  newPassword: '',
  confirmPassword: '',
}

const confirmResetValidationSchema = object().shape({
  code: string().required('Verification code is required'),
  newPassword: validationUser.password(true),
  confirmPassword: string()
    .required('Please confirm your password')
    .oneOf([ref('newPassword')], 'Passwords must match'),
})

export const ResetPassword = () => {
  const navigate = useNavigate()
  const [requestReset, { isLoading: requesting }] = useResetPasswordRequestMutation()
  const [confirmReset, { isLoading: confirming }] = useResetPasswordConfirmMutation()

  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const handleRequest = async (
    values: { email: string },
    { setSubmitting }: FormikHelpers<{ email: string }>
  ) => {
    setError('')
    setInfo('')

    try {
      await requestReset({ email: values.email }).unwrap()
      setEmail(values.email)
      setStep('confirm')
      setInfo('Reset code sent to your email.')
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Failed to send reset code.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async (
    values: { code: string; newPassword: string; confirmPassword: string },
    { setSubmitting }: FormikHelpers<{ code: string; newPassword: string; confirmPassword: string }>
  ) => {
    setError('')
    setInfo('')

    try {
      await confirmReset({ email, code: values.code, new_password: values.newPassword }).unwrap()
      setInfo('Password updated. Redirecting to login...')
      setTimeout(() => navigate(ROUTES.LOGIN), 1500)
    } catch (err: any) {
      console.error(err)
      setError(err?.data?.error || 'Failed to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen w-full justify-center items-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 w-[350px]">
        {step === 'request' ? (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center">Reset Password</h2>
            <Formik
              initialValues={requestResetInitialValues}
              validationSchema={requestResetValidationSchema}
              onSubmit={handleRequest}
            >
              {({ isSubmitting }) => (
                <Form className="flex flex-col gap-4">
                  <Input
                    name="email"
                    labelText="Email"
                    type="email"
                    placeholder="Enter your email"
                  />

                  {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                  {info && <div className="text-green-600 text-sm text-center">{info}</div>}

                  <Button
                    type="submit"
                    disabled={requesting || isSubmitting}
                    variant="secondary"
                    className="!py-2 !rounded !transition"
                  >
                    {requesting ? 'Sending...' : 'Send reset code'}
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center">Enter Reset Code</h2>
            <Formik
              initialValues={confirmResetInitialValues}
              validationSchema={confirmResetValidationSchema}
              onSubmit={handleConfirm}
            >
              {({ isSubmitting }) => (
                <Form className="flex flex-col gap-4">
                  <Input
                    name="code"
                    labelText="Verification Code"
                    type="text"
                    placeholder="Enter verification code"
                  />

                  <Input
                    name="newPassword"
                    labelText="New Password"
                    type="password"
                    placeholder="Enter new password"
                  />

                  <Input
                    name="confirmPassword"
                    labelText="Confirm Password"
                    type="password"
                    placeholder="Confirm new password"
                  />

                  {error && <div className="text-red-600 text-sm text-center">{error}</div>}
                  {info && <div className="text-green-600 text-sm text-center">{info}</div>}

                  <Button
                    type="submit"
                    disabled={confirming || isSubmitting}
                    variant="primary"
                    className="!bg-green-600 !text-white !py-2 !rounded hover:!bg-green-700 !transition"
                  >
                    {confirming ? 'Updating...' : 'Update password'}
                  </Button>
                </Form>
              )}
            </Formik>
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

