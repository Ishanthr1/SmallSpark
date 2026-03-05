// frontend/src/App.jsx
import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { ensureProfileForUser } from './lib/profiles';

// Pages
import HomePage from './styles/pages/HomePage';
import DashboardPage from './styles/pages/DashboardPage';
import ExplorePage from './styles/pages/ExplorePage';
import BusinessPage from './styles/pages/BusinessPage';
import FriendsPage from './styles/pages/FriendsPage';

function SyncUser() {
    const { user, isSignedIn } = useUser();
    const synced = useRef(false);
    useEffect(() => {
        if (isSignedIn && user && !synced.current) {
            synced.current = true;
            ensureProfileForUser(user).catch(console.error);
        }
    }, [isSignedIn, user]);
    return null;
}

function App() {
    return (
        <Router>
            <SyncUser />
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

                <Route
                    path="/business/:id"
                    element={
                        <>
                            <SignedIn>
                                <BusinessPage />
                            </SignedIn>
                            <SignedOut>
                                <RedirectToSignIn />
                            </SignedOut>
                        </>
                    }
                />

                <Route
                    path="/friends"
                    element={
                        <>
                            <SignedIn>
                                <FriendsPage />
                            </SignedIn>
                            <SignedOut>
                                <RedirectToSignIn />
                            </SignedOut>
                        </>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;