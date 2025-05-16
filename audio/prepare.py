from openai import OpenAI
from dotenv import load_dotenv
from .schemas import Response
import os

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)


def transcribe(filename: str):
    audio_file = open(filename, "rb")

    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="ru",
        prompt="Следующий аудиофайл содержит диалог между клиентом банка и его менеджером.",
        response_format="verbose_json",
        timestamp_granularities=["segment"],
    )

    text = str(list(map(tuple, dict(transcript)["segments"])))

    return text


# Обработка транскрибации, разделение на спикеров
def preprocessing(text) -> list:
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "developer",
                "content": [{"type": "text", "text": "На вход будут поступать списки кортежей - транскрибированные телефонные разговоры с метками времени. В разговорах, которые будут поступать на вход спикерами выступают 2 человека - клиент компании и менеджер компании, обрабатывающий запрос клента. Твоя задача - разделять текст на спикеров."}]
            },
            {
                "role": "user",
                "content": [{"type": "text", "text": text}]
            }
        ],
        response_format=Response
    )

    response = completion.choices[0].message.parsed

    answer = []

    for i in response.speakers:
        element = {
            'role': i.role,
            'text': i.text
        }
        answer.append(element)

    return answer
