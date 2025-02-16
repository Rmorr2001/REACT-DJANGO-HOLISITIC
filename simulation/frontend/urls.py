from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),  # Home
     path('about/', views.index),
    path('new-project/', views.index),  # New Project
    path('projects/', views.index),  # My Projects
    path('projects/<int:project_id>/nodes/', views.index),  # Node Configuration
    path('projects/<int:project_id>/simulate/', views.index),  # Simulation Dashboard
    path('projects/<int:project_id>/results/', views.index),  # Results Dashboard
]
