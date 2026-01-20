import json
from datetime import datetime
from typing import Any


def log_event(event: str, **fields: Any) -> None:
    record = {
        "event": event,
        "timestamp": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        **fields
    }
    print(json.dumps(record, default=str))
