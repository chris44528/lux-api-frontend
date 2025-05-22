import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Separator } from "../ui/separator";

interface PaymentsProps {
  customerId?: string;
}

const Payments: React.FC<PaymentsProps> = ({ customerId }) => {
  const [paymentType, setPaymentType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Mock data for payment history
  const paymentHistory = [
    {
      id: "1",
      date: "2023-05-15",
      type: "Standing Order",
      amount: 120.0,
      status: "Paid",
      method: "Bank Transfer",
      reference: "SO-2023-05-15",
      notes: "Monthly standing order payment",
    },
    {
      id: "2",
      date: "2023-04-15",
      type: "Standing Order",
      amount: 120.0,
      status: "Paid",
      method: "Bank Transfer",
      reference: "SO-2023-04-15",
      notes: "Monthly standing order payment",
    },
    {
      id: "3",
      date: "2023-03-15",
      type: "Standing Order",
      amount: 120.0,
      status: "Paid",
      method: "Bank Transfer",
      reference: "SO-2023-03-15",
      notes: "Monthly standing order payment",
    },
    {
      id: "4",
      date: "2023-02-10",
      type: "Boiler Purchase",
      amount: 1500.0,
      status: "Paid",
      method: "Card",
      reference: "BP-2023-02-10",
      notes: "Boiler purchase payment",
    },
    {
      id: "5",
      date: "2023-06-15",
      type: "Standing Order",
      amount: 120.0,
      status: "Pending",
      method: "Bank Transfer",
      reference: "SO-2023-06-15",
      notes: "Monthly standing order payment (upcoming)",
    },
  ];

  // Filter payments based on type, status, and search query
  const filteredPayments = paymentHistory.filter((payment) => {
    const matchesType =
      paymentType === "all" ||
      payment.type.toLowerCase() === paymentType.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      payment.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesSearch =
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  // Get the selected payment details
  const selectedPaymentDetails = selectedPayment
    ? paymentHistory.find((p) => p.id === selectedPayment)
    : null;

  // Mock data for payment summary
  const paymentSummary = {
    totalPaid: 1980.0,
    pendingPayments: 120.0,
    overduePayments: 0.0,
    nextPaymentDate: "2023-06-15",
    nextPaymentAmount: 120.0,
    paymentMethod: "Standing Order",
    contractStartDate: "2023-02-10",
    contractEndDate: "2026-02-10",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>
            Overview of payment status and upcoming payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Total Paid:</span>
                <span className="text-green-600">
                  £{paymentSummary.totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Pending Payments:</span>
                <span className="text-amber-600">
                  £{paymentSummary.pendingPayments.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Overdue Payments:</span>
                <span className="text-red-600">
                  £{paymentSummary.overduePayments.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Next Payment Date:</span>
                <span>{paymentSummary.nextPaymentDate}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Next Payment Amount:</span>
                <span>£{paymentSummary.nextPaymentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment Method:</span>
                <span>{paymentSummary.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Contract Start Date:</span>
                <span>{paymentSummary.contractStartDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Contract End Date:</span>
                <span>{paymentSummary.contractEndDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View and manage payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by reference or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="standing order">Standing Order</SelectItem>
                  <SelectItem value="boiler purchase">
                    Boiler Purchase
                  </SelectItem>
                  <SelectItem value="pay as you go">Pay As You Go</SelectItem>
                </SelectContent>
              </Select>
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
            <Button className="md:w-auto">Record Payment</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className={selectedPayment === payment.id ? "bg-muted" : ""}
                  >
                    <TableCell>{payment.date}</TableCell>
                    <TableCell className="font-medium">
                      {payment.reference}
                    </TableCell>
                    <TableCell>{payment.type}</TableCell>
                    <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          payment.status === "Paid"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
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
                        onClick={() => setSelectedPayment(payment.id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedPaymentDetails && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Payment Details: {selectedPaymentDetails.reference}
                </CardTitle>
                <CardDescription>
                  {selectedPaymentDetails.type} • {selectedPaymentDetails.date}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPayment(null)}
                >
                  Close
                </Button>
                <Button>Print Receipt</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Type:</span>
                    <span>{selectedPaymentDetails.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span>£{selectedPaymentDetails.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Date:</span>
                    <span>{selectedPaymentDetails.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment Method:</span>
                    <span>{selectedPaymentDetails.method}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Reference:</span>
                    <span>{selectedPaymentDetails.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        selectedPaymentDetails.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : selectedPaymentDetails.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedPaymentDetails.status === "Overdue"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedPaymentDetails.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Notes:</span>
                    <span>{selectedPaymentDetails.notes}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Record New Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-type">Payment Type</Label>
                      <Select defaultValue="standing-order">
                        <SelectTrigger id="payment-type">
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standing-order">
                            Standing Order
                          </SelectItem>
                          <SelectItem value="boiler-purchase">
                            Boiler Purchase
                          </SelectItem>
                          <SelectItem value="pay-as-you-go">
                            Pay As You Go
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Amount</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        placeholder="0.00"
                        defaultValue="120.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {date ? (
                              format(date, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
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
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select defaultValue="bank-transfer">
                        <SelectTrigger id="payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank-transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-reference">Reference</Label>
                      <Input
                        id="payment-reference"
                        placeholder="Enter payment reference"
                        defaultValue={`SO-${format(new Date(), "yyyy-MM-dd")}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-notes">Notes</Label>
                      <textarea
                        id="payment-notes"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Add notes about this payment..."
                        defaultValue="Monthly standing order payment"
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Payment</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Payments;
