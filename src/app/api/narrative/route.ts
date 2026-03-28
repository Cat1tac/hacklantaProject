import { NextRequest } from 'next/server';
import { anthropic, streamToResponse } from '@/lib/ai/client';
import { NARRATIVE_PROMPT } from '@/lib/ai/prompts';
import { getCached, setCached, corridorCacheKey, coordsCacheKey } from '@/lib/cache/kv';
import { getFallback } from '@/lib/cache/fallback';
import type { DemandFactor } from '@/lib/scoring/types';

export async function POST(request: NextRequest) {
  try {
    const { corridorId, corridorName, score, factors, peerCity, center } =
      (await request.json()) as {
        corridorId: string;
        corridorName: string;
        score: number;
        factors: DemandFactor[];
        peerCity: { city: string; corridor: string; ridershipLift: number; year: number } | null;
        center?: [number, number];
      };

    // Check cache — coordinate-based for searches, ID-based for presets
    const cacheKey = center
      ? coordsCacheKey(center, 'narrative')
      : corridorCacheKey(corridorId, 'narrative');
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Build prompt
    const prompt = NARRATIVE_PROMPT(corridorName, score, factors, peerCity);

    // Stream from Anthropic
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    // Collect full text for caching while streaming
    let fullText = '';
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text;
              fullText += text;
              controller.enqueue(encoder.encode(text));
            }
          }

          // Cache the full response after streaming completes
          await setCached(cacheKey, fullText, 86400);

          controller.close();
        } catch (error) {
          console.error('Narrative stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Narrative route error:', error);

    // Try to get fallback
    try {
      const body = await request.clone().json();
      const fallback = getFallback(body.corridorId);
      if (fallback) {
        return new Response(fallback.narrative, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    } catch {}

    return new Response('Analysis generation is temporarily unavailable.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
