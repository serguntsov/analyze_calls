import json

from openai import OpenAI

from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL

_client = None


def _get_client() -> OpenAI | None:
    global _client
    if not DEEPSEEK_API_KEY:
        return None
    if _client is None:
        _client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    return _client


def analyze(transcript_text: str) -> dict:
    """
    Analyze transcript using DeepSeek Chat API.

    Returns:
        {"topics": ["topic1", ...], "summary": "..."}
    """
    client = _get_client()
    if client is None:
        return {"topics": [], "summary": ""}

    prompt = (
        "Проанализируй транскрипт телефонного звонка оператора с клиентом.\n"
        "Верни ТОЛЬКО валидный JSON (без markdown-обёрток) с полями:\n"
        '- "topics": список основных тем разговора (максимум 5 тем, короткие фразы)\n'
        '- "summary": краткое описание звонка (2-3 предложения на русском языке)\n\n'
        f"Транскрипт:\n{transcript_text}"
    )

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    content = response.choices[0].message.content or "{}"

    # Strip markdown code fences if present
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        lines = lines[1:]  # remove opening ```json
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines)

    try:
        data = json.loads(content)
        return {
            "topics": data.get("topics", [])[:5],
            "summary": data.get("summary", ""),
        }
    except json.JSONDecodeError:
        return {"topics": [], "summary": content[:500]}
