import whisper
import time
import requests

model = whisper.load_model("small")


def mistral_req(prompt):
    start = time.time()
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "mistral", "prompt": prompt, "stream": False},
    )
    data = response.json()
    end = time.time()
    print(end - start)
    return data["response"]


def transcribe(filename: str):
    result = model.transcribe(filename)

    return result["text"]


def preprocessing(text) -> list:
    prompt = 'Сейчас я отправлю тебе текст телефонного разговора. В разговорах, которые будут поступать на вход спикерами выступают 2 человека - клиент компании и менеджер компании, обрабатывающий запрос клента. Твоя задача - разделять текст на спикеров. Выводи ответ в формате [{"role": *роль спикера (manager или client)*, "text": *текст, который он произнес*}, (и так далее)], чтобы ответ можно было преобразовать в json файл. Не нумеруй реплики. Выводи реплики в том порядке, в котором они поступают на вход. Также в начале некоторых разговоров если реплики робота, которые можно пропускать. Все на русском языке.'
    prompt += f"Вот сам тест: {text}"

    response = mistral_req(prompt)

    return response


if __name__ == "__main__":
    text = transcribe("call.txt")
    print(preprocessing(text))