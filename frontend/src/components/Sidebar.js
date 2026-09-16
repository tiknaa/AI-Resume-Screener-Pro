import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Upload", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Analytics", path: "/analytics" },
    { name: "Resume Builder", path: "/resume-builder" }
  ];

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-gray-900 text-white p-5 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6">🤖 AI Screener</h2>

      <ul className="space-y-3">
        {menu.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`block p-2 rounded-lg ${
                location.pathname === item.path
                  ? "bg-blue-600"
                  : "hover:bg-gray-700"
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
