/** Hong Kong map silhouette for nav / badges */
export function HongKongMapIcon({
  className = "h-5 w-5",
  title = "Hong Kong",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.1" />
      {/* New Territories + Kowloon (north) */}
      <path
        fill="currentColor"
        d="M14 18c1.5-4 6-7 12-7.5 5-.4 9 1.5 11.5 4.5 2-2.5 5.5-3.8 9-3 3.5.8 6 3.5 6.5 7 .4 2.8-.6 5.2-2.5 7 2 1.2 3.2 3.5 3 6-.3 3-2.5 5.5-5.5 6.5v1.5c0 1.5-.8 2.8-2.2 3.5-1.8.9-4 .5-5.2-1l-.8 2.2c-.8 2.2-3 3.5-5.4 3.2-2.2-.3-4-1.8-4.6-3.8-1.5 1.2-3.6 1.5-5.5.6-2-.9-3.2-3-3-5.2-2.5-.5-4.5-2.4-5-4.8-.6-2.8.6-5.4 2.8-6.8C12.5 26 12 23.5 12.8 21c.6-1.8 1.8-3 3.2-3z"
      />
      {/* Hong Kong Island (south of harbour) */}
      <path
        fill="currentColor"
        d="M24 44c2.5-1.5 6-2 10-1.5 3.5.4 7 1.8 9.5 3.8 1.2 1 1.5 2.5.6 3.6-.8 1-2.2 1.4-3.5 1.2-2.5 2-6 2.8-9.5 2.2-3.2-.5-5.8-2.2-7.2-4.5-.8-1.2-.5-2.8.6-3.6.8-.6 1.8-.9 2.5-1.2z"
      />
      {/* Lantau suggestion (west) */}
      <ellipse
        cx="16"
        cy="40"
        rx="5"
        ry="2.8"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Harbour gap line */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.35"
        d="M20 41.5c4-1.2 9-1.5 14-.8 4 .6 8 2 11.5 4"
      />
    </svg>
  );
}
