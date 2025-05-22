import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

interface ServiceManagementProps {
  selectedCustomerId: string | undefined;
  onSelectCustomer: (customerId: string) => void;
}

const ServiceManagement: React.FC<ServiceManagementProps> = ({
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data for services
  const services = [
    {
      id: "1",
      customerId: "1",
      customerName: "Martin Vernon",
      customerReference: "VERN5282",
      type: "Annual Service",
      status: "Scheduled",
      date: "2023-07-15",
      engineer: "Russ Callaghan",
    },
    {
      id: "2",
      customerId: "2",
      customerName: "John Smith",
      customerReference: "SMIT4391",
      type: "Remedial Work",
      status: "Completed",
      date: "2023-06-20",
      engineer: "Wes Wright",
    },
    {
      id: "3",
      customerId: "3",
      customerName: "Emma Williams",
      customerReference: "WILL7823",
      type: "Fuel Store Service",
      status: "Pending",
      date: "2023-07-28",
      engineer: "Ben Winstanley",
    },
    {
      id: "4",
      customerId: "4",
      customerName: "Sarah Johnson",
      customerReference: "JOHN6721",
      type: "Annual Service",
      status: "Cancelled",
      date: "2023-06-15",
      engineer: "Russ Callaghan",
    },
    {
      id: "5",
      customerId: "5",
      customerName: "Michael Brown",
      customerReference: "BROW9012",
      type: "Remedial Work",
      status: "Scheduled",
      date: "2023-07-22",
      engineer: "Wes Wright",
    },
  ];

  // Filter services based on search query and status filter
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.customerReference
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      service.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.engineer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      service.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // If a customer is selected, filter services for that customer
  const displayedServices = selectedCustomerId
    ? filteredServices.filter(
        (service) => service.customerId === selectedCustomerId
      )
    : filteredServices;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Management</CardTitle>
        <CardDescription>
          Schedule and manage bio-mass system services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by customer, reference, service type, or engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
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
          <Button className="md:w-auto">Schedule Service</Button>
        </div>

        {selectedCustomerId && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">
                  Filtered for customer:{" "}
                  {
                    services.find((s) => s.customerId === selectedCustomerId)
                      ?.customerName
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reference:{" "}
                  {
                    services.find((s) => s.customerId === selectedCustomerId)
                      ?.customerReference
                  }
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => onSelectCustomer(selectedCustomerId)}
              >
                View Customer
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Engineer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    {service.customerName}
                  </TableCell>
                  <TableCell>{service.customerReference}</TableCell>
                  <TableCell>{service.type}</TableCell>
                  <TableCell>{service.date}</TableCell>
                  <TableCell>{service.engineer}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        service.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : service.status === "Scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : service.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCustomer(service.customerId)}
                    >
                      View Customer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceManagement;
