# Dumala Web App Flowcharts

Updated: 2026-06-24 (optimized pass)

These diagrams align the planned SaaS/recruitment direction with the current Dumala architecture.

The existing product is a local-first React/Vite coaching workspace. Accounts, cloud teams, player applications, role-based access, payments, chat, and league administration are future capabilities, so they should be shown as planned flows rather than current app behavior.

**Changes in this pass:**
1. MVP chart — added guardian/parental consent path for minors (replaces the hard 18+ block, which previously locked out most grassroots players).
2. MVP chart — added the cloud-to-local sync-back edge so accepted players don't get stranded when a coach decides on a non-primary device.
3. MVP chart — added a returning-player sign-in branch (dashboard with application statuses), not just first-time signup.
4. New standalone chart — **Public Player Profiles & Highlights**, including FPRDS-verified attributes as a differentiator versus a generic social feed.
5. Roadmap chart — Phase 5 now references the new standalone chart and is broken into sub-items consistent with the other phases.

## Current App Flow

Paste this chart into Mermaid Live to show what Dumala supports today. (Unchanged — this is accurate documentation of the existing local-first app.)

```mermaid
flowchart TD
    A[Dumala PWA] --> B{Existing local workspace?}

    B -- No --> C[Local Team Onboarding]
    C --> D[Create browser workspace]
    D --> E[Coaching App Shell]

    B -- Yes --> F[Startup Validation]
    F --> G{Saved data valid?}
    G -- Yes --> E
    G -- No --> H[Recovery Screen]
    H --> H1[Export Recovery Snapshot]
    H --> H2[Retry Startup]
    H --> H3[View Diagnostics]
    H --> H4[Confirmed Reset]
    H4 --> C

    E --> I[Home]
    E --> J[Squad]
    E --> K[Tactics]
    E --> L[Development]
    E --> M[League & Updates]

    I --> I1[Overview]
    I --> I2[Game Week]
    I2 --> I3[Schedule, Availability, Results]

    J --> J1[Player Roster]
    J --> J2[Staff Directory]
    J --> J3[Profile Editing]
    J --> J4[Backup Export / Import]

    K --> K1[Formation]
    K --> K2[Lineup Auto-Fill]
    K --> K3[Touch Dragging]
    K --> K4[Board Drawing]
    K --> K5[Roles and Notes]

    L --> L1[Training]
    L --> L2[FPRDS Assessments]
    L2 --> L3[Scores, History, Development Plans]

    M --> M1[Standings]
    M --> M2[Bulletins]
    M --> M3[Updates / Roadmap]

    E --> N[Local Storage Persistence]
    N --> O[Offline PWA Shell]
    N --> P[Quota Warning]
    N --> Q[Full Workspace V3 Backup]
```

## Planned SaaS Landing Page and Recruitment MVP

Paste this chart into Mermaid Live to show the next planned product direction before full Phase 3 sync.

```mermaid
flowchart TD
    A[Dumala Public Site] --> B[Landing Page]
    B --> C[Hero and Product Positioning]
    B --> D[Features]
    B --> E[Free Beta Pricing]
    B --> F[Get Started]
    B --> G[Player Sign In / Register]

    F --> H[Coach Account Required]
    G --> GS{Existing player account?}
    GS -- Yes --> GD[Player Dashboard]
    GS -- No --> I[Player Account Required]

    GD --> GD1[My Applications]
    GD --> GD2[Edit Player Profile]
    GD1 --> T

    H --> J[Coach Registration]
    J --> K[Create Cloud Team Identity]
    K --> L[Link Local Workspace to Stable Team UUID]
    L --> M[Coach App]

    M --> M1[Existing Local Coaching Workspace]
    M --> M2[Application Link Management]
    M2 --> M3[Copy Link]
    M2 --> M4[Pause / Revoke Link]
    M2 --> M5[Regenerate Link]
    M --> M6[Pending Roster Imports Queue]

    I --> N[Reusable Private Player Profile]
    N --> O{Age 18+?}
    O -- Yes --> Q[Open Team Application Link]
    O -- No, is minor --> OC[Guardian Consent Flow]

    OC --> OC1[Capture Guardian Name and Contact]
    OC1 --> OC2[Guardian Consent Confirmation]
    OC2 --> OC3{Consent given?}
    OC3 -- No --> OC4[Application Blocked Pending Consent]
    OC3 -- Yes --> OC5[Application Flagged: Minor, Guardian Consented]
    OC5 --> Q

    Q --> R[Review Team]
    R --> S[Submit Application Snapshot]
    S --> T[Player Application Status]
    T --> T1[Pending]
    T --> T2[Accepted]
    T --> T3[Declined]
    T --> T4[Withdrawn]

    S --> U[Coach Recruitment Inbox]
    U --> U1[Filter Applications]
    U --> U2[Review Applicant]
    U2 --> U2A{Minor flag present?}
    U2A -- Yes --> U2B[Show Guardian Consent Status]
    U --> U3[Duplicate Check]
    U --> V{Decision}

    V -- Decline --> W[Decline with Private Coach Note]
    V -- Accept --> X[Accept Application]
    X --> Y{Primary workspace device?}
    Y -- No --> Z[Decision Saved in Cloud]
    Z -.->|next login on primary device| M6
    M6 --> AA[Review Roster Import]
    Y -- Yes --> AA
    AA --> AB[Create Local Roster Player]
    AB --> AC[Trace Application ID on Player]

    subgraph CloudFoundation[Minimal Phase 3A Cloud Foundation]
        CF1[Supabase Auth]
        CF2[Account Profiles]
        CF3[Cloud Teams]
        CF4[Application Links]
        CF5[Player Profiles]
        CF6[Applications]
        CF7[Row Level Security]
        CF8[Guardian Consent Records]

        CF3 --> CF4
        CF4 --> CF6
        CF5 --> CF6
        CF5 --> CF8
        CF8 --> CF6
        CF2 --> CF5
        CF1 --> CF2
        CF7 -.->|governs| CF3
        CF7 -.->|governs| CF5
        CF7 -.->|governs| CF6
        CF7 -.->|governs| CF8
    end

    H --> CF1
    I --> CF1
    OC1 --> CF8
    N --> CF5
    S --> CF6
```

## Planned: Public Player Profiles & Highlights

Paste this chart into Mermaid Live. This is a standalone planned flow, separate from the recruitment MVP, focused on a public-facing, social-style player profile with highlight videos. It's designed to layer on top of the Phase 3A identity foundation and the existing FPRDS data, not replace either.

The differentiator versus a generic "Instagram for athletes" product: profiles can surface **coach-verified FPRDS attribute scores** alongside highlight reels, so coaches and scouts get real signal, not just curated clips.

```mermaid
flowchart TD
    A[Player Account] --> B[Public Profile Setup]

    B --> C[Basic Info]
    C --> C1[Name, Position, Age Group, Location]
    C --> C2[Team History]

    B --> D[Highlight Reel]
    D --> D1[Upload Video Clip]
    D1 --> D2[Auto Thumbnail and Compression]
    D2 --> D3{Moderation Check}
    D3 -- Flagged --> D4[Manual Review Queue]
    D3 -- Passed --> D5[Published to Highlight Reel]
    D --> D6[Reorder / Pin Best Clip]
    D --> D7[Tag Clip: Skill, Match, Position]

    B --> E[FPRDS Verified Attributes]
    E --> E1{Has FPRDS Assessment History?}
    E1 -- Yes --> E2[Opt In to Show Verified OVR and Attributes]
    E1 -- No --> E3[Prompt: Get Assessed by a Dumala Coach]
    E2 --> E4[Verified Badge: Coach-Administered Score]
    E2 --> E5[Attribute Radar Snapshot]

    B --> F[Visibility Controls]
    F --> F1{Player is a minor?}
    F1 -- Yes --> F2[Restricted Defaults: No Location Pin, Guardian-Managed Visibility]
    F1 -- No --> F3[Standard Visibility Defaults]
    F2 --> F4[Guardian Can Edit / Take Down Profile]
    F --> F5[Public / Team-Only / Private Toggle]

    B --> G[Published Public Profile]
    G --> G1[Shareable Profile Link]
    G --> G2[Embed in Team Application Snapshot]

    G --> H[Discovery and Search Surface]
    H --> H1[Browse by Position]
    H --> H2[Browse by Age Group / Location]
    H --> H3[Filter by Verified Attribute Range]
    H --> H4[Coach / Scout Shortlist]

    H4 --> I[Shortlist Actions]
    I --> I1[Save to Watchlist]
    I --> I2[Invite to Apply via Application Link]
    I --> I3[Request Trial]

    G --> J[Engagement Layer]
    J --> J1[Profile Views Counter]
    J --> J2[Follow a Player]
    J --> J3[Reactions on Highlight Clips]

    G --> K[Reporting and Moderation]
    K --> K1[Report Clip or Profile]
    K1 --> K2[Trust and Safety Review Queue]
    K2 --> K3{Action}
    K3 -- Remove Content --> K4[Clip or Profile Takedown]
    K3 -- Warn --> K5[Warning to Player / Guardian]
    K3 -- No Action --> K6[Report Closed]

    subgraph ProfileFoundation[Phase 5 Cloud Additions]
        PF1[Public Profile Records]
        PF2[Highlight Media Storage and CDN]
        PF3[Moderation Queue]
        PF4[Verified Attribute Snapshot Cache]
        PF5[Guardian Permission Records]
        PF6[Discovery Index]

        PF1 --> PF2
        PF1 --> PF4
        PF1 --> PF5
        PF2 --> PF3
        PF1 --> PF6
    end

    C --> PF1
    D1 --> PF2
    D3 --> PF3
    E2 --> PF4
    F2 --> PF5
    H --> PF6
```

## Later Roadmap Flow

Paste this chart into Mermaid Live to show the bigger roadmap. This is intentionally separate from the MVP because these features require full cloud sync, permissions, privacy, and collaboration design.

```mermaid
flowchart TD
    A[Current Local-First PWA] --> B[Phase 3A: Identity Foundation]
    B --> C[SaaS Landing Page and Recruitment MVP]
    C --> D[Phase 3B: Full Cloud Sync]
    D --> E[Phase 4: Team Collaboration]
    E --> F[Phase 5: Public Profiles, Highlights, and Drafting]
    F --> G[Future Club Operations]
    F --> H[Expanded Coaching Knowledge]

    B --> B1[Coach and Player Accounts]
    B --> B2[Cloud Team Identity]
    B --> B3[Privacy and RLS]
    B --> B4[Guardian Consent Framework]

    D --> D1[Cloud Domain Schemas]
    D --> D2[Local-to-Cloud Migration]
    D --> D3[Offline Mutation Queue]
    D --> D4[Conflict Strategy]
    D --> D5[Account Recovery / Export / Deletion]
    D --> D6[Monitoring, Audit Logs, Backups]

    E --> E1[Owner / Admin / Coach / Staff / Viewer Roles]
    E --> E2[Invitations]
    E --> E3[Shared Bulletins]
    E --> E4[Activity History]
    E --> E5[Simultaneous Edit Protection]

    F --> P[Public Player Profiles and Highlights]
    F --> F2[Controlled Team Profiles]
    F --> F4[Field-Level Privacy]
    F --> F5[Moderation and Abuse Reporting]

    P --> P1[Profile Setup: Bio, Position, Team History]
    P --> P2[Highlight Reel Upload and Moderation]
    P --> P3[FPRDS-Verified Attributes and OVR Badge]
    P --> P4[Guardian-Managed Visibility for Minors]
    P --> P5[Discovery, Search, and Coach Shortlists]
    P5 --> P6[Shortlists and Trials]
    P --> P7[Engagement: Views, Follows, Reactions]

    G --> G1[Club Roles Beyond Single Team]
    G --> G2[Multi-Team / Multi-Branch Management]
    G --> G3[League and Tournament Operations]
    G --> G4[Sponsorship and Branding Tools]

    H --> H1[Coach Certification Tracking]
    H --> H2[Drill Libraries and Curriculum]
    H --> H3[Coach Community and Knowledge Sharing]
```
