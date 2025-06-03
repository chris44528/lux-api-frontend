import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { getSiteDetail, startMeterTest, pollMeterTestStatus } from "../../services/api";
import { Job } from "../../services/jobService";

interface MeterTestResult {
  siteId: number;
  siteName: string;
  status: 'pending' | 'fetching' | 'testing' | 'success' | 'error';
  message?: string;
  reading?: number;
  signalLevel?: number;
  taskId?: string;
  lastReading?: string;
  lastReadingDate?: string;
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { toast } = useToast();

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      setIsCompleted(false);
      setTestResults([]);
    }
  }, [isOpen]);

  // Initialize test results when modal opens
  useEffect(() => {
    if (isOpen && selectedJobs.length > 0 && !hasInitialized) {
      // Don't reinitialize if we already have results for the same jobs
      if (testResults.length > 0 && testResults.some(r => r.status !== 'pending')) {
        setHasInitialized(true);
        return;
      }
      
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
          const siteObj = job.site as any;
          siteId = siteObj.site_id || 0;
          siteName = siteObj.site_name || `Site ID: ${siteObj.site_id}`;
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
      setHasInitialized(true);
    }
  }, [isOpen, selectedJobs, hasInitialized]);

  const runTests = async () => {
    setIsTesting(true);
    const results = [...testResults];
    const BATCH_SIZE = 10; // Process up to 10 meters concurrently
    const DELAY_BETWEEN_REQUESTS = 2000; // 2 second delay between starting each test

    // First, fetch all site details to get meter info
    console.log('Fetching site details for all selected sites...');
    
    // Update status to fetching for all sites
    results.forEach(r => r.status = 'fetching');
    setTestResults([...results]);

    // Fetch site details in batches
    const siteDataMap = new Map();
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      const fetchPromises = batch.map(async (result) => {
        try {
          const siteData = await getSiteDetail(result.siteId.toString());
          siteDataMap.set(result.siteId, siteData);
          
          // Extract last reading data
          if (siteData.readings && siteData.readings.length > 0) {
            const lastReading = siteData.readings[0]; // First reading in desc order
            const idx = results.findIndex(r => r.siteId === result.siteId);
            results[idx].lastReading = lastReading.meter_reading;
            results[idx].lastReadingDate = lastReading.date;
            setTestResults([...results]);
          }
          
          return { siteId: result.siteId, success: true };
        } catch (error) {
          console.error(`Failed to fetch site ${result.siteId}:`, error);
          return { siteId: result.siteId, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });
      
      await Promise.all(fetchPromises);
    }

    // Now start meter tests in batches with staggered delays
    const activeTests = new Map(); // Map of siteId to taskId
    
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      
      // Start tests with staggered delays
      const testPromises = batch.map(async (result, index) => {
        // Add delay before starting each test
        await new Promise(resolve => setTimeout(resolve, index * DELAY_BETWEEN_REQUESTS));
        
        const siteData = siteDataMap.get(result.siteId);
        if (!siteData) {
          results[results.findIndex(r => r.siteId === result.siteId)] = {
            ...result,
            status: 'error',
            message: 'Failed to fetch site details'
          };
          setTestResults([...results]);
          return;
        }

        // Extract meter info
        const meter = siteData.active_meter || (siteData.meters && siteData.meters[0]);
        const sim = siteData.sim || {};
        
        if (!meter || !sim.sim_ip) {
          results[results.findIndex(r => r.siteId === result.siteId)] = {
            ...result,
            status: 'error',
            message: !meter ? 'No meter found' : 'No SIM IP found'
          };
          setTestResults([...results]);
          return;
        }

        try {
          // Update status to testing
          const idx = results.findIndex(r => r.siteId === result.siteId);
          results[idx].status = 'testing';
          setTestResults([...results]);

          // Start the meter test
          const testResponse = await startMeterTest({
            ip: sim.sim_ip,
            model: meter.meter_model || '',
            password: meter.meter_password || '',
            site_id: result.siteId
          });

          activeTests.set(result.siteId, testResponse.task_id);
          results[idx].taskId = testResponse.task_id;
          setTestResults([...results]);
        } catch (error) {
          const idx = results.findIndex(r => r.siteId === result.siteId);
          results[idx] = {
            ...results[idx],
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to start test'
          };
          setTestResults([...results]);
        }
      });

      await Promise.all(testPromises);
    }

    // Poll all active tests concurrently
    const pollPromises = Array.from(activeTests.entries()).map(([siteId, taskId]) => {
      return new Promise<void>((resolve) => {
        pollMeterTestStatus(
          taskId,
          (status) => {
            const idx = results.findIndex(r => r.siteId === siteId);
            
            if (status.status === 'completed') {
              // Extract reading from OBIS data
              const obisData = status.result as any;
              const readingObj = obisData?.['1.0.1.8.0.255'];
              const signalObj = obisData?.['0.0.128.20.0.255'];
              
              results[idx] = {
                ...results[idx],
                status: 'success',
                message: 'Test completed successfully',
                reading: readingObj?.value ? Number(readingObj.value) : undefined,
                signalLevel: signalObj?.value || undefined
              };
              setTestResults([...results]);
              resolve();
            } else if (status.status === 'error' || status.status === 'failed') {
              results[idx] = {
                ...results[idx],
                status: 'error',
                message: status.error || 'Test failed'
              };
              setTestResults([...results]);
              resolve();
            }
            // Continue polling for pending/processing status
          },
          75, // 150 seconds total (75 * 2 seconds) to handle backend timeout
          2000 // 2 second intervals
        );
      });
    });

    // Wait for all polls to complete
    await Promise.all(pollPromises);
    
    setIsTesting(false);
    setIsCompleted(true);
    
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
      // Only call onComplete if tests were actually completed
      if (isCompleted) {
        onComplete();
      }
      onClose();
    }
  };

  const getStatusIcon = (status: MeterTestResult['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'fetching':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
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
      case 'fetching':
        return <Badge className="bg-yellow-100 text-yellow-800">Fetching...</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  const progress = testResults.length > 0 
    ? (testResults.filter(r => r.status === 'success' || r.status === 'error').length / testResults.length) * 100 
    : 0;
  
  const fetchingCount = testResults.filter(r => r.status === 'fetching').length;
  const testingCount = testResults.filter(r => r.status === 'testing').length;
  const completedCount = testResults.filter(r => r.status === 'success' || r.status === 'error').length;
  const successCount = testResults.filter(r => r.status === 'success').length;
  const failureCount = testResults.filter(r => r.status === 'error').length;
  const isComplete = completedCount === testResults.length && testResults.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
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
              <div className="space-y-1">
                {fetchingCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Fetching site details: {fetchingCount} sites...
                  </p>
                )}
                {testingCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Testing meters: {testingCount} active, {completedCount} completed
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Completion Summary */}
          {isComplete && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Successful: <strong>{successCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Failed: <strong>{failureCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span>Total: <strong>{testResults.length}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={`${result.siteId}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <p className="font-medium">{result.siteName}</p>
                        {result.lastReading && result.lastReadingDate && (
                          <p className="text-sm text-muted-foreground">
                            Last reading: {result.lastReading} ({result.lastReadingDate})
                          </p>
                        )}
                      </div>
                      {result.message && (
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' && result.reading !== undefined && (
                      <span className="text-sm text-muted-foreground">
                        Test: {result.reading} | Signal: {result.signalLevel}
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
              <Button onClick={() => {
                // Reset all results to pending for retry
                setTestResults(testResults.map(r => ({ ...r, status: 'pending' as const, message: undefined, reading: undefined, signalLevel: undefined })));
                setIsCompleted(false);
                runTests();
              }}>
                Retry All
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};