import os
import sys
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force local provider
os.environ["LLM_PROVIDER"] = "local"

from services.email_gen import generate_email_json_forced

print("=== Testing TinyLlama Model ===\n", flush=True)

prompt = "Write a short hello message."

start_time = time.time()
try:
    # Request "tinyllama" explicitly
    result = generate_email_json_forced(
        prompt, 
        tone="casual", 
        length="short",
        model="tinyllama" 
    )
    duration = time.time() - start_time
    
    print(f"\n[Generated in {duration:.2f}s]")
    print(f"Subject: {result.get('subject')}")
    print(f"Body:\n{result.get('body')}")
    
    if result.get("subject") and result.get("body"):
        print("\nSUCCESS: TinyLlama generated a valid email.")
    else:
        print("\nFAILURE: TinyLlama output was not valid JSON.")

except Exception as e:
    print(f"\nERROR: {e}")
