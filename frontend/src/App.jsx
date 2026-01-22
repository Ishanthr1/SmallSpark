// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

// Pages
import HomePage from './styles/pages/HomePage';
import DashboardPage from './styles/pages/DashboardPage';
import ExplorePage from './styles/pages/ExplorePage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Route - Homepage */}
                <Route path="/" element={<HomePage />} />

                {/* Protected Routes - Require Authentication */}
                <Route
                    path="/dashboard"
                    element={
                        <>
                            <SignedIn>
                                <DashboardPage />
                            </SignedIn>
                            <SignedOut>
                                <RedirectToSignIn />
                            </SignedOut>
                        </>
                    }
                />

                <Route
                    path="/explore"
                    element={
                        <>
                            <SignedIn>
                                <ExplorePage />
                            </SignedIn>
                            <SignedOut>
                                <RedirectToSignIn />
                            </SignedOut>
                        </>
                    }
                />

                {/* Add more routes as needed */}
            </Routes>
        </Router>
    );
}

export default App;