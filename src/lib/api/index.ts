import type { WeatherResponse } from '@/types/weatherType';

export type WeatherPayload = {
	data: WeatherResponse;
	updatedAt: string;
	stale: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isWeatherResponse(value: unknown): value is WeatherResponse {
	if (!isRecord(value) || value.success !== 'true' || !isRecord(value.records)) return false;
	if (
		!isRecord(value.result) ||
		value.result.resource_id !== 'F-C0032-001' ||
		!Array.isArray(value.result.fields) ||
		!value.result.fields.every(
			(field) => isRecord(field) && typeof field.id === 'string' && typeof field.type === 'string'
		) ||
		value.records.datasetDescription !== '三十六小時天氣預報'
	)
		return false;
	const locations = value.records.location;
	return (
		Array.isArray(locations) &&
		locations.length > 0 &&
		locations.every(
			(location) =>
				isRecord(location) &&
				typeof location.locationName === 'string' &&
				location.locationName.length > 0 &&
				Array.isArray(location.weatherElement) &&
				location.weatherElement.length > 0 &&
				location.weatherElement.every(
					(element) =>
						isRecord(element) &&
						['Wx', 'PoP', 'MinT', 'MaxT', 'CI'].includes(String(element.elementName)) &&
						Array.isArray(element.time) &&
						element.time.length > 0 &&
						element.time.every(
							(time) =>
								isRecord(time) &&
								typeof time.startTime === 'string' &&
								typeof time.endTime === 'string' &&
								Number.isFinite(Date.parse(time.startTime.replace(' ', 'T') + '+08:00')) &&
								Number.isFinite(Date.parse(time.endTime.replace(' ', 'T') + '+08:00')) &&
								isRecord(time.parameter) &&
								typeof time.parameter.parameterName === 'string' &&
								(element.elementName !== 'Wx' ||
									typeof time.parameter.parameterValue === 'string') &&
								(!['PoP', 'MinT', 'MaxT'].includes(String(element.elementName)) ||
									typeof time.parameter.parameterUnit === 'string')
						)
				)
		)
	);
}

export async function fetchWeatherData(signal?: AbortSignal): Promise<WeatherPayload> {
	const controller = new AbortController();
	const abort = () => controller.abort();
	if (signal?.aborted) abort();
	else signal?.addEventListener('abort', abort, { once: true });
	const timer = setTimeout(abort, 12_000);
	let onAbort: (() => void) | undefined;

	try {
		const cancelled = new Promise<never>((_, reject) => {
			onAbort = () => reject(new DOMException('Request aborted', 'AbortError'));
			if (controller.signal.aborted) onAbort();
			else controller.signal.addEventListener('abort', onAbort, { once: true });
		});
		const request = (async () => {
			controller.signal.throwIfAborted();
			const response = await fetch('/api/weather', { signal: controller.signal });
			if (!response.ok) throw new Error('Weather unavailable');
			const result: WeatherPayload = await response.json();
			if (
				!isWeatherResponse(result?.data) ||
				typeof result.updatedAt !== 'string' ||
				!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(result.updatedAt) ||
				!Number.isFinite(Date.parse(result.updatedAt)) ||
				typeof result.stale !== 'boolean'
			) {
				throw new Error('Invalid weather response');
			}
			return result;
		})();
		return await Promise.race([request, cancelled]);
	} catch {
		if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
		throw new Error('天氣資料暫時無法取得，請稍後重試。');
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', abort);
		if (onAbort) controller.signal.removeEventListener('abort', onAbort);
	}
}
