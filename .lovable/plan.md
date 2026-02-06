

# Plano: Template Multi-Cliente com Variaveis de Ambiente

## Objetivo
Transformar o projeto em um template reutilizavel onde cada deploy na Vercel usa variaveis de ambiente diferentes para personalizar: logo, pixel do Facebook, token do Meta, script Utmify e link de checkout.

## Variaveis de Ambiente na Vercel

Voce precisara configurar estas variaveis para cada projeto/dominio na Vercel:

| Variavel | Descricao | Exemplo |
|---|---|---|
| `VITE_LOGO_URL` | URL direta da logo do cliente | `https://i.imgur.com/abc123.png` |
| `VITE_FB_PIXEL_ID` | ID do pixel do Facebook | `4195732454014864` |
| `VITE_UTMIFY_PIXEL_ID` | ID do pixel Utmify | `69822950a000539283da77ae` |
| `VITE_CHECKOUT_URL` | Link do botao de checkout | `https://payfast.greenn.com.br/d542hpu` |

> O `FB_PIXEL_ACCESS_TOKEN` (token secreto da API de Conversoes do Meta) nao sera exposto no frontend -- ele deve ser configurado como variavel de ambiente normal (sem prefixo `VITE_`) caso use server-side tracking.

## Alteracoes Necessarias

### 1. index.html -- Pixel do Facebook e Utmify dinamicos

O `index.html` nao suporta `import.meta.env` nativamente. A solucao e:
- Remover os scripts hardcoded do pixel FB e Utmify do `index.html`
- Criar um componente React `PixelScripts.tsx` que injeta os scripts dinamicamente no `<head>` usando `useEffect`, lendo os valores de `import.meta.env`

### 2. Componente `PixelScripts.tsx` (novo arquivo)

- Injetara o script do Facebook Pixel com o ID vindo de `VITE_FB_PIXEL_ID`
- Injetara o script do Utmify Pixel com o ID vindo de `VITE_UTMIFY_PIXEL_ID`
- Injetara o script de captura Utmify (esse e fixo, nao muda)
- Sera incluido no `App.tsx` ou `Index.tsx`

### 3. Logo dinamica via URL

Nos componentes `Hero.tsx`, `Footer.tsx` e `Oferta.tsx`:
- Substituir `import logoMain from "@/assets/logo-new.png"` por uma logica que use `import.meta.env.VITE_LOGO_URL`
- Se a variavel existir, usa a URL externa; senao, usa a logo padrao local como fallback

### 4. Link de checkout dinamico

No componente `Oferta.tsx`:
- Substituir o link hardcoded `https://payfast.greenn.com.br/d542hpu` por `import.meta.env.VITE_CHECKOUT_URL`

### 5. Ajuste no `index.html`

- Remover os blocos de script do Facebook Pixel (linhas 22-34)
- Remover o bloco de script do Utmify Pixel (linhas 37-46)
- Remover o `<noscript>` do Facebook Pixel (linhas 54-58)
- Manter o script de captura Utmify (linha 49) -- esse sera movido para o componente tambem

## Arquivos Modificados

- `index.html` -- remover scripts hardcoded
- `src/components/Hero.tsx` -- logo dinamica
- `src/components/Footer.tsx` -- logo dinamica
- `src/components/Oferta.tsx` -- logo dinamica + checkout URL dinamico
- `src/pages/Index.tsx` -- incluir PixelScripts

## Arquivo Novo

- `src/components/PixelScripts.tsx` -- injecao dinamica dos pixels

## Resumo das Variaveis para a Vercel

Ao criar um novo projeto na Vercel apontando para o mesmo repositorio, basta configurar:

1. **VITE_LOGO_URL** -- link direto da imagem da logo
2. **VITE_FB_PIXEL_ID** -- ID do pixel do Facebook
3. **VITE_UTMIFY_PIXEL_ID** -- ID do pixel Utmify
4. **VITE_CHECKOUT_URL** -- URL do checkout/pagamento

Todo o restante do site (video, textos, layout) funcionara automaticamente sem alteracoes.

