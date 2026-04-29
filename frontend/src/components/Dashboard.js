import React, { useEffect, useState } from "react";
import axios from "axios";


function Dashboard({ refresh }) {
  const [data, setData] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [minScoreInput, setMinScoreInput] = useState("");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [showShortlisted, setShowShortlisted] = useState(false);


  useEffect(() => {
    fetchData();
  }, [refresh]);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/candidates");
      setData(res.data);

      const analyticsRes = await axios.get("http://127.0.0.1:8000/analytics");
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setMinScore(minScoreInput);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all results?")) return;
    await axios.delete("http://127.0.0.1:8000/delete_all");
    fetchData();
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    await axios.delete(`http://127.0.0.1:8000/delete/${id}`);
    fetchData();
  };

  const handleShortlist = async (id) => {
    const res = await axios.put(`http://127.0.0.1:8000/shortlist/${id}`);
    setData((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, shortlisted: res.data.shortlisted } : c
      )
    );
  };

  const handleExportCSV = () => {
    const headers = ["Filename", "Score", "Skills"];
    const rows = data.map((c) => [
      c.filename,
      c.score,
      (c.skills || []).join(", ")
    ]);

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "report.csv";
    link.click();
  };

  // 🔍 FILTER LOGIC
  const filteredData = data
    .filter((c) =>
      c.filename.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills || []).join(" ").toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => c.score >= minScore)
    .filter((c) => !showShortlisted || c.shortlisted);


  return (
    <div className="mt-6 text-gray-800 dark:text-gray-100">

      <h2 className="text-2xl font-bold mb-4">🏆 Candidate Ranking</h2>

      {/* SEARCH */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search..."
          className="border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-600"
        />
        <input
          type="number"
          value={minScoreInput}
          onChange={(e) => setMinScoreInput(Number(e.target.value))}
          placeholder="Min Score"
          className="border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-600"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          🔍 Search
        </button>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button onClick={handleDeleteAll} className="bg-red-500 px-4 py-2 rounded text-white">🗑 Delete</button>
        
        <button onClick={() => setShowShortlisted(!showShortlisted)} className="bg-yellow-400 px-4 py-2 rounded text-black">⭐ Shortlisted</button>
        <button onClick={handleExportCSV} className="bg-green-500 px-4 py-2 rounded text-white">📄 Export</button>
      </div>

      {/* ANALYTICS CARDS */}
      {analytics && (
        <div className="flex gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1 text-center">
            Total: {analytics.total}
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1 text-center">
            Avg: {analytics.avg_score}%
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1 text-center">
            Top: {analytics.top_score}%
          </div>
        </div>
      )}


      {/* CANDIDATES */}
      {[...filteredData].sort((a, b) => b.score - a.score).map((c, i) => (
        <div key={c._id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow mb-4 border dark:border-gray-700">

          {/* HEADER */}
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Rank #{i + 1}</p>
              <h3 className="font-semibold">{c.filename}</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleShortlist(c._id)}>
                {c.shortlisted ? "⭐" : "☆"}
              </button>
              <button onClick={() => handleDeleteOne(c._id)}>🗑</button>
            </div>
          </div>

          {/* SCORE */}
          <p className="mt-2 font-medium">Score: {c.score}%</p>
          <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded mt-1">
            <div className="bg-green-500 h-2 rounded" style={{ width: `${c.score}%` }}></div>
          </div>

          {/* SKILLS */}
          <div className="mt-3">
        <p className="font-semibold">Skills</p>

        {c.skills && c.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {c.skills.map((s, idx) => (
              <span
                key={idx}
                className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No skills detected
          </p>
        )}
      </div>

          <div className="mt-4 space-y-3">

  {/* 🚨 Missing Skills */}
  {c.missing_skills?.length > 0 && (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-3 rounded-lg">
      <p className="text-red-600 dark:text-red-300 font-semibold mb-2">
        🚨 Missing Skills
      </p>

      <div className="flex flex-wrap gap-2">
        {c.missing_skills.map((s, idx) => (
          <span
            key={idx}
            className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-2 py-1 rounded text-sm"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )}

  {/* ✅ Matched Skills */}
  {c.feedback?.matched_skills?.length > 0 && (
    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3 rounded-lg">
      <p className="text-green-600 dark:text-green-300 font-semibold mb-2">
        ✅ Matched Skills
      </p>

      <div className="flex flex-wrap gap-2">
        {c.feedback.matched_skills.map((s, idx) => (
          <span
            key={idx}
            className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-1 rounded text-sm"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  )}

  {/* 💡 Suggestions */}
  {c.feedback?.suggestions?.length > 0 && (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
      <p className="text-blue-600 dark:text-blue-300 font-semibold mb-2">
        💡 Suggestions
      </p>

      <ul className="list-disc ml-5 text-sm space-y-1">
        {c.feedback.suggestions.map((s, idx) => (
          <li key={idx}>{s}</li>
        ))}
      </ul>
    </div>
  )}

</div>

        </div>
      ))}

    </div>
  );
}

export default Dashboard;