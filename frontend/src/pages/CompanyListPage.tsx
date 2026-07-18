import { Link } from 'react-router';
import { useCompanies } from '@/api/companies';
import { CompanyTable } from '@/components/companies/CompanyTable';

export default function CompanyListPage() {
  const { data: companies, isLoading } = useCompanies();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#111827]">Companies</h1>
          <p className="text-[13px] text-[#6b7280] mt-0.5">Manage companies and their hierarchy</p>
        </div>
        <Link
          to="/companies/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4f46e5] text-white rounded-md text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Company
        </Link>
      </div>

      <CompanyTable companies={companies || []} isLoading={isLoading} />
    </div>
  );
}
