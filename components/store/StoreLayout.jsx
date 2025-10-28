'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"

const StoreLayout = ({ children }) => {

    const { getToken } = useAuth();
    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)

    const fetchIsSeller = async () => {
        console.log("🔄 [StoreLayout] Checking seller status...");

        try {
            const token = await getToken();
            console.log("🪪 [Auth] Token retrieved:", token ? "✅ Yes" : "❌ No token");

            if (!token) {
                console.warn("⚠️ No Clerk token found. User might not be logged in yet.");
                setLoading(false);
                return;
            }

            console.log("📡 [API] Sending request to /api/store/is-seller...");
            const { data } = await axios.get('/api/store/is-seller', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("✅ [API Response] /api/store/is-seller data:", data);

            setIsSeller(data.isSeller);
            setStoreInfo(data.storeInfo);

            if (data.isSeller) {
                console.log("🟢 User is a seller. Store info:", data.storeInfo);
            } else {
                console.log("🔴 User is not a seller.");
            }

        } catch (error) {
            console.error("❌ [Error] Verifying seller status failed:", error);
            toast.error("Error verifying seller status!");
        } finally {
            console.log("⏹️ [StoreLayout] Finished seller check. Stopping loading state.");
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchIsSeller();
    }, []);

    if (loading) {
        console.log("⏳ [Render] Loading screen shown...");
        return <Loading />;
    }

    console.log("🧭 [Render] StoreLayout rendering... Seller:", isSeller);

    return isSeller ? (
        <div className="flex flex-col h-screen">
            <SellerNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <SellerSidebar storeInfo={storeInfo} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">
                You are not authorized to access this page
            </h1>
            <Link
                href="/"
                className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full"
            >
                Go to home <ArrowRightIcon size={18} />
            </Link>
        </div>
    );
};

export default StoreLayout;
