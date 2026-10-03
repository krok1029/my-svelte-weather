import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({ CWA_API_TOKEN: { schema: (input) => input ?? '' } });
