import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { useBundles, useBundleTypes } from '@/api/bundles';
import { useCompanies } from '@/api/companies';

const statusBadgeClass: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  ARCHIVED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

const bundleTypeLabels: Record<string, string> = {
  EXPENSE_APPROVAL: 'Expense Approval',
  VIRTUAL_CARD_APPROVAL: 'Virtual Card Approval',
  PHYSICAL_CREDIT_CARD_APPROVAL: 'Physical Card Approval',
  CARD_CONTROLS_CHANGE_APPROVAL: 'Card Controls Change',
};

export default function BundleListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    bundleType?: string;
    companyId?: number;
    status?: string;
  }>({});

  const { data: bundles, isLoading } = useBundles(filters);
  const { data: bundleTypes } = useBundleTypes();
  const { data: companies } = useCompanies();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#111827]">Bundles</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">All decisioning bundles across companies</p>
        </div>
        <Link
          to="/bundles/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] text-white rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Bundle
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Type</label>
            <select
              value={filters.bundleType || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, bundleType: e.target.value || undefined }))
              }
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">All types</option>
              {bundleTypes?.map((bt) => (
                <option key={bt.type} value={bt.type}>{bt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Company</label>
            <select
              value={filters.companyId || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  companyId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">All companies</option>
              {companies?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value || undefined }))
              }
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      ) : !bundles || bundles.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[#9ca3af] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-[#6b7280] text-sm">No bundles found</p>
          <Link
            to="/bundles/new"
            className="mt-3 inline-block text-sm text-[#4f46e5] hover:underline font-medium"
          >
            Create your first bundle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Files</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {bundles.map((bundle) => (
                <tr
                  key={bundle.id}
                  onClick={() => navigate(`/bundles/${bundle.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-[#4f46e5]">
                      {bundleTypeLabels[bundle.bundleType] || bundle.bundleType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#374151]">
                    {bundle.companyName || <span className="text-[#9ca3af]">Global</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                        statusBadgeClass[bundle.status] || ''
                      }`}
                    >
                      {bundle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">{bundle.fileCount}</td>
                  <td className="px-4 py-3 text-sm text-[#6b7280]">
                    {new Date(bundle.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
