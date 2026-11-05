import type { City } from '../types/weather';
import EmptyState from './states/EmptyState';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

export default function CityResults({ cities, onSelect }: CityResultsProps) {
  if (cities.length === 0) {
    return (
      <EmptyState
        title="Nenhuma cidade encontrada"
        message="Tente outro nome ou confira a grafia da cidade."
      />
    );
  }
  return (
    <section aria-labelledby="results-title" className="glass-panel p-5 sm:p-8">
      <h2 id="results-title" className="mb-4 text-lg font-semibold">
        Selecione uma cidade
      </h2>
      <ul className="space-y-3">
        {cities.map((city) => (
          <li key={city.id}>
            <button
              type="button"
              onClick={() => onSelect(city)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
            >
              <span className="font-semibold">{city.name}</span>{' '}
              <span className="text-sm text-slate-300">
                {[city.region, city.country].filter(Boolean).join(', ')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
