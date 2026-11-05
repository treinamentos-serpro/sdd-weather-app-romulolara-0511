export function formatForecastDate(date: string): string {
  // Datas sem horário representam o calendário da cidade, não o fuso do dispositivo.
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
