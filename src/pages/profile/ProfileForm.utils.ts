import { object, string, ref } from 'yup'
import { validationUser } from 'utils/validation'

export const passwordChangeInitialValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export const passwordChangeValidationSchema = object().shape({
  currentPassword: string().required('Current password is required'),
  newPassword: validationUser.password(true),
  confirmPassword: string()
    .required('Please confirm your password')
    .oneOf([ref('newPassword')], 'Passwords must match'),
})

export const usernameChangeInitialValues = {
  username: '',
}

export const usernameChangeValidationSchema = object().shape({
  username: string()
    .required('Username is required')
    .min(2, 'Username must be at least 2 characters')
    .max(20, 'Username must be no more than 20 characters'),
})

