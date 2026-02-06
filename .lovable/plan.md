
## Adicionar vercel.json para permitir embeds do YouTube

O arquivo `vercel.json` será criado na raiz do projeto com headers que removem restrições de iframe/embed, permitindo que o vídeo do YouTube funcione corretamente em deploys na Vercel.

### O que será feito

Criar o arquivo `vercel.json` na raiz do repositório com as seguintes configurações:
- Remover o header `X-Frame-Options` que pode estar bloqueando iframes
- Configurar `Content-Security-Policy` para permitir frames do YouTube (`youtube.com` e `youtube-nocookie.com`)
- Aplicar a todas as rotas do site

### Detalhes técnicos

Arquivo `vercel.json` na raiz do projeto:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com;"
        }
      ]
    }
  ]
}
```

### Depois do deploy

Assim que o arquivo for commitado no GitHub, a Vercel vai automaticamente re-deployar o site com os novos headers e o vídeo deve voltar a funcionar.
