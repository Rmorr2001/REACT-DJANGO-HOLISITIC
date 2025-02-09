from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Project, Node
import ciw
from .get_simulation_results import analyze_simulation_results, get_node_utilization
import logging

from django.utils import timezone
'''
This page is dedicated to take the inputs of a bunch of nodes assigned to a project, and then compile

'''


# simulation.py
def run_simulation_function(request, logger, project_id):
    project = get_object_or_404(Project, id=project_id)
    nodes = project.nodes.all().order_by('id')
    node_count = nodes.count()
    
    logger.info(f"Running simulation for project {project_id} with {node_count} nodes")
    
    def create_distribution(dist_type, rate):
        """Helper function to create CIW distribution objects"""
        return (ciw.dists.Deterministic(value=float(rate)) if dist_type == 'Deterministic' 
                else ciw.dists.Exponential(rate=float(rate)))
    
    try:
        # Create arrival distributions (only first node has external arrivals)
        arrival_distributions = [
            create_distribution(nodes[0].arrival_distribution, nodes[0].arrival_rate)
        ] + [None] * (node_count - 1)
        
        # Create service distributions
        service_distributions = [
            create_distribution(node.service_distribution, node.service_rate)
            for node in nodes
        ]
        
        # Get number of servers per node
        number_of_servers = [node.number_of_servers for node in nodes]
        
        # Get and validate routing matrix
        routing_matrix = project.results.get('routing_matrix', [])
        
        # Convert routing matrix values to float
        routing_matrix = [[float(prob) for prob in row] for row in routing_matrix]
        
        # Validate probabilities
        for i, row in enumerate(routing_matrix):
            row_sum = sum(row)
            if row_sum > 1.0:
                raise ValueError(f"Row {i+1} probabilities sum to {row_sum}, which exceeds 1.0")
            if any(prob < 0.0 for prob in row):
                raise ValueError(f"Row {i+1} contains negative probabilities")
        
        logger.debug(f"Network configuration: arrivals={arrival_distributions}, "
                    f"services={service_distributions}, servers={number_of_servers}")
        logger.debug(f"Routing matrix: {routing_matrix}")
        
        # Create and run simulation
        N = ciw.create_network(
            arrival_distributions=arrival_distributions,
            service_distributions=service_distributions,
            number_of_servers=number_of_servers,
            routing=routing_matrix
        )
        
        ciw.seed(1)  # For reproducibility
        Q = ciw.Simulation(N)
        Q.simulate_until_max_time(1440)  # 24 hours in minutes
        
        results = Q.get_all_records()
        if not results:
            raise ValueError("No results generated from simulation")
        
        # Get server counts for utilization calculation
        server_counts = {i: nodes[i].number_of_servers for i in range(node_count)}
        
        # Analyze results with enhanced functions
        analysis = analyze_simulation_results(results)
        utilization = get_node_utilization(results, server_counts)
        
        # Combine all results
        all_results = {
            'analysis': analysis,
            'utilization': utilization,
            'routing_matrix': routing_matrix,
            'configuration': {
                'number_of_servers': number_of_servers,
                'service_distributions': [
                    {'type': node.service_distribution, 'rate': node.service_rate}
                    for node in nodes
                ],
                'arrival_distributions': [
                    {'type': nodes[0].arrival_distribution, 'rate': nodes[0].arrival_rate}
                ] + [None] * (node_count - 1)
            },
            'simulation_metadata': {
                'duration_minutes': 1440,
                'seed': 1,
                'timestamp': str(timezone.now())
            }
        }
        
        # Save results
        project.results = all_results
        project.save()
        
        logger.info(f"Simulation completed successfully for project {project_id}")
        logger.debug(f"Saved results: {all_results}")
        
        return project
        
    except Exception as e:
        logger.error(f"Simulation error for project {project_id}: {str(e)}", exc_info=True)
        raise e