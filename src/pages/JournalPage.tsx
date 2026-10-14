import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  Smile,
  Trash2,
  Edit3,
  Compass,
  Tag,
  AlertCircle,
  X,
  Check,
  CloudSun,
  MapPin,
  ArrowUpDown,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  JournalEntry,
  JournalMood,
  JournalCategory,
} from '../types/journal';
import { OutdoorMission } from '../types/mission';
import {
  getAllJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from '../db/indexedDb';

const ALL_CATEGORIES: JournalCategory[] = [
  'Flora',
  'Fauna',
  'Weather',
  'Sensory',
  'Mindfulness',
  'Soil & Water',
  'Sky',
  'Foraged & Found',
];

const MOODS: { mood: JournalMood; label: string; icon: string }[] = [
  { mood: 'Great', label: 'Radiant', icon: '🌿' },
  { mood: 'Good', label: 'Grounded', icon: '🍃' },
  { mood: 'Okay', label: 'Quiet', icon: '🌾' },
  { mood: 'Meh', label: 'Distracted', icon: '🍂' },
];

interface JournalPageProps {
  initialMissionToLog?: OutdoorMission | null;
  onClearInitialMission?: () => void;
  onNavigateToGenerator?: () => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  initialMissionToLog,
  onClearInitialMission,
  onNavigateToGenerator,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Form State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState<JournalMood>('Great');
  const [formCategories, setFormCategories] = useState<JournalCategory[]>(['Flora', 'Sensory']);
  const [formLocation, setFormLocation] = useState('');
  const [formWeather, setFormWeather] = useState('');
  const [formMissionId, setFormMissionId] = useState<string | undefined>(undefined);
  const [formMissionTitle, setFormMissionTitle] = useState<string | undefined>(undefined);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Detail View & Delete State
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<JournalEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Load entries from IndexedDB
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const list = await getAllJournalEntries();
      setEntries(list);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Pre-fill if navigated from completing a mission
  useEffect(() => {
    if (initialMissionToLog) {
      setEditingEntryId(null);
      setFormTitle(`Notes on: ${initialMissionToLog.title}`);
      setFormContent(
        `Field reflection after completing ${initialMissionToLog.durationMinutes} minutes of outdoor exploration.\n\nKey observations:\n- `
      );
      setFormMood('Great');
      setFormMissionId(initialMissionToLog.id);
      setFormMissionTitle(initialMissionToLog.title);
      setFormLocation(initialMissionToLog.locationHint || '');
      setFormCategories(['Mindfulness', 'Flora']);
      setIsEditorOpen(true);
      if (onClearInitialMission) onClearInitialMission();
    }
  }, [initialMissionToLog, onClearInitialMission]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleOpenNewEntry = () => {
    setEditingEntryId(null);
    setFormTitle('');
    setFormContent('');
    setFormMood('Good');
    setFormCategories(['Sensory']);
    setFormLocation('');
    setFormWeather('');
    setFormMissionId(undefined);
    setFormMissionTitle(undefined);
    setFormValidationError(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (entry: JournalEntry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingEntryId(entry.id);
    setFormTitle(entry.title || '');
    setFormContent(entry.content);
    setFormMood(entry.mood);
    setFormCategories(entry.categories || []);
    setFormLocation(entry.locationName || '');
    setFormWeather(entry.weatherNotes || '');
    setFormMissionId(entry.missionId);
    setFormMissionTitle(entry.missionTitle);
    setFormValidationError(null);
    setSelectedEntryForDetail(null);
    setIsEditorOpen(true);
  };

  const toggleCategory = (cat: JournalCategory) => {
    setFormCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formContent.trim();
    if (trimmed.length < 5) {
      setFormValidationError('Observation must be at least 5 characters long to record meaningful sensory detail.');
      return;
    }

    const now = new Date().toISOString();
    const existingEntry = editingEntryId ? entries.find((item) => item.id === editingEntryId) : undefined;
    const entry: JournalEntry = {
      id: editingEntryId || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: formTitle.trim() || undefined,
      content: trimmed,
      mood: formMood,
      categories: formCategories.length > 0 ? formCategories : ['Sensory'],
      date: existingEntry?.date || now,
      locationName: formLocation.trim() || undefined,
      weatherNotes: formWeather.trim() || undefined,
      missionId: formMissionId,
      missionTitle: formMissionTitle,
      createdAt: existingEntry?.createdAt || now,
      updatedAt: now,
    };

    await saveJournalEntry(entry);
    await loadEntries();
    setIsEditorOpen(false);
    showToast(editingEntryId ? 'Field entry updated successfully.' : 'New field observation recorded.');
  };

  const handleDeleteConfirmed = async () => {
    if (!entryToDelete) return;
    await deleteJournalEntry(entryToDelete.id);
    if (selectedEntryForDetail?.id === entryToDelete.id) {
      setSelectedEntryForDetail(null);
    }
    setEntryToDelete(null);
    await loadEntries();
    showToast('Field observation deleted.');
  };

  // Filtered & Sorted entries
  const filteredEntries = entries
    .filter((entry) => {
      if (selectedCategoryFilter !== 'all') {
        if (!entry.categories.includes(selectedCategoryFilter as JournalCategory)) return false;
      }
      if (selectedMoodFilter !== 'all') {
        if (entry.mood !== selectedMoodFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = entry.title?.toLowerCase().includes(q);
        const matchContent = entry.content.toLowerCase().includes(q);
        const matchLocation = entry.locationName?.toLowerCase().includes(q);
        const matchMission = entry.missionTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchLocation && !matchMission) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        const tA = (a.title || a.content).toLowerCase();
        const tB = (b.title || b.content).toLowerCase();
        return tA.localeCompare(tB);
      }
    });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Toast Announcement */}
      {feedbackToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-xs text-emerald-900 shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 text-[#1b5e46] shrink-0" />
          <span className="font-medium">{feedbackToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#1b5e46]">
            <BookOpen className="h-4 w-4" />
            <span>Field Notebook</span>
          </div>
          <h1 className="font-serif-nature text-3xl sm:text-4xl font-bold text-[#0f291e]">
            Nature Journal
          </h1>
          <p className="text-xs sm:text-sm text-[#4c6b5d] mt-1">
            Private, local observations recorded away from screens. Stored solely on your physical device via local IndexedDB.
          </p>
        </div>

        <button
          onClick={handleOpenNewEntry}
          className="flex items-center gap-2 rounded-xl bg-[#1b5e46] px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[#134835] transition active:scale-[0.98] shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Filter, Search, and Sort Bar */}
      <div className="rounded-2xl border border-[#dce7e1] bg-white p-4 mb-8 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5c806f]" />
            <input
              type="text"
              placeholder="Search observations, plants, weather, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#d0e0d6] bg-[#f8faf8] pl-9 pr-3 py-2 text-xs text-[#0f291e] placeholder-[#5c806f] focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-[#5c806f]" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="rounded-lg border border-[#d0e0d6] bg-[#f8faf8] px-2.5 py-1.5 text-xs text-[#0f291e] focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="title">Sort: Alphabetical</option>
            </select>
          </div>

          {/* Mood filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedMoodFilter === 'all'
                  ? 'bg-[#1b5e46] text-white'
                  : 'bg-[#f0f5f2] text-[#486657] hover:bg-[#e4ede7] hover:text-[#0f291e]'
              }`}
            >
              All Moods
            </button>
            {MOODS.map((m) => (
              <button
                key={m.mood}
                onClick={() => setSelectedMoodFilter(m.mood)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center gap-1 ${
                  selectedMoodFilter === m.mood
                    ? 'bg-[#1b5e46] text-white'
                    : 'bg-[#f0f5f2] text-[#486657] hover:bg-[#e4ede7] hover:text-[#0f291e]'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#e2ede5]">
          <span className="text-[11px] text-[#5c806f] mr-1">Categories:</span>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs transition ${
              selectedCategoryFilter === 'all'
                ? 'bg-[#eef6f1] text-[#1b5e46] font-semibold border border-[#bcdbc8]'
                : 'text-[#486657] hover:text-[#0f291e]'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition ${
                selectedCategoryFilter === cat
                  ? 'bg-[#eef6f1] text-[#1b5e46] font-semibold border border-[#bcdbc8]'
                  : 'text-[#486657] hover:text-[#0f291e]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Cards List */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#5c806f]">
          Loading field notebook entries...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#bcdbc8] bg-white p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="h-14 w-14 rounded-full bg-[#eef6f1] border border-[#bcdbc8] mx-auto flex items-center justify-center text-[#1b5e46]">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
            {entries.length === 0 ? 'Your field journal is empty' : 'No matching entries found'}
          </h3>
          <p className="text-xs text-[#527364] leading-relaxed">
            {entries.length === 0
              ? 'Complete an outdoor mission or record an immediate observation about the trees, wind, or wildlife outside your window.'
              : 'Try clearing your category, mood, or search filter to see your recorded field notes.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleOpenNewEntry}
              className="rounded-xl bg-[#1b5e46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
            >
              Write First Observation
            </button>
            {entries.length === 0 && onNavigateToGenerator && (
              <button
                onClick={onNavigateToGenerator}
                className="rounded-xl border border-[#bcdbc8] bg-[#eef6f1] px-4 py-2 text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition"
              >
                Start an Outdoor Mission
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEntries.map((entry) => {
            const formattedDate = new Date(entry.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const moodObj = MOODS.find((m) => m.mood === entry.mood);

            return (
              <article
                key={entry.id}
                onClick={() => setSelectedEntryForDetail(entry)}
                className="group rounded-2xl border border-[#dce7e1] bg-white p-6 flex flex-col justify-between hover:border-[#bcdbc8] hover:shadow-md transition space-y-4 cursor-pointer shadow-sm"
              >
                <div className="space-y-3">
                  {/* Unboxed Metadata Header (Zero-Pill Discipline) */}
                  <div className="flex items-center justify-between text-xs text-[#527364]">
                    <div className="flex items-center gap-2">
                      <span title={`Mood: ${entry.mood}`}>{moodObj?.icon} {moodObj?.label}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={entry.date}>{formattedDate}</time>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenEdit(entry, e)}
                        className="text-[#527364] hover:text-[#1b5e46] p-1 transition"
                        title="Edit entry"
                        aria-label="Edit entry"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(entry);
                        }}
                        className="text-[#527364] hover:text-red-600 p-1 transition"
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title if present */}
                  {entry.title && (
                    <h3 className="font-serif-nature text-xl font-bold text-[#0f291e] leading-snug group-hover:text-[#1b5e46] transition">
                      {entry.title}
                    </h3>
                  )}

                  {/* Content observation snippet */}
                  <p className="text-xs sm:text-sm text-[#385646] leading-relaxed line-clamp-4 whitespace-pre-line">
                    {entry.content}
                  </p>
                </div>

                {/* Footer details: Categories, Location, Weather, Mission link */}
                <div className="pt-3 border-t border-[#e2ede5] space-y-2 text-xs text-[#527364]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[#6c8c7d]">Topics:</span>
                    {entry.categories.map((cat, idx) => (
                      <span key={cat} className="text-[#1b5e46] font-medium">
                        {cat}
                        {idx < entry.categories.length - 1 && <span className="text-[#6c8c7d] ml-1">·</span>}
                      </span>
                    ))}
                  </div>

                  {(entry.locationName || entry.weatherNotes) && (
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#527364]">
                      {entry.locationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#1b5e46]" />
                          {entry.locationName}
                        </span>
                      )}
                      {entry.weatherNotes && (
                        <span className="flex items-center gap-1">
                          <CloudSun className="h-3 w-3 text-[#1b5e46]" />
                          {entry.weatherNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {entry.missionTitle && (
                    <div className="text-[11px] text-[#1b5e46] flex items-center gap-1 pt-1 font-medium">
                      <Compass className="h-3 w-3 shrink-0" />
                      <span className="truncate">From mission: {entry.missionTitle}</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail View Modal (Section 7: Readable Entry-Detail View) */}
      {selectedEntryForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#c8ded1] bg-white p-6 sm:p-8 shadow-2xl text-[#0f291e] my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-[#e2ede5] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#527364]">
                  <span>
                    {MOODS.find((m) => m.mood === selectedEntryForDetail.mood)?.icon}{' '}
                    {MOODS.find((m) => m.mood === selectedEntryForDetail.mood)?.label || selectedEntryForDetail.mood}
                  </span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={selectedEntryForDetail.date}>
                    {new Date(selectedEntryForDetail.date).toLocaleString()}
                  </time>
                </div>
                <h2 className="font-serif-nature text-2xl font-bold text-[#0f291e]">
                  {selectedEntryForDetail.title || 'Untitled Observation'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEntryForDetail(null)}
                className="text-[#527364] hover:text-[#0f291e] p-1"
                aria-label="Close detail modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Full text */}
            <div className="prose max-w-none text-sm text-[#254233] leading-relaxed whitespace-pre-line font-normal">
              {selectedEntryForDetail.content}
            </div>

            {/* Context details */}
            <div className="pt-4 border-t border-[#e2ede5] space-y-2 text-xs text-[#527364]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#6c8c7d]">Categories:</span>
                {selectedEntryForDetail.categories.map((c) => (
                  <span key={c} className="text-[#1b5e46] font-medium">
                    {c}
                  </span>
                ))}
              </div>

              {(selectedEntryForDetail.locationName || selectedEntryForDetail.weatherNotes) && (
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  {selectedEntryForDetail.locationName && (
                    <span className="flex items-center gap-1.5 text-[#3b594b]">
                      <MapPin className="h-3.5 w-3.5 text-[#1b5e46]" />
                      {selectedEntryForDetail.locationName}
                    </span>
                  )}
                  {selectedEntryForDetail.weatherNotes && (
                    <span className="flex items-center gap-1.5 text-[#3b594b]">
                      <CloudSun className="h-3.5 w-3.5 text-[#1b5e46]" />
                      {selectedEntryForDetail.weatherNotes}
                    </span>
                  )}
                </div>
              )}

              {selectedEntryForDetail.missionTitle && (
                <div className="flex items-center gap-1.5 text-xs text-[#1b5e46] pt-1 font-medium">
                  <Compass className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Linked Expedition: {selectedEntryForDetail.missionTitle}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e2ede5]">
              <button
                onClick={() => setEntryToDelete(selectedEntryForDetail)}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenEdit(selectedEntryForDetail)}
                  className="rounded-xl border border-[#bcdbc8] bg-[#eef6f1] px-4 py-2 text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition"
                >
                  Edit Observation
                </button>
                <button
                  onClick={() => setSelectedEntryForDetail(null)}
                  className="rounded-xl bg-[#1b5e46] px-5 py-2 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#c8ded1] bg-white p-6 sm:p-8 shadow-2xl text-[#0f291e] my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2ede5] pb-4 mb-6">
              <h2 className="font-serif-nature text-2xl font-bold text-[#0f291e]">
                {editingEntryId ? 'Edit Field Entry' : 'Record Nature Observation'}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="text-[#527364] hover:text-[#0f291e] p-1"
                aria-label="Close editor"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-6">
              {/* Validation Warning */}
              {formValidationError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{formValidationError}</span>
                </div>
              )}

              {/* Title (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0f291e]">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Whispering White Pines on Meadow Ridge"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={120}
                  className="w-full rounded-xl border border-[#d0e0d6] bg-white px-3.5 py-2.5 text-sm text-[#0f291e] placeholder-[#8ea89a] focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Mood selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0f291e]">
                  Outdoor State of Mind
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MOODS.map((m) => {
                    const isSelected = formMood === m.mood;
                    return (
                      <button
                        key={m.mood}
                        type="button"
                        onClick={() => setFormMood(m.mood)}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition ${
                          isSelected
                            ? 'border-emerald-600 bg-[#eef6f1] text-[#0f291e] shadow-sm font-semibold'
                            : 'border-[#dce7e1] bg-[#fbfdfb] text-[#527364] hover:border-[#bcdbc8]'
                        }`}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content (Required) with Live Character Counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0f291e]">
                    Observations & Sensory Findings (Required) *
                  </label>
                  <span className="text-[11px] text-[#5c806f] tabular-nums font-mono">
                    {formContent.length} / 2,500 chars
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  maxLength={2500}
                  placeholder="Describe your outdoor experience: the texture of the soil, the rhythm of bird flight, the cool wind on your neck, or how your thoughts settled away from your screen..."
                  value={formContent}
                  onChange={(e) => {
                    setFormContent(e.target.value);
                    if (formValidationError && e.target.value.trim().length >= 5) {
                      setFormValidationError(null);
                    }
                  }}
                  className="w-full rounded-xl border border-[#d0e0d6] bg-white p-3.5 text-sm text-[#0f291e] placeholder-[#8ea89a] focus:border-emerald-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#0f291e]">
                  Categories & Nature Themes
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSelected = formCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-[#1b5e46] text-white font-semibold shadow-sm'
                            : 'bg-[#f0f5f2] border border-[#dce7e1] text-[#486657] hover:text-[#0f291e]'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location & Weather */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0f291e]">
                    Location Setting
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. West Creek Trail, Municipal Arboretum"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-[#d0e0d6] bg-white px-3.5 py-2 text-xs text-[#0f291e] placeholder-[#8ea89a] focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0f291e]">
                    Weather Conditions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Crisp, 14°C, gentle westerly breeze"
                    value={formWeather}
                    onChange={(e) => setFormWeather(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-[#d0e0d6] bg-white px-3.5 py-2 text-xs text-[#0f291e] placeholder-[#8ea89a] focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Associated Mission Info */}
              {formMissionTitle && (
                <div className="p-3 rounded-xl bg-[#eef6f1] border border-[#bcdbc8] text-xs text-[#1b5e46] flex items-center gap-2">
                  <Compass className="h-4 w-4 shrink-0" />
                  <span>Linked to Mission: <strong>{formMissionTitle}</strong></span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2ede5]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#527364] hover:text-[#0f291e] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formContent.trim().length === 0}
                  className="rounded-xl bg-[#1b5e46] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#134835] transition disabled:opacity-40 shadow-sm"
                >
                  {editingEntryId ? 'Update Entry' : 'Save Field Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-center space-y-4 shadow-2xl text-stone-900">
            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif-nature text-lg font-bold text-stone-900">
                Delete Field Entry?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                This observation will be permanently removed from your local database. This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleDeleteConfirmed}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
              >
                Yes, Delete Entry
              </button>
              <button
                onClick={() => setEntryToDelete(null)}
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
