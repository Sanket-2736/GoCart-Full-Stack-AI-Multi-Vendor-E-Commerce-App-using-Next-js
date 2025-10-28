import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
    console.log("--- Starting GET request for products ---");
    try {
        console.log("Attempting to fetch products from the database...");
        let products = await prisma.product.findMany({
            where : {inStock : true},
            include : {
                rating : {
                    select : {
                        createdAt : true, rating : true, review : true,
                        user : { select : {name : true, image : true} }
                    }
                },
                store : true
            },
            orderBy : { createdAt : 'desc' }
        });
        console.log(products)
        console.log(`Successfully fetched ${products.length} products (before filtering).`);

        // remove products with inactive stores
        console.log("Filtering out products from inactive stores...");
        
        products = products.filter(product => product.store.isActive);
        
        console.log(`Remaining products after filtering: ${products.length}`);
        
        console.log("Returning successful response.");
        console.log("--- Finished GET request for products ---");
        return NextResponse.json({products}, {status : 200});
    } catch (error) {
        console.error("❌ Error fetching products:", error);
        console.log("Returning error response.");
        console.log("--- Finished GET request for products with error ---");
        return NextResponse.json({message : "Error fetching products"}, {status : 500} );
    }
}