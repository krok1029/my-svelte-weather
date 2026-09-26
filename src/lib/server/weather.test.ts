import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../../tests/fixtures/weather.json';
import { createWeatherService, WEATHER_UNAVAILABLE } from './weather';

const start = Date.parse('2026-09-26T04:00:00Z');
const freshMs = 5 * 60_000;
const maxAgeMs = 30 * 60_000;

describe('weather service', () => {
	let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;
	let target: ReturnType<typeof createWeatherService>;
	let now: number;

	beforeEach(() => {
		now = start;
		mockFetch = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(fixture));
		target = createWeatherService({
			getToken: () => 'private-test-token',
			fetch: mockFetch,
			now: () => now
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('should return weather and keep the credential in the upstream request only', async () => {
		// Act
		const result = await target();

		// Assert
		expect(result).toEqual({
			data: fixture,
			updatedAt: new Date(start).toISOString(),
			stale: false
		});
		expect(mockFetch).toHaveBeenCalledExactlyOnceWith(
			new URL(
				'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=private-test-token'
			),
			{
				signal: expect.any(AbortSignal),
				headers: { Accept: 'application/json' },
				redirect: 'error'
			}
		);
		expect(JSON.stringify(result)).not.toContain('private-test-token');
	});

	it('should reuse a fresh entry and refresh at the exact five minute boundary', async () => {
		// Arrange
		const first = await target();
		now += freshMs - 1;

		// Act / Assert
		expect(await target()).toEqual(first);
		expect(mockFetch).toHaveBeenCalledTimes(1);
		now += 1;
		expect(await target()).toEqual({
			data: fixture,
			updatedAt: new Date(now).toISOString(),
			stale: false
		});
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('should share the upstream request between concurrent callers', async () => {
		// Arrange
		let resolve!: (value: Response) => void;
		mockFetch.mockImplementation(
			() =>
				new Promise((done) => {
					resolve = done;
				})
		);

		// Act
		const requests = [target(), target(), target()];
		resolve(Response.json(fixture));
		const results = await Promise.all(requests);

		// Assert
		expect(results).toEqual(
			Array(3).fill({ data: fixture, updatedAt: new Date(start).toISOString(), stale: false })
		);
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('should return stale data on upstream failure and reject it at thirty minutes', async () => {
		// Arrange
		const original = await target();
		mockFetch.mockRejectedValue(new Error('private-test-token in upstream error'));
		now += freshMs;

		// Act / Assert
		expect(await target()).toEqual({ ...original, stale: true });
		now = start + maxAgeMs - 1;
		expect(await target()).toEqual({ ...original, stale: true });
		now += 1;
		await expect(target()).rejects.toThrow(new Error(WEATHER_UNAVAILABLE));
		expect(mockFetch).toHaveBeenCalledTimes(4);
	});

	it('should clear a failed in-flight request so a retry can succeed', async () => {
		// Arrange
		mockFetch.mockRejectedValueOnce(new Error('private-test-token'));

		// Act / Assert
		await expect(target()).rejects.toThrow(new Error(WEATHER_UNAVAILABLE));
		expect(await target()).toEqual({
			data: fixture,
			updatedAt: new Date(start).toISOString(),
			stale: false
		});
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it.each([undefined, '', '   '])(
		'should fail safely without a configured token (%s)',
		async (token) => {
			// Arrange
			target = createWeatherService({ getToken: () => token, fetch: mockFetch });

			// Act / Assert
			await expect(target()).rejects.toThrow(new Error(WEATHER_UNAVAILABLE));
			expect(mockFetch).not.toHaveBeenCalled();
		}
	);

	it.each([
		null,
		{ ...fixture, success: 'false' },
		{ ...fixture, records: { location: [] } },
		{
			...fixture,
			records: {
				location: [
					{
						locationName: '臺北市',
						weatherElement: [{ elementName: 'PoP', time: [{ parameter: { parameterName: '20' } }] }]
					}
				]
			}
		}
	])('should reject malformed upstream data without caching it (%j)', async (invalid) => {
		// Arrange
		mockFetch.mockResolvedValueOnce(Response.json(invalid));

		// Act / Assert
		await expect(target()).rejects.toThrow(new Error(WEATHER_UNAVAILABLE));
		expect(await target()).toEqual({
			data: fixture,
			updatedAt: new Date(start).toISOString(),
			stale: false
		});
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it.each([401, 429, 500])('should sanitize upstream HTTP %i failures', async (status) => {
		// Arrange
		mockFetch.mockResolvedValue(new Response('private-test-token', { status }));

		// Act / Assert
		await expect(target()).rejects.toThrow(new Error(WEATHER_UNAVAILABLE));
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('should timeout and abort a hung upstream fetch', async () => {
		// Arrange
		vi.useFakeTimers();
		mockFetch.mockImplementation(() => new Promise(() => {}));
		const result = expect(target()).rejects.toThrow(new Error(WEATHER_UNAVAILABLE));

		// Act
		await vi.advanceTimersByTimeAsync(8_000);

		// Assert
		await result;
		expect(mockFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('should timeout a stalled response body and return stale data', async () => {
		// Arrange
		await target();
		now += freshMs;
		vi.useFakeTimers();
		mockFetch.mockResolvedValue(new Response(new ReadableStream()));
		const request = target();

		// Act
		await vi.advanceTimersByTimeAsync(8_000);

		// Assert
		expect(await request).toEqual({
			data: fixture,
			updatedAt: new Date(start).toISOString(),
			stale: true
		});
		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(mockFetch.mock.calls[1][1]?.signal?.aborted).toBe(true);
	});
});
