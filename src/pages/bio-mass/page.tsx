import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import Dashboard from "../../components/bio-mass/dashboard";
import CustomerDashboard from "../../components/bio-mass/customer-dashboard";
import CustomerManagement from "../../components/bio-mass/customer-management";
import ReportManagement from "../../components/bio-mass/report-management";

function BioMassPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    string | undefined
  >(undefined);
  const [view, setView] = useState<"dashboard" | "customer-detail">(
    "dashboard"
  );

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setView("customer-detail");
  };

  const handleBackToDashboard = () => {
    setView("dashboard");
    setSelectedCustomerId(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bio-mass Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your boiler customers, services, payments, and reports
          </p>
        </div>

        {view === "dashboard" ? (
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <Dashboard onSelectCustomer={handleSelectCustomer} />
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              <CustomerManagement
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={handleSelectCustomer}
              />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <ReportManagement />
            </TabsContent>
          </Tabs>
        ) : (
          <CustomerDashboard
            customerId={selectedCustomerId}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}

export default BioMassPage;
