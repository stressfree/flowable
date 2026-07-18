import { Link } from 'react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import type { CompanyResponse } from '@/types';
import { useDeleteCompany } from '@/api/companies';

interface CompanyTableProps {
  companies: CompanyResponse[];
  isLoading?: boolean;
}

export function CompanyTable({ companies, isLoading }: CompanyTableProps) {
  const deleteMutation = useDeleteCompany();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  function handleDelete(company: CompanyResponse) {
    deleteMutation.mutate(company.id, {
      onSuccess: () => {
        toast.success(`Company "${company.name}" deleted`);
        setConfirmId(null);
      },
      onError: (error: unknown) => {
        const apiError = error as { detail?: string; title?: string };
        toast.error(apiError.detail || apiError.title || 'Failed to delete company');
        setConfirmId(null);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#e5e7eb] p-12 text-center">
        <svg className="w-12 h-12 mx-auto text-[#9ca3af] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p className="text-[#6b7280] text-sm">No companies yet</p>
        <Link
          to="/companies/new"
          className="mt-3 inline-block text-sm text-[#4f46e5] hover:underline font-medium"
        >
          Create your first company
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              Parent
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link
                  to={`/companies/${company.id}`}
                  className="text-sm font-medium text-[#4f46e5] hover:underline"
                >
                  {company.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-[#374151]">
                {company.parentCompanyName || (
                  <span className="text-[#9ca3af]">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {confirmId === company.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleDelete(company)}
                      disabled={deleteMutation.isPending}
                      className="text-xs px-2 py-1 bg-[#dc2626] text-white rounded font-medium hover:bg-red-600 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs px-2 py-1 bg-gray-200 text-[#374151] rounded font-medium hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(company.id)}
                    className="text-xs text-[#dc2626] hover:underline font-medium"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
