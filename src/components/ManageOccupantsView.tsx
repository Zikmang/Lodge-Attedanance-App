import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Occupant } from '../types/attendance';
import { ConfirmationModal } from './ConfirmationModal';

interface Props {
  occupants: Occupant[];
  hasApi: boolean;
  isSyncing: boolean;
  onAddOccupant: (name: string) => Promise<void>;
  onEditOccupant: (occupant: Occupant, newName: string) => Promise<void>;
  onRemoveOccupant: (occupant: Occupant) => Promise<void>;
  onRefreshFromSheet: () => void;
  onOpenSheetConfig: () => void;
  onBackToMenu: () => void;
  onShowToast: (message: string) => void;
}

export const ManageOccupantsView: React.FC<Props> = ({
  occupants,
  hasApi,
  isSyncing,
  onAddOccupant,
  onEditOccupant,
  onRemoveOccupant,
  onRefreshFromSheet,
  onOpenSheetConfig,
  onBackToMenu,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOccupantName, setNewOccupantName] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Selected occupant for actions (edit / remove)
  const [selectedOccupant, setSelectedOccupant] = useState<Occupant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete confirmation
  const [occupantToDelete, setOccupantToDelete] = useState<Occupant | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Error feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered occupants
  const filteredOccupants = occupants.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOccupantName.trim();
    if (!trimmed) return;

    setIsSubmittingAdd(true);
    setErrorMsg(null);
    try {
      await onAddOccupant(trimmed);
      setNewOccupantName('');
      setIsAddModalOpen(false);
      onShowToast('Occupant added to Sheet');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add occupant');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenActionSheet = (occupant: Occupant) => {
    setSelectedOccupant(occupant);
    setEditNameInput(occupant.name);
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editNameInput.trim();
    if (!selectedOccupant || !trimmed) return;
    if (trimmed === selectedOccupant.name) {
      setSelectedOccupant(null);
      return;
    }

    setIsSubmittingEdit(true);
    setErrorMsg(null);
    try {
      await onEditOccupant(selectedOccupant, trimmed);
      setSelectedOccupant(null);
      onShowToast('Name updated in Sheet');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update name');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!occupantToDelete) return;

    setIsSubmittingDelete(true);
    try {
      await onRemoveOccupant(occupantToDelete);
      setOccupantToDelete(null);
      setSelectedOccupant(null);
      onShowToast('Occupant removed from active list');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove occupant');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-5 pt-4 pb-20 min-h-[calc(100vh-56px)] flex flex-col">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToMenu}
          type="button"
          className="inline-flex items-center gap-0.5 text-sm font-normal text-[#1D1D1F] hover:text-[#86868B] transition-colors -ml-1.5 px-1 py-1 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-[#86868B]" />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          {hasApi && (
            <button
              type="button"
              onClick={onRefreshFromSheet}
              disabled={isSyncing}
              title="Sync with Google Sheet"
              className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-[#EAEAEF] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#1D1D1F]' : ''}`} />
              <span>Sync</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setNewOccupantName('');
              setErrorMsg(null);
              setIsAddModalOpen(true);
            }}
            className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:bg-[#2C2C2E] active:scale-95 transition-all cursor-pointer shadow-2xs"
            aria-label="Add Occupant"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Title & Subtitle */}
      <div className="space-y-1 mb-5">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1D1D1F] tracking-tight">
          Occupants
        </h1>
        <p className="text-sm font-medium text-[#86868B]">
          {occupants.length} active occupant{occupants.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Optional Search */}
      {occupants.length > 5 && (
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search occupants"
            className="w-full pl-9 pr-4 py-2 bg-[#EBEBEF]/70 focus:bg-white text-sm text-[#1D1D1F] placeholder:text-[#86868B] rounded-xl border border-transparent focus:border-[#E5E5EA] focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-3 mb-4 bg-[#FDF1F0] border border-[#F8D7D5] text-[#C24138] rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-xs p-1">
            Dismiss
          </button>
        </div>
      )}

      {/* Occupants List or Empty State */}
      {occupants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
          <h3 className="text-base font-semibold text-[#1D1D1F]">No occupants yet</h3>
          <p className="text-xs text-[#86868B] mt-1 max-w-xs">
            Add the people currently staying in this lodge.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-5 px-5 py-2.5 bg-[#1D1D1F] text-white rounded-xl text-sm font-medium hover:bg-[#2C2C2E] transition-all cursor-pointer"
          >
            Add Occupant
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-2xs divide-y divide-[#E5E5EA]/70 overflow-hidden">
          {filteredOccupants.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#86868B]">
              No occupants matching "{searchQuery}"
            </div>
          ) : (
            filteredOccupants.map((occupant) => (
              <button
                key={occupant.id || occupant.name}
                type="button"
                onClick={() => handleOpenActionSheet(occupant)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#F8F8FA] active:bg-[#EFEFF2] transition-colors text-left cursor-pointer group"
              >
                <span className="text-base font-medium text-[#1D1D1F]">
                  {occupant.name}
                </span>
                <ChevronRight className="w-4 h-4 text-[#C7C7CC] group-hover:text-[#86868B] transition-colors" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Add Occupant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">Add Occupant</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newOccupantName}
                  onChange={(e) => setNewOccupantName(e.target.value)}
                  placeholder="Full name"
                  autoFocus
                  disabled={isSubmittingAdd}
                  className="w-full px-4 py-3 bg-[#F8F8FA] text-base text-[#1D1D1F] placeholder:text-[#86868B] rounded-2xl border border-[#E5E5EA] focus:border-[#1D1D1F] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmittingAdd}
                  className="px-4 py-2.5 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd || !newOccupantName.trim()}
                  className="px-5 py-2.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-98 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingAdd ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Occupant Actions (Edit name / Remove occupant) */}
      {selectedOccupant && !isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-150">
            <div className="text-center sm:text-left space-y-0.5 pb-2 border-b border-[#E5E5EA]/70">
              <span className="text-xs uppercase tracking-wider text-[#86868B] font-medium">
                Occupant
              </span>
              <h3 className="text-xl font-semibold text-[#1D1D1F]">
                {selectedOccupant.name}
              </h3>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-3.5 px-4 bg-[#F8F8FA] hover:bg-[#EFEFF2] rounded-2xl text-left text-sm font-medium text-[#1D1D1F] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Edit2 className="w-4 h-4 text-[#86868B]" />
                  <span>Edit name</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#86868B]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setOccupantToDelete(selectedOccupant);
                }}
                className="w-full py-3.5 px-4 bg-[#FDF1F0] hover:bg-[#FCE6E4] rounded-2xl text-left text-sm font-medium text-[#C24138] transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-[#C24138]" />
                  <span>Remove occupant</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C24138]" />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedOccupant(null)}
                className="w-full py-3 text-center text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Occupant Input Modal */}
      {selectedOccupant && isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">Edit Name</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <input
                type="text"
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                autoFocus
                disabled={isSubmittingEdit}
                className="w-full px-4 py-3 bg-[#F8F8FA] text-base text-[#1D1D1F] rounded-2xl border border-[#E5E5EA] focus:border-[#1D1D1F] focus:bg-white focus:outline-none transition-all"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2.5 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit || !editNameInput.trim()}
                  className="px-5 py-2.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-98 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(occupantToDelete)}
        title="Remove Occupant"
        message={`Are you sure you want to remove ${occupantToDelete?.name} from this lodge?`}
        confirmLabel="Remove"
        confirmVariant="danger"
        isLoading={isSubmittingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOccupantToDelete(null)}
      />
    </div>
  );
};
