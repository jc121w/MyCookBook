import type { ReactNode } from "react";

// The shared frame for Sign in and Sign up: a centered card in the app's style
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-4 md:pt-10">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold">{title}</h1>
        <p className="mt-1 opacity-60">{subtitle}</p>
      </div>
      <div className="bg-base-200/60 border-base-300/70 flex flex-col gap-4 rounded-2xl border p-6">
        {children}
      </div>
      <p className="text-center text-sm opacity-70">{footer}</p>
    </div>
  );
}

// A labeled input with an icon, and its error underneath
export function AuthField({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="input w-full">
        <span className="opacity-50 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        {children}
      </span>
      {error && <span className="text-error text-xs">{error}</span>}
    </label>
  );
}
