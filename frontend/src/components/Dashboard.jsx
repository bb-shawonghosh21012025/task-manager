import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, FileFlow, Activity } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleWorkplaceClick = () => {
    navigate('/workplace');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">TaskPro Dashboard</h1>
          <Button 
            onClick={handleWorkplaceClick}
            className="flex items-center gap-2"
          >
            <FileFlow className="w-4 h-4" />
            Workplace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <LayoutGrid className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="text-lg font-medium">Templates</h3>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-lg font-medium">Active Tasks</h3>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center gap-4">
              <FileFlow className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="text-lg font-medium">Workflows</h3>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {/* Placeholder for recent activity items */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Template "Customer Onboarding" was modified</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">New workflow "Sales Pipeline" created</p>
              <p className="text-xs text-gray-400">5 hours ago</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;