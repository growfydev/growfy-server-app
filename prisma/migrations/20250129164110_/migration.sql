-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VIRTUAL_ASSISTANT');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('BILLING', 'TECHNICAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "ProfileMemberRoles" AS ENUM ('MEMBER', 'OWNER', 'MANAGER', 'ANALYST', 'EDITOR', 'CONTENT_CREATOR', 'CLIENT', 'GUEST');

-- CreateEnum
CREATE TYPE "PermissionFlags" AS ENUM ('VIEW', 'VIEW_ANALYTICS', 'VIEW_INBOX', 'VIEW_PLANNER', 'VIEW_ADS', 'SMARTLINKS', 'EDIT', 'REPORTS', 'INBOX', 'ADS', 'HASHTAG_TRACKER', 'PLANNER', 'PLAN_AND_PUBLISH', 'PLAN_PENDING_REVIEW', 'REVIEW_POSTS', 'MANAGEMENT', 'BRAND');

-- CreateEnum
CREATE TYPE "GlobalStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('SCHEDULED', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('QUEUED', 'COMPLETED', 'CANCELED', 'FAILED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ProviderNames" AS ENUM ('FACEBOOK', 'YOUTUBE', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "StorageServices" AS ENUM ('GOOGLE_DRIVE', 'DROPBOX');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "otpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpSecret" TEXT,
    "otpAuthURI" TEXT,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL,
    "type" "TicketType" NOT NULL,
    "profileId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberRole" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "role" "ProfileMemberRoles" NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "MemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "shopifyIntegrationId" INTEGER,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "shopifyCustomerId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "profileId" INTEGER NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Social" (
    "id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "accountId" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "name" "ProviderNames" NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "status" "PostStatus" NOT NULL,
    "providerPostTypeId" INTEGER,
    "profileId" INTEGER NOT NULL,
    "fields" JSONB NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "postTypeId" INTEGER,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "unix" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "PostType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPostType" (
    "id" SERIAL NOT NULL,
    "providerId" INTEGER NOT NULL,
    "posttypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "characterLimit" INTEGER NOT NULL,
    "characterKey" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "properties" JSONB NOT NULL,

    CONSTRAINT "ProviderPostType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" "PermissionFlags" NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileRolePermission" (
    "id" SERIAL NOT NULL,
    "profileRoles" "ProfileMemberRoles" NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ProfileRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportFormat" (
    "id" SERIAL NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportFormat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" SERIAL NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "posts" JSONB,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageProfile" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "service" "StorageServices" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "StorageProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyIntegration" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "shopName" TEXT,
    "accessToken" TEXT,
    "code" TEXT,
    "isAuth" BOOLEAN NOT NULL DEFAULT false,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "shopEmail" TEXT,
    "shopDomain" TEXT,
    "shopCountry" TEXT,
    "shopCurrency" TEXT,
    "shopOwner" TEXT,
    "shopPlan" TEXT,
    "hasDiscounts" BOOLEAN DEFAULT false,
    "hasGiftCards" BOOLEAN DEFAULT false,

    CONSTRAINT "ShopifyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyOrder" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "financialStatus" TEXT,
    "currency" TEXT,
    "subTotal" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30),
    "shopifyCreatedAt" TIMESTAMP(3),
    "paymentMethods" TEXT[],
    "shippingAddress" TEXT,
    "shippingLat" DECIMAL(65,30),
    "shippingLong" DECIMAL(65,30),
    "statusPageUrl" TEXT,
    "shopifyCustomerId" TEXT,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "hasDiscounts" BOOLEAN DEFAULT false,
    "hasGiftCards" BOOLEAN DEFAULT false,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyLineItem" (
    "id" SERIAL NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "shopifyProductId" TEXT,
    "quantity" INTEGER,
    "price" DECIMAL(65,30),
    "originalUnitPrice" DECIMAL(65,30),
    "discountedUnitPrice" DECIMAL(65,30),
    "originalTotal" DECIMAL(65,30),
    "discountedTotal" DECIMAL(65,30),
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyProduct" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "title" TEXT,
    "totalInventory" INTEGER,
    "vendor" TEXT,
    "featuredImage" TEXT,
    "featuredImageAltText" TEXT,
    "minPrice" DECIMAL(65,30),
    "maxPrice" DECIMAL(65,30),
    "currency" TEXT,
    "collections" TEXT[],
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyDailyStats" (
    "id" SERIAL NOT NULL,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "avgOrderValue" DOUBLE PRECISION NOT NULL,
    "products" JSONB NOT NULL,
    "customers" JSONB NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_profileId_key" ON "Member"("userId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_shopifyCustomerId_key" ON "Customer"("shopifyCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Task_postId_key" ON "Task"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRolePermission_profileRoles_permissionId_key" ON "ProfileRolePermission"("profileRoles", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageProfile_profileId_service_key" ON "StorageProfile"("profileId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyIntegration_profileId_key" ON "ShopifyIntegration"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyOrder_orderId_key" ON "ShopifyOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyLineItem_lineItemId_key" ON "ShopifyLineItem"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyProduct_productId_key" ON "ShopifyProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyDailyStats_shopifyIntegrationId_date_key" ON "ShopifyDailyStats"("shopifyIntegrationId", "date");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRole" ADD CONSTRAINT "MemberRole_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social" ADD CONSTRAINT "Social_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social" ADD CONSTRAINT "Social_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_providerPostTypeId_fkey" FOREIGN KEY ("providerPostTypeId") REFERENCES "ProviderPostType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_postTypeId_fkey" FOREIGN KEY ("postTypeId") REFERENCES "PostType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPostType" ADD CONSTRAINT "ProviderPostType_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPostType" ADD CONSTRAINT "ProviderPostType_posttypeId_fkey" FOREIGN KEY ("posttypeId") REFERENCES "PostType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileRolePermission" ADD CONSTRAINT "ProfileRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageProfile" ADD CONSTRAINT "StorageProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyIntegration" ADD CONSTRAINT "ShopifyIntegration_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopifyCustomerId_fkey" FOREIGN KEY ("shopifyCustomerId") REFERENCES "Customer"("shopifyCustomerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopifyIntegrationId_fkey" FOREIGN KEY ("shopifyIntegrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyLineItem" ADD CONSTRAINT "ShopifyLineItem_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "ShopifyOrder"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyLineItem" ADD CONSTRAINT "ShopifyLineItem_shopifyProductId_fkey" FOREIGN KEY ("shopifyProductId") REFERENCES "ShopifyProduct"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyProduct" ADD CONSTRAINT "ShopifyProduct_shopifyIntegrationId_fkey" FOREIGN KEY ("shopifyIntegrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyDailyStats" ADD CONSTRAINT "ShopifyDailyStats_shopifyIntegrationId_fkey" FOREIGN KEY ("shopifyIntegrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
