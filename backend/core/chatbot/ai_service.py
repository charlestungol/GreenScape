import os
from dotenv import load_dotenv
from openai import AzureOpenAI
from .ai_context import SYSTEM_PROMPT, COMPANY_CONTEXT

load_dotenv()

API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

client = AzureOpenAI(
    api_version=API_VERSION,
    azure_endpoint=ENDPOINT,
    api_key=API_KEY,
)


def get_ai_response(user_message: str) -> str:
    if not user_message or not user_message.strip():
        return "Please enter a message."

    response = client.chat.completions.create(
        model=DEPLOYMENT_NAME,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "system",
                "content": f"Full company information:\n\n{COMPANY_CONTEXT}",
            },
            {"role": "user", "content": user_message.strip()},
        ],
        max_tokens=7000,
    )

    return response.choices[0].message.content.strip()