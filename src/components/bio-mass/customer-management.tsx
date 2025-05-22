import React, { useState, useEffect } from "react";
import { bioSiteService } from "../../services/bioApiService";
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

interface CustomerManagementProps {
  selectedCustomerId: string | undefined;
  onSelectCustomer: (customerId: string) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Define interface for customer data
  interface Customer {
    id: number;
    reference?: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    city?: string;
    postcode?: string;
    status: string;
    customer_type?: string;
  }

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await bioSiteService.getAllSites();
        const customersData = response.results || [];

        // Transform API data to match component's expected format
        const formattedCustomers = customersData.map((customer: Customer) => ({
          id: customer.id.toString(),
          reference: customer.reference || "",
          name:
            customer.name ||
            `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
          status: customer.status || "Active",
          address: [
            customer.address1,
            customer.address2,
            customer.address3,
            customer.city,
          ]
            .filter(Boolean)
            .join(", "),
          phone: customer.phone || "",
        }));

        setCustomers(formattedCustomers);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to load customers");
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter customers based on search query and status filter
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      customer.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
        <CardDescription>
          View and manage your bio-mass customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by name, reference, address, or phone..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="md:w-auto">Add New Customer</Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading customers...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">{error}</p>
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Address
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.reference}
                    </TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {customer.address}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {customer.phone}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          customer.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : customer.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectCustomer(customer.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerManagement;
