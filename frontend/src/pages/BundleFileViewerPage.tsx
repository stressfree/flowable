import { useParams, Link } from 'react-router';
import { useBundle, useFileContent } from '@/api/bundles';
import { ModelViewer } from '@/components/viewer/ModelViewer';

function getFileType(filename: string): 'bpmn' | 'cmmn' | 'dmn' | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.bpmn') || lower.endsWith('.bpmn20.xml')) return 'bpmn';
  if (lower.endsWith('.cmmn')) return 'cmmn';
  if (lower.endsWith('.dmn')) return 'dmn';
  return null;
}

export default function BundleFileViewerPage() {
  const { id, fileId } = useParams<{ id: string; fileId: string }>();
  const bundleId = Number(id);
  const fileIdNum = Number(fileId);

  const { data: bundle } = useBundle(bundleId);
  const { data: fileContent, isLoading, error } = useFileContent(bundleId, fileIdNum);

  const file = bundle?.files.find((f) => f.id === fileIdNum);
  const fileType = file ? getFileType(file.filename) : null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/bundles/${bundleId}`} className="text-sm text-[#6b7280] hover:text-[#4f46e5] flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bundle
          </Link>
          <span className="text-[#9ca3af]">/</span>
          <h1 className="text-sm font-medium text-[#111827]">{file?.filename || `File #${fileId}`}</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[80vh] bg-white border border-[#e5e7eb] rounded-lg">
          <div className="w-8 h-8 border-3 border-[#e5e7eb] border-t-[#4f46e5] rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[80vh] bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <svg className="w-10 h-10 mx-auto text-[#dc2626] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-[#dc2626]">Failed to load file content</p>
          </div>
        </div>
      ) : fileContent && fileType ? (
        <ModelViewer xml={fileContent} fileType={fileType} />
      ) : fileContent ? (
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-4 h-[80vh] overflow-auto">
          <pre className="text-xs font-mono text-[#374151] whitespace-pre-wrap">{fileContent}</pre>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[80vh] bg-white border border-[#e5e7eb] rounded-lg">
          <p className="text-sm text-[#6b7280]">No content available</p>
        </div>
      )}
    </div>
  );
}
