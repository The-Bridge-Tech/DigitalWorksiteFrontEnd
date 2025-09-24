# Digital Workspace Frontend

A comprehensive React-based frontend application for managing digital workspaces, sites, templates, and inspections. Built as a Splunk app with multiple packages for different functionalities.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (Required for React 18 compatibility)
- **Yarn** (Package manager)
- **Git** (Version control)

### Check Your Versions
```bash
node --version    # Should be 18.0.0 or higher
yarn --version    # Should be 1.22.0 or higher
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd DigitalWorksiteFrontEnd
```

### 2. Install Dependencies (Automated)
We've created an automated installer that handles all dependencies and fixes common issues:

```bash
node install-requirements.js
```

This script will:
- ✅ Check Node.js version compatibility
- 📦 Install all required dependencies
- 🔧 Fix TypeScript and React compatibility issues
- 📊 Configure reporting-center package
- 🔨 Build all packages

### 3. Manual Installation (Alternative)
If the automated installer fails, you can install manually:

```bash
# Install root dependencies
yarn install

# Install workspace dependencies
yarn workspaces run install

# Fix React Leaflet compatibility
yarn add -W react@18.3.1 react-dom@18.3.1
yarn add -W react-leaflet@4.2.1 @react-leaflet/core@2.1.0

# Build packages
yarn build
```

### 4. Start Development Server
```bash
yarn start
```

The application will be available at:
- **Main App**: http://localhost:8001/en-US/app/admin-portal/start
- **Splunk Interface**: http://localhost:8001

## 📁 Project Structure

```
DigitalWorksiteFrontEnd/
├── packages/
│   ├── admin-portal/          # Main admin interface
│   │   ├── src/main/
│   │   │   ├── components/    # React components
│   │   │   ├── services/      # API services
│   │   │   └── webapp/        # Splunk app pages
│   │   └── stage/             # Built Splunk app
│   ├── inspection-report/     # Inspection forms
│   └── reporting-center/      # Analytics dashboard
├── install-requirements.js   # Automated installer
├── package-requirements.json # Dependency specifications
└── package.json              # Root package configuration
```

## 🔧 Configuration

### Backend API Configuration
The frontend connects to a backend API. Update the API URLs in these files:

```javascript
// In all service files (*.service.js):
const API_BASE_URL = 'https://your-backend-url.com';
```

**Service Files to Update:**
- `packages/admin-portal/src/main/services/auth.service.js`
- `packages/admin-portal/src/main/services/site.service.js`
- `packages/admin-portal/src/main/services/drive.service.js`
- `packages/admin-portal/src/main/services/templates.service.js`
- `packages/admin-portal/src/main/components/Auth/GoogleAuth.jsx`

### Google Drive Integration
1. Obtain Google OAuth credentials
2. Update folder IDs in `users.service.js`:
```javascript
const USERS_FOLDER_ID = 'your-google-drive-folder-id';
```

## 🏗️ Building for Production

### Build All Packages
```bash
yarn build
```

### Build Specific Package
```bash
cd packages/admin-portal
yarn build
```

### Deploy to Splunk
The built Splunk app will be in `packages/admin-portal/stage/`. Copy this folder to your Splunk apps directory:

```bash
# Copy to Splunk apps directory
cp -r packages/admin-portal/stage/ $SPLUNK_HOME/etc/apps/admin-portal/
```

## 🧪 Development

### Available Scripts
```bash
yarn start          # Start development server
yarn build          # Build all packages
yarn test           # Run tests
yarn lint           # Run linter
yarn clean          # Clean build artifacts
```

### Package-Specific Commands
```bash
# Admin Portal
cd packages/admin-portal
yarn start          # Start admin portal dev server
yarn build          # Build admin portal

# Inspection Report
cd packages/inspection-report
yarn build          # Build inspection report component

# Reporting Center
cd packages/reporting-center
yarn build          # Build reporting center
```

## 🔍 Features

### Admin Portal
- **Site Management**: Create, edit, and manage work sites
- **Template System**: Manage document templates with folder organization
- **User Management**: Handle user accounts and permissions
- **Google Drive Integration**: Seamless file storage and retrieval
- **QR Code Generation**: Generate QR codes for sites
- **Authentication**: Google OAuth integration

### Inspection Calendar
- **Interactive Calendar**: Drag-and-drop inspection scheduling
- **Map Integration**: Visual site locations with Leaflet maps
- **AI Suggestions**: Intelligent scheduling recommendations
- **Status Tracking**: Monitor inspection progress

### Reporting Center
- **Analytics Dashboard**: Visual reports and charts
- **Data Filtering**: Advanced filtering by project, location, status
- **Export Functionality**: PDF export capabilities
- **Splunk Integration**: Direct Splunk data queries

## 🐛 Troubleshooting

### Common Issues

#### 1. React Leaflet Compatibility Error
```bash
# Fix with specific versions
yarn add -W react-leaflet@4.2.1 @react-leaflet/core@2.1.0
```

#### 2. TypeScript Strict Mode Warnings
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

#### 3. Node Version Issues
Ensure Node.js 18+ is installed:
```bash
nvm install 18
nvm use 18
```

#### 4. Yarn Workspace Issues
Clear cache and reinstall:
```bash
yarn cache clean
rm -rf node_modules
rm yarn.lock
yarn install
```

#### 5. Build Failures
Clean and rebuild:
```bash
yarn clean
yarn install
yarn build
```

### Getting Help

1. **Check the logs**: Look for error messages in the console
2. **Verify dependencies**: Ensure all packages are installed correctly
3. **Check Node version**: Must be 18.0.0 or higher
4. **Clear cache**: Run `yarn cache clean` if issues persist

## 🔐 Authentication Setup

### Google OAuth Configuration
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Configure redirect URIs
5. Update backend configuration with credentials

### Backend Requirements
The frontend requires a compatible backend API running on:
- Default: `http://localhost:5004`
- Production: Update API_BASE_URL in service files

## 📊 Monitoring

### Development Monitoring
- Console logs for API calls
- React DevTools for component debugging
- Network tab for API request monitoring

### Production Monitoring
- Splunk logs for application events
- Google Analytics (if configured)
- Error tracking (if configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check this README first
2. Look at the troubleshooting section
3. Check existing issues in the repository
4. Create a new issue with detailed information

---

**Happy coding! 🚀**