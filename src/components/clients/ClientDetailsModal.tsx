import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Calendar, Clock, Edit2, Building2, BellOff, Users, FileText } from "lucide-react";
import { Client } from "@/hooks/useClients";
import { DependentsList } from "./DependentsList";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onEdit: (client: Client) => void;
  showUnit?: boolean;
}

const tagColors: Record<string, string> = {
  VIP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Sumido: "bg-red-500/20 text-red-400 border-red-500/30",
  Novo: "bg-green-500/20 text-green-400 border-green-500/30",
  Frequente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function ClientDetailsModal({
  open,
  onOpenChange,
  client,
  onEdit,
  showUnit = false,
}: ClientDetailsModalProps) {
  if (!client) return null;

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formatBirthDate = (date: string | null) => {
    if (!date) return null;
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatLastVisit = (date: string | null) => {
    if (!date) return "Nunca visitou";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="sr-only">Detalhes do Cliente</DialogTitle>
        </DialogHeader>

        {/* Client Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-border">
          <Avatar className="h-16 w-16 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-foreground truncate">
                  {client.name}
                </h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{client.phone}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(client);
                }}
                className="shrink-0"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>

            {showUnit && client.unit_name && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Building2 className="h-3 w-3 text-primary" />
                <span>{client.unit_name}</span>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {client.marketing_opt_out && (
                <Badge
                  variant="outline"
                  className="bg-destructive/20 text-destructive border-destructive/30 gap-1"
                >
                  <BellOff className="h-3 w-3" />
                  Descadastrado
                </Badge>
              )}
              {client.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={tagColors[tag] || "bg-secondary text-secondary-foreground"}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 py-3 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">{client.total_visits}</div>
            <div className="text-xs text-muted-foreground">Visitas</div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {client.birth_date ? formatBirthDate(client.birth_date) : "-"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Nascimento
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground truncate">
              {formatLastVisit(client.last_visit_at)}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Última visita
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dependents" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dependents" className="gap-1">
              <Users className="h-4 w-4" />
              Dependentes
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1">
              <FileText className="h-4 w-4" />
              Observações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dependents" className="mt-4">
            <DependentsList clientId={client.id} clientName={client.name} />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="rounded-lg border border-border bg-secondary/30 p-4 min-h-[120px]">
              {client.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma observação registrada
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
