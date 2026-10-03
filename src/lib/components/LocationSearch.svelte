<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import {
		normalizeLocationQuery,
		searchLocations,
		type LocationOption,
		type SearchCity
	} from '#lib/locations/search.js';

	let {
		cities,
		loading = false,
		onselect
	}: {
		cities: SearchCity[];
		loading?: boolean;
		onselect: (location: LocationOption) => void;
	} = $props();
	const id = $props.id();
	let query = $state('');
	let open = $state(false);
	let activeIndex = $state(-1);
	let input: HTMLInputElement;
	let list: HTMLDivElement | undefined = $state();
	const hasQuery = $derived(normalizeLocationQuery(query).length > 0);
	const results = $derived(searchLocations(cities, query));
	const expanded = $derived(open && hasQuery && results.length > 0);
	const optionId = (index: number) => `${id}-option-${index}`;

	$effect(() => {
		if (expanded && activeIndex >= 0) {
			list?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
		}
	});

	function choose(location: LocationOption) {
		query = location.city + (location.district ? ` ${location.district}` : '');
		onselect(location);
		input.focus();
		open = false;
		activeIndex = -1;
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.isComposing) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
			activeIndex = -1;
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!results.length) return;
			event.preventDefault();
			open = true;
			activeIndex =
				event.key === 'ArrowDown'
					? (activeIndex + 1) % results.length
					: (activeIndex <= 0 ? results.length : activeIndex) - 1;
		} else if (event.key === 'Enter' && expanded) {
			event.preventDefault();
			choose(results[activeIndex < 0 ? 0 : activeIndex]);
		}
	}
</script>

<div
	class="location-search"
	onfocusout={(event) => {
		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) open = false;
	}}
>
	<label for={`${id}-input`}>搜尋縣市或行政區</label>
	<div class="search-field">
		<Search size={17} aria-hidden="true" />
		<input
			bind:this={input}
			id={`${id}-input`}
			type="search"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={expanded}
			aria-controls={expanded ? `${id}-results` : undefined}
			aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
			aria-describedby={`${id}-hint`}
			autocomplete="off"
			placeholder="例如：內湖、松山、台中"
			disabled={loading || cities.length === 0}
			value={query}
			oninput={(event) => {
				query = event.currentTarget.value;
				activeIndex = -1;
				open = true;
			}}
			onfocus={() => (open = true)}
			{onkeydown}
		/>
	</div>
	<p id={`${id}-hint`} class="search-hint">
		{loading
			? '地區清單載入中…'
			: cities.length === 0
				? '地區清單暫時無法使用。'
				: '輸入地名，直接前往預報。'}
	</p>
	{#if open && hasQuery}
		<p class="search-status" role="status">
			{results.length > 0
				? `找到 ${results.length} 個地區，可用上下方向鍵選擇，Enter 確認。`
				: '找不到符合的地區，請試試縣市或行政區名稱，例如「內湖」。'}
		</p>
		{#if results.length > 0}
			<div
				bind:this={list}
				id={`${id}-results`}
				class="search-results"
				role="listbox"
				aria-label="地區搜尋結果"
			>
				{#each results as result, index (`${result.city}/${result.district ?? ''}`)}
					<button
						type="button"
						id={optionId(index)}
						role="option"
						aria-selected={activeIndex === index}
						tabindex="-1"
						onclick={() => choose(result)}
					>
						<strong>{result.district ?? result.city}</strong>
						<span>{result.district ? result.city : '全縣市預報'}</span>
					</button>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.location-search {
		margin-bottom: 18px;
		min-width: 0;
	}
	label {
		display: block;
		margin-bottom: 7px;
		font-size: 12px;
		font-weight: 600;
		color: var(--muted-foreground);
	}
	.search-field {
		position: relative;
	}
	.search-field :global(svg) {
		position: absolute;
		left: 12px;
		top: 15px;
		color: var(--muted-foreground);
		pointer-events: none;
	}
	input {
		width: 100%;
		min-width: 0;
		min-height: 46px;
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 10px 12px 10px 38px;
		background: var(--card);
		color: var(--foreground);
		font-size: 16px;
	}
	input:focus-visible {
		outline: 3px solid var(--ring);
		outline-offset: 3px;
	}
	input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.search-hint,
	.search-status {
		margin-top: 7px;
		color: var(--muted-foreground);
		font-size: 11px;
		line-height: 1.6;
	}
	.search-results {
		margin-top: 8px;
		max-height: 248px;
		overflow-y: auto;
		overscroll-behavior: contain;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--card);
	}
	button {
		display: flex;
		width: 100%;
		min-height: 48px;
		padding: 10px 12px;
		gap: 12px;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		color: var(--foreground);
	}
	button + button {
		border-top: 1px solid var(--border);
	}
	button:hover,
	button[aria-selected='true'] {
		background: var(--muted);
	}
	button[aria-selected='true'] {
		box-shadow: inset 3px 0 var(--primary);
	}
	strong {
		font-size: 14px;
		font-weight: 600;
	}
	button span {
		font-size: 12px;
		color: var(--muted-foreground);
	}
</style>
