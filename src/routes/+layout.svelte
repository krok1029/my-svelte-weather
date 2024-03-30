<script>
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '@/lib/components/common/Navbar.svelte';
</script>

<ModeWatcher />
<div class="flex min-h-screen w-full flex-col">
	<Navbar />
	<slot />
</div>
