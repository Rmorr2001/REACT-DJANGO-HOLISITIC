from rest_framework import serializers
from .models import Project, Node
from django.utils import timezone

class NodeSerializer(serializers.ModelSerializer):
    routing_probabilities = serializers.ListField(
        child=serializers.FloatField(min_value=0, max_value=1),
        allow_empty=True
    )
    # Add explicit project field
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Node
        fields = '__all__'  # Now includes explicit project field
        read_only_fields = ['id']

    def validate(self, data):
        # Existing validation logic
        return data
        # Validate probability sums
        if 'routing_probabilities' in data:
            total = sum(data['routing_probabilities'])
            if total > 1.0 + 1e-6:  # Allow for floating point precision
                raise serializers.ValidationError(
                    f"Total routing probabilities ({total:.2f}) exceed 1.0"
                )
        return data





class ProjectSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        return representation