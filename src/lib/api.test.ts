import { describe, it, expect, vi } from 'vitest';

vi.mock('axios');
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_TOKEN: 'TEST_TOKEN' }
}));

import axios from 'axios';
import { fetchWeatherData } from './api';

const mockedAxios = vi.mocked(axios);

describe('fetchWeatherData', () => {
	it('calls API with token and returns data', async () => {
		const mockData = { foo: 'bar' };
		mockedAxios.get.mockResolvedValue({ data: mockData });

		const result = await fetchWeatherData();

		expect(mockedAxios.get).toHaveBeenCalledWith(
			'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001',
			{ params: { Authorization: 'TEST_TOKEN' } }
		);
		expect(result).toEqual({ data: mockData });
	});

	it('logs and rethrows errors', async () => {
		const error = new Error('Network error');
		mockedAxios.get.mockRejectedValue(error);
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		await expect(fetchWeatherData()).rejects.toThrow(error);
		expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching weather data:', error);

		consoleErrorSpy.mockRestore();
	});
});
