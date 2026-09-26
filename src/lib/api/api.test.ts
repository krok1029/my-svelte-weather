import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fixture from '../../../tests/fixtures/weather.json';
import { fetchWeatherData as target } from './index';

const payload = { data: fixture, updatedAt: '2026-09-26T04:00:00.000Z', stale: false };
const message = '天氣資料暫時無法取得，請稍後重試。';

describe('fetchWeatherData', () => {
	let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>;

	beforeEach(() => {
		mockFetch = vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload));
		vi.stubGlobal('fetch', mockFetch);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('should request the local endpoint and preserve cache metadata', async () => {
		// Act
		const result = await target();

		// Assert
		expect(result).toEqual(payload);
		expect(mockFetch).toHaveBeenCalledExactlyOnceWith('/api/weather', {
			signal: expect.any(AbortSignal)
		});
	});

	it('should preserve stale cache metadata', async () => {
		// Arrange
		mockFetch.mockResolvedValue(Response.json({ ...payload, stale: true }));

		// Act / Assert
		expect(await target()).toEqual({ ...payload, stale: true });
	});

	it('should sanitize HTTP errors without exposing the response body', async () => {
		// Arrange
		mockFetch.mockResolvedValue(new Response('secret-token', { status: 503 }));

		// Act / Assert
		await expect(target()).rejects.toThrow(new Error(message));
	});

	it.each([null, {}, { ...payload, updatedAt: 'invalid' }, { ...payload, stale: undefined }])(
		'should reject a malformed payload (%j)',
		async (invalid) => {
			// Arrange
			mockFetch.mockResolvedValue(Response.json(invalid));

			// Act / Assert
			await expect(target()).rejects.toThrow(new Error(message));
		}
	);

	it('should propagate caller cancellation and abort the in-flight request', async () => {
		// Arrange
		const controller = new AbortController();
		mockFetch.mockImplementation(() => new Promise(() => {}));
		const result = expect(target(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });

		// Act
		controller.abort();

		// Assert
		await result;
		expect(mockFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
	});

	it('should avoid issuing a request when the caller already cancelled', async () => {
		// Arrange
		const controller = new AbortController();
		controller.abort();

		// Act / Assert
		await expect(target(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('should bound a stalled request and clear its timeout', async () => {
		// Arrange
		vi.useFakeTimers();
		mockFetch.mockImplementation(() => new Promise(() => {}));
		const result = expect(target()).rejects.toThrow(new Error(message));

		// Act
		await vi.advanceTimersByTimeAsync(12_000);

		// Assert
		await result;
		expect(mockFetch.mock.calls[0][1]?.signal?.aborted).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
	});
});
