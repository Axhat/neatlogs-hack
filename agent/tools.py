"""Sandboxed tools for the fixer agent. Everything is confined to the work directory."""
import subprocess
from pathlib import Path

import neatlogs

MAX_OUT = 6000


class Sandbox:
    def __init__(self, root):
        self.root = Path(root).resolve()
        self.cache = {}  # path -> content last returned (only used when cache_reads=True)
        self.cache_reads = False

    def _p(self, rel):
        p = (self.root / rel).resolve()
        if self.root not in p.parents and p != self.root:
            raise ValueError("path escapes sandbox")
        return p

    @neatlogs.span(kind="TOOL", name="list_files")
    def list_files(self):
        return "\n".join(sorted(str(p.relative_to(self.root)) for p in self.root.rglob("*")
                                if p.is_file() and ".venv" not in p.parts and "__pycache__" not in p.parts))

    @neatlogs.span(kind="TOOL", name="read_file")
    def read_file(self, path):
        text = self._p(path).read_text()
        if self.cache_reads:
            if self.cache.get(path) == text:
                return f"[{path} unchanged since you last read it]"
            self.cache[path] = text
        return text

    @neatlogs.span(kind="TOOL", name="write_file")
    def write_file(self, path, content):
        self._p(path).write_text(content)
        return f"wrote {path} ({len(content)} chars)"

    def _run(self, cmd):
        r = subprocess.run(cmd, cwd=self.root, capture_output=True, text=True, timeout=300)
        return (r.stdout + r.stderr)[-MAX_OUT:], r.returncode

    @neatlogs.span(kind="TOOL", name="run_tests")
    def run_tests(self):
        out, rc = self._run([str(self.root / ".venv/bin/python"), "-m", "pytest", "-q", "-x", "--no-header", "-p", "no:warnings"])
        return f"exit={rc}\n{out}"

    @neatlogs.span(kind="TOOL", name="install_requirements")
    def install_requirements(self):
        out, rc = self._run(["uv", "pip", "install", "-q", "--python", str(self.root / ".venv/bin/python"), "-r", "requirements.txt"])
        return f"exit={rc}\n{out}"


TOOL_SCHEMAS = [
    {"type": "function", "function": {"name": "list_files", "description": "List project files.", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "read_file", "description": "Read a file.", "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}}},
    {"type": "function", "function": {"name": "write_file", "description": "Overwrite a file with new full content.", "parameters": {"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]}}},
    {"type": "function", "function": {"name": "install_requirements", "description": "Install requirements.txt into the project venv.", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "run_tests", "description": "Run the test suite.", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "finish", "description": "Call when done. summary = plain-language explanation for a non-technical reader.", "parameters": {"type": "object", "properties": {"summary": {"type": "string"}}, "required": ["summary"]}}},
]
