# BetterMind Project

![BetterMind Logo](/public/images/logo.png)

## 🧠 About BetterMind

BetterMind is a comprehensive mental health platform designed to connect users with qualified mental health professionals, track mood and well-being, provide personalized resources, and offer mental health assessments. Our mission is to make mental healthcare more accessible, personalized, and effective through technology.

## ✨ Key Features

### For Users
- **User Authentication** - Secure login/signup with email or Google OAuth
- **Mental Health Dashboard** - Visualize your mental health journey with interactive charts
- **Mood Tracking** - Log and monitor your daily mood patterns
- **Appointment Scheduling** - Book, reschedule, and manage appointments with therapists
- **Google Calendar Integration** - Sync your therapy appointments with your Google Calendar
- **Mental Health Assessments** - Take standardized assessments to track your progress
- **Resource Library** - Access personalized mental health resources and save favorites
- **Chat Support** - Communicate with your therapist through secure messaging
- **Milestone Tracking** - Set and track personal mental health goals

### For Mental Health Professionals
- **Doctor Authentication** - Secure verification process for mental health professionals
- **Doctor Dashboard** - Manage patients, appointments, and view statistics
- **Profile Management** - Create and update professional profiles visible to potential patients
- **Appointment Management** - View upcoming appointments and patient history
- **Patient Reviews** - Receive and showcase patient feedback

### Administrative Features
- **Admin Dashboard** - Oversee platform operations and user management
- **Doctor Verification** - Review and verify mental health professional credentials

## 🛠️ Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB (inferred from db.js)
- **Authentication**: JWT, Google OAuth
- **Data Visualization**: Interactive charts for mood and assessment tracking
- **Calendar Integration**: Google Calendar API
- **Security**: Encryption for sensitive data, Two-Factor Authentication

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance
- Google OAuth credentials (for authentication and calendar features)

## 🚀 Getting Started

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/BetterMindProject.git
cd BetterMindProject
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Calendar
GOOGLE_CALENDAR_API_KEY=your_google_calendar_api_key

# Optional: Two-Factor Authentication
TWO_FACTOR_SECRET=your_two_factor_secret
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## 🔍 Project Structure

```
BetterMindProject/
├── public/                  # Static files
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── dashboard/       # User dashboard
│   │   ├── doctor/          # Doctor portal
│   │   ├── lib/             # Utility functions
│   │   └── ...              # Other app routes
│   └── middleware.js        # Next.js middleware
├── .env                     # Environment variables
├── next.config.mjs          # Next.js configuration
├── package.json             # Project dependencies
└── tailwind.config.js       # Tailwind CSS configuration
```

## 📱 Application Flow

1. **User Registration/Login**: Users can create an account or log in using email or Google OAuth
2. **Dashboard**: Users are presented with their mental health dashboard showing mood trends and assessment results
3. **Mood Tracking**: Users can log their daily mood and view patterns over time
4. **Assessments**: Users can take mental health assessments and track progress
5. **Find a Therapist**: Users can browse verified therapists and view their profiles
6. **Appointments**: Users can schedule appointments with therapists
7. **Resources**: Users can access personalized mental health resources
8. **Settings**: Users can manage their profile, notifications, and connected accounts

## 🔒 Security Features

- JWT-based authentication
- Google OAuth integration
- Two-factor authentication option
- Encrypted sensitive data
- Secure API routes with proper authorization

## 📊 API Endpoints

The application provides various API endpoints for different functionalities:

- `/api/auth/*` - Authentication endpoints
- `/api/user/*` - User profile management
- `/api/doctors/*` - Doctor listing and details
- `/api/appointments/*` - Appointment management
- `/api/mood/*` - Mood tracking
- `/api/assessment/*` - Mental health assessments
- `/api/resources/*` - Mental health resources
- `/api/chat/*` - Chat functionality
- `/api/dashboard/*` - Dashboard data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

---
