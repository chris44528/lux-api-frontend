import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConnectionAnalysis from "@/pages/analysis/connection";
import ReadingsAnalysis from "@/pages/analysis/readings";
import PerformanceAnalysis from "@/pages/analysis/performance";

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
            <TabsTrigger value="readings">Readings Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="mt-6">
            <ConnectionAnalysis />
          </TabsContent>
          
          <TabsContent value="readings" className="mt-6">
            <ReadingsAnalysis />
          </TabsContent>
          
          <TabsContent value="performance" className="mt-6">
            <PerformanceAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 