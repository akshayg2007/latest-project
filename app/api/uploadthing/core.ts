import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
    // Profile picture uploader
    profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            console.log("UploadThing: Middleware for profileImage");
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("UploadThing: Upload complete for profileImage");
            return { url: file.url };
        }),

    // Service image uploader (for future use)
    serviceImage: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
        .middleware(async () => {
            console.log("UploadThing: Middleware for serviceImage");
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("UploadThing: Upload complete for serviceImage");
            return { url: file.url };
        }),

    // Visual Intro uploader (videos and images)
    visualIntro: f({
        image: { maxFileSize: "16MB", maxFileCount: 1 },
        video: { maxFileSize: "32MB", maxFileCount: 1 }
    })
        .middleware(async () => {
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("UploadThing: Visual intro uploaded for:", metadata.userId);
            return { url: file.url };
        }),

    // Product image uploader
    productImage: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
        .middleware(async () => {
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.url };
        }),

    // Product files uploader (zip, pdf, etc.)
    productFile: f({
        blob: { maxFileSize: "1GB", maxFileCount: 20 }
    })
        .middleware(async () => {
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.url };
        }),

    // Community Post media (images or video)
    communityPost: f({
        image: { maxFileSize: "16MB", maxFileCount: 1 },
        video: { maxFileSize: "32MB", maxFileCount: 1 }
    })
        .middleware(async () => {
            const session = await auth();
            if (!session?.user?.id) throw new Error("Unauthorized");
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
