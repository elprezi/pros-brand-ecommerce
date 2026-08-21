import React from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  const borderColors = {
    info: 'border-pros-sand text-pros-sand',
    success: 'border-green-500 text-green-400',
    error: 'border-red-500 text-red-400',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-black border px-5 py-3 text-xs uppercase tracking-wider shadow-2xl backdrop-blur-md ${borderColors[type]}`}
    >
      {message}
    </div>
  );
};
