import { NextRequest } from 'next/server';
import { anthropic } from '@/lib/ai/client';
import { PILOT_PROMPT } from '@/lib/ai/prompts';
import { parsePilotResponse } from '@/lib/ai/parser';
import { getCached, setCached, corridorCacheKey, coordsCacheKey } from '@/lib/cache/kv';
import { getFallback } from '@/lib/cache/fallback';

export async function POST(request: NextRequest) {
  try {
    const { corridorId, corridorName, score, demand, center } = (await request.json()) as {
      corridorId: string;
      corridorName: string;
      score: number;
      demand: {
        zeroCar: number;
        employment: number;
        poverty: number;
        corridorLength?: number;
      };
      center?: [number, number];
    };

    // Check cache — coordinate-based for searches, ID-based for presets
    const cacheKey = center
      ? coordsCacheKey(center, 'pilot')
      : corridorCacheKey(corridorId, 'pilot');
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Build prompt
    const prompt = PILOT_PROMPT(corridorName, score, demand);

    // Stream from Anthropic
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

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

          // Cache structured pilot data
          await setCached(cacheKey, fullText, 86400);

          controller.close();
        } catch (error) {
          console.error('Pilot stream error:', error);
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
    console.error('Pilot route error:', error);

    // Try fallback
    try {
      const body = await request.clone().json();
      const fallback = getFallback(body.corridorId);
      if (fallback) {
        const pilotText = `<headway>${fallback.pilot.headway}</headway>\n<vehicle>${fallback.pilot.vehicle}</vehicle>\n<cost>${fallback.pilot.cost}</cost>\n<grant>${fallback.pilot.grant}</grant>`;
        return new Response(pilotText, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    } catch {}

    return new Response('Pilot design generation is temporarily unavailable.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
