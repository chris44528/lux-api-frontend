import React, { useState, useEffect } from "react";
import { bioSiteService } from "../../services/bioApiService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import CustomerDetails from "./customer-details";
import ServiceHistory from "./service-history";
import Servicing from "./servicing";
import Remedials from "./remedials";
import FuelStore from "./fuel-store";
import Payments from "./payments";

interface CustomerDashboardProps {
  customerId?: string;
  onBack?: () => void;
}

export default function CustomerDashboard({
  customerId,
  onBack,
}: CustomerDashboardProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const customerData = await bioSiteService.getSiteById(customerId);
        setCustomer(customerData);
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching customer with ID ${customerId}:`, err);
        setError("Failed to load customer data");
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <p>Loading customer data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row w-full md:w-1/2 gap-4">
          <div className="flex items-center bg-muted/30 px-4 py-2 rounded-md">
            <span className="font-semibold mr-2">Reference:</span>
            <span>{customer?.reference || "N/A"}</span>
          </div>
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Search by customer name, reference, or boiler serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button type="submit" size="icon">
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Dashboard
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button>New Customer</Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
          <TabsTrigger value="details">Customer Details</TabsTrigger>
          <TabsTrigger value="service-history">Service History</TabsTrigger>
          <TabsTrigger value="remedials">Remedials</TabsTrigger>
          <TabsTrigger value="servicing">Servicing</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="fuel-store">Fuel Store</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <CustomerDetails customerId={customerId} />
        </TabsContent>
        <TabsContent value="service-history">
          <ServiceHistory customerId={customerId} />
        </TabsContent>
        <TabsContent value="remedials">
          <Remedials customerId={customerId} />
        </TabsContent>
        <TabsContent value="servicing">
          <Servicing customerId={customerId} />
        </TabsContent>
        <TabsContent value="payments">
          <Payments customerId={customerId} />
        </TabsContent>
        <TabsContent value="fuel-store">
          <FuelStore customerId={customerId} />
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and view system reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="w-full">Service Due Report</Button>
                <Button className="w-full">Maintenance History Report</Button>
                <Button className="w-full">Customer Payment Report</Button>
                <Button className="w-full">Boiler Performance Report</Button>
                <Button className="w-full">Engineer Activity Report</Button>
                <Button className="w-full">Fuel Consumption Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
