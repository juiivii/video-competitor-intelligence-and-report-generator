'use client';

interface InputProps {
  placeholder?: string;
  value?: string | number | null | undefined;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function Input({
  placeholder = '',
  value,
  onChange,
  disabled = false,
  error,
  className = '',
}: InputProps) {
  const safeValue =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={safeValue}
        onChange={handleChange}
        disabled={disabled}
        className={`
          w-full
          rounded-xl
          border border-gray-300
          bg-white
          px-4 py-3
          text-gray-900
          placeholder:text-gray-500
          focus:outline-none
          focus:ring-4
          focus:ring-blue-100
          focus:border-blue-500
          transition-all
          duration-200
          disabled:bg-gray-50
          disabled:text-gray-500
          disabled:cursor-not-allowed
          disabled:border-gray-200
          ${error ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : ''}
          ${className}
        `}
      />

      {error && (
        <p className="text-red-500 text-sm mt-2 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}