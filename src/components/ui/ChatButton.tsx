import { messengerUrl } from '../../data/social'

export default function ChatButton() {
  return (
    <a
      href={messengerUrl}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Chat with us on Facebook Messenger"
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex h-12 items-center justify-center gap-2 rounded-full bg-citrus px-3.5 text-ink sm:px-4 shadow-lg shadow-ink/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-citrus-dim"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9.5L5 21v-4a3 3 0 0 1-2-2.8V6a3 3 0 0 1 3-3Z" />
      </svg>
      <span className="hidden text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  )
}
