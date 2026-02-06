import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreatePublicLead } from "@/hooks/useLeads";
import { leadFormSchema, type LeadFormData, formatPhone, formatCPFOrCNPJ } from "@/lib/validations";
import logoMain from "@/assets/logo-main.png";

export default function Obrigado() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const createLead = useCreatePublicLead();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      nome_completo: "",
      telefone: "",
      email: "",
      cpf_cnpj: "",
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    try {
      await createLead.mutateAsync({
        nome_completo: data.nome_completo,
        telefone: data.telefone.replace(/\D/g, ""),
        email: data.email,
        cpf_cnpj: data.cpf_cnpj.replace(/\D/g, ""),
        status: "novo_lead",
      });

      setSubmitted(true);

      toast({
        title: "Dados enviados com sucesso!",
        description: "Em breve entraremos em contato.",
      });
    } catch (error) {
      console.error("Error creating lead:", error);
      toast({
        title: "Erro ao enviar dados",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 rounded-full bg-green-100 p-3 w-fit">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Obrigado!
            </CardTitle>
            <CardDescription className="text-base">
              Seus dados foram enviados com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nossa equipe entrará em contato em até 48 horas através do whatsapp, 
              para entregar sua consulta e ajudá-lo a recuperar seu crédito.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <img src={logoMain} alt="Diagnóstico de Crédito" className="h-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Parabéns pela sua compra!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Para iniciarmos sua análise de crédito, preencha os dados abaixo:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite seu nome completo" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        {...field}
                        onChange={(e) => {
                          field.onChange(formatPhone(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF ou CNPJ para Análise</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(formatCPFOrCNPJ(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createLead.isPending}
              >
                {createLead.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Dados"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
