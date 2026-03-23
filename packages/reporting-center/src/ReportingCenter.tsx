// ReportingCenter.tsx
import React, { useEffect, useMemo, useState, ChangeEvent } from "react";
// @ts-ignore
import Pie from '@splunk/visualizations/Pie';
import { SplunkThemeProvider } from '@splunk/themes';
// @ts-ignore
import SearchJob from '@splunk/search-job';
import { useSite } from '../../admin-portal/src/main/components/SiteContext';

// Import theme colors
const theme = {
  primary: { main: '#2DBE60', dark: '#1E8E4A', light: '#4DD17A', contrast: '#ffffff' },
  secondary: { main: '#F2C300', dark: '#D4A900', light: '#F5D333', contrast: '#000000' },
  secondary2: { main: '#E31E24', dark: '#B71C1C', light: '#EF5350', contrast: '#ffffff' },
  neutral: { white: '#ffffff', light: '#f8f9fa', medium: '#6c757d', dark: '#343a40', black: '#000000' }
};

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
  const { userSites, isAdmin } = useSite();
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
    if (userSites.length > 0 || isAdmin()) {
      void loadReports();
    }
  }, [userSites]);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const userSiteNames = userSites.map(s => s.name);
      
      const searchQuery = 'index=dwa_inspections sourcetype=inspections | eval id=inspection_id | eval title="Inspection Report" | eval project=asset_id | eval location=asset_id | eval user=inspector | eval type="Daily" | eval createdAt=strftime(_time, "%Y-%m-%dT%H:%M:%S") | table id title project location user type status createdAt asset_id | sort -_time | head 1000';
      
      const searchJob = SearchJob.create({
        search: searchQuery,
        earliest_time: '-30d@d',
        latest_time: 'now'
      });
      
      searchJob.getResults().subscribe({
        next: (resultsData: any) => {
          const results = resultsData?.results || resultsData?.rows || resultsData || [];
          
          if (Array.isArray(results)) {
            let formattedResults = results.map((row: any) => {
              const rawStatus = row.status || 'Submitted';
              const normalizedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
              return {
                id: row.id || '',
                title: row.title || 'Inspection Report',
                project: row.project || '',
                location: row.location || '',
                user: row.user || '',
                type: (row.type || 'Daily') as ReportType,
                status: normalizedStatus as Status,
                createdAt: row.createdAt || '',
                asset_id: row.asset_id || row.project || ''
              };
            });
            
            if (!isAdmin() && userSiteNames.length > 0) {
              const lowerSiteNames = userSiteNames.map(s => s.toLowerCase().replace(/\s+/g, '_'));
              formattedResults = formattedResults.filter(r => {
                const assetId = (r.asset_id || '').toLowerCase();
                return lowerSiteNames.some(site => assetId.includes(site));
              });
            }
            
            setReports(formattedResults);
          }
          setLoading(false);
        },
        error: (err: any) => {
          setError(err?.message ?? 'Failed to load reports from Splunk');
          setReports([]);
          setLoading(false);
        }
      });
    } catch (err: any) {

      setError(err?.message ?? "Failed to load reports from Splunk");
      setReports([]);
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

  // ---------------- Render ----------------
  if (!isAdmin() && userSites.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        No sites assigned to your account. Please contact an administrator.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 1200,
        margin: "0 auto",
        fontFamily: "Inter, Arial",
      }}
    >
      {loading && <div>Loading reports...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
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
          style={{
            padding: "8px 12px",
            border: "none",
            borderRadius: 4,
            background: '#2DBE60',
            color: 'white',
            cursor: "pointer",
            transition: "all 0.2s ease",
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
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
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setProjectFilter(e.target.value as string | "All")}
          options={projects}
          includeAll
        />
        <Filter
          label="Location"
          title="Filter by location"
          value={locationFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setLocationFilter(e.target.value as string | "All")}
          options={locations}
          includeAll
        />
        <Filter
          label="User"
          title="Filter by user"
          value={userFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setUserFilter(e.target.value as string | "All")}
          options={users}
          includeAll
        />
        <Filter
          label="Report Type"
          title="Filter by report type"
          value={typeFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value as ReportType | "All")}
          options={REPORT_TYPES}
          includeAll
        />
        <Filter
          label="Status"
          title="Filter by report status"
          value={statusFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as Status | "All")}
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
                      style={{
                        ...smallBtnStyle,
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      aria-label={`View report ${r.id}`}
                    >
                      View
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
                  status === "Draft" ? theme.secondary.main :
                  status === "Submitted" ? theme.primary.main :
                  status === "Approved" ? theme.primary.dark : theme.secondary2.main,
              }}
            />
          </div>
          <div style={{ width: 30, fontSize: 12, textAlign: "right" }}>{String(count)}</div>
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
                background: theme.primary.main,
              }}
            />
          </div>
          <div style={{ width: 30, fontSize: 12, textAlign: "right" }}>{String(count)}</div>
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
          mode="view"
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
              <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: theme.primary.light }} />
            </div>
            <div style={{ width: 30, fontSize: 12, textAlign: "right" }}>{String(count)}</div>
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
  background: '#2DBE60',
  color: 'white',
  cursor: "pointer",
  transition: "all 0.2s ease",
};
const smallBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  border: `1px solid ${theme.primary.main}`,
  borderRadius: 4,
  background: `linear-gradient(135deg, ${theme.primary.main} 0%, ${theme.primary.dark} 100%)`,
  color: theme.primary.contrast,
  fontSize: 12,
  cursor: "pointer",
  marginRight: 4,
  transition: "all 0.2s ease",
  minHeight: '44px',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent'
};