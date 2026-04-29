import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

function Analytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await axios.get("http://127.0.0.1:8000/candidates");
    setData(res.data);
  };

  // 📊 Skill Frequency
  const skillFrequency = {};
  data.forEach((c) => {
    (c.skills || []).forEach((skill) => {
      skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
  });

  const skillBarData = Object.keys(skillFrequency)
    .map((skill) => ({
      skill,
      count: skillFrequency[skill],
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 🥧 Score Distribution
  const scoreRanges = {
    "0-40": 0,
    "40-70": 0,
    "70-100": 0,
  };

  data.forEach((c) => {
    if (c.score < 40) scoreRanges["0-40"]++;
    else if (c.score < 70) scoreRanges["40-70"]++;
    else scoreRanges["70-100"]++;
  });

  const scorePieData = Object.keys(scoreRanges).map((range) => ({
    name: range,
    value: scoreRanges[range],
  }));

  // 📊 Resume Score Bar
  const scoreBarData = data.map((c) => ({
    name: c.filename,
    score: c.score,
  }));

  const COLORS = ["#f44336", "#ff9800", "#4caf50"];

  return (
    <div className="text-gray-800 dark:text-white">

      <h2 className="text-2xl font-bold mb-6">📊 Analytics Dashboard</h2>

      <div className="space-y-10">

        {/* Skill Bar */}
        <div>
          <h3 className="text-lg font-semibold mb-2">📊 Skill Frequency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resume Score Bar */}
        <div>
          <h3 className="text-lg font-semibold mb-2">📊 Resume Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-2">🥧 Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scorePieData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {scorePieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default Analytics;
