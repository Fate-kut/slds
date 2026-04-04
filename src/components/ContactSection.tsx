/**
 * Contact Form Section for Landing/Auth page
 * Simple contact form with name, email, and message fields
 */

import React, { useState } from 'react';
import { Send, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CONTACT_EMAIL = 'theslds.mail@gmail.com';

const ContactSection: React.FC = () => {
  const { toast } = useToast();
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
    <section className="py-12 px-4">
      <div className="max-w-lg mx-auto text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Contact Us</h2>
        <p className="text-muted-foreground">
          Have questions? Send us a message or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>
        </p>
      </div>
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={255}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                rows={4}
                maxLength={2000}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              <Send size={16} />
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail size={14} /> {CONTACT_EMAIL}
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ContactSection;
