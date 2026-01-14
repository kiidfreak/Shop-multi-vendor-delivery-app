
# Implementation Plan - "Mayhem" Role & Flow Refinement

This plan addresses the user's concerns about the separation between "Rider Work" and "Personal Ordering". We will implement a strict separation of modes to avoid confusion.

## User Logic & Flows

### 1. Strict Mode Separation
To prevent confusion (e.g., a rider picking their own order), we will enforce:
- **Fam Mode (User)**: purely for browsing products, placing orders ("My Stash"), and personal profile settings.
- **Rider Mode (Duty)**: purely for managing deliveries ("Tasks"), viewing earnings/stats, and going Online/Offline.
- **Switching**: A Rider *cannot* shop while in Rider Mode. They must "Exit to Fam Mode" to place an order.

### 2. Implementation Steps

#### A. Rider Profile Updates (`profile.tsx`)
- [ ] **Online/Offline Toggle**: Add a prominent switch for Riders to toggle their availability.
    - *Logic*: Updates `currentRider.status` to "Available" or "Offline". Persists to `AsyncStorage`.
- [ ] **Stats View**: Show `ordersCompleted` and `rating` prominently.
- [ ] **Exit Action**: "Exit to Fam Mode" switches `activeRole` back to `USER`.

#### B. AppContext & Persistence
- [ ] **Rider Status Sync**: Ensure changing "Online/Offline" updates the main `riders` list so Admins see the correct status in the assignment modal.
- [ ] **Fix Persistence**: Ensure `updateRider` correctly saves changes to `AsyncStorage`.

#### C. Order Logic (Admins)
- [ ] **Filter Riders**: The "Assign Rider" modal should ONLY show riders who are `status: "Available"`.

#### D. Navigation/Tabs (`_layout.tsx`)
- [ ] **Refine Titles**:
    - **User**: "Mayhem" (Home), "My Stash" (Orders), "Fam" (Profile).
    - **Rider**: "Dashboard" (Home - *Placeholder for now*), "Tasks" (Orders), "Ops" (Profile).

## 3. Future Cloud (Notes)
- RBAC will eventually be handled by backend tokens.
- Profiles will be linked (User ID <-> Rider ID).
