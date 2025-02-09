from rest_framework import serializers
from .models import Project, Node

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
    nodes = NodeSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'created_at',
            'updated_at', 'results', 'nodes'
        ]

class ProjectSerializer(serializers.ModelSerializer):
    nodes = NodeSerializer(many=True, read_only=True)
    results = serializers.JSONField(read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'nodes', 'results']