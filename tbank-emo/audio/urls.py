from django.urls import path
from .views import AudioViewSet, AudioCountViewSet, AudioListViewSet

app_name = 'audio'

urlpatterns = [
    path('audio/', AudioViewSet.as_view({'post': 'create'}), name='audio-analysis'),
    path('audio/count/', AudioCountViewSet.as_view({'get': 'count'}), name='audio-count'),
    path('audio/list/', AudioListViewSet.as_view({'get': 'list'}), name='audio-list')
]