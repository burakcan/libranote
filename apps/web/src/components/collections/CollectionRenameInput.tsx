import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

type CollectionRenameInputProps = {
  initialValue: string;
  onConfirm: (newTitle: string) => void;
  onCancel: () => void;
};

export function CollectionRenameInput({
  initialValue,
  onConfirm,
  onCancel,
}: CollectionRenameInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleConfirm = () => {
    if (value.trim() === "" || value.trim() === initialValue) {
      onCancel();
      return;
    }
    onConfirm(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <Input
      className="w-full text-sm h-8 mx-2 font-medium pl-6 border-none"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      autoFocus
      onBlur={handleConfirm}
      onFocus={(e) => e.target.select()}
    />
  );
}
