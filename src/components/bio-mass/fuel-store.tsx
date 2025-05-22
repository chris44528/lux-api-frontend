import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
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
import { Separator } from "../ui/separator";

interface FuelStoreProps {
  customerId?: string;
}

const FuelStore: React.FC<FuelStoreProps> = ({ customerId }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [engineer, setEngineer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for fuel store service history
  const fuelStoreHistory = [
    {
      id: "1",
      date: "2023-01-15",
      engineer: "Russ Callaghan",
      bslNumbers: "BSL 0541672-0002 - Zora Energy",
      notes:
        "Regular fuel store service. Cleaned and inspected. No issues found.",
    },
    {
      id: "2",
      date: "2022-07-20",
      engineer: "Wes Wright",
      bslNumbers: "BSL 0541672-0002 - Zora Energy",
      notes:
        "Fuel store service. Recommended more frequent cleaning due to high usage.",
    },
    {
      id: "3",
      date: "2022-01-18",
      engineer: "Ben Winstanley",
      bslNumbers: "BSL 0541672-0002 - Zora Energy",
      notes: "Annual fuel store service. Replaced worn components.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Fuel store service scheduled successfully!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fuel Store Service</CardTitle>
          <CardDescription>
            Manage fuel store service records and schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fuel-store-call">
                    Fuel Store Service - Call
                  </Label>
                  <Input
                    id="fuel-store-call"
                    placeholder="Enter call details"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-store-cro">
                    Fuel Store Service - CRO
                  </Label>
                  <Input id="fuel-store-cro" placeholder="Enter CRO details" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-store-payment">
                    Fuel Store Service - Payment Taken
                  </Label>
                  <Input
                    id="fuel-store-payment"
                    placeholder="Enter payment details"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="homeowner-notified" />
                  <Label htmlFor="homeowner-notified">
                    Homeowner Notified of Required Fuel Level
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Attendance Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attending-engineer">Attending Engineer</Label>
                  <Select value={engineer} onValueChange={setEngineer}>
                    <SelectTrigger id="attending-engineer">
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
                  <Checkbox id="fuel-store-service-complete" />
                  <Label htmlFor="fuel-store-service-complete">
                    Fuel Store Service Complete
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="fuel-store-service-confirmation" />
                  <Label htmlFor="fuel-store-service-confirmation">
                    Fuel Store Service Confirmation
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bsl-numbers">BSL Authorization Numbers</Label>
                  <Input
                    id="bsl-numbers"
                    placeholder="Enter BSL numbers"
                    defaultValue="BSL 0541672-0002 - Zora Energy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-notes">Service Notes</Label>
                  <textarea
                    id="service-notes"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Add notes about the fuel store service..."
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Service Details"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Store Service History</CardTitle>
          <CardDescription>Previous fuel store service records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {fuelStoreHistory.map((record) => (
              <div
                key={record.id}
                className="p-4 border rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">Service Date: {record.date}</h3>
                    <p className="text-sm text-muted-foreground">
                      Engineer: {record.engineer}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">BSL Numbers:</span>{" "}
                      {record.bslNumbers}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Notes:</span> {record.notes}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Store Information</CardTitle>
          <CardDescription>
            Details about the customer's fuel store setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Hopper Size:</span>
                <span>1.2 TONNE HOPPER</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Current Fuel Type:</span>
                <span>Wood Pellets</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Fuel Supplier:</span>
                <span>Zora Energy</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Delivery Date:</span>
                <span>2023-04-10</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Estimated Usage:</span>
                <span>3.5 tonnes per year</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Frequency:</span>
                <span>Every 6 months</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Service Date:</span>
                <span>2023-01-15</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Next Service Due:</span>
                <span className="text-amber-600">2023-07-15</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 border rounded-md bg-amber-50 border-amber-200">
            <h3 className="font-bold text-lg mb-2">Important Notes</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Customer prefers deliveries on weekdays between 9am and 3pm
              </li>
              <li>Access to fuel store is via side gate (code: 1234)</li>
              <li>
                Customer has requested notification 1 week before scheduled
                service
              </li>
              <li>
                Previous issues with moisture in fuel store - requires extra
                inspection
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelStore;
