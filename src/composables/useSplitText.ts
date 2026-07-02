import { onBeforeUnmount, type Ref } from 'vue'

export type SplitMode = 'char' | 'word'

export interface UseSplitTextOptions {
  /** Splitting granularity — 'char' (default) or 'word'. */
  mode?: SplitMode
  /** Class for character / word spans (default: 'reveal-char'). */
  itemClass?: string
  /** Class for whitespace spans (default: 'reveal-ws'). */
  wsClass?: string
}

export interface UseSplitTextHandle {
  /** Wrap the first non-whitespace text-node's characters/words in spans. Call once after mount. */
  split(): void
  /** Restore the original DOM children. Auto-called on unmount. */
  restore(): void
}

type Token = { kind: 'item' | 'ws'; value: string }

/**
 * Splits the first non-whitespace text-node inside `root` into per-item spans
 * for animated reveals. Element siblings (e.g. <span class="title-en">) are preserved.
 *
 * Why text-node-only: PatternHeader's <h1> mixes {{ titleZh }} text with a child
 * <span class="title-en">/ Singleton</span>. Cloning/destroying the inner span would
 * drop its typography. Splitting only the CJK text keeps the English span intact.
 *
 * Auto-restores on unmount so route-leak smoke tests stay green — even if the parent
 * gsap.context() reverts, we also strip the wrapper spans we created.
 */
export function useSplitText(
  root: Ref<HTMLElement | null | undefined>,
  opts: UseSplitTextOptions = {},
): UseSplitTextHandle {
  const mode: SplitMode = opts.mode ?? 'char'
  const itemClass = opts.itemClass ?? 'reveal-char'
  const wsClass = opts.wsClass ?? 'reveal-ws'

  // Hold onto the original children so restore() can put them back in order.
  let originalChildren: ChildNode[] | null = null
  let restored = false

  function split(): void {
    const el = root.value
    if (!el || originalChildren !== null) return

    originalChildren = Array.from(el.childNodes)
    const fragment = document.createDocumentFragment()
    let didSplit = false

    for (const child of originalChildren) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent !== null) {
        const text = child.textContent
        if (!didSplit && text.trim().length > 0) {
          for (const t of tokenize(text, mode)) {
            fragment.appendChild(renderToken(t, itemClass, wsClass))
          }
          didSplit = true
        } else {
          fragment.appendChild(renderWs(text, wsClass))
        }
      } else {
        // Element / comment nodes: move as-is. Re-attaching happens on restore.
        fragment.appendChild(child)
      }
    }

    el.replaceChildren(fragment)
  }

  function restore(): void {
    if (restored || !originalChildren) return
    const el = root.value
    if (!el) return
    el.replaceChildren(...originalChildren)
    restored = true
  }

  // Auto-cleanup. onBeforeUnmount fires in reverse registration order, so if the
  // caller invokes useGsapScene() AFTER useSplitText(), ctx.revert() runs first
  // (no tweens to revert) and then we put the original DOM back.
  onBeforeUnmount(restore)

  return { split, restore }
}

// --- internals -------------------------------------------------------------

function tokenize(text: string, mode: SplitMode): Token[] {
  if (mode === 'char') {
    return Array.from(text).map((ch) =>
      /\s/.test(ch) ? { kind: 'ws', value: ch } : { kind: 'item', value: ch },
    )
  }
  // word mode: keep whitespace tokens so spacing is preserved verbatim.
  return text
    .split(/(\s+)/)
    .filter((part) => part.length > 0)
    .map((part) => (/^\s+$/.test(part) ? { kind: 'ws', value: part } : { kind: 'item', value: part }))
}

function renderToken(token: Token, itemClass: string, wsClass: string): HTMLElement {
  const span = document.createElement('span')
  if (token.kind === 'ws') {
    span.className = wsClass
  } else {
    span.className = itemClass
    span.setAttribute('aria-hidden', 'true')
  }
  span.textContent = token.value
  return span
}

function renderWs(text: string, wsClass: string): HTMLElement {
  const span = document.createElement('span')
  span.className = wsClass
  span.textContent = text
  return span
}