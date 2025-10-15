import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // State for changing password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // State for changing username
    const [username, setUsername] = useState(currentUser?.displayName || '');
    const [usernameError, setUsernameError] = useState('');
    const [usernameSuccess, setUsernameSuccess] = useState('');


    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            return setPasswordError("Passwords do not match.");
        }
        if (newPassword.length < 6) {
            return setPasswordError("Password should be at least 6 characters long.");
        }

        try {
            await updatePassword(currentUser, newPassword);
            setPasswordSuccess("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError("Failed to update password. Please log out and log in again before trying.");
            console.error(err);
        }
    };

    const handleUsernameUpdate = async (e) => {
        e.preventDefault();
        setUsernameError('');
        setUsernameSuccess('');

        if (username.trim().length < 3) {
            return setUsernameError("Username must be at least 3 characters long.");
        }

        try {
            await updateProfile(currentUser, { displayName: username.trim() });
            setUsernameSuccess("Username updated successfully! You may need to refresh the page to see changes across the site.");
        } catch (err) {
            setUsernameError("Failed to update username.");
            console.error(err);
        }
    };


    if (!currentUser) {
        // Redirect to login if not authenticated
        navigate('/auth');
        return null;
    }

    return (
        <div className="flex justify-center min-h-screen pt-28 pb-20 px-4">
            <div className="w-full max-w-md space-y-8">
                {/* --- USERNAME FORM --- */}
                <div className="p-8 space-y-6 bg-[var(--bg-secondary)] rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-center text-[var(--text-primary)]">
                        My Profile
                    </h1>
                     <div className="text-center border-b border-[var(--border-color)] pb-4">
                        <p className="text-lg text-[var(--text-secondary)]">Email Address</p>
                        <p className="text-xl font-semibold text-[var(--text-primary)] break-words">{currentUser.email}</p>
                    </div>
                    <form onSubmit={handleUsernameUpdate} className="space-y-6">
                        <h2 className="text-xl font-bold text-center text-[var(--text-primary)]">
                            Display Name
                        </h2>
                        <div>
                            <label className="text-sm font-bold text-[var(--text-secondary)]">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full p-3 mt-1 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                            />
                        </div>
                        {usernameError && <p className="text-red-500 text-sm text-center">{usernameError}</p>}
                        {usernameSuccess && <p className="text-green-500 text-sm text-center">{usernameSuccess}</p>}
                        <button type="submit" className="w-full py-3 font-bold bg-[var(--brand-color)] rounded-md hover:bg-red-700 transition-colors">
                            Update Username
                        </button>
                    </form>
                </div>

                {/* --- PASSWORD FORM --- */}
                <div className="p-8 space-y-6 bg-[var(--bg-secondary)] rounded-lg shadow-lg">
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                        <h2 className="text-xl font-bold text-center text-[var(--text-primary)]">
                            Change Password
                        </h2>
                        <div>
                            <label className="text-sm font-bold text-[var(--text-secondary)]">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full p-3 mt-1 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-[var(--text-secondary)]">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-3 mt-1 bg-[var(--bg-tertiary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)]"
                            />
                        </div>
                        {passwordError && <p className="text-red-500 text-sm text-center">{passwordError}</p>}
                        {passwordSuccess && <p className="text-green-500 text-sm text-center">{passwordSuccess}</p>}
                        <button type="submit" className="w-full py-3 font-bold bg-[var(--brand-color)] rounded-md hover:bg-red-700 transition-colors">
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};