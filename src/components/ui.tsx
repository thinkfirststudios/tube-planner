import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-surface border-2 border-ink active:opacity-80',
  secondary: 'bg-surface text-ink border-2 border-ink active:bg-ground',
  quiet: 'bg-transparent text-ink border-2 border-transparent underline underline-offset-4 active:bg-rule/40',
  danger: 'bg-surface text-blood border-2 border-blood active:bg-ground',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** 60px primary tap target; otherwise 44px */
  big?: boolean;
}

export function Button({ variant = 'secondary', big = false, className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 text-label disabled:opacity-40 ${
        big ? 'min-h-primary text-[17px]' : 'min-h-tap'
      } ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}

interface StepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  big?: boolean;
}

export function Stepper({ value, onChange, min = 0, max = 20, label, big = false }: StepperProps) {
  const size = big ? 'h-primary w-[52px] text-[28px]' : 'h-tap w-tap text-[22px]';
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <button
        type="button"
        className={`${size} rounded-xl border-2 border-ink bg-surface leading-none disabled:opacity-30`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`One fewer ${label}`}
      >
        −
      </button>
      <output className={`${big ? 'min-w-10 text-[28px]' : 'min-w-9 text-[20px]'} text-center font-bold`} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={`${size} rounded-xl border-2 border-ink bg-surface leading-none disabled:opacity-30`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`One more ${label}`}
      >
        +
      </button>
    </div>
  );
}

/** Bottom sheet dialog. Uses <dialog> so focus and Escape are handled natively. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-2xl bg-surface p-0 text-ink backdrop:bg-ink/40 md:m-auto md:max-w-lg md:rounded-2xl"
      aria-label={title}
    >
      <div className="pb-safe px-4 pt-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="font-display text-section">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-tap min-w-tap rounded-xl text-[24px]" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function ScreenHeader({ title, subtitle, back, right }: { title: string; subtitle?: ReactNode; back?: ReactNode; right?: ReactNode }) {
  return (
    <header className="px-4 pt-4 pb-3">
      {back}
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-display">{title}</h1>
        {right}
      </div>
      {subtitle && <div className="mt-1 text-body text-ink-2">{subtitle}</div>}
    </header>
  );
}

export function Warning({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-xl border-2 border-blood bg-surface p-3 text-body">
      <span aria-hidden="true" className="font-bold text-blood">
        !
      </span>
      <div>{children}</div>
    </div>
  );
}
