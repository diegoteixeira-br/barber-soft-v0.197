

# Plano: Corrigir Busca de Cliente no handleCreate

## Problema Identificado

A função `handleCreate` (linha 679) usa busca **exata** para encontrar clientes, ignorando as variações de telefone (9º dígito):

```typescript
// PROBLEMA: Busca exata sem variações
.eq('phone', clientPhone)
```

Enquanto o `handleCheckClient` já foi corrigido para usar `getPhoneVariations`, o `handleCreate` ainda não foi atualizado.

### Fluxo Atual (Incorreto)

```text
WhatsApp envia: 556599891722 (12 dígitos)
         ↓
handleCreate busca exata: NÃO ENCONTRA
(banco tem: 5565999891722 - 13 dígitos)
         ↓
Cria NOVO cliente duplicado
         ↓
Cria agendamento com cliente errado
```

## Solução

Aplicar a mesma lógica de busca flexível do `handleCheckClient` no `handleCreate`.

### Alterações no arquivo `supabase/functions/agenda-api/index.ts`

**Modificar a busca de cliente existente (linhas 673-725):**

Substituir a busca exata atual por busca com variações:

```typescript
if (clientPhone) {
  let existingClient = null;
  
  // BUSCA EXATA primeiro
  const { data: exactMatch, error: clientFetchError } = await supabase
    .from('clients')
    .select('id, name, phone, birth_date, notes, tags, total_visits')
    .eq('unit_id', unit_id)
    .eq('phone', clientPhone)
    .maybeSingle();

  if (clientFetchError) {
    console.error('Error fetching client:', clientFetchError);
  }
  
  existingClient = exactMatch;

  // Se não encontrou, tentar VARIAÇÕES de telefone (9º dígito)
  if (!existingClient) {
    const variations = getPhoneVariations(clientPhone);
    console.log(`Cliente não encontrado com busca exata. Tentando ${variations.length} variações:`, variations);
    
    for (const variation of variations) {
      const { data: foundClient, error: variationError } = await supabase
        .from('clients')
        .select('id, name, phone, birth_date, notes, tags, total_visits')
        .eq('unit_id', unit_id)
        .eq('phone', variation)
        .maybeSingle();
      
      if (variationError) {
        console.error(`Erro buscando variação ${variation}:`, variationError);
        continue;
      }
      
      if (foundClient) {
        console.log(`✅ Cliente encontrado com variação ${variation}:`, foundClient.name);
        existingClient = foundClient;
        break;
      }
    }
  }

  if (existingClient) {
    console.log('Cliente existente encontrado:', existingClient.name);
    // Usar dados do cliente existente (sem criar novo)
    clientData = existingClient;
  } else {
    // Só cria novo se realmente não existe
    // ... código de criação existente ...
  }
}
```

## Resultado Esperado

```text
WhatsApp envia: 556599891722 (12 dígitos)
         ↓
handleCreate busca exata: NÃO ENCONTRA
         ↓
Tenta variação: 5565999891722
         ↓
✅ ENCONTRA cliente existente
         ↓
Usa dados do cliente existente para agendamento
         ↓
Agendamento criado com cliente correto!
```

## Resumo

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/agenda-api/index.ts` | Adicionar busca com variações no `handleCreate` (linhas 673-725) |

A mesma função `getPhoneVariations` que já existe no código será reutilizada, garantindo consistência entre `handleCheckClient` e `handleCreate`.

