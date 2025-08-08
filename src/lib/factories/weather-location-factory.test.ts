import { describe, it, expect } from 'vitest';
import factory, { formatDateTime } from './weather-location-factory';
import type { WeatherLocation } from '@/types/weatherType';

describe('formatDateTime', () => {
        it('formats datetime into MM/DD HH:mm', () => {
                expect(formatDateTime('2024-07-20 12:34:00')).toBe('07/20 12:34');
        });
});

describe('weather location factory', () => {
        it('creates timeElementsMap grouped by formatted time', () => {
                const location: WeatherLocation = {
                        locationName: 'Test City',
                        weatherElement: [
                                {
                                        elementName: 'Wx',
                                        time: [
                                                {
                                                        startTime: '2024-07-20 12:00:00',
                                                        endTime: '2024-07-20 18:00:00',
                                                        parameter: {
                                                                parameterName: '晴',
                                                                parameterValue: '1'
                                                        }
                                                }
                                        ]
                                },
                                {
                                        elementName: 'Pop',
                                        time: [
                                                {
                                                        startTime: '2024-07-20 12:00:00',
                                                        endTime: '2024-07-20 18:00:00',
                                                        parameter: {
                                                                parameterName: '10',
                                                                parameterUnit: '百分比'
                                                        }
                                                }
                                        ]
                                }
                        ]
                };

                const result = factory(location);

                expect(result).toEqual({
                        locationName: 'Test City',
                        timeElementsMap: [
                                {
                                        startTime: '07/20 12:00',
                                        endTime: '07/20 18:00',
                                        Wx: { parameterName: '晴', parameterValue: '1' },
                                        Pop: { parameterName: '10', parameterUnit: '百分比' }
                                }
                        ]
                });
        });
});

