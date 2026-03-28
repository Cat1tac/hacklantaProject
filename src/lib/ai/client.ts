import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Converts an Anthropic SDK message stream into a Web API ReadableStream.
 * This bridges the Anthropic streaming protocol with Next.js Response streaming.
 */
export function streamToResponse(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let fullText = '';

  return new ReadableStream({
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
        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });
}

/**
 * Collects the full text from an Anthropic message stream.
 * Used when we need to cache the complete response.
 */
export async function collectStreamText(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>
): Promise<string> {
  let fullText = '';
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text;
    }
  }
  return fullText;
}
