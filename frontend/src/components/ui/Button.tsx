"use client";

import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary";
  round?: boolean;
}

export function Button({ variant = "primary", round, className, ...rest }: ButtonProps) {
  const classNames = [styles.button, styles[variant], round ? styles.round : "", className]
    .filter(Boolean)
    .join(" ");

  return <button type="button" className={classNames} {...rest} />;
}
