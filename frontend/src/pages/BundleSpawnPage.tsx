import { useParams, Link } from 'react-router';
import { useBundle } from '@/api/bundles';
import { SpawnForm } from '@/components/spawn/SpawnForm';

export default function BundleSpawnPage() {
  const { id } = useParams<{ id: string }>();
  const bundleId = Number(id);
  const { data: bundle, isLoading } = useBundle(bundleId);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to={`/bundles/${bundleId}`} className="text-sm text-[#6b7280] hover:text-[#4f46e5] flex items-center gap-1 mb-3">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Bundle
      </Link>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-64 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      ) : bundle ? (
        <>
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold text-[#111827]">Spawn Process</h1>
            <p className="text-[13px] text-[#6b7280] mt-0.5">
              {bundle.description || `Bundle #${bundle.id}`} — {bundle.bundleType.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
          <SpawnForm bundleId={bundleId} />
        </>
      ) : (
        <p className="text-sm text-[#dc2626]">Bundle not found.</p>
      )}
    </div>
  );
}
