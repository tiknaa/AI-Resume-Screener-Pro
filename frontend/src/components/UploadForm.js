import React, { useState, useRef } from "react";
import axios from "axios";

function UploadForm({ refresh }) {
  const [files, setFiles] = useState([]);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // 📤 Upload handler
  const handleUpload = async () => {
    
    if (files.length === 0 || !jobDesc.trim()) {
      alert("Please upload file(s) and enter job description");
      return;
    }
    setLoading(true);
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
      fileInputRef.current.value = "";

      refresh();
    } catch (error) {
      console.error(error);
      alert("Error uploading resume");
    } finally {
      setLoading(false);
    }

  };

  // ❌ Remove single file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
      
      <h2 className="text-xl font-semibold mb-4" >Upload Resume</h2>

      {/* 📁 File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="mb-3 w-full border p-2 rounded"
        disabled={loading}
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
      <p className="text-sm text-gray-600 mb-2">
      {files.length} file(s) selected
    </p>

      {/* 📋 File List */}
      <ul className="list-none p-0">
        {files.map((file, index) => (
          <li
          className="bg-gray-100 my-1 p-2 rounded flex justify-between items-center"
        >
            {file.name}

            {/* ❌ Remove Button */}
            <button
            onClick={() => removeFile(index)}
            disabled={loading}
            className={`px-2 py-1 rounded text-white text-sm
              ${loading 
                ? "bg-red-300 cursor-not-allowed opacity-60" 
                : "bg-red-500 hover:bg-red-600"
              }`}
          >
            ❌
          </button>
          </li>
        ))}
      </ul>

      <br />

      {/* 📝 Job Description */}
      <textarea
        className="w-full border p-3 rounded mb-3"
        placeholder="Enter job description"
        rows="4"
        cols="40"
        value={jobDesc}
        disabled={loading}
        onChange={(e) => setJobDesc(e.target.value)}
      />

      <br /><br />
      {loading && <p className="text-blue-500">⏳ Processing resumes...</p>}
      <button
      onClick={handleUpload}
      disabled={loading}
      className={`px-5 py-2 rounded-lg text-white transition
        ${loading 
          ? "bg-blue-400 cursor-not-allowed opacity-60" 
          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
        }`}
    >
      {loading ? "Processing..." : "Upload"}
    </button>
    

    </div>
    
  );
  
}

export default UploadForm;
