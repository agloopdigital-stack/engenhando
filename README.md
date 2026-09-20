# Engenhando

SaaS mobile-first "onfinger" para engenheiros civis e mestres de obra.
Módulo em desenvolvimento: **RDO Automático**.

## Rodando localmente

1. `npm install`
2. Crie um projeto no [Supabase](https://supabase.com) (grátis para começar).
3. No SQL Editor do Supabase, rode as migrations em `supabase/migrations/`,
   em ordem (`0001_base_schema.sql`, depois `0002_modulo_rdo.sql`).
4. Crie um bucket de Storage público chamado `midias` (Storage > New bucket).
5. Copie `.env.local.example` para `.env.local` e preencha com a URL e a
   anon key do seu projeto (Project Settings > API).
6. `npm run dev` e acesse `http://localhost:3000`.

## Estrutura

- `app/obras/[obraId]/captura` — tela de captação em campo (áudio/foto/texto).
- `components/captura/` — componentes e lógica dessa tela.
- `lib/supabase/` — clientes Supabase (browser e server).
- `supabase/migrations/` — schema do banco, em SQL puro.

## Ainda não implementado (próximos passos)

- Autenticação real (login do engenheiro/mestre de obra) — hoje o
  `criado_por` fica nulo se não houver sessão.
- Processamento de fechamento do dia: transcrição dos áudios, geração
  do PDF do RDO com identidade visual da conta, atualização do painel
  do cliente. Ver `references/modulo-rdo.md` na skill do projeto.
- Deploy no Vercel + conexão com o Supabase de produção.
