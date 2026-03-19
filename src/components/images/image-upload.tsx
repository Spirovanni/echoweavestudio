"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

interface ImageUploadProps {
  projectId: string;
  onUploadComplete?: (url: string, imageId?: string) => void;
  onUploadError?: (error: string) => void;
  createRecord?: boolean;
  title?: string;
  caption?: string;
  symbolism?: string;
  className?: string;
}

interface UploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  complete: boolean;
  error: string | null;
}

export function ImageUpload({
  projectId,
  onUploadComplete,
  onUploadError,
  createRecord = true,
  title,
  caption,
  symbolism,
  className,
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    complete: false,
    error: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setState((prev) => ({ ...prev, error, file: null, preview: null }));
      onUploadError?.(error);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setState((prev) => ({
        ...prev,
        file,
        preview: reader.result as string,
        error: null,
        complete: false,
      }));
    };
    reader.readAsDataURL(file);
  }, [onUploadError]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!state.file) return;

    setState((prev) => ({ ...prev, uploading: true, progress: 0, error: null }));

    try {
      const formData = new FormData();
      formData.append("file", state.file);
      formData.append("project_id", projectId);
      formData.append("create_record", createRecord.toString());
      if (title) formData.append("title", title);
      if (caption) formData.append("caption", caption);
      if (symbolism) formData.append("symbolism", symbolism);

      // Simulate progress (actual upload doesn't provide progress in fetch)
      const progressInterval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      setState((prev) => ({
        ...prev,
        uploading: false,
        progress: 100,
        complete: true,
      }));

      onUploadComplete?.(result.url, result.data?.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setState((prev) => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: errorMessage,
      }));
      onUploadError?.(errorMessage);
    }
  };

  const handleClear = () => {
    setState({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      complete: false,
      error: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !state.preview && fileInputRef.current?.click()}
        className={cn(
          "relative flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:bg-muted/50",
          isDragging && "border-primary bg-primary/10",
          state.preview && "cursor-default"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileInput}
          className="hidden"
        />

        {!state.preview ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="size-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag and drop your image here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports: JPG, PNG, WebP, GIF · Max {MAX_FILE_SIZE / 1024 / 1024}MB
            </p>
          </div>
        ) : (
          <div className="relative size-full">
            <img
              src={state.preview}
              alt="Preview"
              className="mx-auto max-h-96 rounded-lg object-contain"
            />
            {!state.uploading && !state.complete && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="size-4" />
              </Button>
            )}
            {state.complete && (
              <div className="absolute right-2 top-2 rounded-full bg-green-500 p-2">
                <CheckCircle2 className="size-4 text-white" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload progress */}
      {state.uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="font-medium">{state.progress}%</span>
          </div>
          <Progress value={state.progress} />
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Actions */}
      {state.preview && !state.complete && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={state.uploading}
            className="flex-1"
          >
            {state.uploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Upload Image
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={state.uploading}
          >
            Cancel
          </Button>
        </div>
      )}

      {state.complete && (
        <div className="flex items-center justify-between rounded-lg border border-green-500/50 bg-green-500/10 p-3">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-4" />
            <span>Upload complete!</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleClear}>
            Upload Another
          </Button>
        </div>
      )}
    </div>
  );
}
