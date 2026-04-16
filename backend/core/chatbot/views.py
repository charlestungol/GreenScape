import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405,
        )

    try:
        from .ai_service import get_ai_response

        data = json.loads(request.body or "{}")
        user_message = str(data.get("message", "")).strip()
        history = data.get("history", [])

        if not user_message:
            return JsonResponse({"error": "Message is required."}, status=400)

        if not isinstance(history, list):
            history = []

        cleaned_history = []
        for item in history[-10:]:
            if not isinstance(item, dict):
                continue

            role = str(item.get("role", "")).strip()
            content = str(item.get("content", "")).strip()

            if role in {"user", "assistant"} and content:
                cleaned_history.append(
                    {
                        "role": role,
                        "content": content,
                    }
                )

        ai_reply = get_ai_response(user_message, cleaned_history)
        return JsonResponse({"response": ai_reply}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)
    except Exception:
        return JsonResponse(
            {
                "error": (
                    "Sorry, something went wrong while processing the chat request."
                )
            },
            status=500,
        )