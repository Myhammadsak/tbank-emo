from rest_framework import serializers
from .models import Audio


class AudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audio
        fields = '__all__'
        read_only_fields = ('grade', 'created_at', 'user')