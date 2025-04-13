# Fragments API

![Coverage Badge](https://img.shields.io/badge/coverage-94%25-brightgreen)

A RESTful API service allowing users to create, retrieve, update, delete, and convert various data fragments. The service handles multiple content types including text, HTML, Markdown, JSON, and images with fine-grained access control.

## 🚀 Features

- **Create & Manage Fragments**: Store and manage pieces of data with appropriate metadata
- **Content Type Support**: Handles multiple formats including:
  - Text formats: `text/plain`, `text/markdown`, `text/html`, `text/csv`
  - Data formats: `application/json`, `application/yaml`
  - Image formats: `image/png`, `image/jpeg`, `image/webp`, `image/avif`, `image/gif`
- **Format Conversion**: Convert between compatible formats (e.g., Markdown to HTML, CSV to JSON)
- **Authentication**: Secure API endpoints with HTTP Basic Auth & AWS Cognito
- **Data Persistence**: Store fragment data and metadata
- **Comprehensive Testing**: High test coverage (>94%) ensuring reliability

## 📋 Requirements

- Node.js (Latest LTS version recommended)
- npm (comes with Node.js)

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/fragments.git
   cd fragments
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create a .env file):
   ```
   PORT=8080
   LOG_LEVEL=info
   API_URL=http://localhost:8080
   HTPASSWD_FILE=./user.htpasswd
   # Add AWS credentials if using AWS services
   ```

## 🔧 Available Scripts

### Development

- **Development Mode**:
  ```bash
  npm run dev
  ```
  Runs the server with auto-reload, debug logging, and file watching

- **Debug Mode**:
  ```bash
  npm run debug
  ```
  Runs with Node.js inspector enabled on port 9229 for attaching a debugger

- **Production Mode**:
  ```bash
  npm start
  ```
  Runs the server in production mode

### Code Quality & Testing

- **Build**:
  ```bash
  npm run build
  ```
  Compiles TypeScript files to JavaScript

- **Lint**:
  ```bash
  npm run lint
  ```
  Runs ESLint to check code style and potential errors

- **Test**:
  ```bash
  npm test
  ```
  Runs the test suite

- **Coverage**:
  ```bash
  npm run coverage
  ```
  Generates test coverage reports

## 🌐 API Endpoints

### Authentication

All endpoints require authentication using either HTTP Basic Auth or AWS Cognito tokens.

### Fragments Operations

- `GET /v1/fragments` - List all fragments for the authenticated user
- `POST /v1/fragments` - Create a new fragment
- `GET /v1/fragments/:id` - Get a specific fragment by ID
- `PUT /v1/fragments/:id` - Update a specific fragment
- `DELETE /v1/fragments/:id` - Delete a specific fragment
- `GET /v1/fragments/:id/info` - Get metadata about a specific fragment
- `GET /v1/fragments/:id.:ext` - Get a fragment converted to a different format

## ⚙️ Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)
- `LOG_LEVEL` - Logging level (default: 'info', can be set to 'debug')
- `API_URL` - Base URL for the API
- `HTPASSWD_FILE` - Path to the `.htpasswd` file for HTTP Basic Auth
- `AWS_COGNITO_POOL_ID` - AWS Cognito User Pool ID
- `AWS_COGNITO_CLIENT_ID` - AWS Cognito Client App ID
- `NODE_ENV` - Node environment (e.g., 'development', 'production')

## 🧩 Project Structure

```
fragments/
├── src/
│   ├── app.ts              # Express app setup
│   ├── auth/               # Authentication middleware
│   ├── model/              # Data models
│   │   ├── data/           # Data storage abstraction
│   │   │   └── memory/     # In-memory implementation
│   │   └── fragment.ts     # Fragment model
│   ├── routes/             # API route handlers
│   │   └── api/            # API endpoints
│   └── utils/              # Utility functions
│       ├── converter.ts    # Format conversion
│       └── formatValidator.ts # Content validation
└── tests/                  # Test files
```

## 🔧 VS Code Integration

This project includes VS Code settings for:
- Auto-formatting on save using Prettier
- 2-space indentation 
- ESLint integration
- Debug configuration

To use the debugger in VS Code:
1. Open the Debug view (`Cmd+Shift+D`)
2. Select "Debug via npm run debug" from the dropdown
3. Press F5 to start debugging

## 🙌 Credits and Acknowledgements

+ **Made with 🧡 for DPS955 - Cloud Computing**.
+ Special thanks to [@humphd](https://github.com/humphd) 
