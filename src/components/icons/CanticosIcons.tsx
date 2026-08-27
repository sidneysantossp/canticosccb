import type { SVGProps, CSSProperties } from 'react';
import avulsosGuitar from '@/assets/icons/avulsos-guitar.png';
import instrumentalTrumpet from '@/assets/icons/instrumental-trumpet.png';

export interface CanticosIconProps extends SVGProps<SVGSVGElement> { size?: number | string; active?: boolean; accentColor?: string }

const Icon = ({ size = 24, children, active, accentColor, style, ...props }: CanticosIconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ '--canticos-icon-accent': accentColor || 'var(--color-primary, #22c55e)', ...style } as CSSProperties} data-active={active || undefined} {...props}>{children}</svg>
);

export const HomeIcon = (props: CanticosIconProps) => <Icon {...props}><path d="m3.5 10 8.5-7 8.5 7v9.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19.5Z"/><path stroke="var(--canticos-icon-accent)" d="M9 21v-6.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V21"/></Icon>;
export const SearchIcon = (props: CanticosIconProps) => <Icon {...props}><circle cx="10.5" cy="10.5" r="6.5"/><path stroke="var(--canticos-icon-accent)" d="m16 16 4.5 4.5"/></Icon>;
export const LibraryIcon = (props: CanticosIconProps) => <Icon {...props}><rect x="3.5" y="4" width="4.5" height="16" rx="1"/><rect stroke="var(--canticos-icon-accent)" x="9.5" y="3" width="4.5" height="17" rx="1"/><path d="m16.5 5 4 14.3a1 1 0 0 1-.7 1.2l-2.4.6"/><path stroke="var(--canticos-icon-accent)" d="M11.7 16.6 14 19l2.3-2.4"/></Icon>;
export const CategoriesIcon = (props: CanticosIconProps) => <Icon {...props}><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect stroke="var(--canticos-icon-accent)" x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></Icon>;
export const AvulsosIcon = ({ size = 29, className, style, ...props }: CanticosIconProps) => (
  <span
    aria-hidden="true"
    className={className}
    {...props}
    style={{
      width: size,
      height: size,
      display: 'inline-block',
      flex: '0 0 auto',
      backgroundImage: `url(${avulsosGuitar})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '160%',
      backgroundPosition: 'center',
      mixBlendMode: 'screen',
      ...style,
    }}
  />
);
export const VocalsIcon = (props: CanticosIconProps) => <Icon {...props}><rect x="8" y="3" width="8" height="12" rx="4"/><path stroke="var(--canticos-icon-accent)" d="M5 12a7 7 0 0 0 14 0M12 19v3M8.5 22h7"/></Icon>;
export const InstrumentalIcon = ({ size = 29, className, style, ...props }: CanticosIconProps) => (
  <span
    aria-hidden="true"
    className={className}
    {...props}
    style={{
      width: size,
      height: 32,
      display: 'inline-block',
      flex: '0 0 auto',
      backgroundImage: `url(${instrumentalTrumpet})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '160%',
      backgroundPosition: 'center',
      mixBlendMode: 'screen',
      ...style,
    }}
  />
);
export const ChordsIcon = (props: CanticosIconProps) => <Icon {...props}><path d="M5 3.5h9l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-15a1.5 1.5 0 0 1 1-1.5Z"/><path d="M14 3.5V9h5"/><path d="M7.5 12h7M7.5 15h7"/><rect stroke="var(--canticos-icon-accent)" x="8" y="17" width="2.2" height="2.2" rx=".2"/><rect x="12" y="17" width="2.2" height="2.2" rx=".2"/></Icon>;
export const HymnalIcon = (props: CanticosIconProps) => <Icon {...props}><path d="M6 3.5h11a2 2 0 0 1 2 2v14.8a.7.7 0 0 1-.7.7H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 1-2Z"/><path d="M8.5 7h7M8.5 10h7"/><path stroke="var(--canticos-icon-accent)" d="M12 15.5v5l-2-1.4-2 1.4v-5"/></Icon>;
export const BibleIcon = (props: CanticosIconProps) => <Icon {...props}><path d="M3.5 5.5C6 4.2 8.7 4.2 12 6v14c-3.3-1.8-6-1.8-8.5-.5Z"/><path d="M20.5 5.5C18 4.2 15.3 4.2 12 6v14c3.3-1.8 6-1.8 8.5-.5Z"/><path stroke="var(--canticos-icon-accent)" d="M15.5 13v7l-1.8-1.3-1.7 1.3"/></Icon>;
