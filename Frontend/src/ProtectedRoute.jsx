import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentAdmin } from "../api/axios.js";

const ProtectedRoute = () => {

    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {

        const checkAuthentication = async () => {

            try {

                await getCurrentAdmin();

                setAuthenticated(true);

            } catch (error) {

                setAuthenticated(false);

            } finally {

                setLoading(false);

            }

        };

        checkAuthentication();

    }, []);

    if (loading) {

        return (
            <div>
                Checking authentication...
            </div>
        );

    }

    if (!authenticated) {

        return (
            <Navigate
                to="/admin/login"
                replace
            />
        );

    }

    return <Outlet />;
};

export default ProtectedRoute;