from openai import OpenAI
from .schemas import DialogueAnalysis
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")


client = OpenAI(api_key=api_key)

SCRIPT_PROMPT = """
Вы — эксперт по качеству обслуживания клиентов. Ниже представлен скрипт, которому должен следовать менеджер:

1. Приветствие клиента
2. Уточнение потребности
3. Предложение решения
4. Ответы на возражения
5. Завершение разговора с благодарностью

На основе диалога проанализируйте:
1. Эмоции клиента — были ли они положительными, нейтральными или отрицательными
2. Насколько менеджер придерживался скрипта и был ли разговор эффективным

В ответ отправь только json файл.
"""


def analyze_dialogue(text: str) -> Optional[DialogueAnalysis]:
    try:
        completion = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SCRIPT_PROMPT},
                {"role": "user", "content": text}
            ],
            response_format=DialogueAnalysis,
        )

        result = completion.choices[0].message

        if result.refusal:
            print("Model refused to respond:", result.refusal)
            return None

        return result.parsed

    except Exception as e:
        print(f"Error during analysis: {e}")
        return None
