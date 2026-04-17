import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson } from "../api";

const EMPTY_PROGRESS = {
  accessedVideos: [],
  accessedTests: [],
  accessedAssignments: [],
  completedVideos: [],
  completedTests: [],
  completedAssignments: []
};

function getCount(course, field) {
  return course?.[field]?.length ?? course?.[`${field}Count`] ?? 0;
}

function toProgressMap(progressList = []) {
  return progressList.reduce((map, entry) => {
    map[entry.courseId] = {
      accessedVideos: entry.accessedVideos || [],
      accessedTests: entry.accessedTests || [],
      accessedAssignments: entry.accessedAssignments || [],
      completedVideos: entry.completedVideos || [],
      completedTests: entry.completedTests || [],
      completedAssignments: entry.completedAssignments || []
    };
    return map;
  }, {});
}

function getItemStatus(progress, section, index) {
  const itemKey = String(index);
  const completedKey = `completed${section[0].toUpperCase()}${section.slice(1)}`;
  const accessedKey = `accessed${section[0].toUpperCase()}${section.slice(1)}`;

  if (progress?.[completedKey]?.includes(itemKey)) return "completed";
  if (progress?.[accessedKey]?.includes(itemKey)) return "in_progress";
  return "not_started";
}

function getStatusLabel(section, status) {
  if (section === "videos") {
    if (status === "completed") return "Watched";
    if (status === "in_progress") return "Continue";
    return "Watch";
  }

  if (section === "tests") {
    if (status === "completed") return "Submitted";
    if (status === "in_progress") return "Resume";
    return "Start Test";
  }

  if (status === "completed") return "Viewed";
  return "Open";
}

const UserDashboard = ({ user, onLogout, onUserUpdate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [plans, setPlans] = useState([]);
  const [paymentCourse, setPaymentCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});
  const [progressSummary, setProgressSummary] = useState({ completedItems: 0, totalItems: 0, percent: 0 });
  const [activeDays, setActiveDays] = useState(0);
  const [dashboardError, setDashboardError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [upgradePlanId, setUpgradePlanId] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setDashboardError("");

      try {
        const [activityData, coursesData, profileData, plansData, progressData] = await Promise.all([
          fetchJson("/api/progress/activity", {
            method: "POST",
            body: JSON.stringify({ userId: user.email })
          }),
          fetchJson("/api/courses"),
          fetchJson(`/api/users/profile?email=${encodeURIComponent(user.email)}`),
          fetchJson("/api/plans"),
          fetchJson(`/api/progress/${encodeURIComponent(user.email)}`)
        ]);

        if (!active) return;

        setCourses(coursesData);
        setEnrolledIds(profileData.enrolledCourses.map((course) => course._id));
        setPlans(plansData);
        setCourseProgress(toProgressMap(progressData.progress));
        setProgressSummary(progressData.summary);
        setActiveDays(activityData.activeDays ?? progressData.activeDays ?? profileData.activeDays ?? 0);
      } catch (error) {
        if (!active) return;
        setDashboardError(error.message || "Unable to load your dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, [user.email]);

  const enrolledList = useMemo(
    () => courses.filter((course) => enrolledIds.includes(course._id)),
    [courses, enrolledIds]
  );

  const totalCourses = courses.length;
  const freeCourses = courses.filter((course) => course.type === "Free").length;
  const paidCourses = courses.filter((course) => course.type !== "Free").length;
  const enrolledCourses = enrolledIds.length;
  const totalDays = 30;
  const completedPercent = progressSummary.percent || 0;

  const currentPlan = plans.find((plan) => plan.name.toLowerCase() === user.plan.toLowerCase());
  const currentAllowedTypes = Array.from(new Set(["Free", ...(currentPlan?.allowedTypes || ["Free"])]));
  const canAccessCourse = (course) => course.type === "Free" || currentAllowedTypes.includes(course.type);

  const handleEnroll = async (courseId) => {
    setActionMessage("");
    setActionError("");

    try {
      const response = await fetchJson("/api/users/enroll", {
        method: "POST",
        body: JSON.stringify({ email: user.email, courseId })
      });
      setEnrolledIds(response.user.enrolledCourses.map((course) => course._id));
      setActionMessage("Course enrolled successfully.");
    } catch (error) {
      setActionError(error.message || "Unable to enroll in course.");
    }
  };

  const openCourseDetail = async (course) => {
    setActionError("");

    try {
      const latestCourse = await fetchJson(`/api/courses/${course._id}`);
      setSelectedCourse(latestCourse);
    } catch (error) {
      setActionError(error.message || "Failed to load course details.");
      setSelectedCourse(course);
    }
  };

  const closeCourseDetail = () => {
    setSelectedCourse(null);
  };

  const openCourseContent = (courseId, section, index, item) => {
    if (!item?.url) {
      setActionError("This item does not have an uploaded file yet.");
      return;
    }

    navigate(`/content/${courseId}/${section}/${index}`);
  };

  const availableCourses = useMemo(
    () => courses.filter((course) => !enrolledIds.includes(course._id)),
    [courses, enrolledIds]
  );

  const selectedProgress = selectedCourse ? courseProgress[selectedCourse._id] || EMPTY_PROGRESS : EMPTY_PROGRESS;
  const selectedTests = selectedCourse?.tests?.length ? selectedCourse.tests : [];
  const selectedVideos = selectedCourse?.videos?.length ? selectedCourse.videos : [];
  const selectedAssignments = selectedCourse?.assignments?.length ? selectedCourse.assignments : [];
  const selectedTestsCount = getCount(selectedCourse, "tests");
  const selectedVideosCount = getCount(selectedCourse, "videos");
  const selectedAssignmentsCount = getCount(selectedCourse, "assignments");
  const completedTests = selectedProgress.completedTests.length;
  const completedVideos = selectedProgress.completedVideos.length;
  const completedAssignments = selectedProgress.completedAssignments.length;

  const openPayment = (course) => {
    setPaymentCourse(course);
    setActiveTab("plans");
  };

  const closePayment = () => {
    setPaymentCourse(null);
  };

  const upgradePlan = async (plan) => {
    if (!plan || plan.name === user.plan) return;

    setActionMessage("");
    setActionError("");
    setUpgradeLoading(true);
    setUpgradePlanId(plan._id);

    try {
      const waitTime = 3000 + Math.floor(Math.random() * 2001);
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      const response = await fetchJson("/api/users/upgrade-plan", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          planId: plan._id
        })
      });

      onUserUpdate?.(response.user);
      setActionMessage(`${plan.name} plan activated successfully.`);
      setPaymentCourse(null);
    } catch (error) {
      setActionError(error.message || "Unable to upgrade the plan.");
    } finally {
      setUpgradeLoading(false);
      setUpgradePlanId("");
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await fetchJson("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword
        })
      });
      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page shell dashboard-page">
        <main className="content">
          <div className="panel">
            <div className="panel-body">
              <p style={{ color: "#94a3b8" }}>Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page shell dashboard-page">
      <aside className="sidebar">
        <div className="brand">User Dashboard</div>
        <nav>
          <a
            href="#"
            className={activeTab === "home" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("home");
            }}
          >
            Home
          </a>
          <a
            href="#"
            className={activeTab === "courses" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("courses");
            }}
          >
            Courses
          </a>
          <a
            href="#"
            className={activeTab === "plans" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("plans");
            }}
          >
            Plans
          </a>
          <a
            href="#"
            className={activeTab === "account" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("account");
            }}
          >
            Account
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>
            Logout
          </a>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h2>Welcome, {user.name}</h2>
            <p>Here is your subscription summary and course progress.</p>
          </div>
          <div className="user-chip">{user.plan}</div>
        </header>

        {dashboardError && (
          <div className="panel" style={{ marginBottom: "18px" }}>
            <div className="panel-body">
              <p className="error-message">{dashboardError}</p>
            </div>
          </div>
        )}

        {(actionMessage || actionError) && (
          <div className="panel" style={{ marginBottom: "18px" }}>
            <div className="panel-body">
              {actionMessage && <p className="success-message">{actionMessage}</p>}
              {actionError && <p className="error-message">{actionError}</p>}
            </div>
          </div>
        )}

        <section className="stats-grid" style={{ display: activeTab === "home" ? "grid" : "none" }}>
          <article className="stat-card blue">
            <span>Total Courses</span>
            <strong>{totalCourses}</strong>
          </article>
          <article className="stat-card green">
            <span>Free Courses</span>
            <strong>{freeCourses}</strong>
          </article>
          <article className="stat-card yellow">
            <span>Paid Courses</span>
            <strong>{paidCourses}</strong>
          </article>
          <article className="stat-card orange">
            <span>Enrolled Courses</span>
            <strong>{enrolledCourses}</strong>
          </article>
        </section>
        <section className="dashboard-widgets" style={{ display: activeTab === "home" ? "grid" : "none" }}>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="panel-header">
              <h3>Progress Overview</h3>
            </div>
            <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px", alignItems: "center" }}>
              <div style={{ display: "grid", placeItems: "center" }}>
                <div
                  style={{
                    width: "170px",
                    height: "170px",
                    borderRadius: "50%",
                    background: `conic-gradient(#38bdf8 ${completedPercent * 3.6}deg, #334155 0deg)`,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontWeight: 700,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
                  }}
                >
                  {completedPercent}%
                </div>
                <p style={{ marginTop: "16px", color: "#cbd5e1", textAlign: "center" }}>
                  {progressSummary.completedItems}/{progressSummary.totalItems} items completed
                </p>
              </div>

              <div>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1" }}>
                    <span>Active days</span>
                    <strong>{activeDays}/{totalDays}</strong>
                  </div>
                  <div style={{ width: "100%", height: "14px", background: "#1e293b", borderRadius: "999px" }}>
                    <div style={{ width: `${(activeDays / totalDays) * 100}%`, height: "100%", background: "#38bdf8", borderRadius: "999px" }} />
                  </div>
                  <p style={{ margin: 0, color: "#94a3b8" }}>Keep your streak alive by learning consistently across the last 30 days.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header">
              <h3>Free Courses</h3>
            </div>
            <div className="panel-body course-grid">
              {courses.filter((course) => course.type === "Free").slice(0, 2).map((course) => (
                <article key={course._id}>
                  <div className={`badge ${course.type.toLowerCase()}`}>{course.type}</div>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                  <button className="btn primary" onClick={() => handleEnroll(course._id)}>Enroll</button>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Paid Courses</h3>
            </div>
            <div className="panel-body course-grid">
              {courses.filter((course) => course.type !== "Free").slice(0, 2).map((course) => (
                <article key={course._id}>
                  <div className={`badge ${course.type.toLowerCase()}`}>{course.type}</div>
                  <h4>{course.title}</h4>
                  <p>{course.description}</p>
                  <button className="btn secondary" onClick={() => openPayment(course)}>
                    Subscribe to Unlock
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Subscription Plans</h3>
            </div>
            <div className="panel-body plans-row">
              {plans.map((plan) => (
                <div key={plan._id} className={`plan-card ${plan.name.includes(user.plan) ? "active" : ""}`}>
                  <h4>{plan.name}</h4>
                  <strong>{plan.price}</strong>
                  <span>{plan.description}</span>
                  <p style={{ marginTop: "12px", color: "#94a3b8" }}>Access: {plan.allowedTypes?.join(", ") || "Free"}</p>
                  <button
                    className={`btn ${plan.name.includes(user.plan) ? "secondary" : "primary"}`}
                    disabled={upgradeLoading}
                    onClick={() => {
                      if (!plan.name.includes(user.plan)) {
                        upgradePlan(plan);
                      }
                    }}
                  >
                    {plan.name.includes(user.plan)
                      ? "Current Plan"
                      : upgradeLoading && upgradePlanId === plan._id
                        ? "Processing..."
                        : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-widgets">
          {activeTab === "courses" && (
            <>
              <div className="panel course-list">
                <div className="panel-header">
                  <h3>Enrolled Courses</h3>
                </div>
                <div className="panel-body course-grid">
                  {enrolledList.length ? (
                    enrolledList.map((course) => (
                      <article key={course._id}>
                        <div className={`badge ${course.type.toLowerCase()}`}>{course.type}</div>
                        <h4>{course.title}</h4>
                        <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
                          <small style={{ color: "#94a3b8" }}>Tests: {getCount(course, "tests")}</small>
                          <small style={{ color: "#94a3b8" }}>Videos: {getCount(course, "videos")}</small>
                          <small style={{ color: "#94a3b8" }}>Assignments: {getCount(course, "assignments")}</small>
                        </div>
                        <button className="btn secondary" onClick={() => openCourseDetail(course)}>Open Course</button>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">You haven't enrolled in any courses yet.</p>
                  )}
                </div>
              </div>

              {selectedCourse && (
                <div className="panel course-detail">
                  <div className="panel-header">
                    <div>
                      <h3>{selectedCourse.title}</h3>
                      <p style={{ color: "#94a3b8", marginTop: "6px" }}>{selectedCourse.description}</p>
                    </div>
                    <button className="btn outline" onClick={closeCourseDetail}>Close</button>
                  </div>
                  <div className="panel-body">
                    <div style={{ display: "grid", gap: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>Tests</strong>
                          <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>{completedTests}/{selectedTestsCount} submitted</p>
                        </div>
                        <span>{selectedTestsCount}</span>
                      </div>
                      <div style={{ display: "grid", gap: "8px", padding: "12px", background: "#0f172a", borderRadius: "18px" }}>
                        {selectedTests.length > 0 ? selectedTests.map((item, index) => {
                          const status = getItemStatus(selectedProgress, "tests", index);
                          return (
                            <div key={`test-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                              <span>{item.title || `Test ${index + 1}`}</span>
                              <button
                                className={`btn ${status === "completed" ? "secondary" : "primary"}`}
                                onClick={() => openCourseContent(selectedCourse._id, "tests", index, item)}
                              >
                                {getStatusLabel("tests", status)}
                              </button>
                            </div>
                          );
                        }) : <p style={{ color: "#94a3b8" }}>No tests uploaded yet.</p>}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>Video Lessons</strong>
                          <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>{Math.min(completedVideos, selectedVideosCount)}/{selectedVideosCount} watched</p>
                        </div>
                        <span>{selectedVideosCount}</span>
                      </div>
                      <div style={{ display: "grid", gap: "8px", padding: "12px", background: "#0f172a", borderRadius: "18px" }}>
                        {selectedVideos.length > 0 ? selectedVideos.map((item, index) => {
                          const status = getItemStatus(selectedProgress, "videos", index);
                          return (
                            <div key={`video-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                              <span>{item.title || `Video ${index + 1}`}</span>
                              <button
                                className={`btn ${status === "completed" ? "secondary" : "primary"}`}
                                onClick={() => openCourseContent(selectedCourse._id, "videos", index, item)}
                              >
                                {getStatusLabel("videos", status)}
                              </button>
                            </div>
                          );
                        }) : <p style={{ color: "#94a3b8" }}>No videos uploaded yet.</p>}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>Assignments</strong>
                          <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>{completedAssignments}/{selectedAssignmentsCount} opened</p>
                        </div>
                        <span>{selectedAssignmentsCount}</span>
                      </div>
                      <div style={{ display: "grid", gap: "8px", padding: "12px", background: "#0f172a", borderRadius: "18px" }}>
                        {selectedAssignments.length > 0 ? selectedAssignments.map((item, index) => {
                          const status = getItemStatus(selectedProgress, "assignments", index);
                          return (
                            <div key={`assignment-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                              <span>{item.title || `Assignment ${index + 1}`}</span>
                              <button
                                className={`btn ${status === "completed" ? "secondary" : "primary"}`}
                                onClick={() => openCourseContent(selectedCourse._id, "assignments", index, item)}
                              >
                                {getStatusLabel("assignments", status)}
                              </button>
                            </div>
                          );
                        }) : <p style={{ color: "#94a3b8" }}>No assignments uploaded yet.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="panel course-list">
                <div className="panel-header">
                  <h3>Discover Courses</h3>
                </div>
                <div className="panel-body course-grid">
                  {availableCourses.map((course) => {
                    const restricted = !canAccessCourse(course);
                    return (
                      <article key={course._id}>
                        <div className={`badge ${course.type.toLowerCase()}`}>{course.type}</div>
                        <h4>{course.title}</h4>
                        <p style={{ color: "#94a3b8", marginBottom: "14px" }}>
                          Access: {restricted ? "Upgrade required" : "Available"}
                        </p>
                        <button
                          className={`btn ${restricted ? "secondary" : "primary"}`}
                          onClick={() => restricted ? openPayment(course) : handleEnroll(course._id)}
                        >
                          {restricted ? `Upgrade to ${course.type}` : "Enroll"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* {paymentCourse && (
            <div className="panel">
              <div className="panel-header">
                <h3>UPI / QR Payment</h3>
              </div>
              <div className="panel-body">
                <p>To access <strong>{paymentCourse.title}</strong>, complete the payment using the QR code below.</p>
                <div id="1" style={{ display: "flex", flexDirection: "row", gap: "24px", alignItems: "center" }}>
                  <div style={{ width: "220px", height: "220px", background: "#020617", borderRadius: "24px", display: "grid", placeItems: "center", color: "#94a3b8", fontSize: "0.95rem", textAlign: "center" }}>
                    <div>
                      <div ><img src="QR2.png" alt="PhonePe QR Code" width="150" height="150"></img></div>
                      <div style={{ marginTop: "12px", fontWeight: 700, color: "#38bdf8" }}>
                        QR CODE
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: "1", minWidth: "260px" }}>
                    <p><strong>UPI ID:</strong> pay@upi</p>
                    <p><strong>Amount:</strong> Rs 499</p>
                    <p><strong>Reference:</strong> {paymentCourse.type} Course Upgrade</p>
                    <button className="btn primary" onClick={() => alert("Payment flow opened. Scan the QR code with your UPI app.")}>Open UPI</button>
                    <button className="btn secondary" style={{ marginLeft: "12px" }} onClick={closePayment}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {activeTab === "plans" && (
            <section className="plans-row">
              {plans.map((plan) => (
                <div key={plan._id} className={`plan-card ${plan.name.includes(user.plan) ? "active" : ""}`}>
                  <h4>{plan.name}</h4>
                  <strong>{plan.price}</strong>
                  <span>{plan.description}</span>
                  <p style={{ marginTop: "12px", color: "#94a3b8" }}><strong>Access:</strong> {plan.allowedTypes?.join(", ") || "Free"}</p>
                  <button
                    className={`btn ${plan.name.includes(user.plan) ? "secondary" : "primary"}`}
                    disabled={upgradeLoading}
                    onClick={() => {
                      if (!plan.name.includes(user.plan)) {
                        upgradePlan(plan);
                      }
                    }}
                  >
                    {plan.name.includes(user.plan)
                      ? "Current Plan"
                      : upgradeLoading && upgradePlanId === plan._id
                        ? "Processing..."
                        : "Upgrade"}
                  </button>
                </div>
              ))}
            </section>
          )}

          {activeTab === "account" && (
            <div className="panel" style={{ width: "100%" }}>
              <div className="panel-header">
                <h3>Change Password</h3>
              </div>
              <div className="panel-body" style={{ display: "grid", gap: "18px", maxWidth: "520px" }}>
                <form onSubmit={onChangePassword} style={{ display: "grid", gap: "14px" }}>
                  <label>
                    Current Password
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </label>
                  <label>
                    New Password
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </label>
                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </label>
                  <button type="submit" className="btn primary" disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                  {passwordMessage && <p className="success-message">{passwordMessage}</p>}
                  {passwordError && <p className="error-message">{passwordError}</p>}
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;
