import type {
	ParameterCI,
	ParameterMaxT,
	ParameterMinT,
	ParameterPop,
	ParameterWx,
	WeatherLocation,
	WeatherTimeElement
} from '@/types/weatherType';

export function formatDateTime(datetime: string): string {
	const date = new Date(datetime);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${month}/${day} ${hours}:${minutes}`;
}

const factory = (location: WeatherLocation) => {
	const { locationName, weatherElement } = location;

	const timeElementsMap: { [key: string]: WeatherTimeElement } = {};

	weatherElement.forEach((element) => {
		element.time.forEach(({ startTime, endTime, parameter }) => {
			const start = formatDateTime(startTime);
			const end = formatDateTime(endTime);
			const key = `${start}-${end}`;
			if (!timeElementsMap[key]) {
				timeElementsMap[key] = { startTime: start, endTime: end };
			}

			switch (element.elementName) {
				case 'Wx':
					timeElementsMap[key].Wx = parameter as ParameterWx;
					break;
				case 'Pop':
					timeElementsMap[key].Pop = parameter as ParameterPop;
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
