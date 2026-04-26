import React, { useState } from "react";
import axios from "axios";

function UploadForm({ refresh }) {
  const [files, setFiles] = useState([]);
  const [jobDesc, setJobDesc] = useState("");

  // 📤 Upload handler
  const handleUpload = async () => {
    if (files.length === 0 || !jobDesc) {
      alert("Please upload file(s) and enter job description");
      return;
    }

    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("job_desc", jobDesc);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData
      );

      alert(`Uploaded ${res.data.length} resumes successfully!`);

      setFiles([]); // 🔥 clear after upload
      setJobDesc("");

      refresh();
    } catch (error) {
      console.error(error);
      alert("Error uploading resume");
    }
  };

  // ❌ Remove single file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      <h2>Upload Resume</h2>

      {/* 📁 File Input */}
      <input
        type="file"
        multiple
        onChange={(e) => {
          const newFiles = Array.from(e.target.files);

          // 🔥 Prevent duplicate files
          const uniqueFiles = newFiles.filter(
            (newFile) =>
              !files.some((f) => f.name === newFile.name)
          );

          setFiles((prev) => [...prev, ...uniqueFiles]);

          e.target.value = null; // allow re-selection
        }}
      />

      {/* 📊 File Count */}
      <p>{files.length} file(s) selected</p>

      {/* 📋 File List */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {files.map((file, index) => (
          <li
            key={index}
            style={{
              background: "#f1f1f1",
              margin: "5px 0",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {file.name}

            {/* ❌ Remove Button */}
            <button
              onClick={() => removeFile(index)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "5px",
                padding: "5px 8px",
                cursor: "pointer",
              }}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>

      <br />

      {/* 📝 Job Description */}
      <textarea
        placeholder="Enter job description"
        rows="4"
        cols="40"
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
      />

      <br /><br />

      {/* 🚀 Upload Button */}
      <button
        onClick={handleUpload}
        style={{
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Upload
      </button>
    </div>
  );
}

export default UploadForm;
