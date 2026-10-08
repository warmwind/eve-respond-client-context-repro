// Usage: node scripts/repro.mjs [baseUrl]   (start `npm run dev` first)
// Runs the same turn twice: ask to delete a row, then cancel the approval,
// once without clientContext on the answer and once with it.
import { Client } from "eve/client";

const host = process.argv[2] ?? "http://127.0.0.1:2000";
const client = new Client({ host });

async function run(withContext) {
  const clientContext = withContext ? { page_url: "https://example.com/rows" } : undefined;
  const { response, session } = await client.sessions.create({ message: "Delete row 3.", clientContext });
  let request;
  for await (const event of response) {
    if (event.type === "input.requested") request = event.data?.requests?.[0];
  }
  if (!request) throw new Error("the model did not ask for approval");

  const answered = await session.respond(
    [{ requestId: request.requestId, optionId: "cancel" }],
    clientContext ? { clientContext } : {},
  );
  const steps = [];
  for await (const event of answered) {
    if (event.type === "message.completed") steps.push(`step ${event.data.stepIndex}: ${event.data.message}`);
  }
  console.log(`\n${withContext ? "WITH" : "WITHOUT"} clientContext on respond(): ${steps.length} model step(s) after cancel`);
  for (const step of steps) console.log(`  ${step}`);
}

await run(false);
await run(true);
