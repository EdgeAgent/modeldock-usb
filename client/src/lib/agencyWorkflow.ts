export type AgencyAskContext = {
  ask: string;
  client?: string;
  dueDate?: string;
};

export function buildAgencyWorkflowTask({ ask, client, dueDate }: AgencyAskContext) {
  const base = ask.trim();
  const clientNote = client?.trim() ? ` Client: ${client.trim()}.` : "";
  const dueDateNote = dueDate?.trim() ? ` Target date: ${dueDate.trim()}.` : "";
  return `${base}${clientNote}${dueDateNote}`.trim();
}

export function formatWorkflowStatus(status: string) {
  return status.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
