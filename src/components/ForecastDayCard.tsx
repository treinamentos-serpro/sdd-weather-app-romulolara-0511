import { formatForecastDate } from '../lib/date';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, TemperatureUnit } from '../types/weather';
import WeatherIcon from './WeatherIcon';

interface ForecastDayCardProps {
  day: ForecastDay;
  unit: TemperatureUnit;
  isToday: boolean;
}

export default function ForecastDayCard({ day, unit, isToday }: ForecastDayCardProps) {
  const condition = getWeatherCondition(day.weatherCode);
  return (
    <article
      aria-label={`Previsão de ${formatForecastDate(day.date)}`}
      className={`glass-panel flex h-full flex-col items-center p-5 text-center ${isToday ? 'border-accent-400/40 bg-accent-500/10' : ''}`}
    >
      <p className={`mb-2 text-xs font-medium ${isToday ? 'text-accent-400' : 'text-slate-400'}`}>
        {isToday ? 'Hoje' : 'Previsão diária'}
      </p>
      <h3 className="text-sm font-semibold">
        <time dateTime={day.date}>{formatForecastDate(day.date)}</time>
      </h3>
      <WeatherIcon name={condition.icon} className="my-5 h-14 w-14 text-slate-200" />
      <p className="min-h-10 text-xs leading-5 text-slate-300">{condition.label}</p>
      <dl className="mt-4 flex w-full flex-wrap justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-sm">
        <div>
          <dt className="mb-1 text-xs text-slate-400">Máx.</dt>
          <dd className="font-semibold">{formatTemperature(day.maxTemperatureC, unit)}</dd>
        </div>
        <div>
          <dt className="mb-1 text-xs text-slate-400">Mín.</dt>
          <dd className="text-slate-300">{formatTemperature(day.minTemperatureC, unit)}</dd>
        </div>
      </dl>
    </article>
  );
}
