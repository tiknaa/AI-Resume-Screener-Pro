import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function UploadForm({ refresh }) {
  const [files, setFiles] = useState([]);
  const [jobDesc, setJobDesc] = useState("");
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | processing | completed
  const [pollId, setPollId] = useState(null);
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);

  useEffect(() => {
  return () => {
    if (pollId) {
      clearInterval(pollId);
      }
    };
  }, [pollId]);

  // 📤 Upload handler
  const handleUpload = async () => {
    
    if (files.length === 0 || !jobDesc.trim()) {
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
      setStatus("processing");
      setProgress(0);

      const id = setInterval(async () => {
      const res = await axios.get("http://127.0.0.1:8000/progress");

      const { total, processed, status } = res.data;
      if (total > 0) {
        setProgress(Math.round((processed / total) * 100));
      }
      setTotal(total);
      setProcessed(processed);
      setStatus(status);

      if (status === "completed") {
        clearInterval(id);
        refresh();
      }

    }, 1000);
    setPollId(id);

      console.log("UPLOAD RESPONSE:", res.data);

      alert("Processing started! Please wait...");

      setFiles([]); // 🔥 clear after upload
      setJobDesc("");
      fileInputRef.current.value = "";

      refresh();
    } catch (error) {
      console.error("ERROR:", error);
      console.log("RESPONSE:", error.response);
      alert("Error uploading resume");
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
    {status === "processing" && (
  <div className="mt-5">
    
    {/* HEADER */}
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700 dark:text-gray-300 font-medium">
        🚀 Processing resumes...
      </span>
      <span className="font-semibold text-blue-600">
        {progress}%
      </span>
    </div>

    {/* PROGRESS BAR */}
    <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full overflow-hidden shadow-inner">
      <div
        className="h-4 rounded-full transition-all duration-500"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #3b82f6, #06b6d4, #22c55e)",
          boxShadow: "0 0 10px rgba(59,130,246,0.6)"
        }}
      ></div>
    </div>

    {/* FOOTER */}
    <p className="text-xs text-gray-500 mt-2">
      AI is analyzing resumes...
    </p>
    <p className="text-xs text-gray-500 mt-1">
      {processed === total && total > 0
        ? "All resumes processed ✅"
        : `${processed} / ${total} resumes processed`}
    </p>

  </div>
)}

{status === "completed" && (
  <div className="mt-5 text-green-600 font-semibold">
    ✅ Processing complete!
  </div>
)}


    <div className="space-y-4">

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        disabled={status === "processing"}
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
              disabled={status === "processing"}
              className={`px-2 py-1 text-xs rounded text-white ${
                status === "processing"
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
        disabled={status === "processing"}
        onChange={(e) => setJobDesc(e.target.value)}
        className="w-full border border-gray-300 p-3 rounded-lg"
      />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={status === "processing"}
        className={`w-full py-2 rounded-lg text-white font-semibold transition ${
          status === "processing"
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {status === "processing" ? "Processing..." : "Upload Resumes"}
      </button>

    </div>
  </div>
);
  
}

export default UploadForm;
