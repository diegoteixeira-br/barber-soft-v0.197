import { useState } from "react";
import { Users, Plus, Edit2, Trash2, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDependents, ClientDependent, CreateDependentData, UpdateDependentData } from "@/hooks/useDependents";
import { DependentFormModal } from "./DependentFormModal";

interface DependentsListProps {
  clientId: string;
  clientName: string;
}

const relationshipLabels: Record<string, string> = {
  filho: "Filho(a)",
  esposo: "Esposo(a)",
  irmao: "Irmão(ã)",
  pai: "Pai/Mãe",
  neto: "Neto(a)",
  sobrinho: "Sobrinho(a)",
  outro: "Outro",
};

const formatBirthDate = (date: string | null) => {
  if (!date) return null;
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
};

export function DependentsList({ clientId, clientName }: DependentsListProps) {
  const { dependents, isLoading, createDependent, updateDependent, deleteDependent } = useDependents(clientId);
  const [isCreating, setIsCreating] = useState(false);
  const [editingDependent, setEditingDependent] = useState<ClientDependent | null>(null);
  const [deletingDependent, setDeletingDependent] = useState<ClientDependent | null>(null);

  const handleCreate = (data: CreateDependentData) => {
    createDependent.mutate(data, {
      onSuccess: () => setIsCreating(false),
    });
  };

  const handleSave = (data: UpdateDependentData) => {
    updateDependent.mutate(data, {
      onSuccess: () => setEditingDependent(null),
    });
  };

  const handleDelete = () => {
    if (!deletingDependent) return;
    deleteDependent.mutate(deletingDependent.id, {
      onSuccess: () => setDeletingDependent(null),
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Dependentes
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dependents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum dependente cadastrado</p>
              <p className="text-xs mt-1">
                Adicione familiares para agendar serviços para eles
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {dep.name}
                      </span>
                      {dep.relationship && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          <Heart className="h-2.5 w-2.5 mr-1 text-primary" />
                          {relationshipLabels[dep.relationship] || dep.relationship}
                        </Badge>
                      )}
                    </div>
                    {dep.birth_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>Aniv: {formatBirthDate(dep.birth_date)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => setEditingDependent(dep)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingDependent(dep)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <DependentFormModal
        open={isCreating}
        onOpenChange={setIsCreating}
        clientId={clientId}
        onCreate={handleCreate}
        onSave={() => {}}
        isLoading={createDependent.isPending}
      />

      {/* Edit Modal */}
      <DependentFormModal
        open={!!editingDependent}
        onOpenChange={(open) => !open && setEditingDependent(null)}
        clientId={clientId}
        dependent={editingDependent}
        onCreate={() => {}}
        onSave={handleSave}
        isLoading={updateDependent.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDependent} onOpenChange={(open) => !open && setDeletingDependent(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Dependente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingDependent?.name}</strong> como dependente de {clientName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
