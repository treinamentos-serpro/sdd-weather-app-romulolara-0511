import type { ForecastDay, TemperatureUnit } from '../types/weather';
import ForecastDayCard from './ForecastDayCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: TemperatureUnit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  return (
    <section aria-labelledby="forecast-title">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="forecast-title" className="text-lg font-semibold">
          Previsão de 5 dias
        </h2>
        <p className="text-xs text-slate-400">Hoje e os próximos quatro dias no exemplo</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {forecast.map((day) => (
          <ForecastDayCard
            key={day.date}
            day={day}
            unit={unit}
            isToday={day.date === forecast[0]?.date}
          />
        ))}
      </div>
    </section>
  );
}
