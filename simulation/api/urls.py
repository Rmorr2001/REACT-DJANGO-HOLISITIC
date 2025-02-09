from django.urls import path
from .views import *

urlpatterns = [
    path('projects/', StartProject.as_view(), name='start-project'),
    path('projects/<int:project_id>/nodes/', ConfigureNodes.as_view(), name='configure-nodes'),
    path('projects/<int:project_id>/simulate/', RunSimulation.as_view(), name='run-simulation'),
    path('projects/<int:project_id>/results/', SimulationResults.as_view(), name='simulation-results'),
    path('projects/<int:pk>/', project_detail, name='project-detail'),
    path('projects/<int:project_id>/results/', simulation_results, name='simulation-results')
]