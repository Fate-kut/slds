/**
 * In-App Feedback Widget
 * Floating button that opens a modal for logged-in users to submit feedback
 */

import React, { useState } from 'react';
import { MessageSquarePlus, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CONTACT_EMAIL = 'theslds.mail@gmail.com';

const FeedbackWidget: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  if (!profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback' as any).insert({
        user_id: profile.id,
        name: profile.name,
        email: CONTACT_EMAIL,
        subject: subject.trim(),
        message: message.trim(),
        type,
      } as any);

      if (error) throw error;

      toast({
        title: 'Feedback submitted!',
        description: 'Thank you for your feedback. We will review it shortly.',
      });
      setSubject('');
      setMessage('');
      setType('feedback');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'flex items-center justify-center',
          'hover:scale-105 transition-transform',
          isOpen && 'hidden'
        )}
        aria-label="Send Feedback"
      >
        <MessageSquarePlus size={24} />
      </button>

      {/* Feedback modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Send Feedback</h3>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <Label htmlFor="fb-type" className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="fb-type" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fb-subject" className="text-xs">Subject</Label>
              <Input
                id="fb-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief subject"
                className="h-9"
                maxLength={200}
                required
              />
            </div>
            <div>
              <Label htmlFor="fb-message" className="text-xs">Message</Label>
              <Textarea
                id="fb-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more..."
                rows={3}
                maxLength={2000}
                required
              />
            </div>
            <Button type="submit" size="sm" className="w-full gap-2" disabled={isSubmitting}>
              <Send size={14} />
              {isSubmitting ? 'Sending...' : 'Submit'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
