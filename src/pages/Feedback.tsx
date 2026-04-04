/**
 * Dedicated Feedback Page
 * Full feedback form with FAQ accessible to all users at /feedback
 */

import React, { useState } from 'react';
import { Send, MessageCircle, Bug, Lightbulb, HelpCircle, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const CONTACT_EMAIL = 'theslds.mail@gmail.com';

const FAQ_ITEMS = [
  { q: 'How do I reset my password?', a: 'Go to the login page and click "Forgot Password" to receive a reset link via email.' },
  { q: 'How do I access my locker?', a: 'Navigate to your student dashboard — your assigned locker and its status will be displayed.' },
  { q: 'How do I submit an assignment?', a: 'Go to the Assignments tab in your dashboard, find the assignment, and click Submit.' },
  { q: 'Can I take exams offline?', a: 'Some exams support offline mode. Check with your teacher for availability.' },
  { q: 'Who do I contact for technical issues?', a: `Email us at ${CONTACT_EMAIL} or use the feedback form on this page.` },
];

const Feedback: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback' as any).insert({
        user_id: profile?.id || null,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        type,
      } as any);

      if (error) throw error;

      toast({
        title: 'Feedback submitted!',
        description: 'Thank you! We will get back to you soon.',
      });
      setSubject('');
      setMessage('');
      if (!profile) { setName(''); setEmail(''); }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit. Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeIcons = {
    feedback: <MessageCircle size={16} />,
    bug: <Bug size={16} />,
    feature: <Lightbulb size={16} />,
    contact: <Mail size={16} />,
  };

  return (
    <>
      <SEOHead
        title="Feedback & Support - SLDS"
        description="Send us feedback, report bugs, or request features for the Smart Locker Desk System."
        noIndex
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Feedback & Support</h1>
          <p className="text-muted-foreground mb-8">
            Have a question, found a bug, or want to suggest a feature? We'd love to hear from you.
            You can also email us directly at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline">{CONTACT_EMAIL}</a>.
          </p>

          <div className="grid gap-8 md:grid-cols-[1fr,1fr]">
            {/* Feedback Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send size={18} /> Send Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fb-name">Name</Label>
                      <Input
                        id="fb-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        maxLength={100}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fb-email">Email</Label>
                      <Input
                        id="fb-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fb-type">Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="fb-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feedback">
                          <span className="flex items-center gap-2">{typeIcons.feedback} General Feedback</span>
                        </SelectItem>
                        <SelectItem value="bug">
                          <span className="flex items-center gap-2">{typeIcons.bug} Bug Report</span>
                        </SelectItem>
                        <SelectItem value="feature">
                          <span className="flex items-center gap-2">{typeIcons.feature} Feature Request</span>
                        </SelectItem>
                        <SelectItem value="contact">
                          <span className="flex items-center gap-2">{typeIcons.contact} Contact Us</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fb-subject">Subject</Label>
                    <Input
                      id="fb-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      maxLength={200}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fb-message">Message</Label>
                    <Textarea
                      id="fb-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe in detail..."
                      rows={5}
                      maxLength={2000}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                    <Send size={16} />
                    {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle size={18} /> Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {FAQ_ITEMS.map((item, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Mail size={16} /> Direct Contact
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Prefer email? Reach us directly:
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <Mail size={14} /> {CONTACT_EMAIL}
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Feedback;
