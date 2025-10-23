import prisma from "@/lib/prisma"

const authSeller = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { store: true }
        });

        if(user.store && user.store.status === 'approved'){
            return user.store.id;
        }

        return false
    } catch (error) {
        console.error('Error in authSeller middleware:', error);
        return false;
    };
}

export default authSeller;