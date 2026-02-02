import os
import sys

# Make "src" importable for tests
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
src_path = os.path.join(ROOT, "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)
