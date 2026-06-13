"use client";

import { useActionState, useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { uploadCvAction, type UploadActionState } from "@/lib/actions/upload";
import { validateCvFile } from "@/lib/validations/upload";
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import ProgressSteps from "@/components/upload/progress-steps";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileUp,
} from "lucide-react";

export default function UploadPage() {
  const [state, formAction, isPending] = useActionState<
    UploadActionState,
    FormData
  >(uploadCvAction, {});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setClientError(null);
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const error = validateCvFile(file);
    if (error) {
      setClientError(error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = () => {
    setSelectedFile(null);
    setClientError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setClientError("Please select a file first.");
      return;
    }
    const fd = new FormData();
    fd.append("file", selectedFile);
    startTransition(() => {
      formAction(fd);
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          Upload Your CV
        </h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          Upload your CV in PDF or DOCX format. Our AI will extract and analyze
          the content.
        </p>
      </div>

      {/* Success message */}
      {state?.success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-green-500 bg-green-50 px-5 py-4 shadow-[4px_4px_0px_0px_#22c55e]">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">{state.success}</p>
            <Link
              href="/history"
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-green-600 bg-green-200 px-3 py-1.5 text-xs font-bold text-green-800 transition-all hover:bg-green-300"
            >
              View Analysis Results →
            </Link>
          </div>
        </div>
      )}

      {/* Server error */}
      {state?.error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-red-500 bg-red-50 px-5 py-4 shadow-[4px_4px_0px_0px_#ef4444]">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-bold text-red-800">{state.error}</p>
        </div>
      )}

      {/* Client validation error */}
      {clientError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-orange-400 bg-orange-50 px-5 py-4 shadow-[4px_4px_0px_0px_#f97316]">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-orange-600" />
          <p className="text-sm font-bold text-orange-800">{clientError}</p>
        </div>
      )}

      {/* Upload area */}
      <div className="rounded-xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000000]">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border-4 border-dashed p-10 text-center transition-all ${
            isDragActive
              ? "border-cyan-500 bg-cyan-50"
              : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-50"
          }`}
        >
          <input {...getInputProps()} />

          {!selectedFile ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_#000000] ${
                  isDragActive ? "bg-cyan-300" : "bg-yellow-300"
                }`}
              >
                <Upload
                  className={`h-10 w-10 ${isDragActive ? "animate-bounce" : ""}`}
                  strokeWidth={3}
                />
              </div>
              <div>
                <p className="text-xl font-black text-black">
                  {isDragActive
                    ? "Drop your CV here!"
                    : "Drag & drop your CV"}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                PDF or DOCX — max {MAX_FILE_SIZE / 1024 / 1024}MB
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-3 border-black bg-green-300 shadow-[3px_3px_0px_0px_#000000]">
                <FileText className="h-8 w-8" strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-bold text-black">
                  {selectedFile.name}
                </p>
                <p className="text-sm font-medium text-gray-500">
                  {formatSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg border-3 border-black bg-red-100 text-red-600 shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-red-200"
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        {/* Supported formats info */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ALLOWED_FILE_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="rounded-lg border-2 border-black bg-gray-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-600"
            >
              {ext}
            </span>
          ))}
          <span className="text-xs font-medium text-gray-400">
            supported formats
          </span>
        </div>

        {/* Submit */}
        <form onSubmit={handleSubmit} className="mt-6">
          <Button
            type="submit"
            disabled={!selectedFile || isPending || isSubmitting}
            className="h-14 w-full rounded-xl border-4 border-black bg-yellow-300 text-base font-black uppercase tracking-wider text-black shadow-[6px_6px_0px_0px_#000000] transition-all hover:bg-yellow-400 hover:shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[6px_6px_0px_0px_#000000] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {isPending || isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileUp className="h-5 w-5" strokeWidth={3} />
                Upload CV
              </span>
            )}
          </Button>
        </form>

        {/* Animated progress steps */}
        <ProgressSteps isActive={isPending || isSubmitting} />
      </div>

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
          <h3 className="text-sm font-black text-black">1. Upload</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Select your CV file (PDF or DOCX)
          </p>
        </div>
        <div className="rounded-xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
          <h3 className="text-sm font-black text-black">2. Parse</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            We extract text from your document
          </p>
        </div>
        <div className="rounded-xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
          <h3 className="text-sm font-black text-black">3. Analyze</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            AI scores and gives recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
