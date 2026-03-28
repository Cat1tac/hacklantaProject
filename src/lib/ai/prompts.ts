import type { DemandFactor } from '@/lib/scoring/types';

/**
 * Generates the narrative analysis prompt.
 * Produces a 3-paragraph analyst brief explaining latent demand.
 */
export function NARRATIVE_PROMPT(
  corridorName: string,
  score: number,
  factors: DemandFactor[],
  peerCity: { city: string; corridor: string; ridershipLift: number; year: number } | null
): string {
  const factorSummary = factors
    .map((f) => `- ${f.name}: ${f.value} (normalized score: ${f.normalized}/100, weight: ${(f.weight * 100).toFixed(0)}%)`)
    .join('\n');

  const peerContext = peerCity
    ? `\nPeer city reference: ${peerCity.city}'s ${peerCity.corridor} achieved a ${peerCity.ridershipLift}% ridership lift in ${peerCity.year} after frequency improvements in a comparable corridor.`
    : '';

  return `You are a transit demand analyst writing a briefing for transit agency planners and community advocates. Write a compelling, data-driven 3-paragraph analysis for the ${corridorName} corridor.

Overall latent demand score: ${score}/100
${factorSummary}
${peerContext}

Write exactly 3 paragraphs wrapped in <narrative> tags:

Paragraph 1: State the problem — what current ridership data hides about this corridor. Use the specific zero-car and service frequency numbers to show the circular data trap.

Paragraph 2: Present what demand proxies reveal — employment density, poverty rate, food access. Be specific with numbers. Explain WHY these proxies indicate latent ridership that current data misses.

Paragraph 3: Recommend action — reference the peer city comparison if available, state the corridor's grade and score, and make the case for a frequency pilot. Be bold but evidence-based.

Write in a professional analytical tone. No bullet points. No hedging language. Every sentence should advance the argument. Wrap the full output in <narrative></narrative> tags.`;
}

/**
 * Generates the pilot design prompt.
 * Outputs structured pilot parameters with XML tags.
 */
export function PILOT_PROMPT(
  corridorName: string,
  score: number,
  demand: {
    zeroCar: number;
    employment: number;
    poverty: number;
    corridorLength?: number;
  }
): string {
  return `You are a transit operations consultant designing a minimum viable transit pilot for the ${corridorName} corridor.

Corridor data:
- Latent demand score: ${score}/100
- Zero-car households: ${demand.zeroCar}%
- Employment density: ${demand.employment} jobs/sq mi
- Poverty rate: ${demand.poverty}%
- Approximate corridor length: ${demand.corridorLength || 5} miles

Design a 90-day transit pilot. Respond with these XML-tagged sections:

<headway>Recommended service frequency (e.g., "15 minutes"). Choose based on demand score: A-grade = 10min, B-grade = 15min, C-grade = 20min. Include peak vs off-peak if relevant.</headway>

<vehicle>Recommended vehicle type and size (e.g., "40-seat standard bus"). Choose based on projected demand: high demand = 40-seat bus, moderate = 25-seat cutaway, lower = 20-seat shuttle van. Justify briefly.</vehicle>

<cost>Estimated 90-day pilot cost (e.g., "$127,000 / 90 days"). Calculate based on: vehicle lease ($2,000-4,000/month per vehicle), operator costs ($25-35/hr), fuel, and overhead. Show the single total number prominently.</cost>

<grant>Write exactly one paragraph (150 words) of draft FTA Pilot Program grant application language. Include: corridor demographics, service gap description, proposed service design, projected ridership based on peer city calibration, cost-per-rider metric, and alignment with FTA equity criteria. Write in formal grant language — persuasive but factual. This must be copy-paste ready for an actual application.</grant>

Be specific with numbers. Do not hedge. Every recommendation should be justified by the data provided.`;
}
