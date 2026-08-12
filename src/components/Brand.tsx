/** SiteCommand wordmark: pure text, no logo image, per the white-label brief. */
export function SiteCommandLogo({
  height = 24,
  light = false,
}: {
  height?: number
  light?: boolean
}) {
  return (
    <span
      className="inline-flex items-baseline font-extrabold tracking-tight"
      style={{ fontSize: height, color: light ? '#ffffff' : '#0c2a1e', lineHeight: 1 }}
    >
      Site<span style={{ color: light ? '#6ee7b7' : '#047857' }}>Command</span>
    </span>
  )
}

/** Tarjeti developer logo: the paper-plane mark plus a text wordmark. */
export function TarjetiLogo({
  height = 18,
  light = false,
  link = false,
}: {
  height?: number
  light?: boolean
  link?: boolean
}) {
  const mark = (
    <span className="inline-flex items-center gap-1.5">
      <img
        src="/tarjeti-mark.png"
        alt=""
        style={{ height: height * 1.2, width: 'auto', objectFit: 'contain' }}
        draggable={false}
      />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: height, color: light ? '#ffffff' : '#0c2a1e', lineHeight: 1 }}
      >
        Tarjeti
      </span>
    </span>
  )

  if (!link) return mark

  return (
    <a
      href="https://tarjeti.tech"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center transition-opacity hover:opacity-80"
      aria-label="Tarjeti, opens in a new tab"
    >
      {mark}
    </a>
  )
}
