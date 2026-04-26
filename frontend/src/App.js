import UploadForm from "./components/UploadForm";
import Dashboard from "./components/Dashboard";
import { useState } from "react";

function App() {
  const [refresh, setRefresh] = useState(false);

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Resume Screening System</h1>

      <UploadForm refresh={() => setRefresh(!refresh)} />
      <Dashboard refresh={refresh} />
    </div>
  );
}

export default App;
