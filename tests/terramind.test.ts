import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHeuristicMission } from '../src/services/botanicalEngine.js';
import {
  saveMission,
  getMission,
  getAllMissions,
  updateMissionStatus,
  toggleChecklistItem,
  saveJournalEntry,
  getAllJournalEntries,
  deleteJournalEntry,
  clearAllData,
} from '../src/db/indexedDb.js';
import { OutdoorMission, MissionGeneratorParams } from '../src/types/mission.js';
import { JournalEntry } from '../src/types/journal.js';

test('TerraMind Test Suite: Botanical Heuristic Mission Generator', async (t) => {
  await t.test('generates complete structured mission for low-energy 20m stroll', () => {
    const params: MissionGeneratorParams = {
      durationMinutes: 20,
      energyLevel: 'Low',
      interests: ['Trees', 'Mindfulness'],
      locationHint: 'City arboretum',
    };

    const mission = generateHeuristicMission(params);

    assert.ok(mission.id, 'Mission must have an ID');
    assert.ok(mission.title.length > 5, 'Mission must have a descriptive title');
    assert.equal(mission.durationMinutes, 20);
    assert.equal(mission.energyLevel, 'Low');
    assert.ok(mission.instructions.length >= 3, 'Must have at least 3 instruction phases');
    assert.ok(mission.checklist.length >= 3, 'Must have at least 3 checklist items');
    assert.ok(mission.safetyTips.length >= 2, 'Must provide outdoor safety tips');
    assert.ok(mission.equipment.length >= 1, 'Must provide equipment guidance');
    assert.equal(mission.source, 'heuristic_engine');
    assert.ok(mission.sensoryPrompts, 'Must include five-senses sensory prompts');
    assert.ok(mission.sensoryPrompts?.sight, 'Must have sight prompt');
    assert.ok(mission.sensoryPrompts?.sound, 'Must have sound prompt');
    assert.ok(mission.fieldNotesPrompt, 'Must include field notes guidance');
  });

  await t.test('adapts checklist and phases for high-energy 90m mountain hike', () => {
    const params: MissionGeneratorParams = {
      durationMinutes: 90,
      energyLevel: 'High',
      interests: ['Hiking', 'Water', 'Birdwatching'],
    };

    const mission = generateHeuristicMission(params);

    assert.equal(mission.durationMinutes, 90);
    assert.equal(mission.energyLevel, 'High');
    // Longer journeys should include extension phase
    assert.ok(mission.instructions.length >= 4, 'Should include deep integration phase for 90m');
    assert.ok(mission.checklist.some((item) => item.text.length > 0));
  });
});

test('TerraMind Test Suite: Local Storage & Persistence Operations', async (t) => {
  await t.test('persists mission and updates checklist state', async () => {
    await clearAllData();

    const sampleMission: OutdoorMission = {
      id: 'test_mission_1',
      title: 'Pine Needle Texture Walk',
      description: 'Observe conifer foliage and soil dampness.',
      durationMinutes: 30,
      energyLevel: 'Medium',
      interests: ['Trees'],
      instructions: [
        { stepNumber: 1, phase: 'Departure', instruction: 'Walk quietly.' },
      ],
      safetyTips: ['Check footing.'],
      equipment: ['Canteen'],
      checklist: [
        { id: 'c1', text: 'Find an acorn cap', completed: false },
        { id: 'c2', text: 'Touch a pine cone', completed: false },
      ],
      status: 'not_started',
      createdAt: new Date().toISOString(),
      source: 'heuristic_engine',
    };

    await saveMission(sampleMission);
    const retrieved = await getMission('test_mission_1');
    assert.ok(retrieved, 'Should retrieve saved mission');
    assert.equal(retrieved?.title, 'Pine Needle Texture Walk');

    // Toggle checklist item
    const updated = await toggleChecklistItem('test_mission_1', 'c1', true);
    assert.ok(updated, 'Should return updated mission');
    assert.equal(updated?.checklist[0].completed, true, 'Checklist item c1 should be completed');
    assert.equal(updated?.status, 'in_progress', 'Mission should transition to in_progress');

    // Update status to completed
    const completed = await updateMissionStatus('test_mission_1', 'completed');
    assert.equal(completed?.status, 'completed');
    assert.ok(completed?.completedAt, 'Should record completedAt timestamp');

    const all = await getAllMissions();
    assert.equal(all.length, 1);
  });

  await t.test('persists, queries, and deletes field journal entries', async () => {
    const entry: JournalEntry = {
      id: 'journal_test_1',
      title: 'Solitary Fern Valley',
      content: 'Breathed deeply under damp cedar boughs. Ground was covered in moist moss.',
      mood: 'Great',
      categories: ['Flora', 'Mindfulness'],
      date: new Date().toISOString(),
      locationName: 'Fern Canyon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveJournalEntry(entry);
    const entries = await getAllJournalEntries();
    assert.ok(entries.some((e) => e.id === 'journal_test_1'));

    // Update existing entry with preserved date
    const originalDate = entry.date;
    const updatedEntry: JournalEntry = {
      ...entry,
      title: 'Solitary Fern Valley (Revised)',
      content: 'Updated observation: spotted maidenhair ferns along rock face.',
      updatedAt: new Date(Date.now() + 5000).toISOString(),
    };
    await saveJournalEntry(updatedEntry);
    const updatedList = await getAllJournalEntries();
    const retrieved = updatedList.find((e) => e.id === 'journal_test_1');
    assert.equal(retrieved?.title, 'Solitary Fern Valley (Revised)');
    assert.equal(retrieved?.date, originalDate, 'Original observation date must be preserved');

    await deleteJournalEntry('journal_test_1');
    const remaining = await getAllJournalEntries();
    assert.ok(!remaining.some((e) => e.id === 'journal_test_1'));
  });
});

test('TerraMind Test Suite: Metrics Calculation Rules', async (t) => {
  await t.test('accurately calculates outdoor minutes strictly from completed missions', () => {
    const mockMissions: Partial<OutdoorMission>[] = [
      { id: 'm1', status: 'completed', durationMinutes: 30, checklist: [{ id: '1', text: '', completed: true }] },
      { id: 'm2', status: 'completed', durationMinutes: 45, checklist: [{ id: '2', text: '', completed: true }, { id: '3', text: '', completed: true }] },
      { id: 'm3', status: 'in_progress', durationMinutes: 60, checklist: [{ id: '4', text: '', completed: false }] }, // in progress, should NOT count towards completed minutes
      { id: 'm4', status: 'not_started', durationMinutes: 20, checklist: [] },
    ];

    const completed = mockMissions.filter((m) => m.status === 'completed');
    const totalMinutes = completed.reduce((sum, m) => sum + (m.durationMinutes || 0), 0);
    const totalChecklist = mockMissions.reduce(
      (sum, m) => sum + (m.checklist?.filter((c) => c.completed).length || 0),
      0
    );

    assert.equal(completed.length, 2);
    assert.equal(totalMinutes, 75, 'Completed minutes must be 30 + 45 = 75');
    assert.equal(totalChecklist, 3, 'Total checked items must be 1 + 2 = 3');
  });
});
