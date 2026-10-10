"""Smoke test: one traced LLM call through LiteLLM -> neatlogs."""
import os
from dotenv import load_dotenv
load_dotenv()
import neatlogs, openai

neatlogs.init(workflow_name="blast-radius", tags=["smoke"])
client = neatlogs.wrap(openai.OpenAI(base_url=os.environ["LITELLM_BASE_URL"], api_key=os.environ["LITELLM_API_KEY"]))

@neatlogs.span(kind="AGENT", name="hello-agent", role="smoke test", goal="prove tracing works")
def run():
    r = client.chat.completions.create(model=os.environ["MODEL_FAST"], max_tokens=20,
        messages=[{"role": "user", "content": "Say hello in 3 words."}])
    return r.choices[0].message.content

print(run())
neatlogs.flush()
