<script lang="ts">
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '@/lib/components/common/Navbar.svelte';
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
