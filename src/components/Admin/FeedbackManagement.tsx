/**
 * Admin Feedback Management
 * View, filter, and manage all feedback submissions
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Search, Eye, CheckCircle2, Clock, Archive, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  created_at: string;
  user_id: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  reviewed: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  resolved: 'bg-green-500/10 text-green-700 border-green-500/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

const typeLabels: Record<string, string> = {
  feedback: 'Feedback',
  bug: 'Bug Report',
  feature: 'Feature Request',
  contact: 'Contact',
};

const FeedbackManagement: React.FC = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data as unknown as FeedbackItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from('feedback' as any)
      .update({ status: newStatus } as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${newStatus}`);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      if (selected?.id === id) {
        setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
    setUpdating(false);
  };

  const filtered = items.filter(item => {
    const matchesSearch = search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const counts = {
    total: items.length,
    new: items.filter(i => i.status === 'new').length,
    reviewed: items.filter(i => i.status === 'reviewed').length,
    resolved: items.filter(i => i.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-blue-600">{counts.new}</p>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-amber-600">{counts.reviewed}</p>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-600">{counts.resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p>No feedback found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{item.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{typeLabels[item.type] || item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[item.status] || ''}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Eye size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={18} />
              Feedback Details
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">From</p>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <a href={`mailto:${selected.email}`} className="font-medium text-primary flex items-center gap-1">
                    <Mail size={12} /> {selected.email}
                  </a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <Badge variant="outline">{typeLabels[selected.type] || selected.type}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p>{format(new Date(selected.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">Subject</p>
                <p className="font-medium">{selected.subject}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">Message</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{selected.message}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={updating || selected.status === 'reviewed'}
                  onClick={() => updateStatus(selected.id, 'reviewed')}
                >
                  <Clock size={14} /> Mark Reviewed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={updating || selected.status === 'resolved'}
                  onClick={() => updateStatus(selected.id, 'resolved')}
                >
                  <CheckCircle2 size={14} /> Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={updating || selected.status === 'archived'}
                  onClick={() => updateStatus(selected.id, 'archived')}
                >
                  <Archive size={14} /> Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackManagement;
