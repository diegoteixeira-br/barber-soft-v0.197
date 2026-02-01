

# Plano: Programa de Fidelidade por Unidade + Icone de Configuracao Visivel

## Resumo do Problema

1. **Fidelidade global nao funciona bem** - Cada unidade pode ter regras diferentes de fidelidade
2. **Menu de opcoes escondido** - O botao de tres pontinhos so aparece no hover, dificultando o acesso

---

## Solucao Proposta

### Parte 1: Mover Fidelidade para Unidades

**Migracao de Banco de Dados**

Adicionar 3 colunas na tabela `units`:

| Coluna | Tipo | Padrao | Descricao |
|--------|------|--------|-----------|
| fidelity_program_enabled | boolean | false | Ativar programa |
| fidelity_cuts_threshold | integer | 10 | Cortes para ganhar cortesia |
| fidelity_min_value | numeric | 30.00 | Valor minimo do servico |

**Atualizar Trigger do Banco**

O trigger `sync_client_on_appointment_complete` sera alterado para buscar as configuracoes de fidelidade da tabela `units` em vez de `business_settings`:

```text
ANTES (business_settings):
SELECT fidelity_program_enabled, fidelity_cuts_threshold, fidelity_min_value
FROM business_settings WHERE user_id = owner_id

DEPOIS (units):
SELECT fidelity_program_enabled, fidelity_cuts_threshold, fidelity_min_value
FROM units WHERE id = NEW.unit_id
```

### Parte 2: Nova Interface do UnitCard

**Layout Atual:**
```text
┌─────────────────────────────────────────┐
│ 🏢 Nome da Unidade       [⋮] <- hover   │
│ 📍 Endereco                              │
│ 📞 Telefone                              │
│ 👤 Gerente                               │
│ [Conectar WhatsApp]                      │
└─────────────────────────────────────────┘
```

**Layout Novo:**
```text
┌─────────────────────────────────────────┐
│ 🏢 Nome da Unidade       [⚙️] [⋮]       │
│ 📍 Endereco              <- sempre visivel│
│ 📞 Telefone                              │
│ 👤 Gerente                               │
│ 🎁 Fidelidade: Ativo (5 cortes)         │
│ [Conectar WhatsApp]                      │
└─────────────────────────────────────────┘
```

Mudancas:
- Icone de engrenagem **sempre visivel** (nao precisa hover)
- Badge de status da fidelidade no card
- Menu de tres pontinhos mantem editar/excluir

### Parte 3: Modal de Configuracoes da Unidade

Criar `UnitSettingsModal.tsx` com as configuracoes de fidelidade:

```text
┌─────────────────────────────────────────┐
│ ⚙️ Configuracoes - [Nome da Unidade]    │
├─────────────────────────────────────────┤
│                                          │
│ 🎁 PROGRAMA DE FIDELIDADE               │
│ ┌─────────────────────────────────────┐ │
│ │ Ativar programa    [======●]       │ │
│ └─────────────────────────────────────┘ │
│                                          │
│ Cortes para ganhar cortesia: [10]       │
│ A cada 10 cortes, cliente ganha 1 gratis │
│                                          │
│ Valor minimo do servico: R$ [30,00]     │
│ Servicos a partir deste valor contam    │
│                                          │
│ ℹ️ Como funciona:                        │
│ • Servicos >= R$ 30 contam como corte   │
│ • Cortesias nao contam                   │
│ • Dependentes contam para o titular     │
│ • Ao atingir 10 cortes, 1 cortesia      │
│                                          │
│             [Cancelar] [Salvar]          │
└─────────────────────────────────────────┘
```

### Parte 4: Remover do Configuracoes Global

Remover a aba "Fidelidade" da pagina de Configuracoes, ja que agora e por unidade.

Tabs que ficam:
- Perfil
- Horarios
- ~~Fidelidade~~ (removida)
- Notificacoes
- Taxas
- Termos
- Cancelamento
- Conta

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| **Migracao SQL** | Adicionar colunas fidelity_* na tabela units |
| **Migracao SQL** | Atualizar trigger para ler de units |
| src/hooks/useUnits.ts | Adicionar campos fidelity ao tipo Unit |
| src/components/units/UnitCard.tsx | Adicionar botao de engrenagem visivel + badge fidelidade |
| src/components/units/UnitSettingsModal.tsx | **NOVO** - Modal com config de fidelidade |
| src/pages/Unidades.tsx | Adicionar estado e handlers para settings modal |
| src/hooks/useFidelityCourtesy.ts | Buscar settings da unit em vez de business_settings |
| src/components/agenda/AppointmentDetailsModal.tsx | Buscar fidelidade da unit atual |
| src/components/clients/ClientDetailsModal.tsx | Buscar fidelidade da unit atual |
| src/pages/Configuracoes.tsx | Remover aba Fidelidade |

---

## Fluxo de Uso

1. Usuario vai em **Unidades**
2. Clica no icone de **engrenagem** no card da unidade
3. Abre modal de **Configuracoes da Unidade**
4. Ativa **Programa de Fidelidade** e define regras
5. Salva - configuracoes aplicam apenas para aquela unidade
6. Cada unidade pode ter regras diferentes

---

## Beneficios

- Unidade A pode ter 5 cortes para cortesia
- Unidade B pode ter 10 cortes para cortesia
- Unidade C pode ter fidelidade desativado
- Icone de configuracao sempre visivel, mais intuitivo

