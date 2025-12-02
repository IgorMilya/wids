import { object } from 'yup'
import { validationUser } from 'utils/validation'

export const initialValues = {
  email: '',
  password: '',
}

export const validationSchema = object().shape({
  email: validationUser.email(true),
  password: validationUser.password(true),
})

