import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../api";

function parsePrice(price = "") {
  const digits = String(price).replace(/[^\d.]/g, "");
  return digits ? Number(digits) : 0;
}

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [contentCourse, setContentCourse] = useState(null);
  const [contentCategory, setContentCategory] = useState("tests");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesData, usersData, plansData] = await Promise.all([
          fetchJson("/api/courses"),
          fetchJson("/api/users"),
          fetchJson("/api/plans")
        ]);
        setCourses(coursesData);
        setUsers(usersData);
        setPlans(plansData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const intervalId = setInterval(loadData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const totalUsers = users.length;
  const totalCourses = courses.length;
  const activeSubscriptions = users.filter((u) => u.status === "Active").length;
  const totalEarnings = useMemo(() => {
    const planPriceMap = plans.reduce((map, plan) => {
      map[plan.name] = parsePrice(plan.price);
      return map;
    }, {});

    const monthly = users.reduce((sum, u) => {
      if (u.role === "admin") return sum;
      return sum + (planPriceMap[u.plan] || 0);
    }, 0);
    return `Rs ${monthly.toLocaleString()}`;
  }, [plans, users]);

  const freeCourses = courses.filter((course) => course.type === "Free").length;
  const premiumCourses = courses.filter((course) => course.type === "Premium").length;
  const proCourses = courses.filter((course) => course.type === "Pro").length;

  const topCourses = [...courses]
    .sort((a, b) => (b.enrolled || 0) - (a.enrolled || 0))
    .slice(0, 3);
  const topUsers = [...users]
    .sort((a, b) => {
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (a.status !== "Active" && b.status === "Active") return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);

  const onDeleteCourse = async (courseId) => {
    try {
      await fetchJson(`/api/courses/${courseId}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((course) => course._id !== courseId));
    } catch (error) {
      console.error(error);
      alert("Unable to delete course.");
    }
  };

  const onAddCourse = async () => {
    const title = prompt("Enter course title");
    const type = prompt("Enter course type (Free, Pro, Premium)");
    const description = prompt("Enter course description");
    const testsCount = Number(prompt("Number of tests", "0")) || 0;
    const videosCount = Number(prompt("Number of videos", "0")) || 0;
    const assignmentsCount = Number(prompt("Number of assignments", "0")) || 0;
    if (title && type) {
      try {
        const course = await fetchJson("/api/courses", {
          method: "POST",
          body: JSON.stringify({ title, type, description, enrolled: 0, testsCount, videosCount, assignmentsCount, tests: [], videos: [], assignments: [] })
        });
        setCourses((prev) => [...prev, course]);
      } catch (error) {
        console.error(error);
        alert("Unable to add course.");
      }
    }
  };

  const onEditCourse = async (courseId) => {
    const course = courses.find((item) => item._id === courseId);
    if (!course) return;
    const title = prompt("Course title", course.title);
    const type = prompt("Course type (Free, Pro, Premium)", course.type);
    const description = prompt("Course description", course.description);
    const testsCount = Number(prompt("Number of tests", String(course.testsCount || 0))) || 0;
    const videosCount = Number(prompt("Number of videos", String(course.videosCount || 0))) || 0;
    const assignmentsCount = Number(prompt("Number of assignments", String(course.assignmentsCount || 0))) || 0;
    if (!title || !type) return;
    try {
      const updated = await fetchJson(`/api/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({ ...course, title, type, description, testsCount, videosCount, assignmentsCount })
      });
      setCourses((prev) => prev.map((item) => (item._id === courseId ? updated : item)));
    } catch (error) {
      console.error(error);
      alert("Unable to update course.");
    }
  };

  const onTogglePlan = async (planId) => {
    try {
      const plan = plans.find((item) => item._id === planId);
      if (!plan) return;
      await fetchJson(`/api/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify({ ...plan, active: !plan.active })
      });
      setPlans((prev) => prev.map((item) => item._id === planId ? { ...item, active: !item.active } : item));
    } catch (error) {
      console.error(error);
      alert("Unable to update plan.");
    }
  };

  const onAddSubscription = async () => {
    const name = prompt("Plan name");
    const price = prompt("Plan price (e.g. ₹299 / Month)");
    const description = prompt("Plan description");
    const allowedTypesString = prompt("Allowed course categories (comma-separated, e.g. Free, Pro, Premium)", "Free");
    if (!name || !price || !description || !allowedTypesString) return;
    const allowedTypes = allowedTypesString.split(",").map((type) => type.trim()).filter(Boolean);
    try {
      const plan = await fetchJson("/api/plans", {
        method: "POST",
        body: JSON.stringify({ name, price, description, active: false, allowedTypes })
      });
      setPlans((prev) => [...prev, plan]);
    } catch (error) {
      console.error(error);
      alert("Unable to add subscription plan.");
    }
  };

  const onEditSubscription = async (planId) => {
    const plan = plans.find((item) => item._id === planId);
    if (!plan) return;
    const name = prompt("Plan name", plan.name);
    const price = prompt("Plan price", plan.price);
    const description = prompt("Plan description", plan.description);
    const allowedTypesString = prompt("Allowed course categories (comma-separated)", plan.allowedTypes?.join(", ") || "Free");
    if (!name || !price || !description || !allowedTypesString) return;
    const allowedTypes = allowedTypesString.split(",").map((type) => type.trim()).filter(Boolean);
    try {
      const updated = await fetchJson(`/api/plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify({ ...plan, name, price, description, allowedTypes })
      });
      setPlans((prev) => prev.map((item) => item._id === planId ? updated : item));
    } catch (error) {
      console.error(error);
      alert("Unable to edit subscription plan.");
    }
  };

  const onRemoveSubscription = async (planId) => {
    if (!confirm("Remove this subscription plan?")) return;
    try {
      await fetchJson(`/api/plans/${planId}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((plan) => plan._id !== planId));
    } catch (error) {
      console.error(error);
      alert("Unable to remove subscription plan.");
    }
  };

  const onRemoveUser = async (userId) => {
    if (!confirm("Remove this user permanently?")) return;
    try {
      await fetchJson(`/api/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((userRow) => userRow._id !== userId));
    } catch (error) {
      console.error(error);
      alert("Unable to remove user.");
    }
  };

  const onOpenContentManager = (course) => {
    setContentCourse(course);
    setContentCategory("tests");
    setUploadFile(null);
    setUploadTitle("");
  };

  const onUploadContent = async () => {
    if (!contentCourse || !uploadFile) {
      alert("Please select a file to upload.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", contentCategory);
      formData.append("title", uploadTitle || uploadFile.name);

      const updated = await fetchJson(`/api/courses/${contentCourse._id}/upload`, {
        method: "POST",
        body: formData
      });
      setCourses((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      setContentCourse(updated);
      setUploadFile(null);
      setUploadTitle("");
      alert("Upload completed.");
    } catch (error) {
      console.error(error);
      alert("Failed to upload course content.");
    }
  };

  const onSelectUploadFile = (event) => {
    setUploadFile(event.target.files?.[0] || null);
  };

  const closeContentManager = () => {
    setContentCourse(null);
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

  return (
    <div className="page shell dashboard-page">
      <aside className="sidebar">
        <div className="brand">Admin Dashboard</div>
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
            Manage Courses
          </a>
          <a
            href="#"
            className={activeTab === "users" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("users");
            }}
          >
            Manage Users
          </a>
          <a
            href="#"
            className={activeTab === "plans" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("plans");
            }}
          >
            Subscription Plans
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
            <h2>Welcome back, {user.name}</h2>
            <p>Overview of your platform activity and subscription performance.</p>
          </div>
          <div className="user-chip">{user.role.toUpperCase()}</div>
        </header>

        <section className="stats-grid" style={{ display: activeTab === "home" ? "grid" : "none" }}>
          <article className="stat-card blue">
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
          </article>
          <article className="stat-card green">
            <span>Total Courses</span>
            <strong>{totalCourses}</strong>
          </article>
          <article className="stat-card yellow">
            <span>Active Subscriptions</span>
            <strong>{activeSubscriptions}</strong>
          </article>
          <article className="stat-card orange">
            <span>Total Earnings</span>
            <strong>{totalEarnings}</strong>
          </article>
        </section>

        <section className="dashboard-widgets">
          {activeTab === "home" && (
            <>
              <div className="panel">
                <div className="panel-header">
                  <h3>Top Courses</h3>
                </div>
                <div className="panel-body">
                  <div className="table-card">
                    {topCourses.map((course) => (
                      <div key={course._id} className="table-row">
                        <span>{course.title}</span>
                        <span>{course.type}</span>
                        <span>{course.enrolled || 0} enrolled</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Top Users</h3>
                </div>
                <div className="panel-body">
                  <div className="table-card">
                    {topUsers.map((userRow) => (
                      <div key={userRow._id} className="table-row">
                        <span>{userRow.name}</span>
                        <span>{userRow.email}</span>
                        <span>{userRow.plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3>Subscription Plans</h3>
                </div>
                <div className="panel-body plans-row">
                  {plans.map((plan) => (
                    <div key={plan._id} className={`plan-card ${plan.active ? "active" : ""}`}>
                      <h4>{plan.name}</h4>
                      <strong>{plan.price}</strong>
                      <span>{plan.description}</span>
                      <p style={{ marginTop: "12px", color: "#94a3b8" }}>Access: {plan.allowedTypes?.join(", ") || "Free"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "courses" && (
            <>
              <div className="panel">
                <div className="panel-header">
                  <h3>Course Management</h3>
                  <button className="btn primary" onClick={onAddCourse}>Add Course</button>
                </div>
                <div className="panel-body">
                  <div className="table-card">
                    <div className="table-row header">
                      <span>Course</span>
                      <span>Type</span>
                      <span>Enrolled</span>
                      <span>Tests</span>
                      <span>Videos</span>
                      <span>Assignments</span>
                      <span>Actions</span>
                    </div>
                    {courses.map((course) => (
                      <div key={course._id} className="table-row">
                        <span>{course.title}</span>
                        <span>{course.type}</span>
                        <span>{course.enrolled}</span>
                        <span>{course.testsCount ?? 0}</span>
                        <span>{course.videosCount ?? 0}</span>
                        <span>{course.assignmentsCount ?? course.assignments?.length ?? 0}</span>
                        <span className="action-row">
                          <button className="btn outline" onClick={() => onEditCourse(course._id)}>Edit</button>
                          <button className="btn outline" onClick={() => onOpenContentManager(course)}>Upload Content</button>
                          <button className="btn danger" onClick={() => onDeleteCourse(course._id)}>Delete</button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {contentCourse && (
                <div className="panel" style={{ width: "100%" }}>
                  <div className="panel-header">
                    <h3>Upload Content for {contentCourse.title}</h3>
                    <button className="btn outline" onClick={closeContentManager}>Close</button>
                  </div>
                  <div className="panel-body" style={{ display: "grid", gap: "20px" }}>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <label>
                        Select content type
                        <select value={contentCategory} onChange={(e) => setContentCategory(e.target.value)}>
                          <option value="tests">Tests</option>
                          <option value="videos">Videos</option>
                          <option value="assignments">Assignments</option>
                        </select>
                      </label>
                      <label>
                        File title
                        <input
                          type="text"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Optional title"
                        />
                      </label>
                      <label>
                        Choose file
                        <input type="file" onChange={onSelectUploadFile} />
                      </label>
                      <button className="btn primary" onClick={onUploadContent} disabled={!uploadFile}>
                        Upload {contentCategory}
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      <div>
                        <strong>Existing Tests</strong>
                        <p>{contentCourse.tests?.length || 0} files</p>
                      </div>
                      <div>
                        <strong>Existing Videos</strong>
                        <p>{contentCourse.videos?.length || 0} files</p>
                      </div>
                      <div>
                        <strong>Existing Assignments</strong>
                        <p>{contentCourse.assignments?.length || 0} files</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "users" && (
            <div className="panel">
              <div className="panel-header">
                <h3>User Management</h3>
              </div>
              <div className="panel-body">
                <div className="table-card">
                  <div className="table-row header">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Plan</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {users.map((userRow) => (
                    <div key={userRow._id} className="table-row">
                      <span>{userRow.name}</span>
                      <span>{userRow.email}</span>
                      <span>{userRow.plan}</span>
                      <span>{userRow.status}</span>
                      <span className="action-row">
                        <button className="btn danger" onClick={() => onRemoveUser(userRow._id)}>Remove</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "plans" && (
            <section className="plans-row">
              <div className="plan-card active" style={{ width: "100%" }}>
                <h4>Subscription Controls</h4>
                <p>Manage the available plans here. You can add, edit, remove, or toggle a plan.</p>
                <button className="btn primary" onClick={onAddSubscription}>Add Subscription</button>
              </div>
              {plans.map((plan) => (
                <div key={plan._id} className={`plan-card ${plan.active ? "active" : ""}`}>
                  <h4>{plan.name}</h4>
                  <strong>{plan.price}</strong>
                  <span>{plan.description}</span>
                  <p style={{ marginTop: "12px", color: "#94a3b8" }}><strong>Access:</strong> {plan.allowedTypes?.join(", ") || "Free"}</p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                    <button className="btn outline" onClick={() => onEditSubscription(plan._id)}>Edit</button>
                    <button className="btn danger" onClick={() => onRemoveSubscription(plan._id)}>Remove</button>
                    <button className="btn primary" onClick={() => onTogglePlan(plan._id)}>{plan.active ? "Current Plan" : "Activate"}</button>
                  </div>
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

export default AdminDashboard;
