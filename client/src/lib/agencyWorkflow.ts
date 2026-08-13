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

export function encodeWorkflowStep(stepKey: string, label: string) {
  return `step:${stepKey}|${label}`;
}

export function formatWorkflowStep(value: string) {
  const readable = value.includes(";") ? value.split(";").slice(-1)[0] : value;
  if (readable.startsWith("approval:")) return readable.split("|")[1] || readable.replace("approval:", "");
  if (readable.startsWith("step:")) return readable.split("|")[1] || readable.replace("step:", "");
  return readable;
}

export function workflowStepKey(value: string) {
  const raw = value.includes(";") ? value.split(";").slice(-1)[0] : value;
  const keyValue = raw.startsWith("approval:") ? raw.slice("approval:".length) : raw.startsWith("step:") ? raw.slice("step:".length) : "";
  return keyValue.split("|")[0] || undefined;
}

export function workflowIdFromStep(value: string) {
  return Number(value.match(/^workflow:(\d+);/)?.[1]) || undefined;
}
