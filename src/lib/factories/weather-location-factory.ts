import type {
	ParameterCI,
	ParameterMaxT,
	ParameterMinT,
	ParameterPoP,
	ParameterWx,
	WeatherLocation,
	WeatherTimeElement
} from '@/types/weatherType';

import { forecastTimestamp, formatForecastTime } from '../weather/freshness';

export const formatDateTime = formatForecastTime;

const factory = (location: WeatherLocation, now = -Infinity) => {
	const { locationName, weatherElement } = location;

	const timeElementsMap: { [key: string]: WeatherTimeElement } = {};

	weatherElement.forEach((element) => {
		element.time.forEach(({ startTime, endTime, parameter }) => {
			if (forecastTimestamp(endTime) <= now) return;
			const start = formatDateTime(startTime);
			const end = formatDateTime(endTime);
			const key = `${startTime}-${endTime}`;
			if (!timeElementsMap[key]) {
				timeElementsMap[key] = { startTime: start, endTime: end };
			}

			switch (element.elementName) {
				case 'Wx':
					timeElementsMap[key].Wx = parameter as ParameterWx;
					break;
				case 'PoP':
					timeElementsMap[key].PoP = parameter as ParameterPoP;
					break;
				case 'MinT':
					timeElementsMap[key].MinT = parameter as ParameterMinT;
					break;
				case 'CI':
					timeElementsMap[key].CI = parameter as ParameterCI;
					break;
				case 'MaxT':
					timeElementsMap[key].MaxT = parameter as ParameterMaxT;
					break;
			}
		});
	});

	return {
		locationName,
		timeElementsMap: Object.values(timeElementsMap)
	};
};

export default factory;
