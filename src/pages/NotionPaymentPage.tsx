import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { useNotionPaymentPage } from "@/hooks/useNotionPaymentPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function NotionPaymentPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const {
    pageData,
    isLoadingPage,
    pageError,
    refetchPage,
    formData,
    updateField,
    amountInCents,
    isFormValid,
    paymentUrl,
    isGeneratingLink,
    generatePaymentLink,
  } = useNotionPaymentPage(pageId || null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    generatePaymentLink();
  };

  const handleCopy = async () => {
    if (!paymentUrl) return;

    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  if (!pageId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Page ID não informado</CardTitle>
            <CardDescription>
              Não foi possível abrir a página de pagamento sem o parâmetro <code>pageId</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-muted-foreground">Carregando dados da página do Notion...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    const errorMessage = pageError instanceof Error ? pageError.message : "Erro desconhecido";

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Não foi possível carregar a página do Notion</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A geração do link de pagamento fica bloqueada enquanto os dados do Notion não forem carregados.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetchPage()}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Gerar Link de Pagamento</CardTitle>
            <CardDescription>
              Página do Notion: <code>{pageId}</code>
            </CardDescription>
            <CardDescription>
              Preencha os campos abaixo para gerar o link de pagamento no Stripe via webhook.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados para Pagamento</CardTitle>
            <CardDescription>
              O valor inicial e os dados do lead foram pré-preenchidos com base no Notion e podem ser ajustados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (BRL)</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="Ex.: 850,00"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Nome do lead"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="email@dominio.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(21) 99999-9999"
                  autoComplete="tel"
                />
              </div>

              <Separator />

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span>
                  Valor em centavos enviado ao webhook:{" "}
                  <strong>{amountInCents ? amountInCents : "—"}</strong>
                </span>
                <span>Campos obrigatórios: valor, nome, email e telefone.</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!isFormValid || isGeneratingLink}>
                  {isGeneratingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando link...
                    </>
                  ) : (
                    "Gerar Link de Pagamento"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isGeneratingLink}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {paymentUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Link Gerado</CardTitle>
              <CardDescription>Use o botão para copiar ou abrir o link de pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline break-all"
              >
                {paymentUrl}
              </a>
              <div className="flex gap-2">
                <Button type="button" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar link
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href={paymentUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir link
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pageData && (
          <Card>
            <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
              <p>Criado em: {new Date(pageData.created_time).toLocaleString("pt-BR")}</p>
              <p>Última edição: {new Date(pageData.last_edited_time).toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

