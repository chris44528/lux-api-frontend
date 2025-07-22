import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Mail, MessageSquare, Phone, BarChart3 } from "lucide-react";
import { agedCasesService, AgedCaseTemplate } from '../../services/agedCasesService';
import AgedCaseTemplateDialog from './AgedCaseTemplateDialog';
import { useToast } from "@/hooks/use-toast";

const AgedCaseTemplateManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgedCaseTemplate | null>(null);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['agedCaseTemplates'],
    queryFn: () => agedCasesService.getTemplates(),
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => agedCasesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCaseTemplates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  // Toggle template active status
  const toggleTemplateActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      agedCasesService.updateTemplate(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agedCaseTemplates'] });
      toast({
        title: "Success",
        description: "Template status updated successfully",
      });
    },
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: AgedCaseTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleToggleActive = (template: AgedCaseTemplate) => {
    toggleTemplateActiveMutation.mutate({ id: template.id, active: !template.active });
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (filterTier !== 'all' && template.escalation_tier !== parseInt(filterTier)) return false;
    if (filterChannel !== 'all' && template.channel !== filterChannel) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && !template.active) return false;
      if (filterStatus === 'inactive' && template.active) return false;
    }
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp':
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'sms':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'whatsapp':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 2:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 3:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 4:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Communication Templates</h2>
            <p className="text-muted-foreground">Manage aged cases communication templates</p>
          </div>
          <Button onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="1">Tier 1</SelectItem>
              <SelectItem value="2">Tier 2</SelectItem>
              <SelectItem value="3">Tier 3</SelectItem>
              <SelectItem value="4">Tier 4</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge className={getTierColor(template.escalation_tier)}>
                        Tier {template.escalation_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getChannelColor(template.channel)}>
                        <span className="flex items-center gap-1">
                          {getChannelIcon(template.channel)}
                          {template.channel}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(template)}
                      >
                        {template.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Sent: {template.send_count}
                        </span>
                        {template.open_rate > 0 && (
                          <span className="text-muted-foreground">
                            • Open: {template.open_rate.toFixed(1)}%
                          </span>
                        )}
                        {template.response_rate > 0 && (
                          <span className="text-muted-foreground">
                            • Response: {template.response_rate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      {dialogOpen && (
        <AgedCaseTemplateDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          template={editingTemplate}
          onSuccess={() => {
            setDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['agedCaseTemplates'] });
          }}
        />
      )}
    </div>
  );
};

export default AgedCaseTemplateManager;