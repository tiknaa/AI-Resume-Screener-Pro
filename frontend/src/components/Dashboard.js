import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

function Dashboard({ refresh }) {
  const [data, setData] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [minScoreInput, setMinScoreInput] = useState("");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [showShortlisted, setShowShortlisted] = useState(false);
  const [showCharts, setShowCharts] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const handleShortlist = async (id) => {
    try {
      const res = await axios.put(`http://127.0.0.1:8000/shortlist/${id}`);

      setData((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, shortlisted: res.data.shortlisted } : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete all results?")) return;

    try {
      await axios.delete("http://127.0.0.1:8000/delete_all");
      setData([]);
      setAnalytics({ total: 0, avg_score: 0, top_score: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/delete/${id}`);
      setData((prev) => prev.filter((c) => c._id !== id));

      const analyticsRes = await axios.get("http://127.0.0.1:8000/analytics");
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cardStyle = {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    flex: 1,
    textAlign: "center"
  };

  // Charts
  const chartData = data.map((c) => ({
    name: c.filename,
    score: c.score
  }));

  const skillCount = {};
  data.forEach((c) => {
    c.skills?.forEach((skill) => {
      skillCount[skill] = (skillCount[skill] || 0) + 1;
    });
  });

  const skillChartData = Object.keys(skillCount).map((skill) => ({
    skill,
    count: skillCount[skill]
  }));

  const scoreCategories = { High: 0, Medium: 0, Low: 0 };
  data.forEach((c) => {
    if (c.score > 70) scoreCategories.High++;
    else if (c.score > 40) scoreCategories.Medium++;
    else scoreCategories.Low++;
  });

  const pieData = [
    { name: "High", value: scoreCategories.High },
    { name: "Medium", value: scoreCategories.Medium },
    { name: "Low", value: scoreCategories.Low }
  ];

  const COLORS = ["green", "orange", "red"];

  const filteredData = data
    .filter((c) =>
      c.filename.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills && c.skills.join(" ").toLowerCase().includes(search.toLowerCase()))
    )
    .filter((c) => c.score >= minScore)
    .filter((c) => !showShortlisted || c.shortlisted);

  const handleExportCSV = () => {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = ["Filename", "Score", "Skills", "Missing Skills", "Shortlisted"];

  const rows = filteredData.map((c) => [
    c.filename,
    c.score,
    (c.skills || []).join(", "),
    (c.missing_skills || []).join(", "),
    c.shortlisted ? "Yes" : "No"
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows].map((e) => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "resume_report.csv");

  document.body.appendChild(link);
  link.click();
};
const handleSearch = () => {
  setSearch(searchInput);
  setMinScore(minScoreInput);
};

  return (
    <div style={{ marginTop: "20px" }}>

      <h2>🏆 Candidate Ranking</h2>

      {/* Search + Filter */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <b>Search:</b>
        <input
          type="text"
          placeholder="Search by name or skill"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ margin: "0 10px", padding: "5px" }}
        />

        <b>Min Score:</b>
        <input
          type="number"
          value={minScoreInput}
          onChange={(e) => setMinScoreInput(Number(e.target.value))}
          style={{ marginLeft: "10px", padding: "5px", width: "80px" }}
        />

        
      </div>

      {/* Buttons */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button onClick={handleDeleteAll} style={{ marginRight: "10px" }}>
          🗑 Delete All
        </button>

        <button
        onClick={() => setShowCharts(!showCharts)}
        style={{ marginLeft: "10px" }}
      >
        {showCharts ? "Hide Analytics 📊" : "Show Analytics 📊"}
      </button>

        <button onClick={() => setShowShortlisted(!showShortlisted)}>
          {showShortlisted ? "Show All" : "Show Shortlisted ⭐"}
        </button>
        <button onClick={handleExportCSV}>
        📄 Export CSV
        </button>
        
        <button
        onClick={handleSearch}
        style={{
          marginLeft: "10px",
          padding: "5px 10px",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        🔍 Search
      </button>
        
      </div>


      {showCharts && (
      <>
      {/* Charts */}
      <h3>Score Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="score" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Skill Frequency</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={skillChartData}>
          <XAxis dataKey="skill" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Candidate Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={pieData} dataKey="value" label>
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      </>
      )}

      {/* Analytics */}
      {analytics && (
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={cardStyle}>Total: {analytics.total}</div>
          <div style={cardStyle}>Avg: {analytics.avg_score}%</div>
          <div style={cardStyle}>Top: {analytics.top_score}%</div>
        </div>
      )}

      {/* No results */}
      {filteredData.length === 0 && <p>No matching candidates</p>}

      {/* LIST */}
      {[...filteredData].sort((a, b) => b.score - a.score).map((c, i) => (
        <div key={c._id} style={{ background: "#fff", padding: "15px", margin: "10px", borderRadius: "10px" }}>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Rank #{i + 1}</b>

            <div>
              <button onClick={() => handleShortlist(c._id)}>
                {c.shortlisted ? "⭐" : "☆"}
              </button>

              <button onClick={() => handleDeleteOne(c._id)}>
                🗑
              </button>
            </div>
          </div>

          <h3>{c.filename}</h3>
          <p>Score: {c.score}%</p>

          <p><b>Skills:</b></p>
          {c.skills?.map((s, idx) => <span key={idx}>{s} </span>)}

          {c.missing_skills?.length > 0 && (
            <>
              <p style={{ color: "red" }}><b>Missing:</b></p>
              {c.missing_skills.map((s, idx) => <span key={idx}>{s} </span>)}
            </>
          )}

          {c.feedback && (
            <>
              <p style={{ color: "green" }}><b>Matched:</b></p>
              {c.feedback.matched_skills?.map((s, idx) => <span key={idx}>{s} </span>)}

              <p style={{ color: "blue" }}><b>Suggestions:</b></p>
              <ul>
                {c.feedback.suggestions?.map((s, idx) => <li key={idx}>{s}</li>)}
              </ul>
            </>
          )}

        </div>
      ))}

    </div>
  );
}

export default Dashboard;
