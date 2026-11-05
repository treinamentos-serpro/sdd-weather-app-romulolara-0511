import type { WeatherIconName } from '../lib/weatherCodes';

interface WeatherIconProps {
  name: WeatherIconName;
  className?: string;
}

export default function WeatherIcon({ name, className = 'h-12 w-12' }: WeatherIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {(name === 'sun' || name === 'cloud') && (
        <g className="text-sun">
          <circle
            cx={name === 'cloud' ? 25 : 32}
            cy={name === 'cloud' ? 24 : 32}
            r="11"
            fill="currentColor"
            fillOpacity=".15"
          />
          {name === 'sun' ? (
            <path d="M32 6v6m0 40v6M6 32h6m40 0h6M14 14l4 4m28 28 4 4M14 50l4-4m28-28 4-4" />
          ) : (
            <path d="M25 5v4M6 24h4M11 10l3 3m25-3-3 3" />
          )}
        </g>
      )}
      {['cloud', 'rain', 'snow', 'storm', 'fog'].includes(name) && (
        <path
          d="M18 45a10 10 0 0 1-1-20 15 15 0 0 1 28-2 11 11 0 1 1 3 22Z"
          fill="currentColor"
          fillOpacity=".12"
        />
      )}
      {name === 'rain' && <path d="m23 51-3 6m14-6-3 6m14-6-3 6" className="text-accent-400" />}
      {name === 'storm' && <path d="m35 40-9 12h10l-5 10" className="text-sun" />}
      {name === 'snow' && <path d="M24 51v9m-4-7 8 5m0-5-8 5m22-7v9m-4-7 8 5m0-5-8 5" />}
      {name === 'fog' && <path d="M12 52h40M18 59h28" />}
      {name === 'unknown' && <path d="M24 23a8 8 0 1 1 12 7c-4 2-4 5-4 8m0 9v1" />}
    </svg>
  );
}
