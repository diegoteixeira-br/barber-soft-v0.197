# Plano: Sistema de Opt-Out (SAIR) do Marketing

## ✅ STATUS: IMPLEMENTADO

## Como o Sistema Funciona

### Fluxo Completo

```text
1. Cliente recebe msg de marketing
         ↓
2. Cliente responde "SAIR"
         ↓
3. Evolution API → n8n (chat-barbearia)
         ↓
4. n8n verifica se msg = "SAIR"?
      ├── SIM → POST para process-opt-out (receptor-barber)
      └── NAO → Continua para Agente Jackson
         ↓
5. Edge Function process-opt-out:
      - Encontra cliente pelo telefone
      - Atualiza marketing_opt_out = true
      - Envia confirmacao automatica
         ↓
6. Proximas campanhas:
      - send-marketing-campaign filtra clientes com opt-out
      - Cliente nao recebe mais msgs de marketing
```

### O Que Está Implementado

1. ✅ Edge function `process-opt-out` que atualiza o cliente no banco
2. ✅ Campo `marketing_opt_out` na tabela clients
3. ✅ Filtragem automatica no envio de campanhas (ja ignora clientes com opt-out)
4. ✅ Badge "Descadastrado" visivel na interface de clientes
5. ✅ Mensagem de confirmacao automatica para o cliente ("Voce foi removido...")
6. ✅ Suporte a "VOLTAR" para opt-in novamente
7. ✅ Filtro "Bloqueados (SAIR)" na aba de campanhas
8. ✅ Contador de clientes bloqueados na lista de campanhas
9. ✅ Botao de desbloqueio manual no modal de detalhes do cliente
10. ✅ Badge visual "Bloqueado" nos clientes com opt-out na lista de campanhas

## Configuração do n8n

O n8n precisa enviar o payload correto para a edge function:

```json
{
  "instanceName": "nome_da_instancia",
  "sender": "5511999999999@s.whatsapp.net",
  "message": "SAIR",
  "secret": "valor_do_N8N_CALLBACK_SECRET",
  "action": "opt_out"
}
```

Para VOLTAR:
```json
{
  "action": "opt_in"
}
```

**Importante**: O secret enviado pelo n8n deve ser o mesmo valor configurado em `N8N_CALLBACK_SECRET` no Supabase.

## Arquivos Modificados

1. `src/components/marketing/CampaignsTab.tsx`
   - Filtro "Bloqueados (SAIR)" adicionado
   - Contador de bloqueados na interface
   - Badge visual para clientes com opt-out

2. `src/components/clients/ClientDetailsModal.tsx`
   - Botão para bloquear/desbloquear cliente manualmente

3. `src/hooks/useClients.ts`
   - Mutation `toggleMarketingOptOut` para alternar status de opt-out

## Resultado Final

1. ✅ Clientes que enviarem "SAIR" são automaticamente bloqueados
2. ✅ Recebem confirmação automática de que foram removidos
3. ✅ Não aparecem mais na lista de seleção de campanhas (exceto no filtro "Bloqueados")
4. ✅ Se enviarem "VOLTAR", são desbloqueados automaticamente
5. ✅ Administrador pode ver e gerenciar clientes bloqueados
6. ✅ Opção de desbloqueio manual disponível
