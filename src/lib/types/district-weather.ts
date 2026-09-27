export type DistrictPeriod = {
	startTime: string;
	endTime: string;
	weather: string | null;
	temperature: [number, number] | null;
	apparentTemperature: [number, number] | null;
	rainProbability: number | null;
};

export type DistrictForecast = {
	name: string;
	latitude: number;
	longitude: number;
	periods: DistrictPeriod[];
};

export type DistrictWeather = {
	city: string;
	locations: DistrictForecast[];
};

export type DistrictWeatherPayload = {
	data: DistrictWeather;
	updatedAt: string;
	stale: boolean;
};
