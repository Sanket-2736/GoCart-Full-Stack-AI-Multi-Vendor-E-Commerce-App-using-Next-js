import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    console.log("📦 [API] /api/store/product - Product creation started");

    try {
        const { userId } = getAuth(req);
        console.log("👤 Clerk userId:", userId);

        const storeId = await authSeller(userId);
        console.log("🏬 Store ID (from authSeller):", storeId);

        if (!storeId) {
            console.warn("🚫 Unauthorized access — user is not a seller");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        console.log("🧾 FormData received:", Array.from(formData.keys()));

        const name = formData.get("name");
        const description = formData.get("description");
        const category = formData.get("category");
        const images = formData.getAll("images");
        const price = Number(formData.get("price"));
        const mrp = Number(formData.get("mrp"));

        // Validation
        if (!name || !description || !category || images.length === 0 || !price || !mrp) {
            console.warn("⚠️ Missing required fields in product creation");
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        console.log(`🖼️ Uploading ${images.length} image(s) to ImageKit...`);

        const imagesUrl = await Promise.all(
            images.map(async (image) => {
                const buffer = Buffer.from(await image.arrayBuffer());
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: `${Date.now()}-${name}`,
                    folder: "products",
                });

                const url = imagekit.url({
                    src: response.url,
                    transformation: [
                        { quality: "auto" },
                        { format: "webp" },
                        { width: "1024" },
                    ],
                });

                console.log("✅ Uploaded image:", url);
                return url;
            })
        );


        console.log("🗄️ Saving product to database...");
        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId,
            },
        });

        console.log("✅ Product created successfully!");
        return NextResponse.json({ message: "Product created successfully" });
    } catch (error) {
        console.error("❌ Error creating product:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}


export async function GET(req) {
    try {
        const {userId} = getAuth(req);
        const storeId = await authSeller(userId);

        if(!storeId){
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            where: { storeId: storeId }
        })

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}