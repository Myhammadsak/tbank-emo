from pydantic import BaseModel, Field
from typing import Literal


class EmotionAnalysis(BaseModel):
    explanation: str = Field(..., description="Объяснение, почему выставлена именно такая оценка")
    score: Literal[-1, 0, 1] = Field(..., description="Эмоциональная оценка клиента: 1 — положительная, 0 — нейтральная, -1 — отрицательная")


class ManagerPerformance(BaseModel):
    explanation: str = Field(..., description="Объяснение оценки, как менеджер следовал скрипту")
    score: Literal[-1, 0, 1] = Field(..., description="Оценка качества работы менеджера: 1 — хорошая, 0 — нейтральная, -1 — плохая")


class DialogueAnalysis(BaseModel):
    client_emotion: EmotionAnalysis
    manager_performance: ManagerPerformance


class Replic(BaseModel):
    timestamp: str
    role: str
    text: str


class Response(BaseModel):
    speakers: list[Replic]
