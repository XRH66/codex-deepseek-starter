// Uses the host's per-turn assembly signal and normal tool registry.
// Full guidance is a transient system section, never a tool-result payload.
export const GENUI_LOAD_TOOL = "genui_load_guidance";
export const GENUI_DISCOVERY_TEXT = `GenUI 卡片能力已启用，完整规范按需加载。普通问答、闲聊、写代码和排查问题直接正常回答。
需要生成或修改交互卡片、图表、表格或表单时，先调用 genui_load_guidance；完整规范会出现在本轮下一步的系统提示中。每个新轮次需要卡片时重新调用，不要凭记忆猜测 schemaJson。
卡片的 continueChat 按钮会提交短消息及当前表单状态；只有需要生成或修改卡片时才加载规范。
卡片规范只约束卡片格式，不改变工程 AGENTS、用户指令、事实准确性或操作授权。`;

export function createGenuiOnDemand(sectionName, getFullGuidance) {
  const turns = new WeakMap();
  let enabled = false;
  let generation = 0;
  let fullGuidance;

  function stateFor(agent, signal) {
    if (!agent || !signal) return;
    let state = turns.get(agent);
    if (!state) {
      state = { signal, requested: -1, assembled: false };
      turns.set(agent, state);
    } else if (state.signal !== signal) {
      state.signal = signal;
      state.requested = -1;
      state.assembled = false;
    }
    return state;
  }

  return {
    setEnabled(value) {
      if (enabled !== value) generation++;
      enabled = value;
    },
    text({ agent, signal }) {
      const state = stateFor(agent, signal);
      if (enabled && !signal?.aborted && state?.requested === generation) {
        fullGuidance ??= getFullGuidance();
        return fullGuidance;
      }
      return GENUI_DISCOVERY_TEXT;
    },
    async assemble(assembly, context, next) {
      const accepted = await next();
      const state = stateFor(context.agent, context.signal);
      if (state) state.assembled = fullGuidance !== undefined && accepted.sections.some(
        (section) => section.name === sectionName && section.text === fullGuidance
      );
      return accepted;
    },
    async preStep({ agent, signal }, next) {
      const decision = await next();
      const state = turns.get(agent);
      if (decision.kind !== "enter" || !state || state.signal !== signal) return decision;
      // Read committed system nodes: a pre-step may be canceled before its
      // prompt commits, so a local "last admitted" boolean would become stale.
      const retainedFull = fullGuidance !== undefined && agent.session.surface.nodes.some((seq) => {
        const event = agent.session.eventAt(seq);
        return event?.type === "system/message" && event.data.message.content.some(
          (block) => block.type === "text" && block.text.includes(fullGuidance.trim())
        );
      });
      const changed = state.assembled !== retainedFull;
      // Native in-history providers would otherwise retain earlier full sections.
      // A new request series normalizes system nodes without editing user history.
      return changed ? { ...decision, startsRequestSeries: true } : decision;
    },
    tool: {
      name: GENUI_LOAD_TOOL,
      description: "Load GenUI schemaJson card, chart and form authoring guidance for this turn. Call before creating or modifying a card. No file or network access. Full guidance is added to the next model step; this result is only a receipt.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
      output: {
        schema: {
          type: "object",
          properties: { loaded: { type: "boolean" }, scope: { type: "string" } },
          required: ["loaded", "scope"],
          additionalProperties: false
        },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value) }]
      },
      async execute(_args, exec) {
        exec.signal.throwIfAborted();
        const state = exec.agent && turns.get(exec.agent);
        if (!enabled) throw new Error("GenUI authoring is disabled by the composer toggle.");
        if (!state || state.signal.aborted) throw new Error("GenUI guidance requires an active agent turn with a prompt assembly.");
        state.requested = generation;
        return { loaded: true, scope: "current-turn-next-model-step" };
      },
      presentCall: () => ({ card: "generic", kind: "read", title: "Load GenUI card guidance" })
    }
  };
}
