import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createWeatherService, WEATHER_UNAVAILABLE } from '$lib/server/weather';

const getWeather = createWeatherService({ getToken: () => env.CWA_API_TOKEN });

export async function GET() {
	try {
		return json(await getWeather(), { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		return json(
			{ message: WEATHER_UNAVAILABLE },
			{ status: 503, headers: { 'Cache-Control': 'no-store' } }
		);
	}
}
