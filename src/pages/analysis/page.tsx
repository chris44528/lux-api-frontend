import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConnectionAnalysis from "@/pages/analysis/connection";

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("connection");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Analysis Dashboard</h1>
        </div>

        <Tabs
          defaultValue="connection"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="connection">Connection Analysis</TabsTrigger>
            <TabsTrigger value="readings" disabled>Readings Analysis</TabsTrigger>
            <TabsTrigger value="performance" disabled>Performance Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="mt-6">
            <ConnectionAnalysis />
          </TabsContent>
          
          <TabsContent value="readings">
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
              <p className="text-gray-500 dark:text-gray-400">Reading Analysis coming soon</p>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
              <p className="text-gray-500 dark:text-gray-400">Performance Analysis coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 