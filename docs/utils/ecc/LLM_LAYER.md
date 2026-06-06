# ECC — Python LLM Abstraction Layer

> Source: `utils/ECC/src/llm/` · Language: Python 3.12+ · Type-checked: yes (pyright)
> Config: `utils/ECC/pyproject.toml`

The LLM layer is a provider-agnostic Python interface that allows ECC Python scripts and the
`ecc_dashboard.py` to interact with multiple LLM backends through a unified API. Switching
providers requires no change to calling code — only the `resolver` selects the backend.

---

## Module Structure

```
src/
└── llm/
    ├── __init__.py       # Public exports
    ├── core/             # Base types and abstract interface
    │   ├── types.py      # LLMProvider, LLMInput, LLMOutput, Message, ToolCall
    │   └── interface.py  # Abstract base class ILLMProvider
    ├── providers/        # Concrete backend implementations
    │   ├── claude.py     # Anthropic Claude (claude-sonnet-4-6 default)
    │   ├── openai.py     # OpenAI GPT (gpt-4o default)
    │   ├── ollama.py     # Local Ollama models (llama3, mistral, etc.)
    │   ├── astraflow.py  # AstraFlow provider
    │   └── resolver.py   # Auto-detect and select provider from env
    ├── prompt/           # Prompt construction and templating
    │   ├── builder.py    # Fluent prompt builder
    │   └── templates.py  # Named prompt templates
    ├── tools/            # Tool execution framework
    │   ├── registry.py   # ToolRegistry — register and lookup tool handlers
    │   └── executor.py   # ToolExecutor — invoke tools from LLM tool_calls
    └── cli/              # Interactive provider selector
        └── selector.py   # Terminal UI: pick provider and model interactively
```

---

## Core Types (`core/types.py`)

```python
@dataclass
class Message:
    role: Literal["user", "assistant", "system", "tool"]
    content: str
    tool_call_id: str | None = None

@dataclass
class LLMInput:
    messages: list[Message]
    tools: list[ToolDefinition] | None = None
    system: str | None = None
    max_tokens: int = 4096
    temperature: float = 0.0

@dataclass
class ToolCall:
    id: str
    name: str
    arguments: dict[str, Any]

@dataclass
class LLMOutput:
    content: str | None
    tool_calls: list[ToolCall]
    input_tokens: int
    output_tokens: int
    model: str
    stop_reason: Literal["end_turn", "tool_use", "max_tokens"]
```

---

## Abstract Interface (`core/interface.py`)

```python
class ILLMProvider(ABC):
    @abstractmethod
    async def complete(self, input: LLMInput) -> LLMOutput: ...

    @abstractmethod
    def supports_tools(self) -> bool: ...

    @property
    @abstractmethod
    def model_id(self) -> str: ...
```

---

## Providers (`providers/`)

### Claude (`providers/claude.py`)

- Backend: `anthropic` SDK
- Default model: `claude-sonnet-4-6`
- Supports: tool use, vision, streaming (partial)
- Auth: `ANTHROPIC_API_KEY` env var
- Prompt caching: enabled automatically for system prompts > 1024 tokens

```python
from llm.providers.claude import ClaudeProvider

provider = ClaudeProvider(model="claude-sonnet-4-6")
output = await provider.complete(LLMInput(messages=[...]))
```

### OpenAI (`providers/openai.py`)

- Backend: `openai` SDK
- Default model: `gpt-4o`
- Supports: tool use, vision, streaming
- Auth: `OPENAI_API_KEY` env var

### Ollama (`providers/ollama.py`)

- Backend: `httpx` (calls local Ollama REST API)
- Default model: `llama3`
- Supports: completion only (no tool use in base config)
- Auth: none (local)
- Endpoint: `OLLAMA_HOST` (default `http://localhost:11434`)

### AstraFlow (`providers/astraflow.py`)

- Backend: AstraFlow HTTP API
- Auth: `ASTRAFLOW_API_KEY` env var

### Resolver (`providers/resolver.py`)

Auto-selects provider based on available environment variables:

```
ANTHROPIC_API_KEY set  →  ClaudeProvider
OPENAI_API_KEY set     →  OpenAIProvider
OLLAMA_HOST reachable  →  OllamaProvider
(default)              →  OllamaProvider (localhost)
```

```python
from llm.providers.resolver import get_provider

provider = get_provider()  # auto-selects
```

---

## Tool Registry & Executor (`tools/`)

### ToolRegistry

Register Python functions as LLM-callable tools:

```python
from llm.tools.registry import ToolRegistry

registry = ToolRegistry()

@registry.tool(description="Read a file by path")
def read_file(path: str) -> str:
    with open(path) as f:
        return f.read()
```

### ToolExecutor

Execute tool calls returned by the LLM:

```python
from llm.tools.executor import ToolExecutor

executor = ToolExecutor(registry)
results = await executor.run(output.tool_calls)
```

---

## Prompt Builder (`prompt/builder.py`)

Fluent interface for constructing multi-turn conversations:

```python
from llm.prompt.builder import PromptBuilder

prompt = (
    PromptBuilder()
    .system("You are a code reviewer.")
    .user("Review this function: ...")
    .build()
)
```

---

## Interactive CLI (`cli/selector.py`)

Terminal UI for selecting provider and model interactively:

```python
from llm.cli.selector import interactive_select

provider = interactive_select()  # shows TUI picker
```

Or via CLI:

```bash
python -m llm.cli.selector
```

---

## Public Exports (`__init__.py`)

```python
from llm import (
    ILLMProvider,
    LLMInput,
    LLMOutput,
    Message,
    ToolCall,
    ToolRegistry,
    ToolExecutor,
    get_provider,
    interactive_select,
)
```

---

## Configuration

`pyproject.toml` at ECC root:

```toml
[tool.pyright]
pythonVersion = "3.12"
strict = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

---

## Testing

```bash
# Run all Python tests
python -m pytest tests/

# Run LLM provider tests only
python -m pytest tests/lib/ -k "llm"

# Run with a specific provider
ANTHROPIC_API_KEY=sk-... python -m pytest tests/lib/test_claude.py
```

---

## See Also

- [ECC2.md](ECC2.md) — Rust control plane (uses the LLM layer via Python subprocess)
- `utils/ECC/ecc_dashboard.py` — 41K-line Python dashboard that imports this module
- `utils/ECC/pyproject.toml` — Python project configuration
- `utils/ECC/tests/` — Python test suite (conftest.py, pytest fixtures)
