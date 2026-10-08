import { defineAgent } from "eve";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";

// A scripted model, so the reproduction needs no API key and behaves the same on every run.
// It looks only at the last message of the prompt it is given:
// - a user message  -> calls `delete_row` (which needs approval)
// - a tool result   -> answers once, with finishReason "stop"
// - anything else   -> the prompt ends with the model's own answer, i.e. there is no new input.
//                      This is the extra step; it says so in its text.
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

function text(id: string, body: string): LanguageModelV4StreamPart[] {
  return [
    { type: "stream-start" as const, warnings: [] },
    { type: "text-start" as const, id },
    { type: "text-delta" as const, id, delta: body },
    { type: "text-end" as const, id },
    { type: "finish" as const, finishReason: { unified: "stop" as const, raw: "stop" }, usage },
  ];
}

const model = new MockLanguageModelV4({
  doStream: async ({ prompt }) => {
    const last = prompt.at(-1);
    const chunks: LanguageModelV4StreamPart[] =
      last?.role === "user"
        ? [
            { type: "stream-start" as const, warnings: [] },
            {
              type: "tool-call" as const,
              toolCallId: `call_${Date.now()}`,
              toolName: "delete_row",
              input: JSON.stringify({ row: 3 }),
            },
            { type: "finish" as const, finishReason: { unified: "tool-calls" as const, raw: "tool_calls" }, usage },
          ]
        : last?.role === "tool"
          ? text("answer", "Row 3 was not deleted: the approval was cancelled.")
          : text("extra", "EXTRA STEP: this model call had no new input after the answer above.");
    return { stream: simulateReadableStream({ chunks }) };
  },
});

export default defineAgent({ model, modelContextWindowTokens: 128_000 });
