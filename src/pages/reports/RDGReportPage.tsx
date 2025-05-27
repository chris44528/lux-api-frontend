import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getFcoList, generateRDGReport } from '../../services/api';

const RDGReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    fco: [] as string[],
    low_riso: false,
    shading: false,
    trina_project: false,
    loan_num: ''
  });

  const [fcoList, setFcoList] = useState<string[]>([]);
  const [fcoError, setFcoError] = useState<string | null>(null);

  useEffect(() => {
    fetchFcoList();
  }, []);

  const fetchFcoList = async () => {
    try {
      setFcoError(null);
      const response = await getFcoList();
      setFcoList(response.fcos);
    } catch (err) {
      setFcoError('Failed to load FCO list');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await generateRDGReport(formData);
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFcoChange = (value: string) => {
    setFormData(prev => {
      // If already selected, remove it
      if (prev.fco.includes(value)) {
        return {
          ...prev,
          fco: prev.fco.filter(v => v !== value)
        };
      }
      // Otherwise add it
      return {
        ...prev,
        fco: [...prev.fco, value]
      };
    });
  };

  const toggleAllFcos = () => {
    setFormData(prev => ({
      ...prev,
      fco: prev.fco.length === fcoList.length ? [] : [...fcoList]
    }));
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-gray-100">RDG Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Generate RDG performance reports</p>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Generate RDG Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_range" className="text-sm font-medium dark:text-gray-300">
                  Date Range
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium dark:text-gray-300">
                  FCO Numbers
                </Label>
                <Select>
                  <SelectTrigger className="w-full dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    <SelectValue placeholder={
                      formData.fco.length === 0
                        ? "Select FCOs"
                        : `${formData.fco.length} FCO${formData.fco.length === 1 ? '' : 's'} selected`
                    } />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <div className="p-2 border-b dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={toggleAllFcos}
                      >
                        {formData.fco.length === fcoList.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    {fcoList.map((fco) => (
                      <SelectItem
                        key={fco}
                        value={fco}
                        onSelect={() => handleFcoChange(fco)}
                        className={formData.fco.includes(fco) ? "bg-primary/10 dark:bg-primary/20" : ""}
                      >
                        {fco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fcoError && (
                  <p className="text-sm text-destructive">{fcoError}</p>
                )}
                {formData.fco.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.fco.map((fco) => (
                      <div key={fco} className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                        {fco}
                        <button
                          type="button"
                          onClick={() => handleFcoChange(fco)}
                          className="hover:text-destructive dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan_num" className="text-sm font-medium dark:text-gray-300">
                  Loan Number
                </Label>
                <Input
                  id="loan_num"
                  name="loan_num"
                  value={formData.loan_num}
                  onChange={handleInputChange}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="low_riso"
                  checked={formData.low_riso}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('low_riso', checked === true)
                  }
                  className="dark:border-gray-600"
                />
                <Label htmlFor="low_riso" className="dark:text-gray-300">
                  Low RISO
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shading"
                  checked={formData.shading}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('shading', checked === true)
                  }
                  className="dark:border-gray-600"
                />
                <Label htmlFor="shading" className="dark:text-gray-300">
                  Shading
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trina_project"
                  checked={formData.trina_project}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('trina_project', checked === true)
                  }
                  className="dark:border-gray-600"
                />
                <Label htmlFor="trina_project" className="dark:text-gray-300">
                  Trina Project
                </Label>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md">
                Report generation started. You will be notified when it's ready.
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RDGReportPage; 