import type { WeatherResponse } from '../types/weatherType';
import { isWeatherResponse, type WeatherPayload } from '../api';

const API_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001';
export const WEATHER_UNAVAILABLE = '天氣資料暫時無法取得，請稍後重試。';

type WeatherServiceOptions = {
	getToken: () => string | undefined;
	fetch?: typeof globalThis.fetch;
	now?: () => number;
	timeoutMs?: number;
	freshMs?: number;
	maxAgeMs?: number;
};

export function createWeatherService({
	getToken,
	fetch: fetchUpstream = globalThis.fetch,
	now = Date.now,
	timeoutMs = 8_000,
	freshMs = 5 * 60_000,
	maxAgeMs = 30 * 60_000
}: WeatherServiceOptions) {
	let cache: { data: WeatherResponse; fetchedAt: number } | undefined;
	let pending: Promise<WeatherPayload> | undefined;

	const payload = (entry: NonNullable<typeof cache>, stale: boolean): WeatherPayload => ({
		data: entry.data,
		updatedAt: new Date(entry.fetchedAt).toISOString(),
		stale
	});

	async function refresh(token: string): Promise<WeatherPayload> {
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			const url = new URL(API_URL);
			url.searchParams.set('Authorization', token);
			const request = (async () => {
				const response = await fetchUpstream(url, {
					signal: controller.signal,
					headers: { Accept: 'application/json' },
					redirect: 'error'
				});
				if (!response.ok) throw new Error(WEATHER_UNAVAILABLE);
				const data: unknown = await response.json();
				if (!isWeatherResponse(data)) throw new Error(WEATHER_UNAVAILABLE);
				return data;
			})();
			const timeout = new Promise<never>((_, reject) => {
				timer = setTimeout(() => {
					controller.abort();
					reject(new Error(WEATHER_UNAVAILABLE));
				}, timeoutMs);
			});
			const data = await Promise.race([request, timeout]);
			cache = { data, fetchedAt: now() };
			return payload(cache, false);
		} catch {
			if (cache && now() - cache.fetchedAt < maxAgeMs) return payload(cache, true);
			throw new Error(WEATHER_UNAVAILABLE);
		} finally {
			clearTimeout(timer);
		}
	}

	return async function getWeather(): Promise<WeatherPayload> {
		const token = getToken()?.trim();
		if (!token) throw new Error(WEATHER_UNAVAILABLE);
		if (cache && now() - cache.fetchedAt < freshMs) return payload(cache, false);
		if (!pending) {
			pending = refresh(token).finally(() => {
				pending = undefined;
			});
		}
		return pending;
	};
}
