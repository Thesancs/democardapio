import { formatCurrency, formatTime } from "@/lib/formatters";
import type { PedidoSimulado } from "@/types";

export function formatarMensagemPedidoSimulado(pedido: PedidoSimulado) {
  const itens = pedido.itens
    .map(
      (item) =>
        `- ${item.quantidade}x ${item.prato.nome} (${formatCurrency(
          item.prato.preco * item.quantidade
        )})`
    )
    .join("\n");

  return [
    "*[DEMO] PEDIDO SIMULADO - All In Cardapio*",
    "Nenhum pagamento foi realizado.",
    "",
    `*Restaurante:* ${pedido.restauranteNome}`,
    `*Pedido:* #${pedido.numero}`,
    `*Horario:* ${formatTime(new Date(pedido.criadoEm))}`,
    "",
    "*Cliente (teste):*",
    `Nome: ${pedido.cliente.nome}`,
    `Tel: ${pedido.cliente.telefone}`,
    "",
    "*Itens:*",
    itens,
    "",
    "*Retirada:* No local",
    `*Total simulado:* ${formatCurrency(pedido.total)}`,
    "",
    "Pagamento: SIMULADO"
  ].join("\n");
}

export async function enviarPedidoGrupoAllIn(pedido: PedidoSimulado) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  const grupoId = process.env.WHATSAPP_GRUPO_ALLIN_ID;

  if (!apiUrl || !apiKey || !instance || !grupoId) {
    console.warn("[Pedido] WhatsApp nao configurado. Pedido confirmado sem envio.");
    return;
  }

  const baseUrl = apiUrl.startsWith("http") ? apiUrl : `https://${apiUrl}`;
  const fullUrl = `${baseUrl.replace(/\/$/, "")}/message/sendText/${instance}`;
  
  // DEBUG TEMPORÁRIO
  console.log("[WhatsApp DEBUG] URL:", fullUrl);
  console.log("[WhatsApp DEBUG] GrupoId:", grupoId);

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey
    },
    body: JSON.stringify({ number: grupoId, text: formatarMensagemPedidoSimulado(pedido) })
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "(sem corpo)");
    console.error("[WhatsApp] Status:", response.status);
    console.error("[WhatsApp] Corpo:", responseBody);
    throw new Error(`Falha Evolution API: ${response.status} — ${responseBody}`);
  }
}
