# eve: clientContext on an approval answer runs an extra model step

A `clientContext` sent with `session.respond(...)` (answering a tool approval) makes the turn run one
more model step after the model has already answered. That step has no new input.

`agent/agent.ts` uses a scripted mock model, so no API key is needed. `agent/tools/delete_row.ts` is a
tool with `approval: always()`.

## Run

```sh
npm install
npm run dev            # in one terminal (eve dev, http://127.0.0.1:2000)
node scripts/repro.mjs # in another
```

## Output

```
WITHOUT clientContext on respond(): 1 model step(s) after cancel
  step 1: Row 3 was not deleted: the approval was cancelled.

WITH clientContext on respond(): 2 model step(s) after cancel
  step 1: Row 3 was not deleted: the approval was cancelled.
  step 2: EXTRA STEP: this model call had no new input after the answer above.
```
