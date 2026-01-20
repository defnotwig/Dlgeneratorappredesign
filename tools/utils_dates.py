from datetime import date, datetime, timedelta
import re
from typing import Iterable, List, Tuple


TOKEN_MAP = {
    "YYYY": lambda d: f"{d.year:04d}",
    "YY": lambda d: f"{d.year % 100:02d}",
    "MM": lambda d: f"{d.month:02d}",
    "M": lambda d: f"{d.month}",
    "DD": lambda d: f"{d.day:02d}",
    "D": lambda d: f"{d.day}",
}


def format_date(dt: date, fmt: str) -> str:
    output = fmt
    for token in sorted(TOKEN_MAP.keys(), key=len, reverse=True):
        output = output.replace(token, TOKEN_MAP[token](dt))
    return output


def generate_date_range(start: date, end: date) -> List[date]:
    if end < start:
        return []
    days = (end - start).days
    return [start + timedelta(days=i) for i in range(days + 1)]


def parse_date_components(text: str) -> Tuple[int, int, int]:
    parts = [p for p in re.split(r"\D+", text) if p.strip()]
    if len(parts) < 3:
        raise ValueError(f"Unable to parse date: {text}")
    month = int(parts[0])
    day = int(parts[1])
    year_str = "".join(parts[2:])
    if not year_str:
        raise ValueError(f"Unable to parse date: {text}")
    year = int(year_str)
    if year < 100:
        year = 2000 + year
    return year, month, day


def normalize_date_text(text: str, fmt: str) -> str:
    year, month, day = parse_date_components(text)
    return format_date(date(year, month, day), fmt)
