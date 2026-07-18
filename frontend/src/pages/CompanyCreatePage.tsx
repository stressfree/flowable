import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { useCreateCompany, useCompanies } from '@/api/companies';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  parentCompanyId: z.number().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function CompanyCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCompany();
  const { data: companies } = useCompanies();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', parentCompanyId: null },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(
      { name: data.name, parentCompanyId: data.parentCompanyId || null },
      {
        onSuccess: (company) => {
          toast.success(`Company "${company.name}" created`);
          navigate(`/companies/${company.id}`);
        },
        onError: (error: unknown) => {
          const apiError = error as { detail?: string; title?: string };
          toast.error(apiError.detail || apiError.title || 'Failed to create company');
        },
      },
    );
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <Link to="/companies" className="text-sm text-[#6b7280] hover:text-[#4f46e5] flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Companies
        </Link>
        <h1 className="text-[22px] font-semibold text-[#111827] mt-2">New Company</h1>
        <p className="text-[13px] text-[#6b7280] mt-0.5">Create a company in the hierarchy</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-[#e5e7eb] p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Name</label>
          <input
            {...register('name')}
            type="text"
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent ${
              errors.name ? 'border-[#dc2626]' : 'border-[#e5e7eb]'
            }`}
            placeholder="e.g., Acme Corp"
          />
          {errors.name && <p className="mt-1 text-xs text-[#dc2626]">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">Parent Company (optional)</label>
          <select
            {...register('parentCompanyId', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
            className="w-full px-3 py-2 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
          >
            <option value="">None (top-level company)</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            to="/companies"
            className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#e5e7eb] rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-[#4f46e5] rounded-md hover:bg-indigo-600 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Company'}
          </button>
        </div>
      </form>
    </div>
  );
}
