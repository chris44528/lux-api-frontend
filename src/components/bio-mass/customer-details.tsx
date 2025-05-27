import React, { useState, useEffect } from "react";
import { bioSiteService, boilerService } from "../../services/bioApiService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface CustomerDetailsProps {
  customerId?: string;
}

// Define interfaces for API responses
interface BioSite {
  id: number;
  reference?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  cro?: string;
  important_notes?: string;
  customer_type?: string;
  status?: string;
}

interface Boiler {
  id: number;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  system_type?: string;
  hopper_size?: string;
  current_fuel_type?: string;
  install_date?: string;
  completion_date?: string;
  lease_end_date?: string;
  draw_down_investor?: string;
  custodian_participant?: string;
  mcs_number?: string;
  rhi_accreditation_no?: string;
  rhi_member_no?: string;
  bsl_authorization_numbers?: string;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId }) => {
  const [customer, setCustomer] = useState<BioSite | null>(null);
  const [boiler, setBoiler] = useState<Boiler | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch customer details
        const customerData = await bioSiteService.getSiteById(customerId);
        setCustomer(customerData);

        // Fetch boiler details
        if (
          customerData &&
          customerData.boilers &&
          customerData.boilers.length > 0
        ) {
          const boilerData = await boilerService.getBoilerById(
            customerData.boilers[0].id
          );
          setBoiler(boilerData);
        }

        setNotes(customerData?.important_notes || "");
        setLoading(false);
      } catch (err) {
        setError("Failed to load customer details");
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <p>Loading customer details...</p>
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

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-20">
        <p>No customer data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>
                View and edit customer information
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Edit</Button>
              <Button>Save Changes</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" defaultValue={customer.reference || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select defaultValue={customer.title || ""}>
                  <SelectTrigger id="title">
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Miss">Miss</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  defaultValue={customer.first_name || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue={customer.last_name || ""} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input id="address1" defaultValue={customer.address1 || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input id="address2" defaultValue={customer.address2 || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address3">Address Line 3</Label>
                <Input id="address3" defaultValue={customer.address3 || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" defaultValue={customer.city || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" defaultValue={customer.postcode || ""} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue={customer.phone || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" defaultValue={customer.mobile || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={customer.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cro">Customer Relations Officer</Label>
                <Input id="cro" defaultValue={customer.cro || ""} />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="boilerManufacturer">Boiler Manufacturer</Label>
                <Input
                  id="boilerManufacturer"
                  defaultValue={boiler?.manufacturer || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boilerSerialNumber">Boiler Serial Number</Label>
                <Input
                  id="boilerSerialNumber"
                  defaultValue={boiler?.serial_number || ""}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hopperSize">Hopper Size</Label>
                <Input
                  id="hopperSize"
                  defaultValue={boiler?.hopper_size || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installDate">Install Date</Label>
                <Input
                  id="installDate"
                  defaultValue={boiler?.install_date || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionDate">Completion Date</Label>
                <Input
                  id="completionDate"
                  defaultValue={boiler?.completion_date || ""}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaseEndDate">Lease End Date</Label>
                <Input
                  id="leaseEndDate"
                  defaultValue={boiler?.lease_end_date || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawDownInvestor">Draw Down Investor</Label>
                <Input
                  id="drawDownInvestor"
                  defaultValue={boiler?.draw_down_investor || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custodianParticipant">
                  Custodian Participant
                </Label>
                <Input
                  id="custodianParticipant"
                  defaultValue={boiler?.custodian_participant || ""}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Boiler and system details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">System Type:</span>
                <span>{boiler?.system_type || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Current Fuel Type:</span>
                <span>{boiler?.current_fuel_type || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">MCS Number:</span>
                <span>{boiler?.mcs_number || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">RHI Accreditation No:</span>
                <span>{boiler?.rhi_accreditation_no || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">RHI Member No:</span>
                <span>{boiler?.rhi_member_no || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">BSL Authorization Numbers:</span>
                <span>{boiler?.bsl_authorization_numbers || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
            <CardDescription>Critical customer information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md bg-red-50 border-red-200 text-red-800">
              <h3 className="font-bold text-lg mb-2">IMPORTANT NOTE</h3>
              <p className="mb-2">
                {customer.important_notes || "No important notes"}
              </p>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Add important notes about this customer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    await bioSiteService.updateSite(customerId || "", {
                      ...customer,
                      important_notes: notes,
                    });
                    alert("Notes saved successfully");
                  } catch (err) {
                    alert("Failed to save notes");
                  }
                }}
              >
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDetails;
