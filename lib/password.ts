export interface PasswordStrength {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    minLength: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    symbol: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  const label = score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";

  return {
    score,
    label,
    checks
  };
}
