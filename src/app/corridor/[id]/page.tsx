import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import type { FeatureCollection } from 'geojson';

interface CorridorPageProps {
  params: { id: string };
}

async function getCorridorData(corridorId: string) {
  // Load corridors
  const corridorsPath = path.join(process.cwd(), 'data', 'corridors.json');
  const corridorsData: FeatureCollection = JSON.parse(
    fs.readFileSync(corridorsPath, 'utf-8')
  );
  const corridor = corridorsData.features.find(
    (f) => f.properties?.id === corridorId
  );
  if (!corridor) return null;

  // Load fallback analysis
  const fallbackPath = path.join(
    process.cwd(),
    'data',
    'fallbacks',
    `${corridorId}.json`
  );
  let analysis = null;
  try {
    analysis = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
  } catch {
    // No fallback available
  }

  return { corridor, analysis };
}

export default async function CorridorPage({ params }: CorridorPageProps) {
  const data = await getCorridorData(params.id);
  if (!data) notFound();

  const { corridor, analysis } = data;
  const name = corridor.properties?.name || 'Unknown Corridor';
  const service = corridor.properties?.currentService || '';
  const description = corridor.properties?.description || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="text-xs font-medium text-primary hover:text-primary-600 mb-3 inline-flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Map
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{name}</h1>
          <p className="text-sm text-gray-500 mt-1">{service}</p>
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {analysis ? (
          <div className="space-y-8">
            {/* Score summary */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Demand Analysis</h2>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-5xl font-bold text-primary tabular-nums">
                    {analysis.score.score}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">Latent Demand Score</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {analysis.score.factors.map((factor: { name: string; value: number; normalized: number; weight: number }) => (
                    <div key={factor.name} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase">{factor.name}</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">{factor.value}</p>
                      <p className="text-[10px] text-gray-400">
                        Score: {factor.normalized.toFixed(0)}/100 · Weight: {(factor.weight * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Narrative */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">AI Demand Narrative</h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {analysis.narrative}
              </div>
            </section>

            {/* Pilot design */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Micro-Transit Pilot Design</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-bold text-primary-400 uppercase">Headway</p>
                  <p className="text-xl font-bold text-primary mt-1">{analysis.pilot.headway}</p>
                </div>
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-bold text-primary-400 uppercase">Vehicle</p>
                  <p className="text-sm font-bold text-primary mt-1">{analysis.pilot.vehicle}</p>
                </div>
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-bold text-primary-400 uppercase">Est. Cost</p>
                  <p className="text-sm font-bold text-primary mt-1">{analysis.pilot.cost}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <p className="text-[11px] font-bold text-blue-600 uppercase mb-2">
                  FTA Pilot Program — Draft Language
                </p>
                <p className="text-sm text-blue-900/80 leading-relaxed">
                  {analysis.pilot.grant}
                </p>
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">Analysis data not yet available for this corridor.</p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg"
            >
              Analyze on Map
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
