import { PostStatus } from "@prisma/client";
import { prisma } from "../src/db/prisma.js";

// Users are NOT seeded here: this backend reuses the shared CoreMap accounts in
// app_auth.auth_users. The seed only attaches a few sample community posts to an
// existing shared account so the boards are not empty in development.

const seedPosts = [
  {
    publicId: "22222222-2222-4222-8222-222222222001",
    title: "Water outage on Oak Street",
    topic: "Utilities",
    description: "Residents report no water since 6 AM near Oak Street.",
    status: PostStatus.free_board,
    trustScore: 42,
    createdAt: new Date("2026-07-01T08:00:00.000Z"),
  },
  {
    publicId: "22222222-2222-4222-8222-222222222002",
    title: "Free flu shots at community center",
    topic: "Health",
    description: "Walk-in flu shots available this Saturday 9 AM–2 PM.",
    status: PostStatus.community_confirmed,
    trustScore: 78,
    createdAt: new Date("2026-07-02T10:00:00.000Z"),
  },
  {
    publicId: "22222222-2222-4222-8222-222222222003",
    title: "Road closure on Main Ave",
    topic: "Traffic",
    description: "City confirmed lane closure for pipe repair until Friday.",
    status: PostStatus.admin_verified,
    trustScore: 91,
    createdAt: new Date("2026-07-03T12:00:00.000Z"),
  },
  {
    publicId: "22222222-2222-4222-8222-222222222004",
    title: "Lost cat near Park Lane",
    topic: "Lost & Found",
    description: "Gray tabby cat, green collar. Last seen near Park Lane.",
    status: PostStatus.free_board,
    trustScore: 35,
    createdAt: new Date("2026-07-04T09:30:00.000Z"),
  },
  {
    publicId: "22222222-2222-4222-8222-222222222005",
    title: "Suspicious door-to-door sales",
    topic: "Safety",
    description: "Unverified group asking for donations door-to-door.",
    status: PostStatus.rejected,
    trustScore: 18,
    createdAt: new Date("2026-07-05T14:00:00.000Z"),
  },
];

async function main() {
  const author = await prisma.authUser.findFirst({ orderBy: { id: "asc" } });

  if (!author) {
    console.log(
      "No shared auth users found in app_auth.auth_users; skipping post seed.",
    );
    return;
  }

  for (const post of seedPosts) {
    await prisma.communityPost.upsert({
      where: { publicId: post.publicId },
      update: {},
      create: {
        ...post,
        authorId: author.id,
      },
    });
  }

  console.log(
    `Seed complete: 5 community posts attached to shared auth user ${author.email}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
