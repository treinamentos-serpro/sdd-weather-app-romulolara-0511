import type { City, WeatherData } from '../../src/types/weather';

export function geocodingResponse(cities: City[]) {
  return {
    results: cities.map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      country_code: city.countryCode,
      admin1: city.region,
      latitude: city.latitude,
      longitude: city.longitude,
    })),
  };
}

export function forecastResponse(data: WeatherData) {
  return {
    timezone: data.timezone,
    current: {
      time: data.current.time,
      temperature_2m: data.current.temperatureC,
      weather_code: data.current.weatherCode,
    },
    daily: {
      time: data.forecast.map((day) => day.date),
      weather_code: data.forecast.map((day) => day.weatherCode),
      temperature_2m_min: data.forecast.map((day) => day.minTemperatureC),
      temperature_2m_max: data.forecast.map((day) => day.maxTemperatureC),
    },
  };
}
