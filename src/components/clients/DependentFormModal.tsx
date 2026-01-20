import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDependent, CreateDependentData, UpdateDependentData } from "@/hooks/useDependents";

interface DependentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  dependent?: ClientDependent | null;
  onSave: (data: UpdateDependentData) => void;
  onCreate: (data: CreateDependentData) => void;
  isLoading?: boolean;
}

const RELATIONSHIPS = [
  { value: "filho", label: "Filho(a)" },
  { value: "esposo", label: "Esposo(a)" },
  { value: "irmao", label: "Irmão(ã)" },
  { value: "pai", label: "Pai/Mãe" },
  { value: "neto", label: "Neto(a)" },
  { value: "sobrinho", label: "Sobrinho(a)" },
  { value: "outro", label: "Outro" },
];

export function DependentFormModal({
  open,
  onOpenChange,
  clientId,
  dependent,
  onSave,
  onCreate,
  isLoading,
}: DependentFormModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  const isEditMode = !!dependent;

  useEffect(() => {
    if (open) {
      if (dependent) {
        setName(dependent.name);
        setBirthDate(dependent.birth_date || "");
        setRelationship(dependent.relationship || "");
        setNotes(dependent.notes || "");
      } else {
        setName("");
        setBirthDate("");
        setRelationship("");
        setNotes("");
      }
    }
  }, [dependent, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && dependent) {
      onSave({
        id: dependent.id,
        name,
        birth_date: birthDate || null,
        relationship: relationship || null,
        notes: notes || null,
      });
    } else {
      onCreate({
        client_id: clientId,
        name,
        birth_date: birthDate || null,
        relationship: relationship || null,
        notes: notes || null,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditMode ? "Editar Dependente" : "Novo Dependente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do dependente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Parentesco</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o parentesco" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((rel) => (
                  <SelectItem key={rel.value} value={rel.value}>
                    {rel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências, alergias, etc."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Salvando..." : isEditMode ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
