interface UrgencyRingProps {
  score: number;
  label: string;
}

export const UrgencyRing = ({ score, label }: UrgencyRingProps) => {
  const normalized = Math.min(100, Math.max(0, score));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <div className="urgency-ring" aria-label={`${label} urgency ${normalized}%`}>
      <svg width="56" height="56" viewBox="0 0 56 56" role="img">
        <circle className="ring-track" cx="28" cy="28" r={radius} />
        <circle
          className="ring-progress"
          cx="28"
          cy="28"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span>{normalized}</span>
    </div>
  );
};
