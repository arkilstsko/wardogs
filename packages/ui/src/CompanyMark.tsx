/** Original company emblems. Source geometry and provenance: packages/assets/brands. */
const marks = {
  meridian: { name: 'Meridian & Co.', src: new URL('../../assets/brands/meridian.svg', import.meta.url).href },
  northstar: { name: 'Northstar Union', src: new URL('../../assets/brands/northstar.svg', import.meta.url).href },
  vesper: { name: 'Vesper Exchange', src: new URL('../../assets/brands/vesper.svg', import.meta.url).href },
  atlas: { name: 'Atlas Cooperative', src: new URL('../../assets/brands/atlas.svg', import.meta.url).href },
  redwood: { name: 'Redwood Trading', src: new URL('../../assets/brands/redwood.svg', import.meta.url).href },
} as const;
export type CompanyMarkId = keyof typeof marks;
export function CompanyMark({ company, size = 64, decorative = false, className }: {
  company: CompanyMarkId; size?: number; decorative?: boolean; className?: string;
}) {
  const mark = marks[company];
  return <img src={mark.src} width={size} height={size} className={className}
    alt={decorative ? '' : `${mark.name} company emblem`} aria-hidden={decorative || undefined} />;
}
