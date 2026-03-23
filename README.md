# Digital Worksite Frontend

A comprehensive React-based frontend application for managing digital worksites, sites, inspections, and document management. Built as a Splunk app with multiple packages for different functionalities including QR code scanning, real-time notifications, calendar scheduling, and document vault management.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (Required for React 18 compatibility)
- **Yarn** (Package manager)
- **Git** (Version control)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)
- **Camera Access** (For QR code scanning functionality)
- **HTTPS in Production** (Required for camera access in browsers)
- **GPS/Location Services** (For location-based check-ins)

### Browser Requirements for QR Scanner
- **Camera Permission**: Must allow camera access
- **HTTPS**: Required in production for camera API
- **Modern Browser**: Chrome 59+, Firefox 53+, Safari 11+, Edge 79+
- **Mobile Support**: iOS Safari 11+, Chrome Mobile 59+

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

### 2. Install Dependencies
Install all required dependencies:

```bash
yarn install
```

This will install all dependencies including:
- ✅ React and TypeScript components
- ✅ QR scanning libraries (qr-scanner, jsqr)
- ✅ Map components (Leaflet, react-leaflet)
- ✅ Calendar components (FullCalendar)
- ✅ PDF generation (jspdf)
- ✅ UI components and styling

### 3. Manual Installation (If Needed)
If automatic installation fails, you can install manually:

```bash
# Install root dependencies
yarn install

# Install workspace dependencies
yarn workspaces run install

# Build packages
yarn build
```

### 4. Start Development Server
```bash
yarn start
```

## 📁 Project Structure

```
DigitalWorksiteFrontEnd/
├── packages/
│   ├── admin-portal/                    # Main admin interface
│   │   ├── src/main/
│   │   │   ├── components/              # React components
│   │   │   │   ├── Analytics/           # Dashboard analytics
│   │   │   │   ├── Auth/                # Google authentication
│   │   │   │   ├── Calendar/            # Inspection scheduling
│   │   │   │   ├── CheckIn/             # QR code scanning
│   │   │   │   ├── Dashboard/           # Main dashboard
│   │   │   │   ├── Documents/           # Document vault
│   │   │   │   ├── Map/                 # Leaflet maps
│   │   │   │   ├── Notifications/       # Notification system
│   │   │   │   ├── Sites/               # Site management
│   │   │   │   ├── Templates/           # Template system
│   │   │   │   └── Users/               # User management
│   │   │   ├── config/                  # Configuration files
│   │   │   │   └── api.config.js        # Centralized API config
│   │   │   ├── services/                # API services
│   │   │   │   ├── auth.service.js      # Authentication
│   │   │   │   ├── document.service.js  # Document management
│   │   │   │   ├── drive.service.js     # Google Drive
│   │   │   │   ├── site.service.js      # Site operations
│   │   │   │   ├── templates.service.js # Template management
│   │   │   │   └── users.service.js     # User operations
│   │   │   ├── utils/                   # Utility functions
│   │   │   └── webapp/                  # Splunk app pages
│   │   │       └── pages/               # Individual pages
│   │   │           ├── start/           # Main application
│   │   │           ├── InspectionReport/# Inspection forms
│   │   │           └── ReportingCenter/ # Analytics
│   │   └── stage/                       # Built Splunk app
│   ├── inspection-report/               # Inspection forms package
│   └── reporting-center/                # Analytics dashboard package
├── lerna.json                          # Monorepo configuration
└── package.json                        # Root package configuration
```

## 🔧 Configuration

### Backend API Configuration
The frontend uses environment variables for API configuration. The API base URL is set via environment variable:

```javascript
// packages/admin-portal/src/main/config/api.config.js
export const API_BASE_URL = process.env.REACT_APP_API_URL;
```

**Environment Setup:**
Create a `.env` file in the admin-portal package:
```bash
# packages/admin-portal/.env
REACT_APP_API_URL=http://localhost:5004
```

**⚠️ Important**: The `REACT_APP_API_URL` shown above (`http://localhost:5004`) is a development URL. **You must change this to match your actual backend server URL** when running the application in different environments:

- **Development**: `http://localhost:5004`
- **Production**: `https://your-domain.com` or your actual server URL
- **Staging**: `https://staging.your-domain.com` or your staging server URL

**Centralized API Endpoints:**
All API endpoints are managed in `api.config.js` with the `API_ENDPOINTS` object including:
- Authentication endpoints (`/adm/auth/*`)
- Site management (`/adm/sites/*`, `/api/sites/*`)
- Document vault (`/adm/documents/*`)
- Notifications (`/notifications/*`)
- Check-ins and QR scanning (`/checkins/*`)
- Task scheduling (`/tasks/*`)
- File management (`/adm/files/*`)
- User management (`/adm/users/*`)
- System settings (`/adm/system/*`)

### Google Drive Integration
1. Obtain Google OAuth credentials from Google Cloud Console
2. Configure backend with Google Drive API access
3. Set up folder permissions for document storage
4. Update folder IDs in site configurations

### Environment Variables
Create a `.env` file in the **root directory** of the project:
```bash
# DigitalWorksiteFrontEnd/.env
REACT_APP_API_URL=http://localhost:5004

# Weather API Key (get from https://weatherapi.com)
REACT_APP_WEATHER_API_KEY=your_weather_api_key_here

# Development environment
NODE_ENV=development
```

**⚠️ Important**: 
- The `REACT_APP_API_URL` shown above is a development URL. **Change this to your actual backend server URL** when deploying or running in different environments.
- Get your weather API key from [WeatherAPI.com](https://weatherapi.com) - it's used for safety alerts during QR check-ins.
- Set `REACT_APP_USERS_FOLDER_ID` to your Google Drive folder ID where user JSON files will be automatically created when new users are added through the admin interface. Each user gets a JSON file with their profile data stored in this folder.
- All packages will use this single `.env` file from the root directory.

**Note**: The API_URL environment variable is required as it's used by the centralized API configuration system.

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

### 🏗️ Site Management
- **Site Creation & Editing**: Comprehensive site information management
- **Location Tracking**: GPS coordinates and address management
- **QR Code Generation**: Automatic QR code creation for site check-ins
- **Site Status Monitoring**: Track site progress and status
- **Subcontractor Management**: Assign and manage subcontractors per site

### 📱 QR Code Check-In System
- **Real-time QR Scanning**: Camera-based QR code detection using `qr-scanner` library
- **GPS Location Capture**: Automatic location verification with browser geolocation
- **Weather Integration**: Real-time weather data from WeatherAPI
- **Safety Alerts**: Automatic alerts for severe weather conditions
- **User Authentication**: Secure check-in with JWT token verification
- **Camera Requirements**: HTTPS required, modern browser with camera support
- **Mobile Optimized**: Works on mobile devices with rear camera preference

### 📅 Inspection Calendar
- **Drag & Drop Scheduling**: Interactive FullCalendar integration
- **User Assignment**: Assign inspections to specific users
- **Map Visualization**: Leaflet maps with site markers
- **AI Suggestions**: Intelligent scheduling recommendations
- **Task Persistence**: Backend integration for task storage
- **Multiple Views**: Month, week, day, and list views
- **Real-time Notifications**: Inspection reminders and alerts

### 📁 Document Vault
- **Document Management**: Upload, organize, and manage documents
- **Status Tracking**: Approve, pending, expired document states
- **Voice-to-Text Notes**: Audio transcription for document annotations
- **Google Drive Integration**: Seamless cloud storage
- **Document Types**: Permits, inspection requests, reports, general docs
- **Preview & Download**: In-browser document preview and download
- **Print Integration**: Direct printing from Google Drive
- **Advanced Filtering**: Filter by status, type, and site

### 🔔 Notification System
- **Real-time Notifications**: Live notification bell with unread counts
- **Email Notifications**: Rich HTML email templates
- **SMS Integration**: Twilio SMS support (optional)
- **Safety Alerts**: Weather-based safety notifications
- **Inspection Reminders**: Automated inspection scheduling alerts
- **Personalized Messages**: Context-aware notification content

### 📊 Analytics Dashboard
- **Performance Metrics**: Site visit duration, manhour reduction
- **Cost Savings Tracking**: Financial impact visualization
- **Error Rate Monitoring**: Quality control metrics
- **Permit Integrity**: Compliance tracking
- **Interactive Charts**: Real-time data visualization

### 👥 User Management
- **Google OAuth Integration**: Secure authentication
- **Role-based Access**: User permissions and site assignments
- **User Profiles**: Comprehensive user information management
- **Site Assignments**: Assign users to specific sites

### 📋 Template System
- **Template Creation**: Custom inspection templates
- **Folder Organization**: Structured template management
- **Template Editing**: Dynamic form builder
- **Template Assignment**: Link templates to sites

### 🗂️ File Management
- **Google Drive Integration**: Direct file upload and management
- **Folder Organization**: Structured file storage
- **File Preview**: In-browser file viewing
- **Batch Operations**: Multiple file management

### 📈 Reporting Center
- **Advanced Analytics**: Comprehensive reporting dashboard
- **Data Export**: PDF and Excel export capabilities
- **Custom Filters**: Advanced filtering and search
- **Splunk Integration**: Direct data queries and visualization

## 🐛 Troubleshooting

### Common Issues

#### 1. React Leaflet Compatibility Error
```bash
# Fix with specific versions
yarn add -W react-leaflet@4.2.1 @react-leaflet/core@2.1.0
```

#### 2. QR Code Scanner Issues
- **Camera Permission Denied**: Ensure browser has camera access permissions
- **No Camera Found**: Check device camera availability and browser compatibility
- **Scanner Not Working**: Try refreshing the page or restarting browser
- **QR Code Not Detected**: Ensure good lighting and steady camera positioning
- **HTTPS Required**: Camera access requires HTTPS in production environments
- **Browser Compatibility**: Use Chrome 59+, Firefox 53+, Safari 11+, Edge 79+
- **Mobile Issues**: Ensure mobile browser supports camera API

#### 3. Google Drive Integration Issues
- **Upload Failures**: Check folder permissions and API credentials
- **File Preview Not Loading**: Verify file sharing settings
- **Authentication Errors**: Refresh Google OAuth tokens

#### 4. Notification Issues
- **Notifications Not Appearing**: Check browser notification permissions
- **Email Not Sending**: Verify backend email configuration
- **SMS Not Working**: Check Twilio credentials and phone number format

#### 5. Calendar Issues
- **Events Not Saving**: Check backend API connectivity
- **Drag & Drop Not Working**: Ensure calendar is fully loaded
- **Map Not Loading**: Verify Leaflet CSS imports

#### 6. TypeScript Strict Mode Warnings
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

#### 7. Node Version Issues
Ensure Node.js 18+ is installed:
```bash
nvm install 18
nvm use 18
```

#### 8. Yarn Workspace Issues
Clear cache and reinstall:
```bash
yarn cache clean
rm -rf node_modules
rm yarn.lock
yarn install
```

#### 9. Build Failures
Clean and rebuild:
```bash
yarn clean
yarn install
yarn build
```

#### 10. API Connection Issues
- **CORS Errors**: Configure backend CORS settings
- **Authentication Failures**: Check token expiration
- **Network Timeouts**: Verify API endpoint availability

### Getting Help

1. **Check the logs**: Look for error messages in the browser console
2. **Verify dependencies**: Ensure all packages are installed correctly
3. **Check Node version**: Must be 18.0.0 or higher
4. **Clear cache**: Run `yarn cache clean` if issues persist
5. **Check API connectivity**: Verify backend is running on correct port
6. **Browser compatibility**: Use modern browsers with camera support
7. **Network permissions**: Ensure firewall allows API connections

## 🔐 Authentication Setup

### Google OAuth Configuration
1. Create a Google Cloud Project
2. Enable the following APIs:
   - Google Drive API
   - Google OAuth 2.0
   - Google People API (for user info)
3. Create OAuth 2.0 credentials
4. Configure authorized redirect URIs:
   - Development: `http://localhost:5004/adm/auth/google/callback`
   - Production: `https://your-domain.com/api/adm/auth/google/callback`
5. Download client credentials JSON
6. Update backend configuration with credentials

### Backend Requirements
The frontend requires a compatible backend API.
- **Configuration**: Update `REACT_APP_API_URL` in `.env` file

### Required Backend Endpoints
Ensure your backend supports these endpoint categories:
- Authentication (`/adm/auth/*`)
- Site management (`/adm/sites/*`)
- Document management (`/adm/documents/*`)
- Notifications (`/notifications/*`)
- Check-ins (`/checkins/*`)
- Tasks (`/tasks/*`)
- File operations (`/adm/files/*`)

### Camera Permissions
For QR code scanning functionality:
1. Ensure HTTPS in production (required for camera access)
2. Configure browser permissions for camera access
3. Test camera functionality in supported browsers

## 📊 Monitoring & Analytics

### Development Monitoring
- **Console Logs**: Detailed API call logging
- **React DevTools**: Component state and props debugging
- **Network Tab**: API request/response monitoring
- **Calendar Cache**: Optimized data loading with 1-minute cache
- **Error Boundaries**: Component-level error handling

### Production Monitoring
- **Splunk Integration**: Application event logging
- **Performance Metrics**: Site visit tracking, manhour analysis
- **Error Tracking**: Comprehensive error logging and reporting
- **User Analytics**: Check-in patterns and site usage
- **Notification Delivery**: Email and SMS delivery tracking

### Key Performance Indicators
- **Site Visit Duration**: Average time spent on sites
- **Inspection Completion Rate**: Percentage of completed inspections
- **Document Processing Time**: Time from upload to approval
- **QR Code Scan Success Rate**: Successful check-in percentage
- **User Engagement**: Active users and feature usage
- **System Uptime**: API availability and response times

### Coding Standards
- **React**: Use functional components with hooks
- **Styling**: Inline styles for component-specific styling
- **API Calls**: Use centralized `api.config.js` for endpoints
- **Error Handling**: Implement proper try-catch blocks
- **Accessibility**: Ensure WCAG compliance
- **Performance**: Optimize with caching and lazy loading

### Testing Guidelines
- Test QR code functionality with real devices
- Verify Google Drive integration with actual files
- Test notification delivery across different browsers
- Validate calendar drag-and-drop functionality
- Check responsive design on mobile devices


### Version 2.0 Features
- **Enhanced QR Scanner**: Real-time camera scanning with jsQR library
- **Document Vault**: Complete document management system with voice notes
- **Notification System**: Rich HTML emails and SMS integration
- **Calendar Optimization**: Improved performance with caching and async loading
- **API Centralization**: Unified API configuration system
- **Weather Integration**: Real-time weather data for safety alerts
- **Voice-to-Text**: Audio transcription for document annotations
- **Advanced Analytics**: Comprehensive performance metrics
- **Mobile Optimization**: Improved mobile responsiveness
- **Security Enhancements**: Enhanced authentication and authorization

### Technical Improvements
- **React 18**: Upgraded to latest React version
- **TypeScript Support**: Enhanced type safety
- **Performance Optimization**: Reduced bundle size and load times
- **Error Handling**: Comprehensive error boundaries and logging
- **Accessibility**: WCAG 2.1 compliance improvements
- **Cross-browser Support**: Enhanced compatibility

### Infrastructure Updates
- **Splunk Integration**: Native Splunk app deployment
- **Google Drive API**: Enhanced file management capabilities
- **Twilio SMS**: Optional SMS notification support
- **Weather API**: Real-time weather data integration
- **Leaflet Maps**: Interactive site visualization
- **FullCalendar**: Advanced scheduling capabilities

---

**Happy coding! 🚀**