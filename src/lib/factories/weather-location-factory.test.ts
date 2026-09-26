import { describe, it, expect } from 'vitest';
import factory, { formatDateTime } from './weather-location-factory';
import type { WeatherLocation } from '@/types/weatherType';
import weatherJson from '../../../tests/fixtures/weather.json';

const target = factory;
const makeLocation = () => structuredClone(weatherJson.records.location[0]) as WeatherLocation;

describe('formatDateTime', () => {
	it('formats datetime into MM/DD HH:mm', () => {
		// Arrange
		const input = '2024-07-20 12:34:00';
		// Act
		const result = formatDateTime(input);
		// Assert
		expect(result).toBe('07/20 12:34');
	});
});

describe('weather location factory', () => {
	it('groups every CWA element into the matching forecast period', () => {
		// Arrange
		const location = makeLocation();
		// Act
		const result = target(location);
		// Assert
		expect(result.locationName).toBe('臺北市');
		expect(result.timeElementsMap).toEqual([
			{
				startTime: '09/26 12:00',
				endTime: '09/26 18:00',
				Wx: { parameterName: '晴時多雲', parameterValue: '2' },
				PoP: { parameterName: '20', parameterUnit: '百分比' },
				MinT: { parameterName: '25', parameterUnit: 'C' },
				MaxT: { parameterName: '30', parameterUnit: 'C' },
				CI: { parameterName: '舒適' }
			},
			{
				startTime: '09/26 18:00',
				endTime: '09/27 06:00',
				Wx: { parameterName: '晴時多雲', parameterValue: '2' },
				PoP: { parameterName: '0', parameterUnit: '百分比' },
				MinT: { parameterName: '25', parameterUnit: 'C' },
				MaxT: { parameterName: '30', parameterUnit: 'C' },
				CI: { parameterName: '舒適' }
			},
			{
				startTime: '09/27 06:00',
				endTime: '09/27 18:00',
				Wx: { parameterName: '晴時多雲', parameterValue: '2' },
				PoP: { parameterName: '60', parameterUnit: '百分比' },
				MinT: { parameterName: '25', parameterUnit: 'C' },
				MaxT: { parameterName: '30', parameterUnit: 'C' },
				CI: { parameterName: '舒適' }
			}
		]);
	});

	it('keeps missing PoP absent instead of fabricating a zero probability', () => {
		// Arrange
		const location = makeLocation();
		location.weatherElement = location.weatherElement.filter(
			(element) => element.elementName !== 'PoP'
		);
		// Act
		const result = target(location);
		// Assert
		expect(result.timeElementsMap).toHaveLength(3);
		expect(result.timeElementsMap.map((period) => period.PoP)).toEqual([
			undefined,
			undefined,
			undefined
		]);
		expect(result.timeElementsMap[0].Wx).toEqual({
			parameterName: '晴時多雲',
			parameterValue: '2'
		});
	});

	it('returns no periods when the city has no weather elements', () => {
		// Arrange
		const location: WeatherLocation = { locationName: '臺北市', weatherElement: [] };
		// Act
		const result = target(location);
		// Assert
		expect(result).toEqual({ locationName: '臺北市', timeElementsMap: [] });
	});
});
