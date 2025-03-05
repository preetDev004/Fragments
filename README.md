# Fragments API

A RESTful API for the Fragments service, allowing users to create, read, update, and delete text and other data fragments.

## Project Setup

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/preetDev004/Fragments.git ./
```

2. Install dependencies:

```bash
npm install
```

## Available Scripts

### Development

- **Start in Development Mode**

  ```bash
  npm run dev
  ```

  Runs the server in development mode with:

  - Auto-reload on file changes
  - Debug level logging
  - Pretty-printed logs
  - Watches `src` directory for changes

- **Start in Production Mode**

  ```bash
  npm start
  ```

  Runs the server in production mode without auto-reload or debug logging.

- **Debug Mode**
  ```bash
  npm run debug
  ```
  Runs the server with:
  - Node.js inspector enabled on port 9229
  - Debug level logging
  - Auto-reload on file changes
  - Allows attaching a debugger (e.g., VS Code)

### Code Quality

- **Lint**

  ```bash
  npm run lint
  ```

  Runs ESLint to check TypeScript files in the `src` directory for code style and potential errors.

- **Build**
  ```bash
  npm run build
  ```
  Compiles TypeScript files to JavaScript.

## Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)
- `LOG_LEVEL` - Logging level (default: 'info', can be set to 'debug' for detailed logs)
- `API_URL` - Base URL for the API
- `HTPASSWD_FILE` - Path to the `.htpasswd` file for HTTP Basic Auth
- `AWS_COGNITO_POOL_ID` - AWS Cognito User Pool ID
- `AWS_COGNITO_CLIENT_ID` - AWS Cognito Client App ID
- `NODE_ENV` - Node environment (e.g., 'development', 'production')

### VS Code Integration

This project includes VS Code settings for:

- Auto-formatting on save using Prettier
- 2-space indentation
- ESLint integration
- Debug configuration

To use the debugger in VS Code:

1. Open the Debug view (`Ctrl+Shift+D` or `Cmd+Shift+D`)
2. Select "Debug via npm run debug" from the dropdown
3. Press F5 to start debugging

## API Endpoints

### Health Check

- `GET /` - Returns basic server information and status

### Fragments

- `GET /v1/fragments` - Get a list of fragments for the current user
- `GET /v1/fragments/:id` - Get a fragment by ID for the current user
- `GET /v1/fragments/:id/info` - Get fragment metadata by ID for the current user
- `GET /v1/fragments/:id.:ext` - Get a converted fragment by ID for the current user
- `POST /v1/fragments` - Create a new fragment

## Author

Preet Patel

## Repository

[GitHub Repository](https://github.com/preetDev004/Fragments)
