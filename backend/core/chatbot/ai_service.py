import os
import re
from dotenv import load_dotenv
from openai import AzureOpenAI
from .ai_context import SYSTEM_PROMPT, COMPANY_CONTEXT

load_dotenv()

API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

client = None
if API_KEY and ENDPOINT and DEPLOYMENT_NAME:
    client = AzureOpenAI(
        api_version=API_VERSION,
        azure_endpoint=ENDPOINT,
        api_key=API_KEY,
    )


def is_greeting(message: str) -> bool:
    normalized = message.strip().lower()
    greetings = {
        "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
        "hiya", "yo", "sup", "heyy", "helloo"
    }
    return normalized in greetings


def is_vague_message(message: str) -> bool:
    normalized = re.sub(r"\s+", " ", message.strip().lower())
    vague_inputs = {
        "price", "pricing", "quote", "install", "installation", "service",
        "services", "help", "more info", "tell me more", "how much", "book"
    }
    return normalized in vague_inputs


def format_bullets(text: str) -> str:
    lines = text.splitlines()
    normalized_lines = []

    for line in lines:
        stripped = line.lstrip()

        if stripped.startswith("- "):
            indent = len(line) - len(line.lstrip())
            normalized_lines.append((" " * indent) + "• " + stripped[2:])
        else:
            normalized_lines.append(line)

    return "\n".join(normalized_lines).strip()


def build_messages(user_message: str, conversation_history=None):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "system",
            "content": f"Full company information:\n\n{COMPANY_CONTEXT}",
        },
    ]

    if conversation_history:
        for item in conversation_history[-8:]:
            role = item.get("role", "").strip()
            content = item.get("content", "").strip()

            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message.strip()})
    return messages


def get_ai_response(user_message: str, conversation_history=None) -> str:
    if not user_message or not user_message.strip():
        return "Please enter a message."

    trimmed_message = user_message.strip()

    if is_greeting(trimmed_message):
        return (
            "Hi! I’m the Greenscape assistant. How can I help you today with "
            "irrigation, lighting, maintenance, pricing, or winterization?"
        )

    if is_vague_message(trimmed_message):
        return (
            "I’d be happy to help. Could you tell me a bit more about what you need?\n"
            "• The service you’re asking about\n"
            "• Whether it’s residential or commercial\n"
            "• Any details like number of zones, property size, or location"
        )

    if client is None:
        return (
            "Sorry, the chatbot is temporarily unavailable right now. "
            "Please try again later."
        )

    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=build_messages(trimmed_message, conversation_history),
            max_completion_tokens=7000,
        )

        content = response.choices[0].message.content
        if not content:
            return (
                "Sorry, I couldn’t generate a response right now. "
                "Please try again."
            )

        return format_bullets(content)

    except Exception:
        return (
            "Sorry, I’m having trouble reaching the assistant right now. "
            "Please try again in a moment."
        )