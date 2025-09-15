import React, { useState, useRef } from "react";

export default function InspectionReportForm() {
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState("");
  const formRef = useRef(null); // 🔹 ref to reset form safely

  // Handle text/date/textarea inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();

      // Map form fields to backend expectations
      payload.append("asset_id", formData.site_name || "N/A");
      payload.append("inspector", formData.inspector || "");
      payload.append("scheduled_for", formData.inspection_date || "");
      payload.append("task_id", formData.task_id || "");
      payload.append("signature", formData.signature || "");

      // Build checklist JSON
      const checklist = [];

      // Safety section
      [
        "Is PPE compliance being followed?",
        "Are fall protection systems in place?",
        "Are first aid kits / fire extinguishers available?",
        "Are emergency exits and routes clear?",
      ].forEach((item, idx) => {
        checklist.push({
          item,
          status: formData[`safety${idx}`] || "N/A",
          notes: "",
        });
      });

      // Environmental section
      [
        "Is site drainage adequate?",
        "Is erosion/dust control being maintained?",
        "Is waste being disposed of properly?",
        "Are noise levels within acceptable limits?",
        "Is fuel/chemical storage safe?",
      ].forEach((item, idx) => {
        checklist.push({
          item,
          status: formData[`env${idx}`] || "N/A",
          notes: formData[`env${idx}_notes`] || "",
        });
      });

      // Work quality section
      [
        "Is the work schedule being adhered to?",
        "Are materials stored correctly?",
        "Is machinery in good condition?",
        "Is housekeeping maintained?",
      ].forEach((item, idx) => {
        checklist.push({
          item,
          status: formData[`work${idx}`] || "N/A",
          notes: formData[`work${idx}_notes`] || "",
        });
      });

      // Deficiencies
      checklist.push({
        item: "Observed Issues",
        status: "N/A",
        notes: formData.issues || "",
      });
      checklist.push({
        item: "Corrective Actions Needed",
        status: "N/A",
        notes: formData.actions || "",
      });

      // Append checklist JSON string
      payload.append("checklist", JSON.stringify(checklist));

      // Submit to Flask backend
      const res = await fetch("http://127.0.0.1:5004/inspections/submit", {
        method: "POST",
        body: payload,
      });

      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ Report submitted.`);

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
      setMessage("❌ Failed to submit report.");
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
          border-bottom: 2px solid #0072c6;
        }
        .form-section { margin-bottom: 30px; }
        .form-section h2 {
          font-size: 16px;
          color: #0072c6;
          border-left: 4px solid #0072c6;
          padding-left: 8px;
          margin-bottom: 15px;
        }
        .form-row { margin-bottom: 15px; }
        .form-row label { font-weight: 500; display: block; margin-bottom: 6px; }
        .options { display: flex; gap: 20px; margin-top: 5px; }
        input[type="text"], input[type="date"], textarea {
          padding: 8px 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          width: 100%;
        }
        textarea { min-height: 70px; resize: vertical; }
        .form-actions { display: flex; justify-content: flex-end; gap: 15px; }
        .btn-save, .btn-reset {
          padding: 8px 18px; border: none; border-radius: 6px;
          font-size: 14px; cursor: pointer;
        }
        .btn-save { background: #0072c6; color: white; }
        .btn-reset { background: #f3f3f3; border: 1px solid #ccc; }
        .message { margin-top: 15px; font-weight: bold; text-align: center; }
      `}</style>

      <h1 className="form-title">INSPECTION REPORT</h1>

      {/* General Info */}
      <section className="form-section">
        <h2>I. General Information</h2>
        <div className="form-row">
          <label>Project / Site Name:</label>
          <input type="text" name="site_name" onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>Location / Address:</label>
          <input type="text" name="site_location" onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>Date of Inspection:</label>
          <input type="date" name="inspection_date" onChange={handleChange} />
        </div>
        <div className="form-row">
          <label>Inspector Name:</label>
          <input type="text" name="inspector" onChange={handleChange} />
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
        <div className="form-row">
          <label>Deadline for Correction:</label>
          <input type="date" name="deadline" onChange={handleChange} />
        </div>
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
