import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Pages that don't require subscription check
  const exemptPaths = ["/escolher-plano", "/assinatura", "/admin"];

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        // Check if user is super admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "super_admin")
          .maybeSingle();

        if (roleData) {
          setIsSuperAdmin(true);
          setIsLoading(false);
          return;
        }

        // Get company data
        const { data: company } = await supabase
          .from("companies")
          .select("plan_status, trial_ends_at, is_blocked, is_partner, partner_ends_at")
          .eq("owner_user_id", session.user.id)
          .maybeSingle();

        if (!company) {
          setIsLoading(false);
          return;
        }

        setIsBlocked(company.is_blocked || false);

        // Check if blocked
        if (company.is_blocked) {
          setIsLoading(false);
          return;
        }

        // Check trial status
        if (company.plan_status === "trial" && company.trial_ends_at) {
          const trialEnd = new Date(company.trial_ends_at);
          const now = new Date();
          const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          setDaysRemaining(days);
          
          if (days <= 0) {
            setIsTrialExpired(true);
          } else if (days <= 3) {
            setShowBanner(true);
          }
        } else if (company.plan_status === "partner" && company.partner_ends_at) {
          const partnerEnd = new Date(company.partner_ends_at);
          const now = new Date();
          const days = Math.ceil((partnerEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          setDaysRemaining(days);
          if (days <= 7) {
            setShowBanner(true);
          }
        } else if (company.plan_status === "cancelled" || company.plan_status === "overdue") {
          setIsTrialExpired(true);
        }
        // Active status = full access
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Check if current path is exempt
  const isExemptPath = exemptPaths.some(path => location.pathname.startsWith(path));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Blocked account
  if (isBlocked && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Conta Bloqueada</h1>
          <p className="text-muted-foreground">
            Sua conta foi bloqueada. Entre em contato com o suporte para mais informações.
          </p>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Trial expired - redirect to plan selection (unless on exempt path)
  if (isTrialExpired && !isSuperAdmin && !isExemptPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <Clock className="h-16 w-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Período de Teste Expirado</h1>
          <p className="text-muted-foreground">
            Seu período de teste gratuito acabou. Escolha um plano para continuar usando o sistema.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/escolher-plano")}>
              Escolher um Plano
            </Button>
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Warning banner for trials about to expire */}
      {showBanner && daysRemaining !== null && daysRemaining > 0 && !isSuperAdmin && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-amber-500/10 border-amber-500/50">
          <Clock className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="text-amber-700 dark:text-amber-400">
              {daysRemaining === 1 
                ? "Seu período de teste expira amanhã!" 
                : `Seu período de teste expira em ${daysRemaining} dias.`}
            </span>
            <Button 
              size="sm" 
              variant="outline"
              className="ml-4 border-amber-500 text-amber-600 hover:bg-amber-500/10"
              onClick={() => navigate("/escolher-plano")}
            >
              Escolher Plano
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
}
