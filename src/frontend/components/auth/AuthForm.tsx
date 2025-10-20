"use client";

import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

interface AuthFormProps {
  children: ReactNode;
  onSubmit: (data: any) => Promise<void>;
  form: UseFormReturn<any>;
  className?: string;
}

export function AuthForm({ children, onSubmit, form, className = "" }: AuthFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 bg-card p-8 rounded-2xl shadow-lg border ${className}`}>
      {children}
    </form>
  );
}

interface AuthInputProps {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  register: any;
  error?: string;
  className?: string;
}

export function AuthInput({ 
  id, 
  type, 
  label, 
  required = false, 
  placeholder,
  register, 
  error, 
  className = "" 
}: AuthInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register(id)}
        className={`w-full h-11 rounded-lg border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${className}`}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  label: string;
  required?: boolean;
  register: any;
  error?: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  helperText?: string;
  className?: string;
}

export function PasswordInput({ 
  id, 
  label, 
  required = false, 
  register, 
  error, 
  showPassword, 
  onTogglePassword,
  helperText,
  className = "" 
}: PasswordInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          {...register(id)}
          className={`w-full h-11 rounded-lg border border-input bg-background px-4 py-2 pr-12 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all ${className}`}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {helperText && (
        <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

interface AuthButtonProps {
  children: ReactNode;
  type?: "submit" | "button";
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export function AuthButton({ 
  children, 
  type = "submit", 
  variant = "default", 
  size = "lg", 
  disabled = false, 
  loading = false,
  onClick,
  className = "" 
}: AuthButtonProps) {
  const Button = require("@/components/ui/button").Button;
  
  return (
    <Button 
      type={type} 
      variant={variant} 
      size={size} 
      className={`w-full ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

interface GoogleOAuthButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function GoogleOAuthButton({ children, onClick, disabled = false, className = "" }: GoogleOAuthButtonProps) {
  return (
    <AuthButton
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {children}
    </AuthButton>
  );
}

interface AuthErrorDisplayProps {
  error: string | null;
  className?: string;
}

export function AuthErrorDisplay({ error, className = "" }: AuthErrorDisplayProps) {
  if (!error) return null;
  
  return (
    <div className={`rounded-md bg-destructive/15 p-3 text-sm text-destructive ${className}`}>
      {error}
    </div>
  );
}

interface AuthDividerProps {
  text?: string;
  className?: string;
}

export function AuthDivider({ text = "Or continue with", className = "" }: AuthDividerProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-3 text-muted-foreground font-medium">{text}</span>
      </div>
    </div>
  );
}
