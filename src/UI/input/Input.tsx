import React, { FC } from 'react'
import { useField } from 'formik'
import { ErrorMessage } from '../error-message'

interface InputProps {
  name: string
  labelText?: string
  type?: 'text' | 'password' | 'email' | 'number'
  placeholder?: string
  disabled?: boolean
}

const Input: FC<InputProps> = ({ type, placeholder, name, labelText, disabled }) => {
  const [field, meta] = useField(name)
  const validationError = meta.touched && meta.error
  const errorStyles = validationError
    ? 'border-red-700 placeholder:text-red-700'
    : 'border-gray-300 placeholder:text-gray-400'

  return (
    <div className="flex flex-col">
      {labelText && (
        <label className="text-sm font-medium text-gray-700 mb-1">{labelText}</label>
      )}
      <input
        placeholder={placeholder}
        className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-secondary ${errorStyles} text-gray-900 bg-white w-full`}
        type={type || 'text'}
        {...field}
        disabled={disabled}
      />
      <ErrorMessage meta={meta} />
    </div>
  )
}

export default Input

