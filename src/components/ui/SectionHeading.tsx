interface SectionHeadingProps {
  title: string
  lede?: string
  align?: 'left' | 'center'
  tone?: 'dark' | 'light'
}

export default function SectionHeading({
  title,
  lede,
  align = 'left',
  tone = 'dark',
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'items-center text-center mx-auto' : 'text-left'
  const titleColor = tone === 'light' ? 'text-sand' : 'text-ink'
  const ledeColor = tone === 'light' ? 'text-sand/75' : 'text-ink/70'

  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignClass}`}>
      <span aria-hidden="true" className={`h-1 w-12 rounded-full ${tone === 'light' ? 'bg-citrus' : 'bg-court'}`} />
      <h2 className={`text-balance text-3xl font-semibold leading-[1.08] sm:text-4xl ${titleColor}`}>
        {title}
      </h2>
      {lede && <p className={`max-w-xl text-balance text-sm leading-7 sm:text-base ${ledeColor}`}>{lede}</p>}
    </div>
  )
}
