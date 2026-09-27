import type {
	DistrictForecast,
	DistrictPeriod,
	DistrictWeather
} from '$lib/types/district-weather';
import { createCachedWeatherService, type WeatherServiceOptions } from './weather';

const datasetCities = [
	'宜蘭縣',
	'桃園市',
	'新竹縣',
	'苗栗縣',
	'彰化縣',
	'南投縣',
	'雲林縣',
	'嘉義縣',
	'屏東縣',
	'臺東縣',
	'花蓮縣',
	'澎湖縣',
	'基隆市',
	'新竹市',
	'嘉義市',
	'臺北市',
	'高雄市',
	'新北市',
	'臺中市',
	'臺南市',
	'連江縣',
	'金門縣'
];

export function districtDataset(city: string): string | undefined {
	const index = datasetCities.indexOf(city);
	return index < 0 ? undefined : `F-D0047-${String(index * 4 + 1).padStart(3, '0')}`;
}

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const timestamp = (value: unknown): value is string =>
	typeof value === 'string' &&
	/(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
	Number.isFinite(Date.parse(value));
const numeric = (value: unknown, min: number, max: number): number | null => {
	if (typeof value !== 'string' || value.trim() === '') return null;
	const result = Number(value);
	return Number.isFinite(result) && result >= min && result <= max ? result : null;
};

type TimeEntry = {
	DataTime?: string;
	StartTime?: string;
	EndTime?: string;
	ElementValue: RecordValue[];
};
function readTimes(elements: unknown[], name: string): TimeEntry[] {
	const element = elements.find((entry) => record(entry) && entry.ElementName === name);
	if (!record(element) || !Array.isArray(element.Time)) return [];
	return element.Time.filter(
		(time): time is TimeEntry =>
			record(time) &&
			Array.isArray(time.ElementValue) &&
			time.ElementValue.every(record) &&
			(timestamp(time.DataTime) ||
				(timestamp(time.StartTime) &&
					timestamp(time.EndTime) &&
					Date.parse(time.EndTime) > Date.parse(time.StartTime)))
	);
}

export function parseDistrictWeather(value: unknown, city: string): DistrictWeather {
	if (
		!record(value) ||
		value.success !== 'true' ||
		!record(value.result) ||
		value.result.resource_id !== districtDataset(city) ||
		!record(value.records) ||
		!Array.isArray(value.records.Locations)
	)
		throw new Error('Invalid district weather');
	const group = value.records.Locations.find((item) => record(item) && item.LocationsName === city);
	if (!record(group) || !Array.isArray(group.Location))
		throw new Error('Invalid district locations');
	const locations = group.Location.map((location): DistrictForecast => {
		if (
			!record(location) ||
			typeof location.LocationName !== 'string' ||
			!location.LocationName ||
			!Array.isArray(location.WeatherElement)
		)
			throw new Error('Invalid district');
		const latitude = numeric(location.Latitude, -90, 90);
		const longitude = numeric(location.Longitude, -180, 180);
		if (latitude === null || longitude === null) throw new Error('Invalid coordinates');
		const elements = location.WeatherElement;
		const temperatures = readTimes(elements, '溫度');
		const apparent = readTimes(elements, '體感溫度');
		const rain = readTimes(elements, '3小時降雨機率');
		const range = (
			times: TimeEntry[],
			field: string,
			start: number,
			end: number
		): [number, number] | null => {
			const values = times
				.filter(
					(time) =>
						time.DataTime && Date.parse(time.DataTime) >= start && Date.parse(time.DataTime) < end
				)
				.map((time) => numeric(time.ElementValue[0]?.[field], -80, 80))
				.filter((n): n is number => n !== null);
			return values.length ? [Math.min(...values), Math.max(...values)] : null;
		};
		const periods = readTimes(elements, '天氣現象')
			.filter((time) => time.StartTime && time.EndTime)
			.map((time): DistrictPeriod => {
				const startTime = time.StartTime!;
				const endTime = time.EndTime!;
				const start = Date.parse(startTime),
					end = Date.parse(endTime);
				const precipitation = rain.find(
					(entry) =>
						entry.StartTime &&
						entry.EndTime &&
						Date.parse(entry.StartTime) <= start &&
						Date.parse(entry.EndTime) >= end
				);
				const weather = time.ElementValue[0]?.Weather;
				return {
					startTime,
					endTime,
					weather:
						typeof weather === 'string' && weather.trim() && weather !== '-99' ? weather : null,
					temperature: range(temperatures, 'Temperature', start, end),
					apparentTemperature: range(apparent, 'ApparentTemperature', start, end),
					rainProbability: numeric(
						precipitation?.ElementValue[0]?.ProbabilityOfPrecipitation,
						0,
						100
					)
				};
			})
			.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
		return { name: location.LocationName, latitude, longitude, periods };
	});
	return { city, locations };
}

export function createDistrictWeatherService(options: WeatherServiceOptions) {
	const services = new Map<
		string,
		ReturnType<typeof createCachedWeatherService<DistrictWeather>>
	>();
	return (city: string) => {
		const dataset = districtDataset(city);
		if (!dataset) throw new Error('Unsupported city');
		let service = services.get(city);
		if (!service) {
			service = createCachedWeatherService(options, dataset, (data) =>
				parseDistrictWeather(data, city)
			);
			services.set(city, service);
		}
		return service();
	};
}
