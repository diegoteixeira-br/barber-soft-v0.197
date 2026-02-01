

# Plano: Adicionar Busca por Nome no Trigger de Fidelidade

## O Que NÃO Será Alterado

- Função `sanitize_brazilian_phone` - permanece 100% igual
- Triggers de sanitização de telefone - permanecem intactos
- Formato padrão `5565999891722` - continua sendo usado
- Busca por telefone - continua sendo a **prioridade**

## O Que Será Adicionado

Apenas uma busca **adicional** por nome como fallback, para quando o agendamento não tiver telefone preenchido.

## Mudança no Trigger

```text
ANTES (atual):
┌─────────────────────────────────────────────────────┐
│  Telefone preenchido? → Busca por telefone          │
│  Telefone vazio? → NÃO PROCESSA (ignora)            │
└─────────────────────────────────────────────────────┘

DEPOIS (corrigido):
┌─────────────────────────────────────────────────────┐
│  1. Telefone preenchido? → Busca por telefone       │
│     (formato já sanitizado: 5565999891722)          │
│                                                     │
│  2. Não encontrou? → Busca por NOME + unit_id       │
│     (fallback para Serviço Rápido sem telefone)     │
└─────────────────────────────────────────────────────┘
```

## Código SQL (Apenas a Mudança)

Linha 28-33 do trigger atual:

```sql
-- ANTES:
IF is_new_status_completed AND NEW.client_phone IS NOT NULL AND NEW.client_phone != '' THEN
  SELECT * INTO client_record 
  FROM public.clients 
  WHERE unit_id = NEW.unit_id AND phone = NEW.client_phone;

-- DEPOIS:
IF is_new_status_completed THEN
  -- Etapa 1: Busca por telefone (prioridade, formato sanitizado)
  IF NEW.client_phone IS NOT NULL AND NEW.client_phone != '' THEN
    SELECT * INTO client_record 
    FROM public.clients 
    WHERE unit_id = NEW.unit_id AND phone = NEW.client_phone;
  END IF;
  
  -- Etapa 2: Fallback por nome (se não encontrou por telefone)
  IF client_record IS NULL AND NEW.client_name IS NOT NULL AND TRIM(NEW.client_name) != '' THEN
    SELECT * INTO client_record 
    FROM public.clients 
    WHERE unit_id = NEW.unit_id 
      AND LOWER(TRIM(name)) = LOWER(TRIM(NEW.client_name))
    LIMIT 1;
  END IF;
  
  -- Resto da lógica continua igual...
```

## Cenários de Teste

| Cenário | Telefone no Agendamento | Resultado |
|---------|-------------------------|-----------|
| Agendamento normal | `5565999891722` | Encontra por telefone, conta corte |
| Serviço Rápido sem telefone | NULL | Encontra por nome, conta corte |
| Serviço Rápido com telefone | `5565999891722` | Encontra por telefone, conta corte |
| Cliente não cadastrado | Qualquer | Não encontra, não conta |

## Arquivos

| Tipo | Descrição |
|------|-----------|
| SQL Migration | Atualizar APENAS a função `sync_client_on_appointment_complete` |

## Garantias

- A sanitização de telefone (`sanitize_brazilian_phone`) **NÃO será tocada**
- Os triggers de sanitização **NÃO serão alterados**
- O formato `5565999891722` **continua sendo o padrão**
- A busca por telefone **continua sendo prioritária**

