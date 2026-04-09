import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './toast.css';
import { useTheme } from '../../context/ThemeContext';

export function ToastProvider() {
  const { mode } = useTheme();
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme={mode}
      toastClassName="custom-toast"
    />
  );
}
