import { FC, PropsWithChildren, MouseEvent } from 'react'

interface ButtonProps extends PropsWithChildren {
  variant: 'primary' | 'secondary' | 'outline' | 'red',
  disabled?: boolean,
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void,
  type?: 'submit' | 'button',
}

const styleOfVariant = {
  primary: 'justify-center bg-white hover:bg-[#dbbfe3] focus:ring-2 focus:ring-[#dbbfe3] text-black',
  red: 'justify-center bg-error hover:bg-red-800 focus:ring-2 focus:ring-red-600 text-white',
  secondary: `justify-center bg-secondary hover:bg-purple-900 focus:ring-2 focus:ring-purple-500 text-white`,
  outline: 'justify-start font-medium',
}


const Button: FC<ButtonProps> = ({
                                   variant,
                                   children,
                                   onClick,
                                   disabled,
                                   type,
                                 }) => {

  const colorClasses = styleOfVariant[variant]
  return (
    <button
      className={`flex gap-4 items-center w-full small-laptop:w-auto  p-2.5  font-bold rounded-md focus:outline-none  ${colorClasses} relative ${disabled ? 'opacity-50 cursor-not-allowed focus:ring-0' : ''}`}
      onClick={onClick} disabled={disabled} type={type || 'button'}
    >
      {children}
    </button>
  )
}

export default Button