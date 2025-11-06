import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PaymentMethod, Prisma } from "@prisma/client"; 
import Stripe from 'stripe'

export async function POST(req) {
    console.log("📩 [POST /api/order] Request received for new order creation.");

    try {
        const authResult = getAuth(req);
        const userId = authResult.userId;
        const has = authResult.has;

        console.log("✅ Authenticated userId:", userId);

        if (!userId) {
            console.warn("❌ Unauthorized access attempt (no userId).");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { addressId, items, couponCode, paymentMethod } = await req.json();
        console.log("🛒 Order request body:", { addressId, items, couponCode, paymentMethod });

        if (!addressId || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
            console.warn("❌ Missing required fields for order creation.");
            return NextResponse.json({ error: "Missing required order details (addressId, items, or paymentMethod)." }, { status: 400 });
        }

        let coupon = null;
        let couponDataForOrder = {};

        if (couponCode) {
            console.log("🏷️ Coupon code provided:", couponCode);
            const codeToSearch = couponCode.toUpperCase();

            coupon = await prisma.coupon.findFirst({
                where: { code: codeToSearch },
            });

            if (!coupon) {
                console.warn(`❌ Coupon '${couponCode}' not found.`);
                return NextResponse.json({ error: `Coupon '${couponCode}' not found!` }, { status: 404 });
            }

            if (coupon.expiresAt < new Date()) {
                console.warn(`⚠️ Coupon '${couponCode}' has expired.`);
                return NextResponse.json({ error: `Coupon '${couponCode}' has expired!` }, { status: 410 });
            }

            if (coupon.forNewUser) {
                const userOrders = await prisma.order.findMany({ where: { userId } });
                if (userOrders.length > 0) {
                    console.warn("❌ Coupon valid for new users only.");
                    return NextResponse.json({ error: "Coupon valid for new users only." }, { status: 400 });
                }
            }

            const isProMember = has({ plan: "pro" });
            if (coupon.forMember && !isProMember) {
                console.warn("❌ Coupon valid for members only.");
                return NextResponse.json({ error: "Coupon valid for members only." }, { status: 400 });
            }

            couponDataForOrder = {
                code: coupon.code,
                discount: coupon.discount,
                description: coupon.description,
            };

            console.log("✅ Coupon validated:", couponDataForOrder);
        }

        const orderByStore = new Map();
        let totalCartAmount = 0;

        console.log("🧾 Validating products and grouping by store...");
        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.id },
            });

            if (!product) {
                console.warn(`❌ Product with ID ${item.id} not found.`);
                return NextResponse.json({ error: `Product with ID ${item.id} not found.` }, { status: 404 });
            }

            const itemPrice = product.price;
            totalCartAmount += itemPrice * item.quantity;

            const storeId = product.storeId;
            if (!orderByStore.has(storeId)) orderByStore.set(storeId, []);

            orderByStore.get(storeId).push({ ...item, price: itemPrice });
        }

        console.log("✅ Products grouped by store:", Array.from(orderByStore.keys()));

        let fullAmount = 0;
        let isShippingFeeAdded = false;
        const isProMember = has({ plan: "pro" });
        let orderIds = [];

        for (const [storeId, sellerItems] of orderByStore.entries()) {
            let subtotal = sellerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            let total = subtotal;

            if (coupon) {
                total -= (total * coupon.discount) / 100;
                console.log(`💰 Applied coupon (${coupon.discount}% off): New total = ${total.toFixed(2)}`);
            }

            let shippingFee = 0;
            if (!isProMember && !isShippingFeeAdded) {
                shippingFee = 5;
                total += shippingFee;
                isShippingFeeAdded = true;
                console.log("🚚 Shipping fee added: $5");
            }

            fullAmount += parseFloat(total.toFixed(2));

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? couponDataForOrder : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
            });

            console.log(`🧾 Order created for store ${storeId} → Order ID: ${order.id}`);
            orderIds.push(order.id);
        }

        if(paymentMethod === "STRIPE"){
            const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
            const origin = await req.headers.get('origin');

            const session = await stripe.checkout.sessions({
                payment_method_types : ['card'],
                line_items : [{
                    price_data : {
                        currency : 'usd',
                        product_data : {
                            name : 'Order'
                        },unit_amount : Math.round(fullAmount * 100)
                    },
                    quantity: 1
                }],
                expires_at : Math.floor(Date.now() / 1000) + 30 * 60,
                mode : 'payment',
                success_url: `${origin}/loading?nextUrl=orders`,
                cancel_url: `${origin}/cart`,
                metadata : {
                    orderIds: orderIds.join(','), userId, appId: 'gocart'
                }
            });

            return NextResponse.json({session})
        }

        await prisma.user.update({
            where: { id: userId },
            data: { cart: {} },
        });

        console.log("🧹 User cart cleared after successful order placement.");

        return NextResponse.json({
            message: "✅ Orders placed successfully!",
            orderIds,
            fullAmount,
        });
    } catch (error) {
        console.error("🔥 Error in [POST /api/order]:", error);
        return NextResponse.json({ error: "Internal server error during order processing." }, { status: 500 });
    }
}

export async function GET(req) {
    console.log("📩 [GET /api/order] Request received for fetching user orders.");

    try {
        const { userId } = getAuth(req);
        console.log("✅ Authenticated userId:", userId);

        if (!userId) {
            console.warn("❌ Unauthorized access attempt to get orders.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    { paymentMethod: PaymentMethod.COD },
                    {
                        AND: [
                            { paymentMethod: PaymentMethod.STRIPE },
                            { isPaid: true },
                        ],
                    },
                ],
            },
            include: {
                orderItems: { include: { product: true } },
                address: true,
            },
            orderBy: { createdAt: "desc" },
        });

        console.log(`📦 ${orders.length} orders fetched for user ${userId}.`);

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("🔥 Error in [GET /api/order]:", error);
        return NextResponse.json({ error: "Internal server error while fetching orders." }, { status: 500 });
    }
}
