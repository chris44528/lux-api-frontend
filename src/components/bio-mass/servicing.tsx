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

interface ServicingProps {
  customerId?: string;
}

const Servicing: React.FC<ServicingProps> = ({ customerId }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [serviceType, setServiceType] = useState("annual");
  const [engineer, setEngineer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for the current customer's service schedule
  const serviceSchedule = {
    nextServiceDue: "2023-08-15",
    serviceYear: 10,
    serviceNumber: 2,
    lastService: "2023-02-10",
    lastBurningHours: "4,567",
    warrantyStatus: "Valid until 2025-12-31",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Service scheduled successfully!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Schedule</CardTitle>
          <CardDescription>
            View and manage upcoming services for this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Next Service Due:</span>
                <span className="text-amber-600">
                  {serviceSchedule.nextServiceDue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Year:</span>
                <span>Year {serviceSchedule.serviceYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service Number:</span>
                <span>Service {serviceSchedule.serviceNumber}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Last Service Date:</span>
                <span>{serviceSchedule.lastService}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Burning Hours:</span>
                <span>{serviceSchedule.lastBurningHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Warranty Status:</span>
                <span className="text-green-600">
                  {serviceSchedule.warrantyStatus}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule New Service</CardTitle>
          <CardDescription>
            Book a new service appointment for this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service-type">Service Type</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger id="service-type">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Service</SelectItem>
                      <SelectItem value="remedial">Remedial Work</SelectItem>
                      <SelectItem value="warranty">Warranty Service</SelectItem>
                      <SelectItem value="emergency">
                        Emergency Call-out
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Service Date</Label>
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
                  <Label htmlFor="time-slot">Time Slot</Label>
                  <Select>
                    <SelectTrigger id="time-slot">
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">
                        Morning (8:00 - 12:00)
                      </SelectItem>
                      <SelectItem value="afternoon">
                        Afternoon (12:00 - 16:00)
                      </SelectItem>
                      <SelectItem value="evening">
                        Evening (16:00 - 19:00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="engineer">Assigned Engineer</Label>
                  <Select value={engineer} onValueChange={setEngineer}>
                    <SelectTrigger id="engineer">
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

                <div className="space-y-2">
                  <Label htmlFor="notes">Service Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Add any specific requirements or notes for this service..."
                  ></textarea>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Service Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="customer-notified" />
                  <Label htmlFor="customer-notified">
                    Customer notified of appointment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="parts-ordered" />
                  <Label htmlFor="parts-ordered">Required parts ordered</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="documentation-prepared" />
                  <Label htmlFor="documentation-prepared">
                    Service documentation prepared
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="warranty-checked" />
                  <Label htmlFor="warranty-checked">
                    Warranty status checked
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Service"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Requirements</CardTitle>
          <CardDescription>
            Special requirements and notes for servicing this system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
              <h3 className="font-bold text-lg mb-2">System Information</h3>
              <p className="mb-2">
                <span className="font-medium">Boiler Model:</span> TRIANCO
                GREENFLAME
              </p>
              <p className="mb-2">
                <span className="font-medium">System Type:</span> KWB EASYFIRE
              </p>
              <p className="mb-2">
                <span className="font-medium">Hopper Size:</span> 1.2 TONNE
                HOPPER
              </p>
            </div>

            <div className="p-4 border rounded-md">
              <h3 className="font-bold text-lg mb-2">Service Notes</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Customer prefers morning appointments due to work schedule
                </li>
                <li>
                  System has had ignitor replaced in previous service (Nov 2022)
                </li>
                <li>
                  Fuel store requires inspection - customer reported unusual
                  noise
                </li>
                <li>Access via side gate - code 1234</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Servicing;
