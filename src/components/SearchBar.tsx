import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <form
      role="search"
      aria-label="Busca de cidades"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className="relative min-w-0 flex-1">
        <label htmlFor="city-search" className="sr-only">
          Nome da cidade
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-400"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          id="city-search"
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            onSearch(value);
          }}
          placeholder="Buscar uma cidade..."
          autoComplete="off"
          aria-describedby="search-hint"
          className="w-full rounded-2xl border border-white/10 bg-night-900/60 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-400"
        />
      </div>
    </form>
  );
}
