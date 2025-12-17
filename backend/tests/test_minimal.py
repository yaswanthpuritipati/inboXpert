from ctransformers import AutoModelForCausalLM
import time

print("Loading model...", flush=True)
try:
    llm = AutoModelForCausalLM.from_pretrained(
        "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF", 
        model_file="tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
        model_type="llama",
        gpu_layers=0
    )
    print("Model loaded.", flush=True)

    print("Generating...", flush=True)
    start = time.time()
    text = llm("Hello", stream=False)
    print(f"Generated: {text}", flush=True)
    print(f"Time: {time.time() - start:.2f}s", flush=True)

except Exception as e:
    print(f"Error: {e}", flush=True)
