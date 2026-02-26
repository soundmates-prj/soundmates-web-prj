import { Toaster } from 'sonner';
import './toast.css';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'custom-toast',
          title: 'custom-toast-title',
          description: 'custom-toast-description',
          actionButton: 'custom-toast-action',
          cancelButton: 'custom-toast-cancel',
          closeButton: 'custom-toast-close',
          success: 'custom-toast-success',
          error: 'custom-toast-error',
          warning: 'custom-toast-warning',
          info: 'custom-toast-info',
        },
      }}
    />
  );
}
