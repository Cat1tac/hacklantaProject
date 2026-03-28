import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { FeatureCollection } from 'geojson';
import type { FullAnalysis } from '@/lib/cache/fallback';

interface ReportPageProps {
  params: { id: string };
}

async function getReportData(corridorId: string) {
  // Load corridor info
  const corridorsPath = path.join(process.cwd(), 'data', 'corridors.json');
  const corridorsData: FeatureCollection = JSON.parse(
    fs.readFileSync(corridorsPath, 'utf-8')
  );
  const corridor = corridorsData.features.find(
    (f) => f.properties?.id === corridorId
  );
  if (!corridor) return null;

  // Load analysis
  const fallbackPath = path.join(
    process.cwd(),
    'data',
    'fallbacks',
    `${corridorId}.json`
  );
  let analysis: FullAnalysis | null = null;
  try {
    analysis = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  } catch {
    return null;
  }

  return { corridor, analysis };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const data = await getReportData(params.id);
  if (!data || !data.analysis) notFound();

  const { corridor, analysis } = data;
  const name = corridor.properties?.name || 'Unknown';
  const service = corridor.properties?.currentService || '';

  return (
    <div className="min-h-screen bg-white">
      {/* Print-only header */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11pt; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:text-primary-600 flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Map
        </Link>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.print();
          }}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors"
        >
          Export PDF
        </button>
      </div>

      {/* Report content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Title block */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3L4 6V14L10 17L16 14V6L10 3Z" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="10" cy="10" r="2.5" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">PulseRoute</p>
              <p className="text-[10px] text-gray-400">Transit Demand Intelligence Report</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
          <p className="text-base text-gray-500">{service}</p>
          <p className="text-sm text-gray-400 mt-2">
            Generated {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Score summary */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Latent Demand Assessment
          </h2>
          <div className="flex items-start gap-8">
            <div className="text-center">
              <span className="text-6xl font-bold text-primary tabular-nums">
                {analysis.score.score}
              </span>
              <p className="text-sm text-gray-400 mt-1">out of 100</p>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${
                analysis.score.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                analysis.score.grade === 'B' ? 'bg-lime-100 text-lime-700' :
                analysis.score.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                Grade {analysis.score.grade}
              </span>
            </div>
            <div className="flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase">
                    <th className="pb-2 font-bold">Factor</th>
                    <th className="pb-2 font-bold">Raw Value</th>
                    <th className="pb-2 font-bold">Score</th>
                    <th className="pb-2 font-bold">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.score.factors.map((f: { name: string; value: number; normalized: number; weight: number }) => (
                    <tr key={f.name} className="border-t border-gray-50">
                      <td className="py-2 font-medium text-gray-800">{f.name}</td>
                      <td className="py-2 text-gray-600">{f.value}</td>
                      <td className="py-2 text-gray-600">{f.normalized.toFixed(1)}/100</td>
                      <td className="py-2 text-gray-600">{(f.weight * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Narrative */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Demand Analysis
          </h2>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {analysis.narrative}
          </div>
        </section>

        {/* Pilot design */}
        <section className="print-break mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Micro-Transit Pilot Design
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Recommended Headway</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{analysis.pilot.headway}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Vehicle Type</p>
              <p className="text-base font-bold text-gray-900 mt-1">{analysis.pilot.vehicle}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Estimated Cost</p>
              <p className="text-base font-bold text-gray-900 mt-1">{analysis.pilot.cost}</p>
            </div>
          </div>

          {/* Grant paragraph */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
              FTA Pilot Program — Draft Grant Language
            </h3>
            <p className="text-sm text-blue-900/80 leading-relaxed">
              {analysis.pilot.grant}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            PulseRoute Transit Demand Intelligence · Data sources: Census ACS 2022, USDA Food Access Research Atlas, GTFS Static Feeds
          </p>
          <p className="text-[10px] text-gray-300 mt-1">
            This report is generated by AI analysis and should be reviewed by qualified transit planners before policy decisions.
          </p>
        </footer>
      </div>
    </div>
  );
}
