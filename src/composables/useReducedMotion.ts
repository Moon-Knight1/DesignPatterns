import { ref, onUnmounted, type Ref, getCurrentInstance } from 'vue'

/**
 * 监听系统 prefers-reduced-motion: reduce。
 * 返回的 Ref<boolean> 在系统偏好变化时跟随 reactive 更新（spec §7）。
 */
export function useReducedMotion(): Readonly<Ref<boolean>> {
  const reduced = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return reduced
  }

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mql.matches

  const handler = (e: MediaQueryListEvent) => {
    reduced.value = e.matches
  }

  // 现代浏览器使用 addEventListener；旧 Safari 用 addListener 作 fallback（虽然不强求）
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handler)

    // 仅在组件上下文中注册清理回调
    if (getCurrentInstance() !== null) {
      onUnmounted(() => {
        mql.removeEventListener('change', handler)
      })
    }
  }

  return reduced
}