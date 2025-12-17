import os
import sys
import logging

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set environment to use local provider
os.environ["LLM_PROVIDER"] = "local"

# Configure logging
logging.basicConfig(level=logging.INFO)

try:
    from services.email_gen import generate_email_json_forced
    
    print("Testing local model generation...")
    print("This may take a while on first run to download the model (~600MB - 1GB)...")
    
    prompt = "Write a short email to my boss asking for a sick day."
    result = generate_email_json_forced(prompt, length="short")
    
    print("\n--- Result ---")
    print(result)
    print("--- End Result ---")
    
    if result.get("subject") and result.get("body"):
        print("\nSUCCESS: Generated valid JSON email.")
    else:
        print("\nFAILURE: Did not generate valid JSON.")
        
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
