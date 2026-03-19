import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .ai_service import get_ai_response


@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are allowed."}, status=405)

    try:
        data = json.loads(request.body)
        user_message = data.get("message", "").strip()

        if not user_message:
            return JsonResponse({"error": "Message is required."}, status=400)

        ai_reply = get_ai_response(user_message)
        return JsonResponse({"response": ai_reply})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)