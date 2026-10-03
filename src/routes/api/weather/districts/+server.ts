import { CWA_API_TOKEN } from '$app/env/private';
import { createDistrictWeatherService, districtDataset } from '#lib/server/district-weather.js';
import { WEATHER_UNAVAILABLE } from '#lib/server/weather.js';

const getDistrictWeather = createDistrictWeatherService({ getToken: () => CWA_API_TOKEN });

export async function GET({ url }: { url: URL }) {
	const city = url.searchParams.get('city') ?? '';
	const headers = { 'Cache-Control': 'no-store' };
	if (!districtDataset(city))
		return Response.json({ message: '此縣市暫無行政區預報。' }, { status: 400, headers });
	try {
		return Response.json(await getDistrictWeather(city), { headers });
	} catch {
		return Response.json({ message: WEATHER_UNAVAILABLE }, { status: 503, headers });
	}
}
