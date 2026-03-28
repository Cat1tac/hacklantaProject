'use client';

interface DemandGaugeProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-demand-high';
  if (score >= 50) return 'text-demand-medium';
  return 'text-demand-low';
}

function getGradeBg(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'B': return 'bg-lime-100 text-lime-700 border-lime-200';
    case 'C': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-red-100 text-red-700 border-red-200';
  }
}

function getGradeLabel(grade: string): string {
  switch (grade) {
    case 'A': return 'Very High Demand';
    case 'B': return 'High Demand';
    case 'C': return 'Moderate Demand';
    default: return 'Low Demand';
  }
}

export default function DemandGauge({ score, grade }: DemandGaugeProps) {
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-4 animate-fade-up">
      {/* Circular gauge */}
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background track */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={score >= 70 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div className={`mt-3 px-3 py-1 rounded-full border text-xs font-bold ${getGradeBg(grade)}`}>
        Grade {grade} — {getGradeLabel(grade)}
      </div>

      <p className="mt-2 text-[11px] text-gray-400 font-medium tracking-wide uppercase">
        Latent Demand Score
      </p>
    </div>
  );
}
