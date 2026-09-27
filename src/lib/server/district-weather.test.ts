import { describe, expect, it, vi } from 'vitest';
import source from '../../../tests/fixtures/district-upstream.json';
import {
	createDistrictWeatherService,
	districtDataset,
	parseDistrictWeather
} from './district-weather';

const fixture = () => structuredClone(source);

describe('district forecast normalization', () => {
	it('should align hourly temperatures with three-hour weather periods and preserve zero rain', () => {
		// Arrange
		const target = parseDistrictWeather;

		// Act
		const result = target(fixture(), '臺北市');

		// Assert
		expect(result.city).toBe('臺北市');
		expect(result.locations[0]).toMatchObject({
			name: '松山區',
			latitude: 25.051608,
			longitude: 121.568983
		});
		expect(result.locations[0].periods[0]).toEqual({
			startTime: '2026-09-26T12:00:00+08:00',
			endTime: '2026-09-26T15:00:00+08:00',
			weather: '晴',
			temperature: [33, 34],
			apparentTemperature: [36, 36],
			rainProbability: 0
		});
		expect(result.locations.map((location) => location.name)).toEqual(['松山區', '內湖區']);
	});

	it('should keep missing and sentinel measurements empty rather than inventing weather', () => {
		// Arrange
		const input = fixture();
		const elements = input.records.Locations[0].Location[0].WeatherElement;
		elements[0].Time.forEach(
			(time) => (time.ElementValue = [{ Temperature: '-99' }] as typeof time.ElementValue)
		);
		elements.splice(1, 2);
		const target = parseDistrictWeather;

		// Act
		const result = target(input, '臺北市');

		// Assert
		expect(result.locations[0].periods[0]).toMatchObject({
			temperature: null,
			apparentTemperature: null,
			rainProbability: null
		});
	});

	it('should reject mismatched cities, datasets and malformed coordinates', () => {
		// Arrange
		const target = parseDistrictWeather;
		const badCoordinates = fixture();
		badCoordinates.records.Locations[0].Location[0].Latitude = '';

		// Act / Assert
		expect(() => target(source, '臺中市')).toThrow('Invalid district weather');
		expect(() => target({ ...source, records: { Locations: [] } }, '臺北市')).toThrow(
			'Invalid district locations'
		);
		expect(() => target(badCoordinates, '臺北市')).toThrow('Invalid coordinates');
		expect(districtDataset('釣魚臺')).toBeUndefined();
	});
});

describe('district weather service', () => {
	it('should share concurrent requests and keep city caches separate', async () => {
		// Arrange
		const taichung = fixture();
		taichung.result.resource_id = 'F-D0047-073';
		taichung.records.Locations[0].LocationsName = '臺中市';
		const mockFetch = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json(source))
			.mockResolvedValueOnce(Response.json(taichung));
		const target = createDistrictWeatherService({
			getToken: () => 'private-test-token',
			fetch: mockFetch
		});

		// Act
		const [first, second] = await Promise.all([target('臺北市'), target('臺北市')]);
		const other = await target('臺中市');
		const cached = await target('臺北市');

		// Assert
		expect(first).toEqual(second);
		expect(cached).toEqual(first);
		expect(other.data.city).toBe('臺中市');
		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(String(mockFetch.mock.calls[0][0])).toContain('/F-D0047-061?');
		expect(String(mockFetch.mock.calls[1][0])).toContain('/F-D0047-073?');
		expect(JSON.stringify(first)).not.toContain('private-test-token');
	});

	it('should use stale district data on failure and expire it after thirty minutes', async () => {
		// Arrange
		let now = 0;
		const mockFetch = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(Response.json(source))
			.mockRejectedValue(new Error('upstream'));
		const target = createDistrictWeatherService({
			getToken: () => 'test',
			fetch: mockFetch,
			now: () => now
		});
		const first = await target('臺北市');

		// Act / Assert
		now = 5 * 60_000;
		expect(await target('臺北市')).toEqual({ ...first, stale: true });
		now = 30 * 60_000;
		await expect(target('臺北市')).rejects.toThrow('天氣資料暫時無法取得');
	});

	it('should reject unsupported cities before requesting upstream data', () => {
		// Arrange
		const mockFetch = vi.fn<typeof fetch>();
		const target = createDistrictWeatherService({ getToken: () => 'test', fetch: mockFetch });

		// Act / Assert
		expect(() => target('https://example.com')).toThrow('Unsupported city');
		expect(mockFetch).not.toHaveBeenCalled();
	});
});
