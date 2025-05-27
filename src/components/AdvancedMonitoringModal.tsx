import React, { useState, useEffect, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Progress from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  History,
  Layers,
  RefreshCw,
  Settings,
  Signal,
  Wifi,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/services/api";

// Modal wrapper (simple overlay)
type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};
const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded shadow-lg p-4 w-full max-w-6xl relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

const COLORS = ["#4ade80", "#f87171"];

type AdvancedMonitoringModalProps = {
  siteId: string | number;
  open: boolean;
  onClose: () => void;
};

type MonitoringLog = {
  timestamp: string;
  event_type: string;
  status: string;
  response_time?: number;
  signal_strength?: number;
  meter_reading?: string;
};

type MonitoringAlert = {
  timestamp: string;
  level: string;
  message: string;
  is_resolved: boolean;
};

export default function AdvancedMonitoringModal({ siteId, open, onClose }: AdvancedMonitoringModalProps) {
  // State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [successChain, setSuccessChain] = useState(0);
  const [lastPing, setLastPing] = useState("Never");
  const [signalStrength, setSignalStrength] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [lastReading, setLastReading] = useState<{ value: string; time: string }>({ value: "No reading available", time: "Never" });
  const [pingHistory, setPingHistory] = useState<Array<{ time: string; status: string; responseTime?: number; signalStrength?: number }>>([]);
  const [readingHistory, setReadingHistory] = useState<Array<{ time: string; reading?: string; status: string }>>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<Array<{ time: string; responseTime?: number; signalStrength?: number }>>([]);
  const [pieData, setPieData] = useState<Array<{ name: string; value: number }>>([]);
  const [pingInterval, setPingInterval] = useState(5);
  const [readingThreshold, setReadingThreshold] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("log");

  // Fetch monitoring config/status
  useEffect(() => {
    if (!open) return;
    setError(null);
    setIsLoading(true);
    Promise.all([
      api.get(`/site/${siteId}/monitoring/`).then(r => r.data),
      api.get(`/site/${siteId}/monitoring/logs/`).then(r => r.data),
      api.get(`/site/${siteId}/monitoring/alerts/`).then(r => r.data),
    ])
      .then(([monitoring, logs, alerts]: [any, MonitoringLog[], MonitoringAlert[]]) => {
        setIsMonitoring(monitoring.is_enabled);
        setPingInterval(monitoring.monitoring_interval);
        setSuccessChain(monitoring.consecutive_successful_pings || 0);
        setLastPing(monitoring.last_ping ? new Date(monitoring.last_ping).toLocaleTimeString() : "Never");
        setReadingThreshold(5); // You may want to fetch this from backend if available
        // Parse logs
        const pings = logs.filter((l: MonitoringLog) => l.event_type === "ping");
        const readings = logs.filter((l: MonitoringLog) => l.event_type === "reading");
        setPingHistory(pings.map((l: MonitoringLog) => ({
          time: new Date(l.timestamp).toLocaleTimeString(),
          status: l.status,
          responseTime: l.response_time,
          signalStrength: l.signal_strength,
        })));
        setReadingHistory(readings.map((l: MonitoringLog) => ({
          time: new Date(l.timestamp).toLocaleTimeString(),
          reading: l.meter_reading,
          status: l.status,
        })));
        // Time series for chart
        setTimeSeriesData(pings.slice(0, 20).reverse().map((l: MonitoringLog) => ({
          time: new Date(l.timestamp).toLocaleTimeString(),
          responseTime: l.response_time,
          signalStrength: l.signal_strength,
        })));
        // Pie data
        const successCount = pings.filter((l: MonitoringLog) => l.status === "success").length;
        const failCount = pings.filter((l: MonitoringLog) => l.status !== "success").length;
        setPieData([
          { name: "Success", value: successCount },
          { name: "Failed", value: failCount },
        ]);
        // Last reading
        if (readings.length > 0) {
          setLastReading({
            value: readings[0].meter_reading || "No reading available",
            time: new Date(readings[0].timestamp).toLocaleTimeString(),
          });
        }
        setAlerts(alerts);
      })
      .catch(() => setError("Failed to load monitoring data"))
      .finally(() => setIsLoading(false));
  }, [siteId, open]);

  // Enable/disable monitoring
  const handleToggleMonitoring = (checked: boolean) => {
    setIsLoading(true);
    api.post(`/site/${siteId}/monitoring/enable/`, {
      enable: checked,
      interval: pingInterval
    })
      .then(response => setIsMonitoring(response.data.is_enabled))
      .catch(() => setError("Failed to update monitoring status"))
      .finally(() => setIsLoading(false));
  };

  // Change ping interval
  const handlePingIntervalChange = (val: number) => {
    setPingInterval(val);
    setIsLoading(true);
    api.post(`/site/${siteId}/monitoring/enable/`, {
      enable: isMonitoring,
      interval: val
    })
      .then(response => response.data)
      .catch(() => setError("Failed to update interval"))
      .finally(() => setIsLoading(false));
  };

  // Force reading
  const forceReading = () => {
    setIsLoading(true);
    api.post(`/site/${siteId}/monitoring/force-reading/`)
      .then(() => {
        // Refetch logs to update reading history
        return api.get(`/site/${siteId}/monitoring/logs/`);
      })
      .then((response) => {
        const logs: MonitoringLog[] = response.data;
        const readings = logs.filter((l: MonitoringLog) => l.event_type === "reading");
        setReadingHistory(readings.map((l: MonitoringLog) => ({
          time: new Date(l.timestamp).toLocaleTimeString(),
          reading: l.meter_reading,
          status: l.status,
        })));
        if (readings.length > 0) {
          setLastReading({
            value: readings[0].meter_reading || "No reading available",
            time: new Date(readings[0].timestamp).toLocaleTimeString(),
          });
        }
      })
      .catch(() => setError("Failed to force reading"))
      .finally(() => setIsLoading(false));
  };

  // Diagnostics
  const runDiagnostics = () => {
    setIsLoading(true);
    api.post(`/site/${siteId}/monitoring/diagnostics/`)
      .then(() => alert("Diagnostics triggered"))
      .catch(() => setError("Failed to run diagnostics"))
      .finally(() => setIsLoading(false));
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-green-500">Success</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const getSuccessChainDisplay = () => {
    const circles = [];
    for (let i = 0; i < readingThreshold; i++) {
      circles.push(
        <div key={i} className={`w-4 h-4 rounded-full ${i < successChain ? "bg-green-500" : "bg-gray-200"}`} />,
      );
    }
    return (
      <div className="flex space-x-2 items-center">
        {circles}
        <span className="text-sm text-gray-500 ml-2">
          {successChain}/{readingThreshold}
        </span>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Card className="w-full max-w-6xl mx-auto shadow-lg">
        <CardHeader className="bg-emerald-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6" />
              <CardTitle>Advanced Monitoring - {siteId}</CardTitle>
            </div>
            <Button variant="outline" className="text-white border-white hover:bg-emerald-700">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
          <CardDescription className="text-emerald-100">Real-time meter monitoring and diagnostics</CardDescription>
        </CardHeader>

        <CardContent className="p-6 grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Monitoring Control Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-emerald-500" />
                  Monitoring Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="monitoring-toggle">Enable Monitoring</Label>
                    <div className="text-sm text-muted-foreground">Ping every {pingInterval} seconds</div>
                  </div>
                  <Switch id="monitoring-toggle" checked={isMonitoring} onCheckedChange={handleToggleMonitoring} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <Badge className={isMonitoring ? "bg-green-500" : "bg-gray-500"}>
                      {isMonitoring ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Last Ping:</span>
                    <span className="font-medium">{lastPing}</span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Success Chain:</span>
                      <span className="font-medium">
                        {successChain}/{readingThreshold}
                      </span>
                    </div>
                    {getSuccessChainDisplay()}
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Ping Interval:</span>
                      <span>{pingInterval}s</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={pingInterval}
                      onChange={(e) => handlePingIntervalChange(Number.parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Reading Threshold:</span>
                      <span>{readingThreshold} pings</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      value={readingThreshold}
                      onChange={(e) => setReadingThreshold(Number.parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Metrics Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-emerald-500" />
                  Current Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Signal className="h-4 w-4 mr-1 text-emerald-500" />
                      Signal Strength
                    </span>
                    <span className="font-medium">{signalStrength > 0 ? `${signalStrength}%` : "--"}</span>
                  </div>
                  <Progress value={signalStrength} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Weak</span>
                    <span>Strong</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-emerald-500" />
                      Response Time
                    </span>
                    <span className="font-medium">{responseTime > 0 ? `${responseTime}ms` : "--"}</span>
                  </div>
                  <Progress value={responseTime > 0 ? 100 - (responseTime / 150) * 100 : 0} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Wifi className="h-4 w-4 mr-1 text-emerald-500" />
                      Connection Quality
                    </span>
                    <span className="font-medium">
                      {signalStrength > 0
                        ? signalStrength > 75
                          ? "Excellent"
                          : signalStrength > 60
                            ? "Good"
                            : signalStrength > 40
                              ? "Fair"
                              : "Poor"
                        : "--"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        signalStrength > 75
                          ? "bg-green-500"
                          : signalStrength > 60
                            ? "bg-emerald-400"
                            : signalStrength > 40
                              ? "bg-yellow-400"
                              : "bg-red-500"
                      }`}
                      style={{ width: `${signalStrength}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Reading Panel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-emerald-500" />
                  Latest Reading
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Reading:</div>
                    <div className="text-2xl font-bold">{lastReading.value}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Time:</div>
                    <div className="text-lg">{lastReading.time}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-gray-500">Reading History:</div>
                    <div className="text-sm">
                      {readingHistory.length > 0 ? (
                        <div className="space-y-1">
                          {readingHistory.slice(0, 3).map((reading, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{reading.time}</span>
                              <span className="font-medium">{reading.reading}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>No history available</span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={forceReading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Reading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Reading
                    </>
                  )}
                </Button>

                <Button variant="outline" className="w-full">
                  <History className="h-4 w-4 mr-2" />
                  View Full History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid grid-cols-4 md:w-auto w-full">
              <TabsTrigger value="log">Monitoring Log</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            </TabsList>

            <TabsContent value="log" className="border rounded-md mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Signal Strength</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pingHistory.map((ping, index) => (
                    <TableRow key={index}>
                      <TableCell>{ping.time}</TableCell>
                      <TableCell>Ping</TableCell>
                      <TableCell>{getStatusBadge(ping.status)}</TableCell>
                      <TableCell>{ping.responseTime}ms</TableCell>
                      <TableCell>{ping.signalStrength}%</TableCell>
                      <TableCell>
                        {ping.status === "success" ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Timeout
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Log
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="border rounded-md mt-2 p-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                <h3 className="text-lg font-medium">Recent Alerts</h3>
              </div>

              {alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <Card key={index}>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-2" />
                            {alert.level}
                          </CardTitle>
                          <span className="text-sm text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm">
                          {alert.message}
                        </p>
                      </CardContent>
                      <CardFooter className="py-2">
                        <Button variant="outline" size="sm">
                          Troubleshoot
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No alerts at this time</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="border rounded-md mt-2 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Response Time & Signal Strength</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="responseTime"
                          stroke="#0ea5e9"
                          name="Response Time (ms)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="signalStrength"
                          stroke="#10b981"
                          name="Signal Strength (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Connection Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="diagnostics" className="border rounded-md mt-2 p-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Connection Diagnostics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <Wifi className="h-4 w-4 mr-2 text-emerald-500" />
                            Network Status
                          </span>
                          <Badge className="bg-green-500">Connected</Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <Signal className="h-4 w-4 mr-2 text-emerald-500" />
                            Signal Quality
                          </span>
                          <span>{signalStrength > 0 ? `${signalStrength}%` : "--"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                            Average Response
                          </span>
                          <span>
                            {pingHistory.length > 0
                              ? `${Math.round(pingHistory.reduce((acc, ping) => acc + (ping.responseTime || 0), 0) / pingHistory.length)}ms`
                              : "--"}
                          </span>
                        </div>

                        <Button className="w-full" onClick={runDiagnostics}>Run Network Test</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Meter Diagnostics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Meter ID</span>
                          <span className="font-medium">{siteId}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Firmware Version</span>
                          <span>v3.2.1</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span>Last Calibration</span>
                          <span>2023-04-15</span>
                        </div>

                        <Button className="w-full" onClick={runDiagnostics}>Run Meter Diagnostics</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Troubleshooting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline">Reset Connection</Button>
                        <Button variant="outline">Recalibrate Meter</Button>
                        <Button variant="outline">Check Firmware</Button>
                        <Button variant="outline">Test Signal</Button>
                      </div>

                      <div className="pt-2">
                        <Button variant="destructive" className="w-full">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between bg-gray-50 border-t">
          <div className="text-sm text-gray-500">
            {isMonitoring ? (
              <span className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Monitoring active
              </span>
            ) : (
              <span className="flex items-center">
                <span className="h-2 w-2 bg-gray-400 rounded-full mr-2" />
                Monitoring inactive
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
        {error && <div className="text-red-500 mt-2 px-6">{error}</div>}
        {isLoading && <div className="text-gray-500 mt-2 px-6">Loading...</div>}
      </Card>
    </Modal>
  );
} 