// ReportingCenter.tsx
import React, { useEffect, useMemo, useState } from "react";
// @ts-ignore
import Pie from '@splunk/visualizations/Pie';
import { SplunkThemeProvider } from '@splunk/themes';

// --------------------------------------------------
// Types
// --------------------------------------------------
type ReportType = "Daily" | "Weekly" | "Monthly" | "Annual";
type Status = "Draft" | "Submitted" | "Approved" | "Flagged";

interface ReportMeta {
  id: string;
  title: string;
  project: string;
  location: string;
  user: string;
  type: ReportType;
  status: Status;
  createdAt: string;
}

// --------------------------------------------------
// Constants
// --------------------------------------------------
const REPORT_TYPES: ReportType[] = ["Daily", "Weekly", "Monthly", "Annual"];
const STATUSES: Status[] = ["Draft", "Submitted", "Approved", "Flagged"];

// --------------------------------------------------
// Small Components
// --------------------------------------------------
const StatusTag: React.FC<{ status: Status | "All" }> = ({ status }) => {
  if (status === "All") {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold">All</span>
    );
  }
  const colorClass =
    status === "Draft"
      ? "bg-yellow-100 text-yellow-800"
      : status === "Submitted"
      ? "bg-blue-100 text-blue-800"
      : status === "Approved"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {status}
    </span>
  );
};

// Safe date formatting helper
function formatDateSafe(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// --------------------------------------------------
// Main Component
// --------------------------------------------------
export default function ReportingCenter() {
  return (
    <SplunkThemeProvider family="enterprise" colorScheme="light">
      <ReportingCenterContent />
    </SplunkThemeProvider>
  );
}

function ReportingCenterContent() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [projectFilter, setProjectFilter] = useState<string | "All">("All");
  const [locationFilter, setLocationFilter] = useState<string | "All">("All");
  const [userFilter, setUserFilter] = useState<string | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ReportType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch reports from backend on mount
  useEffect(() => {
    void loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      // Direct Splunk query to get reports from index
      const splunkQuery = `
        search index=reports_index sourcetype=reports
        | eval createdAt=strftime(_time, "%Y-%m-%dT%H:%M:%S")
        | table id title project location user type status createdAt
        | sort -_time
      `;
      
      // Use Splunk REST API to execute the search
      const resp = await fetch('/splunkd/__raw/services/search/jobs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Splunk ' + sessionStorage.getItem('splunk_token')
        },
        body: new URLSearchParams({
          search: splunkQuery,
          output_mode: 'json',
          earliest_time: '-7d@d',
          latest_time: 'now'
        })
      });
      
      if (!resp.ok) throw new Error(`Splunk query failed: ${resp.status}`);
      
      const text = await resp.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      const results = lines.map(line => JSON.parse(line).result || JSON.parse(line));
      
      setReports(results.filter(r => r && r.id));
    } catch (err: any) {
      console.error("loadReports error:", err);
      setError(err?.message ?? "Failed to load reports from Splunk");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  // Unique filter values
  const projects = useMemo(
    () => Array.from(new Set(reports.map((r) => r.project))).sort(),
    [reports]
  );
  const locations = useMemo(
    () => Array.from(new Set(reports.map((r) => r.location))).sort(),
    [reports]
  );
  const users = useMemo(
    () => Array.from(new Set(reports.map((r) => r.user))).sort(),
    [reports]
  );

  // Apply filters
  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (projectFilter !== "All" && r.project !== projectFilter) return false;
      if (locationFilter !== "All" && r.location !== locationFilter)
        return false;
      if (userFilter !== "All" && r.user !== userFilter) return false;
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      return true;
    });
  }, [
    reports,
    projectFilter,
    locationFilter,
    userFilter,
    typeFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ---------------- Actions ----------------
  function handleViewReport(report: ReportMeta) {
    alert("Report details:\n\n" + JSON.stringify(report, null, 2));
  }

  async function handleExportPDF(report: ReportMeta) {
    try {
      // Calls backend API to export report as PDF
      const resp = await fetch(`/api/reports/${report.id}/export-pdf`);
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Failed to export PDF for this report.");
    }
  }

  // ---------------- Render ----------------
  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1200,
        margin: "0 auto",
        fontFamily: "Inter, Arial",
      }}
    >
      {/* ---------------- Header ---------------- */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Reporting Center</h1>
        <button
          onClick={loadReports}
          style={buttonPrimaryStyle}
          aria-label="Refresh report list"
        >
          Refresh
        </button>
      </header>

      {/* ---------------- Filters ---------------- */}
      <section
        style={{
          background: "#fafafa",
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <Filter
          label="Project"
          title="Filter by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value as any)}
          options={projects}
          includeAll
        />
        <Filter
          label="Location"
          title="Filter by location"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value as any)}
          options={locations}
          includeAll
        />
        <Filter
          label="User"
          title="Filter by user"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value as any)}
          options={users}
          includeAll
        />
        <Filter
          label="Report Type"
          title="Filter by report type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          options={REPORT_TYPES}
          includeAll
        />
        <Filter
          label="Status"
          title="Filter by report status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          options={STATUSES}
          includeAll
        />
      </section>

      {/* ---------------- Table ---------------- */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid #eee",
          borderRadius: 6,
          marginBottom: 30,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f7f7f7" }}>
            <tr>
              {[
                "ID",
                "Title",
                "Project",
                "Location",
                "Type",
                "Status",
                "User",
                "Created",
                "Actions",
              ].map((h) => (
                <th key={h} style={thStyle}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                  Loading…
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                  No reports
                </td>
              </tr>
            ) : (
              pageData.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={tdStyle}>{r.id}</td>
                  <td style={tdStyle}>{r.title}</td>
                  <td style={tdStyle}>{r.project}</td>
                  <td style={tdStyle}>{r.location}</td>
                  <td style={tdStyle}>{r.type}</td>
                  <td style={tdStyle}>
                    <StatusTag status={r.status} />
                  </td>
                  <td style={tdStyle}>{r.user}</td>
                  <td style={tdStyle}>{formatDateSafe(r.createdAt)}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleViewReport(r)}
                      style={smallBtnStyle}
                      aria-label={`View report ${r.id}`}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleExportPDF(r)}
                      style={smallBtnStyle}
                      aria-label={`Export report ${r.id} to PDF`}
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- Visual Analytics Dashboard ---------------- */}
      <h2 style={{ marginBottom: 12, color: "#333" }}>Visual Analytics</h2>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 6,
          backgroundColor: "#fff",
          padding: 15,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: 10,
          height: "500px",
        }}
      >
        <StatusChart reports={filtered} />
        <TypeChart reports={filtered} />
        <ProjectDistribution reports={filtered} />
        <UserActivity reports={filtered} />
      </div>
    </div>
  );
}

// --------------------------------------------------
// Chart Components
// --------------------------------------------------
const StatusChart: React.FC<{ reports: ReportMeta[] }> = ({ reports }) => {
  const statusCounts = useMemo(() => {
    const counts = { Draft: 0, Submitted: 0, Approved: 0, Flagged: 0 };
    reports.forEach((r) => counts[r.status]++);
    return counts;
  }, [reports]);

  const max = Math.max(...Object.values(statusCounts), 1);

  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>Reports by Status</h3>
      {Object.entries(statusCounts).map(([status, count]) => (
        <div key={status} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 70, fontSize: 12 }}>{status}</div>
          <div style={{ flex: 1, height: 16, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(count / max) * 100}%`,
                background:
                  status === "Draft" ? "#fbbf24" :
                  status === "Submitted" ? "#3b82f6" :
                  status === "Approved" ? "#10b981" : "#ef4444",
              }}
            />
          </div>
          <div style={{ width: 30, fontSize: 12, textAlign: "right" }}>{count}</div>
        </div>
      ))}
    </div>
  );
};

const TypeChart: React.FC<{ reports: ReportMeta[] }> = ({ reports }) => {
  const typeCounts = useMemo(() => {
    const counts = { Daily: 0, Weekly: 0, Monthly: 0, Annual: 0 };
    reports.forEach((r) => counts[r.type]++);
    return counts;
  }, [reports]);

  const max = Math.max(...Object.values(typeCounts), 1);

  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>Reports by Type</h3>
      {Object.entries(typeCounts).map(([type, count]) => (
        <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 70, fontSize: 12 }}>{type}</div>
          <div style={{ flex: 1, height: 16, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${(count / max) * 100}%`,
                background: "#6366f1",
              }}
            />
          </div>
          <div style={{ width: 30, fontSize: 12, textAlign: "right" }}>{count}</div>
        </div>
      ))}
    </div>
  );
};

const ProjectDistribution: React.FC<{ reports: ReportMeta[] }> = ({ reports }) => {
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => { counts[r.project] = (counts[r.project] || 0) + 1; });
    return counts;
  }, [reports]);

  const pieData = useMemo(() => {
    const projects = Object.keys(projectCounts);
    const counts = Object.values(projectCounts);
    return {
      fields: [{ name: 'project' }, { name: 'count' }],
      columns: [projects, counts.map(String)],
    };
  }, [projectCounts]);

  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>Project Distribution</h3>
      {Object.keys(projectCounts).length === 0 ? (
        <p style={{ fontSize: 12, color: "#666" }}>No data</p>
      ) : (
        <Pie
          width="100%"
          height={180}
          options={{
            showDonutHole: false,
            showLegend: true,
            legendPosition: "right",
            showLabels: true,
            labelDisplay: "percent",
            showTooltip: true
          }}
          dataSources={{
            primary: {
              requestParams: { offset: 0, count: 20 },
              data: pieData,
              meta: { totalCount: Object.keys(projectCounts).length },
            },
          }}
        />
      )}
    </div>
  );
};

const UserActivity: React.FC<{ reports: ReportMeta[] }> = ({ reports }) => {
  const userCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => { counts[r.user] = (counts[r.user] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const max = Math.max(...userCounts.map(([_, c]) => c), 1);

  return (
    <div style={{ flex: 1 }}>
      <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>User Activity</h3>
      {userCounts.length === 0 ? (
        <p style={{ fontSize: 12, color: "#666" }}>No data</p>
      ) : (
        userCounts.map(([user, count]) => (
          <div key={user} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 80, fontSize: 12 }}>{user}</div>
            <div style={{ flex: 1, height: 16, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: "#34d399" }} />
            </div>
            <div style={{ width: 30, fontSize: 12, textAlign: "right" }}>{count}</div>
          </div>
        ))
      )}
    </div>
  );
};

// --------------------------------------------------
// Reusable Components & Styles
// --------------------------------------------------
const Filter: React.FC<{
  label: string;
  title: string;
  value: string | ReportType | Status | "All";
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  includeAll?: boolean;
}> = ({ label, title, value, onChange, options, includeAll }) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      title={title}
      style={selectStyle}
      aria-label={title}
    >
      {includeAll && <option value="All">All</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: 4,
  backgroundColor: "#fff",
  color: "#333",
};
const thStyle: React.CSSProperties = {
  padding: "10px",
  textAlign: "left",
  fontWeight: "bold",
  fontSize: 13,
  borderBottom: "1px solid #ddd",
};
const tdStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  fontSize: 13,
};

const buttonPrimaryStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 4,
  background: "#007bff",
  color: "#fff",
  cursor: "pointer",
};
const smallBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #ddd",
  borderRadius: 4,
  background: "#fff",
  color: "#333",
  fontSize: 12,
  cursor: "pointer",
  marginRight: 4,
};