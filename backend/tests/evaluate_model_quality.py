import os
import sys
import logging
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force local provider
os.environ["LLM_PROVIDER"] = "local"

from services.email_gen import generate_email_json_forced

# Scenarios to test
scenarios = [
    {
        "name": "Formal Request",
        "prompt": "Write an email to my manager asking for a budget increase for the Q4 marketing campaign.",
        "tone": "formal",
        "length": "medium"
    },
    {
        "name": "Casual Greeting",
        "prompt": "Write a quick email to my colleague John asking if he wants to grab lunch today.",
        "tone": "casual",
        "length": "short"
    },
    {
        "name": "Apology to Client",
        "prompt": "Apologize to a client for the delay in delivering the project deliverables.",
        "tone": "formal",
        "length": "medium"
    }
]

print("=== Evaluating Local Model Quality ===\n")

for scenario in scenarios:
    print(f"--- Scenario: {scenario['name']} ---")
    print(f"Prompt: {scenario['prompt']}")
    print(f"Tone: {scenario['tone']}, Length: {scenario['length']}")
    
    start_time = time.time()
    try:
        result = generate_email_json_forced(
            scenario['prompt'], 
            tone=scenario['tone'], 
            length=scenario['length']
        )
        duration = time.time() - start_time
        
        print(f"\n[Generated in {duration:.2f}s]")
        print(f"Subject: {result.get('subject')}")
        print(f"Body:\n{result.get('body')}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    print("\n" + "="*50 + "\n")
