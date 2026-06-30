
/**
 * Secure Gemini API client utilizing the `/api/generate` Next.js server proxy.
 */
export async function callGeminiAPI(
  prompt: string,
  systemInstruction?: string,
  mimeType?: string,
  base64Data?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const url = '/api/generate';
  const body: Record<string, unknown> = {
    prompt,
    systemInstruction,
    mimeType,
    base64Data,
    stream: !!onChunk
  };

  const clientKey = typeof window !== 'undefined' ? localStorage.getItem('axiom_gemini_key') || '' : '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (clientKey) {
    headers['x-gemini-key'] = clientKey;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Gateway Error ${response.status}: ${errText}`);
    }

    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      
      try {
        let active = true;
        while (active) {
          const { done, value } = await reader.read();
          if (done) {
            active = false;
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          
          // Regex pattern matching "text": "..." securely in Gemini JSON responses
          const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
          let match;
          while ((match = regex.exec(chunk)) !== null) {
            const matchedText = match[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            accumulatedText += matchedText;
            onChunk(accumulatedText);
          }
        }
      } catch (streamErr) {
        console.warn('Streaming reader interrupted:', streamErr);
      }
      return accumulatedText;
    } else {
      const result = await response.json() as { text?: string };
      if (!result.text) {
        throw new Error('Empty response payload returned from AI Gateway.');
      }
      return result.text;
    }
  } catch (err: unknown) {
    console.error('Secure callGeminiAPI failure:', err);
    throw err;
  }
}
