# EchoChamber: A Multi-Agent LLM-based Simulation Platform for Public Relations Crisis Dynamics

EchoChamber is a dynamic multi-agent system powered by Large Language Models (LLMs) to simulate the formation and evolution of public opinion in complex social network environments. The project features a full-stack architecture with a React frontend and a Python FastAPI backend.

This framework brings a miniature, dynamic public sphere to life by assigning unique "Personas" to each agent, simulating their information consumption, decision-making processes, and content publishing behaviors across various social media platforms.

## Core Features

*   **Dual Simulation Scenarios**:
    *   **Scenario 1**: A sandbox mode where users can define a PR crisis, collaboratively refine a response strategy with an LLM assistant, and simulate its impact.
    *   **Scenario 2**: A "yesterday once more" mode where users can select historical PR cases, simulate the events, and compare the simulation's outcome with real-world results.
*   **Interactive LLM Strategy Chat**: An integrated chat interface allows users to brainstorm, develop, and refine their PR strategies with guidance from a specialized LLM expert before launching a simulation.
*   **Dynamic Social Network Simulation**: The backend creates a complex social network graph with varying relationship strengths, influencing how information spreads among agents.
*   **Cross-Platform Simulation**: Simulates distinct information distribution logics for different social media archetypes (e.g., Twitter, WeChat, Forums).
*   **Real-time Visualization**: The frontend is designed to visualize the network graph and the flow of public opinion as the simulation progresses (backend WebSocket integration pending).
*   **Comprehensive API**: A well-documented FastAPI backend provides clear endpoints for both simulation scenarios.

## Tech Stack

| Area      | Technologies                                                                   |
| :-------- | :----------------------------------------------------------------------------- |
| **Frontend**  | React, TypeScript, Vite, Ant Design, TanStack Query                            |
| **Backend**   | Python, FastAPI, LangChain, Uvicorn, python-dotenv                             |
| **LLM**       | Compatible with any OpenAI-style API (e.g., OpenAI, Groq, local LLMs)          |

## Project Structure
```
.
├── backend/
│   ├── code/
│   │   ├── api_server.py       # FastAPI application entry point
│   │   ├── chat_manager.py     # Logic for LLM chat sessions
│   │   ├── case_manager.py     # Logic for loading historical cases
│   │   ├── simulation_manager.py # Manages simulation state
│   │   ├── main.py             # Original CLI-based simulation runner
│   │   └── ...
│   ├── data/
│   │   ├── historical_cases.json # Data for Scenario 2
│   │   └── personas.csv        # Agent persona definitions
│   └── requirements.txt      # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── pages/              # Main page components (HomePage, Scenario1Page, etc.)
    │   ├── components/         # Reusable UI components (ChatInterface, Modals, etc.)
    │   └── ...
    ├── package.json          # Node.js dependencies
    └── vite.config.ts        # Vite configuration (including proxy)
```

## Installation and Setup

Follow these steps to set up and run the project locally. You will need to run two separate terminal sessions for the backend and frontend.

### 1. Backend Setup

1.  **Navigate to the backend directory**:
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment** (recommended):
    ```bash
    # Create the environment
    python -m venv venv

    # Activate on Windows
    .\venv\Scripts\activate

    # Activate on macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Python dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables (Crucial Step)**:
    *   Navigate into the `code` directory: `cd code`.
    *   Create a new file named `.env` by copying the example: `copy .env.example .env` (Windows) or `cp .env.example .env` (macOS/Linux).
    *   Open the `.env` file and **add your own LLM API Key**:
        ```dotenv
        API_KEY="sk-your-llm-api-key-here"
        CUSTOM_API_BASE="https://api.openai.com/v1" # Optional: Change if you use a different endpoint
        ```

### 2. Frontend Setup

1.  **Navigate to the frontend directory** in a **new terminal**:
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies** (pnpm is recommended):
    *   If you don't have pnpm, install it globally: `npm install -g pnpm`.
    *   Install project dependencies:
        ```bash
        pnpm install
        ```
    *   *Note: If you encounter a script execution error on Windows, open PowerShell as Administrator and run `Set-ExecutionPolicy RemoteSigned`.*

## Running the Application

You must start the backend server first, then the frontend development server.

### 1. Start the Backend Server

*   In your first terminal (with the Python virtual environment activated and inside the `backend/code` directory), run:
    ```bash
    python api_server.py
    ```
*   The server should start, and you'll see a message like: `Uvicorn running on http://127.0.0.1:8000`.
*   **Verify**: Open your browser and go to **http://localhost:8000/docs**. You should see the FastAPI interactive API documentation.

### 2. Start the Frontend Server

*   In your second terminal (inside the `frontend` directory), run:
    ```bash
    pnpm dev
    ```
*   The Vite development server will start, and it should automatically open your browser to **http://localhost:3000**.

You can now interact with the EchoChamber application. The frontend will proxy API requests to the backend, allowing the two services to communicate.

