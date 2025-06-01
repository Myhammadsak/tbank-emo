from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class Audio(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    audio_file = models.FileField(upload_to='audio/')
    grade = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Анализ {self.id}"