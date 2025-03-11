import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const AuthScreen: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isRegister, setIsRegister] = useState<boolean>(false);

    // Define mutation with correct TypeScript types
    const mutation = useMutation<
        { token: string }, // Response data type
        Error, // Error type
        { email: string; password: string } // Expected argument type
    >({
        mutationFn: async (userData) => {
            const endpoint = isRegister
                ? 'http://localhost:3009/api/register'
                : 'http://localhost:3009/api/login';

            const { data } = await axios.post(endpoint, userData);
            return data; // Ensure it returns expected `{ token: string }`
        },
        onSuccess: (data) => {
            if (data.token) {
                localStorage.setItem('token', data.token);
                alert('Success!');
            }
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || 'An error occurred');
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        mutation.mutate({ email, password });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-2xl font-bold mb-4">{isRegister ? 'Register' : 'Login'}</h2>
            <form className="space-y-4 w-full max-w-md" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    className="p-3 border rounded w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="p-3 border rounded w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded w-full transition"
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? 'Processing...' : isRegister ? 'Sign Up' : 'Login'}
                </button>
            </form>
            <button
                className="mt-4 text-blue-500 hover:underline"
                onClick={() => setIsRegister(!isRegister)}
            >
                {isRegister ? 'Already have an account? Login' : 'New here? Register'}
            </button>
        </div>
    );
};

export default AuthScreen;
