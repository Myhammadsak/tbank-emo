import json
import pandas as pd
import time
import requests


try:
  df = pd.read_excel('data.xlsx')
except:
  df = pd.DataFrame(columns=['date', 'manager_id', 'client_focus', 'competence', 'speech_quality',
                             'scripts_and_regulations', 'initiative', 'manager_comment', 'client_emotion'])


def mistral_req(prompt):
    start = time.time()
    response = requests.post(
        'http://localhost:11434/api/generate',
        json={
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }
    )
    data = response.json()
    end = time.time()
    print(end - start)
    return data["response"]


def parse_dialogue_and_analyze(json_string):
    data = json.loads(json_string)

    first_dialog = data
    lines = first_dialog

    dialogue_text = "\n".join(
        f"{'Менеджер' if line['role'] == 'manager' else 'Клиент'}: {line['text']}" for line in lines
    )

    print("=== Отправляем следующий диалог в LLM ===")
    analysis_result = mistral_req(f'Отправляю тебе диалог менеджера и клиента: {dialogue_text}.\n'
                                  f'Вы — эксперт по качеству обслуживания клиентов. Ниже представлен скрипт, которому должен следовать менеджер:\n'
                                  f'1. Приветствие клиента\n'
                                  f'2. Уточнение потребности\n'
                                  f'3. Предложение решения\n'
                                  f'4. Ответы на возражения\n'
                                  f'5. Завершение разговора с благодарностью\n'
                                  f'На основе диалога проанализируйте:\n'
                                  f'1. Эмоции клиента — были ли они положительными/нейтральными/отрицательными\n'
                                  f'2. Описание насколько менеджер придерживался скрипта - положительно/нейтрально/отрицательно\n'
                                  f'3. Описание насколько еффективен был разговор - результативный/нейтралный/нерезультативный\n'
                                  f'4. Дайте советы по улучшению качества работы сотрудника по скрипту\n'
                                  f'В ответ отправь только json файл в следующем формате: emotions_client: положительными/нейтральными/отрицательными, compliance_with_script: положительно/нейтрально/отрицательно, effectiveness_of_dialogue: результативный/нейтралный/нерезультативный, improvement_suggestions: текст.')

    if analysis_result:
        print(analysis_result)
        return analysis_result
    else:
        print("Анализ не удался или модель отказалась отвечать.")
        return None
