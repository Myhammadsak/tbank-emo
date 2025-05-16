from django.contrib.auth.decorators import login_required
from django.urls import path
from .views import AudioViewSet

app_name = 'audio'

urlpatterns = [
    path('audio/', AudioViewSet.as_view({'post': 'create'}), name='audio-analysis'),
]