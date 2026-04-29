import { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import UploadForm from "./components/UploadForm";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";

function App() {
  const [data, setData] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  // 🔁 Fetch candidates
  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/candidates");
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // 🌙 Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // 🌗 Toggle theme
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className="flex">

        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 min-h-screen bg-gray-100 dark:bg-gray-900 p-6">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              AI Resume Screening Dashboard
            </h1>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Pages */}
          <Routes>
            <Route
              path="/"
              element={<UploadForm refresh={fetchCandidates} />}
            />
            <Route
              path="/dashboard"
              element={<Dashboard data={data} refresh={fetchCandidates} />}
            />
            <Route
              path="/analytics"
              element={<Analytics data={data} refresh={fetchCandidates} />}
            />
          </Routes>

        </div>
      </div>
    </Router>
  );
}

export default App;