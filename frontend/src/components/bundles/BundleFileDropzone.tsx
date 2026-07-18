import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { toast } from 'sonner';

const ACCEPTED_EXTENSIONS = ['.bpmn', '.bpmn20.xml', '.cmmn', '.dmn', '.event', '.xml'];

interface BundleFileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

function isValidExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BundleFileDropzone({ files, onFilesChange }: BundleFileDropzoneProps) {
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setDragError(null);

      if (rejected.length > 0) {
        const invalidFiles = rejected.map((r) => r.file.name).join(', ');
        setDragError(`Invalid file type(s): ${invalidFiles}. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`);
      }

      const valid = accepted.filter((f) => {
        if (!isValidExtension(f.name)) {
          toast.error(`"${f.name}" is not a supported file type`);
          return false;
        }
        if (f.size > 10 * 1024 * 1024) {
          toast.error(`"${f.name}" exceeds 10MB limit`);
          return false;
        }
        return true;
      });

      onFilesChange([...files, ...valid]);
    },
    [files, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/xml': ['.bpmn', '.bpmn20.xml', '.cmmn', '.dmn', '.xml'],
      'text/xml': ['.bpmn', '.bpmn20.xml', '.cmmn', '.dmn', '.xml'],
      'application/json': ['.event'],
    },
  });

  function removeFile(index: number) {
    onFilesChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-[#4f46e5] bg-indigo-50' : 'border-[#e5e7eb] hover:border-[#9ca3af]'
        }`}
      >
        <input {...getInputProps()} />
        <svg className="w-10 h-10 mx-auto text-[#9ca3af] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-[#374151]">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-[#9ca3af] mt-1">Accepted: {ACCEPTED_EXTENSIONS.join(', ')}</p>
      </div>

      {dragError && <p className="mt-2 text-xs text-[#dc2626]">{dragError}</p>}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-md px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-[#6b7280] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-[#111827] truncate">{file.name}</span>
                <span className="text-xs text-[#9ca3af] shrink-0">{formatFileSize(file.size)}</span>
              </div>
              <button onClick={() => removeFile(index)} className="text-[#dc2626] hover:text-red-600 shrink-0 ml-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
