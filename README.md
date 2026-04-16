# DialectDash

DialectDash is a gamified mobile application designed to facilitate language acquisition and mathematical practice. Developed with React Native and Firebase, the application features a custom 3D user interface, 14 distinct minigames, and a dynamic progression system that tracks user scores across various subjects.

## Features

* **Gamified Learning Engine:** Integrates 14 interactive minigames covering subjects such as Shapes, Colors, Animals, Math, Logic (Even/Odd), and Spatial Directions.
* **Multi-Subject Progression Tracking:** Isolated score and experience point (XP) tracking for French, Spanish, Italian, German, and Mathematics.
* **Modern UI/UX:** Custom interface utilizing soft shadows, rounded inputs, and interactive pressable components to mimic standard gaming applications.
* **Authentication:** Secure user registration and login management powered by Firebase Authentication.
* **Profile Management:** Allows users to configure display names and upload local profile assets utilizing Expo Image Picker.
* **Cloud Synchronization:** High scores and aggregate XP are automatically synced and retrieved via Firebase Firestore.
* **Account Settings:** Centralized hub for users to manage account security, update profile configurations, and adjust application preferences.

## Tech Stack

* **Frontend:** React Native, Expo
* **Backend / Database:** Firebase (Authentication, Firestore)
* **Assets:** Expo Vector Icons (`@expo/vector-icons`)
* **Device APIs:** Expo Image Picker

## Getting Started

Follow these instructions to configure and execute the application in a local development environment.

### Prerequisites

* [Node.js](https://nodejs.org/) installed
* [Expo Go](https://expo.dev/client) application installed on a physical iOS or Android testing device
* A Firebase account with a configured web project (Authentication and Firestore enabled)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR-USERNAME/DialectDash.git](https://github.com/YOUR-USERNAME/DialectDash.git)
   cd DialectDash
