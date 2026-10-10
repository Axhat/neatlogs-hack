"""Fix agent (v1, naive): LLM tool-calling loop that upgrades one vulnerable package and gets tests green."""
import json
import os

import neatlogs
import openai

from .tools import TOOL_SCHEMAS, Sandbox

# $/1M tokens (input, output) -- ESTIMATES for cost accounting, not billing data.
PRICES = {"claude-sonnet-4.6": (3.0, 15.0), "claude-haiku": (1.0, 5.0), "nova-lite": (0.06, 0.24)}

SYSTEM = """You are a dependency-upgrade engineer. Upgrade the given package to the target version to fix the
security advisories. Edit requirements.txt, install, run the tests, and fix any code that breaks.
The tests must pass at the end. Do not change tests. Call finish with a plain-language summary."""


def make_client():
    return neatlogs.wrap(openai.OpenAI(base_url=os.environ["LITELLM_BASE_URL"], api_key=os.environ["LITELLM_API_KEY"]))


@neatlogs.span(kind="AGENT", name="fixer", role="dependency upgrade engineer", goal="fix CVE and keep tests green")
def fix_package(client, sandbox: Sandbox, finding, max_steps=25, model=None):
    model = model or os.environ["MODEL_STRONG"]
    msgs = [{"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Upgrade {finding['package']} from {finding['current']} to {finding['target']}. "
                                        f"Advisories: {', '.join(finding['advisories'])}."}]
    stats = {"steps": 0, "tool_calls": 0, "tokens_in": 0, "tokens_out": 0, "tool_counts": {}, "summary": None}
    for _ in range(max_steps):
        r = client.chat.completions.create(model=model, messages=msgs, tools=TOOL_SCHEMAS, max_tokens=4000)
        stats["steps"] += 1
        stats["tokens_in"] += r.usage.prompt_tokens
        stats["tokens_out"] += r.usage.completion_tokens
        m = r.choices[0].message
        msgs.append(m.model_dump(exclude_none=True))
        if not m.tool_calls:
            break
        done = False
        for tc in m.tool_calls:
            name, args = tc.function.name, json.loads(tc.function.arguments or "{}")
            stats["tool_calls"] += 1
            stats["tool_counts"][name] = stats["tool_counts"].get(name, 0) + 1
            if name == "finish":
                stats["summary"], out, done = args["summary"], "ok", True
            else:
                try:
                    out = getattr(sandbox, name)(**args)
                except Exception as e:  # tool errors go back to the model
                    out = f"ERROR: {e}"
            msgs.append({"role": "tool", "tool_call_id": tc.id, "content": out})
        if done:
            break
    pin, pout = PRICES.get(model, (0, 0))
    stats["cost_usd_est"] = round(stats["tokens_in"] / 1e6 * pin + stats["tokens_out"] / 1e6 * pout, 4)
    return stats


SYSTEM_V2 = """You are a dependency-upgrade engineer. Upgrade ALL listed packages to their target versions in one
pass, fixing the listed security advisories. The relevant source files are already provided below -- do not
list or re-read them. Edit requirements.txt, call install_requirements once, run_tests, and fix any code that
breaks (only edit files shown). Never change tests. When tests pass, call finish with a short plain-language
summary stating only facts about what you actually changed."""

V2_TOOLS = [t for t in TOOL_SCHEMAS if t["function"]["name"] != "list_files"]


@neatlogs.span(kind="AGENT", name="fixer-v2", role="dependency upgrade engineer", goal="fix all CVEs in one pass, tests green")
def fix_all(client, sandbox: Sandbox, findings, graph, max_steps=15, model=None):
    model = model or os.environ["MODEL_STRONG"]
    sandbox.cache_reads = True
    files = sorted({f for fd in findings for f in graph[fd["package"]]["files"]})
    ctx = "\n\n".join(f"=== {f} ===\n{sandbox.read_file(f)}" for f in ["requirements.txt"] + files)
    todo = "\n".join(f"- {fd['package']} {fd['current']} -> {fd['target']} (used in: {', '.join(graph[fd['package']]['files']) or 'indirect'}; advisories: {len(fd['advisories'])})" for fd in findings)
    msgs = [{"role": "system", "content": SYSTEM_V2},
            {"role": "user", "content": f"Upgrades:\n{todo}\n\nCurrent files:\n{ctx}"}]
    stats = {"steps": 0, "tool_calls": 0, "tokens_in": 0, "tokens_out": 0, "tool_counts": {}, "summary": None}
    for _ in range(max_steps):
        r = client.chat.completions.create(model=model, messages=msgs, tools=V2_TOOLS, max_tokens=4000)
        stats["steps"] += 1
        stats["tokens_in"] += r.usage.prompt_tokens
        stats["tokens_out"] += r.usage.completion_tokens
        m = r.choices[0].message
        msgs.append(m.model_dump(exclude_none=True))
        if not m.tool_calls:
            break
        done = False
        for tc in m.tool_calls:
            name, args = tc.function.name, json.loads(tc.function.arguments or "{}")
            stats["tool_calls"] += 1
            stats["tool_counts"][name] = stats["tool_counts"].get(name, 0) + 1
            if name == "finish":
                stats["summary"], out, done = args["summary"], "ok", True
            else:
                try:
                    out = getattr(sandbox, name)(**args)
                except Exception as e:
                    out = f"ERROR: {e}"
            msgs.append({"role": "tool", "tool_call_id": tc.id, "content": out})
        if done:
            break
    pin, pout = PRICES.get(model, (0, 0))
    stats["cost_usd_est"] = round(stats["tokens_in"] / 1e6 * pin + stats["tokens_out"] / 1e6 * pout, 4)
    return stats
