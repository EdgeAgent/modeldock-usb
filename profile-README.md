<div align="center">

# EdgeAgent

### Building practical local AI systems for people who need control, portability, and real-world reliability.

I build tools at the intersection of **local LLMs, autonomous workflows, human oversight, and portable software**.

[Explore ModelDock USB](https://github.com/EdgeAgent/modeldock-usb)

</div>

---

## Featured project: ModelDock USB

[![ModelDock USB](https://img.shields.io/badge/Featured-ModelDock%20USB-06b6d4?style=for-the-badge&logo=github)](https://github.com/EdgeAgent/modeldock-usb)

**ModelDock USB** is a local LLM command center for autonomous business workflows—with humans in control. It turns plain-language requests into inspectable workflows, routes work through specialist agents, pauses for approval when risk matters, and preserves an operational audit trail.

![ModelDock USB architecture: local model runtime, workflow planner, human approval desk, live monitoring, audit trail, and emergency stop](https://raw.githubusercontent.com/EdgeAgent/EdgeAgent/main/assets/modeldock-architecture.png)

| Built for | What it provides |
|---|---|
| **Local-first operators** | Offline execution, USB-local JSON persistence, loopback model health checks |
| **Cross-platform workflows** | Windows, macOS, and Linux launchers with USB-root-relative paths |
| **Human oversight** | Approval gates, audit logs, pause/resume, retries, timeouts, and emergency stop |
| **Model operators** | Platform-aware model discovery, read-only file scanning, and local setup validation |

### Why it matters

Most agent demos optimize for a successful answer. ModelDock optimizes for the operating loop around the answer: **start safely, inspect progress, review sensitive actions, recover from failure, and keep control**.

### Start here

```bash
git clone https://github.com/EdgeAgent/modeldock-usb.git
cd modeldock-usb
pnpm install
pnpm check
pnpm test
pnpm dev
```

→ **[Read the ModelDock USB README](https://github.com/EdgeAgent/modeldock-usb#readme)**

---

## What I am focused on

I am exploring how local models and agentic systems can become dependable operating tools rather than isolated demos. The work is centered on portable execution, transparent state, safety boundaries, and interfaces that make autonomy understandable to the person responsible for the outcome.

## Principles

- **Local when possible.** Keep sensitive workflows close to the operator and make cloud use explicit.
- **Human at the boundary.** Automation can prepare and coordinate; people decide when consequences matter.
- **Inspectable by default.** Every meaningful action should have a status, a reason, and an audit trail.
- **Portable by design.** A useful tool should not depend on one machine, one vendor, or one fragile setup.
- **Honest about readiness.** Real host validation, failure recovery, and security work matter more than a polished demo.

## Connect with the work

The best place to start is the **[ModelDock USB repository](https://github.com/EdgeAgent/modeldock-usb)**. Issues and pull requests are welcome when they improve operator control, reproducibility, accessibility, security, or cross-platform reliability.

<div align="center">

**Local models. Human oversight. Portable operations.**

</div>

## References

[1]: https://github.com/EdgeAgent/modeldock-usb "ModelDock USB repository"
[2]: https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-github-profile/about-your-profile-readme "GitHub profile README documentation"
