from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Audio
from .serializers import AudioSerializer
from .transcrib import transcribe, preprocessing
import tempfile
import os
import json
from .parse_and_analyze import parse_dialogue_and_analyze


class AudioViewSet(viewsets.ModelViewSet):
    queryset = Audio.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = AudioSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        audio = serializer.save(user=self.request.user)

        try:
            result = self.process_and_update_grade(audio)
            audio.grade = result
            audio.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            audio.delete()
            return Response(
                {"error": f"Ошибка обработки файла: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def process_and_update_grade(self, audio):
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            for chunk in audio.audio_file.chunks():
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        try:
            text = transcribe(tmp_path)

            dialog_str = preprocessing(text)

            dialog = json.loads(dialog_str)

            json_string = json.dumps(dialog)
            analysis_result = parse_dialogue_and_analyze(json_string)
            res = json.loads(analysis_result)

            result_data = {
                'emotions_client': res['emotions_client'],
                'compliance_with_script': res['compliance_with_script'],
                'effectiveness_of_dialogue': res['effectiveness_of_dialogue'],
                'improvement_suggestions': res['improvement_suggestions']
            }

            return result_data

        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


class AudioCountViewSet(viewsets.ModelViewSet):
    queryset = Audio.objects.all()
    serializer_class = AudioSerializer
    permission_classes = [IsAuthenticated]

    def count(self, request):
        count = self.get_queryset().filter(user=request.user).count()
        return Response({'count': count})


class AudioListViewSet(viewsets.ModelViewSet):
    queryset = Audio.objects.all()
    serializer_class = AudioSerializer
    permission_classes = [IsAuthenticated]

    def count(self, request):
        list = self.get_queryset().filter(user=request.user)
        return Response({'list': list})