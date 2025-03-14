import openai
from transformers import DPRQuestionEncoder, DPRQuestionEncoderTokenizer, DPRContextEncoder, DPRContextEncoderTokenizer
from transformers import pipeline

# Initialize the OpenAI API key
openai.api_key = 'your_openai_api_key'

# Initialize the DPR models and tokenizers
question_encoder = DPRQuestionEncoder.from_pretrained('facebook/dpr-question_encoder-single-nq-base')
question_tokenizer = DPRQuestionEncoderTokenizer.from_pretrained('facebook/dpr-question_encoder-single-nq-base')
context_encoder = DPRContextEncoder.from_pretrained('facebook/dpr-ctx_encoder-single-nq-base')
context_tokenizer = DPRContextEncoderTokenizer.from_pretrained('facebook/dpr-ctx_encoder-single-nq-base')

# Initialize the retrieval pipeline
retriever = pipeline('retrieval', model=question_encoder, tokenizer=question_tokenizer)

# Function to retrieve relevant contexts
def retrieve_contexts(question, documents):
    inputs = question_tokenizer(question, return_tensors='pt')
    question_embedding = question_encoder(**inputs).pooler_output
    context_embeddings = [context_encoder(**context_tokenizer(doc, return_tensors='pt')).pooler_output for doc in documents]
    scores = [float((question_embedding @ context_embedding.T).squeeze()) for context_embedding in context_embeddings]
    ranked_docs = [doc for _, doc in sorted(zip(scores, documents), reverse=True)]
    return ranked_docs[:5]  # Return top 5 contexts

# Function to generate answer using OpenAI GPT-3
def generate_answer(question, contexts):
    context_str = "\n".join(contexts)
    prompt = f"Question: {question}\n\nContext:\n{context_str}\n\nAnswer:"
    response = openai.Completion.create(engine="davinci", prompt=prompt, max_tokens=150)
    return response.choices[0].text.strip()

# Main function to handle question answering
def answer_question(question, documents):
    contexts = retrieve_contexts(question, documents)
    answer = generate_answer(question, contexts)
    return answer

# Example usage
if __name__ == "__main__":
    documents = [
        "Document 1 content...",
        "Document 2 content...",
        "Document 3 content...",
        # Add more documents as needed
    ]
    question = "What is the capital of France?"
    answer = answer_question(question, documents)
    print(f"Question: {question}\nAnswer: {answer}")
