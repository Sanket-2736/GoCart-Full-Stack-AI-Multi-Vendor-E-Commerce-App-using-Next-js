import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        console.log("📩 POST /api/address called");

        const { userId } = getAuth(req);
        console.log("✅ Authenticated userId:", userId);

        const { address } = await req.json();
        console.log("📦 Received address data:", address);

        address.userId = userId;

        const newAddress = await prisma.address.create({
            data: address
        });

        console.log("✅ New address created:", newAddress);

        return NextResponse.json({ message: "Address added successfully" }, { status: 200 });
    } catch (error) {
        console.error("❌ Error adding address:", error);
        return NextResponse.json({ message: "Error adding address" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        console.log("📩 GET /api/address called");

        const { userId } = getAuth(req);
        console.log("✅ Authenticated userId:", userId);

        const addresses = await prisma.address.findMany({
            where: { userId }
        });

        console.log(`📦 Found ${addresses.length} address(es):`, addresses);

        return NextResponse.json({ addresses }, { status: 200 });
    } catch (error) {
        console.error("❌ Error getting address:", error);
        return NextResponse.json({ message: "Error getting address" }, { status: 500 });
    }
}
