import UploadForm from "./components/UploadForm";
import Dashboard from "./components/Dashboard";

function App() {

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        AI Resume Screening Dashboard
      </h1>

      <UploadForm />

      <Dashboard />
    </div>
  );
}

export default App;
