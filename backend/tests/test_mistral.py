import os
import sys
import logging
import time

print("=== Testing Mistral 7B Model ===\n", flush=True)

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Force ollama provider
os.environ["LLM_PROVIDER"] = "ollama"

from services.email_gen import generate_email_json_forced
print("Note: If the model is not downloaded, this will download approx 4GB.")
print("This may take a significant amount of time.\n")

prompt = "Write a professional email to a client explaining that we are switching to a new AI model for better performance."

start_time = time.time()
try:
    # Request "mistral" explicitly
    result = generate_email_json_forced(
        prompt, 
        tone="formal", 
        length="medium",
        model="mistral" 
    )
    duration = time.time() - start_time
    
    print(f"\n[Generated in {duration:.2f}s]")
    print(f"Subject: {result.get('subject')}")
    print(f"Body:\n{result.get('body')}")
    
    if result.get("subject") and result.get("body"):
        print("\nSUCCESS: Mistral generated a valid email.")
    else:
        print("\nFAILURE: Mistral output was not valid JSON.")

except Exception as e:
    print(f"\nERROR: {e}")
