import { object, string } from 'yup'
import { validationUser } from 'utils/validation'

export const registerInitialValues = {
  email: '',
  password: '',
}

export const registerValidationSchema = object().shape({
  email: validationUser.email(true),
  password: validationUser.password(true),
})

export const verifyInitialValues = {
  code: '',
}

export const verifyValidationSchema = object().shape({
  code: string()
    .required('Verification code is required')
    .length(6, 'Verification code must be 6 digits')
    .matches(/^\d+$/, 'Verification code must contain only numbers'),
})

