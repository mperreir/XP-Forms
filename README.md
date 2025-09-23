## Getting Started

These instructions will help you set up the project on your local machine for development and testing.

### Prerequisites

You need **Node.js** and **npm** installed on your computer. If you don't have them yet, download and install from [nodejs.org](https://nodejs.org/).

### Installation

1. **Clone the repository:**

   First, clone the project repository to your local machine:
   ```bash
   git clone https://github.com/mperreir/XP-Forms.git
   cd XP-Forms

2. **Install Dependencies:**
    Run the following command to install all dependencies for both the client and the server:
   ```bash
   npm run install-all

This will:

-Install dependencies for the root project.

-Install dependencies for the client.

-Install dependencies for the server.


3. **Start the development server:**
    After the installation is complete, start both the client and server by running:
    ```bash
    npm run dev

This command will use concurrently to run the client and server at the same time. The client will be accessible at http://localhost:3000 and the server will run on http://localhost:5000.

