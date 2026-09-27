import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createDistrictWeatherService, districtDataset } from '$lib/server/district-weather';
import { WEATHER_UNAVAILABLE } from '$lib/server/weather';

const getDistrictWeather = createDistrictWeatherService({ getToken: () => env.CWA_API_TOKEN });

export async function GET({ url }: { url: URL }) {
	const city = url.searchParams.get('city') ?? '';
	const headers = { 'Cache-Control': 'no-store' };
	if (!districtDataset(city))
		return json({ message: '此縣市暫無行政區預報。' }, { status: 400, headers });
	try {
		return json(await getDistrictWeather(city), { headers });
	} catch {
		return json({ message: WEATHER_UNAVAILABLE }, { status: 503, headers });
	}
}
