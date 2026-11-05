# Design

## Context

See `proposal.md` for motivation and `docs/freelancer.md` for overall marketplace domain requirements.
The system currently has:
- A hierarchical location model in PostgreSQL (`Division`, `District`, `Thana`, `PostOffice`, `CityCorporation`, `Paurashava`, `Union`, `Ward`) with validation in `LocationsValidationService`.
- A 3-tier taxonomy (`ProfessionCategory`, `Profession`, `Skill`) implemented in `apps/api/src/taxonomy`.
- Phone OTP infrastructure (`OtpCode`, `mobireach-sms.service.ts`, `PasswordService`) in `apps/api/src/auth`.
- Frontend design systems incorporating `@agents/skills/frontend-design` and `@agents/skills/ui-ux-pro-max` (bilingual English + বাংলা, 44px touch targets, visible focus indicators, WCAG AA compliance, responsive stepper layout).

## Goals / Non-Goals

**Goals:**
- Provide secure registration for freelancers via SMS OTP (`FREELANCER_REGISTER`).
- Support draft creation, updates, and validation of comprehensive freelancer profiles (1–5 locations with exactly 1 primary, 1–10 services, up to 10 skills, up to 10 portfolio items).
- Validate location ancestry and mutual exclusivity using `LocationsValidationService`.
- Implement two-track profile updates: immediate application for minor fields (pricing, availability, locations, skills) vs pending `ProfileRevision` records for sensitive fields (name, photo, profession, about, portfolio).
- Implement admin moderation queues for approving/rejecting profiles and profile revisions.
- Build a responsive, accessible multi-step onboarding wizard in `apps/web` adhering strictly to `/frontend-design` and `/ui-ux-pro-max`.

**Non-Goals:**
- Marketplace public search, filters, and phone number reveal (covered in Stage 1.3).
- Membership subscriptions and PayStation payments (covered in Stage 1.4).
- Real-time messaging and chat gateways (covered in Stage 1.5).

## Decisions

### 1. Account & Profile Model (1:1 with User)
- **Decision**: Keep `User.role = CUSTOMER` and attach a 1:1 `FreelancerProfile` record. A customer can hire or be hired without maintaining separate logins.
- **Alternatives considered**:
  - Separate `Freelancer` entity not connected to `User`: Rejected; duplicates auth, passwords, sessions, and notification infrastructure.
  - Adding a `FREELANCER` enum value to `User.role`: Rejected; prevents a user from acting as both a customer buying products and a professional offering services.

### 2. Location Storage & Validation
- **Decision**: Store denormalized location fields (`divisionId`, `districtId`, `thanaId`, `postOfficeId`, `cityCorporationId`, `wardId`, `paurashavaId`, `unionId`, `isPrimary`, `localityText`) in `FreelancerLocation`. Max 5 records per freelancer with exactly one marked `isPrimary: true`. Validate every location row via `LocationsValidationService.validateHierarchy()` before saving.
- **Alternatives considered**:
  - Storing only leaf node IDs (e.g. only `wardId` or `unionId`): Rejected; queries for division/district/thana filtering would require multi-table joins on high-volume marketplace search queries.

### 3. Two-Track Profile Revision Strategy
- **Decision**: Field-level routing:
  - **Minor fields**: `availability`, `services`, `skills`, `locations` update the active `FreelancerProfile` immediately.
  - **Sensitive fields**: `displayName`, `photoUrl`, `professionId`, `about`, `portfolio` update active records directly only when status is `DRAFT` or `REJECTED`. When status is `APPROVED`, sensitive updates serialize into a `ProfileRevision` record in `PENDING` status with payload `{ displayName?, photoUrl?, professionId?, about?, portfolio? }`.
- **Alternatives considered**:
  - Full profile cloning on every edit: Creates excessive data duplication and complicates active booking/messaging references.
  - No moderation after initial approval: Poses significant trust and fraud risks (e.g., bait-and-switch profiles).

### 4. Frontend UI/UX Design System (`frontend-design` & `ui-ux-pro-max`)

#### 4.1 Aesthetic Direction & Principles
- **Subject-Specific Personality**: Professional Bangladeshi trade & service directory (electricians, technicians, plumbers, consultants). Clean, high-trust, functional layout avoiding cliché template tells.
- **Bilingual Typographic Harmony**: Pair `Inter` (for English numerals & labels) with `Hind Siliguri` (for fluent Bengali rendering), preserving line-height (1.5) and balanced text wraps.
- **Touch & Accessibility Standards**:
  - Minimum 44×44px interactive target dimensions across all buttons, selectors, and chip items.
  - Visible focus rings with high-contrast outlines (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).
  - WCAG AA 4.5:1 text-to-background contrast ratio (slate-900 `#0F172A` text on slate-50 `#F8FAFC` page background; blue-700 `#1D4ED8` primary actions).
  - SVG iconography exclusively via `lucide-react` (never raw emojis).
  - Motion with purpose: subtle 150–200ms ease transitions respecting `prefers-reduced-motion`.

#### 4.2 Semantic Token System
| Token Name | Hex Code | Semantic Role |
|------------|----------|---------------|
| `primary` | `#1D4ED8` | Primary CTA buttons, active wizard steps, verified checkmarks |
| `primary-hover` | `#1E40AF` | Hover state for interactive primary actions |
| `primary-soft` | `#EFF6FF` | Subtle selection cards, active pills, step background |
| `navy` | `#0F172A` | Core heading text, strong contrast badges, dark mode surface |
| `surface` | `#FFFFFF` | Form card background, input fields, modal surfaces |
| `page` | `#F8FAFC` | Page backdrop providing subtle depth separation |
| `border` | `#E2E8F0` | Structural card borders and input field outlines |
| `muted-text` | `#64748B` | Helper captions, secondary metadata, bilingual sublabels |
| `status-approved` | `#16A34A` | Approved live badge (`অনুমোদিত`), available badge |
| `status-pending` | `#D97706` | Pending moderation badge (`অপেক্ষমান`), revision alert |
| `status-rejected` | `#DC2626` | Rejected / revision required alert (`সংশোধন প্রয়োজন`) |

#### 4.3 Onboarding Wizard Stepper (ASCII Wireframe)
```
+-----------------------------------------------------------------------------------+
|  A to Z Professional Onboarding / পেশাদার নিবন্ধন                                    |
+-----------------------------------------------------------------------------------+
|  [1. পরিচিতি / Identity] -> [2. পেশা / Profession] -> [3. সেবা / Services]         |
|         -> [4. এলাকা / Locations] -> [5. পোর্টফোলিও ও জমা / Submit]               |
+-----------------------------------------------------------------------------------+
|  ধাপ ১: ব্যক্তিগত ও পেশাগত তথ্য (Personal & Professional Info)                         |
|                                                                                   |
|  [ প্রোফাইল ছবি / Photo Upload ]  (Max 2MB, JPG/PNG, 1:1 Aspect Ratio)            |
|                                                                                   |
|  পূর্ণ নাম (Full Name) *                                                          |
|  [ মো: করিম উল্লাহ / Md. Karim Ullah                             ]                |
|                                                                                   |
|  পেশাগত পদবী (Professional Title) *                                               |
|  [ সার্টিফাইড ইলেকট্রিশিয়ান / Certified Electrical Technician      ]             |
|                                                                                   |
|  কাজের অভিজ্ঞতা (Years of Experience) *                                            |
|  [ 5 বছর / 5 Years                                             ]                  |
|                                                                                   |
|  আপনার সম্পর্কে বিবরণ (About & Bio) *                                             |
|  +-----------------------------------------------------------------------------+  |
|  | দক্ষ এবং নির্ভরযোগ্য বিদ্যুৎ ও ওয়্যারিং সমাধান প্রদানকারী...                 |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  [ পূর্ববর্তী / Back ]                              [ পরবর্তী ধাপ / Next Step -> ] |
+-----------------------------------------------------------------------------------+
```

#### 4.4 Freelancer Dashboard Wireframe
```
+-----------------------------------------------------------------------------------+
|  ড্যাশবোর্ড (Freelancer Dashboard)                        [ কাজ নিচ্ছেন / AVAILABLE v] |
+-----------------------------------------------------------------------------------+
|  ! সতর্কতা: আপনার প্রোফাইল সংশোধনীটি পর্যালোচনার জন্য অপেক্ষমান রয়েছে              |
|    (Notice: A profile revision is currently pending admin review)                 |
+-----------------------------------------------------------------------------------+
|  +------------------------+  +------------------------+  +----------------------+  |
|  | স্ট্যাটাস (Status)     |  | শুরু রেট (Starts From) |  | কভারেজ এরিয়া         |  |
|  | [ লাইভ / APPROVED ]    |  | ৳ ৫০০ / Fixed          |  | ৩ টি এলাকা (Dhaka)   |  |
|  +------------------------+  +------------------------+  +----------------------+  |
|                                                                                   |
|  [ সেবা সমূহ পরিচালনা ]    [ লোকেশন আপডেট ]    [ পোর্টফোলিও যোগ ]   [ প্রোফাইল এডিট ]  |
+-----------------------------------------------------------------------------------+
```

## Architecture & Data Schema

### Prisma Schema Additions
```prisma
enum FreelancerStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}

enum FreelancerAvailability {
  AVAILABLE
  BUSY
  UNAVAILABLE
}

enum ServicePriceType {
  FIXED
  HOURLY
  DAILY
  NEGOTIABLE
}

enum RevisionStatus {
  PENDING
  APPROVED
  REJECTED
}

model FreelancerProfile {
  id              String                 @id @default(uuid())
  userId          String                 @unique
  status          FreelancerStatus       @default(DRAFT)
  displayName     String                 @db.VarChar(150)
  photoUrl        String?                @db.VarChar(500)
  professionId    Int?
  title           String?                @db.VarChar(150)
  about           String?                @db.Text
  experienceYears Int                    @default(0)
  email           String?                @db.VarChar(150)
  address         String?                @db.VarChar(255)
  availability    FreelancerAvailability @default(AVAILABLE)
  startingPrice   Int?                   // Cached minimum non-negotiable price in BDT
  rejectionReason String?                @db.Text
  rejectionCount  Int                    @default(0)
  approvedAt      DateTime?
  approvedById    String?
  suspendedAt     DateTime?
  suspendReason   String?                @db.Text
  featuredUntil   DateTime?
  lastActiveAt    DateTime?
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  user            User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  profession      Profession?            @relation(fields: [professionId], references: [id], onDelete: SetNull)
  locations       FreelancerLocation[]
  services        FreelancerService[]
  skills          FreelancerSkill[]
  portfolio       PortfolioItem[]
  revisions       ProfileRevision[]

  @@index([status, professionId])
  @@index([status, availability])
  @@index([startingPrice])
  @@index([experienceYears])
  @@map("FreelancerProfile")
}

model FreelancerLocation {
  id                String             @id @default(uuid())
  freelancerId      String
  divisionId        Int
  districtId        Int
  thanaId           Int
  postOfficeId      Int
  cityCorporationId Int?
  wardId            Int?
  paurashavaId      Int?
  unionId           Int?
  localityText      String?            @db.VarChar(100)
  isPrimary         Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  freelancer        FreelancerProfile  @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  division          Division           @relation(fields: [divisionId], references: [id])
  district          District           @relation(fields: [districtId], references: [id])
  thana             Thana              @relation(fields: [thanaId], references: [id])
  postOffice        PostOffice         @relation(fields: [postOfficeId], references: [id])
  cityCorporation   CityCorporation?   @relation(fields: [cityCorporationId], references: [id])
  ward              Ward?              @relation(fields: [wardId], references: [id])
  paurashava        Paurashava?        @relation(fields: [paurashavaId], references: [id])
  union             Union?             @relation(fields: [unionId], references: [id])

  @@index([freelancerId])
  @@index([divisionId])
  @@index([districtId])
  @@index([thanaId])
  @@index([postOfficeId])
  @@map("FreelancerLocation")
}

model FreelancerService {
  id           String            @id @default(uuid())
  freelancerId String
  title        String            @db.VarChar(150)
  description  String?           @db.Text
  priceType    ServicePriceType  @default(FIXED)
  amount       Int?              // in BDT, nullable if NEGOTIABLE
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)

  @@index([freelancerId])
  @@map("FreelancerService")
}

model FreelancerSkill {
  freelancerId String
  skillId      Int
  createdAt    DateTime          @default(now())

  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)
  skill        Skill             @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([freelancerId, skillId])
  @@index([skillId])
  @@map("FreelancerSkill")
}

model PortfolioItem {
  id           String            @id @default(uuid())
  freelancerId String
  imageUrl     String            @db.VarChar(500)
  caption      String?           @db.VarChar(200)
  sortOrder    Int               @default(0)
  createdAt    DateTime          @default(now())

  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)

  @@index([freelancerId])
  @@map("PortfolioItem")
}

model ProfileRevision {
  id           String            @id @default(uuid())
  freelancerId String
  payload      Json
  status       RevisionStatus    @default(PENDING)
  reviewedById String?
  reason       String?           @db.Text
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  freelancer   FreelancerProfile @relation(fields: [freelancerId], references: [id], onDelete: Cascade)

  @@index([freelancerId, status])
  @@map("ProfileRevision")
}
```

## Risks / Trade-offs

- **[Risk] High volume of revision submissions spamming admin queue** → *Mitigation*: Only allow one `PENDING` revision per freelancer at a time; new sensitive edits replace or merge into the existing pending revision until reviewed.
- **[Risk] Location data inconsistency if raw foreign keys are bypassed** → *Mitigation*: Centralize validation inside `LocationsValidationService.validateHierarchy()` invoked on every update before database persistence.
- **[Risk] Starting price cache getting out of sync** → *Mitigation*: Automatically recalculate `startingPrice = min(amount)` whenever services are added, removed, or updated in a database transaction.
