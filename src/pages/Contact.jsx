import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: "info@scolia180league.com",
      subject: `Kontaktanfrage: ${form.subject}`,
      body: `Name: ${form.name}\nE-Mail: ${form.email}\n\nNachricht:\n${form.message}`,
    });
    setSending(false);
    setSent(true);
    toast.success("Nachricht gesendet!");
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Nachricht gesendet!</h2>
          <p className="text-gray-500 text-sm">Wir melden uns so schnell wie möglich bei dir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Kontakt</h1>
            <p className="text-gray-500 text-sm mt-0.5">Schreib uns eine Nachricht</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600 focus:ring-red-600/20"
                placeholder="Dein Name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">E-Mail</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600 focus:ring-red-600/20"
                placeholder="deine@email.de"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Betreff</Label>
            <Input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600 focus:ring-red-600/20"
              placeholder="Worum geht es?"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Nachricht</Label>
            <Textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600 focus:ring-red-600/20 resize-none"
              placeholder="Deine Nachricht..."
            />
          </div>
          <Button
            type="submit"
            disabled={sending}
            className="w-full bg-red-600 hover:bg-red-500 text-white border-0 h-11 rounded-xl font-semibold"
          >
            {sending ? "Sende..." : <>Nachricht senden <Send className="w-4 h-4 ml-2" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}