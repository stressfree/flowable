import { Link } from 'react-router';
import type { CompanyDetailResponse } from '@/types';

interface CompanyHierarchyProps {
  company: CompanyDetailResponse;
}

export function CompanyHierarchy({ company }: CompanyHierarchyProps) {
  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] p-4">
      <h3 className="text-sm font-semibold text-[#111827] mb-3">Hierarchy</h3>

      {company.parentCompanyName && (
        <div className="mb-3">
          <p className="text-xs text-[#9ca3af] mb-1">Parent Company</p>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <Link
              to={`/companies/${company.parentCompanyId}`}
              className="text-sm text-[#4f46e5] hover:underline font-medium"
            >
              {company.parentCompanyName}
            </Link>
          </div>
        </div>
      )}

      {company.children.length > 0 && (
        <div>
          <p className="text-xs text-[#9ca3af] mb-1">Child Companies</p>
          <div className="flex flex-wrap gap-2">
            {company.children.map((child) => (
              <Link
                key={child.id}
                to={`/companies/${child.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-sm text-[#4f46e5] hover:bg-indigo-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!company.parentCompanyName && company.children.length === 0 && (
        <p className="text-sm text-[#9ca3af]">No parent or child companies.</p>
      )}
    </div>
  );
}
