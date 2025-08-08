import type { WeatherResponse } from '@/types/weatherType';
import axios from 'axios';

import { env } from '$env/dynamic/public';

const API_BASE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001';
const API_TOKEN = env.PUBLIC_API_TOKEN ?? '';
export const fetchWeatherData = async () => {
	try {
		const response = await axios.get<WeatherResponse>(API_BASE_URL, {
			params: {
				Authorization: API_TOKEN
			}
		});
		return { data: response.data };
	} catch (error) {
		console.error('Error fetching weather data:', error);
		throw error;
	}
};
