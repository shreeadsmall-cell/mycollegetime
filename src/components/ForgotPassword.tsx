import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <CheckCircle size={48} className="text-[hsl(var(--current))] mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground mb-6">
          We've sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
        </p>
        <Button variant="outline" onClick={onBack}>Back to Sign In</Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-md mx-auto w-full">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <ArrowLeft size={14} /> Back to Sign In
      </button>

      <h2 className="text-xl font-bold text-foreground mb-1">Forgot Password</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Link"}
        </Button>
      </form>
    </div>
  );
}
