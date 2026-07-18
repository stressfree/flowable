import { useParams, Link } from 'react-router';
import { useState } from 'react';
import { useCompany } from '@/api/companies';
import { CompanyHierarchy } from '@/components/companies/CompanyHierarchy';
import type { BundleSummaryResponse } from '@/types';

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

function BundleSection({ bundles }: { bundles: BundleSummaryResponse[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const grouped = bundles.reduce((acc, b) => {
    (acc[b.bundleType] = acc[b.bundleType] || []).push(b);
    return acc;
  }, {} as Record<string, BundleSummaryResponse[]>);

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([type, typeBundles]) => (
        <div key={type} className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [type]: !prev[type] }))}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 text-[#6b7280] transition-transform ${expanded[type] ? 'rotate-90' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-[#111827]">
                {bundleTypeLabels[type] || type}
              </span>
              <span className="text-xs text-[#9ca3af]">({typeBundles.length})</span>
            </div>
          </button>
          {expanded[type] && (
            <div className="border-t border-[#e5e7eb]">
              <table className="w-full">
                <tbody className="divide-y divide-[#e5e7eb]">
                  {typeBundles.map((bundle) => (
                    <tr key={bundle.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/bundles/${bundle.id}`}
                          className="text-sm text-[#4f46e5] hover:underline"
                        >
                          {bundle.description || `Bundle #${bundle.id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                            statusBadgeClass[bundle.status] || ''
                          }`}
                        >
                          {bundle.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#6b7280]">
                        {bundle.fileCount} file{bundle.fileCount !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading, error } = useCompany(Number(id));

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-64"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6 text-center">
        <p className="text-[#dc2626] text-sm">Company not found.</p>
        <Link to="/companies" className="mt-2 inline-block text-sm text-[#4f46e5] hover:underline">
          Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link to="/companies" className="text-sm text-[#6b7280] hover:text-[#4f46e5] flex items-center gap-1 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Companies
      </Link>

      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#111827]">{company.name}</h1>
        <p className="text-[13px] text-[#6b7280] mt-0.5">Company detail and bundle overview</p>
      </div>

      <div className="mb-6">
        <CompanyHierarchy company={company} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#111827] mb-3">
          Bundles ({company.bundles.length})
        </h2>
        {company.bundles.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#e5e7eb] p-8 text-center">
            <p className="text-sm text-[#6b7280]">No bundles for this company yet.</p>
            <Link
              to="/bundles/new"
              className="mt-2 inline-block text-sm text-[#4f46e5] hover:underline font-medium"
            >
              Create a bundle
            </Link>
          </div>
        ) : (
          <BundleSection bundles={company.bundles} />
        )}
      </div>
    </div>
  );
}
