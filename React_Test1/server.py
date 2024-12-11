from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

ES_URL = "https://210.246.200.160:9200/wazuh-alerts*/_search"
ES_USERNAME = "admin"
ES_PASSWORD = "ITULgIHEhZHb8vxX+"

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    try:
        query = {
            "query": {
                "term": {
                    "rule.groups": "attack"
                }
            }
        }

        response = requests.post(
            ES_URL,
            auth=(ES_USERNAME, ES_PASSWORD),
            headers={"Content-Type": "application/json"},
            data=json.dumps(query),
            verify=False
        )

        response.raise_for_status()

        data = response.json()
        hits = data.get("hits", {}).get("hits", [])

        return jsonify(hits)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error fetching alerts: {e}"}), 500


@app.route("/api/latest_alert", methods=["GET"])
def get_latest_alert():
    try:
        query = {
            "size": 1,
            "sort": [
                {
                    "@timestamp": {
                        "order": "desc"
                    }
                }
            ]
        }

        response = requests.post(
            ES_URL,
            auth=(ES_USERNAME, ES_PASSWORD),
            headers={"Content-Type": "application/json"},
            data=json.dumps(query),
            verify=False
        )

        response.raise_for_status()

        data = response.json()
        hits = data.get("hits", {}).get("hits", [])

        return jsonify(hits)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error fetching latest alert: {e}"}), 500


@app.route("/api/mitre_alert", methods=["GET"])
def get_mitre_alert():
    try:
        query = {
            "size": 1,
            "query": {
                "bool": {
                    "must": [
                        {
                            "exists": {
                                "field": "rule.mitre.id"
                            }
                        }
                    ]
                }
            },
            "sort": [
                {
                    "@timestamp": {
                        "order": "desc"
                    }
                }
            ]
        }

        response = requests.post(
            ES_URL,
            auth=(ES_USERNAME, ES_PASSWORD),
            headers={"Content-Type": "application/json"},
            data=json.dumps(query),
            verify=False
        )

        response.raise_for_status()

        data = response.json()
        hits = data.get("hits", {}).get("hits", [])

        return jsonify(hits)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error fetching MITRE alert: {e}"}), 500


@app.route("/api/mitre_techniques", methods=["GET"])
def get_mitre_techniques():
    try:
        query = {
            "size": 0,
            "aggs": {
                "mitre_techniques": {
                    "terms": {
                        "field": "rule.mitre.technique",
                        "size": 20
                    }
                }
            }
        }

        response = requests.post(
            ES_URL,
            auth=(ES_USERNAME, ES_PASSWORD),
            headers={"Content-Type": "application/json"},
            data=json.dumps(query),
            verify=False
        )

        response.raise_for_status()

        data = response.json()
        aggregations = data.get("aggregations", {}).get("mitre_techniques", {}).get("buckets", [])

        # Return the aggregated data
        return jsonify(aggregations)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Error fetching MITRE techniques: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True)
