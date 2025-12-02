import { FC } from 'react'
import { FieldMetaProps } from 'formik'

interface ErrorMessageProps {
  meta: FieldMetaProps<any>
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ meta }) => {
  if (meta.touched && meta.error) {
    return (
      <div className="text-red-600 text-sm mt-1">
        {meta.error}
      </div>
    )
  }
  return null
}

