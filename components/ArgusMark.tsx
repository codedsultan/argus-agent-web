export function ArgusMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" opacity="0.22" />
      <circle cx="32" cy="32" r="22" stroke="currentColor" opacity="0.12" />
      <path
        d="M6 32c7.4-12.2 15.9-18.3 26-18.3S50.6 19.8 58 32c-7.4 12.2-15.9 18.3-26 18.3S13.4 44.2 6 32Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="8.5" fill="currentColor" />
      <circle cx="32" cy="32" r="3.2" fill="#070a0e" />
      <circle cx="32" cy="9" r="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="32" cy="55" r="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="9" cy="32" r="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="55" cy="32" r="1.6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
