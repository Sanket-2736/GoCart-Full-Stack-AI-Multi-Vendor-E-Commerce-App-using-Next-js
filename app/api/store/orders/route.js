import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function post(req) {
    try {
        const {userId} = getAuth(req);
        const storeId = await authSeller(userId);

        if(!storeId) {
            return new Response(JSON.stringify({message: "Unauthorized"}), {status: 401});
        }

        const {orderId, status} = await req.json();
        if(!orderId || !status) {
            return new Response(JSON.stringify({message: "Order ID and status are required"}), {status: 400});
        }

        await prisma.order.update({
            where : {id: orderId, storeId : storeId},
            data : {
                status
            }
        });

        return NextResponse.json({message: "Order status updated successfully!"});
    } catch (error) {
        console.error("❌ Update Order Status Error:", error);
        return new Response(JSON.stringify({message: "Internal Server Error"}), {status: 500});
    }
}

export async function get(req) {
    try {
        const {userId} = getAuth(req);
        const storeId = await authSeller(userId);

        if(!storeId) {
            return new Response(JSON.stringify({message: "Unauthorized"}), {status: 401});
        }

        const orders = await prisma.order.findMany({
            where : {storeId : storeId},
            orderBy : {createdAt : 'desc'},
            include : {
                user : true,
                address : true,
                orderItems : {include : {product : true}}
            }
        });

        return NextResponse.json({orders});
    } catch (error) {
        console.error("❌ Fetch Orders Error:", error);
        return new Response(JSON.stringify({message: "Internal Server Error"}), {status: 500});
    }
}