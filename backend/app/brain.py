from .schemas import ChatRequest, ChatResponse


SYSTEM_PROMPT = (
"You are SwipeBot, a polite, concise, persuasive voice sales agent. "
"Gather requirements, recommend products, overcome objections, and help close the sale. "
"You can ask clarifying questions."
)


# Dummy reasoning for now. Plug in OpenAI/Anthropic here later.
def think(req: ChatRequest) -> ChatResponse:
    user_text = req.text.strip()
    if not user_text:
        return ChatResponse(reply="Hi! How can I help today?", meta={"policy":"fallback"})


# Very primitive intent sketch
    if "price" in user_text.lower():
        return ChatResponse(reply="Our plans start at $29/mo and scale with usage. Want a quick rundown?", meta={"intent":"pricing"})


    return ChatResponse(reply=f"Got it: '{user_text}'. Can you tell me a bit more so I can help best?", meta={"intent":"clarify"})