

## Corrigir disparo duplicado do Facebook Pixel

### Problema
O componente `PixelScripts` injeta o script do Facebook Pixel toda vez que monta, sem verificar se ele ja foi carregado. No React (especialmente em modo StrictMode), o `useEffect` pode rodar mais de uma vez, causando multiplos PageView.

### Solucao
Adicionar uma verificacao no `useEffect` para nao injetar o script se `window.fbq` ja existir. Isso garante que o pixel so e inicializado uma vez, mesmo que o componente re-monte.

### Detalhes tecnicos

No arquivo `src/components/PixelScripts.tsx`:

1. Antes de criar o script do Facebook Pixel, verificar se `window.fbq` ja existe. Se ja existir, nao injetar novamente.
2. Para o Utmify, verificar se `window.pixelId` ja esta definido antes de injetar.
3. Para o Utmify Capture, verificar se o script ja foi adicionado ao DOM.

Codigo atualizado do bloco do Facebook Pixel:
```typescript
// Facebook Pixel - so injeta se ainda nao existe
if (fbPixelId && !(window as any).fbq) {
  // ... codigo existente de criacao do script
}
```

Codigo atualizado do bloco do Utmify Pixel:
```typescript
// Utmify Pixel - so injeta se ainda nao existe
if (utmifyPixelId && !(window as any).pixelId) {
  // ... codigo existente
}
```

Codigo atualizado do bloco do Utmify Capture:
```typescript
// Utmify Capture - so injeta se ainda nao existe
if (!document.querySelector('script[src*="utmify.com.br/scripts/utms"]')) {
  // ... codigo existente
}
```

Isso resolve os warnings de PageView duplicado que aparecem no Meta Pixel Helper.

