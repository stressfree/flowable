import type { ValidationError } from '@/types';

interface ValidationErrorsPanelProps {
  errors: ValidationError[];
  onRevalidate?: () => void;
  isValidating?: boolean;
}

const fileTypeBadgeClass: Record<string, string> = {
  BPMN: 'bg-blue-50 text-blue-700',
  CMMN: 'bg-purple-50 text-purple-700',
  DMN: 'bg-teal-50 text-teal-700',
  EVENT: 'bg-orange-50 text-orange-700',
};

export function ValidationErrorsPanel({ errors, onRevalidate, isValidating }: ValidationErrorsPanelProps) {
  if (errors.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-emerald-800">All cross-references valid</p>
          <p className="text-xs text-emerald-700 mt-0.5">No unresolved references found in this bundle.</p>
        </div>
        {onRevalidate && (
          <button
            onClick={onRevalidate}
            disabled={isValidating}
            className="ml-auto text-xs text-emerald-700 hover:text-emerald-900 font-medium disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Re-validate'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-[#dc2626] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#dc2626]">
            {errors.length} unresolved reference{errors.length !== 1 ? 's' : ''} found
          </p>
          <p className="text-xs text-red-700 mt-0.5">Fix these errors before publishing this bundle.</p>
        </div>
        {onRevalidate && (
          <button
            onClick={onRevalidate}
            disabled={isValidating}
            className="text-xs text-[#dc2626] hover:text-red-700 font-medium disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Re-validate'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {errors.map((err, index) => (
          <div key={`${err.fileId}-${err.elementId}-${index}`} className="bg-white border border-[#e5e7eb] rounded-lg p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${fileTypeBadgeClass[err.fileType] || 'bg-gray-100 text-gray-700'}`}>
                  {err.fileType}
                </span>
                <span className="text-sm font-medium text-[#111827]">{err.elementName}</span>
              </div>
              <span className="text-xs text-[#9ca3af] font-mono">{err.filename}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-[#9ca3af] text-xs">Element type: </span>
                <span className="text-[#374151] font-mono text-xs">{err.elementType}</span>
              </div>
              <div>
                <span className="text-[#9ca3af] text-xs">Reference attribute: </span>
                <span className="text-[#374151] font-mono text-xs">{err.referenceAttribute}</span>
              </div>
              <div>
                <span className="text-[#9ca3af] text-xs">Missing reference: </span>
                <code className="text-[#dc2626] font-mono text-xs bg-red-50 px-1 py-0.5 rounded">{err.missingReference}</code>
              </div>
              <div>
                <span className="text-[#9ca3af] text-xs">Element ID: </span>
                <span className="text-[#374151] font-mono text-xs">{err.elementId}</span>
              </div>
            </div>

            {err.suggestion && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-[#6b7280] bg-[#f9fafb] rounded px-2 py-1.5">
                <svg className="w-3.5 h-3.5 text-[#6b7280] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>{err.suggestion}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
