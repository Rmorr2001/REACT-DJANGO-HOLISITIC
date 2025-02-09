# get_simulation_results.py
import ciw
from typing import List, Dict
from statistics import mean, median, stdev
from collections import defaultdict

def analyze_simulation_results(results: List[ciw.data_record.DataRecord]) -> Dict:
    """
    Comprehensive analysis of simulation results from a CIW network simulation.
    Provides detailed metrics per node and system-wide statistics.
    """
    if not results:
        raise ValueError("No simulation results provided")

    # Initialize per-node statistics
    node_stats = defaultdict(lambda: {
        'service_times': [],
        'waiting_times': [],
        'flow_times': [],
        'arrivals': 0,
        'completed': 0,
        'blocked_times': [],
        'queue_lengths': defaultdict(list)
    })

    # Collect all timestamps for time-based analysis
    all_timestamps = set()
    
    # Process each record
    for record in results:
        node_id = record.node
        node_stats[node_id]['arrivals'] += 1
        
        # Track service times
        if hasattr(record, 'service_time') and record.service_time is not None:
            node_stats[node_id]['service_times'].append(record.service_time)
            
        # Track waiting times
        if hasattr(record, 'waiting_time') and record.waiting_time is not None:
            node_stats[node_id]['waiting_times'].append(record.waiting_time)
            
        # Calculate and track flow times
        if hasattr(record, 'service_time') and hasattr(record, 'waiting_time'):
            flow_time = record.service_time + record.waiting_time
            node_stats[node_id]['flow_times'].append(flow_time)
            
        # Track completed services
        if hasattr(record, 'exit_date') and record.exit_date is not None:
            node_stats[node_id]['completed'] += 1
            all_timestamps.add(record.exit_date)
            
        # Track arrival times
        if hasattr(record, 'arrival_date') and record.arrival_date is not None:
            all_timestamps.add(record.arrival_date)

    def calculate_stats(data_list):
        """Calculate comprehensive statistics for a list of values"""
        if not data_list:
            return {
                'mean': 0,
                'median': 0,
                'std_dev': 0,
                'min': 0,
                'max': 0,
                'count': 0,
                'percentile_90': 0,
                'percentile_95': 0
            }
        
        sorted_data = sorted(data_list)
        n = len(sorted_data)
        
        return {
            'mean': mean(data_list),
            'median': median(data_list),
            'std_dev': stdev(data_list) if len(data_list) > 1 else 0,
            'min': min(data_list),
            'max': max(data_list),
            'count': n,
            'percentile_90': sorted_data[int(0.9 * n)] if n > 0 else 0,
            'percentile_95': sorted_data[int(0.95 * n)] if n > 0 else 0
        }

    # Compile per-node analysis
    node_analysis = {}
    for node_id, stats in node_stats.items():
        node_analysis[node_id] = {
            'service_time': calculate_stats(stats['service_times']),
            'waiting_time': calculate_stats(stats['waiting_times']),
            'flow_time': calculate_stats(stats['flow_times']),
            'throughput': {
                'arrivals': stats['arrivals'],
                'completed': stats['completed'],
                'completion_rate': stats['completed'] / stats['arrivals'] if stats['arrivals'] > 0 else 0
            }
        }

    # Calculate system-wide statistics
    all_service_times = [time for stats in node_stats.values() for time in stats['service_times']]
    all_waiting_times = [time for stats in node_stats.values() for time in stats['waiting_times']]
    all_flow_times = [time for stats in node_stats.values() for time in stats['flow_times']]
    
    simulation_time = max(all_timestamps) if all_timestamps else 0
    
    system_stats = {
        'total_customers': sum(stats['arrivals'] for stats in node_stats.values()),
        'total_completed': sum(stats['completed'] for stats in node_stats.values()),
        'simulation_duration': simulation_time,
        'overall_service_time': calculate_stats(all_service_times),
        'overall_waiting_time': calculate_stats(all_waiting_times),
        'overall_flow_time': calculate_stats(all_flow_times),
        'customers_per_node': {node: stats['completed'] for node, stats in node_stats.items()},
        'simulation_end_date': simulation_time
    }

    return {
        'node_statistics': node_analysis,
        'system_stats': system_stats
    }

def get_node_utilization(results: List[ciw.data_record.DataRecord], num_servers_per_node: Dict[int, int]) -> Dict[int, Dict]:
    """
    Calculate detailed utilization metrics for each node in the network.
    """
    # Initialize tracking dictionaries
    node_busy_time = defaultdict(float)
    node_total_time = defaultdict(float)
    node_queue_length = defaultdict(list)
    
    # Sort records by time for sequential processing
    sorted_records = sorted(results, key=lambda r: r.arrival_date)
    
    # Track the last known state for each node
    last_state = defaultdict(lambda: {'time': 0, 'servers_busy': 0})
    
    for record in sorted_records:
        node_id = record.node - 1  # Adjust for 0-based indexing
        
        # Calculate busy time
        if hasattr(record, 'service_time') and record.service_time is not None:
            node_busy_time[node_id] += record.service_time
            
        # Track queue length changes
        if hasattr(record, 'arrival_date'):
            node_queue_length[node_id].append((record.arrival_date, 1))
        if hasattr(record, 'exit_date'):
            node_queue_length[node_id].append((record.exit_date, -1))
    
    # Calculate utilization metrics
    utilization_metrics = {}
    for node_id in num_servers_per_node.keys():
        if node_id in node_busy_time:
            total_servers = num_servers_per_node[node_id]
            simulation_end = max(r.exit_date for r in results if hasattr(r, 'exit_date'))
            max_possible_time = simulation_end * total_servers
            
            # Sort queue length events and calculate average
            queue_events = sorted(node_queue_length[node_id])
            if queue_events:
                current_length = 0
                weighted_sum = 0
                last_time = queue_events[0][0]
                
                for time, change in queue_events:
                    weighted_sum += current_length * (time - last_time)
                    current_length += change
                    last_time = time
                
                avg_queue_length = weighted_sum / simulation_end
            else:
                avg_queue_length = 0
            
            utilization_metrics[node_id] = {
                'utilization_rate': min(1.0, node_busy_time[node_id] / max_possible_time),
                'total_busy_time': node_busy_time[node_id],
                'avg_queue_length': avg_queue_length,
                'total_servers': total_servers
            }
        else:
            utilization_metrics[node_id] = {
                'utilization_rate': 0.0,
                'total_busy_time': 0.0,
                'avg_queue_length': 0.0,
                'total_servers': num_servers_per_node[node_id]
            }
    
    return utilization_metrics