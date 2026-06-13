import toast, { Toaster } from 'react-hot-toast'

export { Toaster, toast }

export const showSuccess = (message: string) => toast.success(message)
export const showError = (message: string) => toast.error(message)
export const showLoading = (message: string) => toast.loading(message)
export const dismissToast = (toastId: string) => toast.dismiss(toastId)
