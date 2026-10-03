import { CWA_API_TOKEN } from '$app/env/private';
import { createWeatherService, WEATHER_UNAVAILABLE } from '#lib/server/weather.js';

const getWeather = createWeatherService({ getToken: () => CWA_API_TOKEN });

export async function GET() {
	try {
		return Response.json(await getWeather(), { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		return Response.json(
			{ message: WEATHER_UNAVAILABLE },
			{ status: 503, headers: { 'Cache-Control': 'no-store' } }
		);
	}
}
