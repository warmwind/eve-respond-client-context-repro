import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";

export default defineTool({
  description: "Delete one row by number. The user approves each call.",
  inputSchema: z.object({ row: z.number().int() }),
  approval: always(),
  async execute({ row }) {
    return { deleted: row };
  },
});
