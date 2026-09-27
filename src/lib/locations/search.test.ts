import { describe, expect, it } from 'vitest';
import cities from '../../../static/taiwan_districts.json';
import { searchLocations } from './search';

describe('local location search', () => {
	it('finds a district without requiring its county first', () => {
		expect(searchLocations(cities, '內湖')).toEqual([{ city: '臺北市', district: '內湖區' }]);
		expect(searchLocations(cities, '松山')[0]).toEqual({ city: '臺北市', district: '松山區' });
	});
	it('normalizes 台 and whitespace for county and combined searches', () => {
		expect(searchLocations(cities, ' 台北 ')).toEqual(searchLocations(cities, '臺北'));
		expect(searchLocations(cities, ' 台北市 內湖 ')).toEqual([
			{ city: '臺北市', district: '內湖區' }
		]);
		expect(searchLocations(cities, '臺北市')[0]).toEqual({ city: '臺北市', district: null });
	});
	it('retains every county context for duplicate district names', () => {
		const results = searchLocations(cities, '中正區');
		expect(results).toContainEqual({ city: '臺北市', district: '中正區' });
		expect(results).toContainEqual({ city: '基隆市', district: '中正區' });
		expect(results).toHaveLength(2);
	});
	it('returns no suggestions for empty or unknown queries', () => {
		expect(searchLocations(cities, '  ')).toEqual([]);
		expect(searchLocations(cities, '不存在的地名')).toEqual([]);
		expect(searchLocations([], '臺北')).toEqual([]);
	});
});
