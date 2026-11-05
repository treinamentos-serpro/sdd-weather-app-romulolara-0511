import { formatForecastDate } from '../lib/date';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { TemperatureUnit, WeatherData } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface CurrentWeatherProps {
  data: WeatherData;
  unit: TemperatureUnit;
}

export default function CurrentWeather({ data, unit }: CurrentWeatherProps) {
  const condition = getWeatherCondition(data.current.weatherCode);
  const date = data.current.time.split('T')[0];

  return (
    <section
      aria-labelledby="current-title"
      className="glass-panel relative overflow-hidden p-6 sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">
            Clima atual
          </p>
          <h2 id="current-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {data.city.name}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {[data.city.region, data.city.country].filter(Boolean).join(', ')}
          </p>
          <p className="mt-5 text-sm text-slate-400">
            <time dateTime={data.current.time}>
              {formatForecastDate(date)} · {data.current.time.slice(11, 16)}
            </time>{' '}
            · horário local ({data.timezone})
          </p>
        </div>
        <div className="flex items-center gap-5 sm:gap-8">
          <WeatherIcon
            name={condition.icon}
            className="h-20 w-20 shrink-0 text-slate-200 sm:h-28 sm:w-28"
          />
          <div>
            <p className="text-5xl font-semibold tracking-tighter sm:text-6xl">
              {formatTemperature(data.current.temperatureC, unit)}
            </p>
            <p className="mt-3 max-w-48 text-sm text-slate-300">{condition.label}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
