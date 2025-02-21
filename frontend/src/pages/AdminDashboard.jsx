import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Menu, LayoutDashboard, Users, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import AdminSidebar from "../components/AdminSidebar";

const data = [
  { name: "Reports", count: 30 },
  { name: "Resolved", count: 20 },
  { name: "Pending", count: 10 },
];

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar className="w-64 flex-shrink-0" />
      <div className="flex-1 p-6">
        <header className="flex justify-between items-center bg-white shadow p-4 rounded-lg">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-bold">Community Fix Admin</h2>
        </header>
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-500 p-4 rounded-lg text-white text-center shadow-lg">
            <h3 className="text-lg font-semibold">Total Reports</h3>
            <p className="text-2xl font-bold">30</p>
          </div>
          <div className="bg-green-500 p-4 rounded-lg text-white text-center shadow-lg">
            <h3 className="text-lg font-semibold">Resolved Issues</h3>
            <p className="text-2xl font-bold">20</p>
          </div>
          <div className="bg-red-500 p-4 rounded-lg text-white text-center shadow-lg">
            <h3 className="text-lg font-semibold">Pending Cases</h3>
            <p className="text-2xl font-bold">10</p>
          </div>
        </div>
        <div className="bg-white p-6 mt-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Reports Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
