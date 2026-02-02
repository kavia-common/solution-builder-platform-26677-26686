import React, { useMemo, useRef, useState } from "react";

// PUBLIC_INTERFACE
export default function FileDropzone({ onFiles, error, isProcessing }) {
  /** Drag-and-drop + file picker for docs. */
  const inputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const accept = useMemo(() => ".pdf,.docx,.md,.txt", []);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    onFiles?.(files);
  };

  return (
    <div>
      <div
        className={`dropzone ${isDragOver ? "dragover" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openPicker();
        }}
        aria-label="Upload documents by dragging and dropping or by opening a file picker"
        aria-disabled={isProcessing ? "true" : "false"}
      >
        <div className="dropzone-inner">
          <div className="dropzone-title">Drop documents here</div>
          <div className="muted">PDF, DOCX, MD, TXT — up to 10MB each</div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={openPicker} disabled={isProcessing}>
              Choose files
            </button>
            <span className="badge badge-accent">Offline-first</span>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => onFiles?.(e.target.files)}
          style={{ display: "none" }}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {error ? (
        <div className="inline-error" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
}
