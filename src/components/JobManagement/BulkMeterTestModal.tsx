import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { testMeter } from "../../services/api";
import { Job } from "../../services/jobService";

interface MeterTestResult {
  siteId: number;
  siteName: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  message?: string;
  reading?: number;
  signalLevel?: number;
}

interface BulkMeterTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobs: Job[];
  onComplete: () => void;
}

export const BulkMeterTestModal: React.FC<BulkMeterTestModalProps> = ({
  isOpen,
  onClose,
  selectedJobs,
  onComplete
}) => {
  const [testResults, setTestResults] = useState<MeterTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const { toast } = useToast();

  // Initialize test results when modal opens
  useEffect(() => {
    if (isOpen && selectedJobs.length > 0) {
      const initialResults = selectedJobs.map(job => {
        let siteId = 0;
        let siteName = 'Unknown Site';
        
        // Check if site is a number (just the ID from backend)
        if (typeof job.site === 'number' && job.site > 0) {
          siteId = job.site;
          siteName = `Site ID: ${job.site}`;
        } 
        // Check if site is an object with site_id
        else if (job.site && typeof job.site === 'object' && 'site_id' in job.site) {
          siteId = job.site.site_id || 0;
          siteName = job.site.site_name || `Site ID: ${job.site.site_id}`;
        }
        // Fallback to site_id if directly on job
        else if (job.site_id) {
          siteId = job.site_id;
          siteName = `Site ID: ${job.site_id}`;
        }
        
        console.log('Job site data:', { job, site: job.site, siteId, siteName });
        
        return {
          siteId,
          siteName,
          status: 'pending' as const,
        };
      });
      setTestResults(initialResults);
      setCurrentTestIndex(0);
    }
  }, [isOpen, selectedJobs]);

  const runTests = async () => {
    setIsTesting(true);
    const results = [...testResults];

    for (let i = 0; i < results.length; i++) {
      setCurrentTestIndex(i);
      
      // Update status to testing
      results[i].status = 'testing';
      setTestResults([...results]);

      try {
        // Call the meter test API for each site
        const response = await testMeter(results[i].siteId.toString());
        
        // Update with success
        results[i] = {
          ...results[i],
          status: 'success',
          message: 'Test completed successfully',
          reading: response.reading,
          signalLevel: response.signal_level
        };
      } catch (error: any) {
        // Update with error
        results[i] = {
          ...results[i],
          status: 'error',
          message: error.response?.data?.message || 'Test failed'
        };
      }

      setTestResults([...results]);
      
      // Small delay between tests to avoid overwhelming the API
      if (i < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsTesting(false);
    
    // Show summary toast
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'error').length;
    
    toast({
      title: "Bulk Meter Test Complete",
      description: `${successCount} successful, ${failureCount} failed`
    });
  };

  const handleClose = () => {
    if (!isTesting) {
      onClose();
      onComplete();
    }
  };

  const getStatusIcon = (status: MeterTestResult['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: MeterTestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  const progress = testResults.length > 0 
    ? (testResults.filter(r => r.status !== 'pending').length / testResults.length) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Meter Test</DialogTitle>
          <DialogDescription>
            Testing {selectedJobs.length} meter{selectedJobs.length === 1 ? '' : 's'}. This may take a few minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {isTesting && (
              <p className="text-sm text-muted-foreground">
                Testing site {currentTestIndex + 1} of {testResults.length}...
              </p>
            )}
          </div>

          {/* Results List */}
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={`${result.siteId}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.siteName}</p>
                      {result.message && (
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' && result.reading !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        Reading: {result.reading} | Signal: {result.signalLevel}
                      </span>
                    )}
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          {!isTesting && testResults.every(r => r.status === 'pending') && (
            <Button onClick={runTests}>
              Start Testing
            </Button>
          )}
          {isTesting && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing in Progress...
            </Button>
          )}
          {!isTesting && testResults.some(r => r.status !== 'pending') && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={runTests}>
                Retry All
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};