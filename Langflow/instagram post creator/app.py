import streamlit as st
import requests
import json
# Function to call the LangFlow API
def get_langflow_response(text):
    
    # Replace with actual Flow ID
    FLOW_ID = "a38aef7c-7d65-4c79-809a-05756f976885"

    # Langflow API URL
    LANGFLOW_API_URL = f"http://localhost:7860/api/v1/run/{FLOW_ID}"

    # Load input JSON file
    # file_path = "input.json"  # Replace with your actual file path

    # try:
    #     with open(file_path, "r") as f:
    #         input_data = json.load(f)
    # except Exception as e:
    #     print(f"Error loading input JSON: {e}")
    #     exit()

    # Format payload
    payload = {
        "inputs": "",  # Directly pass the JSON input
        "tweaks": {"ChatInput-OJ37E":{"input_value":text}}
    }

    # Send request to Langflow API
    print("Sending request to Langflow API...")
    response = requests.post(LANGFLOW_API_URL, json=payload)

    # Process response
    if response.status_code == 200:
        try:
            result = response.json()
            print("Response:", result)
            final_output = (
                    result.get("outputs", [{}])[0]
                    .get("outputs", [{}])[0]
                    .get("outputs", {})
                    .get("message", {})
                    .get("message", {})
                    .get("text", "No message found")
                )
            return final_output
        except Exception as e:
            print(f"Error parsing response: {e}")
    else:
        print("Error:", response.status_code, response.text)
    return response.status_code

# Streamlit UI
st.sidebar.title("Instagram Post Creator")

# Text input
user_input = st.sidebar.text_area("Enter Topic to generate post and image prompt for the post:")

# Button to submit the text
if st.sidebar.button("Generate Post"):
    if user_input:
        # Get the response from the LangFlow API
        st.spinner("Generating the post...")
        response = get_langflow_response(user_input)
        
        # Display the response
        st.subheader("Post")
        st.write(response)
    else:
        st.error("Please enter some text to generate the post.")