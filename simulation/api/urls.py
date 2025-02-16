from django.urls import path
from .views import *

urlpatterns = [
    path('projects/', ProjectList.as_view(), name='project-list'),
    path('projects/recent/', RecentProjects.as_view(), name='recent-projects'),
    path('projects/<int:pk>/', ProjectDetail.as_view(), name='project-detail'),
    path('projects/<int:project_id>/nodes/', ConfigureNodes.as_view(), name='configure-nodes'),
    path('projects/<int:project_id>/simulate/', RunSimulation.as_view(), name='run-simulation'),
    path('projects/<int:project_id>/results/', SimulationResults.as_view(), name='simulation-results'),
]