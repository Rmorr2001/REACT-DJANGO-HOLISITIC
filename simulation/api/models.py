
from django.db import models
from django.utils import timezone
# Create your models here.

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    results = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.id:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        return super().save(*args, **kwargs)

    class Meta:
        ordering = ['-updated_at']

class Node(models.Model):
    DISTRIBUTION_CHOICES = [
        ('Deterministic', 'Deterministic'),
        ('Exponential', 'Exponential'),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='nodes',
        null=False  # Must be False to enforce relationship
    )
    node_name = models.CharField(max_length=100)
    number_of_servers = models.IntegerField(default=1)
    service_rate = models.FloatField(default=1.0)
    service_distribution = models.CharField(
        max_length=30,
        choices=DISTRIBUTION_CHOICES,
        default='Deterministic'
    )
    arrival_rate = models.FloatField(default=0.0)
    arrival_distribution = models.CharField(
        max_length=30,
        choices=DISTRIBUTION_CHOICES,
        blank=True,
        null=True
    )
    routing_probabilities = models.JSONField(
        default=list
    )

    class Meta:
        unique_together = ['project', 'node_name']

    def __str__(self):
        return f"{self.node_name} (Project: {self.project_id})"