import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const FileViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileUrl = searchParams.get("url");
  const title = searchParams.get("title") || "Course file";

  const iframeSrc = useMemo(() => fileUrl || "", [fileUrl]);

  return (
    <div className="page shell viewer-page" style={{ minHeight: "100vh" }}>
      <header className="topbar" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>View File</h2>
          <p style={{ color: "#94a3b8", marginTop: "6px" }}>{title}</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn outline" onClick={() => navigate(-1)}>
            Back
          </button>
          {fileUrl && (
            <a className="btn primary" href={iframeSrc} target="_blank" rel="noreferrer noopener">
              Open in New Tab
            </a>
          )}
        </div>
      </header>

      <div className="panel" style={{ marginTop: "18px", minHeight: "80vh" }}>
        <div className="panel-body" style={{ padding: 0, minHeight: "80vh" }}>
          {fileUrl ? (
            <iframe
              src={iframeSrc}
              title={title}
              style={{ width: "100%", height: "80vh", border: "none" }}
            />
          ) : (
            <div style={{ padding: "32px", color: "#94a3b8" }}>
              <p>No file URL was provided.</p>
              <p>Please return to the course page and try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
