import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import WeatherIcon from './components/WeatherIcon';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import useWeather from './hooks/useWeather';

export default function App() {
  const { state, unit, setUnit, searchCities, selectCity, retry } = useWeather();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-night-900 text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(ellipse_at_15%_0%,rgba(109,124,255,0.16),transparent_60%)]"
      />
      <a
        href="#main-content"
        className="sr-only z-20 rounded-lg bg-accent-600 p-3 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 py-6 sm:py-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <WeatherIcon name="cloud" className="h-8 w-8 text-slate-200" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Weather App</p>
              <p className="text-xs text-slate-400">Seu tempo, em um olhar.</p>
            </div>
          </div>
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>
        <main id="main-content" className="space-y-7 py-8 sm:space-y-9 sm:py-12">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">
              Um olhar para o céu
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              O clima para os seus planos.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Explore uma cidade e descubra o que os próximos dias reservam.
            </p>
          </div>
          <section aria-label="Buscar cidade" className="glass-panel p-4 sm:p-5">
            <SearchBar onSearch={searchCities} />
            <p id="search-hint" className="mt-3 text-xs leading-5 text-slate-400">
              Digite o nome de uma cidade e selecione a localização desejada.
            </p>
          </section>
          <div aria-live="polite" aria-atomic="false" className="space-y-8">
            {state.status === 'idle' && (
              <EmptyState
                title="Qual cidade vamos explorar?"
                message="Busque uma cidade para consultar o clima e a previsão dos próximos dias."
              />
            )}
            {state.status === 'searching' && <LoadingState message="Buscando cidades..." />}
            {state.status === 'loading' && (
              <LoadingState message={`Carregando o clima de ${state.city.name}...`} />
            )}
            {state.status === 'results' && (
              <CityResults cities={state.cities} onSelect={selectCity} />
            )}
            {state.status === 'error' && <ErrorState message={state.message} onRetry={retry} />}
            {state.status === 'success' && (
              <>
                <CurrentWeather data={state.data} unit={unit} />
                <ForecastList forecast={state.data.forecast} unit={unit} />
              </>
            )}
          </div>
        </main>
        <footer className="flex flex-col gap-2 border-t border-white/10 py-6 text-xs leading-5 text-slate-400 sm:flex-row sm:justify-between">
          <p>Weather App · Feito para acompanhar seus dias.</p>
          <a href="https://open-meteo.com/" className="hover:text-white">
            Dados meteorológicos: Open-Meteo
          </a>
        </footer>
      </div>
    </div>
  );
}
