import streamlit as st
import requests
import json
import openai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get OpenAI API key from .env file
openai_api_key = os.getenv("OPENAI_API_KEY")

# Streamlit UI
st.sidebar.title("Patient health chatbot")

# Text input
user_input = st.sidebar.text_area("Ask health related question to assistant:")

if st.sidebar.button("Get Advice"):
    if user_input:
        # Call OpenAI API to generate response
        response =openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_input}
            ],
            max_tokens=400,
            n=1,
            stop=None,
            temperature=0.7
        )

        # Extract the response text
        response_text = response.choices[0].message.content

        # Display the response in the Streamlit app
        st.write("Response from assistant:")
        st.write(response_text)