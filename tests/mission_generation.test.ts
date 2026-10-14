import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMissionWithOllama,
  fetchOllamaModels,
  matchesModelName,
  resolveActualModelName,
  OllamaError,
  safeFetchJson,
} from '../src/services/ollamaClient.js';
import { generateMission } from '../src/services/aiProvider.js';
import { MissionGeneratorParams } from '../src/types/mission.js';
import { DEFAULT_SETTINGS, AppSettings } from '../src/types/settings.js';
import { normalizeOllamaUrl } from '../src/services/environment.js';

const mockParams: MissionGeneratorParams = {
  durationMinutes: 30,
  energyLevel: 'Medium',
  interests: ['Trees', 'Mindfulness'],
  locationHint: 'Redwood Grove',
};

test('TerraMind Mission Generation Resilience & Diagnostics', async (t) => {
  // Helper to temporarily intercept globalThis.fetch
  const originalFetch = globalThis.fetch;

  t.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  await t.test('Case 1: Ollama is available and configured model exists -> succeeds with structured mission', async () => {
    const validModelJson = JSON.stringify({
      title: 'Redwood Canopy & Scent Survey',
      description: 'Observe tall conifers and damp earth aromas.',
      durationMinutes: 30,
      energyLevel: 'Medium',
      instructions: [
        { stepNumber: 1, phase: 'Arrive & Settle', instruction: 'Breathe deeply under the trees.' },
        { stepNumber: 2, phase: 'Canopy Observation', instruction: 'Look up through the branches.' },
      ],
      safetyTips: ['Watch for root trips.'],
      equipment: ['Canteen'],
      checklist: ['Find 2 moss patches', 'Touch conifer bark'],
    });

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          response: validModelJson,
          model: 'llama3.2',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    const mission = await generateMissionWithOllama(mockParams, 'http://localhost:11434', 'llama3.2', 'proxy');

    assert.ok(mission.id);
    assert.equal(mission.title, 'Redwood Canopy & Scent Survey');
    assert.equal(mission.durationMinutes, 30);
    assert.equal(mission.source, 'ollama');
    assert.equal(mission.status, 'not_started');
    assert.ok(mission.instructions.length >= 2);
    assert.ok(mission.checklist.length >= 2);
    assert.ok(mission.sensoryPrompts);
  });

  await t.test('Case 2: Ollama is unavailable -> throws OllamaError with UNREACHABLE and actionable message', async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'ECONNREFUSED',
          error: 'Could not reach Ollama at http://127.0.0.1:11434. Is the service running?',
          hint: 'Ensure Ollama is running (`ollama serve`) and the model is pulled.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await generateMissionWithOllama(mockParams, 'http://localhost:11434', 'llama3.2', 'proxy');
      },
      (err: any) => {
        assert.ok(err instanceof OllamaError, 'Must be instance of OllamaError');
        assert.equal(err.code, 'UNREACHABLE');
        assert.ok(err.message.includes('Could not reach Ollama') || err.message.includes('503'));
        assert.ok(err.hint, 'Must include actionable hint');
        return true;
      }
    );
  });

  await t.test('Case 3: Configured model does not exist -> throws OllamaError with MODEL_NOT_FOUND and pull hint', async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          ok: false,
          code: 'MODEL_NOT_FOUND',
          error: 'Model "nonexistent-model" not found in Ollama library.',
          hint: 'Run `ollama pull nonexistent-model` in your terminal to download this model.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await generateMissionWithOllama(mockParams, 'http://localhost:11434', 'nonexistent-model', 'proxy');
      },
      (err: any) => {
        assert.ok(err instanceof OllamaError);
        assert.equal(err.code, 'MODEL_NOT_FOUND');
        assert.ok(err.hint?.includes('ollama pull'));
        return true;
      }
    );
  });

  await t.test('Case 4: API URL returns an HTML 404 page -> does NOT crash with SyntaxError "<!doctype", returns clear diagnostic', async () => {
    const htmlPage = '<!doctype html><html><head><title>404 Not Found</title></head><body><h1>404 Not Found</h1></body></html>';

    globalThis.fetch = async () => {
      return new Response(htmlPage, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    };

    await assert.rejects(
      async () => {
        await generateMissionWithOllama(mockParams, 'http://localhost:11434', 'llama3.2', 'proxy');
      },
      (err: any) => {
        assert.ok(err instanceof OllamaError, 'Must throw OllamaError, not raw SyntaxError');
        assert.ok(
          !err.message.includes('is not valid JSON'),
          `Should not fail with raw JSON parse error, received: ${err.message}`
        );
        assert.ok(err.message.includes('Expected JSON but received HTTP 404'));
        assert.ok(err.message.includes('Response preview: <!doctype html>'));
        return true;
      }
    );
  });

  await t.test('Case 5: Model returns malformed JSON -> throws OllamaError with INVALID_JSON without crashing', async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          response: 'Here is your mission:\n{ broken json without closing braces',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    };

    await assert.rejects(
      async () => {
        await generateMissionWithOllama(mockParams, 'http://localhost:11434', 'llama3.2', 'proxy');
      },
      (err: any) => {
        assert.ok(err instanceof OllamaError);
        assert.equal(err.code, 'INVALID_JSON');
        assert.ok(err.hint?.includes('Offline Heuristic') || err.message.includes('invalid JSON'));
        return true;
      }
    );
  });

  await t.test('Case 6: User selects the offline fallback -> generates complete structured mission with transparent provenance', async () => {
    const fallbackSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      connectionMode: 'offline_demo',
    };

    const result = await generateMission(mockParams, fallbackSettings, false);

    assert.equal(result.source, 'heuristic_engine');
    assert.equal(result.modelUsed, 'Offline Botanical Heuristic Engine v2.4 (Rule-Based)');
    assert.ok(result.mission.title.length > 5);
    assert.equal(result.mission.durationMinutes, 30);
    assert.equal(result.mission.energyLevel, 'Medium');
    assert.ok(result.mission.locationHint?.includes('Redwood'));
    assert.ok(result.mission.instructions.length >= 3);
    assert.ok(result.mission.checklist.length >= 2);
    assert.ok(result.mission.sensoryPrompts?.sight);

    // Also test forceHeuristic override parameter
    const forcedResult = await generateMission(mockParams, DEFAULT_SETTINGS, true);
    assert.equal(forcedResult.source, 'heuristic_engine');
  });

  await t.test('Model detection: matchesModelName normalizes :latest tag correctly without false positives', () => {
    // Untagged "llama3.2" matches installed "llama3.2:latest" and vice versa
    assert.equal(matchesModelName('llama3.2', 'llama3.2:latest'), true);
    assert.equal(matchesModelName('llama3.2:latest', 'llama3.2'), true);
    assert.equal(matchesModelName('llama3.2', 'llama3.2'), true);
    assert.equal(matchesModelName('llama3.2:latest', 'llama3.2:latest'), true);

    // llama3 matches llama3:latest
    assert.equal(matchesModelName('llama3', 'llama3:latest'), true);

    // Exact tag match works
    assert.equal(matchesModelName('gemma2:2b', 'gemma2:2b'), true);
    assert.equal(matchesModelName('qwen3.5:4b', 'qwen3.5:4b'), true);
    assert.equal(matchesModelName('qwen3.5:0.8b', 'qwen3.5:0.8b'), true);

    // Untagged "gemma2" (which defaults to :latest, i.e. 9B) must NOT match "gemma2:2b"
    assert.equal(matchesModelName('gemma2', 'gemma2:2b'), false);

    // Untagged "qwen3.5" must NOT falsely match "qwen3.5:4b" or "qwen3.5:0.8b"
    assert.equal(matchesModelName('qwen3.5', 'qwen3.5:4b'), false);
    assert.equal(matchesModelName('qwen3.5', 'qwen3.5:0.8b'), false);

    // Distinct models do not match
    assert.equal(matchesModelName('mistral', 'llama3.2:latest'), false);
    assert.equal(matchesModelName('phi3', 'gemma2:2b'), false);
  });

  await t.test('Model resolution: resolveActualModelName returns actual tag from Ollama /api/tags', () => {
    const installed = [
      { name: 'llama3.2:latest' },
      { name: 'gemma2:2b' },
      { name: 'qwen3.5:4b' },
      { name: 'llama3:latest' },
      { name: 'qwen3.5:0.8b' },
    ];

    // Requested "llama3.2" resolves to actual installed tag "llama3.2:latest"
    assert.equal(resolveActualModelName('llama3.2', installed), 'llama3.2:latest');

    // Requested "llama3" resolves to actual installed tag "llama3:latest"
    assert.equal(resolveActualModelName('llama3', installed), 'llama3:latest');

    // Requested "gemma2:2b" resolves to "gemma2:2b"
    assert.equal(resolveActualModelName('gemma2:2b', installed), 'gemma2:2b');

    // Nonexistent model returns original name when not found
    assert.equal(resolveActualModelName('nonexistent-model', installed), 'nonexistent-model');
  });

  await t.test('generateMission resolves model to actual tag from /api/tags and rejects unavailable models', async () => {
    let requestedGenerateModel = '';

    globalThis.fetch = async (url: any, opts: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/ollama/tags') || urlStr.includes('/api/tags')) {
        return new Response(
          JSON.stringify({
            ok: true,
            models: [
              { name: 'llama3.2:latest' },
              { name: 'gemma2:2b' },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/api/ollama/generate') || urlStr.includes('/api/generate')) {
        const body = JSON.parse(opts.body);
        requestedGenerateModel = body.model;
        return new Response(
          JSON.stringify({
            ok: true,
            response: JSON.stringify({
              title: 'Forest Trail Explorer',
              description: 'Step into the cedar woodland.',
              instructions: [{ stepNumber: 1, phase: 'Walk', instruction: 'Walk quietly.' }],
              checklist: ['Cedar cone'],
            }),
            model: requestedGenerateModel,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ ok: false }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    };

    // When configured with "llama3.2", it resolves and passes "llama3.2:latest"
    const settingsWithUntagged: AppSettings = {
      ...DEFAULT_SETTINGS,
      ollamaModel: 'llama3.2',
    };

    const result = await generateMission(mockParams, settingsWithUntagged);
    assert.equal(requestedGenerateModel, 'llama3.2:latest');
    assert.ok(result.modelUsed.includes('llama3.2:latest'));

    // When configured with an unavailable model "mistral", it throws MODEL_NOT_FOUND without generating
    const settingsWithMissing: AppSettings = {
      ...DEFAULT_SETTINGS,
      ollamaModel: 'mistral',
    };

    await assert.rejects(
      async () => {
        await generateMission(mockParams, settingsWithMissing);
      },
      (err: any) => {
        assert.ok(err instanceof OllamaError);
        assert.equal(err.code, 'MODEL_NOT_FOUND');
        assert.ok(err.message.includes('mistral'));
        assert.ok(err.hint?.includes('ollama pull mistral'));
        return true;
      }
    );
  });
});
