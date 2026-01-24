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
    npm run prod

This command will build the React client (if not already built) and start the Express server. The entire application (frontend + API) will be served from http://localhost:3001

