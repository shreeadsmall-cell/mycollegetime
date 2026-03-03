import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function FloatingAdminButton() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin(user?.id);
  const navigate = useNavigate();

  if (!isAdmin) return null;

  return (
    <button
      onClick={() => navigate("/admin")}
      className="fixed bottom-28 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 font-semibold text-sm"
    >
      <Shield size={18} />
      Admin Panel
    </button>
  );
}
