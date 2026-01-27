
# Plano Revisado: Sistema de Cadastro com Fluxos Diferenciados

## Visao Geral

Implementar dois fluxos distintos de conversao:

1. **"Comecar Agora"** (nos cards de plano) → Cadastro + Checkout imediato com cartao
2. **"Testar Gratis Agora"** (hero/CTAs genericos) → Cadastro sem cartao, escolhe plano depois

## Arquitetura dos Dois Fluxos

### Fluxo 1: "Comecar Agora" em Plano Especifico

```text
Usuario clica "Comecar Agora" no plano Profissional (anual)
         ↓
Redireciona para /auth?tab=signup&plan=profissional&billing=annual
         ↓
Formulario de cadastro (nome, email, senha)
         ↓
Apos criar conta, redireciona automaticamente para Stripe Checkout
(com trial de 7 dias + cadastro de cartao)
         ↓
Retorna ao /dashboard com assinatura ativa (trial)
```

### Fluxo 2: "Testar Gratis Agora" (Generico)

```text
Usuario clica "Testar Gratis Agora" no hero
         ↓
Redireciona para /auth?tab=signup (sem parametros de plano)
         ↓
Formulario de cadastro (nome, email, senha)
         ↓
Apos criar conta, redireciona para /escolher-plano
         ↓
Usuario ve os 3 planos e escolhe qual quer testar
         ↓
Clica "Iniciar Trial" → Stripe Checkout (7 dias gratis + cartao)
         ↓
Retorna ao /dashboard com assinatura ativa (trial)
```

## Diferenca Principal

| Aspecto | "Comecar Agora" | "Testar Gratis" |
|---------|-----------------|-----------------|
| Plano pre-definido | Sim | Nao |
| Passos para checkout | 1 (direto) | 2 (escolha intermediaria) |
| Friccao | Menor | Maior (mais decisoes) |
| Conversao esperada | Maior | Para indecisos |

## Alteracoes Necessarias

### 1. Atualizar PricingSection.tsx

Passar o plano e ciclo de faturamento na URL:

```typescript
// De:
onClick={() => navigate("/auth?tab=signup")}

// Para:
onClick={() => navigate(`/auth?tab=signup&plan=${plan.name.toLowerCase()}&billing=${isAnnual ? 'annual' : 'monthly'}`)}
```

### 2. Atualizar Auth.tsx

Detectar parametros de plano e processar apos signup:

```typescript
const plan = searchParams.get("plan"); // "inicial", "profissional", "franquias"
const billing = searchParams.get("billing"); // "monthly", "annual"

// Apos signup bem-sucedido:
if (plan && billing) {
  // Redirecionar para checkout com o plano escolhido
  await supabase.functions.invoke('create-checkout-session', {
    body: { plan, billing }
  });
} else {
  // Redirecionar para pagina de escolha de plano
  navigate("/escolher-plano");
}
```

### 3. Criar Pagina EscolherPlano.tsx

Nova pagina para usuarios que vieram do "Testar Gratis":

- Mostra os 3 planos com toggle mensal/anual
- Botao "Iniciar Trial de 7 Dias" em cada plano
- Apos escolher, vai para Stripe Checkout

### 4. Atualizar create-checkout-session

Adicionar trial de 7 dias:

```typescript
subscription_data: {
  trial_period_days: 7,
  metadata: { company_id, plan, billing }
}
```

### 5. Atualizar HeroSection.tsx (Opcional)

Manter texto consistente - o "Testar Gratis" realmente nao pede cartao no inicio, so depois de escolher o plano.

## Componentes a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/landing/PricingSection.tsx` | Modificar | Passar plan e billing na URL |
| `src/pages/Auth.tsx` | Modificar | Detectar plano e iniciar checkout automatico |
| `src/pages/EscolherPlano.tsx` | Criar | Pagina para escolher plano (fluxo generico) |
| `src/hooks/useSubscription.ts` | Criar | Hook para gerenciar estado de assinatura |
| `supabase/functions/create-checkout-session/index.ts` | Modificar | Adicionar trial de 7 dias |
| `src/App.tsx` | Modificar | Adicionar rota /escolher-plano |

## Logica Detalhada do Auth.tsx

```typescript
const handleSignup = async (e: React.FormEvent) => {
  // ... validacao existente ...
  
  const { data, error } = await supabase.auth.signUp({...});
  
  if (!error && data.user) {
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing");
    
    if (plan && billing) {
      // Fluxo "Comecar Agora" - checkout direto
      setIsLoading(true);
      const { data: checkoutData } = await supabase.functions.invoke(
        'create-checkout-session',
        { body: { plan, billing } }
      );
      
      if (checkoutData?.url) {
        window.location.href = checkoutData.url;
      }
    } else {
      // Fluxo "Testar Gratis" - escolher plano
      navigate("/escolher-plano");
    }
  }
};
```

## Pagina EscolherPlano.tsx (Layout)

```text
+----------------------------------------------------------+
|                 Escolha seu plano                         |
|         Todos incluem 7 dias gratis para testar          |
+----------------------------------------------------------+
|                                                          |
|  [Mensal] [Anual -20%]                                   |
|                                                          |
|  +----------------+ +----------------+ +----------------+ |
|  |    Inicial     | |  Profissional  | |   Franquias    | |
|  |    R$ 99/mes   | |   R$ 199/mes   | |   R$ 499/mes   | |
|  |                | |  Recomendado   | |                | |
|  | - 1 Unidade    | | - WhatsApp     | | - Ilimitado    | |
|  | - 5 Profs      | | - Jackson IA   | | - Multi-loja   | |
|  |                | | - Marketing    | |                | |
|  | [Iniciar Trial]| |[Iniciar Trial] | |[Iniciar Trial] | |
|  +----------------+ +----------------+ +----------------+ |
|                                                          |
|  Garantia de 30 dias ou seu dinheiro de volta            |
+----------------------------------------------------------+
```

## Demais Funcionalidades (Sem Mudanca)

O restante do plano original permanece:

- Pagina de Assinatura para gerenciar plano
- Hook useSubscription
- Banners de status (trial, overdue, etc)
- Edge Function delete-account
- Webhooks para eventos do Stripe
- Garantia de 30 dias (processo manual)

## Ordem de Implementacao

1. Modificar `PricingSection.tsx` - passar plano na URL
2. Modificar `Auth.tsx` - detectar plano e iniciar checkout
3. Modificar `create-checkout-session` - adicionar trial 7 dias
4. Criar `EscolherPlano.tsx` - pagina de escolha de plano
5. Adicionar rota no `App.tsx`
6. Criar `useSubscription.ts` hook
7. Criar pagina `Assinatura.tsx`
8. Adicionar banners de status
9. Criar `delete-account` Edge Function

## Resumo da Mudanca Principal

A mudanca chave e que:

- **"Comecar Agora"** no card do plano passa `?plan=X&billing=Y` na URL
- **Auth.tsx** detecta esses parametros e vai direto pro Stripe apos cadastro
- **"Testar Gratis"** (hero) vai para Auth sem parametros, depois redireciona para `/escolher-plano`

Isso elimina a friccao para quem ja sabe qual plano quer, enquanto ainda oferece flexibilidade para quem quer testar primeiro.
