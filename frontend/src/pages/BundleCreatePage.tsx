import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { useCreateBundle, useBundleTypes } from '@/api/bundles';
import { useCompanies } from '@/api/companies';
import { BundleFileDropzone } from '@/components/bundles/BundleFileDropzone';

export default function BundleCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateBundle();
  const { data: bundleTypes } = useBundleTypes();
  const { data: companies } = useCompanies();

  const [bundleType, setBundleType] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bundleType) {
      toast.error('Please select a bundle type');
      return;
    }

    if (files.length === 0) {
      toast.error('Please add at least one file');
      return;
    }

    createMutation.mutate(
      {
        files,
        bundleType,
        companyId: companyId && companyId !== 'global' ? Number(companyId) : null,
        description,
      },
      {
        onSuccess: (bundle) => {
          toast.success(`Bundle created with ${bundle.files.length} file(s)`);
          navigate(`/bundles/${bundle.id}`);
        },
        onError: (error: unknown) => {
          const apiError = error as { detail?: string; title?: string };
          toast.error(apiError.detail || apiError.title || 'Failed to create bundle');
        },
      },
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to="/bundles" className="text-sm text-[#6b7280] hover:text-[#4f46e5] flex items-center gap-1 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Bundles
      </Link>

      <h1 className="text-[22px] font-semibold text-[#111827]">New Bundle</h1>
      <p className="text-[13px] text-[#6b7280] mt-0.5 mb-6">Upload BPMN, CMMN, DMN, and Event files</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#e5e7eb] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Bundle Type</label>
          <select
            value={bundleType}
            onChange={(e) => setBundleType(e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          >
            <option value="">Select a type...</option>
            {bundleTypes?.map((bt) => (
              <option key={bt.type} value={bt.type}>{bt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          >
            <option value="">Global (no company)</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">
            Description <span className="text-[#9ca3af]">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent resize-none"
            placeholder="e.g., Standard expense approval with escalation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Files</label>
          <BundleFileDropzone files={files} onFilesChange={setFiles} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            to="/bundles"
            className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e5e7eb] rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
}
