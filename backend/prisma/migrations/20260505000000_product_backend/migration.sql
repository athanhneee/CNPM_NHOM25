-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `secondaryEmail` VARCHAR(191) NULL,
    `roles` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'LOCKED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `passwordDigest` VARCHAR(191) NOT NULL,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastLoginAt` DATETIME(3) NULL,
    `campus` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `citizenId` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL,
    `ethnicity` VARCHAR(191) NULL,
    `religion` VARCHAR(191) NULL,
    `birthPlace` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `homeTown` VARCHAR(191) NULL,
    `program` VARCHAR(191) NULL,
    `cohort` VARCHAR(191) NULL,
    `faculty` VARCHAR(191) NULL,
    `majorCode` VARCHAR(191) NULL,
    `majorName` VARCHAR(191) NULL,
    `studentClass` VARCHAR(191) NULL,
    `educationProgram` VARCHAR(191) NULL,
    `academicPeriod` VARCHAR(191) NULL,
    `studentStatus` VARCHAR(191) NULL,
    `classificationStatus` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `specialization` VARCHAR(191) NULL,
    `yearLevel` VARCHAR(191) NULL,
    `gpa` DOUBLE NULL,
    `attendanceRate` DOUBLE NULL,
    `completedCredits` INTEGER NULL,
    `interests` JSON NULL,
    `assignedSectionIds` JSON NULL,
    `bio` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `credits` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `department` VARCHAR(191) NOT NULL,
    `campus` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `prerequisites` JSON NOT NULL,
    `prestudy` JSON NOT NULL,
    `corequisites` JSON NOT NULL,
    `category` ENUM('FOUNDATION', 'CORE', 'ELECTIVE', 'THESIS') NOT NULL,
    `faculty` VARCHAR(191) NULL,
    `courseType` VARCHAR(191) NULL,
    `academicBlock` VARCHAR(191) NULL,
    `suggestedSemester` INTEGER NULL,
    `lectureHours` INTEGER NULL,
    `practiceHours` INTEGER NULL,
    `labHours` INTEGER NULL,
    `passingScore` DOUBLE NULL,
    `maxStudents` INTEGER NULL,
    `classSectionCount` INTEGER NULL,
    `gradingWeight` JSON NULL,
    `majorsSupported` JSON NULL,
    `majorCodesSupported` JSON NULL,
    `track` VARCHAR(191) NULL,
    `applicableSpecializations` JSON NULL,
    UNIQUE INDEX `Course_code_key`(`code`),
    INDEX `Course_status_idx`(`status`),
    INDEX `Course_department_idx`(`department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SemesterOption` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `academicYear` VARCHAR(191) NULL,
    `termCode` VARCHAR(191) NULL,
    `registrationStatus` ENUM('UPCOMING', 'OPEN', 'ADJUSTMENT', 'CLOSED', 'COMPLETED') NULL,
    `registrationStart` DATETIME(3) NULL,
    `registrationEnd` DATETIME(3) NULL,
    `adjustmentStart` DATETIME(3) NULL,
    `adjustmentEnd` DATETIME(3) NULL,
    INDEX `SemesterOption_isCurrent_idx`(`isCurrent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Section` (
    `id` VARCHAR(191) NOT NULL,
    `sectionCode` VARCHAR(191) NOT NULL,
    `courseCode` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `group` VARCHAR(191) NOT NULL,
    `subGroup` VARCHAR(191) NOT NULL,
    `lecturerId` VARCHAR(191) NOT NULL,
    `room` VARCHAR(191) NOT NULL,
    `weekday` INTEGER NOT NULL,
    `startPeriod` INTEGER NOT NULL,
    `periodCount` INTEGER NOT NULL,
    `weeks` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `registeredCount` INTEGER NOT NULL DEFAULT 0,
    `waitlistCount` INTEGER NOT NULL DEFAULT 0,
    `allowWaitlist` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('OPEN', 'CLOSED', 'FULL', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'OPEN',
    `campus` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `examSlot` VARCHAR(191) NULL,
    INDEX `Section_courseCode_idx`(`courseCode`),
    INDEX `Section_semesterId_idx`(`semesterId`),
    INDEX `Section_lecturerId_idx`(`lecturerId`),
    INDEX `Section_status_idx`(`status`),
    UNIQUE INDEX `Section_sectionCode_semesterId_key`(`sectionCode`, `semesterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'REGISTERED', 'CANCELLED', 'REJECTED', 'COMPLETED', 'FAILED', 'WAITLISTED', 'DROPPED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `cancelledAt` DATETIME(3) NULL,
    `droppedAt` DATETIME(3) NULL,
    `reasonCode` VARCHAR(191) NULL,
    `waitlistOrder` INTEGER NULL,
    `timeline` JSON NOT NULL,
    INDEX `Enrollment_studentId_semesterId_idx`(`studentId`, `semesterId`),
    INDEX `Enrollment_sectionId_idx`(`sectionId`),
    INDEX `Enrollment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WishRequest` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `semesterId` VARCHAR(191) NOT NULL,
    `courseCode` VARCHAR(191) NOT NULL,
    `preferredGroup` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    INDEX `WishRequest_studentId_semesterId_idx`(`studentId`, `semesterId`),
    INDEX `WishRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actorId` VARCHAR(191) NOT NULL,
    `actorRole` ENUM('STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN') NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `result` ENUM('SUCCESS', 'FAILURE', 'WARNING', 'INFO') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    INDEX `AuditLog_actorId_idx`(`actorId`),
    INDEX `AuditLog_targetId_idx`(`targetId`),
    INDEX `AuditLog_result_idx`(`result`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `simulationNow` DATETIME(3) NOT NULL,
    `registrationStart` DATETIME(3) NOT NULL,
    `registrationEnd` DATETIME(3) NOT NULL,
    `adjustmentStart` DATETIME(3) NOT NULL,
    `adjustmentEnd` DATETIME(3) NOT NULL,
    `withdrawalDeadline` DATETIME(3) NOT NULL,
    `maxCredits` INTEGER NOT NULL,
    `minCredits` INTEGER NOT NULL,
    `maintenanceMode` BOOLEAN NOT NULL,
    `allowWaitlist` BOOLEAN NOT NULL,
    `sessionTimeoutMinutes` INTEGER NOT NULL,
    `warningBeforeLogoutSeconds` INTEGER NOT NULL,
    `maxClassesPerDay` INTEGER NOT NULL,
    `maxClassesPerSemester` INTEGER NOT NULL,
    `currentSemesterId` VARCHAR(191) NOT NULL,
    `maintenanceMessage` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `SemesterOption`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `SemesterOption`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishRequest` ADD CONSTRAINT `WishRequest_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WishRequest` ADD CONSTRAINT `WishRequest_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `SemesterOption`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SystemSetting` ADD CONSTRAINT `SystemSetting_currentSemesterId_fkey` FOREIGN KEY (`currentSemesterId`) REFERENCES `SemesterOption`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
