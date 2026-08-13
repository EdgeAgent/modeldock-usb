# Workflow Builder Reference Notes

## Dify

Dify presents an open-source workspace for building agentic workflows and RAG pipelines with model and tool support. Its repository structure and overview support adapting a visual, node-oriented workflow canvas with reusable tools, variables, and execution-oriented nodes. Reference: https://github.com/langgenius/dify

## LangChain

LangChain describes itself as an agent engineering platform and exposes concepts around agents, tools, chains, and graph-oriented orchestration through its documentation topics. For Agent Ops Desk, the relevant adaptation is a composable sequence of typed steps with explicit transitions, rather than importing the external libraries or their branding. Reference: https://github.com/langchain-ai/langchain

## Product decision

Agent Ops Desk will implement a lightweight agency-native workflow builder: users compose reusable steps such as intake, research, draft, review, tool action, and delivery; each step has an owner, an approval requirement, and a next-step connection. Deliverables are first-class outputs linked to a workflow and run. Sensitive or external steps remain approval-gated.
