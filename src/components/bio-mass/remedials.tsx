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
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Separator } from "../ui/separator";

interface RemedialsProps {
  customerId?: string;
}

const Remedials: React.FC<RemedialsProps> = ({ customerId }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRemedial, setSelectedRemedial] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data for remedials
  const remedials = [
    {
      id: "1",
      dateReceived: "2023-05-10",
      remedialCode: "R01",
      remedialCodeDescription: "R01 Boiler",
      remedialRequirement: "VISIT",
      proposedAttendanceDate: "2023-05-20",
      attendingEngineer: "Russ Callaghan",
      confirmedByCustomer: true,
      status: "Pending",
      memo: "Customer reported unusual noise from boiler. Requires inspection and potential repair.",
    },
    {
      id: "2",
      dateReceived: "2023-04-15",
      remedialCode: "R03",
      remedialCodeDescription: "R03 Warranty Part replacement",
      remedialRequirement: "VISIT",
      proposedAttendanceDate: "2023-04-25",
      attendingEngineer: "Wes Wright",
      confirmedByCustomer: true,
      status: "Completed",
      memo: "Ignitor replacement required under warranty. Part ordered and scheduled for installation.",
    },
    {
      id: "3",
      dateReceived: "2023-03-22",
      remedialCode: "R14",
      remedialCodeDescription: "R14 - Non Warranty part replacement",
      remedialRequirement: "PHONE",
      proposedAttendanceDate: null,
      attendingEngineer: null,
      confirmedByCustomer: false,
      status: "Cancelled",
      memo: "Customer inquired about replacing control panel. Provided quote but customer decided not to proceed.",
    },
    {
      id: "4",
      dateReceived: "2023-02-05",
      remedialCode: "R17",
      remedialCodeDescription: "R17 KWB Error 07",
      remedialRequirement: "VISIT",
      proposedAttendanceDate: "2023-02-15",
      attendingEngineer: "Ben Winstanley",
      confirmedByCustomer: true,
      status: "Completed",
      memo: "Error 07 on KWB system. Diagnosed as sensor fault. Replaced temperature sensor and reset system.",
    },
  ];

  // Filter remedials based on status filter and search query
  const filteredRemedials = remedials.filter((remedial) => {
    const matchesStatus =
      statusFilter === "all" ||
      remedial.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesSearch =
      remedial.remedialCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      remedial.remedialCodeDescription
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      remedial.memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (remedial.attendingEngineer &&
        remedial.attendingEngineer
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Get the selected remedial details
  const selectedRemedialDetails = selectedRemedial
    ? remedials.find((r) => r.id === selectedRemedial)
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Remedial Work</CardTitle>
          <CardDescription>
            Manage remedial work for this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by code, description, or engineer..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="md:w-auto">New Remedial</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Received</TableHead>
                  <TableHead>Remedial Code</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Proposed Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemedials.map((remedial) => (
                  <TableRow
                    key={remedial.id}
                    className={
                      selectedRemedial === remedial.id ? "bg-muted" : ""
                    }
                  >
                    <TableCell>{remedial.dateReceived}</TableCell>
                    <TableCell className="font-medium">
                      {remedial.remedialCode}
                    </TableCell>
                    <TableCell>{remedial.remedialRequirement}</TableCell>
                    <TableCell>
                      {remedial.proposedAttendanceDate || "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          remedial.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : remedial.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {remedial.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRemedial(remedial.id)}
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

      {selectedRemedialDetails && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {selectedRemedialDetails.remedialCodeDescription}
                </CardTitle>
                <CardDescription>
                  Remedial ID: {selectedRemedialDetails.id} • Received:{" "}
                  {selectedRemedialDetails.dateReceived}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRemedial(null)}
                >
                  Close
                </Button>
                <Button>Update Status</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Remedial Code:</span>
                    <span>{selectedRemedialDetails.remedialCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Requirement:</span>
                    <span>{selectedRemedialDetails.remedialRequirement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Proposed Date:</span>
                    <span>
                      {selectedRemedialDetails.proposedAttendanceDate || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Attending Engineer:</span>
                    <span>
                      {selectedRemedialDetails.attendingEngineer ||
                        "Not assigned"}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        selectedRemedialDetails.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : selectedRemedialDetails.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedRemedialDetails.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Customer Confirmed:</span>
                    <span>
                      {selectedRemedialDetails.confirmedByCustomer
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Nuergy Ignitor Fitted:</span>
                    <span>No</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Woodco Ignitor Fitted:</span>
                    <span>No</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Remedial Memo</h3>
                <div className="p-4 border rounded-md bg-gray-50">
                  <p>{selectedRemedialDetails.memo}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Update Remedial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status-update">Status</Label>
                      <Select
                        defaultValue={selectedRemedialDetails.status.toLowerCase()}
                      >
                        <SelectTrigger id="status-update">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Attendance Date</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="engineer-update">
                        Attending Engineer
                      </Label>
                      <Select
                        defaultValue={
                          selectedRemedialDetails.attendingEngineer || ""
                        }
                      >
                        <SelectTrigger id="engineer-update">
                          <SelectValue placeholder="Select engineer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="russ-callaghan">
                            Russ Callaghan
                          </SelectItem>
                          <SelectItem value="wes-wright">Wes Wright</SelectItem>
                          <SelectItem value="ben-winstanley">
                            Ben Winstanley
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="customer-confirmed"
                        defaultChecked={
                          selectedRemedialDetails.confirmedByCustomer
                        }
                      />
                      <Label htmlFor="customer-confirmed">
                        Confirmed by Customer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nuergy-ignitor" />
                      <Label htmlFor="nuergy-ignitor">
                        Nuergy Ignitor Fitted
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="woodco-ignitor" />
                      <Label htmlFor="woodco-ignitor">
                        Woodco Ignitor Fitted
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="update-notes">Notes</Label>
                      <textarea
                        id="update-notes"
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Add notes about the remedial work..."
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Remedials;
