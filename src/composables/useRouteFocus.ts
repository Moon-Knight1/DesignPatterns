import { watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Move keyboard / screen-reader focus to <main id="main"> after each route change.
 * Follows WAI-ARIA Authoring Practices for SPAs — vision users land on the new
 * content visually, keyboard / SR users land on the same target programmatically.
 *
 * Called once at the App level so every route transition is covered
 * (Transition's enter / leave callbacks are not the right hook for this).
 */
export function useRouteFocus(): void {
  const route = useRoute()
  watch(
    () => route.fullPath,
    async () => {
      // Wait for Transition's onEnter to settle so focus lands on the rendered DOM.
      await nextTick()
      const main = document.getElementById('main')
      if (!main) return
      main.setAttribute('tabindex', '-1')
      // preventScroll avoids the scroll jump that .focus() can cause during transitions.
      main.focus({ preventScroll: true })
    },
    { flush: 'post' },
  )
}