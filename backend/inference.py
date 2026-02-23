from model_utils import summarize_text

# CLI entry point for quick manual testing without starting the API server
if __name__ == "__main__":
    text = input("Enter the text to summarize: ")
    summary = summarize_text(text)
    print("\nGenerated Summary:\n", summary)
