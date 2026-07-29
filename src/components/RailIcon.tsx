import type { SVGProps } from 'react';

export type RailIconName =
  | 'train'
  | 'route'
  | 'eye'
  | 'coin'
  | 'people'
  | 'sun'
  | 'settings'
  | 'help'
  | 'city'
  | 'tools'
  | 'broom'
  | 'pause'
  | 'play'
  | 'fast'
  | 'station'
  | 'gift'
  | 'stamp'
  | 'sparkle';

interface RailIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: RailIconName;
}

export function RailIcon({ name, className = '', ...props }: RailIconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className={`rail-icon ${className}`}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g {...common}>
        {name === 'train' && (
          <>
            <rect x="5" y="3" width="14" height="15" rx="4" />
            <path d="M8 7h8M8 11h3m2 0h3M7 18l-2 3m12-3 2 3M8 21h8" />
            <circle cx="8.5" cy="15" r="1" />
            <circle cx="15.5" cy="15" r="1" />
          </>
        )}
        {name === 'route' && (
          <>
            <circle cx="5" cy="17" r="2.5" />
            <circle cx="19" cy="7" r="2.5" />
            <path d="M7.5 17h3a2 2 0 0 0 2-2v-6a2 2 0 0 1 2-2h2" />
          </>
        )}
        {name === 'eye' && (
          <>
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.7" />
          </>
        )}
        {name === 'coin' && (
          <>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M9 8.5h6M12 8.5v7m-3-3.5h6" />
          </>
        )}
        {name === 'people' && (
          <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3.5 19c.6-4 2.4-6 5.5-6s4.9 2 5.5 6" />
            <circle cx="17" cy="9" r="2" />
            <path d="M15.2 14c2.9-.6 4.8 1.2 5.3 4" />
          </>
        )}
        {name === 'sun' && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
          </>
        )}
        {name === 'settings' && (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2.8v2.1m0 14.2v2.1M2.8 12h2.1m14.2 0h2.1M5.5 5.5 7 7m10 10 1.5 1.5m0-13L17 7M7 17l-1.5 1.5" />
            <circle cx="12" cy="12" r="7.2" />
          </>
        )}
        {name === 'help' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.7 9a2.5 2.5 0 1 1 3.2 2.4c-.9.4-.9 1-.9 2.1M12 17.5h.01" />
          </>
        )}
        {name === 'city' && (
          <>
            <path d="M3 21V10h7v11m0 0V4h8v17m0-8h3v8M6 13h1m-1 3h1m6-8h2m-2 4h2m-2 4h2M2 21h20" />
          </>
        )}
        {name === 'tools' && (
          <>
            <path d="m14.5 5.5 4-2-2 4-8.8 8.8a2 2 0 0 1-2.8-2.8Z" />
            <path d="m13.5 14.5 5 5m-2-2 2-2M6 4l3 3" />
          </>
        )}
        {name === 'broom' && (
          <>
            <path d="m15.5 3.5-6 11" />
            <path d="M8.5 13.5c-2.8.2-4.5 2-5 5 3.2 1.8 6.2 2 9 .5.1-2.7-.8-4.6-4-5.5Z" />
            <path d="M6 16.5c1.7 1 3.2 1.3 5 .8" />
          </>
        )}
        {name === 'pause' && (
          <>
            <path d="M8 6v12M16 6v12" strokeWidth="3" />
          </>
        )}
        {name === 'play' && <path d="m9 6 9 6-9 6Z" fill="currentColor" stroke="none" />}
        {name === 'fast' && (
          <>
            <path d="m5 7 7 5-7 5Zm8 0 7 5-7 5Z" fill="currentColor" stroke="none" />
          </>
        )}
        {name === 'station' && (
          <>
            <path d="M4 21V9l8-5 8 5v12M2 21h20M8 21v-6h8v6M7 10h10" />
          </>
        )}
        {name === 'gift' && (
          <>
            <path d="M3 10h18v11H3ZM2 6h20v4H2ZM12 6v15" />
            <path d="M12 6H8.5a2.5 2.5 0 1 1 2.1-3.8L12 6Zm0 0h3.5a2.5 2.5 0 1 0-2.1-3.8L12 6Z" />
          </>
        )}
        {name === 'stamp' && (
          <>
            <path d="M8 4a4 4 0 0 1 8 0c0 2.2-1 3.3-1 5 0 1.2.8 2.2 2.2 3H6.8C8.2 11.2 9 10.2 9 9c0-1.7-1-2.8-1-5Z" />
            <path d="M5 12h14l1 4H4l1-4Zm0 4v4h14v-4" />
          </>
        )}
        {name === 'sparkle' && (
          <>
            <path d="M12 2c.5 5.5 2.5 7.5 8 8-5.5.5-7.5 2.5-8 8-.5-5.5-2.5-7.5-8-8 5.5-.5 7.5-2.5 8-8Z" />
            <path d="M19 16c.2 2.1.9 2.8 3 3-2.1.2-2.8.9-3 3-.2-2.1-.9-2.8-3-3 2.1-.2 2.8-.9 3-3Z" />
          </>
        )}
      </g>
    </svg>
  );
}
