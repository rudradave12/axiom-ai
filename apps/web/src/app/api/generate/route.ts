import { NextResponse } from 'next/server';

// High-fidelity fallback simulated provider (Demo Mode)
function handleDemoResponse(prompt: string): Response {
  const isJsonRequest = prompt.toLowerCase().includes('json') || prompt.toLowerCase().includes('schema');
  
  if (isJsonRequest) {
    if (prompt.toLowerCase().includes('timeline') || prompt.toLowerCase().includes('schedule')) {
      return NextResponse.json({
        text: JSON.stringify({
          milestones: [
            { id: 'm1', title: 'Milestone A: Research & Discovery Mappings', date: '2026-07-05', phaseId: 'phase-1' },
            { id: 'm2', title: 'Milestone B: Architecture Setup & Core Integration', date: '2026-07-15', phaseId: 'phase-2' },
            { id: 'm3', title: 'Milestone C: Production Ready Validation Tests', date: '2026-07-28', phaseId: 'phase-3' }
          ]
        })
      });
    }
    
    if (prompt.toLowerCase().includes('task') || prompt.toLowerCase().includes('checklist')) {
      return NextResponse.json({
        text: JSON.stringify({
          tasks: [
            { id: 't1', title: 'Define target objective constraints & timeline bounds', phaseId: 'phase-1', status: 'todo' },
            { id: 't2', title: 'Establish modular database schema interfaces', phaseId: 'phase-1', status: 'todo' },
            { id: 't3', title: 'Implement functional viewports and custom sidebar panels', phaseId: 'phase-2', status: 'todo' },
            { id: 't4', title: 'Perform end-to-end integration and run validation tests', phaseId: 'phase-3', status: 'todo' }
          ]
        })
      });
    }
    
    if (prompt.toLowerCase().includes('graph') || prompt.toLowerCase().includes('dependency') || prompt.toLowerCase().includes('concept')) {
      return NextResponse.json({
        text: JSON.stringify({
          nodes: [
            { id: 'n1', label: 'Initial Discovery', type: 'concept' },
            { id: 'n2', label: 'Architecture Setup', type: 'concept' },
            { id: 'n3', label: 'Feature Assembly', type: 'concept' }
          ],
          edges: [
            { from: 'n1', to: 'n2' },
            { from: 'n2', to: 'n3' }
          ]
        })
      });
    }
    
    // Default Planner (Roadmap JSON)
    return NextResponse.json({
      text: JSON.stringify({
        title: 'Compiled Execution Plan',
        phases: [
          { id: 'phase-1', title: 'Phase 1: Foundation Mappings', description: 'Core baseline setup and information discovery.' },
          { id: 'phase-2', title: 'Phase 2: Core Execution & Development', description: 'Deep-dive implementation of key mechanics.' },
          { id: 'phase-3', title: 'Phase 3: Deployment & Refinement', description: 'Validation checks and final environment alignment.' }
        ]
      })
    });
  }

  // Conversational / Chat responses fallback
  let responseText = "I have updated your execution workspace for this track. Let's start mapping out your timeline and configuring milestones. Tell me: what specific timeline or deadlines do we need to target for this mission?";
  if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
    responseText = "Welcome back, Commander. I am ready to compile your execution paths. What would you like to accomplish today?";
  } else if (prompt.toLowerCase().includes('cloud') || prompt.toLowerCase().includes('engineer')) {
    responseText = "Excellent. A Career track for Cloud Engineering. We should focus on: AWS certifications, Infrastructure as Code (Terraform), and containerization (Docker/Kubernetes). Shall we draft a skill gap roadmap first?";
  }
  
  return NextResponse.json({ text: responseText });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const bodyData = await req.json() as {
      prompt: string;
      systemInstruction?: string;
      mimeType?: string;
      base64Data?: string;
      stream?: boolean;
    };

    const { prompt, systemInstruction, mimeType, base64Data, stream } = bodyData;
    
    // 1. Identify which AI Key is configured
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || '';
    const openrouterKey = process.env.OPENROUTER_API_KEY || '';
    
    const clientKey = req.headers.get('x-gemini-key') || '';
    
    // Choose Provider Layer
    if (geminiKey || clientKey) {
      const apiKey = geminiKey || clientKey;
      const model = 'gemini-2.0-flash';
      const isStream = stream === true;
      const endpoint = isStream ? 'streamGenerateContent' : 'generateContent';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${apiKey}`;

      const contents = [{
        role: 'user',
        parts: [{ text: prompt }] as Array<Record<string, unknown>>
      }];

      if (mimeType && base64Data) {
        contents[0].parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const payload: Record<string, unknown> = { contents };
      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const isJsonRequest = prompt.toLowerCase().includes('json') || prompt.toLowerCase().includes('schema');
      if (isJsonRequest) {
        payload.generationConfig = {
          responseMimeType: 'application/json'
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Gemini error: ${errText}` }, { status: response.status });
      }

      if (isStream) {
        const reader = response.body?.getReader();
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
          async start(controller: ReadableStreamDefaultController): Promise<void> {
            if (!reader) {
              controller.close();
              return;
            }
            const decoder = new TextDecoder();
            try {
              let active = true;
              while (active) {
                const { done, value } = await reader.read();
                if (done) {
                  active = false;
                  break;
                }
                const chunkText = decoder.decode(value, { stream: true });
                controller.enqueue(encoder.encode(chunkText));
              }
            } catch (e) {
              controller.error(e);
            } finally {
              controller.close();
            }
          }
        });

        return new Response(customStream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive'
          }
        });
      } else {
        const result = await response.json() as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return NextResponse.json({ text });
      }
    } 
    
    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Groq error: ${errText}` }, { status: response.status });
      }

      const result = await response.json() as {
        choices?: Array<{
          message?: { content?: string };
        }>;
      };
      const text = result.choices?.[0]?.message?.content || '';
      return NextResponse.json({ text });
    }

    if (openrouterKey) {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3-8b-instruct',
          messages: [
            ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `OpenRouter error: ${errText}` }, { status: response.status });
      }

      const result = await response.json() as {
        choices?: Array<{
          message?: { content?: string };
        }>;
      };
      const text = result.choices?.[0]?.message?.content || '';
      return NextResponse.json({ text });
    }

    // 2. Default to High-fidelity simulated Demo Mode if no keys are provided
    return handleDemoResponse(prompt);
    
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
