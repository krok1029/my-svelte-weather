<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '@/components/common/Navbar.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<ModeWatcher />
<div class="flex min-h-screen w-full flex-col">
	<Navbar />
	{@render children?.()}
</div>
