import { useParams, Link } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useBundle,
  useValidateBundle,
  useSetEntrypoint,
  usePublishBundle,
  useAddFiles,
  useArchiveBundle,
  useBundleEvents,
} from '@/api/bundles';
import { ValidationErrorsPanel } from '@/components/validation/ValidationErrorsPanel';
import { BundleFileDropzone } from '@/components/bundles/BundleFileDropzone';

const statusBadgeClass: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  ARCHIVED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const typeBadgeClass: Record<string, string> = {
  BPMN: 'bg-blue-50 text-blue-700',
  CMMN: 'bg-purple-50 text-purple-700',
  DMN: 'bg-teal-50 text-teal-700',
  EVENT: 'bg-orange-50 text-orange-700',
};

function getFileType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.bpmn') || lower.endsWith('.bpmn20.xml')) return 'BPMN';
  if (lower.endsWith('.cmmn')) return 'CMMN';
  if (lower.endsWith('.dmn')) return 'DMN';
  if (lower.endsWith('.event')) return 'EVENT';
  return 'XML';
}

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bundleId = Number(id);
  const { data: bundle, isLoading, error } = useBundle(bundleId);
  const validateMutation = useValidateBundle(bundleId);
  const setEntrypointMutation = useSetEntrypoint(bundleId);
  const publishMutation = usePublishBundle(bundleId);
  const addFilesMutation = useAddFiles(bundleId);
  const archiveMutation = useArchiveBundle();
  const { data: events } = useBundleEvents(bundleId);

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [goLiveAt, setGoLiveAt] = useState('');
  const [showAddFiles, setShowAddFiles] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-96"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#dc2626] text-sm">Bundle not found.</p>
        <Link to="/bundles" className="mt-2 inline-block text-sm text-[#4f46e5] hover:underline">
          Back to Bundles
        </Link>
      </div>
    );
  }

  const isDraft = bundle.status === 'DRAFT';
  const isPublished = bundle.status === 'PUBLISHED';
  const hasEntrypoint = bundle.entrypointFileId !== null;
  const hasErrors = bundle.validationErrors.length > 0;

  function handlePublish() {
    publishMutation.mutate(goLiveAt || undefined, {
      onSuccess: () => {
        toast.success(goLiveAt ? 'Bundle scheduled for publishing' : 'Bundle published successfully');
        setShowPublishDialog(false);
        setGoLiveAt('');
      },
      onError: (err: unknown) => {
        const apiError = err as { detail?: string; title?: string };
        toast.error(apiError.detail || apiError.title || 'Failed to publish bundle');
      },
    });
  }

  function handleAddFiles() {
    if (newFiles.length === 0) {
      toast.error('Please add at least one file');
      return;
    }
    addFilesMutation.mutate(newFiles, {
      onSuccess: () => {
        toast.success(`${newFiles.length} file(s) added`);
        setNewFiles([]);
        setShowAddFiles(false);
      },
      onError: (err: unknown) => {
        const apiError = err as { detail?: string; title?: string };
        toast.error(apiError.detail || apiError.title || 'Failed to add files');
      },
    });
  }

  function handleArchive() {
    archiveMutation.mutate(bundleId, {
      onSuccess: () => {
        toast.success('Bundle archived');
        window.location.href = '/bundles';
      },
    });
  }

  function handleSetEntrypoint(fileId: number) {
    setEntrypointMutation.mutate(fileId, {
      onSuccess: () => {
        toast.success('Entrypoint set');
      },
      onError: (err: unknown) => {
        const apiError = err as { detail?: string; title?: string };
        toast.error(apiError.detail || apiError.title || 'Failed to set entrypoint');
      },
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/bundles" className="text-sm text-[#6b7280] hover:text-[#4f46e5] flex items-center gap-1 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Bundles
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-[#4f46e5]">
              {bundle.bundleType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${statusBadgeClass[bundle.status] || ''}`}>
              {bundle.status}
            </span>
            <span className="text-sm text-[#6b7280]">{bundle.companyName || 'Global'}</span>
          </div>
          <h1 className="text-[22px] font-semibold text-[#111827]">
            {bundle.description || `Bundle #${bundle.id}`}
          </h1>
        </div>

        <div className="flex gap-2">
          {isDraft && (
            <>
              <button
                onClick={() => setShowPublishDialog(true)}
                disabled={hasErrors}
                className="px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasErrors ? 'Fix validation errors first' : 'Publish this bundle'}
              >
                Publish
              </button>
              <button
                onClick={() => setShowAddFiles(true)}
                className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e5e7eb] rounded-md hover:bg-gray-50"
              >
                Add Files
              </button>
              <button
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-[#dc2626] bg-white border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                Archive
              </button>
            </>
          )}
          {isPublished && hasEntrypoint && (
            <Link
              to={`/bundles/${bundle.id}/spawn`}
              className="px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600"
            >
              Spawn
            </Link>
          )}
        </div>
      </div>

      {bundle.description && (
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 mb-4">
          <p className="text-sm text-[#374151]">{bundle.description}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#111827] mb-2">Validation</h2>
        <ValidationErrorsPanel
          errors={bundle.validationErrors}
          onRevalidate={() => validateMutation.mutate()}
          isValidating={validateMutation.isPending}
        />
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#111827] mb-2">Files ({bundle.files.length})</h2>
        <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Filename</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {bundle.files.map((file) => {
                const fileType = getFileType(file.filename);
                return (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {file.isEntrypoint && (
                          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                          </svg>
                        )}
                        <Link to={`/bundles/${bundle.id}/files/${file.id}`} className="text-sm text-[#4f46e5] hover:underline">
                          {file.filename}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${typeBadgeClass[fileType] || 'bg-gray-100 text-gray-700'}`}>
                        {fileType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isDraft && !file.isEntrypoint && (
                        <button
                          onClick={() => handleSetEntrypoint(file.id)}
                          disabled={setEntrypointMutation.isPending}
                          className="text-xs text-[#4f46e5] hover:underline font-medium disabled:opacity-50"
                        >
                          Set as entrypoint
                        </button>
                      )}
                      {file.isEntrypoint && <span className="text-xs text-[#9ca3af]">Entrypoint</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {events && events.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#111827] mb-2">Events</h2>
          <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 space-y-3">
            {events.map((event) => (
              <div key={event.eventKey} className="border-b border-[#e5e7eb] last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700">EVENT</span>
                  <span className="text-sm font-medium text-[#111827]">{event.eventName}</span>
                  <code className="text-xs text-[#6b7280] font-mono">{event.eventKey}</code>
                </div>
                {event.correlationParameters.length > 0 && (
                  <div className="mt-1 text-xs text-[#6b7280]">
                    <span className="font-medium">Correlation: </span>
                    {event.correlationParameters.map((p) => `${p.name} (${p.type})`).join(', ')}
                  </div>
                )}
                {event.payload.length > 0 && (
                  <div className="mt-0.5 text-xs text-[#6b7280]">
                    <span className="font-medium">Payload: </span>
                    {event.payload.map((p) => `${p.name} (${p.type})`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showPublishDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowPublishDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Publish Bundle</h3>
            <p className="text-sm text-[#6b7280] mb-4">Choose to publish immediately or schedule for a future date.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={goLiveAt}
                  onChange={(e) => setGoLiveAt(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
                />
                <p className="mt-1 text-xs text-[#9ca3af]">Leave empty to publish immediately.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPublishDialog(false)}
                className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e5e7eb] rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50"
              >
                {publishMutation.isPending ? 'Publishing...' : goLiveAt ? 'Schedule' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddFiles && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddFiles(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Add Files</h3>
            <BundleFileDropzone files={newFiles} onFilesChange={setNewFiles} />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAddFiles(false)}
                className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e5e7eb] rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFiles}
                disabled={addFilesMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50"
              >
                {addFilesMutation.isPending ? 'Adding...' : 'Add Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
