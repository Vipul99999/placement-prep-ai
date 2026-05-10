function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function requireEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOptionalEnv(name: string) {
  const value = readEnv(name);
  return value || undefined;
}
