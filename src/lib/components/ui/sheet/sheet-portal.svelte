<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLElement> {
		children?: import('svelte').Snippet;
	}

	let { children, ...rest }: Props = $props();
</script>

<SheetPrimitive.Portal {...rest}>
	{@render children?.()}
</SheetPrimitive.Portal>
