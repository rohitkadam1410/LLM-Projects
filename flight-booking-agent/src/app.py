import streamlit as st
import requests  # For API calls
from agentic_ai import AgenticAI

# Initialize Agentic AI
agentic = AgenticAI(api_key='YOUR_API_KEY')

st.title('Flight Booking Agent')

origin = st.text_input('Origin')
destination = st.text_input('Destination')
date = st.date_input('Date')

# Replace with your flight search API details
FLIGHT_SEARCH_API_URL = "https://api.example.com/flights"
API_KEY = "YOUR_API_KEY"

# Search Flights
if st.button('Search Flights'):
    try:
        # Make an API call to fetch flight details
        params = {
            "origin": origin,
            "destination": destination,
            "date": date.strftime('%Y-%m-%d'),
            "apiKey": API_KEY
        }
        response = requests.get(FLIGHT_SEARCH_API_URL, params=params)
        response.raise_for_status()
        search_results = response.json()

        if search_results and "flights" in search_results:
            st.write('Available Flights:')
            for flight in search_results["flights"]:
                st.write(f"Flight: {flight['flight_number']}, Price: {flight['price']}, Time: {flight['departure_time']}")
        else:
            st.warning('No flights found.')
    except Exception as e:
        st.error(f'Error searching flights: {e}')

# Book Flight
selected_flight = st.text_input('Enter Flight Number to Book')
if st.button('Book Flight'):
    try:
        response = agentic.book_flight(flight_number=selected_flight)
        st.success(f'Flight booked successfully: {response}')
    except Exception as e:
        st.error(f'Error booking flight: {e}')
