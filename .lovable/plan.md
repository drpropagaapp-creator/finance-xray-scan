

## Remover query strings do link de checkout

### Problema
Os parâmetros UTM (`?utm_source=organic&utm_campaign=...`) estão sendo adicionados ao link de checkout pela integração antiga da Utmify na Greenn. Mesmo após remover a Utmify, os links continuam com esses parâmetros porque o navegador ou a Greenn pode estar cacheando o comportamento.

### Solucao
No `src/components/Oferta.tsx`, limpar qualquer query string da URL de checkout antes de usá-la no botão. Isso garante que, independentemente do que a variável de ambiente contenha, o link sempre será limpo.

### Alteracao

No arquivo `src/components/Oferta.tsx`, trocar:

```typescript
const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL || "https://payfast.greenn.com.br/d542hpu";
```

Por:

```typescript
const rawCheckoutUrl = import.meta.env.VITE_CHECKOUT_URL || "https://payfast.greenn.com.br/d542hpu";
const checkoutUrl = rawCheckoutUrl.split('?')[0];
```

Isso remove qualquer parâmetro (`?utm_source=...`, `?ref=...`, etc.) da URL, mantendo apenas o link base do checkout.

