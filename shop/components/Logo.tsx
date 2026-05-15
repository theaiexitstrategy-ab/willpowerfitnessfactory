export default function Logo({ height = 38 }: { height?: number }) {
  return (
    <img
      src="https://www.willpowerfitnessfactory.com/wpff-logo-white.png"
      alt="Will Power Fitness Factory"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}

export function KettlebellSVG({ size = 80 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 36"
      width={size}
      height={size * (36 / 32)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 16 Q8 4 16 4 Q24 4 24 16"
        stroke="#f2f2f2"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="16" cy="26" rx="14" ry="11" fill="#f2f2f2" />
      <path d="M19 18 L11 26 L15.5 26 L13 34 L21 24 L16.5 24 Z" fill="#0a0a0a" />
    </svg>
  );
}
