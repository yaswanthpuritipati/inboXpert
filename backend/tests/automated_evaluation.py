import os
import sys
import time
import json
import logging
from collections import defaultdict
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load .env
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path)

# Switch to Gemini for evaluation results (bypassing OpenAI rate limits)
os.environ["LLM_PROVIDER"] = "gemini"
os.environ["EMAIL_GEN_MODEL"] = "gemini-2.5-flash"

# Set logging to error only to keep output clean
logging.basicConfig(level=logging.ERROR)

from services.email_gen import generate_email_json_forced

# Define the Test Suite (Ground Truth)
# Categories: request_info, greeting, gratitude, apology, general
TEST_SUITE = [
    {"prompt": "Can you ask my boss for a raise?", "expected": "request_info"},
    {"prompt": "Need a day off next Friday for dental work.", "expected": "request_info"},
    {"prompt": "Please request the Q3 reports from finance.", "expected": "request_info"},
    {"prompt": "Hi team, just wanted to say hello!", "expected": "greeting"},
    {"prompt": "Good morning Sarah, hope your weekend was great.", "expected": "greeting"},
    {"prompt": "Welcome to the team, we are glad to have you.", "expected": "greeting"},
    {"prompt": "Thank you so much for the help yesterday.", "expected": "gratitude"},
    {"prompt": "I really appreciate you staying late to finish the project.", "expected": "gratitude"},
    {"prompt": "Thanks for the feedback on my presentation.", "expected": "gratitude"},
    {"prompt": "I am so sorry for missing the meeting this morning.", "expected": "apology"},
    {"prompt": "Please accept my apologies for the delay in the shipment.", "expected": "apology"},
    {"prompt": "Sorry about the typo in the previous email.", "expected": "apology"},
    {"prompt": "Let's schedule a meeting to discuss the new strategy.", "expected": "general"},
    {"prompt": "Follow up on the invitation for the annual gala.", "expected": "general"},
    {"prompt": "Checking in on the status of the server migration.", "expected": "general"},
]

def calculate_metrics(results):
    categories = ["request_info", "greeting", "gratitude", "apology", "general"]
    metrics = {}
    
    total_samples = len(results)
    correct_total = sum(1 for r in results if r["predicted"] == r["actual"])
    accuracy = correct_total / total_samples
    
    for cat in categories:
        tp = sum(1 for r in results if r["predicted"] == cat and r["actual"] == cat)
        fp = sum(1 for r in results if r["predicted"] == cat and r["actual"] != cat)
        fn = sum(1 for r in results if r["predicted"] != cat and r["actual"] == cat)
        
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        metrics[cat] = {
            "precision": precision,
            "recall": recall,
            "f1_score": f1
        }
        
    return accuracy, metrics

def run_evaluation():
    print("="*60)
    print("      INBOXPERT AGENTIC AI - MODEL PERFORMANCE REPORT")
    print("="*60)
    print(f"Testing Model: {os.getenv('EMAIL_GEN_MODEL', 'gpt-3.5-turbo/local')}")
    print(f"Provider: {os.getenv('LLM_PROVIDER', 'openai')}")
    print(f"Dataset Size: {len(TEST_SUITE)} scenarios")
    print("-" * 60)

    results = []
    json_valid_count = 0
    total_time = 0

    for i, test in enumerate(TEST_SUITE):
        print(f"[{i+1}/{len(TEST_SUITE)}] Processing: \"{test['prompt'][:40]}...\"")
        
        start = time.time()
        try:
            # We call the generation service
            output = generate_email_json_forced(test["prompt"])
            elapsed = time.time() - start
            total_time += elapsed
            
            predicted_intent = output.get("intent", "general")
            
            # Verify JSON quality (simulated by checking if subject and body exist)
            if output.get("subject") and output.get("body"):
                json_valid_count += 1
                
            results.append({
                "prompt": test["prompt"],
                "actual": test["expected"],
                "predicted": predicted_intent
            })
            
        except Exception as e:
            print(f" Error: {e}")
            results.append({
                "prompt": test["prompt"],
                "actual": test["expected"],
                "predicted": "error"
            })

    accuracy, cat_metrics = calculate_metrics(results)
    
    print("\n" + "="*60)
    print("FINAL PERFORMANCE SCORES")
    print("="*60)
    print(f"Overall Accuracy:  {accuracy:.2%}")
    print(f"JSON Validity:     {(json_valid_count/len(TEST_SUITE)):.2%}")
    print(f"Avg Latency:       {(total_time/len(TEST_SUITE)):.2f}s")
    print("-" * 60)
    
    print(f"{'Intent Category':<20} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 60)
    
    for cat, m in cat_metrics.items():
        print(f"{cat:<20} | {m['precision']:<10.2f} | {m['recall']:<10.2f} | {m['f1_score']:<10.2f}")
    
    print("="*60)
    print("Report generated successfully.")

if __name__ == "__main__":
    run_evaluation()
