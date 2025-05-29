// app/actions/updateChatHistory.ts
// ---------------------------------------------------------------------
// Server-side only – Next 13.4+ “Server Action”
// Updates the running chat **and** the restaurant’s order list
// in response to a new user message, using OpenAI in JSON-object mode.
//
// External helpers (imported from /lib):
//   • getActiveOrder
//   • getFinisehdOrder
// ---------------------------------------------------------------------
"use server";
import { Order } from "@/components/kitchen-orders/orders-provider";
import { ChatHistory } from "@/hooks/atoms";
import { getActiveOrder, getFinisehdOrder } from "@/lib/lib";
import "server-only";


/* ------------------------------------------------------------------ */
/*  Types returned to the client                                      */
/* ------------------------------------------------------------------ */
export interface UpdateResult {
  chat: ChatHistory[]; // full, updated chat history
  orders: Order[];     // full, updated order list
}

/* ------------------------------------------------------------------ */
/*  Action                                                            */
/* ------------------------------------------------------------------ */
export async function updateChatHistory(
  orders: any[],        // current order list for *all* diners
  userName: string,       // who is chatting
  chat: ChatHistory[],    // current chat history
  userMessage: string     // freshly-typed user message
): Promise<UpdateResult> {
  /* 1. Optimistically append the new user message -------------------- */
  const chatPlusUser: ChatHistory[] = [
    ...chat,
    { role: "user", content: userMessage } satisfies ChatHistory
  ];

  /* 2. Build contextual summaries with our helper functions ---------- */
  const { activeOrder, des: activeDes } = getActiveOrder(orders, userName);
  const { orderHistory, des: historyDes } = getFinisehdOrder(orders, userName);

  /* 3. Craft the **system prompt** using the `des` strings ------------ */
  const systemPrompt = `
You are the restaurant’s AI ordering assistant.

Diner context:
${activeDes}

Past orders:
${historyDes}

Respond with a JSON object:
{
  "status":  "ordering" | "decided",
  "answer":  "<chat reply to diner>",
  "dec":     "<short description of the order (if any)>"
}`.trim();

  /* 4. Call OpenAI in JSON-object mode ------------------------------- */
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...chatPlusUser.map(({ role, content }) => ({ role, content }))
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }

  const raw  = await res.json();
  const text = raw.choices?.[0]?.message?.content ?? "{}";

  let parsed: { status?: "ordering" | "decided"; answer?: string; dec?: string } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* fall through with defaults */
  }

  const newStatus = parsed.status ?? "ordering";
  const assistantAnswer = parsed.answer ?? "✓ Order noted.";
  const newDesc = parsed.dec ?? activeOrder?.desc ?? "";

  /* 5. Update / create the diner’s active order ---------------------- */
  let updatedOrders = [...orders];

  if (activeOrder) {
    // mutate that order in copy of array
    updatedOrders = updatedOrders.map(o =>
      o.id === activeOrder.id
        ? {
            ...o,
            status: newStatus === "decided" ? "desided" : "ordering",
            desc: newDesc || o.desc
          }
        : o
    );
  } else if (newDesc) {
    // no active order → create one
    updatedOrders.push({
      id: crypto.randomUUID(),
      userName,
      desc: newDesc,
      status: newStatus === "decided" ? "desided" : "ordering"
    });
  }

  /* 6. Append the model’s answer to the chat ------------------------- */
  const finalChat: ChatHistory[] = [
    ...chatPlusUser,
    { role: "assistant", content: assistantAnswer }
  ];

  /* 7. Return the new state back to the client ----------------------- */
  return {
    chat: finalChat,
    orders: updatedOrders
  };
}
