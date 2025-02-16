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

class ProjectDetail(APIView):
    def get(self, request, pk):
        logger.debug(f"Attempting to fetch project with ID: {pk}")
        try:
            project = get_object_or_404(Project, pk=pk)
            serializer = ProjectSerializer(project)
            logger.debug(f"Successfully fetched project: {project.id}")
            return Response(serializer.data)
        except Project.DoesNotExist:
            logger.error(f"Project with ID {pk} not found")
            return Response(
                {'error': f'Project with ID {pk} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching project {pk}: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProjectList(APIView):
    """Get all projects or create a new one"""
    def get(self, request):
        """Get all projects, sorted by updated_at"""
        try:
            projects = Project.objects.all().order_by('-updated_at')
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching projects: {str(e)}")
            return Response(
                {'error': 'Failed to fetch projects'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Create a new project"""
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            logger.debug(f"Project created with ID: {project.id}")
            return Response({
                'message': 'Project created successfully',
                'project': ProjectSerializer(project).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RecentProjects(APIView):
    """Get the most recently updated projects"""
    def get(self, request):
        try:
            # Get the 3 most recently updated projects
            recent_projects = Project.objects.all().order_by('-updated_at')[:3]
            serializer = ProjectSerializer(recent_projects, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching recent projects: {str(e)}")
            return Response(
                {'error': 'Failed to fetch recent projects'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
def project_detail(request, pk):
    """Get details for a specific project"""
    project = get_object_or_404(Project, pk=pk)
    serializer = ProjectSerializer(project)
    return Response(serializer.data)
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

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class StartProject(APIView):
    def post(self, request):
        try:
            logger.debug(f"Received project creation request: {request.data}")
            
            # Only pass name and description to serializer
            project_data = {
                'name': request.data.get('name'),
                'description': request.data.get('description', '')
            }
            
            serializer = ProjectSerializer(data=project_data)
            if serializer.is_valid():
                project = serializer.save()
                logger.debug(f"Project created successfully with ID: {project.id}")
                
                return Response({
                    'message': 'Project created successfully',
                    'project_id': project.id,
                    'project': ProjectSerializer(project).data
                }, status=status.HTTP_201_CREATED)
            
            logger.error(f"Validation errors: {serializer.errors}")
            return Response({
                'error': 'Invalid project data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Unexpected error creating project: {str(e)}")
            return Response({
                'error': 'Failed to create project',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ConfigureNodes(APIView):
    def get(self, request, project_id):
        """Retrieve node configuration for a project"""
        try:
            project = get_object_or_404(Project, id=project_id)
            nodes = project.nodes.all()
            
            # Convert nodes to the expected format
            nodes_data = []
            for node in nodes:
                node_data = {
                    'node_name': node.node_name,
                    'service_distribution': node.service_distribution,
                    'service_rate': node.service_rate,
                    'number_of_servers': node.number_of_servers,
                    'arrival_distribution': node.arrival_distribution,
                    'arrival_rate': node.arrival_rate,
                    'routing_probabilities': node.routing_probabilities
                }
                nodes_data.append(node_data)
            
            logger.debug(f"Retrieved {len(nodes_data)} nodes for project {project_id}")
            return Response({
                'nodes': nodes_data
            })
            
        except Project.DoesNotExist:
            logger.error(f"Project {project_id} not found")
            return Response(
                {'error': f'Project with ID {project_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving nodes for project {project_id}: {str(e)}")
            return Response(
                {'error': f'Error retrieving nodes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, project_id):
        """Configure nodes for a project"""
        try:
            project = get_object_or_404(Project, id=project_id)
            nodes_data = request.data.get('nodes', [])
            
            logger.debug(f"Received nodes data for Project {project_id}: {nodes_data}")
            
            # Clear existing nodes
            project.nodes.all().delete()
            
            created_nodes = []
            for node_data in nodes_data:
                # Add project reference
                node_data['project'] = project.id
                
                serializer = NodeSerializer(data=node_data)
                if not serializer.is_valid():
                    logger.error(f"Invalid node data: {node_data}")
                    logger.error(f"Validation errors: {serializer.errors}")
                    return Response({
                        'error': 'Invalid node data',
                        'details': serializer.errors
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    node = serializer.save()
                    created_nodes.append(node)
                except Exception as e:
                    logger.error(f"Error saving node: {str(e)}")
                    return Response({
                        'error': f'Error saving node: {str(e)}'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Create routing matrix
            routing_matrix = [node.routing_probabilities for node in created_nodes]
            
            # Validate matrix dimensions
            node_count = len(created_nodes)
            if any(len(row) != node_count for row in routing_matrix):
                logger.error("Invalid routing matrix dimensions")
                return Response({
                    'error': 'Routing probabilities must match node count'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update project metadata
            project.results = {
                'routing_matrix': routing_matrix,
                'node_count': node_count,
                'last_updated': timezone.now().isoformat()
            }
            project.save()
            
            logger.debug(f"Successfully saved {len(created_nodes)} nodes")
            return Response({
                'message': 'Nodes configured successfully',
                'node_count': len(created_nodes)
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error configuring nodes: {str(e)}")
            return Response({
                'error': f'Error configuring nodes: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
