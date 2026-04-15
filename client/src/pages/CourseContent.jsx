import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buildAssetUrl, fetchJson } from "../api";

const VIEWABLE_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".txt"];

function normalizeType(type) {
  if (type === "videos" || type === "video") return "videos";
  if (type === "tests" || type === "test") return "tests";
  return "assignments";
}

function getStatus(progress, type, itemId) {
  const itemKey = String(itemId);
  const completedKey = `completed${type[0].toUpperCase()}${type.slice(1)}`;
  const accessedKey = `accessed${type[0].toUpperCase()}${type.slice(1)}`;

  if (progress?.[completedKey]?.includes(itemKey)) return "completed";
  if (progress?.[accessedKey]?.includes(itemKey)) return "in_progress";
  return "not_started";
}

function isEmbeddableFile(url = "") {
  const lower = url.toLowerCase();
  return VIEWABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

const CourseContent = () => {
  const navigate = useNavigate();
  const { courseId, contentType, itemIndex } = useParams();
  const type = normalizeType(contentType);
  const itemId = String(itemIndex);
  const storedUser = useMemo(() => {
    const raw = localStorage.getItem("subscription-user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const accessLoggedRef = useRef(false);

  useEffect(() => {
    accessLoggedRef.current = false;
  }, [courseId, type, itemId]);

  useEffect(() => {
    const loadContent = async () => {
      if (!storedUser?.email) {
        navigate("/");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [courseData, progressData] = await Promise.all([
          fetchJson(`/api/courses/${courseId}`),
          fetchJson(`/api/progress/${encodeURIComponent(storedUser.email)}`)
        ]);

        const existingProgress = progressData.progress.find((entry) => entry.courseId === courseId) || null;
        setCourse(courseData);
        setProgress(existingProgress);
      } catch (loadError) {
        setError(loadError.message || "Unable to load this content.");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [courseId, navigate, storedUser?.email]);

  const item = course?.[type]?.[Number(itemIndex)] || null;
  const fileUrl = buildAssetUrl(item?.url);
  const status = getStatus(progress, type, itemId);
  const isVideo = type === "videos";
  const isTest = type === "tests";
  const showInlinePreview = isVideo || isEmbeddableFile(fileUrl);

  const syncProgress = async () => {
    if (!storedUser?.email) return;
    const latest = await fetchJson(`/api/progress/${encodeURIComponent(storedUser.email)}`);
    setProgress(latest.progress.find((entry) => entry.courseId === courseId) || null);
  };

  const sendProgress = async (endpoint) => {
    if (!storedUser?.email) return;

    setSaving(true);
    try {
      await fetchJson(endpoint, {
        method: "POST",
        body: JSON.stringify({
          userId: storedUser.email,
          courseId,
          itemId,
          type
        })
      });
      await syncProgress();
    } finally {
      setSaving(false);
    }
  };

  const markAccessed = async () => {
    if (accessLoggedRef.current || type === "assignments") return;
    accessLoggedRef.current = true;
    try {
      await sendProgress("/api/progress/access");
    } catch (accessError) {
      setError(accessError.message || "Unable to record content access.");
    }
  };

  useEffect(() => {
    if (!item || !storedUser?.email) return;

    if (type === "assignments" && status !== "completed") {
      sendProgress("/api/progress/complete").catch((completeError) => {
        setError(completeError.message || "Unable to record assignment access.");
      });
      return;
    }

    if (type === "tests" && status === "not_started") {
      markAccessed();
    }
  }, [item, status, storedUser?.email, type]);

  if (!storedUser) return null;

  return (
    <div className="page shell viewer-page" style={{ minHeight: "100vh" }}>
      <header className="topbar" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h2>{item?.title || "Course content"}</h2>
          <p style={{ color: "#94a3b8", marginTop: "6px" }}>
            {course?.title ? `${course.title} • ${type.slice(0, -1)}` : "Loading content"}
          </p>
          {!loading && !error && (
            <p style={{ color: "#cbd5e1", marginTop: "6px" }}>
              Status: {status === "completed" ? "Completed" : status === "in_progress" ? "In progress" : "Not started"}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="btn outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
          {fileUrl && (
            <a className="btn primary" href={fileUrl} target="_blank" rel="noreferrer noopener">
              Open Source File
            </a>
          )}
        </div>
      </header>

      <div className="panel" style={{ marginTop: "18px", minHeight: "80vh" }}>
        <div className="panel-body" style={{ display: "grid", gap: "18px", minHeight: "80vh" }}>
          {loading && <p style={{ color: "#94a3b8" }}>Loading content...</p>}
          {!loading && error && <p className="error-message">{error}</p>}
          {!loading && !error && !item && (
            <div style={{ color: "#94a3b8" }}>
              <p>This content item could not be found.</p>
              <Link to="/dashboard">Return to the dashboard</Link>
            </div>
          )}
          {!loading && !error && item && (
            <>
              {isVideo ? (
                <video
                  controls
                  src={fileUrl}
                  style={{ width: "100%", maxHeight: "70vh", borderRadius: "20px", background: "#020617" }}
                  onPlay={markAccessed}
                  onEnded={() => sendProgress("/api/progress/complete").catch((completeError) => {
                    setError(completeError.message || "Unable to mark the video as completed.");
                  })}
                />
              ) : showInlinePreview ? (
                <iframe
                  src={fileUrl}
                  title={item.title}
                  style={{ width: "100%", minHeight: "70vh", border: "none", borderRadius: "20px", background: "#fff" }}
                />
              ) : (
                <div style={{ padding: "32px", borderRadius: "20px", background: "#0f172a", color: "#cbd5e1" }}>
                  <p>This file type cannot be previewed inline.</p>
                  <p>Use the button above to open or download it.</p>
                </div>
              )}

              {isTest && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, color: "#94a3b8" }}>
                    Open the uploaded test file, complete it, then submit here to update progress.
                  </p>
                  <button
                    className="btn primary"
                    disabled={saving || status === "completed"}
                    onClick={() => sendProgress("/api/progress/complete").catch((completeError) => {
                      setError(completeError.message || "Unable to submit the test.");
                    })}
                  >
                    {status === "completed" ? "Submitted" : saving ? "Saving..." : "Mark Test Submitted"}
                  </button>
                </div>
              )}

              {type === "assignments" && (
                <p style={{ margin: 0, color: "#94a3b8" }}>
                  Opening this assignment records it as accessed. Download the source file if you need to work on it offline.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseContent;
