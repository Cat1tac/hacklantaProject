/**
 * Extracts content between XML tags from AI response text.
 * Handles missing tags gracefully with empty string fallback.
 */
function extractTag(text: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Parses the narrative response, extracting content from <narrative> tags.
 */
export function parseNarrativeResponse(text: string): { narrative: string } {
  const narrative = extractTag(text, 'narrative');
  // If no tags found, treat the entire text as the narrative
  return { narrative: narrative || text.trim() };
}

/**
 * Parses the pilot design response, extracting structured fields.
 */
export function parsePilotResponse(text: string): {
  headway: string;
  vehicle: string;
  cost: string;
  grant: string;
} {
  return {
    headway: extractTag(text, 'headway'),
    vehicle: extractTag(text, 'vehicle'),
    cost: extractTag(text, 'cost'),
    grant: extractTag(text, 'grant'),
  };
}

/**
 * Progressively parses pilot response as it streams in.
 * Returns whatever tags have been completed so far.
 */
export function parsePartialPilotResponse(text: string): {
  headway: string;
  vehicle: string;
  cost: string;
  grant: string;
  isComplete: boolean;
} {
  const result = parsePilotResponse(text);
  const isComplete = !!(result.headway && result.vehicle && result.cost && result.grant);
  return { ...result, isComplete };
}
