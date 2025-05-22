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

interface PaymentManagementProps {
  selectedCustomerId: string | undefined;
  onSelectCustomer: (customerId: string) => void;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({
  selectedCustomerId,
  onSelectCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data for payments
  const payments = [
    {
      id: "1",
      customerId: "1",
      customerName: "Martin Vernon",
      customerReference: "VERN5282",
      type: "Standing Order",
      amount: 120.0,
      status: "Paid",
      date: "2023-06-15",
      method: "Bank Transfer",
    },
    {
      id: "2",
      customerId: "2",
      customerName: "John Smith",
      customerReference: "SMIT4391",
      type: "Boiler Purchase",
      amount: 1500.0,
      status: "Pending",
      date: "2023-07-01",
      method: "Card",
    },
    {
      id: "3",
      customerId: "3",
      customerName: "Emma Williams",
      customerReference: "WILL7823",
      type: "Pay As You Go",
      amount: 85.0,
      status: "Overdue",
      date: "2023-05-28",
      method: "Cheque",
    },
    {
      id: "4",
      customerId: "4",
      customerName: "Sarah Johnson",
      customerReference: "JOHN6721",
      type: "Standing Order",
      amount: 120.0,
      status: "Paid",
      date: "2023-06-10",
      method: "Bank Transfer",
    },
    {
      id: "5",
      customerId: "5",
      customerName: "Michael Brown",
      customerReference: "BROW9012",
      type: "Pay As You Go",
      amount: 85.0,
      status: "Cancelled",
      date: "2023-06-22",
      method: "Cash",
    },
  ];

  // Filter payments based on search query and status filter
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerReference
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      payment.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // If a customer is selected, filter payments for that customer
  const displayedPayments = selectedCustomerId
    ? filteredPayments.filter(
        (payment) => payment.customerId === selectedCustomerId
      )
    : filteredPayments;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
        <CardDescription>Track and manage customer payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by customer, reference, payment type, or method..."
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
          <Button className="md:w-auto">Record Payment</Button>
        </div>

        {selectedCustomerId && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">
                  Filtered for customer:{" "}
                  {
                    payments.find((p) => p.customerId === selectedCustomerId)
                      ?.customerName
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reference:{" "}
                  {
                    payments.find((p) => p.customerId === selectedCustomerId)
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
                <TableHead>Payment Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.customerName}
                  </TableCell>
                  <TableCell>{payment.customerReference}</TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        payment.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "Pending"
                          ? "bg-blue-100 text-blue-800"
                          : payment.status === "Overdue"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCustomer(payment.customerId)}
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

export default PaymentManagement;
