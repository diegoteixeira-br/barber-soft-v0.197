import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Scissors, Loader2 } from "lucide-react";
import { useServices, Service } from "@/hooks/useServices";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";

export default function Servicos() {
  const { currentUnitId, isLoading: unitLoading } = useCurrentUnit();
  const { services, isLoading, createService, updateService, deleteService } = useServices(currentUnitId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleOpenModal = (service?: Service) => {
    setEditingService(service || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = (data: any) => {
    if (editingService) {
      updateService.mutate({ id: editingService.id, ...data }, {
        onSuccess: handleCloseModal
      });
    } else {
      createService.mutate(data, {
        onSuccess: handleCloseModal
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteService.mutate(id);
  };

  if (unitLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Serviços</h1>
            <p className="mt-1 text-muted-foreground">Cadastre cortes e defina preços</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
            <div className="flex flex-col items-center gap-4 text-center">
              <Scissors className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-medium text-foreground">Nenhum serviço cadastrado</h3>
                <p className="text-sm text-muted-foreground">Adicione seu primeiro serviço para começar</p>
              </div>
              <Button onClick={() => handleOpenModal()} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Serviço
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ServiceFormModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        service={editingService}
        onSubmit={handleSubmit}
        isLoading={createService.isPending || updateService.isPending}
      />
    </DashboardLayout>
  );
}
