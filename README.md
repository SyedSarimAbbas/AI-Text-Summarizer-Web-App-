<div align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python Version">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-green.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/PyTorch-2.0+-red.svg" alt="PyTorch">
  <img src="https://img.shields.io/badge/Transformers-HuggingFace-yellow.svg" alt="Transformers">
  <br>
  <h1>🚀 AI Text Summarizer</h1>
  <p><b>A modern, high-performance, and fine-tuned LLM Text Summarizer with a dynamic chunking pipeline.</b></p>
</div>

---

## 📖 Overview

The **AI Text Summarizer** is a production-ready web application built to process and summarize long texts efficiently. This project uses a custom fine-tuned Sequence-to-Sequence (Seq2Seq) language model hosted via a high-performance **FastAPI** backend. 

To overcome standard token limits, the backend implements a **dynamic chunking algorithm** with contextual overlap, ensuring that long documents are summarized accurately without losing critical context. It also features a sleek, futuristic, and responsive frontend built with vanilla HTML/CSS/JS and secure JWT authentication.

---

## ✨ Key Features

- **🧠 Fine-Tuned NLP Model**: Powered by Hugging Face `transformers` and `PyTorch` for highly coherent abstractive summaries.
- **⚡ Dynamic Text Chunking**: Automatically splits long inputs with customizable overlap to bypass hard token limits (max 4096 chars frontend, dynamic token limits backend).
- **🔒 JWT Authentication**: Secure user registration and login endpoints utilizing `bcrypt` password hashing and stateful JWT Bearer tokens.
- **🎨 Modern "Cyber" UI**: A premium, responsive interface featuring dynamic loading states, character limits, copy-to-clipboard functionality, and CSS3 micro-animations.
- **🚀 FAST Backend**: Asynchronous API serving via FastAPI and Uvicorn.

---

## 🛠️ Tech Stack

**Backend:**
- Python 3
- FastAPI & Uvicorn (ASGI)
- PyTorch & Hugging Face Transformers
- Passlib & Python-Jose (JWT & Auth)

**Frontend:**
- HTML5 & CSS3 (Custom Design System, CSS Variables, Flex/Grid)
- Vanilla JavaScript
- FontAwesome / Custom SVG Icons

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/Fine-Tuned-LLM_Text_Summarizer.git
cd Fine-Tuned-LLM_Text_Summarizer
```

### 2. Set up the Environment

Create a virtual environment:
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

### 3. Add Environment Variables

Create a `.env` file in the root directory and add your security keys:

```ini
SECRET_KEY=your_highly_secure_random_string_here
```

### 4. Provide the Model

Ensure that your fine-tuned model weights and tokenizers are located in the `best-model/` directory in the root folder. The required files include `model.safetensors`, `config.json`, `tokenizer.json`, etc.

### 5. Run the Application

Start the FastAPI development server:

```bash
uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
```

Then, open your browser and navigate to:
**👉 http://localhost:8000**

---

## 💡 Usage

1. **Authentication:** Upon loading the app, you will be prompted to Register/Login. Creating an account will give you a valid JWT session.
2. **Input Text:** Paste the text you want to summarize into the input panel (up to 4096 characters).
3. **Summarize:** Click "Summarize Text". The backend will apply the dynamic chunking algorithm if necessary and return the final abstractive summary.
4. **Copy Output:** Easily copy the generated summary to your clipboard with the built-in copy button!

### CLI Testing

You can also run a quick manual text summarization test without starting the API server!
```bash
python backend/inference.py
```

---

## 🛡️ Security Notes

- The project uses an in-memory dictionary for the user database (`fake_users_db`) for demonstration purposes. **In production, replace this with a persistent database (e.g. PostgreSQL, MongoDB, SQLite).**
- Ensure your `.env` file and `best-model/` directory are listed in your `.gitignore` to prevent leaking secrets or uploading massive binary files to Git!

---

## ⚖️ License

**© 2026 Syed Sarim Abbas. All Rights Reserved.**

This project is **strictly proprietary** and is NOT open-source. If you wish to clone, copy, modify, distribute, or otherwise use any part of this repository for personal, educational, or commercial purposes, you **must obtain explicit written permission** from the owner. 

---

<div align="center">
  <p><i>Powered by Syed Sarim Abbas</i></p>
</div>
