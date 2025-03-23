import streamlit as st
from agentic_ai import AgenticAI

# Initialize Agentic AI
agentic = AgenticAI(api_key='YOUR_API_KEY')

st.title('Flight Booking Agent')

origin = st.text_input('Origin')
destination = st.text_input('Destination')
date = st.date_input('Date')

if st.button('Book Flight'):
    try:
        response = agentic.book_flight(origin=origin, destination=destination, date=date)
        st.success(f'Flight booked successfully: {response}')
    except Exception as e:
        st.error(f'Error booking flight: {e}')
