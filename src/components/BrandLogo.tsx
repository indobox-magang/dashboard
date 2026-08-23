import Link from "next/link";

export const BRAND_LOGO = "/design/logo-full.png";

export function BrandLogo({
  height = 26,
  href,
  subtitle,
  className = "",
}: {
  height?: number;
  href?: string;
  subtitle?: string;
  className?: string;
}) {
  const logo = (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_LOGO} alt="Indobox" className="brand-logo" style={{ height }} />
      {subtitle ? (
        <p className="mt-1.5 text-[10px] uppercase tracking-widest text-[var(--muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block shrink-0">
        {logo}
      </Link>
    );
  }

  return logo;
}
