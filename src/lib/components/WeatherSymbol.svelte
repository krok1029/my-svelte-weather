<script lang="ts">
	import Sun from '@lucide/svelte/icons/sun';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import Cloud from '@lucide/svelte/icons/cloud';
	import CloudLightning from '@lucide/svelte/icons/cloud-lightning';
	let { weather = '', size = 28 }: { weather?: string | null; size?: number } = $props();
	const Icon = $derived(
		weather?.includes('雷')
			? CloudLightning
			: weather?.includes('雨')
				? CloudRain
				: weather?.includes('晴') && !weather?.includes('雲')
					? Sun
					: weather?.includes('晴')
						? CloudSun
						: Cloud
	);
</script>

<Icon {size} strokeWidth={1.5} aria-hidden="true" />
