from collections import defaultdict, Counter
from statistics import mean, median, stdev
from typing import List, Dict, Optional, Any
import numpy as np
from django.utils import timezone

def calculate_mean(data: List[float]) -> float:
    """Calculate mean of non-None values, return 0 if no valid data"""
    valid_data = [x for x in data if x is not None]
    return float(np.mean(valid_data)) if valid_data else 0.0

def calculate_percentile(data: List[float], percentile: float) -> float:
    """Calculate percentile of non-None values, return 0 if no valid data"""
    valid_data = [x for x in data if x is not None]
    return float(np.percentile(valid_data, percentile)) if valid_data else 0.0

def calculate_rolling_statistics(transactions: List[Dict], window_size: int = 30) -> Dict[int, List[Dict]]:
    """
    Calculate rolling statistics over time windows
    
    Args:
        transactions: List of transaction dictionaries
        window_size: Size of rolling window in time units
    
    Returns:
        Dictionary mapping node IDs to lists of rolling statistics
    """
    if not transactions:
        return {}
        
    # Sort transactions by arrival time
    sorted_txns = sorted(transactions, key=lambda x: x.get('arrival_time', 0))
    
    rolling_stats = defaultdict(list)
    for node_id in set(t.get('node_id') for t in transactions):
        # Filter transactions for this node
        node_txns = [t for t in sorted_txns if t.get('node_id') == node_id]
        if not node_txns:
            continue
            
        window = []
        for txn in node_txns:
            # Update rolling window
            current_time = txn.get('arrival_time', 0)
            window = [t for t in window if t.get('arrival_time', 0) > current_time - window_size]
            window.append(txn)
            
            # Calculate statistics for current window
            waiting_times = [t.get('waiting_time', 0) for t in window]
            service_times = [t.get('service_time', 0) for t in window]
            flow_times = [t.get('flow_time', 0) for t in window]
            
            stats = {
                'time': current_time,
                'avg_wait_time': calculate_mean(waiting_times),
                'avg_service_time': calculate_mean(service_times),
                'avg_flow_time': calculate_mean(flow_times),
                'queue_length': len(window),
                'throughput': len(window) / window_size if window_size > 0 else 0
            }
            rolling_stats[node_id].append(stats)
    
    return rolling_stats

def calculate_distribution_stats(values: List[float]) -> Dict[str, Any]:
    """
    Calculate comprehensive distribution statistics
    
    Args:
        values: List of numeric values
    
    Returns:
        Dictionary containing distribution statistics
    """
    valid_values = [v for v in values if v is not None]
    
    if not valid_values:
        return {
            'min': 0.0,
            'max': 0.0,
            'mean': 0.0,
            'median': 0.0,
            'std_dev': 0.0,
            'percentiles': {
                '10': 0.0,
                '25': 0.0,
                '50': 0.0,
                '75': 0.0,
                '90': 0.0,
                '95': 0.0,
                '99': 0.0
            }
        }
    
    return {
        'min': float(np.min(valid_values)),
        'max': float(np.max(valid_values)),
        'mean': float(np.mean(valid_values)),
        'median': float(np.median(valid_values)),
        'std_dev': float(np.std(valid_values)) if len(valid_values) > 1 else 0.0,
        'percentiles': {
            '10': calculate_percentile(valid_values, 10),
            '25': calculate_percentile(valid_values, 25),
            '50': calculate_percentile(valid_values, 50),
            '75': calculate_percentile(valid_values, 75),
            '90': calculate_percentile(valid_values, 90),
            '95': calculate_percentile(valid_values, 95),
            '99': calculate_percentile(valid_values, 99)
        }
    }

def process_simulation_records(results: List[Any], node_mapping: Dict[int, str]) -> Dict[str, Any]:
    """
    Process raw CIW simulation records into structured statistics
    
    Args:
        results: List of CIW record objects
        node_mapping: Dictionary mapping node IDs to names
    
    Returns:
        Dictionary containing processed simulation results
    """
    if not results:
        return {
            'transactions': [],
            'queue_time_series': {},
            'rolling_stats': {},
            'summary_stats': {},
            'metadata': {
                'total_transactions': 0,
                'simulation_duration': 0,
                'node_names': node_mapping,
                'processed_at': timezone.now().isoformat()
            }
        }
    
    # Extract transaction data
    transactions = []
    for record in results:
        # Calculate times
        arrival_time = getattr(record, 'arrival_date', 0)
        service_start = getattr(record, 'service_start_date', None)
        service_end = getattr(record, 'service_end_date', None)
        exit_time = getattr(record, 'exit_date', None)
        
        waiting_time = service_start - arrival_time if service_start is not None else None
        service_time = service_end - service_start if (service_start is not None and service_end is not None) else None
        flow_time = exit_time - arrival_time if exit_time is not None else None
        
        transaction = {
            'id': getattr(record, 'id_number', None),
            'node_id': getattr(record, 'node', None),
            'node_name': node_mapping.get(getattr(record, 'node', None), 'Unknown'),
            'arrival_time': arrival_time,
            'service_start': service_start,
            'service_end': service_end,
            'exit_time': exit_time,
            'service_time': service_time,
            'waiting_time': waiting_time,
            'flow_time': flow_time,
            'queue_size_at_arrival': getattr(record, 'queue_size_at_arrival', 0)
        }
        transactions.append(transaction)
    
    # Calculate statistics by node
    node_stats = defaultdict(lambda: defaultdict(list))
    for txn in transactions:
        node_id = txn['node_id']
        node_stats[node_id]['waiting_times'].append(txn['waiting_time'])
        node_stats[node_id]['service_times'].append(txn['service_time'])
        node_stats[node_id]['flow_times'].append(txn['flow_time'])
        node_stats[node_id]['queue_sizes'].append(txn['queue_size_at_arrival'])
    
    summary_stats = {
        node_id: {
            'waiting_time_stats': calculate_distribution_stats(stats['waiting_times']),
            'service_time_stats': calculate_distribution_stats(stats['service_times']),
            'flow_time_stats': calculate_distribution_stats(stats['flow_times']),
            'queue_size_stats': calculate_distribution_stats(stats['queue_sizes'])
        }
        for node_id, stats in node_stats.items()
    }
    
    # Calculate rolling statistics
    rolling_stats = calculate_rolling_statistics(transactions)
    
    return {
        'transactions': transactions,
        'rolling_stats': rolling_stats,
        'summary_stats': summary_stats,
        'metadata': {
            'total_transactions': len(transactions),
            'simulation_duration': max((t['exit_time'] or 0) for t in transactions),
            'node_names': node_mapping,
            'processed_at': timezone.now().isoformat()
        }
    }