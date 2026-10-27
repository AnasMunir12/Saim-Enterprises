"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & { className: string };

export function PasswordInput({ className, ...input }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input {...input} type={visible ? "text" : "password"} className={`password-input__control ${className}`} />
      <button
        type="button"
        className="password-input__toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
