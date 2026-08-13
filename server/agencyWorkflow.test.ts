import { describe, expect, it } from "vitest";
import { buildAgencyWorkflowTask, formatWorkflowStatus } from "../client/src/lib/agencyWorkflow";

describe("agency workflow helpers", () => {
  it("turns ask context into one clear launch task", () => {
    expect(buildAgencyWorkflowTask({ ask: "  Prepare a launch plan  ", client: "Northstar Studio", dueDate: "2026-08-20" })).toBe("Prepare a launch plan Client: Northstar Studio. Target date: 2026-08-20.");
  });

  it("omits optional context when it is blank", () => {
    expect(buildAgencyWorkflowTask({ ask: "Review our open client work", client: " ", dueDate: "" })).toBe("Review our open client work");
  });

  it("makes internal statuses readable", () => {
    expect(formatWorkflowStatus("waiting_approval")).toBe("Waiting Approval");
  });
});
