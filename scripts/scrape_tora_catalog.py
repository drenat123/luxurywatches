#!/usr/bin/env python3
"""Compatibility entry point for the inventory-based, read-only TORA audit."""
from pathlib import Path
import subprocess
import sys

if __name__ == "__main__":
    print("Using the inventory-based TORA price audit (no database writes).", flush=True)
    try:
        result = subprocess.run([
            "node", str(Path(__file__).resolve().with_name("scrape_tora_dynamic.mjs")),
            *sys.argv[1:],
        ], check=False)
    except FileNotFoundError:
        sys.exit("Node.js was not found. Install Node.js, then run this command again.")
    sys.exit(result.returncode)
