import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const COLORS = ["#FFBB28", "#00C49F", "#FF8042", "#0088FE"];

const JobEngineerReportsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for development
  const mockData = {
    totalJobs: 156,
    completionRate: 79,
    avgCompletionTime: 4.2,
    customerSatisfaction: 4.8,
    jobCompletionTrend: [
      { month: "Jan", jobs: 12 },
      { month: "Feb", jobs: 14 },
      { month: "Mar", jobs: 16 },
      { month: "Apr", jobs: 18 },
      { month: "May", jobs: 22 },
    ],
    jobTypesDistribution: [
      { name: "Installation", value: 78 },
      { name: "Maintenance", value: 42 },
      { name: "Repair", value: 24 },
      { name: "Inspection", value: 12 },
    ],
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverviewTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => {
    return (
      <>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Job Completion Trend</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Number of jobs completed over time
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData.jobCompletionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
              Job Types Distribution
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Distribution by category
            </p>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mockData.jobTypesDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockData.jobTypesDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                {mockData.jobTypesDistribution.map((entry, index) => (
                  <div key={`summary-${index}`} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="mr-2 dark:text-gray-300">{entry.name}</span>
                    <span className="font-bold mr-1 dark:text-gray-300">{entry.value}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({Math.round((entry.value / mockData.totalJobs) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Performance and Job Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Performance Table */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Monthly Performance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Jobs completed and revenue by month
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Jobs Completed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      vs. Previous
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">Jan</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">12</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">$28,500</td>
                    <td className="px-6 py-4 whitespace-nowrap">N/A</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">Feb</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">14</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">$32,200</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-500 dark:text-green-400">
                      + 13%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">Mar</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">16</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">$36,800</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-500 dark:text-green-400">
                      + 14%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">Apr</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">18</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">$41,500</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-500 dark:text-green-400">
                      + 13%
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">May</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">22</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-300">$50,600</td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-500 dark:text-green-400">
                      + 22%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Job Status Distribution */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">
              Job Status Distribution
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Current status of all jobs
            </p>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="dark:text-gray-300">Completed</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 dark:text-gray-300">124</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">(79%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="dark:text-gray-300">In Progress</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 dark:text-gray-300">28</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">(18%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="dark:text-gray-300">Scheduled</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 dark:text-gray-300">4</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">(3%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">Analytics Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Performance metrics and business insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Jobs</h2>
          <p className="text-3xl font-bold mt-1 dark:text-gray-100">{mockData.totalJobs}</p>
          <p className="text-sm text-green-500 dark:text-green-400 mt-1">+ 8% from last period</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h2>
          <p className="text-3xl font-bold mt-1 dark:text-gray-100">{mockData.completionRate}%</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${mockData.completionRate}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Avg. Completion Time
          </h2>
          <p className="text-3xl font-bold mt-1 dark:text-gray-100">
            {mockData.avgCompletionTime} days
          </p>
          <p className="text-sm text-green-500 dark:text-green-400 mt-1">
            0.3 days faster than last period
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Customer Satisfaction
          </h2>
          <p className="text-3xl font-bold mt-1 dark:text-gray-100">
            {mockData.customerSatisfaction}/5
          </p>
          <div className="flex text-yellow-400 mt-1">
            {"★".repeat(Math.floor(mockData.customerSatisfaction))}
            {"☆".repeat(5 - Math.floor(mockData.customerSatisfaction))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-gray-800 rounded-t shadow mb-6 overflow-x-auto">
        <button
          className={`px-6 py-3 font-medium whitespace-nowrap ${
            activeTab === "overview"
              ? "border-b-2 border-primary text-primary dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => handleTabChange("overview")}
        >
          Overview
        </button>
        <button
          className={`px-6 py-3 font-medium whitespace-nowrap ${
            activeTab === "engineer"
              ? "border-b-2 border-primary text-primary dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => handleTabChange("engineer")}
        >
          Engineer Performance
        </button>
        <button
          className={`px-6 py-3 font-medium whitespace-nowrap ${
            activeTab === "issues"
              ? "border-b-2 border-primary text-primary dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => handleTabChange("issues")}
        >
          Common Issues
        </button>
        <button
          className={`px-6 py-3 font-medium whitespace-nowrap ${
            activeTab === "feedback"
              ? "border-b-2 border-primary text-primary dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => handleTabChange("feedback")}
        >
          Customer Feedback
        </button>
        <button
          className={`px-6 py-3 font-medium whitespace-nowrap ${
            activeTab === "financial"
              ? "border-b-2 border-primary text-primary dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => handleTabChange("financial")}
        >
          Financial
        </button>
      </div>

      {/* Tab Content */}
      {renderActiveTabContent()}
    </div>
  );
};

export default JobEngineerReportsPage;
