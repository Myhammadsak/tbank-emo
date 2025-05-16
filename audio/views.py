from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Audio
from .serializers import AudioSerializer
import json
from .prepare import transcribe, preprocessing
from .parse_and_analyze import parse_dialogue_and_analyze


class AudioViewSet(viewsets.ModelViewSet):
    queryset = Audio.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = AudioSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=self.request.user)
        audio = serializer.save()

        try:
            self.process_and_update_grade(audio)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            audio.delete()
            return Response(
                {"error": f"Ошибка обработки файла: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def process_and_update_grade(self, audio):
        audio_path = audio.audio_file.path

        result = self.processfile(audio_path)

        audio.grade = {
            'client_emotion': result.get('client_emotion'),
            'manager_performance': result.get('manager_performance'),
            'text': result.get('text')
        }
        audio.save()

    def processfile(self, file_name):
        try:
            res = transcribe(file_name)

            res = preprocessing(res)

            res = json.dumps(res, ensure_ascii=False, indent=4)
            text = res
            print(text)

            res = parse_dialogue_and_analyze(res)

            result_data = {
                'client_emotion': res.client_emotion.explanation,
                'manager_performance': res.manager_performance.explanation,
                'text': text
            }

            print("Результат обработки:", result_data)
            return result_data

        except Exception as e:
            print(f"Ошибка в processfile: {str(e)}")
            raise