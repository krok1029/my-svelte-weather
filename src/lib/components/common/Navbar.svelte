<script lang="ts">
	import { setMode, resetMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
</script>

<header class="site-header">
	<a href="/" class="weather-brand" aria-label="島嶼天氣首頁">
		<span class="brand-icon"><CloudSun size={25} strokeWidth={1.7} /></span>
		<span><strong>島嶼天氣</strong><small>TAIWAN WEATHER</small></span>
	</a>
	<div class="header-actions">
		<span class="source-label"><span></span>中央氣象署預報</span>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon"
						class="size-11 rounded-full"
						aria-label="切換顯示主題"
					>
						<Sun class="size-5 dark:hidden" /><Moon class="hidden size-5 dark:block" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onclick={() => setMode('light')}>淺色模式</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => setMode('dark')}>深色模式</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => resetMode()}>跟隨系統</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</header>
