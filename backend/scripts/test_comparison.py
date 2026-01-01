import requests
import sys
import os
from datetime import datetime

# 1. Get the directory of this script (backend/scripts)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Go up one level to Project Root (backend/)
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# 3. Define the Reports folder
REPORTS_DIR = os.path.join(PROJECT_ROOT, "reports")

# 4. Create the folder if it doesn't exist (Safety check)
os.makedirs(REPORTS_DIR, exist_ok=True)

# -----------------------------
# DYNAMIC FILENAME SETUP
# -----------------------------
# Generates a name like: comparison_report_2023-10-27_14-30-05.txt
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
output_filename = f"comparison_report_{timestamp}.txt"

# 5. Define the final file path
OUTPUT_FILE = os.path.join(REPORTS_DIR, output_filename)

# -----------------------------
# Settings
# -----------------------------
BASE_URL = "http://localhost:8000/api/schedule"
SLOTS = ["Morning", "Afternoon", "Evening"]


# -----------------------------
# Helper Class for Dual Output
# -----------------------------
class Logger:
    """Writes output to both terminal and file simultaneously."""
    def __init__(self, filename):
        self.terminal = sys.stdout
        self.log = open(filename, "w", encoding="utf-8")

    def write(self, message):
        self.terminal.write(message)
        self.log.write(message)

    def flush(self):
        self.terminal.flush()
        self.log.flush()

# -----------------------------
# Functions
# -----------------------------
def get_schedule(endpoint):
    """Fetch schedule JSON from API endpoint."""
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

def compare_schedules(heuristic_plan, rl_plan):
    metrics = {
        "heuristic": {"total": 0, "high": 0, "medium": 0},
        "rl": {"total": 0, "high": 0, "medium": 0}
    }

    print("\n" + "="*95)
    print(f"{'🥤 THE PEPSI CHALLENGE: Heuristic (Baseline) vs. RL Agent (AI)':^95}")
    print("="*95 + "\n")

    for slot in SLOTS:
        print(f"--- {slot.upper()} SLOT ---")

        h_tasks = heuristic_plan.get(slot, [])
        rl_tasks = rl_plan.get(slot, [])

        # Update metrics
        for t in h_tasks:
            metrics["heuristic"]["total"] += 1
            if t.get('priority') == "HIGH": metrics["heuristic"]["high"] += 1
            if t.get('priority') == "MEDIUM": metrics["heuristic"]["medium"] += 1

        for t in rl_tasks:
            metrics["rl"]["total"] += 1
            if t.get('priority') == "HIGH": metrics["rl"]["high"] += 1
            if t.get('priority') == "MEDIUM": metrics["rl"]["medium"] += 1

        # Format rows
        h_rows = [f"[{t.get('priority','?')[:3]}] {t['task_name'][:35]}" for t in h_tasks]
        rl_rows = [f"[{t.get('priority','?')[:3]}] {t['task_name'][:35]}" for t in rl_tasks]

        # Print Side-by-Side
        print(f"{'HEURISTIC':<45} | {'RL AGENT':<45}")
        print("-" * 95)

        max_len = max(len(h_rows), len(rl_rows))
        if max_len == 0:
            print(f"{'(Empty)':<45} | {'(Empty)':<45}")

        for i in range(max_len):
            h_str = h_rows[i] if i < len(h_rows) else ""
            rl_str = rl_rows[i] if i < len(rl_rows) else ""
            print(f"{h_str:<45} | {rl_str:<45}")
        print("\n")

    # -----------------------------
    # STATISTICAL SUMMARY
    # -----------------------------
    print("="*95)
    print(f"{'📊 STATISTICAL SUMMARY':^95}")
    print("="*95)
    
    # Calculate Percentages
    h_total = max(1, metrics['heuristic']['total'])
    rl_total = max(1, metrics['rl']['total'])
    
    h_high_pct = (metrics['heuristic']['high'] / h_total) * 100
    rl_high_pct = (metrics['rl']['high'] / rl_total) * 100

    print(f"{'Metric':<25} | {'Heuristic':<30} | {'RL Agent':<30} | {'Winner'}")
    print("-" * 95)
    print(f"{'Total Tasks Scheduled':<25} | {metrics['heuristic']['total']:<30} | {metrics['rl']['total']:<30} | {'-'}")
    print(f"{'High Priority Count':<25} | {metrics['heuristic']['high']:<30} | {metrics['rl']['high']:<30} | {'RL' if metrics['rl']['high'] >= metrics['heuristic']['high'] else 'Heuristic'}")
    print(f"{'High Priority %':<25} | {h_high_pct:>6.1f}%{'':<23} | {rl_high_pct:>6.1f}%{'':<23} | {'RL' if rl_high_pct >= h_high_pct else 'Heuristic'}")
    print("-" * 95)
    print("\n✅ Report saved to 'comparison_report.txt'")

# -----------------------------
# Main Execution
# -----------------------------
if __name__ == "__main__":
    # Redirect print to both screen and file
    sys.stdout = Logger(OUTPUT_FILE)

    print("Fetching Heuristic Schedule...")
    heuristic = get_schedule("heuristic")

    print("Fetching RL Schedule...")
    rl = get_schedule("rl")

    if heuristic and rl:
        compare_schedules(heuristic, rl)
    else:
        print("❌ Failed. Make sure the backend is running on port 8000.")