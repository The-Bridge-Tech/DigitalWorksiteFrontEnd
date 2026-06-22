import React, { useState, useRef, useEffect } from "react";
import { getSites, getUsers } from "./services/api.service";

export default function InspectionReportForm() {
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null); // 🔹 ref to reset form safely

  // Load sites and users on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [sitesData, usersData] = await Promise.all([
          getSites(),
          getUsers()
        ]);
        setSites(sitesData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setMessage('❌ Failed to load sites and users data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle text/date/textarea inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle site selection and auto-populate location
  const handleSiteChange = (e) => {
    const siteId = e.target.value;
    const selectedSite = sites.find(site => site.id === siteId);
    
    setFormData((prev) => ({
      ...prev,
      site_name: siteId,
      site_location: selectedSite ? selectedSite.location : ''
    }));
  };

  // Handle radio inputs
  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Check if there are any "no" answers to determine if deadline should be shown
  const hasIssues = () => {
    // Check safety fields
    for (let i = 0; i < 4; i++) {
      if (formData[`safety${i}`] === "no") return true;
    }
    // Check environmental fields
    for (let i = 0; i < 5; i++) {
      if (formData[`env${i}`] === "no") return true;
    }
    // Check work quality fields
    for (let i = 0; i < 4; i++) {
      if (formData[`work${i}`] === "no") return true;
    }
    // Check if there are written issues
    if (formData.issues && formData.issues.trim()) return true;
    return false;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();

      // Use flat fields to match backend expectations
      payload.append("asset_id", formData.site_name || "N/A");
      payload.append("site_id", formData.site_name || "");
      payload.append("site_location", formData.site_location || "");
      payload.append("address", formData.site_location || "");
      payload.append("inspection_date", formData.inspection_date || "");
      payload.append("inspector", formData.inspector || "");
      payload.append("signature", formData.signature || "");
      payload.append("position", formData.position || "");
      payload.append("comments", formData.comments || "");
      payload.append("deadline", formData.deadline || "");

      // Safety fields
      [
        "Is PPE compliance being followed?",
        "Are fall protection systems in place?",
        "Are first aid kits / fire extinguishers available?",
        "Are emergency exits and routes clear?",
      ].forEach((item, idx) => {
        payload.append(`safety${idx}`, formData[`safety${idx}`] || "N/A");
      });

      // Environmental fields
      [
        "Is site drainage adequate?",
        "Is erosion/dust control being maintained?",
        "Is waste being disposed of properly?",
        "Are noise levels within acceptable limits?",
        "Is fuel/chemical storage safe?",
      ].forEach((item, idx) => {
        payload.append(`env${idx}`, formData[`env${idx}`] || "N/A");
        payload.append(`env${idx}_notes`, formData[`env${idx}_notes`] || "");
      });

      // Work quality fields
      [
        "Is the work schedule being adhered to?",
        "Are materials stored correctly?",
        "Is machinery in good condition?",
        "Is housekeeping maintained?",
      ].forEach((item, idx) => {
        payload.append(`work${idx}`, formData[`work${idx}`] || "N/A");
        payload.append(`work${idx}_notes`, formData[`work${idx}_notes`] || "");
      });

      // Deficiencies
      payload.append("issues", formData.issues || "");
      payload.append("actions", formData.actions || "");



      // Submit to Flask backend
      const API_BASE_URL = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('auth_token');
      const splunkUser = window.$C?.USERNAME;
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (splunkUser) {
        headers['X-Splunk-User'] = splunkUser;
        // Use admin role if available, otherwise inspector
        headers['X-Splunk-Roles'] = window.$C?.ROLES?.includes('dwa_admin') ? 'dwa_admin' : 'dwa_inspector';
      }
      
      const res = await fetch(`${API_BASE_URL}inspections/submit`, {
        method: "POST",
        headers,
        body: payload,
      });

      const data = await res.json();
      if (data.ok) {
        setMessage(`Report submitted.`);

        // --- reset form using ref ---
        setFormData({});
        if (formRef.current) {
          formRef.current.reset();
        }

        // Auto-hide success message
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit report.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  return (
    <form ref={formRef} className="inspection-form" onSubmit={handleSubmit}>
      <style>{`
        .inspection-form {
          max-width: 950px;
          margin: 20px auto;
          background: #fdfdfd;
          padding: 25px 35px;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          font-family: "Segoe UI", Arial, sans-serif;
          color: #222;
        }
        .form-title {
          font-size: 20px;
          text-align: center;
          margin-bottom: 25px;
          padding-bottom: 10px;
          border-bottom: 2px solid #2DBE60;
        }
        .form-section { margin-bottom: 30px; }
        .form-section h2 {
          font-size: 16px;
          color: #2DBE60;
          border-left: 4px solid #2DBE60;
          padding-left: 8px;
          margin-bottom: 15px;
        }
        .form-row { margin-bottom: 15px; }
        .form-row label { font-weight: 500; display: block; margin-bottom: 6px; }
        .options { display: flex; gap: 20px; margin-top: 5px; }
        .options label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 400;
          color: #495057;
        }
        .options label:hover {
          color: #2DBE60;
        }
        input[type="radio"] {
          accent-color: #2DBE60;
          margin-right: 6px;
          transform: scale(1.2);
        }
        input[type="text"], input[type="date"], textarea, select {
          padding: 8px 10px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
          transition: border-color 0.2s ease;
        }
        input[type="text"]:focus, input[type="date"]:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #2DBE60;
          box-shadow: 0 0 0 3px rgba(45, 190, 96, 0.1);
        }
        select {
          background-color: white;
          cursor: pointer;
          border: 2px solid #e9ecef;
          transition: border-color 0.2s ease;
        }
        select:focus {
          outline: none;
          border-color: #2DBE60;
          box-shadow: 0 0 0 3px rgba(45, 190, 96, 0.1);
        }
        select option {
          background-color: white;
          color: #495057;
        }
        select option:hover {
          background-color: rgba(45, 190, 96, 0.1);
        }
        select option:checked {
          background-color: #2DBE60;
          color: white;
        }
        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }
        textarea { min-height: 70px; resize: vertical; }
        .form-actions { display: flex; justify-content: flex-end; gap: 15px; }
        .btn-save, .btn-reset {
          padding: 8px 18px; border: none; border-radius: 6px;
          font-size: 14px; cursor: pointer;
        }
        .btn-save { background: linear-gradient(135deg, #2DBE60 0%, #1E8E4A 100%); color: white; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(45, 190, 96, 0.3); min-height: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(45, 190, 96, 0.4); }
        .btn-save:active { transform: scale(0.98); }
        .btn-reset { background: #f8f9fa; border: 2px solid #e9ecef; color: #495057; transition: all 0.2s ease; min-height: 44px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        .btn-reset:hover { background: #e9ecef; border-color: #dee2e6; }
        .btn-reset:active { transform: scale(0.98); }
        /* Global mobile button support */
        button {
          min-height: 44px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        button:active {
          transform: scale(0.98);
        }
        /* Ensure proper touch targets on mobile */
        @media (max-width: 768px) {
          button {
            min-height: 48px;
            padding: 12px 16px;
          }
        }
        .message { margin-top: 15px; font-weight: bold; text-align: center; }
        ::selection {
          background-color: #b3d4fc;
          color: inherit;
        }
        ::-moz-selection {
          background-color: #b3d4fc;
          color: inherit;
        }
      `}</style>

      <h1 className="form-title">INSPECTION REPORT</h1>

      {loading && <div className="loading">Loading sites and users...</div>}

      {/* General Info */}
      <section className="form-section">
        <h2>I. General Information</h2>
        <div className="form-row">
          <label>Project / Site Name:</label>
          <select name="site_name" value={formData.site_name || ''} onChange={handleSiteChange} disabled={loading}>
            <option value="">Select a site...</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Location / Address:</label>
          <input 
            type="text" 
            name="site_location" 
            value={formData.site_location || ''} 
            onChange={handleChange}
            readOnly
            placeholder="Location will auto-populate when site is selected"
          />
        </div>
        <div className="form-row">
          <label>Date of Inspection:</label>
          <input type="date" name="inspection_date" onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>Inspector Name:</label>
          <select name="inspector" value={formData.inspector || ''} onChange={handleChange} disabled={loading}>
            <option value="">Select an inspector...</option>
            {users.map(user => (
              <option key={user.id} value={user.username}>{user.username} ({user.email})</option>
            ))}
          </select>
        </div>
      </section>

      {/* Safety */}
      <section className="form-section">
        <h2>II. Safety Compliance</h2>
        {[
          "Is PPE compliance being followed?",
          "Are fall protection systems in place?",
          "Are first aid kits / fire extinguishers available?",
          "Are emergency exits and routes clear?",
        ].map((q, idx) => (
          <div className="form-row" key={idx}>
            <label>{q}</label>
            <div className="options">
              <label>
                <input
                  type="radio"
                  name={`safety${idx}`}
                  value="yes"
                  onChange={handleRadioChange}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name={`safety${idx}`}
                  value="no"
                  onChange={handleRadioChange}
                />{" "}
                No
              </label>
            </div>
          </div>
        ))}
      </section>

      {/* Environmental */}
      <section className="form-section">
        <h2>III. Environmental Compliance</h2>
        {[
          "Is site drainage adequate?",
          "Is erosion/dust control being maintained?",
          "Is waste being disposed of properly?",
          "Are noise levels within acceptable limits?",
          "Is fuel/chemical storage safe?",
        ].map((q, idx) => (
          <div className="form-row" key={idx}>
            <label>{q}</label>
            <div className="options">
              <label>
                <input
                  type="radio"
                  name={`env${idx}`}
                  value="yes"
                  onChange={handleRadioChange}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name={`env${idx}`}
                  value="no"
                  onChange={handleRadioChange}
                />{" "}
                No
              </label>
            </div>
            <textarea
              name={`env${idx}_notes`}
              placeholder="If No, provide details..."
              onChange={handleChange}
            />
          </div>
        ))}
      </section>

      {/* Work Quality */}
      <section className="form-section">
        <h2>IV. Work Quality & Progress</h2>
        {[
          "Is the work schedule being adhered to?",
          "Are materials stored correctly?",
          "Is machinery in good condition?",
          "Is housekeeping maintained?",
        ].map((q, idx) => (
          <div className="form-row" key={idx}>
            <label>{q}</label>
            <div className="options">
              <label>
                <input
                  type="radio"
                  name={`work${idx}`}
                  value="yes"
                  onChange={handleRadioChange}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name={`work${idx}`}
                  value="no"
                  onChange={handleRadioChange}
                />{" "}
                No
              </label>
            </div>
            <textarea
              name={`work${idx}_notes`}
              placeholder="If No, describe issues..."
              onChange={handleChange}
            />
          </div>
        ))}
      </section>

      {/* Deficiencies */}
      <section className="form-section">
        <h2>V. Deficiencies / Corrective Actions</h2>
        <div className="form-row">
          <label>Observed Issues:</label>
          <textarea name="issues" onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>Corrective Actions Needed:</label>
          <textarea name="actions" onChange={handleChange} />
        </div>
        {hasIssues() && (
          <div className="form-row">
            <label>Deadline for Correction:</label>
            <input type="date" name="deadline" onChange={handleChange} />
          </div>
        )}
      </section>

      {/* Comments */}
      <section className="form-section">
        <h2>VI. Additional Comments</h2>
        <textarea name="comments" onChange={handleChange} />
      </section>

      {/* Signature */}
      <section className="form-section">
        <div className="form-row">
          <label>Inspector Signature:</label>
          <input
            type="text"
            name="signature"
            placeholder="Type full name"
            onChange={handleChange}
          />
        </div>
        <div className="form-row">
          <label>Position / Title:</label>
          <input type="text" name="position" onChange={handleChange} />
        </div>
      </section>

      {/* Actions */}
      <div className="form-actions">
        <button type="submit" className="btn-save">
          Save Report
        </button>
        <button type="reset" className="btn-reset">
          Reset
        </button>
      </div>

      {message && <div className="message">{message}</div>}
    </form>
  );
}
