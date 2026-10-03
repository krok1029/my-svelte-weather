<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Star from '@lucide/svelte/icons/star';
	import Link from '@lucide/svelte/icons/link';
	import X from '@lucide/svelte/icons/x';
	import {
		favoriteLimit,
		placeFromUrl,
		placeKey,
		placeLabel,
		readPreferences,
		urlForPlace,
		writePreferences,
		type CityOption,
		type Place
	} from '#lib/places/preferences.js';

	let {
		cities,
		selectedCity,
		selectedDistrict,
		onselect
	}: {
		cities: CityOption[];
		selectedCity: string | null;
		selectedDistrict: string | null;
		onselect: (place: Place | null) => void;
	} = $props();
	let favorites = $state<Place[]>([]);
	let message = $state('');
	let manualShare = $state(false);
	let initialized = false;
	let handledSearch = '';
	let handledPlace = '';
	const selected = $derived(
		selectedCity ? { city: selectedCity, district: selectedDistrict } : null
	);
	const isFavorite = $derived(favorites.some((place) => placeKey(place) === placeKey(selected)));

	function persist(place: Place | null) {
		try {
			return writePreferences(window.localStorage, { selected: place, favorites });
		} catch {
			return false;
		}
	}

	$effect(() => {
		const navigationState = page.state;
		const url = new URL(window.location.href, page.url.href);
		const options = cities;
		const current = selected;
		untrack(() => {
			if (!options.length) return;
			if (!initialized || url.search !== handledSearch) {
				const fromUrl = placeFromUrl(url, options);
				let next = fromUrl.selected;
				if (!initialized) {
					try {
						const stored = readPreferences(window.localStorage, options);
						favorites = stored.favorites;
						if (!fromUrl.explicit) next = current ?? stored.selected;
					} catch {
						/* URL selection remains usable when storage is unavailable. */
					}
				}
				initialized = true;
				const canonical = urlForPlace(url, next);
				handledSearch = canonical.search;
				handledPlace = placeKey(next);
				if (placeKey(next) !== placeKey(current)) onselect(next);
				if (canonical.href !== url.href)
					goto(canonical, { shallow: true, replace: true, state: { ...navigationState } });
				persist(next);
				return;
			}
			if (placeKey(current) !== handledPlace) {
				const next = urlForPlace(url, current);
				handledSearch = next.search;
				handledPlace = placeKey(current);
				goto(next, { shallow: true, state: { ...navigationState } });
				persist(current);
				message = '';
				manualShare = false;
			}
		});
	});

	function toggleFavorite() {
		if (!selected) return;
		if (isFavorite) favorites = favorites.filter((place) => placeKey(place) !== placeKey(selected));
		else if (favorites.length < favoriteLimit) favorites = [...favorites, selected];
		else {
			message = `最多儲存 ${favoriteLimit} 個常用地點，請先移除一個。`;
			return;
		}
		message = persist(selected)
			? '常用地點已更新，儲存在此瀏覽器。'
			: '此瀏覽器無法儲存設定，常用地點只會保留到離開頁面。';
	}
	function removeFavorite(place: Place) {
		favorites = favorites.filter((item) => placeKey(item) !== placeKey(place));
		message = persist(selected) ? '已移除常用地點。' : '已從本次頁面移除，瀏覽器無法儲存設定。';
	}
	async function share() {
		const url = urlForPlace(page.url, selected).href;
		try {
			await navigator.clipboard.writeText(url);
			message = '地區連結已複製。';
			manualShare = false;
		} catch {
			manualShare = true;
			message = '請複製下方地區連結。';
		}
	}
</script>

{#if selected || favorites.length > 0}
	<div class="saved-places">
		{#if selected}
			<div class="place-actions">
				<button onclick={toggleFavorite} aria-pressed={isFavorite}
					><Star
						size={15}
						fill={isFavorite ? 'currentColor' : 'none'}
						aria-hidden="true"
					/>{isFavorite ? '取消常用' : '加入常用'}</button
				>
				<button onclick={share}><Link size={15} aria-hidden="true" />分享地區</button>
			</div>
		{/if}
		{#if favorites.length > 0}
			<details>
				<summary>常用地點 <span>{favorites.length}</span></summary>
				<ul aria-label="常用地點">
					{#each favorites as place (placeKey(place))}
						<li>
							<button class="place-choice" onclick={() => onselect(place)}
								>{placeLabel(place)}</button
							><button
								class="remove-place"
								aria-label={`移除 ${placeLabel(place)}`}
								onclick={() => removeFavorite(place)}><X size={15} aria-hidden="true" /></button
							>
						</li>
					{/each}
				</ul>
				<p class="storage-note">僅儲存在此瀏覽器，不需登入。</p>
			</details>
		{/if}
		{#if manualShare}<input
				aria-label="地區分享連結"
				readonly
				value={urlForPlace(page.url, selected).href}
				onfocus={(event) => event.currentTarget.select()}
			/>{/if}
		<p role="status" class="place-message">{message}</p>
	</div>
{/if}

<style>
	.saved-places {
		border-top: 1px solid var(--border);
		font-size: 12px;
	}
	.place-actions {
		display: flex;
		gap: 8px;
	}
	button {
		min-height: 44px;
		color: var(--primary);
		display: flex;
		align-items: center;
		gap: 7px;
		border-radius: 7px;
	}
	.place-actions button {
		padding: 0 9px;
		flex: 1;
		justify-content: center;
	}
	button:hover {
		background: var(--muted);
	}
	summary {
		cursor: pointer;
		min-height: 44px;
		align-content: center;
		color: var(--muted-foreground);
	}
	summary span {
		margin-left: 5px;
	}
	summary:focus-visible {
		outline: 3px solid var(--ring);
		outline-offset: 2px;
	}
	ul {
		max-height: 150px;
		overflow-y: auto;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.place-choice {
		flex: 1;
		text-align: left;
		padding-left: 8px;
	}
	.remove-place {
		width: 44px;
		justify-content: center;
		flex-shrink: 0;
	}
	.storage-note,
	.place-message {
		font-size: 11px;
		color: var(--muted-foreground);
		line-height: 1.6;
	}
	.storage-note {
		margin: 5px 0 10px;
	}
	.place-message:not(:empty) {
		padding: 7px 0;
	}
	input {
		width: 100%;
		height: 44px;
		border: 1px solid var(--border);
		border-radius: 7px;
		padding: 0 8px;
		margin: 5px 0;
	}
</style>
