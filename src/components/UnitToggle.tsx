import type { TemperatureUnit } from '../types/weather';

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex shrink-0 gap-1 rounded-xl border border-white/10 bg-night-900/60 p-1"
    >
      {(['celsius', 'fahrenheit'] as const).map((value) => (
        <button
          type="button"
          key={value}
          aria-label={value === 'celsius' ? 'Celsius' : 'Fahrenheit'}
          aria-pressed={unit === value}
          onClick={() => onChange(value)}
          className={`min-h-11 min-w-11 rounded-lg px-3 text-sm font-semibold transition motion-reduce:transition-none ${unit === value ? 'bg-accent-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10'}`}
        >
          {value === 'celsius' ? '°C' : '°F'}
        </button>
      ))}
    </div>
  );
}
