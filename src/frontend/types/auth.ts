// Authentication and Form Types

import type { UseFormRegister, FieldValues } from 'react-hook-form';

/**
 * Sign up form data
 */
export interface SignUpFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword?: string;
}

/**
 * Sign in form data
 */
export interface SignInFormData {
  email: string;
  password: string;
}

/**
 * Auth form props
 */
export interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (data: SignInFormData | SignUpFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Form field props for reusable form components
 */
export interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  register: UseFormRegister<FieldValues>;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Password field props
 */
export interface PasswordFieldProps extends Omit<FormFieldProps, 'type'> {
  showPasswordToggle?: boolean;
}
