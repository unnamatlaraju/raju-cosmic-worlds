type FrameListener = (now: number) => void
interface Subscription { listener: FrameListener; continuous: boolean; priority: number }

/** One RAF for rendering, navigation and UI progress. Idle reduced-motion views sleep. */
class FrameClock {
  private subscriptions = new Set<Subscription>()
  private ordered: Subscription[] = []
  private request = 0

  subscribe(listener: FrameListener, continuous = false, priority = 1) {
    const subscription = { listener, continuous, priority }
    if (!this.subscriptions.size) document.addEventListener('visibilitychange', this.onVisibility)
    this.subscriptions.add(subscription)
    this.ordered = [...this.subscriptions].sort((a, b) => a.priority - b.priority)
    this.invalidate()
    return {
      setContinuous: (value: boolean) => { subscription.continuous = value; this.invalidate() },
      dispose: () => {
        this.subscriptions.delete(subscription)
        this.ordered = this.ordered.filter((entry) => entry !== subscription)
        if (!this.subscriptions.size) {
          cancelAnimationFrame(this.request)
          this.request = 0
          document.removeEventListener('visibilitychange', this.onVisibility)
        }
      },
    }
  }

  invalidate = () => {
    if (!this.request && this.subscriptions.size && !document.hidden) this.request = requestAnimationFrame(this.tick)
  }

  private tick = (now: number) => {
    this.request = 0
    // Subscription order is cached, not allocated on each frame. Navigation runs first.
    for (const entry of this.ordered) if (this.subscriptions.has(entry)) entry.listener(now)
    if (this.ordered.some((entry) => entry.continuous)) this.invalidate()
  }

  private onVisibility = () => {
    cancelAnimationFrame(this.request)
    this.request = 0
    if (!document.hidden) this.invalidate()
  }
}

export const frameClock = new FrameClock()
export type FrameSubscription = ReturnType<FrameClock['subscribe']>
