import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id={fieldId}
          ref={ref}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p
            id={`${fieldId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
