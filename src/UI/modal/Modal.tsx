import { FC, PropsWithChildren, SyntheticEvent } from 'react'
import { Icon } from 'assets'
import { Button } from 'UI'

interface ModalProps extends PropsWithChildren {
  isOpen: boolean
  title: string
  buttonText: string
  linkageToForm?: string
  onClose: () => void
  onConfirm: () => void
}

const Modal: FC<ModalProps> = ({
                                 isOpen,
                                 title,
                                 buttonText,
                                 onClose,
                                 children,
                                 onConfirm,
                               }) => {
  const handleClose = (e: SyntheticEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleConfirm=  (e: SyntheticEvent) => {
    handleClose(e)
    onConfirm()
  }
  return (
    <>
      {isOpen &&
        <div className="">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
          <div
            className="min-w-[90vw] small-laptop:min-w-[500px] max-w-[90vw] small-laptop:max-w-[600px] large-laptop:max-w-[700px] bg-white rounded-lg absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 p-5 small-laptop:p-[25px] normal-laptop:p-[30px] mx-4">
            <div className="flex justify-between items-center mb-[40px]">
              <h1 className="text-2xl font-bold">{title}</h1>
              <img className="cursor-pointer" onClick={handleClose} src={Icon.Cross} alt="Cross" />
            </div>
            <div className="max-h-[450px] overflow-x-auto mb-[30px]">
              {children}
            </div>
            <Button variant="secondary" onClick={handleConfirm}>{buttonText}</Button>
          </div>
        </div>
      }
    </>
  )
}

export default Modal