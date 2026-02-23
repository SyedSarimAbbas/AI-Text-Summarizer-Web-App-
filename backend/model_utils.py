import torch
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import math

# -----------------------------
# Setup
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = str(BASE_DIR / "best-model")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH, local_files_only=True).to(device)
model.eval()

# -----------------------------
# Summarize single chunk
# -----------------------------
def summarize_chunk(
    text: str,
    max_new_tokens: int = 256,
    num_beams: int = 4,
    length_penalty: float = 2.0
) -> str:
    """Summarize a single chunk of text."""
    prompt = f"summarize: {text}"
    inputs = tokenizer(
        prompt,
        truncation=True,
        max_length=500,  
        return_tensors="pt",
        padding=True
    ).to(device)

    with torch.no_grad():
        generated_ids = model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            length_penalty=length_penalty,
            no_repeat_ngram_size=3,
            early_stopping=True
        )

    return tokenizer.decode(generated_ids[0], skip_special_tokens=True)


# -----------------------------
# Dynamic chunking + summarization
# -----------------------------
def summarize_text_dynamic(
    text: str,
    max_input_tokens: int = 400,  
    chunk_overlap: int = 40,
    max_new_tokens: int = 256,
    num_beams: int = 4,
    length_penalty: float = 2.0,
    summarize_final: bool = True
) -> str:
    """
    Summarize long text dynamically by splitting into chunks.
    
    Args:
        text: Long text to summarize.
        max_input_tokens: Max tokens per chunk for the model.
        chunk_overlap: Tokens to overlap between chunks for context.
        summarize_final: Whether to summarize the combined chunk summaries.
    
    Returns:
        Final summary string.
    """
    # Tokenize entire text to get raw tokens (no special tokens)
    tokens = tokenizer.encode(text, add_special_tokens=False, truncation=False)
    total_tokens = len(tokens)

    # If text is short, summarize directly
    if total_tokens <= max_input_tokens:
        return summarize_chunk(
            text,
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            length_penalty=length_penalty
        )

    # Split tokens into chunks
    chunks = []
    start = 0
    while start < total_tokens:
        end = min(start + max_input_tokens, total_tokens)
        chunk_tokens = tokens[start:end]
        chunk_text = tokenizer.decode(chunk_tokens, skip_special_tokens=True)
        chunks.append(chunk_text)

        start = end - chunk_overlap  # move window with overlap
        if start < 0:
            start = 0

    # Summarize each chunk
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        summary = summarize_chunk(
            chunk,
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            length_penalty=length_penalty
        )
        chunk_summaries.append(summary)

    # Combine chunk summaries
    combined_summary = "\n\n".join(chunk_summaries)

    # Optionally, summarize the combined summary for conciseness
    if summarize_final:
        # Prevent the combined_summary from exceeding the model's sequence limit (840 > 512 error)
        combined_tokens = tokenizer.encode(combined_summary, add_special_tokens=False, truncation=False)
        if len(combined_tokens) > max_input_tokens:
            combined_summary = tokenizer.decode(combined_tokens[:max_input_tokens], skip_special_tokens=True)

        final_summary = summarize_chunk(
            combined_summary,
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            length_penalty=length_penalty
        )
        return final_summary
    else:
        return combined_summary