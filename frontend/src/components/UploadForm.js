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

      console.log("UPLOAD RESPONSE:", res.data);

      if (Array.isArray(res.data)) {
        alert(`Uploaded ${res.data.length} resumes successfully!`);
      } else {
        alert("Upload successful!");
      }

      setFiles([]); // 🔥 clear after upload
      setJobDesc("");
      fileInputRef.current.value = "";

      refresh();
    } catch (error) {
      console.error("ERROR:", error);
      console.log("RESPONSE:", error.response);
      alert("Error uploading resume");
    }
    finally {
      setLoading(false);
    }

  };

  // ❌ Remove single file
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
  <div className="bg-white p-6 rounded-2xl shadow-md mb-6 border border-gray-100">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  {/* Card 1 */}
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
      📄 Resume Parsing
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
      Extract skills and experience automatically from resumes
    </p>
  </div>

  {/* Card 2 */}
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
      🎯 Smart Matching
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
      Match candidates with job descriptions using AI
    </p>
  </div>

  {/* Card 3 */}
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
      📊 Insights & Analytics
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
      Visualize performance and get actionable hiring insights
    </p>
  </div>

</div>

    {/* Title */}
    <h2 className="text-xl font-semibold mb-4 text-gray-800">
      📤 Upload Resumes
    </h2>

    <div className="space-y-4">

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        disabled={loading}
        onChange={(e) => {
          const newFiles = Array.from(e.target.files);
          const uniqueFiles = newFiles.filter(
            (newFile) => !files.some((f) => f.name === newFile.name)
          );
          setFiles((prev) => [...prev, ...uniqueFiles]);
          e.target.value = null;
        }}
        className="w-full border border-gray-300 p-2 rounded-lg"
      />

      {/* File Count */}
      <p className="text-sm text-gray-500">
        {files.length} file(s) selected
      </p>

      {/* File List */}
      <ul className="space-y-2">
        {files.map((file, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-100 p-2 rounded-lg"
          >
            <span className="text-sm">{file.name}</span>

            <button
              onClick={() => removeFile(index)}
              disabled={loading}
              className={`px-2 py-1 text-xs rounded text-white ${
                loading
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>

      {/* Job Description */}
      <textarea
        placeholder="Enter job description..."
        rows="4"
        value={jobDesc}
        disabled={loading}
        onChange={(e) => setJobDesc(e.target.value)}
        className="w-full border border-gray-300 p-3 rounded-lg"
      />

      {/* Loading */}
      {loading && (
      <div className="text-blue-500 font-medium mt-2">
        ⏳ Processing resumes... Please wait (large uploads may take time)
      </div>
    )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading}
        className={`w-full py-2 rounded-lg text-white font-semibold transition ${
          loading
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Processing..." : "Upload Resumes"}
      </button>

    </div>
  </div>
);
  
}

export default UploadForm;
