import os
from os.path import isfile
import json
from pathlib import Path
from .prepare import preprocessing, transcribe
from .analyze_dialogue import analyze_dialogue
import pandas as pd

try:
    df = pd.read_excel('data.xlsx')
except:
    df = pd.DataFrame(columns=['date', 'manager_id', 'manager_score', 'manager_explanation', 'client_emotion', 'client_explanation'])

def parse_dialogue_and_analyze(json_string):
    # Загрузка данных
    data = json.loads(json_string)

    # print(data)

    # Извлекаем первый диалог
    first_dialog = data
    lines = first_dialog

    # Формируем текст диалога в виде: Менеджер: ... Клиент: ...
    dialogue_text = "\n".join(
        f"{'Менеджер' if line['role'] == 'manager' else 'Клиент'}: {line['text']}" for line in lines
    )

    print("=== Отправляем следующий диалог в LLM ===")
    # Отправляем в LLM для анализа
    analysis_result = analyze_dialogue(dialogue_text)

    # print(analysis_result)
    # response = analysis_result.response

    if analysis_result:
        print("=== Результат анализа ===")
        print(analysis_result.model_dump_json(indent=2))

        df.loc[len(df)] = {'date': None, 'manager_id': None, 'manager_score': analysis_result.manager_performance.score, 'manager_explanation': analysis_result.manager_performance.explanation,
                   'client_emotion': analysis_result.client_emotion.score, 'client_explanation': analysis_result.client_emotion.explanation}
        df.to_excel('data.xlsx', index=False)
        print('СЕЙЧАС ВСЕ БУДЕТ')
        print(df)
        print('НУ ВРОДЕ БЫЛО')
        return analysis_result
    else:
        print("Анализ не удался или модель отказалась отвечать.")
        return None

if __name__ == "__main__":
    response = analyze_dialogue('dialog.json')
    print(response)

    res = transcribe('call.mp3')
    res = preprocessing(res)
    res = json.dumps(res, ensure_ascii=False, indent=4)
    res = parse_dialogue_and_analyze(res)

    print(res)
