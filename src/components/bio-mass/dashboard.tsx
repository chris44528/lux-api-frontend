import React, { useEffect, useState } from "react";
import {
  bioSiteService,
  remedialService,
  serviceRecordService,
} from "../../services/bioApiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";

interface DashboardProps {
  onSelectCustomer: (customerId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectCustomer }) => {
  // State for dashboard data
  const [stats, setStats] = useState({
    totalCustomers: 0,
    customerGrowth: "",
    pendingServices: 0,
    pendingRemedials: 0,
    revenue: "£0",
    revenueGrowth: "",
  });

  const [recentCustomers, setRecentCustomers] = useState<
    Array<{
      id: string;
      reference: string;
      name: string;
      status: string;
      lastService: string;
    }>
  >([]);

  const [upcomingServices, setUpcomingServices] = useState<
    Array<{
      id: string;
      reference: string;
      name: string;
      date: string;
      type: string;
    }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Define interfaces for API responses
  interface BioSite {
    id: number;
    reference?: string;
    name: string;
    first_name?: string;
    last_name?: string;
    status: string;
  }

  interface ServiceRecord {
    id: number;
    site?: {
      reference?: string;
      name?: string;
    };
    service_date?: string;
    year: number;
    service_number: number;
  }

  // Fetch data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const customersResponse = await bioSiteService.getAllSites();
      const customers = customersResponse.results || [];
      // Get total count from API response if available, otherwise use the length of results
      const totalCustomers =
        customersResponse.count !== undefined
          ? customersResponse.count
          : customers.length;

      // Fetch pending services
      const servicesResponse = await serviceRecordService.getAllServiceRecords({
        status: "Pending,Scheduled",
      });
      const services = servicesResponse.results || [];
      // Get pending services count from API response if available
      const pendingServices =
        servicesResponse.count !== undefined
          ? servicesResponse.count
          : services.length;

      // Fetch pending remedials
      const remedialsResponse = await remedialService.getAllRemedials({
        status: "Pending",
      });
      const remedials = remedialsResponse.results || [];
      // Get pending remedials count from API response if available
      const pendingRemedials =
        remedialsResponse.count !== undefined
          ? remedialsResponse.count
          : remedials.length;

      // Update stats
      setStats({
        totalCustomers,
        customerGrowth: "+12 from last month", // This would need to be calculated
        pendingServices,
        pendingRemedials,
        revenue: "£24,780", // This would need to be calculated
        revenueGrowth: "+8.2% from last month", // This would need to be calculated
      });

      // Update recent customers
      const recentCustomersData = customers
        .slice(0, 3)
        .map((customer: BioSite) => ({
          id: customer.id.toString(),
          reference: customer.reference || "",
          name:
            `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
            customer.name,
          status: customer.status,
          lastService: "2023-05-15", // This would need to be fetched
        }));
      setRecentCustomers(recentCustomersData);

      // Update upcoming services
      const upcomingServicesData = services
        .slice(0, 3)
        .map((service: ServiceRecord) => ({
          id: service.id.toString(),
          reference: service.site?.reference || "",
          name: service.site?.name || "",
          date: service.service_date || "",
          type: `Year ${service.year} Service ${service.service_number}`,
        }));
      setUpcomingServices(upcomingServicesData);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => fetchDashboardData()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Bio-mass Dashboard</CardTitle>
          <CardDescription>
            Overview of your bio-mass system management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.customerGrowth}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingServices}
                </div>
                <p className="text-xs text-muted-foreground">Due this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remedials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingRemedials}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending resolution
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.revenue}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.revenueGrowth}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle>Recent Customers</CardTitle>
          <CardDescription>Recently accessed customer records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.reference}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectCustomer(customer.id)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle>Upcoming Services</CardTitle>
          <CardDescription>
            Services scheduled in the next 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.date} - {service.type}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectCustomer(service.id)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-1">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button className="w-full">Add New Customer</Button>
            <Button className="w-full" variant="outline">
              Schedule Service
            </Button>
            <Button className="w-full" variant="outline">
              Record Payment
            </Button>
            <Button className="w-full" variant="outline">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
