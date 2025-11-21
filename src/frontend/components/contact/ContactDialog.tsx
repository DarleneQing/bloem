"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { sendContactEmail } from "@/features/contact/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Send email via server action
      const result = await sendContactEmail(formData);

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: result.message || "Your message has been sent successfully!",
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          subject: "",
          message: "",
        });

        // Close dialog after showing success message
        setTimeout(() => {
          onOpenChange(false);
          setSubmitStatus({ type: null, message: "" });
        }, 2000);
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black text-primary">
            Contact Us
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            We are available for questions, feedback, or collaboration
            opportunities. Let us know how we can help!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="firstName"
                className="block mb-2"
              >
                First Name
              </Label>
              <Input
                type="text"
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="px-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="First Name"
              />
            </div>
            <div>
              <Label
                htmlFor="lastName"
                className="block mb-2"
              >
                Last Name
              </Label>
              <Input
                type="text"
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="px-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Last Name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="block mb-2">
              Email
            </Label>
            <Input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="px-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Email"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="block mb-2">
              Subject
            </Label>
            <Input
              type="text"
              id="subject"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="px-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Subject"
            />
          </div>

          <div>
            <Label htmlFor="message" className="block mb-2">
              Message
            </Label>
            <Textarea
              id="message"
              required
              rows={4}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="px-4 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Type your message here."
            />
          </div>

          {/* Status Messages */}
          {submitStatus.type && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                submitStatus.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {submitStatus.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  submitStatus.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {submitStatus.message}
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white hover:bg-primary/90 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="mr-2 h-5 w-5" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Contact Details</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Email:</span>{" "}
              <a
                href="mailto:hello@letsbloem.com"
                className="text-primary hover:underline"
              >
                hello@letsbloem.com
              </a>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

