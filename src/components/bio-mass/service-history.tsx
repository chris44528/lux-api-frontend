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

interface ServiceHistoryProps {
  customerId?: string;
}

const ServiceHistory: React.FC<ServiceHistoryProps> = ({ customerId }) => {
  const [yearFilter, setYearFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for service history
  const serviceHistory = [
    {
      id: "1",
      year: 10,
      serviceNumber: 1,
      date: "2023-05-15",
      engineer: "Russ Callaghan",
      status: "Completed",
      burningHours: "4,567",
      serviceConfirmation: true,
      declarationSigned: true,
      packSigned: true,
      warrantySubmitted: "yes",
      notes: "Regular service, system in good condition",
    },
    {
      id: "2",
      year: 9,
      serviceNumber: 2,
      date: "2022-11-20",
      engineer: "Wes Wright",
      status: "Completed",
      burningHours: "4,123",
      serviceConfirmation: true,
      declarationSigned: true,
      packSigned: true,
      warrantySubmitted: "yes",
      notes: "Replaced ignitor, cleaned heat exchanger",
    },
    {
      id: "3",
      year: 9,
      serviceNumber: 1,
      date: "2022-05-18",
      engineer: "Ben Winstanley",
      status: "Completed",
      burningHours: "3,789",
      serviceConfirmation: true,
      declarationSigned: true,
      packSigned: true,
      warrantySubmitted: "yes",
      notes: "Regular service, recommended cleaning fuel store",
    },
    {
      id: "4",
      year: 8,
      serviceNumber: 2,
      date: "2021-11-22",
      engineer: "Russ Callaghan",
      status: "Completed",
      burningHours: "3,456",
      serviceConfirmation: true,
      declarationSigned: true,
      packSigned: true,
      warrantySubmitted: "yes",
      notes: "Adjusted air settings, improved efficiency",
    },
    {
      id: "5",
      year: 8,
      serviceNumber: 1,
      date: "2021-05-20",
      engineer: "Wes Wright",
      status: "Completed",
      burningHours: "3,012",
      serviceConfirmation: true,
      declarationSigned: true,
      packSigned: true,
      warrantySubmitted: "yes",
      notes: "Regular service, system in good condition",
    },
  ];

  // Filter service history based on year filter and search query
  const filteredHistory = serviceHistory.filter((service) => {
    const matchesYear =
      yearFilter === "all" || service.year.toString() === yearFilter;
    const matchesSearch =
      service.engineer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.date.includes(searchQuery);

    return matchesYear && matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service History</CardTitle>
        <CardDescription>
          View complete service history for this customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by engineer, date, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="10">Year 10</SelectItem>
                <SelectItem value="9">Year 9</SelectItem>
                <SelectItem value="8">Year 8</SelectItem>
                <SelectItem value="7">Year 7</SelectItem>
                <SelectItem value="6">Year 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="md:w-auto">Schedule Service</Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Engineer</TableHead>
                <TableHead>Burning Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    Year {service.year}
                  </TableCell>
                  <TableCell>Service {service.serviceNumber}</TableCell>
                  <TableCell>{service.date}</TableCell>
                  <TableCell>{service.engineer}</TableCell>
                  <TableCell>{service.burningHours}</TableCell>
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
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Service Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Service Confirmation:</span>
                <span className="text-green-600">Completed</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Declaration Signed:</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Pack Signed:</span>
                <span className="text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Warranty Submitted:</span>
                <span className="text-green-600">Yes</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Notes:</span>
                <p className="mt-1 text-sm">
                  Regular service completed. System in good condition.
                  Recommended cleaning fuel store before next service. Burning
                  hours: 4,567.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  Download Report
                </Button>
                <Button size="sm">Print Certificate</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceHistory;
