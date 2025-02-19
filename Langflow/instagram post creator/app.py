import streamlit as st
import requests

# Function to call the LangFlow API
def get_langflow_response(text):
    BASE_API_URL = "http://127.0.0.1:7860"
    FLOW_ID = "a38aef7c-7d65-4c79-809a-05756f976885"
    api_url = f"{BASE_API_URL}/api/v1/run/{FLOW_ID}/"
    TWEAKS = {
    "ChatInput-OJ37E": {},
    "Prompt-eGVow": {},
    "TextInput-eo3gf": {},
    "Prompt-7dibC": {},
    "ChatOutput-3oONO": {},
    "Agent-OFkBv": {},
    "Prompt-Gh1NU": {},
    "OpenAIModel-EDd4R": {},
    "OpenAIModel-yevHT": {}
    }
    response = requests.post(api_url, json=payload, headers=headers)
    return response.json()

# Streamlit UI
st.title("LangFlow API Text Summarization")

# Text input
user_input = st.text_area("Enter text to summarize:")

# Button to submit the text
if st.button("Summarize"):
    if user_input:
        # Get the response from the LangFlow API
        response = get_langflow_response(user_input)
        
        # Display the response
        st.subheader("Summary:")
        st.write(response.get("summary", "No summary available"))
    else:
        st.error("Please enter some text to summarize.")