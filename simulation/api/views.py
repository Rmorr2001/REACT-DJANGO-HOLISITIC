from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from .serializers import ProjectSerializer, NodeSerializer
from .models import Project, Node
from .simulation import run_simulation_function
import logging
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# views.py
from rest_framework import generics

@api_view(['GET'])
def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)
    serializer = ProjectSerializer(project)
    return Response(serializer.data)


@api_view(['GET'])
def simulation_results(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    if not project.results:
        return Response({'detail': 'No results available'}, status=404)
    return Response(project.results)

class StartProject(APIView):
    """Create a new simulation project"""
    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            # Debug log when a project is created
            logger.debug(f"Project created with ID: {project.id}, Data: {request.data}")
            return Response({
                'message': 'Project created successfully',
                'project_id': project.id
            }, status=status.HTTP_201_CREATED)
        logger.debug(f"Failed to create project, Errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConfigureNodes(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        nodes_data = request.data.get('nodes', [])
        
        # Debug log when nodes are posted
        logger.debug(f"Configuring nodes for Project ID: {project_id}, Nodes Data: {nodes_data}")
        
        # Clear existing nodes
        project.nodes.all().delete()
        
        created_nodes = []
        for node_data in nodes_data:
            # Explicitly set project relationship
            node_data['project'] = project.id  # This is CRUCIAL
            
            serializer = NodeSerializer(data=node_data)
            if not serializer.is_valid():
                logger.debug(f"Node data invalid: {node_data}, Errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Save with explicit project assignment
                node = serializer.save(project=project)
                created_nodes.append(node)
            except Exception as e:
                logger.debug(f"Error saving node: {node_data}, Error: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


        # Build routing matrix directly from probabilities
        routing_matrix = [node.routing_probabilities for node in created_nodes]
        
        # Validate matrix dimensions
        node_count = len(created_nodes)
        if any(len(row) != node_count for row in routing_matrix):
            logger.debug(f"Routing matrix validation failed for Project ID: {project_id}")
            return Response(
                {'error': 'Routing probabilities must match node count'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update project with routing matrix
        project.results = {
            'routing_matrix': routing_matrix,
            'metadata': {
                'total_nodes': node_count,
                'created_at': str(timezone.now())
            }
        }
        project.save()

        logger.debug(f"Nodes configured successfully for Project ID: {project_id}, Routing Matrix: {routing_matrix}")
        
        return Response({
            'message': 'Nodes configured successfully',
            'routing_matrix': routing_matrix
        }, status=status.HTTP_201_CREATED)

class RunSimulation(APIView):
    """Run the simulation for a configured project"""
    def post(self, request, project_id):
        try:
            project = run_simulation_function(request, logger, project_id)
            logger.debug(f"Simulation completed for Project ID: {project_id}, Results: {project.results}")
            return Response({
                'message': 'Simulation completed successfully',
                'results': project.results
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.debug(f"Simulation error for Project ID: {project_id}, Error: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SimulationResults(APIView):
    """Retrieve simulation results"""
    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        if not project.results:
            logger.debug(f"No simulation results found for Project ID: {project_id}")
            return Response({
                'message': 'No simulation results found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        logger.debug(f"Simulation results for Project ID: {project_id}: {project.results}")
        return Response(project.results, status=status.HTTP_200_OK)
