# 🌍 Langflow Travel Planner Guide

This project uses **Langflow's UI** and the **Search API** to build a smart travel planner. The flow helps users plan their trips with personalized itineraries, travel tips, and real-time information.

## 🛠️ Project Overview

- **Tool**: Langflow UI
- **APIs**: OpenAI, Search API
- **Use Case**: Travel itinerary and guide generation

## ⚙️ Flow Description

The flow takes the following inputs:

1. **Destination**: e.g., "Paris", "Tokyo", "Sydney"
2. **Travel Dates**: Start and end dates
3. **Preferences**: e.g., "Adventure", "Relaxation", "Cultural"

### 🧠 Output:
- Personalized itinerary
- Must-see attractions
- Local travel tips
- Real-time weather and event information

## 🚀 Getting Started

### 1️⃣ **Access Langflow UI**
- Open Langflow at `http://localhost:7860` (or your deployment URL)
- Import the flow JSON file provided

### 2️⃣ **API Key Setup**
Ensure your **OpenAI API Key** and **Search API Key** are configured correctly in Langflow:
- Go to **Settings** → **API Keys** → Add your keys.

**⚠️ Important:** Never expose your API keys publicly.

### 3️⃣ **Run the Flow**
- Enter the required inputs in the UI.
- Click **Run** to generate your travel plan.

## 🖼️ Example Output

**Input:**
- Destination: Tokyo
- Dates: March 15 - March 25
- Preferences: Culture, Food

**Output:**
```plaintext
🌸 Tokyo Adventure 🇯🇵
Day 1: Explore Asakusa and the Senso-ji Temple
Day 2: Visit Shibuya Crossing and Meiji Shrine
Day 3: Discover Tsukiji Outer Market for sushi delights
Weather Forecast: Sunny, 18°C

#TokyoTrip #CulturalJourney #TravelPlanner
```

## 🛠️ Troubleshooting

- **API Key Errors**: Double-check your OpenAI and Search API keys.
- **Inaccurate Data**: Adjust query parameters or use different search sources.

## 🧑‍💻 Next Steps
- Add support for more travel services (e.g., flight, hotel bookings)
- Integrate with external APIs for real-time updates

---

🌟 **Bon Voyage!** ✈️

