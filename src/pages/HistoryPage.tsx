import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { OutdoorMission } from '../types/mission';
import {
  getAllMissions,
  deleteMission,
  updateMissionStatus,
} from '../db/indexedDb';

interface HistoryPageProps {
  onSelectMission: (mission: OutdoorMission) => void;
  onNavigateToGenerator: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectMission,
  onNavigateToGenerator,
}) => {
  const [missions, setMissions] = useState<OutdoorMission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [missionToDelete, setMissionToDelete] = useState<OutdoorMission | null>(null);

  const loadMissions = async () => {
    try {
      setIsLoading(true);
      const list = await getAllMissions();
      setMissions(list);
    } catch (err) {
      console.error('Failed to load missions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, []);

  const handleDeleteConfirmed = async () => {
    if (!missionToDelete) return;
    await deleteMission(missionToDelete.id);
    setMissionToDelete(null);
    await loadMissions();
  };

  const handleMarkComplete = async (m: OutdoorMission, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateMissionStatus(m.id, 'completed', new Date().toISOString());
    await loadMissions();
  };

  // Accurate Metrics calculated strictly from real user data
  const completedMissions = missions.filter((m) => m.status === 'completed');
  const totalCompletedCount = completedMissions.length;
  const totalMinutesOutdoors = completedMissions.reduce(
    (sum, m) => sum + (m.durationMinutes || 0),
    0
  );
  const totalChecklistItemsCompleted = missions.reduce(
    (sum, m) => sum + m.checklist.filter((c) => c.completed).length,
    0
  );

  const filteredMissions = missions.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.status === statusFilter;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#1b5e46]">
            <Compass className="h-4 w-4" />
            <span>Progress & Expedition Archive</span>
          </div>
          <h1 className="font-serif-nature text-3xl sm:text-4xl font-bold text-[#0f291e]">
            Mission History
          </h1>
          <p className="text-xs sm:text-sm text-[#4c6b5d] mt-1">
            Tracking your actual outdoor time and completed sensory checklists.
          </p>
        </div>

        <button
          onClick={onNavigateToGenerator}
          className="flex items-center gap-2 rounded-xl bg-[#1b5e46] px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#134835] transition active:scale-[0.98] shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>New Mission</span>
        </button>
      </div>

      {/* Honest Metrics Summary Cards (No Fake Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="rounded-2xl border border-[#dce7e1] bg-white p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#527364]">
            <span>Completed Missions</span>
            <CheckCircle2 className="h-4 w-4 text-[#1b5e46]" />
          </div>
          <div className="font-serif-nature text-3xl font-bold text-[#0f291e] tabular-nums">
            {totalCompletedCount}
          </div>
          <p className="text-[11px] text-[#6b8c7c]">
            {totalCompletedCount === 0
              ? 'No missions completed yet'
              : `${totalCompletedCount} recorded outdoor expeditions`}
          </p>
        </div>

        <div className="rounded-2xl border border-[#dce7e1] bg-white p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#527364]">
            <span>Recorded Outdoor Time</span>
            <Clock className="h-4 w-4 text-[#1b5e46]" />
          </div>
          <div className="font-serif-nature text-3xl font-bold text-[#0f291e] tabular-nums">
            {totalMinutesOutdoors >= 60
              ? `${Math.floor(totalMinutesOutdoors / 60)}h ${totalMinutesOutdoors % 60}m`
              : `${totalMinutesOutdoors} mins`}
          </div>
          <p className="text-[11px] text-[#6b8c7c]">
            Calculated strictly from completed expeditions
          </p>
        </div>

        <div className="rounded-2xl border border-[#dce7e1] bg-white p-6 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#527364]">
            <span>Sensory Items Discovered</span>
            <Compass className="h-4 w-4 text-[#1b5e46]" />
          </div>
          <div className="font-serif-nature text-3xl font-bold text-[#0f291e] tabular-nums">
            {totalChecklistItemsCompleted}
          </div>
          <p className="text-[11px] text-[#6b8c7c]">
            Individual natural cues checked off in the field
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#dce7e1] mb-6 w-fit overflow-x-auto shadow-sm">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            statusFilter === 'all'
              ? 'bg-[#1b5e46] text-white font-semibold'
              : 'text-[#527364] hover:text-[#0f291e]'
          }`}
        >
          All Missions ({missions.length})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            statusFilter === 'completed'
              ? 'bg-[#1b5e46] text-white font-semibold'
              : 'text-[#527364] hover:text-[#0f291e]'
          }`}
        >
          Completed ({completedMissions.length})
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            statusFilter === 'in_progress'
              ? 'bg-[#1b5e46] text-white font-semibold'
              : 'text-[#527364] hover:text-[#0f291e]'
          }`}
        >
          In Progress ({missions.filter((m) => m.status === 'in_progress').length})
        </button>
        <button
          onClick={() => setStatusFilter('not_started')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
            statusFilter === 'not_started'
              ? 'bg-[#1b5e46] text-white font-semibold'
              : 'text-[#527364] hover:text-[#0f291e]'
          }`}
        >
          Not Started ({missions.filter((m) => m.status === 'not_started').length})
        </button>
      </div>

      {/* Missions List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#527364]">
          Loading missions history...
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#bcdbc8] bg-white p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="h-14 w-14 rounded-full bg-[#eef6f1] border border-[#bcdbc8] mx-auto flex items-center justify-center text-[#1b5e46]">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
            {missions.length === 0 ? 'No outdoor missions recorded yet' : 'No missions in this category'}
          </h3>
          <p className="text-xs text-[#527364] leading-relaxed">
            {missions.length === 0
              ? 'Ready to head outside? Use the generator to create your first outdoor mission.'
              : 'Try selecting "All Missions" to view your saved expeditions.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToGenerator}
              className="rounded-xl bg-[#1b5e46] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
            >
              Generate First Mission
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMissions.map((m) => {
            const completedCount = m.checklist.filter((c) => c.completed).length;
            const totalCount = m.checklist.length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const dateStr = new Date(m.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={m.id}
                onClick={() => onSelectMission(m)}
                className="group rounded-2xl border border-[#dce7e1] bg-white p-5 sm:p-6 hover:border-[#bcdbc8] hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
              >
                {/* Left Info */}
                <div className="space-y-2.5 flex-1">
                  {/* Unboxed Metadata (Zero-Pill Discipline) */}
                  <div className="flex items-center gap-2 text-xs text-[#527364] flex-wrap">
                    <span
                      className={`font-semibold ${
                        m.status === 'completed'
                          ? 'text-[#1b5e46]'
                          : m.status === 'in_progress'
                          ? 'text-amber-700'
                          : 'text-[#527364]'
                      }`}
                    >
                      {m.status === 'completed'
                        ? 'Completed'
                        : m.status === 'in_progress'
                        ? 'In Progress'
                        : 'Saved'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{m.durationMinutes} Minutes</span>
                    <span aria-hidden="true">·</span>
                    <span>{m.energyLevel} Energy</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={m.createdAt}>{dateStr}</time>
                  </div>

                  <h3 className="font-serif-nature text-xl font-bold text-[#0f291e] group-hover:text-[#1b5e46] transition">
                    {m.title}
                  </h3>

                  <p className="text-xs text-[#486657] line-clamp-2 max-w-2xl leading-relaxed">
                    {m.description}
                  </p>

                  {/* Checklist progress bar */}
                  <div className="pt-1 max-w-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#527364]">
                      <span>Checklist Progress</span>
                      <span className="tabular-nums font-mono font-medium">
                        {completedCount}/{totalCount} ({percent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#e2ede5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1b5e46] rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {m.status !== 'completed' && (
                    <button
                      onClick={(e) => handleMarkComplete(m, e)}
                      className="px-3 py-2 rounded-lg border border-[#bcdbc8] bg-[#eef6f1] text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition"
                      title="Mark mission complete"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMission(m);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1b5e46] text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Open Mode</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMissionToDelete(m);
                    }}
                    className="p-2 rounded-lg text-[#7d9e8f] hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete mission"
                    aria-label="Delete mission"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {missionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-center space-y-4 shadow-2xl text-stone-900">
            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif-nature text-lg font-bold text-stone-900">
                Delete Outdoor Mission?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                "{missionToDelete.title}" and its checklist history will be permanently deleted from your local storage.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleDeleteConfirmed}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
              >
                Yes, Delete Mission
              </button>
              <button
                onClick={() => setMissionToDelete(null)}
                className="w-full rounded-xl border border-stone-200 bg-stone-100 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
