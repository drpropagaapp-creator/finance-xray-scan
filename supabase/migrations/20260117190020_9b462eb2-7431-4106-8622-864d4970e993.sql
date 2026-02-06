
-- PARTE 2: Distribuição Automática de Leads
CREATE TABLE public.lead_distribution_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT false,
  distribution_mode text DEFAULT 'round_robin',
  last_assigned_vendedor_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.vendedor_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL,
  active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS for lead_distribution_config
ALTER TABLE public.lead_distribution_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage distribution config"
ON public.lead_distribution_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedores can view distribution config"
ON public.lead_distribution_config FOR SELECT
USING (public.has_role(auth.uid(), 'vendedor'));

-- RLS for vendedor_distribution
ALTER TABLE public.vendedor_distribution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vendedor distribution"
ON public.vendedor_distribution FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedores can view own distribution"
ON public.vendedor_distribution FOR SELECT
USING (vendedor_id = auth.uid());

-- PARTE 3: Tags para leads (usando services existente)
CREATE TABLE public.lead_service_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, service_id)
);

ALTER TABLE public.lead_service_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead tags"
ON public.lead_service_tags FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedores can view lead tags"
ON public.lead_service_tags FOR SELECT
USING (public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Vendedores can insert lead tags"
ON public.lead_service_tags FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'vendedor'));

-- PARTE 5: Sistema de Closers
CREATE TABLE public.closers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.closers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all closers"
ON public.closers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedores can manage own closers"
ON public.closers FOR ALL
USING (vendedor_id = auth.uid());

-- PARTE 6: Funil de Ganho Detalhado - Novas colunas em leads
ALTER TABLE public.leads ADD COLUMN forma_pagamento text;
ALTER TABLE public.leads ADD COLUMN data_pagamento date;
ALTER TABLE public.leads ADD COLUMN qtd_parcelas integer;
ALTER TABLE public.leads ADD COLUMN parcelas_info jsonb;
ALTER TABLE public.leads ADD COLUMN closer_id uuid REFERENCES closers(id);

-- Tabela para múltiplos serviços vendidos por lead
CREATE TABLE public.lead_servicos_vendidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  valor numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, service_id)
);

ALTER TABLE public.lead_servicos_vendidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lead servicos"
ON public.lead_servicos_vendidos FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedores can view lead servicos"
ON public.lead_servicos_vendidos FOR SELECT
USING (public.has_role(auth.uid(), 'vendedor'));

CREATE POLICY "Vendedores can insert lead servicos"
ON public.lead_servicos_vendidos FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'vendedor'));

-- Trigger para atualizar updated_at em lead_distribution_config
CREATE TRIGGER update_lead_distribution_config_updated_at
BEFORE UPDATE ON public.lead_distribution_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial de distribuição
INSERT INTO public.lead_distribution_config (enabled, distribution_mode) VALUES (false, 'round_robin');

-- Função para distribuição automática de leads
CREATE OR REPLACE FUNCTION public.auto_assign_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  config_record RECORD;
  next_vendedor_id uuid;
BEGIN
  -- Verificar se distribuição está habilitada
  SELECT * INTO config_record FROM public.lead_distribution_config LIMIT 1;
  
  IF config_record IS NULL OR NOT config_record.enabled THEN
    RETURN NEW;
  END IF;
  
  -- Buscar próximo vendedor ativo na distribuição (round robin)
  SELECT vd.vendedor_id INTO next_vendedor_id
  FROM public.vendedor_distribution vd
  WHERE vd.active = true
    AND (config_record.last_assigned_vendedor_id IS NULL 
         OR vd.vendedor_id != config_record.last_assigned_vendedor_id)
  ORDER BY vd.priority ASC, vd.created_at ASC
  LIMIT 1;
  
  -- Se não encontrou, pegar o primeiro ativo
  IF next_vendedor_id IS NULL THEN
    SELECT vd.vendedor_id INTO next_vendedor_id
    FROM public.vendedor_distribution vd
    WHERE vd.active = true
    ORDER BY vd.priority ASC, vd.created_at ASC
    LIMIT 1;
  END IF;
  
  -- Atribuir vendedor ao lead
  IF next_vendedor_id IS NOT NULL THEN
    NEW.vendedor_id := next_vendedor_id;
    
    -- Atualizar último vendedor atribuído
    UPDATE public.lead_distribution_config 
    SET last_assigned_vendedor_id = next_vendedor_id,
        updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para distribuição automática
CREATE TRIGGER auto_assign_lead_trigger
BEFORE INSERT ON public.leads
FOR EACH ROW
WHEN (NEW.vendedor_id IS NULL)
EXECUTE FUNCTION public.auto_assign_lead();
