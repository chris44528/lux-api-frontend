import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Mail } from "lucide-react";

export default function TransferSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Transfer Form Submitted Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600">
              Your home owner transfer form has been submitted successfully.
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>We'll review your submission within 2-3 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>You'll receive a confirmation email shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Once approved, you'll receive your account login details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>You can then access your solar PV system information online</span>
              </li>
            </ul>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              If you have any questions, please contact us at:
            </p>
            <a 
              href="mailto:support@ashadegreener.co.uk" 
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Mail className="h-4 w-4" />
              support@ashadegreener.co.uk
            </a>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}