import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../api/axios";
import "./AdminLogin.css";

const AdminLogin = () => {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            await apiRequest(
                "/auth/login",
                "POST",
                {
                    email,
                    password,
                }
            );

            navigate("/admin", {
                replace: true,
            });

        } catch (error) {

            setError(
                error?.message ||
                "Login failed."
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="admin-login-page">

            <div className="admin-login-card">

                <h1>Officials Login</h1>

                <p>
                    Competition Management System
                </p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                            autoComplete="email"
                        />

                    </div>

                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                            autoComplete="current-password"
                        />

                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default AdminLogin;