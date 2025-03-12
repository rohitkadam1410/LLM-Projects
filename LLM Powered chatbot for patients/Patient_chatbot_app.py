import streamlit as st
import requests
import json

# Streamlit UI
st.sidebar.title("Instagram Post Generator")

# Text input
user_input = st.sidebar.text_area("Ask health related question to assistant:")

if st.sidebar.button("Generate Post"):
    if user_input:
        print("User input:", user_input)