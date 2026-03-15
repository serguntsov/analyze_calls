import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`${styles.btn} ${variant === 'primary' ? styles.primary : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
