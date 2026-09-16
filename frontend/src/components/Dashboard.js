import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard({ data, fetchCandidates }) {
  const [searchInput, setSearchInput] = useState("");
  const [minScoreInput, setMinScoreInput] = useState("");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [showShortlisted, setShowShortlisted] = useState(false);

  // ✅ AUTO REFRESH

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // ✅ ONLY ANALYTICS FETCH HERE
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/analytics");
      setAnalytics(res.data);
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
    fetchCandidates();
  };

  const handleDeleteOne = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    await axios.delete(`http://127.0.0.1:8000/delete/${id}`);
    fetchCandidates();
  };

  const handleShortlist = async (id) => {
    await axios.put(`http://127.0.0.1:8000/shortlist/${id}`);
    fetchCandidates();
  };

  const exportCSV = () => {

    const csvData = data.map((c, index) => ({
      Rank: index + 1,
      Filename: c.filename,
      Score: c.score,

      CGPA: c.cgpa || "Not Found",
      CGPA_Status: c.cgpa_status || "N/A",

      Internship: c.internship ? "Yes" : "No",

      Projects: c.projects,

      Experience_Years: c.experience_years || 0,

      Degree_Status: c.degree_status || "N/A",

      Matched_Skills:
        c.feedback?.matched_skills?.join(" | ") || "",

      Missing_Skills:
        c.feedback?.missing_skills?.join(" | ") || "",

      Skills:
        c.skills?.join(" | ") || ""
    }));


    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        Object.keys(csvData[0]).join(","),
        ...csvData.map(row =>
          Object.values(row)
            .map(value => `"${value}"`)
            .join(",")
        )
      ].join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute(
      "href",
      encodedUri
    );

    link.setAttribute(
      "download",
      "ATS_Report.csv"
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const exportShortlistedCSV = () => {

    const shortlisted = data.filter(
      (candidate) => candidate.shortlisted === true
    );

    if (shortlisted.length === 0) {
      alert("No shortlisted candidates found");
      return;
    }

    const csvData = shortlisted.map((c, index) => ({
      Rank: index + 1,
      Filename: c.filename,
      Score: c.score,

      CGPA: c.cgpa || "Not Found",

      Internship: c.internship ? "Yes" : "No",

      Projects: c.projects,

      Experience_Years:
        c.experience_years || 0,

      Degree_Status:
        c.degree_status || "N/A",

      Matched_Skills:
        c.feedback?.matched_skills?.join(" | ") || "",

      Missing_Skills:
        c.feedback?.missing_skills?.join(" | ") || ""
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        Object.keys(csvData[0]).join(","),
        ...csvData.map(row =>
          Object.values(row)
            .map(value => `"${value}"`)
            .join(",")
        )
      ].join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");

    link.setAttribute(
      "href",
      encodedUri
    );

    link.setAttribute(
      "download",
      "Shortlisted_Candidates.csv"
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // ✅ FILTER
  const filteredData = data
    .filter((c) =>
      c.filename.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills || []).join(" ").toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => c.score >= minScore)
    .filter((c) => !showShortlisted || c.shortlisted);

  const sortedData = [...filteredData].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="mt-6 text-gray-800 dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-4">🏆 Candidate Ranking</h2>

      {/* SEARCH */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search..."
          className="border p-2 rounded bg-white dark:bg-gray-800"
        />

        <input
          type="number"
          value={minScoreInput}
          onChange={(e) => setMinScoreInput(Number(e.target.value))}
          placeholder="Min Score"
          className="border p-2 rounded bg-white dark:bg-gray-800"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          🔍 Search
        </button>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mb-4">
        <button onClick={handleDeleteAll} className="bg-red-500 px-4 py-2 text-white rounded">
          🗑 Delete
        </button>

        <button onClick={() => setShowShortlisted(!showShortlisted)} className="bg-yellow-400 px-4 py-2 rounded">
          ⭐ Shortlisted
        </button>

        <button onClick={exportCSV} className="bg-green-500 px-4 py-2 text-white rounded">
          📄 Export
        </button>

        <button
          onClick={exportShortlistedCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg ml-2">
          ⭐ Export Shortlisted
        </button>
      </div>

      {/* ANALYTICS */}
      {analytics && (
        <div className="flex gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1 text-center hover:shadow-xl transition duration-300">
            Total: {analytics.total}
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1 text-center hover:shadow-xl transition duration-300">
            Avg: {analytics.avg_score}%
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex-1 text-center hover:shadow-xl transition duration-300">
            Top: {analytics.top_score}%
          </div>
        </div>
      )}

      {/* CANDIDATES */}
      {filteredData.length === 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow text-center text-gray-500">
          No candidates found.
        </div>
      )}

      {sortedData.map((c, i) => {
        const semanticContribution =
          0.40 * (c.semantic_score || 0);

        const skillContribution =
          0.30 * (c.skill_match_score || 0);

        const requirementScore =
          (c.cgpa_score || 0) +
          (c.internship_score || 0) +
          (c.project_score || 0) +
          (c.experience_score || 0) +
          (c.degree_score || 0);

        const requirementContribution =
          (requirementScore / 25) * 20;

        const githubContribution =
          c.github_overall_score || 0;

      return ( 
      <div
        key={c._id}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow mb-4 hover:shadow-2xl transition duration-300"
        >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-3">

      {/* LEFT SIDE */}
      <div>
        <span className="text-sm text-gray-600 dark:text-gray-200 block font-medium">
          Rank #{i + 1}
        </span>
        <h3 className="font-semibold text-lg">
          {c.filename}
        </h3>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex gap-2">

        <a
          href={`http://127.0.0.1:8000/resume/${c.filename}`}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-500 text-white px-3 py-2 rounded"
        >
          👁 View Resume
        </a>

        <button
          onClick={() => handleDeleteOne(c._id)}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          🗑 Delete
        </button>

        <button
          onClick={() => handleShortlist(c._id)}
          className={`px-3 py-1 rounded ${
            c.shortlisted ? "bg-green-600 text-white" : "bg-gray-500 text-white"
          }`}
        >
          ⭐ {c.shortlisted ? "Shortlisted" : "Shortlist"}
        </button>

      </div>

    </div>

    {/* SCORE */}
    <p
      className={`mt-2 font-semibold ${
        c.score >= 75
          ? "text-green-500"
          : c.score >= 50
          ? "text-yellow-500"
          : "text-red-500"
      }`}
    >
      Score: {c.score}%
    </p>

    {/* SCORE BAR */}
    <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full mt-2 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-700 ${
                    c.score >= 75
                      ? "bg-green-500"
                      : c.score >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
        style={{ width: `${c.score}%` }}
      ></div>
    </div>

    {/* SCORE BREAKDOWN */}
    <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">

      <h3 className="font-semibold mb-3">
        Score Breakdown
      </h3>

      <div className="grid grid-cols-2 gap-2 text-sm">

        {/* SEMANTIC MATCH */}
        <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-2 rounded">
          Semantic Match: {semanticContribution.toFixed(2)} / 40
        </div>

        {/* SKILL MATCH */}
        <div className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 p-2 rounded">
          Skills Match: {skillContribution.toFixed(2)} / 30
        </div>

        {/* REQUIREMENTS */}
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 p-2 rounded">
          Requirements: {requirementContribution.toFixed(2)} / 20
        </div>

        {/* GITHUB */}
        <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 p-2 rounded">
          GitHub: {githubContribution.toFixed(2)} / 10
        </div>

      </div>

    </div>

    <p> 🎓 CGPA: {c.cgpa ? c.cgpa.toFixed(2) : "N/A"}{" "}

    {c.cgpa_required !== null && (
    <span
      className={
        c.cgpa_status === "above requirement"
          ? "text-green-500 font-medium"
          : c.cgpa_status === "below requirement"
          ? "text-red-500 font-medium"
          : "text-gray-500"
      }
    >
      ({c.cgpa_status})
    </span>
    )}
    </p>

    {/* 💼 Internship */}
    <div className="mt-3 flex items-center gap-2">
      <span className="font-semibold">
        💼 Internship:
      </span>

      {c.internship ? (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
          internship detected
        </span>
      ) : (
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full">
          no internship
        </span>
      )}
    </div>

    {/* 📊 Projects */}
    <div className="mt-2 flex items-center gap-2">
      <span className="font-medium">
        📊 Projects: {c.projects}
      </span>

      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          c.project_status === "requirement met"
            ? "bg-green-100 text-green-700"
            : c.project_status === "requirement not met"
            ? "bg-red-100 text-red-700"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        {c.project_status}
      </span>
    </div>

    {/* 🧑‍💻 Experience */}
    <div className="mt-2 flex items-center gap-2">
      <span className="font-medium">🧑‍💻 Experience:</span>
      <span>
        {c.experience_years > 0
          ? `${c.experience_years} years`
          : "No experience found"}
      </span>

      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          c.experience_status === "requirement met"
            ? "bg-green-100 text-green-700"
            : c.experience_status === "requirement not met"
            ? "bg-red-100 text-red-700"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        {c.experience_status}
      </span>
    </div>

    {/* 🎓 Degree */}
    <div className="mt-2 flex items-center gap-2">
      <span className="font-medium">
        🎓 Degree:
      </span>

      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          c.degree_status === "requirement met"
            ? "bg-green-100 text-green-700"
            : c.degree_status === "requirement not met"
            ? "bg-red-100 text-red-700"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        {c.degree_status}
      </span>
    </div>

    {/* SKILLS */}
    <div className="mt-3">
      <strong>Skills:</strong>

      <div className="flex flex-wrap gap-2 mt-2">
        {c.skills && c.skills.length > 0 ? (
          c.skills.map((s, idx) => (
            <span
              key={idx}
              className="inline-block bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-3 py-1 rounded text-sm"
            >
              {s}
            </span>
          ))
        ) : (
          <span className="text-gray-400">No skills found</span>
        )}
      </div>
    </div>

    {/* MATCHED SKILLS */}
    <div className="mt-3">
      <strong className="text-green-600">Matched:</strong>

      <div className="flex flex-wrap gap-2 mt-2">
        {c.feedback?.matched_skills?.length > 0 ? (
          c.feedback.matched_skills.map((s, idx) => (
            <span
              key={idx}
              className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-sm"
            >
              {s}
            </span>
          ))
        ) : (
          <span className="text-gray-400">None</span>
        )}
      </div>
    </div>

    {/* MISSING SKILLS */}
    <div className="mt-3">
      <strong className="text-red-500">Missing:</strong>

      <div className="flex flex-wrap gap-2 mt-2">
        {c.feedback?.missing_skills?.length > 0 ? (
          c.feedback.missing_skills.map((s, idx) => (
            <span
              key={idx}
              className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded text-sm"
            >
              {s}
            </span>
          ))
        ) : (
          <span className="text-gray-400">None</span>
        )}
      </div>
    </div>

    {/* 🐙 GITHUB ANALYSIS */}
    <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">

      <h3 className="text-lg font-semibold mb-3">
        🐙 GitHub Analysis
      </h3>

      {c.github_url ? (
        <div>

          {/* GitHub Profile */}
          <div className="flex flex-wrap items-center gap-3 mb-4">

            <span className="font-medium">
              GitHub:
            </span>

            <a
              href={c.github_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {c.github_url}
            </a>

          </div>

          {/* GitHub Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">

            <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 p-3 rounded">
              <span className="font-medium block">
                Overall Score
              </span>
              <span className="text-lg font-semibold">
                {c.github_overall_score ?? 0}/10
              </span>
            </div>

            <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-3 rounded">
              <span className="font-medium block">
                Repositories
              </span>
              <span className="text-lg font-semibold">
                {c.github_analysis?.public_repos ?? 0}
              </span>
            </div>

            <div className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 p-3 rounded">
              <span className="font-medium block">
                Matched Technologies
              </span>
              <span className="text-lg font-semibold">
                {c.github_skill_matches?.length ?? 0}
              </span>
            </div>

            <div className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 p-3 rounded">
              <span className="font-medium block">
                Semantic Similarity
              </span>
              <span className="text-lg font-semibold">
                {c.github_average_similarity ?? 0}%
              </span>
            </div>

          </div>

          {/* Matched GitHub Technologies */}
          <div className="mt-4">

            <strong className="text-green-600">
              Matched GitHub Technologies:
            </strong>

            <div className="flex flex-wrap gap-2 mt-2">

              {c.github_skill_matches?.length > 0 ? (

                c.github_skill_matches.map((skill, idx) => (

                  <span
                    key={idx}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm"
                  >
                    {skill}
                  </span>

                ))

              ) : (

                <span className="text-gray-400">
                  None
                </span>

              )}

            </div>

          </div>

          {/* Relevant Repositories */}
          <div className="mt-4">

            <strong className="text-blue-600">
              Relevant Repositories:
            </strong>

            <div className="mt-2 space-y-2">

              {c.github_relevant_repositories?.length > 0 ? (

                c.github_relevant_repositories.map((repo, idx) => (

                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600"
                  >

                    <div className="font-semibold">
                      {repo.name}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {repo.description || "No description available"}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs mt-2">

                      <span>
                        Language: {repo.language || "Unknown"}
                      </span>

                      <span>
                        Stars: {repo.stars ?? 0}
                      </span>

                      <span>
                        Forks: {repo.forks ?? 0}
                      </span>

                      <span>
                        Relevance Score: {repo.relevance_score ?? 0}
                      </span>

                    </div>

                    {repo.matched_skills?.length > 0 && (

                      <div className="flex flex-wrap gap-1 mt-2">

                        {repo.matched_skills.map(
                          (skill, skillIndex) => (

                            <span
                              key={skillIndex}
                              className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                            >
                              {skill}
                            </span>

                          )
                        )}

                      </div>

                    )}

                  </div>

                ))

              ) : (

                <span className="text-gray-400">
                  No relevant repositories found
                </span>

              )}

            </div>

          </div>

          {/* 🧠 TOP SEMANTIC REPOSITORIES */}
          <div className="mt-4">

            <strong className="text-purple-600">
              🧠 Top Semantic Repositories:
            </strong>

            <div className="mt-2 space-y-2">

              {c.github_semantic_repositories?.length > 0 ? (

                c.github_semantic_repositories
                  .slice(0, 3)
                  .map((repo, idx) => (

                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600"
                    >

                      <div className="flex justify-between items-center">

                        <span className="font-semibold">
                          #{idx + 1} {repo.name}
                        </span>

                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
                          {repo.semantic_similarity}%
                        </span>

                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {repo.description || "No description available"}
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Language: {repo.language || "Unknown"}
                      </div>

                    </div>

                  ))

              ) : (

                <span className="text-gray-400">
                  No semantic repositories found
                </span>

              )}

            </div>

          </div>

          {/* Semantic GitHub Score */}
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">

            <div className="font-medium">
              Semantic Repository Relevance
            </div>

            <div className="text-sm mt-1">
              Score: {c.github_semantic_relevance_score ?? 0}/5
            </div>

            <div className="text-sm">
              Average Similarity: {c.github_average_similarity ?? 0}%
            </div>

          </div>

        </div>

      ) : (

        <div className="text-gray-500">
          No GitHub profile found in resume.
        </div>

      )}

    </div>

    {/* SUGGESTIONS */}
    <div className="mt-3 text-blue-500">
      <strong>Suggestions:</strong>

      {c.feedback?.suggestions?.length > 0 ? (
        <ul className="list-disc ml-5">
          {c.feedback.suggestions.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No suggestions</p>
      )}
    </div>

    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded">
      <h4 className="font-semibold">
        🤖 AI Summary
      </h4>

      <p className="text-sm mt-1">
        {c.ai_summary}
      </p>
    </div>
    
  </div>
  );
})}
    </div>
  );
}

export default Dashboard;
