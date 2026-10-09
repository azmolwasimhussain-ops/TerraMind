import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMissionWithOllama, OllamaError, safeFetchJson } from '../src/services/ollamaClient.js';
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

  await t.test('URL Normalization utility handles varied inputs safely', () => {
    assert.equal(normalizeOllamaUrl('http://localhost:11434/'), 'http://localhost:11434');
    assert.equal(normalizeOllamaUrl('http://localhost:11434/api'), 'http://localhost:11434');
    assert.equal(normalizeOllamaUrl('http://localhost:11434/api/'), 'http://localhost:11434');
    assert.equal(normalizeOllamaUrl('localhost:11434'), 'http://localhost:11434');
    assert.equal(normalizeOllamaUrl('https://my-ollama-tunnel.ngrok-free.app/'), 'https://my-ollama-tunnel.ngrok-free.app');
  });
});
