export type WeatherIconName = 'sun' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' | 'unknown';

export function getWeatherCondition(code: number): { label: string; icon: WeatherIconName } {
  if (code === 0) return { label: 'Céu limpo', icon: 'sun' };
  if (code === 1 || code === 2) return { label: 'Parcialmente nublado', icon: 'cloud' };
  if (code === 3) return { label: 'Nublado', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Nevoeiro', icon: 'fog' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Garoa', icon: 'rain' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Chuva', icon: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Neve', icon: 'snow' };
  if ([95, 96, 99].includes(code)) return { label: 'Trovoadas', icon: 'storm' };
  return { label: 'Condição não disponível', icon: 'unknown' };
}
