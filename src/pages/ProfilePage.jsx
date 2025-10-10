import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from 'firebase/auth';

export const ProfilePage = () => {
    const { currentUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }
        if (newPassword.length < 6) {
            return setError("Password should be at least 6 characters long.");
        }

        try {
            await updatePassword(currentUser, newPassword);
            setSuccess("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            // Usually, this fails if the user hasn't logged in recently.
            // A full implementation would require re-authentication.
            setError("Failed to update password. Please log out and log in again before trying.");
            console.error(err);
        }
    };

    if (!currentUser) {
        return <p className="text-center pt-28">Please log in to view your profile.</p>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen pt-20">
            <div className="w-full max-w-md p-8 space-y-6 bg-[var(--bg-secondary)] rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center text-[var(--text-primary)]">
                    My Profile
                </h1>
                
                <div className="text-center border-b border-[var(--border-color)] pb-4">
                    <p className="text-lg text-[var(--text-secondary)]">Email Address</p>
                    <p className="text-xl font-semibold text-[var(--text-primary)]">{currentUser.email}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                    <button type="submit" className="w-full py-3 font-bold bg-[var(--brand-color)] rounded-md hover:bg-red-700 transition-colors">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};