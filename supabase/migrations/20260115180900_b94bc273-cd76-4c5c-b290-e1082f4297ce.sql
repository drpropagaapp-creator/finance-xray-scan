-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor');

-- Criar enum para status dos leads
CREATE TYPE public.lead_status AS ENUM (
    'novo_lead', 
    'em_atendimento', 
    'finalizado', 
    'interesse_outros', 
    'ganho'
);

-- Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Criar tabela de leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf_cnpj TEXT NOT NULL,
    status lead_status DEFAULT 'novo_lead' NOT NULL,
    servico_interesse TEXT,
    valor_ganho DECIMAL(10,2),
    servico_realizado TEXT,
    vendedor_id UUID REFERENCES auth.users(id),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de serviços
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Função de verificação de role (Security Definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at nos leads
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Políticas RLS para user_roles
-- Apenas admins podem ver todas as roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver sua própria role
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Apenas admins podem inserir roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem deletar roles
CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para leads
-- Qualquer pessoa pode inserir leads (formulário público)
CREATE POLICY "Anyone can insert leads" ON public.leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Admins podem ver todos os leads
CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Vendedores podem ver leads atribuídos a eles
CREATE POLICY "Vendedores can view assigned leads" ON public.leads
    FOR SELECT TO authenticated
    USING (
        public.has_role(auth.uid(), 'vendedor') 
        AND vendedor_id = auth.uid()
    );

-- Admins podem atualizar todos os leads
CREATE POLICY "Admins can update all leads" ON public.leads
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Vendedores podem atualizar leads atribuídos a eles
CREATE POLICY "Vendedores can update assigned leads" ON public.leads
    FOR UPDATE TO authenticated
    USING (
        public.has_role(auth.uid(), 'vendedor') 
        AND vendedor_id = auth.uid()
    );

-- Apenas admins podem deletar leads
CREATE POLICY "Admins can delete leads" ON public.leads
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para services
-- Todos autenticados podem ver serviços
CREATE POLICY "Authenticated can view services" ON public.services
    FOR SELECT TO authenticated
    USING (true);

-- Apenas admins podem gerenciar serviços
CREATE POLICY "Admins can manage services" ON public.services
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Inserir alguns serviços iniciais
INSERT INTO public.services (nome) VALUES 
    ('Análise de Crédito'),
    ('Consultoria Financeira'),
    ('Recuperação de Crédito'),
    ('Planejamento Financeiro');