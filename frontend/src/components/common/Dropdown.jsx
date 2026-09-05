import { ChevronDown } from "lucide-react";
import { Children, useEffect, useId, useRef, useState } from "react";

function readOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!child || typeof child !== "object" || !child.props) return [];
    return [
      {
        value: child.props.value ?? child.props.children,
        label: child.props.children,
        disabled: child.props.disabled,
      },
    ];
  });
}

export default function Dropdown({
  label,
  value = "",
  onChange,
  children,
  placeholder = "Select an option",
  disabled = false,
  error = "",
  className = "",
  icon,
  name,
  id,
  ...props
}) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const menuId = `${controlId}-menu`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const options = readOptions(children);
  const selected = options.find(
    (option) => String(option.value) === String(value),
  );
  const selectOption = (option) => {
    if (disabled || option.disabled) return;
    onChange?.({ target: { name, value: option.value } });
    setOpen(false);
  };

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleKeyDown = (event) => {
    if (disabled) return;
    const enabled = options.filter((option) => !option.disabled);
    if (!enabled.length) return;
    const currentIndex = enabled.findIndex(
      (option) => String(option.value) === String(value),
    );
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key))
      event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      if (!open) setOpen(true);
      else if (enabled[currentIndex >= 0 ? currentIndex : 0])
        selectOption(enabled[currentIndex >= 0 ? currentIndex : 0]);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      if (!open) {
        setOpen(true);
        return;
      }
      selectOption(enabled[(currentIndex + 1) % enabled.length]);
      return;
    }
    if (event.key === "ArrowUp") {
      if (!open) {
        setOpen(true);
        return;
      }
      selectOption(
        enabled[(currentIndex - 1 + enabled.length) % enabled.length],
      );
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      selectOption(enabled[0]);
    }
    if (event.key === "End") {
      event.preventDefault();
      selectOption(enabled[enabled.length - 1]);
    }
  };

  return (
    <div
      className={`relative flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-slate-600 ${className}`}
      ref={rootRef}
    >
      {label && (
        <label
          className="text-[13px] font-semibold text-slate-600"
          htmlFor={controlId}
        >
          {label}
        </label>
      )}
      <button
        id={controlId}
        className={`flex min-h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 text-left text-[13px] font-medium outline-none transition focus-visible:border-tech-blue focus-visible:ring-4 focus-visible:ring-tech-blue-soft hover:border-sky-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${error ? "border-red-400" : "border-slate-200"}`}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="listbox"
        aria-invalid={Boolean(error)}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {icon && <span className="inline-flex text-slate-400">{icon}</span>}
        <span
          className={selected ? "text-tech-ink" : "font-normal text-slate-400"}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={`ml-auto shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          size={17}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+7px)] z-30 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
          id={menuId}
          role="listbox"
          aria-label={label || placeholder}
        >
          {options.map((option) => (
            <button
              className={`flex min-h-9 w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition hover:bg-tech-blue-soft hover:text-tech-blue focus:bg-tech-blue-soft focus:text-tech-blue focus:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:text-slate-400 ${String(option.value) === String(value) ? "bg-tech-blue-soft font-semibold text-tech-blue" : "text-slate-600"}`}
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              disabled={option.disabled}
              key={String(option.value)}
              onClick={() => selectOption(option)}
            >
              {option.label}
              {String(option.value) === String(value) && (
                <span aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      {error && (
        <span className="text-xs font-normal text-red-600">{error}</span>
      )}
    </div>
  );
}
