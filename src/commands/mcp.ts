import { runMcpServer } from "../mcp/run.js";

export async function runMcpCommand(): Promise<void> {
  await runMcpServer();
}
