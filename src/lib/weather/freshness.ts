export const WEATHER_REFRESH_MS = 5 * 60_000;

export function forecastTimestamp(value: string): number {
	const normalized = value.replace(' ', 'T');
	return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(normalized) ? normalized : `${normalized}+08:00`);
}

const taipeiFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Asia/Taipei',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

export function formatForecastTime(value: string): string {
	const parts = taipeiFormatter.formatToParts(forecastTimestamp(value));
	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((entry) => entry.type === type)?.value;
	return `${part('month')}/${part('day')} ${part('hour')}:${part('minute')}`;
}

export function shouldRefreshWeather(
	now: number,
	lastAttempt: number | null,
	updatedAt: string | null | undefined,
	stale = false
): boolean {
	if (lastAttempt !== null && now - lastAttempt < WEATHER_REFRESH_MS) return false;
	return stale || !updatedAt || now - Date.parse(updatedAt) >= WEATHER_REFRESH_MS;
}
