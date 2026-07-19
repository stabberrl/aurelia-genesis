"""Cliente mínimo, sin dependencias, para el protocolo cognitivo de Genesis."""

import json
import subprocess
import time
import uuid


class GenesisBridge:
    def __init__(self, command=("node", "src/bridge/gateway.mjs")):
        self.process = subprocess.Popen(
            command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, bufsize=1
        )

    def send(self, soul_id, event_type, subject, predicate, value_type, value):
        event = {
            "protocol": "genesis-cognitive/1",
            "id": str(uuid.uuid4()),
            "soulId": soul_id,
            "type": event_type,
            "subject": subject,
            "predicate": predicate,
            "value": {"type": value_type, "data": value},
            "timestamp": time.time_ns() // 1000,
        }
        self.process.stdin.write(json.dumps(event) + "\n")
        self.process.stdin.flush()
        return json.loads(self.process.stdout.readline())

    def close(self):
        self.process.terminate()
