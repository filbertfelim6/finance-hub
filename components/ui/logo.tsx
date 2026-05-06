interface LogoProps {
  className?: string;
}

/** Full wordmark: leaf mark + "FinanceHub" in Fraunces */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 260 56"
      role="img"
      aria-label="FinanceHub"
      className={className}
    >
      <g transform="translate(4, 4)">
        <path
          d="M20 38 C 6 32, 4 14, 18 4 C 22 14, 24 26, 20 38 Z"
          className="fill-[#7d9870] dark:fill-[#c8d6bf]"
        />
        <path
          d="M20 38 C 34 32, 36 14, 22 4 C 18 14, 16 26, 20 38 Z"
          className="fill-[#5a7a4e] dark:fill-[#a6bb98]"
        />
        <rect
          x="18.5" y="34" width="3" height="10" rx="1.5"
          className="fill-[#364d2c] dark:fill-[#e3ebde]"
        />
      </g>
      <text
        x="56"
        y="28"
        fontSize="28"
        fontWeight="600"
        dominantBaseline="central"
        style={{ fontFamily: 'var(--font-heading, "Fraunces", Georgia, serif)' }}
        className="fill-[#1a1f17] dark:fill-[#ece8d8]"
      >
        Finance
        <tspan className="fill-[#5a7a4e] dark:fill-[#a6bb98]">Hub</tspan>
      </text>
    </svg>
  );
}

/** Mark only: the leaf + stem, no wordmark text */
export function LogoMark({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 56"
      aria-hidden="true"
      className={className}
    >
      <g transform="translate(4, 8)">
        <path
          d="M20 38 C 6 32, 4 14, 18 4 C 22 14, 24 26, 20 38 Z"
          className="fill-[#7d9870] dark:fill-[#c8d6bf]"
        />
        <path
          d="M20 38 C 34 32, 36 14, 22 4 C 18 14, 16 26, 20 38 Z"
          className="fill-[#5a7a4e] dark:fill-[#a6bb98]"
        />
        <rect
          x="18.5" y="34" width="3" height="10" rx="1.5"
          className="fill-[#364d2c] dark:fill-[#e3ebde]"
        />
      </g>
    </svg>
  );
}
