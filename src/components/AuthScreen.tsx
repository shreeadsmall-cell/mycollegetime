import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ForgotPassword } from "@/components/ForgotPassword";
import { BookOpen, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (mode === "forgot") {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground px-4 pt-12 pb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={22} />
              <span className="font-bold text-lg tracking-tight">CollegeTime</span>
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-2xl font-bold leading-tight mt-2">Reset Password</h1>
        </div>
        <ForgotPassword onBack={() => setMode("login")} />
      </div>
    );
  }

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email to confirm your account, then log in.");
        setMode("login");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={22} />
            <span className="font-bold text-lg tracking-tight">CollegeTime</span>
          </div>
          <ThemeToggle />
        </div>
        <h1 className="text-2xl font-bold leading-tight mt-2">
          {mode === "login" ? "Welcome back 👋" : "Create account"}
        </h1>
        <p className="text-sm opacity-75 mt-1">
          {mode === "login"
            ? "Sign in to sync your timetable across devices"
            : "Sign up to save your timetable to the cloud"}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-8 max-w-md mx-auto w-full">
        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Password</label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPw ? "text" : "password"}
                placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-[hsl(var(--current))] bg-[hsl(var(--current-bg))] border border-[hsl(var(--current-border))] rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <Button type="submit" className="w-full h-12 font-semibold text-base" disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
              className="text-primary font-semibold"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-muted/50 border border-border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Sign in to sync your timetable across all your devices. Your data is securely stored in the cloud.
          </p>
        </div>
      </div>
    </div>
  );
}
