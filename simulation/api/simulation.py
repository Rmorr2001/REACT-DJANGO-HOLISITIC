from django.shortcuts import get_object_or_404
from django.utils import timezone
import ciw
import logging
import traceback
import numpy as np
from .models import Project, Node
from .get_simulation_results import (
    process_simulation_records,
    calculate_distribution_stats,
    calculate_rolling_statistics
)

def run_simulation_function(request, logger, project_id):
    project = get_object_or_404(Project, id=project_id)
    nodes = project.nodes.all().order_by('id')
    node_count = nodes.count()
    
    logger.info(f"Running simulation for project {project_id} with {node_count} nodes")
    
    if node_count == 0:
        raise ValueError("No nodes configured for simulation")
    
    try:
        # Create arrival distributions
        arrival_distributions = []
        for i, node in enumerate(nodes):
            if i == 0:  # First node
                if not node.arrival_distribution or not node.arrival_rate:
                    raise ValueError("First node must have arrival distribution and rate configured")
                arrival_distributions.append(
                    create_distribution(node.arrival_distribution, node.arrival_rate)
                )
            else:
                arrival_distributions.append(None)
        
        # Create service distributions
        service_distributions = []
        for node in nodes:
            if not node.service_distribution or not node.service_rate:
                raise ValueError(f"Node {node.node_name} must have service distribution and rate configured")
            service_distributions.append(
                create_distribution(node.service_distribution, node.service_rate)
            )
        
        # Get number of servers
        number_of_servers = [node.number_of_servers for node in nodes]
        
        # Get routing matrix and ensure proper dimensions
        routing_matrix = []
        for node in nodes:
            probabilities = node.routing_probabilities
            # Ensure probabilities list matches node count
            if len(probabilities) != node_count:
                probabilities = [0.0] * node_count
            routing_matrix.append([float(p) for p in probabilities])
        
        # Validate routing matrix
        for i, row in enumerate(routing_matrix):
            row_sum = sum(row)
            if row_sum > 1.0 + 1e-6:  # Allow for floating point precision
                raise ValueError(f"Routing probabilities for node {i+1} sum to {row_sum}, which exceeds 1.0")
            if any(p < 0.0 for p in row):
                raise ValueError(f"Routing probabilities for node {i+1} contain negative values")
        
        logger.debug(f"Network configuration:")
        logger.debug(f"Arrivals: {arrival_distributions}")
        logger.debug(f"Services: {service_distributions}")
        logger.debug(f"Servers: {number_of_servers}")
        logger.debug(f"Routing: {routing_matrix}")
        
        # Create and run simulation
        N = ciw.create_network(
            arrival_distributions=arrival_distributions,
            service_distributions=service_distributions,
            routing=routing_matrix,
            number_of_servers=number_of_servers
        )
        
        ciw.seed(1)  # For reproducibility
        Q = ciw.Simulation(N)
        Q.simulate_until_max_time(1440)  # 24 hours in minutes
        
        results = Q.get_all_records()
        if not results:
            raise ValueError("No results generated from simulation")
            
        # Create node mapping for results processing
        node_mapping = {i: node.node_name for i, node in enumerate(nodes)}
        
        # Process results with enhanced statistics
        processed_results = process_simulation_records(results, node_mapping)
        
        # Add configuration details to results
        processed_results['configuration'] = {
            'number_of_servers': number_of_servers,
            'service_distributions': [
                {'type': node.service_distribution, 'rate': node.service_rate}
                for node in nodes
            ],
            'arrival_distributions': [
                {'type': nodes[0].arrival_distribution, 'rate': nodes[0].arrival_rate}
            ] + [None] * (node_count - 1),
            'routing_matrix': routing_matrix
        }
        
        # Update simulation metadata
        processed_results['metadata'].update({
            'simulation_time': 1440,
            'ran_at': timezone.now().isoformat()
        })
        
        # Save results
        project.results = processed_results
        project.save()
        
        logger.info(f"Simulation completed successfully for project {project_id}")
        logger.debug(f"Processed results: {processed_results}")
        return project
        
    except Exception as e:
        logger.error(f"Simulation error for project {project_id}: {str(e)}", exc_info=True)
        raise e

def create_distribution(dist_type, rate):
    """Helper function to create CIW distribution objects"""
    if dist_type == 'Deterministic':
        return ciw.dists.Deterministic(value=float(rate))
    elif dist_type == 'Exponential':
        return ciw.dists.Exponential(rate=float(rate))
    else:
        raise ValueError(f"Unsupported distribution type: {dist_type}")