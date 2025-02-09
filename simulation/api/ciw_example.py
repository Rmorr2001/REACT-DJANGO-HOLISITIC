import ciw

'''
Example CIW Network for Doucmentation.
'''
N = ciw.create_network(
    arrival_distributions=[ciw.dists.Deterministic(value=3.0),
                           None,
                           None],
    service_distributions=[ciw.dists.Expontial(value=8.0),
                           ciw.dists.Expontial(value=4.0),
                           ciw.dists.Expontial(value=4.0)],
    routing=[[0.0, 1.0, 0.0],
             [0.0, 0.5, 0.5],
             [0.0, 0.0, 0.0]],
    number_of_servers=[1, 1, 2],
)

ciw.seed(1)
Q = ciw.Simulation(N)
Q.simulate_until_max_time(1200)
recs = Q.get_all_records()

'''
Example Json for this specific network

{
  "id": 1,
  "name": "Factory Simulation",
  "description": "Production line optimization",
  "created_at": "2023-09-20T14:30:00Z",
  "updated_at": "2023-09-20T15:45:00Z",
  "results": {
    "Wait Time": 120,
    "Etc..": 5.2
  },
  "nodes": [
  {
      "id": 4,
      "project": 1,
      "node_name": "Induct Line",
      "destination_nodes": [0, 1.0, 0],
      "number_of_servers": 1,
      "service_rate": 8,
      "service_distribution": "Exponential",
      "arrival_rate": 3,
      "arrival_distribution": "Deterministic"
    },
    {
      "id": 5,
      "project": 1,
      "node_name": "Assembly Line",
      "destination_nodes": [0, 0.5, 0.5],
      "number_of_servers": 3,
      "service_rate": 4,
      "service_distribution": "Exponential",
      "arrival_rate": 0,
      "arrival_distribution": "Deterministic"
    },
    {
      "id": 6,
      "project": 1,
      "node_name": "Quality Check",
      "destination_nodes": [0, 0 , 0],
      "number_of_servers": 2,
      "service_rate": 4,
      "service_distribution": "Exponential",
      "arrival_rate": 0,
      "arrival_distribution": "Deterministic"
    }
  ]
}
'''