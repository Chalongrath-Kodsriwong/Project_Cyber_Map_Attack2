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

if __name__ == "__main__":
    app.run(debug=True)
