# LLM Powered Chatbot for Patients

This project is a patient health chatbot application powered by OpenAI's GPT-4 model. The chatbot assists users by answering health-related questions.

## Features

- User-friendly interface built with Streamlit
- Integration with OpenAI's GPT-4 model for generating responses
- Environment variable management using `dotenv`

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/LLM-Powered-Chatbot-for-Patients.git
    cd LLM-Powered-Chatbot-for-Patients
    ```

2. Create a virtual environment and activate it:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required packages:
    ```sh
    pip install -r requirements.txt
    ```

4. Create a `.env` file in the project root directory and add your OpenAI API key:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    ```

## Usage

1. Run the Streamlit app:
    ```sh
    streamlit run Patient_chatbot_app.py
    ```

2. Open the provided URL in your web browser.

3. Use the sidebar to input your health-related question and get advice from the chatbot.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [OpenAI](https://openai.com) for providing the GPT-4 model
- [Streamlit](https://streamlit.io) for the web application framework
- [dotenv](https://github.com/theskumar/python-dotenv) for managing environment variables
