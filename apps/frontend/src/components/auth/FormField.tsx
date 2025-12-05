import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChangeEvent } from "react"

interface FormFieldProps {
  id: string
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  helperText?: string
}

export function FormField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  helperText
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {helperText && (
        <p className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}
