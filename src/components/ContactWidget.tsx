/**
 * Contact Widget - Compact expandable contact form for the Auth page
 * Shows a small "Contact Us" button that expands into a form
 */

import React, { useState } from 'react';
import { Send, Mail, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CONTACT_EMAIL = 'theslds.mail@gmail.com';

const ContactWidget: React.FC = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback' as any).insert({
        name: name.trim(),
        email: email.trim(),
        subject: 'Contact Form Submission',
        message: message.trim(),
        type: 'contact',
      } as any);

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: 'Thank you for reaching out. We will get back to you soon.',
      });
      setName('');
      setEmail('');
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Compact button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full',
            'bg-secondary text-secondary-foreground',
            'border border-border shadow-lg',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-all duration-200 hover:scale-105',
            'text-sm font-medium'
          )}
        >
          <MessageCircle size={16} />
          Contact Us
        </button>
      )}

      {/* Expanded form */}
      {isOpen && (
        <div className="w-[340px] max-w-[calc(100vw-3rem)] bg-card border border-border rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Contact Us</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div>
              <Label htmlFor="cw-name" className="text-xs">Name</Label>
              <Input
                id="cw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-9 text-sm"
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label htmlFor="cw-email" className="text-xs">Email</Label>
              <Input
                id="cw-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-9 text-sm"
                maxLength={255}
                required
              />
            </div>
            <div>
              <Label htmlFor="cw-message" className="text-xs">Message</Label>
              <Textarea
                id="cw-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                rows={3}
                className="text-sm"
                maxLength={2000}
                required
              />
            </div>
            <Button type="submit" size="sm" className="w-full gap-2" disabled={isSubmitting}>
              <Send size={14} />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContactWidget;
