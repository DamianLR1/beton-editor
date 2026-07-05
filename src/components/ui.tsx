import { type ReactNode, useState } from 'react';

export function Section({
  title,
  eyebrow,
  children,
  defaultOpen = true,
  count,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-line rounded-lg bg-panel/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-panel-raised/60 transition-colors text-left"
        type="button"
      >
        <div>
          {eyebrow && (
            <div className="text-[11px] uppercase tracking-wider text-copper font-mono mb-0.5">
              {eyebrow}
            </div>
          )}
          <div className="font-medium text-ink flex items-center gap-2">
            {title}
            {count != null && (
              <span className="text-xs text-ink-faint font-mono">({count})</span>
            )}
          </div>
        </div>
        <span
          className={`text-ink-dim transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          ›
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-line-soft">{children}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block mb-3">
      <div className="text-xs text-ink-dim mb-1 flex items-baseline gap-2">
        <span>{label}</span>
        {hint && <span className="text-ink-faint text-[11px]">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full ${props.className ?? ''}`} />;
}

export function NumberInput({
  value,
  onChange,
  ...rest
}: {
  value: number | null;
  onChange: (v: number | null) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className={`w-full ${rest.className ?? ''}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 2} className={`w-full ${props.className ?? ''}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none py-1">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
          checked ? 'bg-emerald' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-ink transition-all ${
            checked ? 'left-4.5' : 'left-0.5'
          }`}
        />
      </button>
      <span className="text-sm text-ink-dim">{label}</span>
    </label>
  );
}

export function Button({
  children,
  variant = 'default',
  ...rest
}: {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    default: 'bg-panel-raised border border-line text-ink hover:border-ink-faint',
    primary: 'bg-copper text-void font-medium hover:bg-copper/90 border border-copper',
    danger: 'bg-transparent border border-redstone/40 text-redstone hover:bg-redstone/10',
    ghost: 'bg-transparent border border-transparent text-ink-dim hover:text-ink',
  };
  return (
    <button
      {...rest}
      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${styles[variant]} ${rest.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function TagListEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  function add() {
    if (!draft.trim()) return;
    onChange([...values, draft.trim()]);
    setDraft('');
  }
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button variant="default" onClick={add} type="button">
          + Agregar
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-panel-raised border border-line rounded-full px-2.5 py-1 text-xs font-mono text-ink-dim"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="text-ink-faint hover:text-redstone"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-sm text-ink-faint italic py-6 text-center border border-dashed border-line rounded-lg">
      {message}
    </div>
  );
}
