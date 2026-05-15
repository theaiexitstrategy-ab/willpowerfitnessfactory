'use client';

export default function TeeMockup({ logoUrl, accent }: { logoUrl: string | null; accent: string }) {
  return (
    <div className="relative aspect-[4/5] bg-[#0f0f0f] border border-border flex items-center justify-center overflow-hidden">
      {/* Simple SVG tee silhouette */}
      <svg viewBox="0 0 200 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <path
          d="M50 30 L80 20 Q100 35 120 20 L150 30 L180 50 L165 90 L150 80 L150 220 L50 220 L50 80 L35 90 L20 50 Z"
          fill="#1a1a1a"
          stroke={accent}
          strokeWidth="1.5"
        />
        <ellipse cx="100" cy="28" rx="20" ry="6" fill="none" stroke={accent} strokeWidth="1" />
      </svg>
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="absolute"
          style={{
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '38%',
            maxHeight: '28%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
}
