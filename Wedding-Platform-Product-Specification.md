# Wedding Planning Platform — Living Product Specification

**Version:** 111.0  
**Last updated:** 21 October 2026  
**Status:** Discovery and product design  
**Working name:** Wedding Planning Platform (brand name undecided)

## 1. Purpose and vision

Create a shared wedding planning website and app where couples and professional wedding planners can organize an entire wedding in one place, from initial ideas and supplier comparisons to the wedding-day run sheet. The product should reduce forgotten tasks, fragmented communication, unclear budgets, and duplicated data.

**Core promise:** One wedding, one shared plan, with the right information available to the right people.

## 2. Target audiences

- **Couples:** Both partners have individual accounts and equal control over their shared wedding, including budgets, vendors, schedules, guests, and collaborators. Neither partner can unilaterally remove the other. A second partner can join via email invitation or secure link/code, with appropriate verification.
- **Professional wedding planners:** Manage multiple weddings and collaborate with couples and team members.
- **Wedding-day coordinators:** A hired coordinator, friend, or family member can access operational information such as the schedule, contacts, and assigned responsibilities, using preset roles with customizable access (DEC-007) and configurable access expiration (DEC-008). In the MVP, the coordinator preset includes the wedding-day schedule, essential contacts, and tasks assigned to that coordinator (DEC-412).
- **Other helpers:** May receive a helper preset in the MVP. By default, helpers can access tasks assigned to them and records explicitly shared with them (DEC-413).
- **Vendors:** Vendors are not workspace members and will never have user accounts or sign-in access. Couples and planners create and manage vendor records (DEC-414, DEC-416).

An account may participate in multiple weddings and may hold different roles in different workspaces. A professional planner may also be a couple member for their own wedding.

## 3. Product model

- **Individual account:** A person signs in with their own identity.
- **Wedding workspace:** Shared wedding data and collaboration for a specific wedding.
- **Planner organization:** Professional workspace for a planner or planning team managing multiple weddings. Couples may invite the organization, which can assign team members; couples can see assigned people, receive notifications about team changes, restrict specific employees, and revoke the organization’s access. If access ends, shared wedding information remains in the wedding workspace while planner-private business records remain separate (DEC-010). Planners may voluntarily exit through a guided handover or leave immediately (DEC-011). Unclaimed planner-created weddings are scheduled for deletion after warning and a 90-day grace period, subject to applicable retention obligations (DEC-012/013).
- **Membership and permissions:** Access is determined by a person's relationship to a particular wedding or organization, not a permanent account-wide label.

The product should offer a welcoming, simple experience for couples and a more efficient multi-client dashboard for professionals, powered by shared wedding data.

## 4. Proposed modules — not yet approved for MVP

### 4.1 Wedding overview
**MVP scope:** Include the approved combined couple-facing overview of tasks, budget, guests, decisions, milestones, and countdown (DEC-330). **Approved dashboard direction (DEC-037):** The couple-facing wedding workspace opens on a combined overview of wedding countdown, upcoming tasks, budget status, guest progress, important decisions, and planning milestones. The tasks card shows overdue tasks and the next few upcoming tasks (DEC-282). The budget card summarizes total budget, committed costs, amount paid, and upcoming payments (DEC-283). The guest-progress card shows confirmed headcount and confirmation progress with adult/child totals (DEC-284). Each summary should lead to its corresponding detailed area when available. Start with the same fixed dashboard layout for both partners. Each partner may independently rearrange their own view; the underlying wedding data remains shared (DEC-285). Show the wedding date and days remaining (DEC-286); the next few milestones with their dates and progress (DEC-287); and Open and Deferred decisions, with links to review them (DEC-288, DEC-485). Provide quick actions to add a task, guest, vendor, or budget item (DEC-289). Helpers and coordinators see the same overview filtered to information their role allows them to access (DEC-290). Exact content thresholds and remaining permissions details remain open. This decision approves the dashboard composition, not the MVP inclusion of every underlying module. The separate multi-wedding professional planner dashboard follows the combined portfolio and action-center direction approved in DEC-038.

### 4.2 Budget and payments
**MVP scope:** Include itemized cost tracking for quotes, deposits, due dates, and payments (DEC-328). Advanced reporting and other behavior outside this core tracking remain subject to their own scope decisions. Track an overall budget and category allocations alongside individual cost records, quotes, deposits, due dates, and payments. Present clear planned-versus-actual summaries without requiring accounting-ledger complexity (DEC-197).

### 4.3 Vendor options, comparisons, and decisions
**MVP scope:** Include the full defined vendor comparison and decision workflow (DEC-329), plus the reusable organization-wide vendor directory for planners (DEC-334). Wedding vendor records link to the live organization vendor profile (DEC-338). Couples can view the full linked organization profile, but only organization staff can edit organization details; couples can add wedding-specific notes (DEC-341). If a directory vendor is removed, archive its organization profile and internal notes for 30 days, then permanently delete the organization profile; managers can restore it during that period, receive a final notice 7 days before deletion, or permanently delete it earlier after confirmation (DEC-342, DEC-350, DEC-355–358). Preserve each linked wedding record with its last available vendor details and remove the live link (DEC-342). Restoring an organization profile does not automatically restore former wedding links; planners must relink records (DEC-361). A preserved wedding record may be linked to another organization profile by an authorized planner or retained as a standalone wedding record after the source profile is permanently deleted (DEC-362). When the planner organization's access to a wedding ends, convert linked vendor records to standalone wedding records with their last available details, including custom field values, and remove the organization links (DEC-363, DEC-380). Notify couples when contact details, availability, or business status change on a linked profile (DEC-349). Organization vendor profiles support internal notes visible only to organization staff (DEC-344); when a vendor is removed, archive the profile and retain its notes for organization staff during the 30-day archive period before permanent deletion (DEC-350, DEC-355). Organization profiles include the vendor name, service categories, contact details, website, location, and internal notes by default (DEC-348). Organization managers may create custom service categories alongside the defaults (DEC-367). They may also create custom fields shared across the organization directory (DEC-365), using short text, long text, number, date, or single-choice dropdown types (DEC-369). Custom fields are visible to couples who can view the linked profile (DEC-368), except organization-internal notes (DEC-344). Couples maintain vendor records manually; planners and planning organizations use an organization-owned directory that can be reused across weddings. Provide a customizable starter set of service categories and category-aware common and specialized fields. Organization-level custom categories and profile fields follow DEC-364–365, DEC-367–370. Organization managers control custom category and field setup. Staff with vendor-edit permission can edit custom field values; managers alone can configure fields and dropdown options (DEC-370, DEC-373). If a custom field is removed, archive it, keep existing values visible as read-only, and prevent new entries (DEC-366). Managers can restore an archived custom field and resume editing values, or permanently delete it after confirmation; permanent deletion removes organization profile values but preserves wedding record snapshots (DEC-386–387). Archived custom fields remain available for comparison and filtering using existing read-only values (DEC-381). Custom fields are optional (DEC-382). Once a custom field has values, its type cannot be changed; managers create a new field for another type (DEC-383). Managers may limit a custom field to selected service categories (DEC-384) and set the shared field order across the organization directory (DEC-385). When a vendor changes service category, show the affected custom fields and values and ask for confirmation before removing values that no longer apply to the new category (DEC-391). Keep values for fields that apply to both categories; remove only values for fields that no longer apply (DEC-392). Allow the editor to undo the category change and restore removed values before leaving the vendor profile (DEC-393). Notify couples of a linked vendor's category change only if the vendor is their primary selection (DEC-394). Record who changed the category and when, but do not retain deleted field values in the activity history (DEC-395). Custom fields remain optional, so a profile can be saved without completing fields applicable to its new category (DEC-390). Managers may filter the vendor directory by custom field values (DEC-378). Renaming a custom field changes its label across the directory while preserving existing values (DEC-379). If a dropdown option is removed, keep existing vendor values visible as read-only and prevent new selection of that option (DEC-377). Managers can restore removed dropdown options, making existing values editable again (DEC-388). Include custom field values in vendor comparisons for authorized users (DEC-374); important changes to visible custom field values follow the existing vendor-change notification rules (DEC-375, DEC-349). When an organization vendor profile is permanently deleted, delete its organization custom values but preserve last available profile details, including custom values, in linked wedding records (DEC-376, DEC-362). If a custom service category is removed, archive it, keep existing vendor assignments visible, and prevent new assignments; the removed category cannot be restored (DEC-371, DEC-372). Flag likely duplicates for authorized users to review, link, or merge; never merge automatically. Support structured side-by-side comparisons, a guided but skippable decision status flow, one primary selection per service category with additional selections for distinct needs, and links to relevant wedding contacts, documents, finances, and tasks (DEC-182–192).

### 4.4 Long-term planning timeline and tasks
**MVP scope:** Include all task behavior defined here and in DEC-193–195 and DEC-265–279 (DEC-318). **Selected as the next module for detailed product design (DEC-055).** Offer an editable, date-based starter plan with common wedding milestones. The starter plan includes suggested milestones that couples can edit or remove (DEC-527). If the wedding date changes, preview proposed milestone-date changes and ask before applying them (DEC-528). Track milestone progress using Not started, In progress, and Complete statuses (DEC-529). Allow an optional reminder for each milestone (DEC-530). When a milestone is no longer needed, move it to a 30-day trash with restore available (DEC-531). Milestones support shared comments and replies (DEC-532). Send optional milestone reminders to both partners and include the assigned lead planner when they have access (DEC-533). Send reminders at 9 a.m. in each recipient’s local timezone on the chosen reminder date (DEC-534). Permanently delete milestones automatically after they have been in trash for 30 days (DEC-535). When deriving a milestone date from linked tasks, let the user choose one linked task as the date source (DEC-536). Keep milestone progress manually controlled; linked task changes do not update milestone status (DEC-537). Include milestone creation, date, status, trash, and restore changes in workspace activity history (DEC-538). If a milestone is marked Complete before its reminder is sent, cancel the pending reminder (DEC-539). If the milestone date or reminder date changes, cancel the old reminder and schedule a new one (DEC-540). Do not send notifications for milestone comments; @mentions still notify the mentioned members (DEC-541). Any member with Edit access to the timeline can restore a milestone from trash (DEC-542). Moving a milestone to trash cancels its pending reminder (DEC-543). Restoring a milestone recovers its details, task links, comments, and prior status (DEC-544). When a milestone date is derived from a chosen source task, automatically update it to match changes to that task’s due date (DEC-545). If the chosen source task is deleted or moved to trash, keep the last milestone date and prompt the user to select a new source task or switch to a planned date (DEC-546). If the source task is unlinked, keep the last date and switch the milestone to a planned date (DEC-547). Show milestones and tasks together in one chronological timeline view with filters (DEC-548). Keep completed milestones in chronological order with a Complete status (DEC-549). Use a chronological list with dates and progress as the main timeline view (DEC-550). Filter the combined timeline by item type, status, and date range; include an owner filter for tasks (DEC-551). Require a planned date for every milestone (DEC-552). Give each milestone an optional description (DEC-572). Milestones belong to the couple rather than having an accountable owner; tasks can have owners (DEC-573). Organize milestones by suggested planning phases and allow custom phases (DEC-574). Assigning a phase is optional (DEC-575). Any member with Edit access to the timeline can create and manage custom milestone phases (DEC-576). When a phase is removed, keep its milestones and make them unassigned to a phase (DEC-577). Members with Edit access to the timeline can rename, reorder, and hide suggested phases (DEC-578). Hiding a suggested phase preserves its existing milestone assignments and removes it from new assignments until restored (DEC-579). Keep removed custom milestone phases in a 30-day trash with restore available (DEC-580). Any member with Edit access to the timeline can restore a custom phase (DEC-581). Restore its previous milestone assignments only for milestones still unassigned (DEC-582). Permanently delete the phase automatically when its 30-day trash period ends, leaving its milestones unassigned (DEC-583). Show undated tasks in a separate Undated section below dated items in the combined timeline (DEC-553). Order dated items with upcoming dates first and the nearest date first; keep past items accessible below (DEC-554). Keep completed tasks in a collapsed Completed section in the combined timeline (DEC-555). Allow users to arrange items manually when they share a date (DEC-556). Use one shared same-day order across the workspace (DEC-557). Members with Edit access to the timeline can change that order (DEC-558). Dragging only reorders items on the same date; it does not change their dates (DEC-559). Do not add same-day ordering changes to workspace activity history (DEC-560) or send notifications for them (DEC-561). Place a newly added item at the end of that date’s list (DEC-562). Show past items in a collapsed Past section below upcoming items (DEC-563). Allow users to combine selected timeline filters (DEC-564). Search timeline task and milestone titles (DEC-565). Notify both partners when a milestone date changes, and include the assigned lead planner if they have access (DEC-566). Treat automatic milestone-date changes caused by a linked task the same as direct date changes for notifications (DEC-567). Do not notify members about milestone status changes; show them in the timeline and activity history (DEC-568). Members with Edit access to the timeline may permanently delete a trashed milestone before 30 days after confirmation (DEC-569). Send decision-makers a final notice 7 days before automatic permanent deletion (DEC-570). Permanent deletion removes the milestone, its comments, and task links; linked tasks remain unchanged (DEC-571). Track milestones as separate records that can link to related tasks, while allowing stand-alone milestones. Set progress manually. Give each milestone a planned date, with an option to derive or update it from linked tasks. Any member with Edit access to the timeline can create or edit milestones (DEC-522–526). When the wedding date changes, preview proposed due-date changes for unfinished starter-plan tasks and ask before applying them; do not automatically shift dates (DEC-270). Tasks can have one accountable owner, optional collaborators, and optional links to prerequisite tasks; dependencies should surface blockers without preventing work or completion (DEC-193–195). Show overdue indicators without changing task status, and show prerequisite blockers without automatically changing status; users manage task status themselves (DEC-271–272). Organize tasks by wedding-planning phase, with filters for owner, status, and due date (DEC-273). Notify assignees when assigned or when due dates change, but not for routine description edits (DEC-274). Use Not started, In progress, Blocked, and Complete statuses. Tasks may remain undated in a separate undated list until a due date is known. Tasks support simple checklists, while substantial subtasks can be separate tasks. Allow completion with unfinished checklist items after a warning and confirmation. Blocked tasks may include an optional short reason or link to a blocking task. Notify the owner and task collaborators when the due date changes. Move completed tasks to a collapsed but accessible Completed section. Archive tasks that are no longer needed while preserving links and activity and allowing restoration (DEC-275–279). Authorized users may reopen completed tasks while keeping completion activity visible. Allow optional reminders per task, with a suggested reminder before the due date (DEC-265–269). Detailed reminder timing, task templates, and MVP commitment remain undecided.

### 4.5 Wedding-day schedule and coordination
**MVP scope:** Include all defined schedule behavior, including change alerts and printable/PDF details (DEC-320). Use one chronological master run sheet with sections or filters for each event. Schedule items have start and end times, with a visible TBD state until times are known, plus locations, vendor arrivals, responsibilities, key contacts, and operational notes. Authorized couples, lead planners, and assigned coordinators can update the schedule before and during the event. During the wedding, items can be marked Planned, In progress, Complete, or Delayed. A delay can suggest later timing adjustments for authorized review; it does not shift the schedule automatically. Notify people assigned to affected items when a time, location, or responsibility changes. Show the latest schedule without a schedule-specific edit history. Coordinators may explicitly save the schedule for offline read-only use; saved copies refresh whenever the app is online and show the last sync time, plus a warning when offline that a copy may be outdated. The offline copy and printable/PDF run sheet include the timeline, locations, responsibilities, statuses, and essential day-of contacts (DEC-210–224). Authorized users may select emergency contacts to include in those materials (DEC-264). If a person's wedding access is revoked, online access ends immediately; any saved offline copy is invalidated and removed the next time that device reconnects (DEC-225).

### 4.6 Contacts
**MVP scope:** Include manually entered contact records with Shared/Private visibility and links to wedding records (DEC-317); the additional contact behavior below remains subject to detailed MVP boundary review. Maintain a central wedding-workspace directory for vendors, venues, planners, guests, helpers, emergency contacts, and other key stakeholders. Contacts are entered manually; device contact import and automatic synchronization are not supported (DEC-260). Contact records include name, role/company, phone, email, address, and notes. A contact may have multiple labeled phone numbers and email addresses, with one phone number or email marked as preferred (DEC-256, DEC-259). Suggest contact types such as Vendor, Venue, Planner, Guest, Helper, and Emergency Contact; allow multiple types per contact and couple-created custom types (DEC-251, DEC-255, DEC-257). Search names, companies, and contact details, and filter by type and linked records (DEC-258). Each contact can be Shared or Private as a whole record, and can link to multiple records within the wedding workspace (DEC-252, DEC-253, DEC-262). Contact records remain separate between wedding workspaces; authorized users may explicitly copy a contact into another workspace, creating an independent record (DEC-261). Archive deleted contacts and preserve their links; require review before permanent deletion (DEC-263). Flag likely duplicate contacts for authorized users to review, link, or merge; never block or merge automatically (DEC-250–254).

### 4.7 Guest list and attendance tracking
**MVP scope:** Include all guest tracking behavior defined in this section and DEC-203–209 (DEC-319). Couples maintain a guest list in the app; the app does not send wedding invitations or guest RSVP links. Each guest entry has a display name or group label, adult and child counts, an event scope, optional dietary labels, and a group-level checkbox to mark confirmation. When the group is confirmed, the couple can adjust its adult and child counts to the number actually attending; these values replace the previous counts, and the app does not keep a separate original headcount. At the top of the list, show the total confirmed headcount, with an adult/child breakdown. Use a single event-scope badge: “Full event” for all events, and a clear combined label such as “Reception + Dinner” for a partial combination, ordered by event sequence. Dietary labels are optional, selected from a default list or created by the couple. Keep guest list access within the wedding workspace and apply its existing permissions (DEC-203–207).

### 4.8 Documents and notes
**MVP scope:** Include all defined document and notes behavior (DEC-327). Provide a searchable document library with default categories for contracts, quotes/invoices, receipts, and other documents. Couples may add custom categories, and each document may belong to multiple categories (DEC-230–231, DEC-233). Search covers document titles, categories, linked records, and document notes/descriptions (DEC-232). Documents can link to relevant vendors, budget/finance records, tasks, and other workspace records rather than duplicating them (DEC-226). Choose Shared or Private visibility for each document (DEC-227). Replacing a document replaces the prior file; the library does not retain old file versions (DEC-228). Documents may optionally have an expiry or renewal date and reminder (DEC-234). When a document is replaced, carry its expiry/renewal date and reminder forward, then ask the user to review and confirm them (DEC-235). Deleted documents go to a recoverable 30-day trash (DEC-236). Notes are shared with the wedding workspace (DEC-229), shown in a searchable list with optional categories or tags, and can link to vendors, tasks, documents, and other records (DEC-237–238). Show the latest editor and edit time for a note, without retaining earlier note versions (DEC-239). Support basic note formatting with headings, bullets, and checklists (DEC-240).

### 4.9 Inspiration
**MVP scope:** Include a basic idea collection with suggested topic boards only; each idea belongs to one board, Private visibility is available per idea, and users can search by title. Defer custom boards, multiple-board placement, personal favorites, and comments/replies (DEC-316, DEC-321–326). Other behavior below describes the broader proposed module and is not automatically part of MVP; remaining boundaries are open. Each inspiration idea has a short title and may include an optional note, one image, or a source link; link-only ideas are allowed. Show source links as clickable URLs without previews. Each person can favorite ideas for their own view. Workspace members with permission to edit Inspiration may add or delete ideas, subject to idea visibility. Ideas support comments and replies and deleted ideas remain recoverable in a 30-day trash (DEC-301–305, DEC-306–310). Organize ideas in suggested topic-based boards such as Venue, Attire, and Decor; and create custom boards. One idea may appear on multiple boards without duplication. Boards use a visual grid; users may arrange ideas manually or sort by date added. Ideas are shared with the wedding workspace by default, with optional Private visibility per idea. Hide Private ideas completely from people without access, including when they appear on shared boards. Show each idea's creator and date added. Couples may rename, reorder, or hide suggested boards and create custom boards. Search titles, notes, and source URLs across boards, and filter by board. Removing an idea from a board removes only that board placement; a separate action deletes the idea from all boards. Deleting a board keeps its ideas in the main inspiration collection. Do not send notifications for comments or replies on Inspiration ideas, including @mentions; other record comments continue to follow general notification rules (DEC-247, DEC-311–315). Inspiration ideas remain separate from vendors, tasks, and other modules, without cross-module links (DEC-291–300).

### 4.10 Collaboration and notifications
Provide comments with replies attached to individual workspace records, such as tasks, vendor records, and decisions (DEC-241, DEC-484). Show an activity history of access, task, schedule, guest, budget, document, vendor service-category, custom field definition, and decision changes. Include decision creation, status, option, and outcome changes, plus decision-category creation, rename, hide, restore, and deletion. For decision events, show who changed the record, when, and a short summary; for category changes, show who made the change and when. Only members with View access to a decision may see its activity entries (DEC-517–518, DEC-520–521). Do not log custom field value changes or planner-only vendor note edits (DEC-396, DEC-398). Record custom field definition changes with the manager, action, field name, and time (DEC-400). For vendor category changes, record the category change but not deleted custom field values (DEC-395). Organization staff with permission to view a vendor record can see its activity; couples can see activity for linked wedding vendor records they can access (DEC-397). Show events grouped by day with the most recent day first and the most recent events first within each day; provide no search or filters (DEC-402, DEC-408–409). Display timestamps in the viewer's local time and identify the timezone (DEC-410). Link each event to the related wedding record when the viewer has permission to access it (DEC-403). Keep activity history viewable in the app only; do not offer activity history exports (DEC-404). Retain activity history until one year after the latest saved wedding date; if no wedding date is set, retain it until one year after workspace creation (DEC-401, DEC-406–407). Vendor-related events use the same retention period (DEC-399). Activity history does not generate notifications independently; notifications follow the rules for each underlying change (DEC-405). Let users edit or delete their own comments; show when comments were edited and preserve replies and activity history (DEC-246). Support @mentions in comments and notify mentioned people only when they are authorized to view that record (DEC-247). Deliver important notifications immediately and offer a digest for routine updates (DEC-248), in-app with optional email or push delivery (DEC-243). Let each user choose which notification areas to receive, such as tasks, guests, and schedule changes (DEC-244). The in-app inbox tracks unread notifications and supports marking one or all as read (DEC-249). For the MVP, include planner, coordinator, and helper permission presets only. Vendor profiles are records managed by couples and planners; vendors are never workspace members and do not have accounts or sign-in access (DEC-411, DEC-414, DEC-416). Invite coordinators and helpers by email or secure, expiring link/code (DEC-417). A link/code is single-use and bound to the intended invitee (DEC-422); require the invitee to verify the email address the invitation was sent to, even if their account uses another email (DEC-423). Before accepting, show the wedding workspace name, inviter, role, area permissions, and any specifically shared records (DEC-424, DEC-467). If access changes while an invitation is pending, update the preview and notify the invitee; require the invitee to accept the latest access details. Keep the invitation's original seven-day expiry date, and if the invitee opened an earlier preview, require review and acceptance of the latest access details before granting access (DEC-468–471). Either partner or the assigned lead planner may send or revoke an invitation, with the lead planner acting only within the couple's restrictions (DEC-418, DEC-421). Access starts only after the invitee accepts and signs in or creates an account (DEC-419). Invitations expire after seven days and can be resent or revoked (DEC-420). If an invitee declines, notify the inviter and both partners (DEC-425). Both partners and the assigned lead planner can see pending invitations, including invitee, role, inviter, and expiry (DEC-426). Either partner and the assigned lead planner may adjust coordinator/helper access, with the lead planner acting only within the couple's restrictions (DEC-415). Start from the role preset and customize permissions separately for each main wedding area, including tasks, schedule, guests, contacts, vendors, budget, documents, notes, and decisions. Each area supports View and Edit, plus a separate combined Download/Export permission; View alone grants neither downloads nor exports. Edit applies only to records assigned or explicitly shared with the member and includes creating records in that area. For shared records, area-level permissions set the maximum access and sharing selects the records in scope. Either partner or the assigned lead planner may share or unshare records, within the couple's restrictions. Show decision-makers the members each record is shared with and their effective access. If a member loses View access to an area, warn decision-makers which record shares will stop working; area permissions take priority. When a record is unshared, remove the member's access but keep their prior edits, comments, and activity history on the record. Keep the member's name on earlier comments and activity, and show that their access was removed. Notify the affected member when record access is granted or removed, following their notification preferences and the existing timing rules for important changes. Notify the other partner and assigned lead planner as well. Do not record individual record share/unshare changes in workspace activity history; other access changes continue to follow their established activity-history rules (DEC-462–466). Apply active-member permission reductions immediately across the workspace, including open sessions, notify members of any effective-access change, and show decision-makers the access being removed and affected records before saving (DEC-472–474). If a reduction removes access to assigned tasks, retain the tasks and history and flag them for review and reassignment. A person whose area permissions are all removed remains a workspace member with no area access (DEC-475–476). Access management remains reserved for authorized decision-makers. Show the full effective-access summary before saving expanded access and when changing a role preset. Keep custom overrides when presets change, and show each member’s role and effective access in the member list with a direct adjustment link (DEC-447–456). Coordinators and helpers cannot request additional permissions; only authorized workspace decision-makers can change their access (DEC-427). Send access-expiry reminders to the coordinator/helper, both partners, and the assigned lead planner seven days and one day before expiry, at 9 a.m. in each recipient's local timezone (DEC-432, DEC-433, DEC-440). If access is set to expire in fewer than seven days, send only reminders whose scheduled time has not passed (DEC-443). When an expiry date changes, cancel reminders for the old date and schedule them for the new date; do not notify an active member about the change (DEC-441, DEC-446). Cancel reminders if access is revoked early (DEC-444). The default expiry is seven days after the wedding; changing the wedding date updates it only when it still uses that default, while manually chosen dates stay fixed. If the new default expiry is already past, expire access immediately. If there is no wedding date, access has no expiry until a date is added; then use the seven-day default (DEC-437–439, DEC-442). Explicitly continued access has no scheduled review; authorized decision-makers may change access at any time (DEC-445). When access expires, retain assigned tasks and history and flag tasks for authorized review and reassignment (DEC-434). Preserve the person's comments and activity history and label them as having expired access (DEC-435). An authorized decision-maker can restore access directly by setting a new expiry date; notify the person (DEC-436). For active members, changing the expiry date does not generate a notification (DEC-446). Invitations, role-based permissions, assignments, alerts, and reminders follow their respective access and notification rules.

### 4.11 Planner workspace and business tools
**MVP scope:** Include a planner-facing multi-wedding dashboard showing assigned weddings and actions needing attention (DEC-331); organization staff assignment to weddings and access setting (DEC-332); basic private client and business notes kept separate from each couple's shared wedding workspace (DEC-333); an organization-wide vendor directory reusable across weddings alongside wedding-specific vendor records (DEC-334); and reusable task and timeline templates (DEC-335). The dashboard flags overdue and upcoming tasks, budget payments due, schedule changes, and unresolved decisions (DEC-337), following the combined portfolio and action-center direction in DEC-038. Organization managers manage staff; assigned planners can manage access for their own weddings using role-based permissions, adjustable within the couple's restrictions (DEC-336, DEC-347). When a staff member leaves or is deactivated, revoke wedding access immediately, preserve their activity history, and flag their assignments for reassignment. An organization manager reviews and reassigns them (DEC-351, DEC-359). Do not notify couples about staff assignment changes caused by a departure; separately initiated lead planner changes continue to follow DEC-352 notification rules (DEC-360). Show all staff assigned to a wedding and identify one lead planner, while allowing multiple staff to be assigned (DEC-345). The lead planner coordinates the team but receives no additional permissions solely because of that designation (DEC-346). Organization managers or the current lead planner may change the lead planner, and the couple is notified when this is a separately initiated lead change (DEC-352, DEC-360). Private business notes support a title and text, with an optional link to a client or wedding, and are not visible to couples unless explicitly shared through the wedding workspace (DEC-340). Planners can build reusable templates from scratch or save selected tasks and timeline items from an existing wedding (DEC-339). When applying a template to a wedding with existing planning data, preview it and select items to add; do not automatically replace or remove existing items (DEC-353). Wedding vendor records link to the live organization vendor profile rather than copying a snapshot (DEC-338). All organization staff can view organization vendor profiles, with editing limited by role (DEC-354). Workload views, template content and application behavior, and the exact private business record model remain open.

### 4.12 Reports and exports
Budget summaries, vendor lists, contacts, timelines, and printable wedding-day materials.

**Scope note:** MVP inclusions and boundaries are recorded in the applicable decisions in Section 6, including DEC-316–436. A decision commits only the specific behavior stated in it; related features remain candidates unless separately approved. The basic Inspiration and Contacts MVP selections have explicit boundaries, and vendor accounts are excluded from the product (DEC-416).

### 4.13 Wedding decisions
**MVP scope:** Include a basic decision tracker with statuses, options, due dates, and links (DEC-482). The dashboard’s unresolved-decisions card is also part of the MVP (DEC-288, DEC-330).

**Approved behavior:** Keep decisions in a chronological list without search or filters. Order Open and Deferred decisions first by due date, then show Decided and Cancelled decisions below. Provide suggested categories such as Venue, Budget, and Attire, and allow custom categories. Any member with Edit access to Decisions can create and manage custom categories. Couples can rename, reorder, and hide suggested categories. Hiding a suggested category preserves existing assignments but prevents new assignments until it is restored. Removing a custom category requires confirmation showing its name and the number of decisions that will become uncategorized. Move it to a 30-day trash with restore available. A member with Edit access to Decisions may restore it; restore prior assignments only for decisions that are still uncategorized. When 30 days elapse, permanently delete the category and keep its decisions uncategorized. Members with Edit access may permanently delete it from trash before then, after confirmation. Assign at most one optional category to a decision; uncategorized decisions are allowed (DEC-502–511). Decisions belong to the couple and have no individual owner. Each decision has a status of Open, Decided, Deferred, or Cancelled. Members with Edit access to Decisions may create and edit decision details. A decision may be open-ended without predefined options, and its recorded outcome may be a custom choice with an optional explanation. Users can define selectable options, record the selected outcome, and add an optional rationale. A decision may have an optional due date and reminder and may link to relevant wedding records (DEC-477–481). An optional reminder goes to both partners and the assigned lead planner if that planner has access (DEC-486). Send reminders at 9 a.m. in each recipient's local timezone on the chosen reminder date. Cancel a reminder if the decision is marked Decided or Cancelled before it is sent. If the due date or follow-up date changes, cancel the old reminder and schedule a new one (DEC-499–501). Coordinators and helpers have a separate View/Edit permission area for Decisions (DEC-483). Decision records support the shared comments-and-replies behavior (DEC-484). Do not send comment notifications for decision comments; @mentions still notify mentioned members who are authorized to view that decision (DEC-519). Show all Open and Deferred decisions in the dashboard’s needs-attention card (DEC-485). Any member with Edit access to Decisions may mark a decision as Decided (DEC-489). Allow a Decided decision to be edited while it remains Decided, retaining a decision change history that shows who changed it, when, and previous and new values. All members with View access to the decision can see this history (DEC-495, DEC-497–498). Members with Edit access to Decisions may also reopen a Decided decision to Open while retaining its prior outcome and history (DEC-487, DEC-491, DEC-495–496). Deferred decisions may have an optional follow-up date and reminder; the follow-up date replaces the original due date (DEC-488, DEC-490).

## 5. Key cross-module behavior — proposed

Selecting a vendor should be able to connect its quote to the budget, create relevant payment and contract tasks, populate the contact directory, and contribute operational details to the wedding-day schedule. Information should be entered once and reused appropriately, with safeguards against unintended changes.

## 6. Confirmed decisions

### DEC-001 — Flexible wedding creation and ownership
**Status:** Approved  
**Decision:** Option C — Both couples and professional wedding planners can create wedding workspaces. Couples retain control of their personal wedding information; planners retain control of their own business information. Planners can manage wedding workspaces through delegated permissions.

**Consequences and required follow-up design:** Define the exact rights of creators, partners, planners, and organizations; invitation and claiming flows; visibility of private data; revocation and transfer; export and continuity if a planner relationship ends. No detailed implementation rules have yet been approved.

### DEC-002 — Planner creates, then invites the couple
**Status:** Approved  
**Decision:** Option A — A professional planner may create a wedding workspace and begin entering planning information before either partner registers. The planner can invite the couple when ready. When the couple accepts, they gain full control over their personal wedding information, while the planner retains delegated wedding-management access.

**Consequences and required follow-up design:** Specify whether one or both partners must accept; how invitations are authenticated, expire, and are resent; what happens when the couple never joins; how planner-created records are classified as shared versus planner-private; and how delegated access can be changed or revoked. The detailed rules are not yet approved.

### DEC-003 — Equal control for both partners
**Status:** Approved  
**Decision:** Option A — Both partners have equal control over their shared wedding workspace. Both can manage budgets, vendors, schedules, guests, and collaborators. Neither partner may unilaterally remove the other from the shared wedding.

**Consequences and required follow-up design:** Task assignments may differ without changing equal overall control. Define how partner identity is verified, how the second partner is invited, how administrative changes are notified and audited under DEC-009, and how to handle disputes, separation, or an inaccessible account without allowing one partner to override the other. Specific safeguards and recovery processes remain open.

### DEC-004 — Partner invitation via email or secure link/code
**Status:** Approved  
**Decision:** Option C — The second partner may join a wedding through either a personal email invitation or a secure invitation link/code. Both routes must verify the intended recipient's authorization and protect against unauthorized access. Once the invitation is accepted, the joining partner receives the equal wedding control established by DEC-003.

**Consequences and required follow-up design:** Determine link/code expiry, single-use behavior, identity verification, handling forwarded links, revocation and reissue, mistaken invitations, and protection against unauthorized claiming. Exact security mechanisms and invitation lifecycle remain open; approval of both methods does not approve any specific authentication implementation.

### DEC-005 — Independent planners and planner organizations
**Status:** Approved  
**Decision:** Option C — Couples may invite either an independent professional wedding planner or a wedding planning organization. An invited organization may assign its own team members to the wedding. Couples can see which individuals have access and can control or revoke the organization’s overall access.

**Consequences and required follow-up design:** Define organization invitations and acceptance, team assignment permissions, staff visibility and notifications, the effects of individual restrictions, the behavior of existing tasks and files when access is revoked, and safeguards for continuity and data ownership. Organization access does not override the equal partner control in DEC-003 or the personal/business data separation in DEC-001.

### DEC-006 — Planner organization manages staff; couple may restrict individuals
**Status:** Approved  
**Decision:** Option C — An invited planner organization may assign or remove its own employees on a wedding without requiring the couple to approve every assignment. Both partners can see which employees have access and receive notifications when team assignments change. Couples can block specific employees from their wedding, and can revoke the organization’s access as established in DEC-005.

**Consequences and required follow-up design:** Specify who within the organization may assign employees, whether a blocked employee can be reassigned (default expectation: no, unless the restriction is explicitly lifted), how both partners exercise restrictions consistently with DEC-003, notification delivery, access audit history, effects on assigned tasks and records, and how to handle urgent staffing changes. Planner-private business records remain separate under DEC-001. These operational details are not yet approved.

### DEC-007 — Preset coordinator and helper roles with customization
**Status:** Approved  
**Decision:** Option C — Wedding-day coordinators and other non-planner helpers receive predefined access roles, such as Day Coordinator, Helper, and Read-only Guest, with sensible default permissions. Couples can customize each invited person's access where necessary.

**Consequences:** Start with the role preset, then allow authorized decision-makers to adjust permissions separately for each main wedding area, including tasks, schedule, guests, contacts, vendors, budget, documents, notes, and decisions. Each area supports View and Edit, plus a separate combined Download/Export permission. View does not include file downloads or data exports. Edit applies only to records assigned or explicitly shared with the member and includes creating records in that area. For explicitly shared records, the area-level permission sets the maximum access; sharing only selects which records are in scope. Either partner or the assigned lead planner may share or unshare records, within the couple's restrictions. Decision-makers can see which members each record is shared with and their effective access. If area-level View access is removed, it takes priority over record shares; warn decision-makers which shares will stop working. When a record is unshared, remove the member's access but retain their prior edits, comments, and activity history on the record. Preserve the member's name on earlier comments and activity, and show that their access was removed. Notify the affected coordinator/helper when record access is granted or removed, using their notification preferences and the established delivery timing for important changes. Also notify the other partner and assigned lead planner when a record share changes. Do not add individual record share/unshare changes to the workspace activity history (DEC-462–466). Access management remains reserved for workspace decision-makers. Before saving access beyond a preset, show a summary of all effective access. After joining, the member list shows each person’s role and effective access with a link to adjust it. If a role preset changes, preserve custom access settings and show a summary of resulting access before saving (DEC-447–456). Apply permission reductions immediately across the workspace, including open sessions, and notify the member of any effective-access change. Before saving a reduction, show the access being removed and affected records. If reduced permissions remove access to assigned tasks, keep the tasks and history and flag them for review and reassignment. Removing all area permissions does not remove the person from the workspace; they remain a member with no area access (DEC-472–476). Equal partner control under DEC-003 remains in force.

### DEC-008 — Configurable expiration for coordinators and helpers
**Status:** Approved  
**Decision:** Wedding-day coordinators and other helpers have an access expiration date after the wedding. The default expiry is seven days after the wedding. If the wedding date changes, update an expiry that still uses the default to seven days after the new date; preserve manually chosen expiry dates. If the recalculated default expiry date is already in the past, expire access immediately. If no wedding date exists, access has no expiry until a wedding date is added, after which the default is seven days after that date. Either partner or the assigned lead planner may adjust the expiry, subject to couple-defined restrictions (DEC-431, DEC-415, DEC-437–439). Either partner may revoke access immediately or explicitly permit continued access. Explicitly continued access has no scheduled review, though authorized decision-makers may change access at any time (DEC-445). This applies to helper/coordinator access rather than automatically changing professional planner organization membership.

**Consequences and required follow-up design:** Send expiry reminders at 9 a.m. in each recipient's local timezone, seven days and one day before expiry. If access is first set to expire in fewer than seven days, send only reminders whose scheduled time has not passed. When an expiry date changes, cancel reminders for the old date and schedule them for the new date; do not notify an active member when their expiry date changes. Cancel scheduled reminders if access is revoked early (DEC-440–446). Access restoration and task/history handling are defined in DEC-432–436. Helpers cannot request additional permissions or access extensions; only authorized workspace decision-makers can change their access (DEC-427).

### DEC-009 — Independent administrative control for both partners
**Status:** Approved  
**Decision:** Option A — Either partner may independently make administrative and access changes within the wedding workspace without requiring the other partner's prior approval. Changes take effect immediately; the other partner is notified and can review an activity/audit history. This includes routine collaborator access and wedding settings, subject to existing protections in earlier decisions.

**Consistency with DEC-003:** Neither partner may unilaterally remove the other partner from the wedding. DEC-009 does not override this existing explicit protection. Both partners retain equal authority, including the ability to review and reverse changes where the platform permits.

**Consequences and required follow-up design:** Define which actions trigger notifications, notification delivery and visibility, the detail and retention of audit records, reversibility, dispute handling, abuse prevention, and recovery when a partner's account is compromised. The handling of exceptional cases such as ownership transfer, separation, or inaccessible partner accounts remains unresolved; do not assume these are ordinary unilateral administrative actions.

### DEC-010 — Shared wedding data remains with the couple after planner removal
**Status:** Approved  
**Decision:** Option A — When a couple removes an independent wedding planner or a planner organization, all information contributed to the **shared wedding workspace** remains available to the couple, including shared tasks, timelines, vendor comparisons, contact entries, budgets, and shared files. The removed planner or organization loses access to the wedding workspace. They retain their own private business records, which are not automatically transferred to the couple.

**Consistency with earlier decisions:** Either partner can revoke planner access under DEC-009, with notification to the other partner and an audit entry. Both partners retain equal access under DEC-003. Planner organizations' team access ends when organization access is revoked (DEC-005/006). A planner-created wedding can be handed over to the couple under DEC-002; planner removal must not destroy the couple's shared planning history.

**Consequences and required follow-up design:** Define how shared versus planner-private material is labeled and stored, the treatment of licensed third-party materials and contractual intellectual-property restrictions, retention of audit attribution, reassignment of planner-owned tasks, pending invitations, exports, offline copies, and whether the planner receives advance notice. Removal should not silently delete shared records. Detailed handling of intellectual property, legal retention, and disputes remains open.

### DEC-011 — Guided planner handover with immediate exit available
**Status:** Approved  
**Decision:** Option C — A professional planner or planning organization can voluntarily end their involvement in a wedding using a guided handover that highlights outstanding tasks, upcoming payments, vendor contacts, important documents, and other responsibilities. The planner may also choose to leave immediately without completing the handover. Neither path requires couple approval to end the planner's access. Shared wedding information remains with the couple under DEC-010; planner-private business information stays separate.

**Expected product behavior:** A handover checklist should surface open items, enable reassignment or flag unresolved responsibilities, and make the exit's consequences clear. If immediate exit is chosen, access ends promptly and the couple is notified; unfinished work must remain visible rather than silently disappear. Both exit paths should create an audit entry. The platform's access rules do not by themselves cancel any external contractual obligations.

**Consequences and required follow-up design:** Define whether handover is optional or can be saved as a draft, what information is included, how tasks and pending invitations are reassigned, who may initiate organization-wide departure, notifications to both partners and assigned staff, handling of planner-created weddings where no couple has joined, and how to handle planner-private materials, disputes, and legally required records. No particular checklist layout or notification timing has been approved yet.

### DEC-012 — Remove unclaimed weddings after warning and grace period
**Status:** Approved  
**Decision:** Option C — If a planner-created wedding has not been claimed by either partner when the planner leaves, the unclaimed wedding workspace is scheduled for deletion after an advance warning and a grace period, subject to applicable legal or contractual retention obligations. The planner may still leave immediately under DEC-011; their departure does not have to wait for deletion.

**Expected product behavior:** Clearly identify a wedding as unclaimed only when no partner has accepted membership. Warn relevant eligible recipients before deletion where contact details and lawful notification channels exist. Allow a legitimate partner to claim the wedding during the grace period through an appropriately verified process. After the grace period, delete the unclaimed shared workspace data that is eligible for deletion; retain only information that must lawfully be preserved, with access restricted. Do not delete the planner's separate private business records merely because the shared wedding workspace is deleted. If a partner claims the workspace in time, the wedding is no longer unclaimed and the couple's shared information is preserved under DEC-010.

**Consequences and required follow-up design:** Decide the grace-period length, who receives warnings and when, verification for a late claim, whether an unclaimed wedding can be recovered after deletion, retention exceptions, how to handle pending invitations and uploaded files, audit records, backups, and whether a planner's organization may designate a successor before departure. None of these operational values has yet been approved.

### DEC-013 — 90-day grace period for unclaimed weddings
**Status:** Approved  
**Decision:** Option B — An unclaimed planner-created wedding is retained for a **90-day grace period** after the planner exits and the wedding is scheduled for deletion under DEC-012. During those 90 days, an eligible partner may claim the wedding through a secure verification process. If successfully claimed before the deadline, the scheduled deletion is canceled and the wedding remains available to the couple. If still unclaimed when the period expires, eligible shared wedding data is deleted, subject to applicable legal or contractual retention requirements.

**Expected product behavior:** Record the start and deadline of the 90-day grace period; communicate the deadline in warnings where lawful contact information exists; stop deletion when a verified partner claims the workspace; avoid deleting planner-private business records; and restrict any records that must be retained for legal reasons.

**Consequences and required follow-up design:** Specify warning timing and recipients, claim verification, handling of expiry during an active claim, deletion processing and backups, legally required retention exceptions, and whether restoration is possible after deletion. The 90-day duration is approved; these operational details are not yet approved.

### DEC-014 — Multiple scheduled deletion reminders
**Status:** Approved  
**Decision:** Option B — For an unclaimed planner-created wedding subject to the 90-day grace period (DEC-012/013), send an initial deletion warning when the grace period starts, followed by reminders **30 days, 7 days, and 1 day before the deletion deadline**. Each message must state the scheduled deletion date and explain how an eligible partner can securely claim the wedding.

**Expected product behavior:** Schedule reminders against the actual deletion deadline, not against a generic wedding date. Send reminders only while the workspace remains unclaimed and deletion is pending. Stop future reminders when an eligible partner successfully claims the wedding or deletion is otherwise canceled. Do not disclose sensitive wedding details to an unverified recipient. If a lawful, deliverable contact method is unavailable, record the inability to notify rather than assuming delivery.

**Consequences and required follow-up design:** Define eligible notification recipients, permissible channels, verification and anti-abuse controls, bounced emails, duplicate reminders, timezone and delivery timing, audit records, and the handling of a claim initiated near the deadline. The four warning points are approved; recipient selection and detailed delivery behavior remain open.

### DEC-015 — Verified invitation recipients for deletion reminders
**Status:** Approved  
**Decision:** Option C — Send unclaimed-wedding deletion reminders only to partners who have a valid, previously authorized invitation and are eligible to receive these communications. Do not automatically contact addresses entered by a planner unless they meet the authorized-invitation criteria. If no eligible recipients exist, record that notification could not be sent rather than exposing wedding information to unverified contacts.

**Expected product behavior:** Apply the notification schedule from DEC-014 (initial warning, then 30, 7, and 1 day before deletion) only to eligible invitation recipients. Messages should reveal no sensitive wedding information before the recipient completes the required identity verification. A reminder alone does not grant wedding access: the recipient must securely claim the wedding during the 90-day grace period (DEC-013). Stop reminders after a successful claim or cancellation of deletion. Keep delivery and eligibility audit records with appropriate privacy safeguards.

**Consequences and required follow-up design:** Define precisely what constitutes a valid, authorized invitation (including expired or revoked invitations), how a recipient verifies their identity, whether multiple eligible recipients receive separate notices, handling of undeliverable addresses, and who can claim when no eligible recipients exist. These details are not yet approved.

### DEC-016 — Email verification to claim an unclaimed wedding
**Status:** Approved  
**Decision:** Option A — An eligible invited partner claims an unclaimed wedding by signing in or creating an account, verifying control of the email address associated with their existing authorized wedding invitation, and accepting that invitation. No additional single-use recovery token is required beyond the normal invitation acceptance and email-verification flow.

**Expected product behavior:** Only an existing, authorized invitation may establish eligibility to claim the wedding (DEC-015); possession of an arbitrary email address or a deletion-reminder link alone is insufficient. Verify the invited email address before granting wedding access, require explicit acceptance, and cancel pending deletion and future reminders when the claim succeeds within the 90-day grace period (DEC-013/014). Apply normal safeguards against unauthorized access, invitation misuse, and duplicate claims. Respect the equal partner control model after joining (DEC-003).

**Consequences and required follow-up design:** Define invitation validity and expiry, revoked invitations, email-address changes, recovery for lost mailbox access, concurrent claims, and deadline-edge behavior. This decision selects email verification rather than mandatory extra claim tokens; it does not approve access through uninvited addresses or override revoked invitations.

### DEC-017 — Secure renewal of expired wedding invitations
**Status:** Approved  
**Decision:** Option B — During the 90-day grace period for an unclaimed wedding, an eligible invited partner whose original invitation has expired may request a fresh invitation sent to the **same originally invited email address**, provided the invitation was not revoked and the wedding has not been claimed or deleted. The partner must verify control of that email address before accepting the renewed invitation.

**Expected product behavior:** Distinguish an expired invitation from a revoked invitation. Expiration alone does not permanently prevent an otherwise eligible partner from claiming during the grace period. Offer a secure renewal flow that sends a fresh invitation to the originally authorized address; do not grant access merely because someone requests renewal. Require account sign-in or creation, email verification, and explicit invitation acceptance under DEC-016. Renewal must not extend the 90-day deletion deadline, override revocation, or restore a deleted wedding. Upon successful claim, cancel pending deletion and reminders. Use reasonable anti-abuse protections and avoid disclosing wedding details in renewal requests or emails.

**Consequences and required follow-up design:** Define the normal invitation lifetime, renewal request rate limits, renewed invitation expiration, handling of changed or inaccessible email addresses, revoked invitations, and deadline-edge processing. Renewal is not a general identity-recovery mechanism and must not bypass the original authorization.

### DEC-018 — Standard wedding invitation expiration
**Status:** Approved  
**Decision:** Option B — Standard wedding invitations to partners, planners, and other collaborators expire **14 days after issuance**, unless an explicitly approved role-specific exception applies in the future.

**Expected product behavior:** Display the invitation expiration date and time to the sender and, where appropriate, the recipient. An invitation must no longer grant access after expiry; recipients should be shown a clear expired-invitation state and a way to request a replacement when eligible. A newly issued invitation has its own 14-day validity period. Revocation ends validity immediately, regardless of the original expiration date. For unclaimed weddings, eligible invited partners can renew expired invitations during the existing 90-day grace period under DEC-017; renewal never extends that grace period. Accepting a valid invitation before expiration completes the relevant onboarding workflow, subject to identity verification and authorization requirements.

**Consequences and required follow-up design:** Define how invitation expiry is communicated, whether automatic reminders are sent before expiration, rate limits and abuse prevention for reissuing invitations, and exceptions for roles or special circumstances. The 14-day rule does not alter the separate 90-day unclaimed-wedding retention period (DEC-013).

### DEC-019 — Reminder before invitation expiration
**Status:** Approved  
**Decision:** Option B — Send **one automatic reminder 3 days before** a standard 14-day wedding invitation expires, only while that invitation remains pending.

**Expected product behavior:** At approximately day 11 after issuance, notify the invited recipient that their invitation expires in 3 days, including a safe route to review or accept it and a clear expiration date. Do not send the reminder if the invitation has already been accepted, revoked, superseded, or expired. Do not reveal private wedding details to unverified recipients. A newly issued invitation follows its own 14-day validity and may receive its own single reminder if still pending. Invitation reminders are distinct from the unclaimed-wedding deletion reminders in DEC-014.

**Consequences and required follow-up design:** Define reminder delivery channels, failure handling, suppression preferences, timing/time zones, and anti-abuse limits. The reminder does not extend invitation validity or the 90-day unclaimed-wedding grace period.

### DEC-020 — Invitation reminder delivery channel
**Status:** Approved  
**Decision:** Option A — Deliver the single automatic invitation-expiration reminder **by email only**, to the email address associated with the pending invitation.

**Expected product behavior:** For a standard 14-day invitation, send the one reminder 3 days before expiry (DEC-019) by email to the originally invited address. Do not additionally send an in-app notification or SMS for this reminder. Suppress delivery if the invitation has been accepted, revoked, replaced, or expired before dispatch. Keep email content privacy-conscious, with a safe path to accept the invitation and the expiry deadline; the email alone does not confer access. A failed delivery must not extend the invitation, override authorization, or stop the existing expiration process. The separate 90-day unclaimed-wedding deletion reminder process (DEC-014/015) is not changed by this decision.

**Consequences and required follow-up design:** Specify how undeliverable invitation reminders are handled, whether and how senders are informed, bounce/suppression policy, and resend safeguards. Broader wedding-activity notification channels remain undecided.

### DEC-021 — Notify the invitation sender after failed reminder delivery
**Status:** Approved  
**Decision:** Option B — Record an undeliverable invitation-expiration reminder and notify the person who sent the invitation, enabling them to review the address or issue a replacement invitation.

**Expected product behavior:** When the email delivery provider reports a confirmed failure of the automatic reminder established in DEC-019 and DEC-020, record the failed delivery against the invitation and inform its sender through an appropriate sender-facing notification. Provide an actionable way to inspect the invitation status, correct an incorrect recipient address by issuing a new authorized invitation, or resend/replace as permitted by existing access rules. Do not expose detailed delivery diagnostics, private recipient information, or wedding content unnecessarily. A failed reminder does not itself revoke, renew, or extend the original invitation; it still expires 14 days after issuance. Do not send additional automatic expiration reminders as part of this decision.

**Consequences and required follow-up design:** Define how the sender is notified, which delivery failures qualify as final versus temporary, handling of missing/inactive senders, limits on reissuing invitations, and audit/history retention. No automatic retry policy is approved by this decision.

### DEC-022 — Email and in-app alerts for failed invitation reminders

**Status:** Approved

**Decision:** Option B — Notify the original invitation sender both by email and with an in-app notification when an invitation-expiration reminder has a confirmed delivery failure. Display the invitation delivery status in the sender's dashboard.

**Expected product behavior:** Record the delivery failure against the invitation and show a clear failed-delivery status in the sender's invitation-management view. Send an email alert to the original sender and create an in-app notification accessible from their dashboard/notification center. Both alerts should identify the affected invitation sufficiently for the authorized sender to act and link to the invitation-management view, without exposing unnecessary recipient information, private wedding content, or sensitive delivery diagnostics. Allow authorized senders to review the invitation and issue a replacement where permitted. Do not extend or automatically renew the original 14-day invitation; do not add further invitation-expiration reminders.

**Consequences and required follow-up design:** Define whether to send alerts for temporary versus confirmed permanent failures, notification deduplication, what happens when the sender's account is disabled or no longer has access, and how delivery status/history is retained. No automatic retry policy is approved by this decision.

### DEC-023 — Retry temporary invitation-reminder delivery failures
**Status:** Approved  
**Decision:** Option B — Automatically retry temporary email delivery failures on a limited schedule. Notify the invitation sender only if the delivery ultimately fails; notify immediately for confirmed permanent failures.

**Expected product behavior:** Distinguish temporary delivery errors (for example, a transient email-provider outage) from permanent failures (for example, a definitively invalid address). For temporary failures, retry delivery automatically within a bounded retry window, using sensible delays and a maximum number of attempts to prevent repeated or excessive email traffic. Do not send a sender-facing failed-delivery email or in-app alert during retryable transient states; show an appropriate pending/retrying status where relevant. When retries are exhausted or the provider confirms a final failure, record the outcome and notify the original sender by **both email and in-app notification** with the dashboard delivery status, as required by DEC-021 and DEC-022. Confirmed permanent failures skip retries and trigger sender notification promptly. Stop retrying if the invitation is accepted, revoked, replaced, or expired. A retry must never extend the 14-day invitation validity or create an additional scheduled invitation reminder beyond DEC-019.

**Consequences and required follow-up design:** Define the maximum retry attempts, backoff schedule, treatment of provider-accepted-but-not-delivered messages, alert deduplication, and safeguards against retrying past invitation expiration. The exact retry schedule is not yet approved.

### DEC-024 — Three automatic retries for temporary invitation-reminder failures

**Status:** Approved  
**Decision:** Option B — Make up to three automatic retry attempts following a temporary invitation-reminder email delivery failure, at 15 minutes, 1 hour, and 6 hours after the initial failed attempt.

**Expected product behavior:** When the email provider identifies a retryable temporary failure, schedule at most three further delivery attempts for the *same* invitation-expiration reminder: approximately 15 minutes, 1 hour, and 6 hours after the original failure. Cancel any pending retries immediately if the message is confirmed delivered or the invitation is accepted, revoked, replaced, or expired. Do not retry a confirmed permanent failure. If all three retries fail, or a permanent failure is confirmed, record the final failure and notify the original invitation sender by email and in-app notification, with an actionable delivery status in the dashboard (DEC-021 through DEC-023). Prevent duplicate reminder messages and duplicate failure alerts. Retrying must never create a second scheduled reminder or extend the invitation's 14-day expiry.

**Consequences and required follow-up design:** Define provider delivery-state interpretation (including acceptance versus actual delivery), idempotency, time-zone and scheduling precision, cancellation races, and fallback handling when the original sender is no longer authorized. The precise technical retry mechanism remains an implementation decision.

### DEC-025 — Fallback recipient when the original invitation sender loses access

**Status:** Approved  
**Decision:** Option B — If the original invitation sender is no longer authorized to access or manage the wedding, notify an active, authorized wedding administrator instead. If no eligible administrator exists, record the failure without sending an unauthorized disclosure.

**Expected product behavior:** When a reminder delivery failure becomes final (confirmed permanent failure or exhausted temporary retries), first check whether the original invitation sender still has the relevant wedding access and invitation-management permission. If yes, notify that sender by email and in-app notification under DEC-021 and DEC-022. Otherwise, select an active wedding administrator who is authorized to manage invitations and notify that administrator by the same channels, providing an actionable link to the affected invitation. Do not send wedding-specific failure alerts to a former planner, removed member, blocked staff member, or anyone else lacking access. If there is no eligible administrator (including an unclaimed wedding with no authorized couple), record the failure and its undeliverable-notification state securely without exposing the wedding's contents. Preserve the invitation's delivery status/history for later review by a properly authorized administrator, subject to retention rules. Do not extend invitation validity or the unclaimed-wedding grace period.

**Consequences and required follow-up design:** Define a deterministic fallback administrator selection rule when multiple eligible administrators exist, how to avoid duplicate notifications, and the appropriate handling of access changes while an alert is queued. No permission is granted merely by receiving an alert.

### DEC-026 — Notify all eligible administrators about fallback invitation-delivery failures

**Status:** Approved  
**Decision:** Option B — When the original invitation sender no longer has access, notify **all active wedding administrators with permission to manage invitations**, rather than selecting just one.

**Expected product behavior:** After an invitation reminder delivery failure is confirmed final, notify the original sender only if they remain authorized (DEC-025). Otherwise, identify all currently active wedding administrators with invitation-management permission and send each an email and an in-app notification (DEC-022). Both partners must be treated equally when both qualify (DEC-003). Each alert should identify the affected invitation and offer an authorized route to resolve it, without exposing unnecessary personal information. Deduplicate alerts per recipient and failure event; reevaluate authorization before dispatch, and do not alert removed or blocked users. If no eligible administrator exists, securely record the failure without unauthorized disclosure. Multiple alerts must not cause multiple replacements or duplicate invitation actions; normal permission checks still apply. Invitation expiration and unclaimed-wedding retention remain unchanged.

**Consequences and required follow-up design:** Define how shared failures are marked resolved across administrators, whether and how other recipients learn of resolution, and behavior when membership changes during delivery. Notifications do not grant permissions.

### DEC-027 — Automatically resolve shared invitation-failure alerts

**Status:** Approved  
**Decision:** Option B — When an authorized administrator resolves an invitation delivery issue, automatically mark the associated alerts as resolved for **all** notified administrators; retain them in notification history.

**Expected product behavior:** Treat all notifications arising from the same underlying invitation-delivery failure as one shared issue, while preserving each recipient's notification history. Once an authorized administrator completes an action that genuinely resolves that issue (for example, correcting the address and successfully issuing a replacement invitation), update its status to resolved for every eligible recipient, including administrators who have not opened their alert. Remove the issue from active/unresolved notification counts and views, but keep a historical entry showing that it was resolved and when. Do not send additional resolution emails or in-app alerts merely because another administrator fixed it. A click, dismissal, or attempted replacement that fails must not be mistaken for resolution. Apply normal authorization checks to the action that resolves the issue; a notification alone grants no permission.

**Consequences and required follow-up design:** Specify what qualifies as resolution for each failure type, what happens if a replacement invitation also fails, and how status/history are shown when a recipient loses access. Preserve the previously approved email and in-app delivery-failure alerts (DEC-022, DEC-025, DEC-026); this decision governs subsequent resolution of those alerts.

### DEC-028 — Resolve invitation-delivery failures only after replacement delivery is confirmed

**Status:** Approved  
**Decision:** Option B — A failed-invitation delivery issue is resolved only when delivery of the replacement invitation is confirmed, not merely when a replacement is sent or when the recipient accepts it.

**Expected product behavior:** When an authorized administrator corrects an address or issues a replacement invitation, keep the original delivery-failure issue open in a pending-verification state until the replacement email is confirmed delivered. A successful send or provider acceptance for processing alone does not count as confirmed delivery. When delivery is confirmed, automatically resolve the shared issue and its related active alerts for all eligible administrators, retaining the resolution history without sending additional resolution notifications (DEC-027). If the replacement email fails, update the **same** underlying issue with the latest failure and actionable status rather than opening a duplicate issue or falsely clearing the alerts. Apply the approved temporary-failure retry and final-failure notification rules where relevant (DEC-023 and DEC-024), avoiding duplicate alerts. Recipient acceptance is not required to close a delivery issue; acceptance remains a separate onboarding state. Invitation validity, authorization, and privacy protections continue to apply.

**Consequences and required follow-up design:** Define how the product treats messages for which delivery confirmation is unavailable or remains indefinitely pending, and how the issue behaves if an invitation expires or is revoked before confirmation. The exact delivery-provider event mapping is deferred to implementation.

### DEC-029 — Mark replacement delivery unconfirmed after 24 hours

**Status:** Approved  
**Decision:** Option B — If a replacement invitation email has been accepted for processing but no delivery confirmation or definitive failure is received within **24 hours**, classify its delivery as **Unconfirmed** and alert authorized wedding administrators that investigation may be needed.

**Expected product behavior:** Start the 24-hour confirmation window when the replacement email is submitted successfully to the email provider. While awaiting a definitive delivery event, keep the original shared invitation-delivery issue open with a pending-confirmation status (DEC-028). If the 24-hour window elapses without confirmation or a final failure, change the issue status to **Delivery unconfirmed**, not Delivered or Resolved. Notify currently authorized wedding administrators who can manage invitations through the existing email and in-app failure-alert channels, following the authorized-recipient and deduplication principles in DEC-022, DEC-025, and DEC-026. Explain that delivery could not be verified and provide a permitted route to inspect or replace the invitation; do not claim that the email failed or arrived. The shared issue remains unresolved for all administrators (DEC-027). A later trustworthy delivery confirmation can resolve it under DEC-028; a later definitive failure updates the same issue and follows the applicable failure-handling rules. Avoid duplicate alerts for the same status transition. The 24-hour window does not extend the invitation's 14-day validity, reset the 90-day unclaimed-wedding grace period, or bypass authorization checks.

**Consequences and required follow-up design:** Define how late delivery confirmations are reconciled, what happens if the invitation expires or is revoked while delivery is unconfirmed, and how administrators can investigate without triggering unnecessary duplicate invitations. Exact provider-event semantics remain an implementation detail.

### DEC-030 — Expired invitation with unconfirmed delivery requires action

**Status:** Approved  
**Decision:** Option B — If an invitation expires while its delivery remains unconfirmed, keep the underlying shared delivery issue open and change its status to **Invitation expired — Action required**.

**Expected product behavior:** When the 14-day validity period ends without acceptance or reliable delivery confirmation, the invitation becomes expired and cannot be accepted (DEC-018). If the related delivery issue remains unconfirmed, transition that **same** shared issue to **Invitation expired — Action required** rather than automatically closing it or continuing to show only **Delivery unconfirmed** (DEC-029). Authorized wedding administrators can inspect the issue and issue a replacement invitation where permitted; do not automatically issue or send one. Keep the actionable issue visible to all currently authorized administrators, preserving its history and avoiding duplicate issues or redundant alerts (DEC-026 and DEC-027). A new replacement follows the normal invitation validity and delivery-confirmation rules (DEC-018, DEC-028); sending alone does not resolve the original delivery issue. The expiration transition must not disclose information to removed or unauthorized users or extend the expired invitation. Preserve the separate secure-renewal option for eligible unclaimed-wedding partners during the 90-day grace period (DEC-017).

**Consequences and required follow-up design:** Define how administrators are notified about this new actionable expiration status, including whether it creates a fresh alert or updates an existing one; clarify handling of late provider delivery events and cases where the invitee already joined through a valid route.

### DEC-031 — Notify administrators when an unconfirmed invitation expires

**Status:** Approved  
**Decision:** Option B — When an invitation with unresolved delivery confirmation expires, update the existing shared issue and send **one new email and one new in-app notification** to every currently authorized wedding administrator who may manage invitations.

**Expected product behavior:** At the 14-day expiration point, transition the existing shared issue to **Invitation expired — Action required** as specified in DEC-030. Preserve the original issue identifier, prior alerts, event history, and previous **Delivery unconfirmed** status in its history; do not create a duplicate underlying issue. For this meaningful status transition, send a fresh email and in-app notification to all active administrators with invitation-management permission (DEC-022, DEC-025, DEC-026), even if they were previously alerted about unconfirmed delivery. Explain that the invitation is no longer valid, requires manual action, and may be replaced by an authorized administrator. Issue at most one new notification per eligible administrator for this expiration transition, preventing duplicate sends from repeated processing. Do not notify former collaborators or unauthorized users. If the issue has already been resolved or the invitation was accepted before expiry, do not send the expiration alert. Sending a replacement alone does not resolve the issue; confirmed delivery does (DEC-028). When an authorized administrator resolves the issue, automatically resolve related active alerts for all administrators and retain history without a separate resolution announcement (DEC-027).

**Consequences and required follow-up design:** Define whether administrators can dismiss or snooze an unresolved actionable alert without affecting other administrators, and how repeated reminder fatigue should be avoided. Clarify late delivery events, notification delivery failures, and expired invitations associated with already-completed onboarding in subsequent decisions.

### DEC-032 — Personal dismissal and snoozing of unresolved alerts

**Status:** Approved  
**Decision:** Option B — Each authorized administrator may dismiss or temporarily snooze their own notification about an unresolved invitation issue. This personal notification action does not change the shared issue status or any other administrator's notifications.

**Expected product behavior:** Administrators can dismiss an individual notification from their personal active-alert view or snooze it temporarily. Snoozed alerts reappear for that administrator when the selected snooze period ends, provided the issue is still open. The underlying invitation-delivery issue remains visible in the wedding's shared issue list throughout; neither dismissing nor snoozing counts as resolving the issue or changing invitation status. Other administrators' alert states remain independent. Only an authorized resolution of the underlying issue triggers the shared automatic resolution behavior in DEC-027; resolved alerts remain available in history. Material new issue events, including the expiration transition in DEC-031, still generate their separately approved notifications, regardless of prior personal dismissal or snoozing. Personal alert actions should be recorded as user-specific notification state, not as a shared issue resolution.

**Consequences and required follow-up design:** Define supported snooze durations, how repeated snoozes work, and whether important newly occurring events override an active snooze. Specify whether personal dismissal can be undone and how users find dismissed alerts in notification history.

### DEC-033 — Notification snooze durations

**Status:** Approved  
**Decision:** Option B — Offer preset snooze durations of **1 hour**, **tomorrow**, and **next week**, plus a **custom date and time** for personal notification snoozing.

**Expected product behavior:** An authorized administrator may select one of the three presets or specify a future date and time when snoozing their own unresolved invitation-issue notification (DEC-032). The selected snooze hides that notification from the administrator's active alerts until the snooze ends, unless the underlying issue is resolved first. On expiry of the snooze, the notification reappears if the issue remains unresolved. Snoozing does not alter invitation validity, the 14-day expiration deadline, shared issue status, or any other administrator's notifications. The platform must display the actual resurface date and time for each option, interpreted in the user's configured time zone, and reject custom times in the past. Material new issue events still trigger their separately approved notifications (DEC-031 and DEC-032).

**Consequences and required follow-up design:** Define the meaning of **tomorrow** and **next week** (such as the local clock time), any maximum custom snooze horizon, and how snoozes interact with urgent deadlines. Define whether users can repeatedly snooze the same unresolved issue. No duration-specific restriction on critical alerts is approved by this decision.

### DEC-034 — Calendar-based snooze presets with a preferred reminder time

**Status:** Approved  
**Decision:** Option C — Interpret **tomorrow** and **next week** as calendar-based dates at each user's preferred reminder time, defaulting to **9:00 AM** in their configured local time zone until they choose a different time.

**Expected product behavior:** Each account has a personal preferred reminder time, initially 9:00 AM. **Tomorrow** snoozes the selected personal notification until the next local calendar day at that preferred time. **Next week** snoozes it until the following Monday at the preferred time, using the user's configured time zone. Display the actual date, local time, and time zone before confirmation; ensure the chosen time is strictly in the future. The **1 hour** and **custom date and time** options from DEC-033 remain available. If the shared issue is resolved before the snooze ends, its alert is resolved for everyone per DEC-027; otherwise it reappears at the scheduled time. Personal snooze settings never change another administrator's notification state or the underlying invitation and issue deadlines. Material new events still generate their independently approved notifications.

**Consequences and required follow-up design:** Decide whether changing a user's preferred reminder time should reschedule already-snoozed notifications or only affect new snoozes. Define daylight-saving transitions, time-zone changes, and maximum custom snooze horizons later. The exact settings UI remains open.

### DEC-035 — Reschedule existing calendar-based snoozes when preferred time changes

**Status:** Approved  
**Decision:** Option A — When a user changes their preferred reminder time, automatically recalculate **all existing, active calendar-based snoozes** to use the new preferred time. Leave **1-hour** and **custom date/time** snoozes unchanged.

**Expected product behavior:** On saving a new preferred reminder time, the platform recalculates each still-active personal snooze created with **Tomorrow** or **Next week**, retaining its originally selected target calendar date but substituting the user's newly preferred local clock time. The resulting resurface date and time are displayed accurately in the user's configured time zone. This change is personal: it does not alter shared invitation or issue deadlines, other administrators' alerts, or notifications already dismissed or resolved. Do not recalculate 1-hour or explicitly custom-dated snoozes. A snoozed alert that has already resurfaced is no longer an active snooze and is not rescheduled.

**Boundary condition requiring follow-up:** A recalculated time may now be in the past (for example, changing the preferred time from 11:00 AM to 9:00 AM at 10:00 AM on the scheduled return date). The platform must not leave an overdue snooze hidden indefinitely. The handling of such cases is the next product decision, DEC-036. Daylight-saving and time-zone changes remain to be specified.

**Consequences and required follow-up design:** Apply the update consistently to every eligible active calendar-based snooze; preserve the original selection and change history for auditability where appropriate. Define how recalculated past times should behave before implementation. This decision supersedes the previous open question in DEC-034 but does not change DEC-033 or DEC-034's preset meanings.

### DEC-036 — Move recalculated overdue snoozes to the following day

**Status:** Approved  
**Decision:** Option B — When changing the preferred reminder time would move an existing calendar-based snooze to a local time that has already passed, move that notification to **the following calendar day at the new preferred reminder time** instead of resurfacing it immediately.

**Expected product behavior:** Recalculate all eligible active **Tomorrow** and **Next week** snoozes under DEC-035. If the newly calculated local date/time is still in the future, use it. If that time is in the past or is equal to the current time, set the return to the next local calendar day at the newly preferred time. Show the resulting return date/time in the user's configured time zone. This fallback applies only to active calendar-based snoozes affected by a preferred-time change; do not alter **1-hour** or **custom date/time** snoozes. Do not change the underlying issue, invitation expiry, shared deadlines, or another administrator's notification. If the issue resolves before the new return time, follow the existing resolution rules; material new events can still generate separately approved notifications.

**Consequences and required follow-up design:** A fallback can move a notification beyond its originally selected calendar date; the user should be able to see the recalculated schedule. Daylight-saving and time-zone-change edge cases remain open. This resolves Q-036 and clarifies DEC-035 without replacing the approved preset definitions in DEC-034.

### DEC-037 — Combined overview dashboard for couples

**Status:** Approved  
**Decision:** Option C — The couple-facing wedding workspace uses a combined overview dashboard rather than focusing exclusively on the timeline or task list.

**Expected product behavior:** Present an at-a-glance wedding countdown and summaries of upcoming tasks, budget status, guest progress, important pending decisions, and planning milestones. Make each relevant summary actionable by linking to its detailed area when that feature is available. Keep the overview understandable without requiring the couple to configure widgets before using the product. Reflect only data the signed-in person is authorized to see; handle missing or not-yet-configured information gracefully without inventing figures or implying that a task is complete.

**Scope and follow-up:** This approves the dashboard direction, **not** a final widget layout, dashboard customization model, or blanket MVP commitment for every referenced module. The professional planner's cross-wedding dashboard is distinct and still needs a separate product decision. The initial content priority and responsive behavior of the couple dashboard remain to be specified.

### DEC-038 — Combined professional wedding planner dashboard

**Status:** Approved  
**Decision:** Option C — Professional wedding planners open a **combined multi-wedding dashboard** that brings together a portfolio of weddings and a cross-wedding action center.

**Expected product behavior:** Show the planner's authorized active wedding portfolio with meaningful high-level information such as couple or wedding identifier, wedding date, progress or status where available, and an entry point into each wedding workspace. Alongside it, surface cross-wedding tasks, upcoming deadlines, pending client decisions or approvals, and important alerts, clearly identifying the wedding each item belongs to. Allow planners to move directly from a dashboard item to the relevant wedding or workflow. For planner organizations, show only weddings and actions accessible under the member's assignments and permissions; private planner business data must remain separate from the couple-controlled shared wedding records.

**Scope and follow-up:** This confirms the professional dashboard's **combined portfolio-plus-action-center structure**, not a final screen layout, specific prioritization algorithm, organization-wide visibility default, customization requirement, or MVP approval of every underlying module. Empty, new-account, and multi-wedding states should be designed later. The couple's separate combined overview remains governed by DEC-037.

**Consequences and required follow-up design:** Decide how the professional dashboard should prioritize actionable items across weddings, including urgent deadlines versus routine work. Define team and organization filters, permissions, and navigation in subsequent decisions.

### DEC-039 — Smart priority with manual control across weddings

**Status:** Approved  
**Decision:** Option C — Prioritize the professional planner's cross-wedding action center using a transparent combination of urgency, due dates, explicit task priority, proximity of the wedding date, and decisions that block progress. Planners can switch to chronological sorting and filter by wedding.

**Expected product behavior:** By default, surface actionable items across the planner's authorized weddings in a useful priority order rather than sorting solely by due date or wedding date. Consider overdue and approaching deadlines, manually assigned priority, upcoming weddings, and blocked decisions or approvals. Clearly show why an item needs attention, its associated wedding, relevant deadline and status, and a direct link to act on it. Provide a predictable chronological sorting alternative and a wedding filter. Preserve role-based visibility and avoid surfacing unauthorized wedding or private business information.

**Scope and follow-up:** This approves product-level ranking factors and user controls, **not** a particular algorithm, AI requirement, numerical weighting, automatic modification of task priorities, or a final interface design. Do not imply that a task's calculated display rank changes its underlying due date or priority. Define how planner-defined task priorities are represented and how the dashboard behaves with conflicting factors, ties, missing dates, and empty states in later design.

**Consequences and required follow-up design:** Distinguish the action center's suggested order from explicit priorities chosen by people. Decide whether the cross-wedding action center should display work assigned to the signed-in planner only, the full organization, or support both through filtering.

### DEC-040 — Personal work by default with authorized team filters

**Status:** Approved  
**Decision:** Option C — The professional planner dashboard defaults to the signed-in employee's own assigned tasks and responsibilities, while providing filters to view all accessible team work, select a colleague, or focus on an individual wedding.

**Expected product behavior:** On opening the professional action center, show the employee's assigned tasks, relevant deadlines, pending decisions, and other actionable responsibilities across weddings they are authorized to access. Provide an explicit view/filter for other team work within the employee's existing permissions, including a colleague filter and a wedding filter. Make the active scope clear so users can distinguish their own workload from team workload; maintain the smart prioritization and chronological sort options approved in DEC-039 within the chosen scope. Managers with broader permissions may see more work through the same controls; regular employees do not gain access simply by selecting a team filter. The wedding portfolio remains visible only for authorized weddings under DEC-038.

**Scope and follow-up:** This approves the **default scope and optional team filters**, not organization-wide access for every employee, automatic reassignment, final manager role definitions, or a specific dashboard layout. Team-filter results must respect wedding membership, staff assignments, role permissions, and the separation between shared wedding data and private planner business records. Empty personal workloads should provide a clear route to authorized team views without implying that other people's work belongs to the signed-in employee.

**Consequences and required follow-up design:** Define whether managers can assign and reassign tasks across weddings, which roles can do so, and what notifications and audit trail apply. Specify the interaction between colleague filters and wedding filters, including when an employee leaves an organization or loses wedding access.

### DEC-041 — Flexible, permission-based colleague task assignment

**Status:** Approved  
**Decision:** Option B — Organization owners and managers may assign and reassign tasks across weddings they are authorized to manage. Regular employees may assign or reassign tasks to eligible colleagues when explicitly granted that permission. Affected colleagues are notified and changes are recorded.

**Expected product behavior:** Within a planner organization, authorized owners and managers can create, assign and reassign tasks for weddings within their permitted scope. Other employees can assign or reassign tasks only where their role or delegated permissions allow it. An assignee must be an active, eligible colleague with access to the relevant wedding and task information; selecting a colleague must never grant wedding access implicitly. Record who changed the assignment, from whom, to whom, and when; notify affected colleagues of new assignments and reassignment changes. Task assignments appear in the assignee's personal professional dashboard (DEC-040) and are eligible for the prioritization and filters defined in DEC-039.

**Permissions and safeguards:** Enforce both organization-level assignment rights and wedding-level access. Prevent assignment to removed, suspended or unauthorized staff. Revocation of access must prevent further task visibility and assignment actions. Preserve the couple's ownership of shared wedding information and the separation of private planner-business records. A colleague's eligibility to receive tasks does not automatically give them permission to assign tasks onward. Notifications must not disclose wedding details to unauthorized recipients. Preserve an audit trail of assignment changes.

**Scope and follow-up:** This decision approves permission-based assignment and reassignment with notification and audit history. It does **not** establish automatic acceptance requirements, unrestricted organization-wide visibility, the precise notification channel or timing, the detailed task permission matrix, or whether the couple may assign tasks to planner staff. Define how task recipients can acknowledge or decline work and how planners handle assignment conflicts in subsequent decisions.

**Consequences and required follow-up design:** Define whether newly assigned tasks immediately become the colleague's responsibility or require an explicit acceptance step. Specify notifications for task creation versus reassignment, and edge cases when a staff member loses access while assigned to unfinished tasks.

### DEC-042 — Immediate task assignment with optional acknowledgement

**Status:** Approved  
**Decision:** Option C — An authorized assignment or reassignment takes effect immediately. The colleague becomes responsible without a mandatory acceptance step, but may optionally acknowledge the assignment or flag a problem.

**Expected product behavior:** On assignment, the task immediately appears in the eligible colleague’s personal workload and contributes to deadlines and smart prioritization (DEC-039/040). Notify the affected colleague as established in DEC-041. Show whether the assignee has acknowledged the assignment, without treating acknowledgement as a prerequisite for ownership, progress, or completion. The assignee can flag an issue such as unavailable capacity, unclear instructions, or an assignment conflict; make the flag visible to authorized task managers so they can review and, if needed, reassign the task. Reassignment updates the responsible person immediately and records the change in the audit trail.

**Permissions and safeguards:** Only authorized users can assign or reassign tasks (DEC-041). Acknowledging or flagging a task does not confer assignment-management permissions, remove responsibility, or expose data outside the assignee’s wedding access. Preserve assignment, acknowledgement, and issue history appropriately; prevent notifications to people whose access has been revoked.

**Scope and follow-up:** This does not require acceptance, automatically unassign flagged tasks, define an acknowledgement deadline, or require managers to approve acknowledgements. Define the treatment of tasks flagged by their assignees, including whether managers are notified and whether the task remains assigned while a problem is being addressed.

### DEC-043 — Flagged assignments remain owned and require review

**Status:** Approved  
**Decision:** Option B — When an assignee flags a problem with an assigned task, the task remains assigned to that colleague but is prominently marked **Needs review**. Notify an appropriate authorized task manager to review the problem and determine whether reassignment or another corrective action is necessary.

**Expected product behavior:** Flagging an assignment does not unassign the task, change its deadline, or silently transfer responsibility. Display **Needs review** prominently in the task detail, the assignee's personal workload, and relevant authorized manager views and action centers. Preserve the assignee's explanation or issue details for authorized reviewers. Notify the appropriate authorized task manager so the issue can be acted upon. An authorized manager may resolve the concern, clarify instructions, adjust the task as permitted, or reassign it under DEC-041; any reassignment immediately updates the responsible colleague under DEC-042. Keep an audit history of the flag, review actions, and assignment changes. Avoid showing the flag or its details to users without access to the task.

**Permissions and safeguards:** The assignee retains responsibility until an authorized change occurs. A flag does not grant the assignee reassignment rights, automatically pause work, or remove a due date. Apply wedding and organization access checks to reviewers and notifications. If the original assignee loses access, prevent unauthorized access and surface the now-invalid assignment for authorized management; do not treat it as a normal unresolved flag indefinitely.

**Scope and follow-up:** This decision establishes ownership continuity, a visible **Needs review** state, and manager notification. It does not yet define which manager is the primary reviewer when multiple authorized managers exist, how review completion is confirmed, escalation timing, or whether managers can delegate the review itself.

### DEC-044 — Designated wedding lead reviews flagged tasks, with manager fallback

**Status:** Approved  
**Decision:** Option B — Notify the wedding's designated lead planner first when an assigned task is flagged **Needs review**. If there is no eligible lead available, notify authorized organization managers as fallback reviewers.

**Expected product behavior:** For an organization-managed wedding, route the initial review notification to the designated lead planner when that person is active, authorized to view the task, and eligible to review or coordinate its resolution. Show the flagged task in the lead's authorized review workload. If the wedding has no designated lead, or the lead has lost access or is otherwise known to be ineligible or unavailable, notify authorized organization managers who can review the task. Do not disclose task details to an unauthorized or removed lead. The task remains assigned to its existing colleague and marked **Needs review** until an authorized person resolves the issue or reassigns the task (DEC-041–043). Preserve review routing, notifications, and corrective actions in the audit history.

**Permissions and safeguards:** Designation as wedding lead does not override wedding-access permissions or automatically confer unrestricted task-management rights. Fallback recipients must have access to the wedding and sufficient review authority. Avoid duplicate initial notifications where possible; if no authorized reviewer exists, keep the issue visible in an appropriate restricted administrative queue rather than silently dropping it. This decision does not establish a time-based escalation threshold or authorize notification of the couple about internal staffing issues.

**Scope and follow-up:** Define how the designated wedding lead is selected and replaced, including who may change that designation and whether every organization-managed wedding must have one. Time-based escalation and review ownership remain open.

### DEC-045 — Permission-based lead planner designation

**Status:** Approved  
**Decision:** Option B — Organization owners and managers may appoint or replace a wedding's designated lead planner. Other organization employees may do so only when explicitly granted lead-designation permission. The selected lead must be an eligible staff member with appropriate access to that wedding. Record and communicate changes.

**Expected product behavior:** Provide an authorized lead-planner designation control in each organization-managed wedding. Show the current lead to authorized wedding participants and organization staff according to their access. Owners and managers with access to the wedding may set or change the lead; a regular employee may do so only if explicitly delegated this capability and authorized for the wedding. Candidate selection is restricted to active, eligible organization staff who already have access to that wedding. Notify the newly designated lead and relevant affected team members when the designation changes, and preserve who changed it, when, and the previous/new lead in the audit history. If the lead is removed, loses eligibility, or loses wedding access, clear the invalid designation and use DEC-044's authorized-manager fallback for flagged-task reviews until a new eligible lead is appointed.

**Permissions and safeguards:** Lead designation does not itself grant new wedding access, override couple restrictions on individual staff (DEC-006), or automatically confer unrelated management or task-assignment permissions (DEC-041/044). Reassignment must never silently restore access to a blocked or removed employee. The organization controls its internal staffing without requiring separate couple approval for each lead change, consistent with DEC-005/006; keep the couple's existing team-visibility and notification protections intact.

**Scope and follow-up:** Whether a lead planner is mandatory for every organization-managed wedding, whether more than one lead can be designated, and how the designation is initially populated remain unapproved. Next determine whether the lead planner role is optional or required.

### DEC-046 — Lead planner optional during initial setup, encouraged later

**Status:** Approved  
**Decision:** Option B — An organization-managed wedding may be created and used without a designated lead planner. Encourage the organization to appoint an eligible lead as planning progresses, without making appointment a prerequisite to workspace use.

**Expected product behavior:** Allow authorized organization members to create a wedding, enter and manage wedding information, and carry out otherwise permitted planning activities even when no lead planner has been designated. Show a clear, non-blocking prompt to appoint a lead, with a direct link to the permission-controlled designation workflow from DEC-045. Do not automatically appoint the wedding creator or require a lead before assigning ordinary team tasks. Once an eligible lead is appointed, display that person to authorized participants and route flagged-task reviews according to DEC-044.

**Fallback and safeguards:** While no eligible lead exists, flagged tasks marked **Needs review** are routed to authorized organization managers under DEC-044. If no authorized manager is available, retain the issue in an appropriately restricted administrative queue rather than losing it. The absence of a lead never expands any employee's wedding access or task permissions, bypasses couple restrictions, or silently changes task ownership. Preserve an audit trail for lead appointments and removals under DEC-045.

**Scope and follow-up:** This decision does not establish a deadline for appointing a lead, a mandatory escalation for weddings without a lead, or whether a wedding can have more than one designated lead. Next decide whether the lead designation supports exactly one person or multiple co-leads.

### DEC-047 — Exactly one designated lead planner per wedding

**Status:** Approved  
**Decision:** Option A — An organization-managed wedding may have **at most one** designated lead planner at any given time. Other eligible planners may collaborate on the wedding, but they are not additional designated leads.

**Expected product behavior:** Provide one lead-planner designation field per organization-managed wedding. The field may be empty during setup or ongoing planning under DEC-046, or contain exactly one active, eligible staff member with appropriate wedding access. Authorized users may replace or remove the lead using the permission-controlled workflow in DEC-045. Replacing the lead is one coherent change: the previous person ceases to be the designated lead and the new person becomes the sole designated lead, with relevant notifications and audit history. Do not expose co-lead or multiple-equal-lead designation controls. Other team members may still be assigned tasks and responsibilities according to their existing permissions.

**Review routing and safeguards:** Route initial **Needs review** notifications to the single designated lead if eligible and authorized; otherwise use the authorized-manager fallback in DEC-044. If the designated lead loses access, becomes ineligible, or is removed, clear the designation and apply the fallback until a new lead is appointed. A lead designation does not grant extra wedding access, override couple restrictions, or automatically confer unrelated management powers (DEC-005/006, DEC-041, DEC-045).

**Scope and follow-up:** Exactly one lead is permitted when a lead is designated, but appointment remains optional (DEC-046). Further decisions may define how a lead is suggested during setup and what happens when a lead is temporarily absent. Next define the default approach to suggesting a lead at wedding creation.

### DEC-048 — Suggest eligible wedding creator as initial lead, with alternatives

**Status:** Approved  
**Decision:** Option B — During creation of an organization-managed wedding, suggest the eligible creator as its initial designated lead planner, while allowing the authorized creator to select another eligible colleague or leave the position unassigned. No lead is appointed without explicit confirmation.

**Expected product behavior:** Include an optional lead-planner field in the wedding-creation flow. If the creator is active, eligible, already authorized to access the wedding, and permitted to designate leads, preselect or visibly suggest that person as a proposed lead, clearly indicating that the choice is not yet saved. Allow an authorized creator to select another eligible organization employee with wedding access or choose **No lead yet**. Confirm the selection as part of wedding creation; if the creator is not eligible or cannot designate leads, do not suggest or silently assign them, and do not offer unauthorized designation actions. The wedding can still be created without a lead in accordance with DEC-046. Only one lead may be designated, per DEC-047.

**Notifications and safeguards:** After an explicitly confirmed appointment, apply DEC-045's relevant team notifications and audit logging. If no lead is selected, use DEC-044's authorized-manager fallback for flagged tasks and display the non-blocking encouragement to appoint a lead. A suggested creator does not acquire wedding access, management permissions, or a lead designation by default; honor the couple's restrictions on organization staff (DEC-005/006). Avoid confusing a prefilled suggestion with an already-active assignment.

**Scope and follow-up:** This decision governs initial setup, not a mandatory lead requirement, automatic assignment, or a new permission tier. The handling of temporary lead unavailability and broader planning-module scope remain to be designed.

### DEC-049 — Temporary lead absence with automatic manager fallback

**Status:** Approved  
**Decision:** Option B — An eligible designated lead planner may set a temporary absence period. While that period is active, newly flagged tasks requiring review are routed to authorized organization managers rather than the absent lead. The designated lead remains unchanged.

**Expected product behavior:** Allow the lead to configure a start and end date/time for an absence, show the period and its review-routing effect to authorized staff, and permit the lead to end or edit the absence. During an active absence, new **Needs review** flags bypass the absent lead and notify eligible organization managers with access to the wedding. When the absence ends, new review notifications return to the designated lead if still eligible. Existing task assignees, due dates, acknowledgement states, and lead designation are not modified. Previously routed issues remain available to their authorized reviewers; an absence transition must not erase or duplicate issues.

**Permissions and safeguards:** Enforce the couple's restrictions and organization permissions for every fallback recipient (DEC-005/006, DEC-044/045). Do not expose task details to managers lacking wedding access. If no eligible manager is available, retain the issue in a restricted administrative review queue and visibly flag the lack of an available reviewer to authorized administrators rather than silently dropping it. Log absence settings and review-routing changes. An absence does not create a second lead or delegate unrelated permissions (DEC-047).

**Scope and follow-up:** This is a temporary review-routing rule, not a general out-of-office notification policy, automatic reassignment of tasks, or appointment of a substitute lead. Further design should clarify whether a lead's absence affects only flagged-task reviews or other wedding-specific approvals and communications.

### DEC-050 — Reroute actionable requests during lead absence, with configurable exceptions

**Status:** Approved  
**Decision:** Option C — During a designated lead planner’s active absence, redirect actionable wedding requests to authorized organization managers by default, while allowing the lead to specify categories that should continue reaching them. Inform senders when their requests are redirected.

**Expected product behavior:** Extend the absence configuration approved in DEC-049 to cover actionable requests directed to the absent lead, including flagged-task reviews, approval requests, supplier questions, and wedding-specific requests from the couple. During the configured absence, route eligible new requests to organization managers who are authorized to access the wedding and handle the relevant request type. The lead can select explicit categories that continue to be delivered to them rather than rerouted; show the effective categories and absence dates in the settings. Communicate to the sender that the request has been redirected, identifying a replacement recipient only when the sender is permitted to know that person's identity. Preserve the original request, context, timestamps, and audit trail; do not create duplicate requests.

**Permissions and safeguards:** An absence exception affects delivery/routing only; it does not grant new permissions, change ownership of tasks, authorize managers to approve matters outside their existing authority, or alter the single-lead rule (DEC-047). Apply wedding-specific access controls and the couple's employee restrictions (DEC-005/006). If no eligible manager can receive a request, preserve it in a restricted actionable queue, surface an appropriately scoped warning to authorized administrators, and do not imply that it has been handled. Once the absence ends, newly created requests follow normal routing; already redirected requests remain available to their authorized handlers until addressed. Record routing, exceptions, and relevant changes.

**Scope and follow-up:** This broadens DEC-049's flagged-task fallback into a configurable absence-routing policy. The precise default categories, treatment of messages that are informational rather than actionable, remain open for later decisions; manager overrides of the lead's exception choices are governed by DEC-052. No automatic task reassignment or second lead is introduced.

### DEC-051 — Lead planner and authorized managers may manage absence settings

**Status:** Approved  
**Decision:** Option B — A designated lead planner may manage their own absence period and routing exceptions; authorized organization managers may also create, change, or end these settings on the lead’s behalf when necessary.

**Expected product behavior:** Provide the designated lead with controls for absence start/end, relevant request-routing exceptions, and early return. Permit organization managers with the appropriate management permission and wedding access to configure or modify these settings for the lead, including unexpected illness or other unplanned unavailability. Display the effective absence window and routing policy to authorized staff. Apply changes to new actionable requests according to DEC-049/050; preserve existing requests, their handling state, and the wedding's single lead designation (DEC-047).

**Notifications and audit:** Notify the lead when an authorized manager creates, edits, or ends their absence settings, using available authorized notification channels. Record the actor, timestamp, prior and updated values, and the affected wedding. Notify relevant authorized managers when changes materially affect fallback routing; avoid duplicate request alerts. If the lead has lost access, do not send confidential wedding details to them.

**Permissions and safeguards:** Management authority is not universal access: enforce organization role permissions, wedding-specific access, and the couple's restrictions on individual staff (DEC-005/006). Neither the lead nor a manager may use absence settings to grant access, approve requests outside their authority, automatically reassign existing tasks, or designate an additional lead. If no eligible manager can receive a rerouted request, use the restricted queue and authorized warning behavior established in DEC-050.

**Scope and follow-up:** This approves who can manage absence settings, not a new delegation tier or organization-wide human-resources leave system. Manager overrides of the lead’s explicitly configured exceptions are permitted with a recorded reason under DEC-052; how competing edits should be resolved remains open.

### DEC-052 — Authorized managers may override absence routing exceptions with a reason

**Status:** Approved  
**Decision:** Option B — Authorized organization managers may override a lead planner’s configured absence-routing exceptions when necessary, provided they record a reason; notify the lead and retain an audit history.

**Expected product behavior:** An authorized manager with appropriate wedding access can change the effective routing policy for an active or scheduled lead-planner absence, including redirecting categories the lead previously chose to receive personally. Before confirming the override, require a nonempty reason and show the affected request categories and new recipients or fallback routing. Apply the updated policy to new actionable requests; do not silently reassign existing tasks, duplicate requests, or retroactively change the handling of requests already routed. Make the current effective policy visible to authorized staff.

**Notifications and accountability:** Notify the lead planner of the override and its reason, changes, and actor, subject to access and confidentiality safeguards. Record the prior policy, new policy, reason, actor, timestamp, and wedding in the audit history. An authorized manager can subsequently revise or end the override with an appropriate recorded reason. The lead may see the effective settings and request reconsideration; conflict resolution between subsequent authorized edits is a separate product question.

**Permissions and safeguards:** Only organization managers authorized to manage the lead’s absence settings and access the affected wedding may override exceptions (DEC-051). Enforce the couple’s employee restrictions (DEC-005/006). An override changes request routing only: it does not grant new wedding access, approve requests outside the recipient’s authority, change task ownership, or appoint another lead (DEC-047/049/050). If no eligible fallback manager exists, preserve requests in the restricted review queue and surface the established warning rather than exposing them to unauthorized people.

**Scope and follow-up:** The required reason is an accountability safeguard, not a requirement to activate a separate emergency mode. Further design may define precedence when the lead and manager edit the same absence settings concurrently or sequentially.

### DEC-053 — Manager override takes precedence until an authorized manager releases it

**Status:** Approved  
**Decision:** Option B — An active manager override of lead-planner absence-routing preferences remains effective until an authorized organization manager explicitly releases it.

**Expected product behavior:** The lead planner may continue editing their underlying personal absence-routing preferences while an override is active, but those edits do not displace the effective manager-controlled routing for the overridden categories. Display both the lead's saved preferences and the effective routing policy, with a clear indication that a manager override is active, who set it, and the recorded reason. Explain to the lead that their edits will not take effect for overridden categories until the override is released. Changes to categories not covered by the override follow the normal authorized editing rules.

**Releasing and changing overrides:** An authorized manager can explicitly release or revise an override in accordance with DEC-052's permission, reason, notification, and audit safeguards. On release, the latest saved lead preferences become effective for subsequent requests, provided the absence remains active and the routing recipients are still eligible. If the absence has ended, ordinary routing applies. Never retroactively reroute requests already delivered or change existing task ownership. The lead is notified when a manager releases or revises the override.

**Permissions and safeguards:** The lead may view the override and its reason, edit their underlying preferences, and request review, but cannot silently cancel an active manager override. Restrict override controls to authorized managers with appropriate wedding access; do not expand recipient permissions or bypass the couple's staff restrictions. Preserve the history of lead edits, manager changes, and release events.

**Scope and follow-up:** This establishes precedence and explicit manager release during the absence, not a permanent lock on the lead's preferences. Under DEC-054, an override also ends automatically when its associated absence period ends; it does not carry forward into future absences.

### DEC-054 — Manager overrides automatically end with the associated absence

**Status:** Approved  
**Decision:** Option A — A manager override of lead-planner absence-routing preferences is scoped to a single absence period and automatically ends when that absence ends.

**Expected product behavior:** Associate each override with the specific absence period for which it was created. While that absence is active, the override takes precedence over the lead planner's preferences until an authorized manager explicitly releases it (DEC-053), or until the absence ends. At the configured end of the absence, close any remaining active overrides automatically and restore ordinary incoming-request routing. A future absence starts with the lead's then-current saved routing preferences, without inheriting expired manager overrides; a manager must create a new, reasoned override if needed.

**Transparency and history:** Display the effective routing and override expiration during the absence. Record automatic closure, effective end time, and the associated absence in the audit history, retaining the original manager's reason and actions. Clearly distinguish an automatically ended override from one manually released. Do not retroactively reroute previously received requests, reassign existing tasks, or change the wedding's designated lead.

**Edge cases and safeguards:** If an authorized manager shortens or cancels the absence, the associated override ends when that absence ends. If the absence is extended without ending, its override remains effective through the updated end time unless released earlier. All recipients remain subject to existing permissions and the couple's staff restrictions (DEC-005/006). An absence that has already ended cannot be used to revive an expired override by creating a later absence; new overrides require a new authorized action.

**Scope:** This decision resolves override lifetime across absences. It does not decide other employee availability features or the design of the platform's core planning modules.

### DEC-055 — Design planning timeline and tasks first

**Status:** Approved  
**Decision:** Option A — Prioritize the **planning timeline and tasks** module as the first core wedding-planning module to define in detail, ahead of budget and payments, vendors, and guests and RSVP.

**Expected product-design approach:** Define the couple- and planner-facing planning journey, including timeline phases and milestones, task creation and customization, deadlines, responsibilities, dependencies, progress, reminders, and links to other wedding modules. Account for both a couple planning independently and a professional team coordinating several weddings, without changing previously approved task assignment and permission rules (DEC-039–044).

**Scope and safeguards:** This is a **design-order decision**, not an approval of every proposed feature or a commitment to include the module in the MVP. Budget and payments, vendors, and guests and RSVP remain proposed modules awaiting detailed design and prioritization. Resolve the module's core structure and workflows through subsequent decisions before treating specific behavior as approved.

### DEC-056 — Let users choose how to start the wedding planning timeline

**Status:** Approved  
**Decision:** Option D — When starting a wedding planning timeline, offer a choice between a **ready-made planning template**, a **guided setup**, and a **blank timeline**.

**Expected product behavior:** Present three clearly explained starting methods to an authorized user setting up the wedding plan. A ready-made template offers a suggested structure of phases, milestones, and tasks for review and customization; guided setup asks relevant wedding-planning questions and proposes a tailored timeline for review; a blank timeline starts without generated phases, milestones, or tasks. Users explicitly select a method rather than having one silently imposed. The resulting plan remains editable under existing permissions, regardless of the starting method.

**Couple and professional workflows:** Make these starting methods available to both couples planning independently and authorized professional planners creating or managing wedding plans. Do not replace existing ownership, visibility, or task-assignment rules. Do not generate or assign responsibilities to colleagues without respecting the approved permission model.

**Boundaries and follow-up:** This approves the choice of starting methods, not the contents of templates, the guided questionnaire, generation rules, the ability to switch methods after planning begins, or a commitment to include all three in the MVP. Define those behaviors in subsequent decisions. Avoid duplicate tasks or loss of existing planning work when the user revisits setup.

### DEC-057 — Template library with contextual recommendations

**Status:** Approved  
**Decision:** Option C — Provide a **library of multiple ready-made wedding planning timeline templates**, with contextual recommendations based on wedding details already available, and let users **preview each template before applying it**.

**Expected product behavior:** When a user chooses the ready-made template starting method (DEC-056), present a browsable library of planning templates for different wedding styles and planning needs. Recommend relevant templates using known wedding details where available, without assuming missing details or requiring users to complete the guided setup. Explain recommendations in understandable terms. Each template preview should show its proposed phases, milestones, and representative tasks so users can compare options before explicitly choosing one.

**Control and customization:** Recommendations are suggestions, not mandatory selections or automatic applications. Users can choose any available template, including one that is not recommended. After application, authorized users can edit, add, remove, and reschedule generated planning items in line with existing access and task-assignment rules. A template must not silently create colleague assignments or overwrite existing work.

**Boundaries and follow-up:** The exact template categories, recommendation inputs and ranking, preview detail, template content, and treatment of already populated timelines remain open. This decision does **not** approve user-created or organization-saved reusable templates, nor establish MVP inclusion for the template library.

### DEC-058 — Core planning templates with optional wedding characteristics

**Status:** Approved  
**Decision:** Option C — Structure the initial wedding planning template library around a **small set of foundational planning templates** that can be tailored using **optional wedding characteristics**, rather than maintaining a separate complete template for every wedding style or tradition.

**Expected product behavior:** Users browsing the ready-made template library (DEC-057) choose a foundational planning template and may optionally select characteristics relevant to their celebration, such as a destination wedding, a multi-day celebration, a religious ceremony, or DIY planning. These characteristics adjust the **suggested** phases, milestones, and tasks before application. Multiple characteristics can be combined; no single characteristic is presumed to define the whole wedding. Show the resulting tailored plan in a preview and require explicit application, as established by DEC-057.

**User choice and editing:** Characteristics are optional, can be skipped, and should be presented neutrally without presuming culture, religion, budget, or family structure. Users can review and customize suggested items before applying the timeline, and authorized users can subsequently edit the resulting plan. Preserve existing wedding data, permissions, and task-assignment safeguards; characteristics do not independently grant access or automatically assign work to colleagues.

**Boundaries and follow-up:** The available characteristic catalog, how characteristics combine or resolve conflicting suggestions, and any subsequent changes to an already populated plan remain to be specified. The example characteristics are illustrative, not a finalized exhaustive list. This decision does not approve an extensive standalone template catalog, reusable organization-created templates, or MVP inclusion by itself.

### DEC-059 — Foundational templates organized by planning complexity

**Status:** Approved  
**Decision:** Option B — Offer **Simple**, **Standard**, and **Comprehensive** as the foundational wedding planning templates, distinguished by the **level of planning detail and structure**, rather than by wedding size, cultural tradition, or who manages the wedding.

**Expected product behavior:** In the ready-made template library established by DEC-057 and DEC-058, explain the scope of each foundation in plain language. **Simple** provides a streamlined set of essential planning phases, milestones, and tasks; **Standard** offers broader coverage and more detailed checkpoints; **Comprehensive** provides granular planning activities and coordination checkpoints for users seeking deeper structure. These are alternative starting depths, not quality rankings or restrictions on the eventual wedding. Users may preview each foundation and its suggested content before applying it.

**Characteristics and customization:** Optional, combinable wedding characteristics (DEC-058) tailor whichever complexity level is selected. Guest count, wedding traditions, location, and planner involvement must not automatically dictate complexity. Users may choose any level, edit the resulting timeline, and add or remove detail later, subject to existing permissions. Applying a template requires explicit confirmation and must not silently overwrite existing work or assign colleagues.

**Boundaries and follow-up:** The exact tasks and milestones in each level, whether the system should recommend a complexity level, and how users can change complexity after applying a template remain open. This decision selects the **foundational template taxonomy**, not the MVP scope or a fixed quantity of tasks per level.

### DEC-060 — Guided changes to an existing timeline's planning complexity

**Status:** Approved  
**Decision:** Option C — Allow authorized users to change an existing wedding timeline between **Simple**, **Standard**, and **Comprehensive** using a **guided preview and explicit approval** rather than silently modifying the plan.

**Expected product behavior:** When changing complexity after a template has been applied, compare the proposed target-level planning structure with the wedding's current timeline. Present a clear, itemized preview of suggested additions, items to retain unchanged, and any items proposed for removal or consolidation. Distinguish template-origin suggestions from user-created or subsequently edited work, and explain the likely impact on phases, milestones, tasks, dates, and dependencies. No proposed change takes effect until an authorized user explicitly confirms it.

**Protection of existing work:** Preserve completed tasks, user-created items, notes, assignments, deadlines, dependencies, and recorded progress unless an authorized user separately and knowingly approves a specific affected change. Never silently delete, reset, reassign, or overwrite planning information. Where removing or consolidating an item would affect other tasks or records, disclose the relationship and require resolution or explicit confirmation before applying the change. If the user cancels, leave the current timeline untouched.

**Permissions and consistency:** Apply existing wedding access, planner-team permissions, and task-assignment rules to the preview and its application. Complexity changes do not grant new access, authorize reassignment, or override existing approvals. The resulting changes should be reviewable in the wedding's activity history, with enough context to understand what was applied.

**Boundaries and follow-up:** Individual proposed changes can be selected independently as established by DEC-061; exact handling of completed or heavily customized template items and specific conflict-resolution choices may require further decisions. This does not finalize MVP inclusion or imply automatic retroactive updates when the template library itself changes.

### DEC-061 — Individual selection of proposed timeline complexity changes

**Status:** Approved  
**Decision:** Option C — During a guided change between **Simple**, **Standard**, and **Comprehensive**, authorized users can **individually accept or reject** proposed additions, modifications, consolidations, and removals, with convenient bulk-selection controls and clear handling of dependencies and conflicts.

**Expected product behavior:** Present a reviewable change set before applying a new planning complexity. Each proposed change identifies its affected phase, milestone, or task; whether it is an addition, modification, consolidation, or removal; and its expected consequences. Users can include or exclude proposals individually, with select-all and group-level bulk actions for convenience. Bulk actions remain reversible within the preview. A summary shows the selected changes and what will remain unchanged. The new complexity selection is not permission to apply every recommendation automatically.

**Dependencies and conflict handling:** Identify dependencies between proposals and existing planning items, such as a proposed removal that would leave a dependent task without its prerequisite, or a consolidation affecting assignments or dates. Clearly explain any conflicts caused by a partial selection. Do not apply an inconsistent change set silently: require the user to resolve blocking conflicts or adjust their selection before confirmation. Preserve completed tasks, custom content, progress, dates, assignments, and existing access controls in accordance with DEC-060; changes to protected work require specific informed authorization and must not bypass task-assignment permissions.

**Confirmation, cancellation, and traceability:** Apply only the explicitly selected, valid changes after final confirmation by an authorized user. Rejecting a proposal leaves the corresponding current item untouched. Cancelling the review applies nothing. Record applied changes in activity history with their initiator and context; rejected suggestions are not treated as completed actions. The interface should remain usable for both short and extensive change sets.

**Boundaries and follow-up:** This establishes **granular review and selection**, not automatic removal or forced template conformity. The selected target complexity and customization indicator are governed by DEC-062; the exact criteria for showing or clearing the indicator and further recommendation behavior remain open for subsequent decisions. MVP scope is not determined here.

### DEC-062 — Selected planning complexity with a customization indicator

**Status:** Approved  
**Decision:** Option B — When a couple or authorized planner applies only a subset of proposed changes while moving between **Simple**, **Standard**, and **Comprehensive**, display the **selected target complexity with a customization indicator** (for example, **Comprehensive — Customized**). The selected level describes the intended depth for future recommendations, not strict conformity to every template item.

**Expected product behavior:** Following the individual change-selection and confirmation workflow in DEC-060 and DEC-061, record the chosen target level even when the user declines some proposed additions, modifications, consolidations, or removals. Display the target level and an understandable **Customized** indicator wherever the timeline's planning complexity is shown. The interface should make it clear that a customized timeline may differ from the foundational template and should never imply that rejected suggestions are required or that the plan is incomplete merely because it differs from the template.

**Future recommendations:** Use the selected complexity level, together with the wedding's applicable optional planning characteristics (DEC-058), as the baseline for subsequent suggested tasks and milestones. Respect previous choices and current wedding data: do not automatically re-add rejected tasks, revert custom edits, or silently modify the existing timeline. Any later proposed changes remain subject to the guided preview, granular selection, dependency checks, and explicit confirmation required by DEC-060 and DEC-061.

**Permissions, safeguards, and history:** Only authorized users may confirm a complexity change. Updating the displayed level does not change task ownership, permissions, deadlines, completion states, or existing planning records by itself. Record the selected level and applied changes in activity history; preserve the provenance of template-based and customized items so that subsequent comparisons remain understandable.

**Boundaries and follow-up:** The criteria for acquiring or clearing the **Customized** indicator, including edits independent of complexity changes, are specified by DEC-063. This decision does not define MVP scope or make every template suggestion mandatory.

### DEC-063 — Customized indicator for structural timeline changes

**Status:** Approved  
**Decision:** Option B — Display the **Customized** indicator when the planning timeline diverges structurally from the selected foundational template, including adding or removing phases, milestones, or tasks, or substantially restructuring their organization. Routine planning activity does not trigger the indicator.

**Expected product behavior:** Compare the timeline's planning structure with the applicable baseline for its selected **Simple**, **Standard**, or **Comprehensive** level and optional wedding characteristics (DEC-058–DEC-059). Show **Simple — Customized**, **Standard — Customized**, or **Comprehensive — Customized** when a user adds or removes planning items, changes the phase or milestone hierarchy substantially, or selectively applies a complexity change that leaves a structural difference (DEC-060–DEC-062). The label is descriptive, not a warning or a measure of planning quality or completion.

**Changes that do not trigger customization by themselves:** Completing or reopening tasks, adding notes or comments, changing assignees or statuses, and routine deadline/date adjustments do not constitute structural customization. These changes remain recorded and protected under the applicable task, permission, and history rules.

**Clearing the indicator:** Reassess the indicator when the timeline's structure changes or the selected complexity/characteristics are updated. Remove **Customized** if the effective structure once again matches the applicable baseline; do not erase activity history or overwrite existing task progress to achieve a match. The exact comparison criteria for equivalent structures, especially when characteristics generate conditional items, will be refined during detailed template behavior design.

**Permissions and safeguards:** Displaying or clearing the indicator never grants permissions, deletes data, modifies assignments, or automatically applies suggestions. All proposed template-driven structural changes still require the guided preview and explicit selection/confirmation established by DEC-060 and DEC-061. Keep the underlying source and history of planning items traceable.

**Boundaries and follow-up:** This decision defines when the customization label is meaningful, not which tasks must be present or which modules ship in MVP. Suggested task dates and dependencies are governed by DEC-064.

### DEC-064 — Smart suggested task and milestone dates with dependencies

**Status:** Approved  
**Decision:** Option C — Generate suggested planning dates using the wedding date, relationships between planning items, and applicable wedding characteristics. Account for compressed planning windows, while allowing authorized users to adjust dates and dependencies.

**Expected product behavior:** When a user applies a planning template or completes guided setup (DEC-056–DEC-059), propose dates for relevant phases, milestones, and tasks based on the known wedding date, relative planning windows, prerequisites, and optional characteristics such as destination or multi-day celebrations. Distinguish an actual committed deadline from a platform suggestion. Explain important scheduling assumptions and why a date is recommended. Suggestions are editable and are not binding commitments.

**Dependencies and scheduling:** Support meaningful prerequisite relationships, such as confirming invitation details before sending invitations. Identify blocked or conflicting sequences, impossible deadlines, and circular dependencies rather than silently imposing them. Changing an upstream date or the wedding date may generate a preview of proposed downstream date adjustments, but must not silently change confirmed deadlines, completed work, assigned responsibilities, or external commitments. Dependencies must respect existing permission rules and must not implicitly create new tasks or assignments without approval.

**Short planning windows:** If a wedding is scheduled sooner than standard lead times, adapt suggestions to the remaining time, prioritize time-sensitive steps, and visibly flag recommendations that may already be overdue or impractical. Do not suggest past dates as actionable future deadlines without an explanation. Offer achievable alternatives where possible, without claiming that vendors or external parties are available.

**Permissions, transparency, and safeguards:** Only authorized users can approve and apply schedule changes. Keep manually set dates and approved deadlines distinct from automatically calculated suggestions. Show the effect of proposed changes on dependent items, warn about conflicts, and retain relevant change history. Respect the selective approval and protection of existing work established by DEC-060 and DEC-061.

**Boundaries and follow-up:** This decision establishes dependency-aware suggestions, not mandatory automated rescheduling or the exact scheduling algorithm. Changes to the wedding date after planning has begun follow the guided rescheduling process in DEC-065.

### DEC-065 — Guided rescheduling when the wedding date changes

**Status:** Approved  
**Decision:** Option C — When the wedding date changes after planning has begun, generate a guided rescheduling proposal with individually reviewable changes rather than automatically shifting all existing dates or leaving users to rebuild the schedule manually.

**Expected product behavior:** After an authorized user proposes a new wedding date, assess affected phases, milestones, and tasks using the new date, relative planning windows, and dependencies established in DEC-064. Present a clear before-and-after preview of suggested deadline adjustments, unchanged dates, and conflicts. Users can accept or reject individual proposed changes, with bulk-selection conveniences consistent with DEC-061. Applying the new wedding date must be clearly distinguished from approving changes to individual planning items; declining a suggested adjustment does not silently block the wedding-date update unless a genuine validation or permission constraint applies.

**Flexible versus fixed commitments:** Distinguish template-derived flexible dates from manually confirmed dates, completed milestones, contracted vendor appointments, payment obligations, and other external commitments. Never automatically alter or imply renegotiation of contractual dates, confirmed bookings, payments, or completed work. Flag commitments that may now conflict with the wedding date and prompt the responsible users to verify or renegotiate them outside the platform where necessary. Any later edits to such records must follow their own module-specific permissions and workflows.

**Dependencies and partial approval:** Recalculate suggested downstream dates where relevant, explain which dependencies are affected, and warn if selectively approved changes create impossible sequences, blocked tasks, or scheduling conflicts. Preserve original values for rejected changes and clearly mark unresolved conflicts for follow-up. Do not silently reassign tasks, change ownership, reopen completed work, or create new commitments.

**Permissions, confirmation, and audit:** Only users authorized to change the wedding date can do so; proposed changes to other planning items require the permissions applicable to those items. Provide an explicit final confirmation identifying the new wedding date and the exact schedule changes being applied. Notify relevant collaborators of material changes in line with their access rights, and retain an auditable history of the previous wedding date, accepted adjustments, and outstanding issues.

**Boundaries and follow-up:** This decision establishes the rescheduling review and protection rules, not an automatic vendor rebooking service or the detailed scheduling algorithm. The organization and priority of large review proposals are defined in DEC-066.

### DEC-066 — Impact-based review of large wedding-date rescheduling proposals

**Status:** Approved  
**Decision:** Option C — Organize proposed date changes by their potential impact and need for attention first, then group remaining changes by planning phase or category, with individual and bulk review controls.

**Expected product behavior:** When a wedding-date change produces many suggested adjustments, begin the review with a concise impact summary showing counts of proposed changes, high-attention conflicts, protected external commitments, and routine adjustments. Surface items requiring human attention first: impossible or blocked dependency sequences, deadlines already passed or newly infeasible, confirmed vendor-related commitments, contractual or payment dates, and other changes with material coordination implications. The review must clearly distinguish a **suggested change** from a **warning or commitment that cannot be changed automatically**.

**Grouping and navigation:** After the attention-required section, organize remaining proposed changes into scannable groups by wedding planning phase or category, with useful filters (such as affected module, change type, urgency, and approval state) and the ability to inspect the original and proposed dates. Users should be able to navigate directly to affected items without losing their current review selections. Grouping and priority order help users review; they do not change underlying task priorities or permissions.

**Selection and safeguards:** Preserve DEC-065's individual accept/reject control and provide convenient bulk actions for eligible routine changes, with clear selected counts and a final before-and-after summary. Do not include protected contractual commitments or unresolved conflicts in an indiscriminate 'approve all' action. When a selected adjustment depends on a rejected or unchanged item, show the dependency conflict and require the user to resolve it or explicitly leave it as an outstanding issue where allowed. No proposed change is applied before explicit confirmation.

**Permissions and audit:** Display only records the reviewer is authorized to see. Approval of each change requires the relevant item's permission; an authorized wedding-date editor does not automatically gain authority over every supplier, payment, or team record. Log accepted and rejected proposals where appropriate, applied changes, and outstanding issues, and notify affected collaborators according to existing permissions.

**Boundaries and follow-up:** This decision determines the presentation and review order for large rescheduling proposals; it does not authorize automated renegotiation, rebooking, or changing contractual dates. The next decision addresses how unresolved conflicts should be handled when users confirm a partial rescheduling proposal.

### DEC-067 — Confirm partial rescheduling with tracked unresolved conflicts

**Status:** Approved  
**Decision:** Option C — Allow users to confirm authorized, selected wedding-date rescheduling changes while non-blocking conflicts remain open as tracked follow-up issues. Changes affected by genuinely blocking conflicts cannot be applied until those conflicts are resolved.

**Expected product behavior:** During the impact-based review established by DEC-066, classify outstanding issues as **blocking** or **non-blocking**, with an understandable explanation and references to affected tasks, milestones, dependencies, vendor commitments, or payment dates. Users can approve and apply the valid subset of proposed changes without waiting for every supplier response or planning decision. A non-blocking issue must not silently disappear when the review closes; it remains visible in the wedding planning workflow with an open status, affected records, the relevant original/proposed dates, and a suggested next action. Users may return to review and resolve it later.

**Blocking conditions and safe partial application:** An issue is blocking for a proposed change when applying that change would violate an enforced permission or invariant, directly contradict a protected confirmed/contractual commitment, or leave a dependency or scheduling state that the platform cannot safely apply. Clearly identify which *specific proposed changes* are blocked and why; do not automatically block unrelated valid adjustments. Warnings, pending supplier confirmation, and coordination work that do not make the selected change unsafe can remain non-blocking. Never treat a warning acknowledgement as permission to alter a supplier contract or payment obligation.

**Follow-up tracking:** For each outstanding non-blocking issue, show an actionable status (for example, Open, In progress, Resolved), affected items, context, and suggested next step, with a route back to the relevant planning record. Avoid creating duplicate issues for the same underlying conflict. Users with appropriate permissions can update or resolve issues; the system must not mark them resolved merely because other proposed changes were approved. Issue ownership and initial assignment follow DEC-068; notification cadence, escalation, and whether separate tasks are automatically created remain open for future decisions.

**Confirmation, permissions, and audit:** Before applying the selected subset, display the accepted changes, excluded or rejected proposals, blocked changes, and unresolved follow-ups. Require explicit confirmation, apply only changes the acting user is authorized to make, and preserve existing protections for completed work and external commitments. Record what was applied, what remained unresolved, and subsequent issue resolution in an auditable history. Notify relevant collaborators only within their access rights.

**Boundaries and follow-up:** This decision refines DEC-065 and DEC-066; it does not approve automatic supplier rebooking, changes to contractual deadlines, automatic assignment of follow-up tasks, or unrestricted overrides of blocking rules. The next decision defines how unresolved follow-up issues should be owned.

### DEC-068 — Automatically assign unresolved rescheduling issues based on existing responsibilities

**Status:** Approved  
**Decision:** Option B — Automatically assign each unresolved rescheduling follow-up issue to the person already responsible for its affected task, vendor, or milestone. If there is no suitable existing responsible person, route the issue to the wedding's designated lead planner where eligible, or to an eligible couple member as the fallback.

**Expected product behavior:** When DEC-067 creates or retains an unresolved scheduling follow-up issue, identify the most directly responsible authorized person using existing task ownership, vendor responsibility, or milestone ownership. Set that person as the issue owner without requiring a separate approval step, show the assignment and reason in the issue details, and notify the assigned person. Assignment does not itself approve a proposed date change, change the affected record's owner, or create a separate planning task.

**Multiple responsibilities and fallback:** Prefer the owner of the directly affected record. If multiple records or people are implicated and there is no unambiguous responsible person, route to the designated lead planner if one exists and has suitable access; otherwise route to an eligible couple member using a consistent, visible fallback rule. If there is no eligible recipient, leave the issue visibly unassigned and surface it to authorized wedding administrators for manual assignment rather than assigning it to someone without access. An absent lead's actionable issue routing must respect DEC-049 through DEC-054, including active absence exceptions and manager overrides, without changing the lead designation.

**Permissions and safeguards:** Assign only to a person with the access needed to view and act on the issue; do not expose private planner business records, financial details, or supplier information to unauthorized recipients. If responsibility or access changes, flag the issue for reassessment and follow existing assignment permissions; avoid silently creating unauthorized access. The assigned owner can coordinate resolution but cannot override protected supplier bookings, contractual obligations, or other blocking conditions without the relevant authorization.

**Visibility, notifications, and audit:** Show issue owner, status, related records, recommended next action, and the basis of automatic assignment. Notify the owner and record automatic assignments, subsequent reassignment, and resolution in the audit history. Avoid duplicate assignments or repeated notifications when an unchanged issue is revisited.

**Boundaries and follow-up:** This decision establishes automatic ownership of unresolved rescheduling *issues*, not automatic creation or assignment of new tasks, supplier communications, or approvals. Reassignment authority and safeguards are specified in DEC-069.

### DEC-069 — Permission-based reassignment of unresolved scheduling issues

**Status:** Approved  
**Decision:** Option C — Permission-based reassignment. Authorized organization managers and designated wedding coordinators may reassign unresolved scheduling follow-up issues within their granted scope. Other employees may reassign only when they have been explicitly granted delegation or reassignment permissions. Every recipient must have appropriate access to the issue and its related information.

**Expected product behavior:** An authorized user can open an unresolved issue, select an eligible new owner, review the issue and recipient, and confirm the transfer. Show the new owner on the issue and notify them; retain the issue's status, affected records, next steps, and history. Reassignment does not automatically alter the ownership of related tasks, vendor records, or milestones and does not imply that the recipient accepted or resolved the issue.

**Permission boundaries:** Apply the existing wedding, planner organization, and delegated employee permissions from DEC-005 through DEC-007 and DEC-041. A lead planner or designated coordinator can reassign only within their authorized scope; the title alone does not grant unrestricted organization-wide reassignment powers. The assigned issue owner cannot transfer an issue solely by virtue of owning it unless they also hold the relevant reassignment permission. Couples and wedding administrators retain only the reassignment authority already granted by their wedding roles; organization permissions must not override couple control of shared wedding access.

**Eligibility and safeguards:** Offer only recipients who currently have the necessary wedding access and permission to view the issue's underlying information, including any protected supplier or financial details. Do not grant new access through reassignment, expose private planner business data, or bypass manager absence-routing overrides (DEC-049 through DEC-054). If no eligible recipient exists, keep the issue assigned or visibly unassigned as appropriate and surface the need for authorized intervention. An issue's reassignment must not authorize contractual changes, supplier rebooking, or blocked date changes.

**Notifications and audit:** Notify the previous and new owners of a successful reassignment, avoiding disclosure to unauthorized recipients. Record who reassigned the issue, when, from whom to whom, and the affected issue; preserve prior ownership history. If the intended recipient loses access before confirmation, reject the transfer and explain why. Follow existing notification preferences and prevent redundant alerts for unchanged assignments.

**Boundaries and follow-up:** This decision governs reassignment of unresolved scheduling *issues*, not task reassignment or mandatory acceptance by the new owner. A future decision should specify how overdue unresolved issues are escalated and surfaced before wedding-critical deadlines.

### DEC-070 — Risk-based escalation of unresolved scheduling issues

**Status:** Approved  
**Decision:** Option C — Risk-based escalation. The platform evaluates unresolved scheduling follow-up issues using deadline proximity, wedding-date proximity, severity and potential impact, blocked dependent work, and meaningful inactivity. It reminds the assigned owner first where practical, then escalates significant unresolved risks to an authorized organization manager or eligible wedding administrator. Escalation urgency must reflect risk rather than inactivity alone.

**Expected product behavior:** Continuously re-evaluate an open issue when its deadline, dependency status, severity, ownership, or wedding date changes. Show a clear risk level and why it was assigned (for example, a payment commitment approaching, a vendor availability uncertainty, or multiple blocked tasks). Surface urgent issues prominently in the relevant wedding and planner action centers. Notify the current owner of actionable concerns and expected next steps; escalate when the issue becomes sufficiently urgent, remains stalled, or is otherwise at risk of affecting the wedding. High-risk, time-critical issues may require immediate escalation without waiting for a routine reminder cycle.

**Escalation routing:** Preserve issue ownership under DEC-068 and reassignment authority under DEC-069; escalation adds visibility and requests intervention rather than silently transferring ownership. Route to an authorized manager in a planner organization when available, or an eligible wedding administrator where appropriate. Respect lead planner absence settings and active manager overrides (DEC-049 through DEC-054). Where no eligible escalation recipient exists, retain a visible critical issue and identify that authorized attention is needed rather than exposing it to an unauthorized person.

**Safeguards and notifications:** Only recipients permitted to view the underlying issue and any protected supplier, financial, or contractual information may receive its details. Avoid repeated notifications for unchanged risk, but issue a new alert on meaningful risk escalation or an imminent deadline. Escalation never authorizes supplier rebooking, changes to contractual payment deadlines, or application of a blocked rescheduling proposal. Users must be able to see the reason for escalation and the outstanding action; record reminders, escalation, acknowledgement, ownership changes, and resolution in issue history.

**Boundaries and follow-up:** This establishes risk-aware escalation behavior, not exact risk scores, time thresholds, delivery channels, or organization-wide configuration. Those details remain open for later decisions. DEC-071 defines how authorized recipients acknowledge and act on escalated issues.

### DEC-071 — Acknowledge escalations and choose an action

**Status:** Approved  
**Decision:** Option C — Acknowledge and choose an action. When a risk-escalated scheduling issue reaches an authorized manager or eligible wedding administrator, the recipient may acknowledge it and select an appropriate response: retain the current owner, reassign the issue, take ownership personally, or record a follow-up action. Acknowledgement does not resolve the underlying issue or automatically transfer responsibility.

**Expected product behavior:** Present the escalation reason, risk level, deadlines, affected dependencies, current owner, and relevant history to an authorized recipient. Allow the recipient to acknowledge receipt independently of the issue's open/resolved state. Offer contextual actions: (1) keep the current owner and continue monitoring; (2) reassign to an eligible collaborator; (3) take ownership if eligible; or (4) record a concrete next step or follow-up note without changing ownership. A manager can acknowledge immediately and return later to act; the escalation and issue remain visible until their separate resolution conditions are met. Show who acknowledged, the chosen action (if any), and whether further intervention is needed.

**Ownership, permissions, and safeguards:** Reassignment and taking ownership use the authorization and recipient-eligibility rules of DEC-068 and DEC-069. Acknowledging an escalation alone never grants authority to edit supplier contracts, payment commitments, protected information, or blocked schedule changes. Keep the underlying issue open until its actual resolution is confirmed; do not imply that a reminder or acknowledgement is a completed task. If a selected action cannot be completed because of lost access, conflicting changes, or missing permissions, preserve the current owner and issue state and explain the failure.

**Notifications and audit:** Notify the current and new owners when responsibility actually changes, and avoid unnecessary duplicate notifications for a simple acknowledgement. Record escalation receipt, acknowledger, timestamp, selected action, ownership changes, follow-up notes, and eventual resolution in the issue history. Respect existing notification, organization, wedding access, and lead-planner absence-routing rules. Reassess risk and further escalation as appropriate while the issue remains open; acknowledgement by itself does not permanently suppress critical alerts.

**Boundaries and follow-up:** This decision establishes flexible escalation response, not a mandatory resolution plan or automatic manager takeover. DEC-072 establishes that acknowledgement does not change the normal reminder or escalation schedule.

### DEC-072 — Continue normal escalation reminders after acknowledgement

**Status:** Approved  
**Decision:** Option A — Continue normal reminders. Acknowledging an escalated scheduling issue does not pause, reset, delay, or otherwise alter its existing risk-based reminder and escalation schedule. While the issue remains unresolved, the platform continues notifying the assigned owner and escalating to authorized recipients under DEC-070, including recipients who previously acknowledged the escalation.

**Expected product behavior:** Preserve the issue's current risk classification, due dates, inactivity tracking, and next reminder or escalation times when an authorized manager or wedding administrator acknowledges an alert. Continue normal reminders and escalation checks until the issue is resolved, its risk or deadlines legitimately change, or a separate authorized workflow changes the underlying issue. Acknowledgement is recorded as receipt, not evidence of substantive progress or a resolution. Where an acknowledged issue worsens, follow the normal risk-based escalation rules, including immediate alerts for critical developments.

**Ownership and permissions:** Keep ownership unchanged unless an authorized person separately chooses to reassign or take ownership under DEC-071 and DEC-069. Route subsequent reminders only to eligible recipients with access to the relevant issue details, respecting organization permissions and active absence routing. Acknowledgement does not grant access, waive deadlines, or authorize contractual or scheduling changes.

**Notification and audit safeguards:** Maintain the established notification cadence without introducing an additional reminder solely because of acknowledgement; prevent duplicate delivery of the same scheduled alert. Preserve an audit trail of acknowledgements, reminders, escalation actions, ownership changes, and resolution. Clearly distinguish an acknowledged escalation from a resolved issue in the interface. Any future snooze or notification preference feature must not implicitly change this approved behavior without a new decision.

**Boundaries and follow-up:** This decision confirms that acknowledgement has no effect on normal reminder timing. Exact reminder intervals, channels, and thresholds remain open for later product decisions.

### DEC-073 — Adaptive reminder frequency based on risk

**Status:** Approved  
**Decision:** Option C — Adaptive reminders based on risk. The platform dynamically determines reminder frequency for unresolved scheduling issues using issue urgency, deadline proximity, wedding proximity, severity, dependencies, and inactivity rather than applying one fixed interval to every issue.

**Expected product behavior:** Assess an open issue when it is created and reassess it when meaningful inputs change, including deadline updates, new blockers, a change in wedding date, elapsed inactivity, and substantive progress. Increase reminder frequency as risk rises and use less intrusive intervals for low-risk issues. Where a deadline or critical dependency requires immediate attention, deliver an appropriately urgent alert without waiting for the next routine reminder. Explain the urgency and relevant next action in the issue view. Keep the risk model's suggested cadence separate from any contractual obligation or externally agreed due date; reminders do not modify those dates.

**Consistency with DEC-070–072:** Continue the normal adaptive reminder and escalation schedule after an escalation is acknowledged (DEC-072). Acknowledgement alone is not substantive progress and must not pause, reset, or reduce reminders. An authorized reassignment or follow-up action can affect future recipient routing or risk only to the extent that the underlying issue actually changes. Escalation remains risk-based, preserves ownership unless separately changed, and reaches only authorized recipients.

**Notification safeguards:** Avoid duplicate delivery of the same reminder event, including when several risk factors change together. Keep a clear record of reminder timing, recipients, risk changes, and escalation actions. Respect access controls, absence routing, and previously approved notification rules. Do not overwhelm recipients with multiple identical alerts, but do not suppress genuinely new critical developments. Users should be able to see why an issue is receiving more frequent reminders.

**Boundaries and follow-up:** This decision approves adaptive reminder frequency, not specific numeric intervals, delivery channels, quiet-hour policies, or user-configurable overrides. Those remain open for explicit product decisions. The system must not treat silence or acknowledgement as issue resolution.

### DEC-074 — Personalized quiet hours with critical exceptions

**Status:** Approved  
**Decision:** Option C — Personalized quiet hours with critical exceptions. Each user may configure their own quiet-hour window and timezone for routine scheduling-issue reminders and escalation notifications. Genuinely critical alerts may bypass quiet hours when timely attention is necessary.

**Expected product behavior:** Evaluate the recipient's effective local time before delivering a notification. Routine reminders that become due during that person's quiet hours are deferred to the next permitted delivery time, without changing the underlying issue's deadline, priority, escalation eligibility, or assignment. The issue remains visible in the application throughout quiet hours. A user can adjust or disable their quiet-hour preferences; changes affect future deliveries, including deferred reminders where still relevant. Quiet hours are personal rather than wedding-wide or organization-wide, so different recipients may receive the same eligible event at different times.

**Critical exception:** A genuinely critical, actionable development may be delivered immediately despite quiet hours, using the risk-based rules approved in DEC-070 and DEC-073. Critical status must be based on actual urgency, not merely the existence of an unacknowledged alert or a desire to send routine reminders sooner. Record when and why an exception was used. Critical exceptions must still respect channel availability, user access, privacy, and any applicable legal requirements; the exact classification thresholds and channels remain to be specified.

**Consistency with DEC-072 and DEC-073:** Acknowledgement does not pause or reset the normal reminder schedule (DEC-072). Quiet hours govern **delivery time**, not whether the reminder or escalation remains due. Adaptive risk assessment and escalation continue while delivery is deferred, and a newly critical issue can bypass the delay. Avoid sending obsolete or duplicate queued reminders: reassess issue status, recipient eligibility, and current risk before dispatch, and consolidate identical pending events without suppressing distinct critical developments.

**Permissions, visibility, and audit:** Apply each recipient's settings separately, including couples, planner staff, and authorized managers. Preserve absence-routing rules and access restrictions when deciding recipients. Display deferred-delivery state where useful, and record notification scheduling, deferral, critical bypass, delivery attempts, and outcomes without exposing protected issue details to unauthorized people.

**Boundaries and follow-up:** This decision does not set default quiet hours, default timezone detection, the definition of critical severity, or specific notification channels. These require separate product decisions. Do not confuse quiet-hour deferral with snoozing or resolving an issue.

### DEC-075 — Suggested quiet-hour defaults during onboarding

**Status:** Approved  
**Decision:** Option C — Suggested defaults during onboarding. During initial account setup, offer a suggested quiet-hours window of **22:00–08:00 in the user's effective timezone**. Users can accept the suggestion, customize it, or disable quiet hours. Until they make an explicit choice, routine notification delivery uses that suggested window as a provisional default.

**Onboarding behavior:** Present the suggestion as an understandable, editable preference rather than a mandatory restriction or a silently finalized setting. Explain that routine reminders will be held during quiet hours, while genuinely critical actionable alerts can still be delivered immediately under DEC-074. Provide equally accessible options to accept, adjust, or disable the setting. A user who skips the step retains the provisional 22:00–08:00 window for routine delivery until they choose a preference later; clearly indicate this default in notification settings and permit changes at any time.

**Timezone and delivery safeguards:** Apply the window using the recipient's effective timezone, not the wedding venue's or the planner organization's timezone. If timezone information is unavailable or uncertain, obtain or confirm it before relying on a local-time calculation; do not assume the wedding location determines the user's timezone. Reevaluate queued routine reminders when preferences or timezone change and before delivery, avoiding stale or duplicate alerts. An account setup choice applies to the individual user across their eligible wedding and organization contexts unless later product decisions establish scoped preferences.

**Critical exceptions and consistency:** Quiet hours affect notification delivery timing only, not issue status, ownership, deadlines, risk scoring, or the escalation schedule. Critical bypass remains subject to DEC-074's genuine-urgency, permissions, privacy, and audit safeguards. Acknowledgement continues not to pause normal reminders (DEC-072), and adaptive reminder timing remains governed by DEC-073. Existing personal reminder-time settings for snoozed alerts (DEC-034–036) remain distinct from quiet-hour preferences; any overlap must be resolved without silently cancelling reminders.

**Audit and follow-up:** Record the user's explicit selection or changes and relevant notification deferrals or critical bypass events; distinguish provisional defaults from confirmed preferences. Specific timezone-detection UX, critical severity thresholds, channel choices, and detailed handling of simultaneous deferred notifications remain open for later decisions.

### DEC-076 — Smart grouped delivery after quiet hours

**Status:** Approved  
**Decision:** Option C — Smart grouped delivery. When a recipient's quiet hours end, the platform delivers important actionable reminders individually while consolidating lower-priority routine notifications into a clear summary. It reassesses and removes obsolete or duplicate reminders before dispatch.

**Expected product behavior:** At the end of the recipient's effective quiet-hour window, reevaluate each deferred notification against the latest issue state, priority, deadline, recipient permissions, assignment, absence routing, and any already-delivered notifications. Send distinct, time-sensitive actionable reminders individually when separate attention is warranted. Group lower-priority, still-relevant reminders into a digest organized meaningfully by wedding, issue priority, and/or affected workstream; preserve links to the underlying issues and their next actions. Clearly distinguish multiple issues from repeated events about the same issue. Do not discard unique actionable items merely because they are grouped.

**Priority and deduplication safeguards:** Grouping is a delivery presentation decision, not a change to underlying issue priority, escalation, ownership, or deadlines. Avoid multiple deliveries of identical pending reminder events and suppress reminders for issues already resolved, revoked, or no longer visible to the recipient. Do not collapse genuinely distinct critical developments into a routine digest. A critical event that qualified for immediate delivery during quiet hours remains subject to DEC-074's bypass rules and must not be unnecessarily sent again when quiet hours end.

**Interaction with existing decisions:** The risk-based reminder schedule continues under DEC-070, DEC-072, and DEC-073 even while notifications await delivery. Individual quiet-hour preferences and provisional onboarding defaults remain governed by DEC-074 and DEC-075. The digest must respect per-recipient permissions and separate wedding or organization contexts; never reveal restricted financial, supplier, or contractual details through a summary. If notification settings change before dispatch, use the currently effective delivery preferences.

**Visibility and audit:** The user can open the grouped summary to inspect each included issue, and important individually delivered reminders remain distinguishable. Record which notifications were deferred, grouped, delivered separately, deduplicated, or suppressed as obsolete, subject to reasonable privacy and retention limits.

**Boundaries and follow-up:** This decision does not yet set precise thresholds for individually delivered reminders, digest format or channel, or whether users can customize grouping behavior. Those are future product decisions. Do not imply that a grouped notification constitutes acknowledgement or resolution of its underlying issues.

### DEC-077 — Multichannel notifications with personal preferences

**Status:** Approved  
**Decision:** Option C — Multichannel notifications with personal preferences. The platform supports in-app notifications, email, and push notifications where available. Each user can choose preferred delivery channels by notification importance, with understandable defaults and safeguards for genuinely critical alerts.

**Expected product behavior:** Maintain an in-app notification center for eligible actionable events and summaries. Offer email and push delivery as supported channels, subject to user choice, verified contact information, device/browser capability, and notification permission. Present notification preferences by meaningful importance categories (for example routine, important, and critical), rather than requiring users to configure every individual event. Explain the practical effects of changing each preference and provide accessible settings to revise choices later. A user's channel preferences apply to their own eligible notifications across weddings and professional contexts unless a later decision explicitly establishes scoped preferences.

**Delivery after quiet hours:** Apply the grouping rule in DEC-076 to deferred notifications: important actionable reminders are delivered individually on the user's effective permitted channels, while lower-priority items are consolidated into a digest or summary suitable for the channel. Avoid sending identical digest content repeatedly across multiple channels without a clear user benefit; do not interpret a delivered email or push as an acknowledgement or resolution. Respect the user's timezone and quiet hours under DEC-074 and DEC-075. Critical bypass remains limited to genuinely urgent alerts and must not become a blanket override of privacy, consent, or delivery permissions.

**Defaults and critical safeguards:** Provide sensible initial channel selections, clearly disclosed during onboarding or notification setup; default selections are governed by DEC-078; critical-alert opt-out is governed by DEC-079. Critical-alert safeguards may include a prominent in-app alert and an eligible permitted external channel, but the product must not assume push permissions, verified email delivery, or universal device availability. If a selected channel is unavailable, indicate the delivery limitation and retain the issue in the authorized in-app view; never falsely mark a notification as received or acted upon.

**Privacy, permissions, and audit:** Enforce the recipient's current access rights and wedding/organization context in every channel, including email subject lines, push previews, and grouped summaries. Use minimal sensitive detail in external notifications and link to authenticated views for protected information. Recheck event relevance, issue ownership, permissions, and duplication before dispatch; honor unsubscribe and consent obligations where applicable. Record notification channel choices and significant delivery, failure, deferral, and critical-exception events within appropriate retention boundaries.

**Consistency and follow-up:** Risk-based frequency and continued reminders after acknowledgement remain governed by DEC-070–073. This decision does not require native mobile apps or specify an implementation mechanism for push notifications. Digest-channel preferences, delivery-failure fallback behavior, remain open for subsequent product decisions; critical-alert opt-out is governed by DEC-079.

### DEC-078 — Importance-based default notification channels

**Status:** Approved  
**Decision:** Option C — Importance-based defaults. For new users who have not customized their notification preferences, the platform delivers routine updates in-app, important reminders in-app and by email, and critical alerts in-app, by email, and via push wherever the user has granted permission and the device/application supports it. Users can subsequently customize their preferences in accordance with DEC-077.

**Default channel matrix:**

| Importance | In-app | Email | Push |
|---|---|---|---|
| Routine | Enabled | Not enabled by default | Not enabled by default |
| Important | Enabled | Enabled by default, subject to verified/usable email | Not enabled by default |
| Critical | Enabled | Enabled by default, subject to verified/usable email | Enabled by default **only where explicit device/browser permission exists** |

**Onboarding and consent:** Clearly explain these defaults when users set up notifications and make the preference controls accessible afterward. Never infer or silently grant push permission; the platform may request it through the supported user-consent flow. Email delivery must respect applicable verification, consent, and mandatory service/security-communication rules. Do not promise delivery on unavailable channels.

**Delivery behavior:** Apply personal quiet hours and the critical exception policy in DEC-074–075. For deferred routine updates, follow the grouping and deduplication behavior in DEC-076. Important reminders can use both in-app and email; a critical alert can use multiple eligible channels to reduce the risk of being missed, without sending redundant copies of the same event on one channel. Continue normal risk-based reminders after acknowledgement per DEC-072–073. Delivery is not proof of reading, acknowledgement, or resolution.

**Safeguards and failure handling:** Recheck issue relevance, recipient authorization, ownership, and notification importance before sending. Use minimal sensitive content in external messages, linking to authenticated views. If email or push is unavailable, record or surface the limitation appropriately and keep the issue visible in-app; never treat a failed channel as successful. Critical notifications do not override device permissions, privacy requirements, or a user's lawful communication choices. Critical-alert opt-out follows DEC-079; fallback delivery and channel failure escalation remain undecided.

**Consistency and scope:** These defaults govern new accounts until users make their own selections, and apply across authorized couple and professional contexts unless future scoped settings are approved. They do not alter existing access controls or mandate native mobile applications. Any changes to an existing user's saved channel preferences require an explicit separate decision or user action.

### DEC-079 — User control over external critical-alert channels

**Status:** Approved  
**Decision:** Option B — Full control with clear warnings. Users may disable email and push notifications for critical **wedding-planning** alerts after acknowledging a clear warning about the risk of missing urgent issues. Critical alerts must remain available in the authorized in-app notification center regardless of external-channel choices.

**Expected product behavior:** In notification settings, allow each user to independently enable or disable critical planning-alert delivery by email and by push, subject to channel availability and device permission. Before a user disables their last enabled external channel for critical planning alerts, explain that time-sensitive vendor confirmations, payment-related planning issues, or urgent scheduling conflicts may not be noticed until they return to the platform. Require an explicit acknowledgement of that warning before saving the change; do not use a prechecked acknowledgement or obscure the opt-out action. Changes take effect for subsequent notifications and are reversible at any time.

**In-app continuity and risk:** Keep critical issues prominently visible in-app for authorized recipients, including their current severity, ownership, and unresolved status. Continue risk evaluation, escalation, and the normal reminder schedule under DEC-070–073 even when external channels are disabled. An opt-out does not acknowledge, dismiss, resolve, or reassign an issue, and does not grant another recipient access to it. If all external channels are disabled or unavailable, avoid suggesting the platform can guarantee timely attention; the interface may indicate reduced alert reach.

**Privacy and permissions:** Respect the user's choice across their eligible wedding-planning contexts unless scoped preferences are separately approved. Do not send opted-out critical planning alerts by email or push as a workaround for urgency, including during quiet-hour bypass. Preserve recipient permissions and minimal external detail when an external channel remains enabled. Push still requires device/browser consent, and email still requires a usable, appropriately verified address.

**Essential communications boundary:** This opt-out governs wedding-planning alerts, not separately required account security, authentication, legal, or essential service communications; those must have their own justified rules and lawful basis. Do not label ordinary planning alerts as security messages to circumvent user choices.

**Audit and acceptance:** Record the change of preferences, the warning acknowledgement, and relevant delivery limitations with appropriate retention and privacy controls. Acceptance criteria: disabling both external channels leaves critical planning alerts visible in-app; no opted-out external alert is sent; escalation continues; re-enabling a channel affects future eligible notifications without silently replaying obsolete alerts.

**Follow-up:** DEC-080 defines persistent in-app critical warnings and escalation to other independently authorized recipients, without overriding any individual opt-out. The visibility and clearing conditions for those warnings remain subject to further product decisions.

### DEC-080 — Persistent critical warnings with authorized escalation when external channels are disabled

**Status:** Approved  
**Decision:** Option C — Persistent warning with authorized escalation. If a recipient has disabled email and push for critical wedding-planning alerts, or those channels are unavailable, the platform must keep relevant critical issues prominently visible in authorized in-app views and continue the existing risk-based escalation process. Other eligible, independently authorized recipients may receive notifications through their own enabled channels, without bypassing the original recipient's preferences.

**Expected product behavior:** Show an actionable, persistent critical-issue indicator in the affected user's notification center and relevant wedding, task, and planner dashboards, subject to permissions. Provide an accessible route to the issue's current status, responsible person, deadline or urgency, and next appropriate action. The indicator should remain visible while the issue is critical and unresolved; acknowledging a notification alone does not resolve the issue or suppress normal reminders (DEC-071–073). Do not promise that an opted-out user will see an in-app alert before returning to the platform.

**Authorized escalation:** Apply existing risk-based escalation and fallback rules (DEC-044, DEC-049–054, DEC-068–073) to determine whether a manager, eligible wedding administrator, or other authorized collaborator should be notified. Each additional recipient must already have independent permission to access the relevant issue, and their own channel preferences, quiet hours, and device permissions apply. The original user's opt-out remains intact. Escalation does not automatically transfer ownership, grant access, create new roles, or send sensitive information to unverified or unauthorized contacts.

**Safeguards and edge cases:** If no other authorized recipient exists or their external channels are unavailable, retain the critical issue in authorized in-app views, record delivery limitations appropriately, and avoid inventing a fallback recipient or bypassing any opt-out. When risk changes, update the visible severity and escalation state; resolved or no-longer-critical issues should not retain a misleading critical banner. Prevent duplicate alerts while preserving distinct unresolved issues. Apply minimal-detail privacy controls to external notifications.

**Acceptance criteria and traceability:** A user who disables both critical external channels receives no email or push for those planning alerts, but sees persistent critical warnings when signed in; independently eligible recipients can still be notified according to their own settings; no access or ownership changes occur implicitly; escalation, delivery limitations, and issue-state changes are auditable. Essential security/account communications remain separate under DEC-079.

**Follow-up:** DEC-081 establishes that persistent critical warnings reflect current verified risk rather than acknowledgement alone. Specific evidence and authority for verifying mitigation remain to be decided.

### DEC-081 — Clear or downgrade persistent critical warnings based on current risk and resolution status

**Status:** Approved  
**Decision:** Option C — Based on current risk and resolution status. A persistent critical-warning indicator remains prominent for as long as the underlying issue is assessed as critical. It may be downgraded when verified mitigation materially reduces the risk, and the critical indicator must be removed when the issue is resolved or is no longer critical. Mere acknowledgement, assignment, or a stated intention to act does not change severity.

**Expected product behavior:** Continuously reassess the issue against the risk factors established in DEC-070 and DEC-073: severity, deadline proximity, wedding proximity, dependencies, and inactivity. If the current assessment remains critical, retain the persistent critical warning in the relevant authorized dashboards and notification center, including when a manager has acknowledged it. If substantiated mitigation reduces severity below critical, replace the critical treatment with an accurate lower-severity issue indicator; retain the underlying issue and its normal follow-up if unresolved. On confirmed resolution, remove the active critical warning and mark the issue resolved, preserving historical records. If the risk rises again, restore critical visibility and applicable escalation.

**Evidence and permissions:** Acknowledgement alone is not mitigation. Examples of potential evidence include a confirmed replacement supplier, a verified new deadline, or another documented action that removes a material risk; the platform must not infer that an external commitment changed merely because someone recorded a plan. Only authorized users may record or validate mitigation or resolution under applicable wedding, organization, and issue permissions. The exact verification and approval workflow is an open product decision.

**Notifications, privacy, and audit:** Reevaluate notification relevance when severity changes; avoid obsolete or duplicate critical alerts, but do not suspend the normal reminders for still-open issues merely because the critical banner was downgraded (DEC-072). Continue to respect quiet hours, personal channels and opt-outs, and recipient permissions (DEC-074–080). Log severity changes, the supporting mitigation or resolution, actor, time, and any resulting notification/escalation changes. Do not erase prior critical history when a banner disappears.

**Acceptance criteria:** (1) Acknowledging an unresolved critical issue does not remove its critical banner; (2) verified mitigation reducing risk below critical downgrades the banner without falsely closing the issue; (3) confirmed resolution clears the active warning; (4) renewed critical risk restores it; (5) unauthorized users cannot suppress the warning or claim mitigation; (6) relevant activity remains auditable.

**Follow-up:** DEC-082 defines permission-based human verification with supporting evidence. Whether and how linked records can suggest (but not silently authorize) a downgrade remains open.

### DEC-082 — Permission-based verification of mitigation before downgrading critical issues

**Status:** Approved  
**Decision:** Option C — Permission-based verification. An assigned issue owner, lead planner, or authorized manager may verify mitigation and downgrade a critical issue only if their effective permissions allow that action for the particular wedding and issue. Supporting information and an auditable decision are required; being an issue owner or holding a job title does not itself override restricted access or grant severity-editing rights.

**Expected product behavior:** An eligible verifier reviews the issue's current risk, records what materially changed, attaches or references appropriate supporting information (such as a confirmed replacement vendor or an agreed revised deadline), and selects the justified new severity. The platform checks eligibility, evidence completeness, and any outstanding blocking dependencies before applying the downgrade. If the risk remains critical or evidence is insufficient, the critical indicator and escalation remain in force. Downgrading severity does not automatically mark the issue resolved, change supplier contracts, move payment deadlines, reassign ownership, or cancel outstanding follow-up.

**Permissions and safeguards:** Apply wedding-level, organization-level, role-based, and record-specific permissions; preserve the couple's control of personal wedding data and the planner's separation of private business records. A verifier may access only evidence they are entitled to see. Where the issue owner lacks downgrade authority, they can record proposed mitigation for an eligible verifier to assess without changing severity. Where no eligible verifier is available, keep the issue critical and route the verification request to an authorized fallback where one exists, without escalating access. Prevent self-declared completion or acknowledgement alone from counting as verified mitigation.

**Notifications and traceability:** Record the actor, time, previous and new severity, supporting evidence reference, rationale, and any resulting alert/escalation changes. Inform appropriate authorized stakeholders of material severity changes, respecting their notification preferences and privacy. Retain critical-issue history and reevaluate reminders using DEC-070–081; do not silently disable existing follow-up while the issue is open.

**Acceptance criteria:** (1) An issue owner with explicit permission can submit evidence and downgrade an issue; (2) an issue owner without permission cannot downgrade it; (3) an eligible lead or manager can verify within their scope; (4) insufficient evidence or unresolved critical risk prevents a misleading downgrade; (5) a downgrade updates persistent warning severity but leaves the underlying issue open unless separately resolved; (6) changes are auditable and do not expose restricted records.

**Open follow-up:** Define the minimum evidence required for a mitigation decision and whether evidence requirements should vary with risk and issue type.

### DEC-083 — Risk-based evidence requirements for downgrading critical issues

**Status:** Approved  
**Decision:** Option C — Risk-based evidence requirements. Every proposed downgrade of a critical issue requires a written justification explaining the material change in risk. Higher-risk issues additionally require credible supporting documentation or verified linked platform records, with requirements tailored to issue type, current severity, proximity to the wedding, deadlines, dependencies, and potential consequences. The platform must not treat a mere statement of intent or acknowledgement as sufficient mitigation.

**Expected product behavior:** Show an evidence checklist appropriate to the issue and proposed severity before an authorized verifier can approve a downgrade. Always capture a concise rationale, the proposed severity, and what changed. For lower-consequence cases, a specific, reviewable written explanation may be sufficient. For high-consequence or time-critical cases (such as a key supplier cancellation near the wedding, a significant contractual/payment risk, or a dependency that threatens the wedding-day schedule), require a corroborating attachment, documented confirmation, or verified linked record demonstrating actual mitigation. Examples include a replacement supplier's confirmed commitment, a signed amendment, or a verified revised deadline. An unverified draft, proposed booking, or merely completed internal task must not be presented as external confirmation.

**Validation and flexibility:** Requirements should be proportionate and understandable rather than imposing mandatory uploads for every change. An authorized verifier may reference existing records they can access instead of uploading duplicate files. If required evidence is absent, contradictory, stale, or insufficient for the proposed severity, block that downgrade, explain what is missing, and allow the user to save mitigation notes or request further verification without losing progress. A record's existence does not automatically establish authenticity or adequacy; human permission-based verification under DEC-082 remains required. Do not silently downgrade issues based solely on linked status changes.

**Permissions, privacy, and audit:** Apply existing issue/wedding/organization permissions to who can submit, review, and see evidence. Store only necessary details and restrict sensitive contracts, communications, and personal information to authorized viewers. Record the verifier, timestamp, original and new severity, justification, evidence type/reference, and outcome, preserving the history even if the issue later resolves or becomes critical again. Do not automatically resolve issues, cancel reminders, change ownership, or override notification preferences as a result of an evidence-backed downgrade.

**Acceptance criteria:** (1) Every critical-to-lower-severity downgrade includes a written rationale; (2) a high-risk supplier cancellation cannot be downgraded without adequate supporting confirmation or verified records; (3) lower-risk mitigation can use a sufficiently specific written explanation where the risk rules permit; (4) insufficient evidence blocks approval while preserving draft notes; (5) existing accessible linked evidence can be reused without unnecessary duplicate upload; (6) only authorized users verify downgrades and all decisions remain auditable.

**Follow-up:** Define how the platform should handle evidence that later becomes invalid or contradicted, including whether to automatically flag the issue for reassessment.

### DEC-084 — Automatic risk reassessment when accepted mitigation evidence becomes invalid

**Status:** Approved  
**Decision:** Option C — Automatic risk reassessment with safeguards. If evidence previously relied upon to mitigate a wedding-planning issue becomes invalid, stale, withdrawn, or credibly contradicted, the platform flags the evidence and reassesses the issue's *current* risk. It may automatically restore Critical severity when reliable, relevant information establishes that the issue now meets the existing critical-risk criteria. Where information is uncertain, ambiguous, incomplete, or contradictory, the platform must request an authorized human reassessment instead of making an unsupported severity change.

**Expected product behavior:** Link mitigation decisions to the evidence and underlying records that supported them. Detect meaningful changes where the platform has reliable event data, such as a confirmed replacement supplier cancellation, revoked booking confirmation, or invalidated dependency; otherwise permit authorized users to report new contrary information. Mark the affected mitigation as requiring reassessment, explain what changed and which assumptions no longer hold, and recalculate severity against the current deadlines, wedding proximity, dependencies, and consequences. If a verified cancellation makes the wedding's essential supplier coverage critically unsafe, restore Critical severity promptly, show the persistent critical warning, and resume or intensify risk-based escalation. Do not automatically restore the *previous* severity solely because evidence changed: assess the actual present risk and any remaining valid mitigation.

**Safeguards and review:** Distinguish authoritative confirmations from unverified messages, inferred changes, stale integrations, or disputed evidence. Where criticality is not reliably established, retain the last verified severity while prominently marking the issue **Reassessment required**, surfacing potential urgency, and routing an actionable review to a person authorized under DEC-082. Do not silently treat uncertain data as verified or suppress a potentially urgent issue. Authorized reviewers may validate new evidence and confirm the appropriate severity subject to DEC-083's proportional evidence rules. Preserve open tasks, ownership, contractual records, and follow-ups unless changed through their own approved workflows.

**Notifications, permissions, and history:** Notify eligible stakeholders of confirmed critical re-escalations or material reassessment requests according to their permissions, personal channels, quiet-hour rules, and existing critical-alert opt-outs (DEC-070–080). Continue persistent dashboard visibility based on current risk (DEC-081). Do not grant access to confidential evidence merely because an alert is escalated. Record the evidence change, source and reliability, previous mitigation and severity, reassessment reasoning, any automatic change, human review, recipients, and timestamps. Avoid duplicate notifications and keep the history of prior verification intact.

**Acceptance criteria:** (1) A confirmed replacement supplier cancellation triggers reassessment and automatically restores Critical when current criteria are met; (2) an uncertain or disputed cancellation prompts urgent authorized review rather than an unsupported automatic downgrade or escalation; (3) a changed evidence record does not blindly restore an obsolete prior severity when other valid mitigation exists; (4) persistent warnings and escalations reflect confirmed current risk; (5) preferences and access restrictions are respected; (6) every evidence invalidation and severity decision is auditable.

**Follow-up:** Define how the platform should handle reassessment when the relevant issue has already been marked resolved or closed.

### DEC-085 — Intelligent reopening of resolved issues with safeguards

**Status:** Approved  
**Decision:** Option C — Intelligent reopening with safeguards. When new reliable evidence establishes that a previously resolved wedding-planning issue's original resolution is no longer valid, automatically reopen the same issue, reassess its current severity, and resume the applicable warnings, reminders, and escalation. When evidence is ambiguous or disputed, flag the resolved issue for authorized review without falsely asserting that it has reopened. When a subsequent event is genuinely separate rather than a failure of the original resolution, create a distinct but linked issue instead.

**Expected product behavior:** Preserve the resolved issue's evidence and resolution rationale, and associate the resolution with its relevant underlying commitments, supplier records, dependencies, or confirmations. When these are invalidated, distinguish three cases: (1) a confirmed failure of the same resolution, which reopens the original issue; (2) a credible but unverified contradiction, which places the closed record into **Reopening review required** with a prominent actionable warning for eligible reviewers; and (3) a separate new problem, which receives a new linked issue to preserve distinct ownership, timelines, and accountability. For example, if a replacement photographer cancels and the original cancellation issue was resolved specifically on that replacement's confirmed booking, the original issue may reopen. If a wholly unrelated supplier problem occurs, it should be tracked separately.

**Risk and continuity:** Reopening must use the *current* risk criteria from DEC-070 and DEC-081–084 rather than blindly restoring the old severity. Where verified facts meet critical criteria, restore the persistent critical warning and relevant escalation promptly. Reapply or resume unresolved follow-ups, deadlines, ownership, and notifications as appropriate; do not duplicate completed tasks, undo settled financial records, or silently reverse contractual changes. A reopened issue is not automatically assigned to a person who no longer has access: use the approved assignment/fallback rules. Acknowledgement alone never re-resolves it. An authorized reviewer can assess uncertain evidence, correct mistaken associations, or explicitly determine whether to reopen or create a linked issue, subject to existing permissions and evidence requirements.

**Permissions, notification, and audit safeguards:** Only use evidence the platform is authorized to access. Automated reopening does not expand permissions or override anyone's opted-out external critical-alert channels; notify eligible stakeholders using their own settings and continue authorized escalation under DEC-079–080. Preserve a continuous audit trail of the original issue, closure decision, original mitigation evidence, contradictory event, reliability assessment, reopening or review decision, severity, owner, and any linked successor issue. Prevent repeated event ingestion from reopening the same issue multiple times or producing duplicate alerts. Allow authorized correction of an erroneous reopening with a documented reason, without deleting the original history.

**Acceptance criteria:** (1) A confirmed cancellation that invalidates the exact replacement used to resolve an issue reopens that issue and reassesses severity; (2) an unverified cancellation triggers an actionable authorized review but not an unsupported reopening; (3) a genuinely unrelated event creates a separately tracked linked issue; (4) reopening does not duplicate completed work or reverse payments/contracts; (5) notifications and reassignment respect permissions and preferences; (6) the full resolution-to-reopening history remains auditable.

**Follow-up:** Define how issues should be represented and linked when multiple related incidents occur, including whether users can merge or split issues without losing history.

### DEC-086 — Smart duplicate suggestions with controlled merging, linking, and splitting

**Status:** Approved  
**Decision:** Option C — Smart suggestions with controlled merge and split. The platform identifies likely duplicate or related wedding-planning issues and presents explainable suggestions. Authorized users, not the platform acting alone, decide whether to merge true duplicates, link related but distinct issues, or split a mixed issue into independently actionable problems.

**Detection and presentation:** Suggest potential duplicates based on overlapping supplier, wedding, subject, linked records, dates, affected tasks, and underlying cause, subject to each viewer's access. Distinguish **Possible duplicate** from **Related issue** and explain the supporting similarities without revealing restricted information. Do not automatically merge or close issues based on similarity scores. Allow users to dismiss incorrect suggestions, with suitable deduplication of repeated prompts.

**Controlled merge:** An authorized user chooses a primary issue and previews the consequences before confirming. Consolidate relevant comments, permitted attachments, evidence references, follow-ups, and cross-links without losing the original records or provenance. Preserve source issue identifiers, original authors, timestamps, resolution and escalation history, and a traceable merged-from relationship. Resolve conflicting severity, ownership, deadlines, statuses, and notification state explicitly; never silently discard the more urgent open risk, remove required follow-up, transfer responsibility, or bypass DEC-070–085 safeguards. Keep merged records discoverable via their original links, redirecting eligible users to the primary issue and its merge history. Prevent duplicate reminders or escalations after consolidation.

**Linking and splitting:** Related but separate problems can be linked without combining their ownership, deadlines, status, or risk calculations. Authorized users may split an issue containing distinct actionable problems into separate issues, choosing which tasks, evidence, comments, and dependencies belong to each. Retain a clear source-to-child history and shared references where relevant; never silently duplicate completed tasks, payments, contractual commitments, or notifications. Newly split issues receive appropriate ownership, risk assessment, and follow-up according to existing permission and assignment rules.

**Permissions and safeguards:** Require explicit merge/split permission covering every affected issue and wedding; being an issue assignee alone does not confer this permission. Never combine data across separate weddings or disclose private planner, couple, or organization records through suggestions, merged views, links, or audit entries. If an issue cannot be accessed or legally combined, do not expose its details or offer an unsafe merge. Preview conflicts and require confirmation for destructive-looking changes; retain audit history and allow authorized corrective action rather than erasing prior actions. Maintain integrity of verified mitigation evidence and reopened-issue relationships.

**Acceptance criteria:** (1) Two reports of the same unconfirmed photographer booking produce a nonbinding duplicate suggestion; (2) an authorized merge preserves both reports and audit history, with one coherent active issue and no duplicated reminders; (3) related but independent supplier issues can be linked without merging; (4) a mixed issue can be split into separately assigned, risk-assessed issues with source history; (5) conflicting critical severity and deadlines cannot disappear silently; (6) users without relevant permissions see no restricted content and cannot merge/split; (7) the operation remains traceable and reversible through controlled correction where feasible.

**Follow-up:** Decide how merged or split issue ownership and responsibility conflicts should be resolved when the source issues have different assignees.

### DEC-087 — Guided ownership resolution for merged issues

**Status:** Approved  
**Decision:** Option C — Guided ownership resolution. When duplicate issues with different owners are merged, the platform shows existing owners and their responsibilities, recommends an eligible owner using current task, supplier, and issue responsibilities, and requires the authorized person performing the merge to explicitly confirm or select the consolidated issue owner before completing the operation.

**Expected product behavior:** The merge preview identifies the primary and source issues, current owners, relevant lead planner or manager, open follow-ups, deadlines, severity, and assignment conflicts. Recommend an owner who retains appropriate wedding and issue permissions and is best positioned to resolve the underlying problem; explain the recommendation rather than silently selecting based only on which issue was chosen as primary. The merging user may choose another eligible owner within their assignment authority. The consolidated issue has one clearly accountable primary owner; other contributors may remain collaborators or owners of distinct linked tasks, without becoming unacknowledged co-owners of the issue. If there is no eligible owner, prevent an unowned merge and present the existing approved manager/administrator fallback for resolution, without inventing access or granting permissions.

**Safeguards and continuity:** Confirming the merged owner does not automatically transfer or cancel unrelated tasks, supplier commitments, deadlines, financial records, or previously recorded acknowledgements. Review dependent follow-up assignments separately when they conflict and preserve critical-risk safeguards from DEC-070–086. Notify the newly assigned owner and affected former owners using their preferences; retain a clear record of who is responsible for each remaining action. If access changes or the proposed owner becomes ineligible before confirmation, refresh the preview and require a valid selection. Merging remains subject to the existing permission checks and cannot cross wedding or privacy boundaries.

**Audit and acceptance criteria:** Record the original issue owners, recommended owner and basis, confirmed owner, authorizing actor, time, and resulting follow-up assignments. A merge between Sarah's and Thomas's duplicate photographer issues cannot finish without an explicitly confirmed eligible owner; the chosen owner is notified; the other planner's historical contribution remains visible to eligible users; and neither critical deadlines nor unresolved actions disappear. An unauthorized merger or ineligible assignment is blocked with a clear explanation.

**Follow-up:** Decide whether and how the platform should let authorized users undo an incorrect issue merge while preserving edits and actions made after the merge.

### DEC-088 — Guided unmerge with history preservation

**Status:** Approved  
**Decision:** Option C — Guided unmerge with history preservation. Authorized users can reverse an incorrect issue merge through a guided separation workflow that preserves original issue provenance, subsequent work, and a complete audit trail instead of silently rolling back changes.

**Expected product behavior:** Offer an **Unmerge** action to users with appropriate permissions over all affected issue records. Present a preview of the original source issues, the consolidated issue, and changes recorded since the merge. Restore the original issues as distinct actionable records, allowing the authorized user to allocate post-merge comments, tasks, documents, evidence, follow-ups, deadlines, and dependencies to the appropriate issue. Where a record legitimately applies to both, offer a shared reference or explicit link instead of duplicating its authoritative source. Retain original authorship, timestamps, identifiers, and links where feasible; preserve the merged record as a traceable historical event and route old links to an access-checked unmerge history or relevant issue.

**Conflict resolution and safety:** Require explicit review of ambiguous post-merge items, changed owners, completed actions, escalations, and conflicting statuses before confirmation. Do not automatically undo completed work, send duplicate notifications, reopen unrelated tasks, reverse payments, or modify contracts. Reassess the current risk, status, owner, and follow-up obligations of each resulting issue using existing DEC-068–087 rules; never suppress a critical warning or leave an issue without eligible ownership. If a safe separation cannot be completed (for example, because permissions changed or a record cannot be reliably allocated), block finalization, explain the conflict, and permit saving a draft review without altering live issues. Prevent cross-wedding or private-record disclosure.

**Notifications and audit:** Notify affected eligible owners and collaborators of responsibility changes according to their preferences. Record the unmerge initiator, approval, time, source merge, mapping of pre- and post-merge records, manual allocations, reasons, resulting owners and risk states, and any unresolved conflicts. Preserve historical merge and unmerge events permanently according to applicable retention rules rather than rewriting history.

**Acceptance criteria:** (1) Sarah and Thomas can review two incorrectly merged photographer issues and separate them with the original reports intact; (2) newly added comments and documents are allocated deliberately, with shared references where appropriate; (3) completed tasks and contractual/financial records are not silently duplicated or reversed; (4) each resulting issue has an eligible owner and independently reassessed severity; (5) unauthorized access and unsafe unmerge attempts are blocked; (6) all original and subsequent work remains traceable to authorized viewers.

**Follow-up:** Return to the core planning timeline and define how task progress states should work across couples and professional planners.

### DEC-089 — Simple couple task progress with advanced professional workflow

**Status:** Approved  
**Decision:** Option C — Simple for couples, advanced for professionals. The planning timeline uses one shared underlying task and status model, presented as an approachable progress workflow to couples and with more detailed operational states to professional planners where authorized. These are role-appropriate views of the same task, not separate or conflicting task systems.

**Expected product behavior:** Couples see concise, understandable progress indicators and clear next actions, with simple labels such as **To do**, **In progress**, **Waiting**, and **Done** as proposed initial presentation labels (exact labels and mapping remain subject to the next decision). Professionals may distinguish operational reasons for waiting, including **Awaiting response**, **Blocked**, and **Awaiting approval**, as well as ordinary work progress and completion. Where an operational state is collapsed for the couple view, the couple can still understand the relevant delay, decision required, and accountable person when they have permission to see it. Users must never see a misleading **Done** or **On track** indicator simply because their view is simplified.

**Shared-state and collaboration safeguards:** Updating task status from either view updates the same authoritative task and is reflected in other authorized views without creating duplicate work. A professional's detailed state maps consistently to the couple-facing progress category; the platform must not allow contradictory status values or silently overwrite a colleague's newer update. Role-based presentation is not a permission grant: confidential internal planner notes, private supplier information, and restricted approval details remain protected. Couples retain visibility and control over shared wedding tasks according to existing ownership and access decisions; advanced status controls are permission-based, not exclusively available because of an account label. Task assignment, flagged review, dependencies, reminders, and escalation rules from earlier decisions continue to apply.

**Usability and acceptance criteria:** (1) A couple can quickly distinguish work not started, actively progressing, waiting, and completed without navigating a professional workflow; (2) an authorized planner can identify whether the same waiting task is blocked, awaiting a supplier response, or awaiting approval; (3) status changes appear consistently across both views and relevant dashboards; (4) blocked and overdue work is not hidden by simplified presentation; (5) no private operational data is exposed through status labels or details; (6) task history records actor, time, and transitions, subject to access rules.

**Open implementation detail:** Confirm the canonical task status taxonomy and exact mapping to simplified couple-facing labels before locking workflow transitions and automation behavior.

**Follow-up:** Decide which canonical task states the shared planning timeline should support initially.

### DEC-090 — Structured core task statuses with detailed waiting reasons

**Status:** Approved  
**Decision:** Option C — Use a shared, structured set of six canonical task statuses: **Not Started, In Progress, Waiting, Blocked, Completed, and Cancelled**. A task in **Waiting** additionally records an actionable reason, such as **Awaiting Supplier**, **Awaiting Couple**, **Awaiting Approval**, or **Other**. Couples see a simpler, understandable presentation; professionals and other authorized collaborators see the appropriate operational detail. All views represent the same task record, consistent with DEC-089.

**Canonical status semantics:** **Not Started** means work has not begun; **In Progress** means active work is underway; **Waiting** means progress is pending a response, decision, event, or external dependency and must include a reason; **Blocked** means a material obstacle prevents progress and requires an actionable blocker or linked issue; **Completed** means the defined task outcome is finished, not merely acknowledged; **Cancelled** means the task is no longer required, with a recorded reason and without falsely counting it as completed. Waiting and Blocked are distinct: a routine pending response is Waiting, whereas a condition that prevents progress or creates an actionable impediment is Blocked. An overdue task can retain any applicable unfinished status; overdue is a separate derived indicator, not a canonical status.

**Waiting reason detail:** Provide **Awaiting Supplier**, **Awaiting Couple**, **Awaiting Approval**, and **Other** as initial selectable reasons. Record the specific party or action expected, where permitted and known, and optionally a follow-up date or linked decision, supplier, or approval. Other requires a short explanation so it does not become an opaque catch-all. Reasons can be revised without inventing new canonical statuses. Do not expose restricted internal planner notes, supplier communications, or confidential approvals through simplified labels.

**Couple-facing mapping:** Present **Not Started** as **To do**, **In Progress** as **In progress**, **Waiting** as **Waiting**, **Blocked** as **Needs attention** (or clearly **Blocked** when appropriate), **Completed** as **Done**, and **Cancelled** as **Cancelled/Not needed** in a distinct non-completed category. Couple-facing Waiting may show an accessible, non-sensitive explanation such as “Waiting for supplier confirmation” or “Your approval needed” when the couple is authorized to see it. The simplified interface must not hide blockers, deadlines, or actions the couple needs to take. Professional views show canonical status and detailed waiting reason, subject to permissions.

**Transitions and safeguards:** Status updates are permission-checked and audited. Changing to Waiting requires a reason; changing to Blocked requires a blocker description or linked issue; marking Completed requires the task's applicable completion conditions, including any required approval, to be met; Cancelled requires an explicit reason. Do not automatically convert Waiting to Blocked merely because a response is late: existing deadline, risk, and escalation rules may surface urgency while preserving accurate status. Dependencies, assignments, follow-ups, notifications, and risk management established in earlier decisions remain applicable. A status change does not automatically close a linked issue, cancel an obligation, reverse a payment, or override another person's more recent update.

**Acceptance criteria:** (1) A couple sees “Waiting” while a planner sees “Waiting — Awaiting Supplier” for the same photographer booking task; (2) a pending couple approval clearly indicates the couple's required action without disclosing private planner notes; (3) a blocked task stays visibly actionable in both views; (4) cancelled work is not counted as completed; (5) waiting reasons and status changes are validated, permission-checked, and audited; (6) overdue and risk indicators remain independent of canonical status.

**Follow-up:** Decide how tasks should move between these statuses, including whether status transitions should be unrestricted or guided by workflow rules.

### DEC-091 — Flexible task-status transitions with contextual safeguards

**Status:** Approved  
**Decision:** Option C — Authorized users can generally transition a task directly between any of the six canonical statuses without being forced through intermediate steps. Context-sensitive validation protects required explanations, approvals, completion criteria, dependencies, and the integrity of reopened work. This extends DEC-089 and DEC-090 rather than creating a second workflow.

**Expected behavior:** Users can mark a task Completed directly from Not Started when the outcome is genuinely finished, return Waiting or Blocked work to In Progress, or move In Progress back to Not Started when appropriate. A status transition must represent the actual state, not an artificial sequence. Provide a clear status selector with concise descriptions and only request additional fields when the chosen transition requires them. The couple view remains simple while authorized professionals see waiting reasons and operational detail.

**Contextual requirements:** Moving to Waiting requires a waiting reason, including a short explanation for Other and an expected party/action when known. Moving to Blocked requires an actionable blocker description or linked issue. Moving to Cancelled requires a reason and must not be counted as completion. Moving to Completed requires applicable completion criteria and any required approval to be satisfied; neither a direct transition nor elevated UI access bypasses an approval. Where linked commitments, payments, dependencies, or other records are affected, explain impacts and require the relevant separate authorization rather than silently changing them.

**Reopening and corrections:** Moving a Completed or Cancelled task back to an active state requires an explicit confirmation and a recorded reason, with visibility of any downstream consequences. Preserve prior completion evidence, approvals, timestamps, and history; reopening does not automatically revoke contracts, undo payments, reopen resolved issues, or erase other users' work. If a completion is no longer valid, the reopened task receives appropriate follow-up and risk reassessment under existing rules. Authorized corrections remain possible without a mandatory manager gate unless another approved permission or approval rule requires one.

**Concurrency, permissions, and audit:** Every transition is permission-checked, validated against the latest task version, and recorded with actor, time, previous/new status, reasons, and linked evidence. Concurrent edits must be surfaced for review rather than silently overwriting newer work. Notifications, assignments, deadlines, reminders, and escalation follow existing rules; overdue remains a derived indicator, not a status. No transition exposes restricted planner or supplier information in couple-facing views.

**Acceptance criteria:** (1) A simple task can move directly from Not Started to Completed if completion conditions are met; (2) Waiting and Blocked cannot be selected without their required context; (3) a task requiring approval cannot be completed before approval; (4) reopening Completed work prompts for confirmation and a reason while retaining its prior history; (5) changes do not silently alter financial or supplier commitments; (6) simultaneous updates cannot overwrite each other unnoticed.

**Follow-up:** Decide how task dependencies should affect the ability to start or complete work when prerequisite tasks remain unfinished.

### DEC-092 — Flexible task dependencies with completion safeguards

**Status:** Approved  
**Decision:** Option C — Tasks may begin and make preliminary progress while prerequisite tasks remain unfinished. The platform clearly displays unresolved dependencies and prevents final completion only when a prerequisite is genuinely required for the dependent task's outcome. An authorized exception requires explicit justification, appropriate permissions, and a preserved audit trail. This elaborates DEC-064, DEC-065, DEC-067, DEC-089–DEC-091 without imposing a rigid linear workflow.

**Dependency behavior:** A task can depend on one or more prerequisite tasks. A prerequisite that is incomplete does not automatically block starting the dependent task: for example, invitations can be designed before the venue address is confirmed. Show prerequisite task name, state, responsible person where permitted, and what is still required. Differentiate an informational planning dependency from a prerequisite essential to valid completion; do not equate every unfinished predecessor with a blocker. If the prerequisite becomes overdue or at risk, retain accurate task statuses while surfacing appropriate warnings, reminders, and escalations under existing rules.

**Completion safeguards:** Before completing a dependent task, evaluate whether any unresolved prerequisite is genuinely necessary for the declared outcome. If so, explain the specific unmet prerequisite and block ordinary completion; allow saving work in progress. If the dependency is advisory or the required outcome is already independently verified, do not block completion merely because a related task is unfinished. Do not silently mark prerequisites complete, change supplier commitments, approve payments, or resolve issues as a side effect of a dependent task's status update. Required independent approvals and contractual or financial controls remain mandatory.

**Authorized exceptions:** Where a genuinely required dependency can be safely waived or replaced by alternative verified evidence, users with appropriate permission may request or record an exception with a reason and relevant supporting context. The platform previews the consequences, preserves the exception and actor in the task history, and surfaces remaining risk. An exception cannot override permissions, mandatory approvals, security/privacy boundaries, or irreversible external obligations. If a prerequisite cannot safely be waived, completion remains blocked pending a valid resolution. No universal manager-approval requirement is implied unless another approved rule requires it.

**Integrity and experience:** Prevent circular dependencies and self-dependencies. Display dependency chains and blocked final outcomes clearly in both couple and professional views, using accessible non-sensitive language. Protect private planner records and permissions. When a prerequisite is cancelled, reopened, rescheduled, or invalidated, reassess affected dependent tasks and flag changed risks rather than silently reversing their completed state; use existing issue and evidence safeguards as applicable. Preserve task history, reasons, exceptions, and notifications without duplicate alerts.

**Acceptance criteria:** (1) A couple can begin invitation design while venue selection is unfinished; (2) finalizing invitations is prevented if a confirmed venue address is essential and still missing; (3) an informational dependency does not unnecessarily prevent completion; (4) an eligible user can record a justified, safe exception with audit history, but cannot bypass mandatory approval or financial controls; (5) invalidated prerequisites trigger appropriate review of downstream work; (6) dependency cycles are rejected and relevant dependency information is visible to authorized users.

**Follow-up:** Decide how the platform should handle a prerequisite task being completed, reopened, or cancelled after dependent tasks have already progressed or been completed.

### DEC-093 — Impact-based reassessment of downstream tasks after prerequisite changes

**Status:** Approved  
**Decision:** Option C — When a prerequisite is reopened, cancelled, materially revised, or invalidated after dependent tasks have progressed, assess actual downstream consequences and guide authorized users through necessary actions. Preserve completed work and its history, flag tasks that need review, and suggest reopening, revision, or follow-up tasks as appropriate. Automatically update only safe, reversible planning information; do not automatically undo completed work or external commitments. This extends DEC-064–DEC-067 and DEC-089–DEC-092, and uses existing issue, notification, permission, and audit safeguards.

**Impact detection and scope:** On a material prerequisite change, examine directly dependent tasks and relevant downstream dependency chains, including tasks already marked Completed or Cancelled. Distinguish unaffected work, work whose information can safely be refreshed, work requiring human confirmation, and work with material risk or an irreversible external consequence. For example, a venue cancellation can invalidate the venue address on finalized invitations without erasing the design work or implying printed invitations can be recalled. Do not infer that every downstream task is invalid simply because a prerequisite changed.

**Guided actions and review:** Surface a clear, deduplicated impact summary to eligible owners and coordinators, showing affected tasks, why they are affected, urgency, dependencies, and proposed next steps. Suggested actions may include reviewing a completed task, reopening it under DEC-091 with confirmation and reason, editing relevant details, creating a corrective follow-up task, or documenting that no change is required. Users can review and approve safe actions individually or in suitable groups, consistent with the impact-based review approach in DEC-066–DEC-067. Preserve completed status until a justified authorized transition occurs; a review-needed indicator is not a new canonical task status.

**Automation boundaries:** Safe, reversible updates to derived planning information may be applied automatically when source data and permissions are reliable, with visible change history and an opportunity to inspect the result. Do not automatically modify signed agreements, send or retract invitations, change confirmed supplier bookings, reverse payments, cancel external commitments, or overwrite user-authored content with uncertain replacements. Such consequences require appropriate explicit action and any separately required approvals. If the impact cannot be reliably determined, request human review rather than assuming completion is invalid.

**Ownership, risk, and communication:** Assign follow-up to the existing eligible task owner where possible, using previously approved ownership and fallback rules; never silently grant access or reassign responsibility. Reassess deadlines, risk, completion blockers, and escalation based on current facts. Notify affected authorized people according to their preferences and existing critical-alert safeguards, without exposing restricted supplier or planner information to couples or helpers. Avoid duplicate alerts for the same prerequisite event.

**Audit and acceptance criteria:** Preserve the prerequisite change, identified impacts, automated safe adjustments, review decisions, before/after values, task status history, and any linked corrective tasks. (1) Venue cancellation flags finalized invitations containing outdated venue information without automatically marking the invitation task incomplete; (2) an authorized person can choose to reopen the task or create a follow-up with a recorded reason; (3) unaffected dependent tasks remain unchanged; (4) only reversible derived information is updated automatically; (5) irreversible actions and financial or contractual commitments require explicit authorized action; (6) chained impacts and outstanding reviews remain visible until appropriately addressed.

**Follow-up:** Decide how task deadlines should be represented and managed when planning dates or dependencies change.

### DEC-094 — Flexible task scheduling with target dates and hard deadlines

**Status:** Approved  
**Decision:** Option C — Tasks may have an optional planned start date, an ideal target date, and a final hard deadline. Couples receive a clear, low-complexity presentation while professional planners can inspect and manage all scheduling fields. The platform distinguishes aspirational timing from binding deadlines in reminders, risk assessment, and rescheduling. This extends DEC-064–DEC-067 and DEC-089–DEC-093 without creating new task statuses.

**Scheduling fields and meaning:** Planned start is the intended point to begin work, not a prohibition against starting early. Target date represents the preferred completion date and may be missed without automatically implying a contractual or critical breach. Hard deadline is the latest acceptable completion date when a real constraint exists, such as a supplier cutoff or required approval. Each field is optional, but the interface should avoid encouraging arbitrary hard deadlines. Where provided, dates should normally follow planned start <= target <= hard deadline; inconsistent entries require a clear correction or justified exceptional review, not silent rewriting. Wedding-relative template suggestions must remain distinguishable from confirmed commitments.

**Couple and professional views:** Couples should ordinarily see the most actionable next date, plainly labeled as a target or final deadline, with an optional way to inspect additional scheduling details. Professional planners can edit and compare all dates, see timing rationale, and identify hard constraints. Both views share the same task record, remain permission-aware, and avoid exposing private professional or vendor information.

**Reminders, urgency, and overdue behavior:** A nearing or missed target may prompt gentle planning reminders and schedule review, but must not be mislabeled as a missed hard deadline. Approaching or missed hard deadlines feed the existing risk-based priority, notification, quiet-hours, escalation, and persistent-warning rules according to actual severity. Overdue is a derived indicator rather than a seventh canonical task status. Tasks with no dates remain valid and can still be prioritized by dependencies or manually assigned priority. Completing a task does not erase its scheduling history.

**Changes, dependencies, and external commitments:** A wedding-date change or prerequisite change may prompt suggested revisions to start, target, and hard-deadline fields through the previously approved impact-based, individually approvable review. Do not automatically shift confirmed supplier cutoffs, contractual dates, paid commitments, or other externally binding deadlines. Preserve fixed deadlines and flag resulting conflicts. Changes to a hard deadline require appropriate authority and explanation where the deadline is based on an external obligation. Notify affected eligible collaborators without bypassing privacy or personal notification settings.

**Validation and audit:** Date edits must respect user locale/timezone, distinguish calendar dates from exact event times, prevent ambiguous silent timezone conversions, and show conflicts before saving where possible. Record old/new values, actor, time, reasons for exceptional changes, and links to underlying commitments or dependencies where relevant. Do not infer a supplier contract solely from a user-entered hard deadline.

**Acceptance criteria:** (1) A task can be created with no dates, with a target only, or with a start/target/hard deadline; (2) the couple sees an understandable date label without losing access to relevant details; (3) a missed target does not automatically trigger the same severity as a missed hard deadline; (4) changing the wedding date suggests safe rescheduling while preserving externally fixed deadlines; (5) inconsistent dates receive explicit validation; (6) authorized changes and reasons remain traceable.

**Follow-up:** Decide whether target dates and hard deadlines are suggested relative to the wedding date, entered manually, or offered through a combined workflow.

### DEC-095 — Smart date suggestions with guided confirmation

**Status:** Approved  
**Decision:** Option D — When a wedding is created or a planning template is applied, propose realistic task start dates, target dates, and potential hard deadlines using template guidance, the wedding date and details, dependencies, and the actual time remaining. Users can review, accept, adjust, or skip suggestions individually or in compatible groups. External or binding hard deadlines are never established as confirmed commitments without explicit user confirmation and, where relevant, reliable supplier or contractual information. This implements DEC-064–DEC-067 and DEC-094 without overriding protected commitments.

**Suggestion inputs and provenance:** Combine the chosen Simple, Standard, or Comprehensive template and any approved characteristics (DEC-057–DEC-063), wedding date, planning start date, applicable wedding details, dependencies, and existing confirmed milestones. Adapt suggestions for weddings planned on short notice rather than blindly placing tasks in the past. Distinguish template-derived estimates from dates supported by a verified contract, supplier cutoff, or user-confirmed commitment. Explain the rationale and confidence where practical; do not invent supplier obligations or imply estimates are guaranteed.

**Guided review and controls:** Show a reviewable schedule preview before applying suggested dates, with an understandable couple view and more detailed planner controls. For each task, allow acceptance, modification, or skipping of the suggested planned start, target, and proposed deadline as applicable; support bulk acceptance only for clearly compatible, non-conflicting suggestions. Highlight conflicts, compressed schedules, prerequisite constraints, and dates already passed. Do not silently overwrite existing user-set dates or confirmed commitments. A skipped suggestion leaves the relevant field unset or unchanged, not implicitly accepted.

**Hard-deadline safeguards:** The platform may propose a latest recommended completion date, but must clearly distinguish a planning recommendation from a genuinely binding hard deadline. A hard deadline based on a supplier, venue, contract, payment, approval, or legal cutoff requires explicit confirmation and appropriate supporting context; an estimated planning cutoff must not be represented as an externally imposed obligation. Dates from existing verified external commitments remain protected, and any conflict requires review instead of automatic modification.

**Subsequent changes and impact:** Changes to wedding dates, templates, dependencies, or verified commitments may generate new suggestions through the existing impact-based review workflow (DEC-065–DEC-067, DEC-093). Preserve confirmed dates until an authorized change is accepted; do not automatically shift supplier bookings, contractual obligations, payments, or sent invitations. Prioritize critical conflicts and group routine, safe proposals where useful. Apply existing task permission, notification, escalation, and audit rules.

**Validation and audit:** Validate ordering and consistency of planned start, target, and hard deadline (DEC-094), including calendar dates and timezone context. Record which dates were suggested, their sources, who accepted or modified them, what was skipped, and later revisions. Suggestions alone must not change task status, mark work overdue as a contractual breach, or create an external commitment.

**Acceptance criteria:** (1) Applying a template to a wedding with ample lead time produces a reviewable set of wedding-relative date suggestions; (2) a short-notice wedding receives feasible compressed proposals and visible conflicts rather than past dates silently applied; (3) users can accept some dates, edit others, and skip the rest; (4) a bulk action cannot silently overwrite a protected hard deadline; (5) an unverified template cutoff is clearly labeled as recommended, not contractual; (6) changing the wedding date proposes rather than silently commits affected schedule changes; (7) the audit trail preserves suggestions and decisions.

**Follow-up:** Decide how the platform should prioritize tasks when recommended target dates become impossible to meet in a compressed wedding-planning timeline.

### DEC-096 — Adaptive short-notice wedding planning

**Status:** Approved  
**Decision:** Option C — When a couple or planner begins planning with substantially less time than the chosen template ordinarily assumes, create an adaptive, realistic short-notice plan. Prioritize essential bookings, consequential deadlines, and critical dependencies; propose a compressed sequence of work that can realistically occur within the remaining planning window. Explicitly flag recommendations and external deadlines that cannot be met, offer alternative approaches or simplified tasks where suitable, and require guided user approval before applying proposed changes. Do not interpret a historical template recommendation as a newly missed user commitment.

**Detection and context:** Compare the wedding date and actual planning start with template lead times, wedding complexity, confirmed bookings, dependencies, and verified commitments. Explain when a timeline is compressed and which assumptions drove the recommendations. Do not assume that suppliers are available, contracts can be accelerated, or an essential step can be omitted without consequences. A short-notice wedding can use the existing approved template with adaptations; switching to a separate template is not mandatory.

**Prioritization and realistic scheduling:** Put critical-path arrangements, legal or contractual requirements where applicable, essential suppliers, and decisions blocking multiple tasks ahead of optional refinements. Identify tasks that can proceed in parallel without violating genuine completion dependencies (DEC-092). Suggest feasible near-term target dates, identify capacity bottlenecks, and distinguish achievable acceleration from speculative estimates. Present impossibilities as explicit risks or unresolved conflicts, not invented feasible dates.

**Alternatives and scope reduction:** Where an original template step is impractical, offer clearly labeled alternatives such as a simpler invitation approach, reduced optional preparation, or alternative supplier-search workflows. Explain tradeoffs and downstream effects. Never silently delete a task, cancel an agreement, alter an external commitment, or represent a suggested workaround as confirmed. Retain user choice to keep, modify, skip, or replace optional work, subject to permissions and safeguards.

**Guided approval and protection:** Present an impact-based preview grouping urgent decisions first and routine proposals afterward. Allow individual approval, modification, rejection, and safe bulk acceptance of compatible suggestions. Preserve confirmed dates, hard deadlines, supplier bookings, payments, and completed work unless explicitly and validly changed. Reuse DEC-065–DEC-067, DEC-093–DEC-095 for rescheduling, dependencies, and provenance. Unapproved proposals do not change active tasks or commitments.

**Progress, warnings, and communication:** Explain why dates were compressed, which tasks are critical, which original target dates were superseded as recommendations, and which conflicts still require decisions. Avoid flooding a new wedding with overdue alerts for template dates that predate its creation. Once users approve a feasible plan, normal reminders, escalation, quiet hours, and permissions apply. Preserve a distinct warning for an actual missed binding deadline or confirmed commitment.

**Audit and acceptance criteria:** Record the planning horizon, template assumptions, proposed adjustments, approvals, rejected suggestions, remaining risks, and later revisions. Acceptance requires that (1) a four-month planning horizon does not create automatic overdue tasks for ten- or twelve-month template recommendations; (2) essential bookings and blockers appear first; (3) infeasible or binding deadlines remain visible rather than silently shifted; (4) users can approve a subset of compressed dates and alternatives; (5) protected commitments are never overwritten by automation; and (6) the resulting timeline remains connected to dependencies and risk-based follow-up.

**Follow-up:** Decide how tasks should be prioritized and presented to couples and professionals in a compressed timeline, including which work is essential versus optional.

### DEC-097 — Adaptive task importance with user control

**Status:** Approved  
**Decision:** Option C — Classify wedding-planning tasks as **Essential**, **Recommended**, or **Optional**, with context-aware suggestions that take account of wedding details, remaining planning time, dependencies, and the couple’s preferences. Authorized users can review and customize classifications, but genuinely mandatory legal, contractual, safety, approval, or other binding requirements cannot be made optional merely by relabeling a task.

**Meaning of classifications:** Essential identifies work necessary to deliver the wedding as planned or meet a confirmed obligation; Recommended identifies useful work that improves readiness or experience but can often be simplified; Optional identifies discretionary enhancements that can be skipped without compromising essential outcomes. These classifications describe *necessity*, not urgency, risk severity, task status, or priority. An Optional task can still be urgent if the couple deliberately commits to it; an Essential task need not be due immediately.

**Adaptive suggestions:** Seed classifications from the selected planning template and wedding characteristics (DEC-056–DEC-063), then consider the event format, confirmed services, available planning horizon, prerequisite relationships, and stated preferences. A live band may be Essential for a couple committed to live music but Optional for another. For short-notice weddings (DEC-096), surface essential and blocking work first, suggest deferring or simplifying nonessential work, and explain why classifications or proposed scope changes are recommended. Do not presume a supplier is booked or that a task is legally mandatory without supporting context.

**User control and protected requirements:** Allow eligible couples and planners to accept, adjust, or reject suggested classifications individually and in safe groups, with a preview of downstream effects. A user may make a discretionary task Essential to reflect personal priorities. Conversely, relabeling a genuinely binding requirement must not remove its underlying obligation, prerequisite, deadline, approval, or warning; where a requirement cannot safely be treated as optional, explain the constraint and offer an appropriate alternative or review workflow. Apply existing wedding and organization permissions and protect private planner-only details.

**Task views and interaction:** Show approachable importance labels and clear reasons in couple-facing views; professional views may include filters, grouping, and rationale. Keep importance separate from canonical task statuses (DEC-090), waiting reasons, deadlines (DEC-094), risk-based alerts, and dependency enforcement (DEC-092–DEC-093). Skipping an Optional task requires an explicit user action and should use the established cancellation/not-needed workflow rather than silently deleting the task or marking it Completed. If an Optional task becomes necessary because of a new commitment or dependency, flag it for review.

**Change impact and audit:** Reassess suggested classifications when wedding plans, contracts, dependencies, or timing materially change; propose changes rather than silently overriding user-approved importance. Preserve who classified or reclassified a task, whether it was template-derived or user-chosen, supporting rationale, and any resulting approved changes. Do not silently modify bookings, payments, completed work, or external obligations.

**Acceptance criteria:** (1) A four-month wedding plan clearly prioritizes Essential work without making all historically recommended dates overdue; (2) the same entertainment task can be Optional for one wedding and Essential for another; (3) a user can adjust a discretionary task's importance without changing its status or deadline; (4) a binding supplier or legal requirement cannot be made harmless by selecting Optional; (5) skipped Optional work remains auditable and does not silently disappear; (6) new dependencies or commitments can prompt a review of previously approved importance.

**Follow-up:** Decide whether and how optional tasks should be hidden or removed from the active timeline when couples simplify their plan.

### DEC-098 — Guided simplification with reversible skipping of optional tasks

**Status:** Approved  
**Decision:** Option C — Allow authorized couples and planners to select Optional tasks to skip individually or in compatible groups. Skipped tasks leave the active planning timeline but remain discoverable in a separate **Skipped / Not needed** section, with history intact and an explicit restoration path. Before skipping, assess dependencies, assignments, approvals, deadlines, and any existing commitments; do not let simplification silently discard required work.

**Selection and preview:** Offer a guided simplification flow from task lists, templates, and short-notice planning recommendations. Explain which tasks are proposed for skipping and why, allow users to deselect or adjust them, and preview the number of active tasks removed and any downstream consequences. Bulk skipping applies only to independently safe tasks; tasks requiring distinct approvals, commitment review, or dependency resolution must be handled individually. Suggestions alone never skip work.

**Status and visibility:** Skipping is a deliberate *not-needed* disposition, not task completion or deletion. Reuse the canonical **Cancelled** task status (DEC-090) with a structured reason such as **Skipped — optional / not needed**, rather than inventing a seventh status. Preserve the task's Optional classification (DEC-097) separately from its status. Exclude skipped tasks from ordinary active progress counts, upcoming reminders, and the default timeline, but make them accessible through a clearly labeled section and filters. Do not erase earlier work or portray skipped tasks as successfully completed. Users with access may inspect the reason, original dates, attachments, and history.

**Dependency and commitment safeguards:** Before skipping, check whether the task is a prerequisite for retained work, has unresolved approvals, is tied to a confirmed supplier, payment, contract, legal/safety requirement, or other binding obligation, or is already completed. Clearly explain the consequence and block unsafe skipping until a valid alternative, explicit authorized change, or required review is completed. Changing a task's classification to Optional cannot bypass these protections (DEC-092, DEC-093, DEC-097). Never cancel an external booking, modify a payment, or notify a supplier automatically merely because a planning task was skipped.

**Restoration and reassessment:** Eligible users may restore a skipped task to the active plan with an appropriate status, subject to contextual transition safeguards (DEC-091). Show a review of dates, dependencies, assignees, and feasibility before restoration, especially if the wedding date is near or other tasks have changed. Do not automatically reinstate obsolete dates or reverse completed actions. If new circumstances make a skipped task necessary, surface a targeted recommendation or warning and offer restoration rather than silently changing its status.

**Permissions, communication, and audit:** Apply existing couple/planner permissions and task ownership rules. Notify relevant authorized assignees or collaborators when skipping or restoration materially affects their work, subject to established notification preferences. Record the actor, time, reason, affected tasks, previewed conflicts, approved exceptions, and restoration history. Preserve the original template provenance and any prior task progress.

**Acceptance criteria:** (1) A couple can skip several independent Optional decoration tasks in one reviewed action; (2) skipped tasks disappear from the default active timeline but remain accessible and restorable; (3) skipped tasks are not counted as Completed; (4) a task linked to a confirmed contractual obligation cannot be skipped as a shortcut around that obligation; (5) retained tasks with skipped prerequisites receive a clear impact review; (6) restoring a task prompts a feasible schedule review; (7) permissions and audit history survive both actions.

**Follow-up:** Decide how the platform should calculate and present overall planning progress when tasks are skipped, cancelled, blocked, or optional.

### DEC-099 — Separate task completion from wedding readiness

**Status:** Approved  
**Decision:** Option C — Present **task completion** and **wedding readiness** as distinct indicators. Task completion measures the share of applicable tasks actually completed; readiness communicates whether the wedding is on track based on essential milestones, unresolved critical issues, hard deadlines, and dependencies. Never present a high completion percentage as proof that the wedding is ready.

**Task completion calculation:** Calculate `completed applicable tasks / (completed applicable tasks + unfinished applicable tasks) × 100`. Applicable tasks include work still part of the approved wedding plan, regardless of Essential, Recommended, or Optional importance. Exclude tasks deliberately skipped as not needed and other genuinely cancelled tasks from both numerator and denominator, while keeping their counts visible in a breakdown. Completed tasks count as completed only if their canonical status is Completed (DEC-090); Waiting, Blocked, Not Started, and In Progress are unfinished. A cancelled task is not completed, and skipping tasks must never artificially inflate the completed-task count. If no applicable tasks exist, display **No active tasks** rather than 100% complete. Display the numerator and denominator alongside the percentage, and explain why it may change when the plan changes.

**Readiness indicator:** Provide a separate, clearly labeled wedding-readiness assessment considering at minimum (1) essential milestones and required arrangements, (2) open critical issues and verified mitigations, (3) missed or imminent hard deadlines, (4) blocked completion-critical dependencies, and (5) relevant wedding proximity. Use explainable qualitative states or clearly justified assessments rather than inventing a deceptively precise readiness percentage. The exact state taxonomy, thresholds, and whether a numeric score is appropriate remain open for DEC-100. A wedding with many completed optional tasks but an unconfirmed essential venue must not be labeled fully ready. Conversely, unfinished discretionary tasks need not imply a critical readiness risk.

**Presentation:** The couple dashboard displays an approachable task-completion percentage with an adjacent distinct readiness status, its main reasons, and actionable next steps. Professional dashboards can additionally expose counts by status and importance, upcoming hard deadlines, unresolved dependencies, and affected weddings. Keep both indicators aligned with the same permission-controlled underlying task and issue records. Readiness explanations must not leak private planner records or information a viewer lacks permission to access.

**Change handling and safeguards:** Recalculate task completion when applicable tasks are added, completed, reopened, restored, skipped, or cancelled; distinguish genuine completed work from scope reduction. Reassess readiness after meaningful changes to milestones, commitments, issues, deadlines, dependencies, wedding date, or verified mitigations (DEC-065–DEC-085, DEC-092–DEC-098). Avoid double-counting merged issues or dependent tasks. Do not mark a wedding ready merely because all tasks are cancelled or no tasks were created. Readiness is decision support, not a guarantee of vendor performance, legal compliance, or event success.

**History and audit:** Preserve underlying task and issue history and record material changes to readiness drivers. Where historical trends are shown, make scope changes clear so a jump caused by skipping tasks is not misrepresented as completed work. Apply the existing notification, risk escalation, and privacy rules; the readiness indicator itself does not authorize new alerts or permissions.

**Acceptance criteria:** (1) With 45 Completed, 25 unfinished applicable, 20 Skipped, and 10 other Cancelled tasks, completion shows **45/70 ≈ 64%**, not 45% or 75%; (2) a critical unconfirmed venue prevents a misleading ready assessment even when completion is high; (3) skipped work remains excluded from completion and visible in the breakdown; (4) adding or restoring applicable tasks recalculates completion transparently; (5) an empty applicable plan is not shown as 100% complete; (6) couples see a clear readiness explanation and professional users can inspect authorized underlying drivers.

**Follow-up:** Decide the wedding-readiness indicator's presentation and levels without conflating it with task-completion percentage.

### DEC-100 — Qualitative wedding-readiness levels with actionable insights

**Status:** Approved  
**Decision:** Option C — Display a separate, explainable wedding-readiness assessment using the qualitative levels **On Track**, **Needs Attention**, **At Risk**, and **Critical**. Accompany each level with the most important reasons and prioritized actions; do not present a false-precision readiness percentage. Task-completion percentage remains separate under DEC-099.

**Meaning of levels:** **On Track** means no known material threat to essential wedding arrangements or required deadlines given the information recorded, not a guarantee of success. **Needs Attention** indicates manageable outstanding matters that deserve follow-up but are not presently assessed as a major threat. **At Risk** indicates meaningful unresolved threats to an essential milestone, dependency, commitment, or deadline that require timely intervention. **Critical** indicates a confirmed or strongly supported severe threat to wedding viability or an essential arrangement, especially with little recovery time. The platform must not classify a wedding as On Track solely because most tasks are complete or no issues have been entered.

**Evidence and prioritization:** Assess essential milestones, verified supplier commitments, unresolved issues and mitigations, hard deadlines, completion-critical dependencies, and time until the wedding, consistent with DEC-070–DEC-085 and DEC-092–DEC-099. Identify the strongest drivers of the current level, distinguish confirmed facts from missing or uncertain information, and prioritize concrete next actions with links to accessible tasks, issues, and responsible people. Avoid double-counting duplicate or merged issues (DEC-086–DEC-088). An unconfirmed essential venue near the wedding must be capable of driving At Risk or Critical even with high task completion; a pending optional decoration task alone should not.

**Experience and accessibility:** Show the current level with a plain-language label, concise explanation, and prioritized actions on the couple dashboard. Professional planners may inspect a more detailed, permission-filtered breakdown by risk driver, wedding, owner, and deadline. Do not rely on color alone; use accessible text and icons. If there is insufficient information to make a defensible assessment, explicitly say **Not enough information** as an assessment-availability state rather than implying On Track or inventing a fifth risk level. Show when readiness was last assessed where useful.

**Change handling:** Reassess when material underlying information changes, including supplier cancellation, verified mitigation, milestone completion, hard-deadline change, dependency invalidation, wedding-date change, or issue reopening. Escalate or downgrade according to current supported risk; acknowledgement alone cannot erase an active critical warning (DEC-080–DEC-085). Suggestions and readiness labels must not automatically alter contracts, payments, task status, or user permissions. Respect notification preferences, quiet hours, authorized escalation, and existing audit rules.

**Transparency and safeguards:** Provide a short explanation of why the level changed and preserve material assessment drivers in the history. Make clear that readiness is guidance based on recorded information, not a certification, legal-compliance determination, or guarantee of event success. Do not reveal private planner notes or inaccessible records to couples or other viewers. The exact threshold calibration and risk-driver weighting remain product-detail questions to validate, not assumed precise numerical scoring.

**Acceptance criteria:** (1) A wedding with 85% task completion and a critical unconfirmed venue does not show On Track; (2) the dashboard shows a named level and at least one relevant actionable reason when concerns exist; (3) verified mitigation can lower a risk level while preserving issue history; (4) an empty or insufficiently populated plan is not automatically On Track; (5) couples and professionals see appropriately scoped explanations from the same underlying assessment; (6) accessibility does not depend on colors; (7) readiness never appears as a second numerical completion percentage.

**Follow-up:** Decide how readiness should be broken down into planning categories alongside the overall qualitative level.

### DEC-101 — Overall readiness with adaptive category insights

**Status:** Approved  
**Decision:** Option C — Present one overall qualitative wedding-readiness level (DEC-100) together with an adaptive breakdown of relevant planning categories. Categories reflect the actual wedding plan rather than a mandatory fixed checklist; couples see an approachable overview and professional planners can inspect more detailed, permission-scoped factors and actions.

**Category selection and structure:** Start from understandable areas such as venue and ceremony, suppliers, guests and invitations, budget and payments, timeline and dependencies, and wedding-day logistics. Show only categories that apply to the wedding's arrangements, selected activities, and confirmed obligations. Adapt labels and grouping where helpful, without silently removing a category that contains a binding obligation, material unresolved risk, or required action. A category that is genuinely not applicable should be marked as such or omitted with an understandable explanation; absence of records alone must not be treated as proof that the category is unnecessary.

**Category assessment:** Each applicable category uses the same qualitative vocabulary as overall readiness — On Track, Needs Attention, At Risk, or Critical — with **Not enough information** when evidence is insufficient. Explain its strongest drivers and prioritized next actions, linking to accessible tasks, issues, milestones, supplier commitments, deadlines, and dependencies. Avoid numeric readiness percentages and do not conflate category readiness with task-completion percentages. A category can be On Track while another is Critical; the overall level must remain consistent with material cross-category threats and cannot conceal a severe essential risk through averaging.

**Couple and professional experiences:** On the couple dashboard, show the overall level first, then a compact set of relevant category indicators with concise explanations and drill-down actions. Professional planners can view a richer authorized breakdown across categories, risk drivers, responsible owners, deadlines, and weddings. Preserve one shared underlying assessment, with role-appropriate presentation rather than separate contradictory readiness systems. Allow users to understand which actions will most improve readiness without overwhelming them with minor optional tasks.

**Updates and cross-category effects:** Reassess affected categories and the overall level when wedding details, supplier commitments, guest decisions, budgets, dependencies, deadlines, issues, or verified mitigations change. A single problem may affect multiple categories but must not be double-counted or produce conflicting action records. Changes in a category's applicability require an understandable review where obligations or existing work could be affected. Do not silently modify external commitments, payments, or task status as a side effect of readiness calculation.

**Permissions, transparency, and accessibility:** Apply wedding, planner-organization, and record-level access rules to both the category breakdown and its supporting explanations. Do not reveal private planner notes or inaccessible supplier/financial records through category labels or action links. Provide textual status labels and explanations rather than relying on color alone. Where evidence is missing or uncertain, say so; readiness remains guidance based on recorded information, not a guarantee. Preserve material readiness changes and supporting factors in audit/history records consistent with DEC-099 and DEC-100.

**Acceptance criteria:** (1) A wedding without an entertainment program does not display an irrelevant entertainment-readiness warning; (2) a critical venue issue remains prominent overall and in the appropriate category despite healthy progress elsewhere; (3) a category with no evidence is not automatically On Track; (4) couples and professionals receive consistent levels with appropriately different detail; (5) actions link only to records each viewer may access; (6) reassessment follows material changes and preserves history; (7) the interface remains comprehensible without color or numerical readiness scores.

**Follow-up:** Decide how much control users should have over the category breakdown itself, including renaming, grouping, or adding planning categories without undermining shared assessment consistency.

### DEC-102 — Flexible planning categories with system safeguards

**Status:** Approved  
**Decision:** Option C — Authorized users may create, rename, reorder, and group wedding-planning categories, while the platform protects underlying task, issue, obligation, and readiness integrity. Couples and professional planners share the same wedding category structure subject to permissions, rather than maintaining disconnected classification systems.

**Customization:** Offer meaningful starter categories adapted to the wedding, and allow authorized users to add custom categories for events such as welcome dinners, travel and accommodation, multiple ceremonies, and receptions. Permit renaming, reordering, and grouping categories; preserve stable underlying record identities when labels or hierarchy change. Category customization is organizational, not a mechanism for rewriting historical facts or changing a contractual commitment.

**Readiness and risk integrity:** Continue to calculate overall and category readiness using the actual accessible planning records, essential milestones, dependencies, deadlines, and unresolved risks (DEC-099–DEC-101). A renamed, moved, grouped, or hidden category cannot suppress a critical warning, eliminate a required action, or make an obligation non-applicable. Recompute affected breakdowns after approved changes and avoid counting the same issue multiple times in an aggregate assessment. If a new category lacks sufficient information, display Not enough information rather than On Track.

**Guided structural changes:** When users move tasks/issues between categories, combine categories, or reorganize groups, preview affected records, linked actions, category-level readiness, and any permission or visibility consequences. Require explicit confirmation for consequential changes; block or flag operations that would strand mandatory obligations, break dependencies, or expose restricted information. Category deletion/archiving and record-reassignment rules remain a follow-up decision; do not assume destructive deletion is allowed.

**Access and presentation:** Respect wedding-level and organization-level permissions for editing category structure and underlying records. Couple and professional dashboards may present different levels of detail but reflect the same authorized wedding structure and consistent readiness drivers. A custom category name must not disclose private planner information to users without access. Preserve accessibility, readable labels, and a navigable hierarchy on mobile and desktop.

**Audit and reversibility:** Record who created, renamed, reordered, grouped, or materially reorganized categories, along with affected records and relevant before/after states. Provide appropriate recovery or correction paths for accidental changes without silently reversing supplier, payment, or legal commitments. Maintain original references in historical reports.

**Acceptance criteria:** (1) A destination wedding can add Travel & Accommodation and Welcome Dinner; (2) a category rename does not change task ownership or issue severity; (3) moving a critical venue issue cannot make overall readiness appear On Track; (4) a proposed grouping that exposes restricted data is blocked or appropriately scoped; (5) users can preview consequential moves; (6) category history remains traceable; (7) custom empty categories are not automatically marked On Track.

**Follow-up:** Decide how to handle deleting or archiving a customized category that still contains tasks, issues, or confirmed commitments.

### DEC-103 — Guided category removal with safe alternatives

**Status:** Approved  
**Decision:** Option C — When an authorized user wants to remove a planning category that contains records, present a guided impact review and offer safe alternatives: archive the category, move appropriate records into other categories, and/or cancel genuinely unnecessary tasks. Protect existing obligations and unresolved risks from accidental removal.

**Entry and impact preview:** Show the category's active and completed tasks, skipped/cancelled tasks, issues, supplier conversations, documents, linked bookings, financial commitments, dependencies, and category-readiness implications, subject to the viewer's permissions. Distinguish records that can safely be reorganized from those requiring follow-up or additional authorization. Explain that removing a category is not the same as cancelling an external service or agreement.

**Available actions:** (1) **Archive** the category and retain its records and history in a discoverable, restorable archive; outstanding issues, commitments, deadlines, and critical warnings must continue to surface in appropriate active dashboards and escalations. (2) **Move** eligible records to another existing or newly created category, preserving identity, ownership, history, dependencies, and permissions. (3) **Cancel/skip** genuinely unnecessary tasks through the existing justified Cancelled/Skipped workflow (DEC-090, DEC-091, DEC-098), subject to dependency and commitment safeguards. Allow a guided combination of actions for different records. An empty category may be removed without a complex review, while retaining required audit history.

**Commitment and risk safeguards:** Never silently delete or cancel supplier bookings, contracts, deposits, payments, legal obligations, unresolved critical issues, or records needed for financial/accountability history. A tentative booking must be reviewed explicitly rather than presumed cancelled; where cancellation or vendor notification is needed, create or retain a visible follow-up and require authorized confirmation of any external action. If records cannot safely be archived or reassigned, block completion of the removal and explain the outstanding action. No category operation may hide critical risk or cause a misleading improvement in wedding readiness (DEC-099–DEC-102).

**Permissions, confirmation, and recovery:** Only authorized users can initiate and confirm structural removal or archive operations. Show a before/after summary of active categories, affected records, unresolved follow-ups, and readiness impact. Require explicit confirmation for consequential changes. Preserve references and audit history; permit restoration of archived categories and correction of record assignments without pretending that an already executed external cancellation can be undone. Notify affected collaborators when responsibilities or visible organization materially change, subject to notification preferences.

**Acceptance criteria:** (1) Removing Welcome Dinner with tasks, supplier correspondence, and a tentative restaurant booking shows each affected item; (2) users can archive, move, or cancel eligible records individually or in a compatible guided batch; (3) a confirmed contract or deposit cannot disappear or be automatically cancelled; (4) archived unresolved critical issues remain actionable and influence readiness; (5) permissions and record privacy are respected; (6) restoration preserves original record identity and history; (7) the operation has an auditable before/after record and does not silently alter external commitments.

**Follow-up:** Decide how users should organize tasks within a planning category, including optional subcategories or nested task groups.

### DEC-104 — Flexible task groups with limited nesting

**Status:** Approved  
**Decision:** Option C — Organize tasks within wedding-planning categories using flexible, collapsible task groups and a small, bounded number of nesting levels. Offer sensible starter groups, manual reordering, and a simplified couple-facing view alongside more detailed professional-planner controls. Unlimited recursive nesting is not supported.

**Structure and defaults:** Categories remain the wedding's shared top-level planning organization (DEC-102). Within a category, authorized users can create, rename, reorder, collapse, and reorganize groups, with a limited hierarchy that is easy to navigate on mobile and desktop. Starter templates may suggest groups for common areas (for example Suppliers → Photography, Catering, Entertainment) but do not require them. The exact maximum nesting depth is an implementation-level usability decision to validate, not permission for unlimited depth. Tasks remain first-class records with stable identity regardless of placement; group headers are organizational containers, not independent tasks or implicit completed milestones.

**Couple and planner experiences:** Couples see concise, collapsible sections, clear task counts, progress and next actions, with deeper structure revealed only when helpful. Professional planners can use the same shared hierarchy with richer sorting, filtering, bulk selection, drag-and-drop or accessible move controls, and assignment/status information according to permissions. Both views update the same records; personal collapse preferences may differ without altering the shared category/group structure. Search and filters must find tasks inside collapsed groups.

**Reorganization safeguards:** Moving a task or group requires appropriate authorization and must preserve task status, importance, start/target/hard deadlines, ownership, comments, attachments, dependencies, supplier links, approvals, and history (DEC-089–DEC-103). Preview consequential bulk moves, cross-category changes, and moves that affect readiness or visibility. Prevent cycles in the group hierarchy and reject moves that exceed the supported nesting limit. Reorganization cannot silently resolve blocked work, erase unresolved critical issues, bypass required approvals, or change confirmed external commitments. A group cannot be used to conceal records from authorized readiness and risk assessments.

**Empty groups, archiving, and deletion:** Empty groups may be removed with suitable audit history. When a group contains tasks or linked records, require a guided choice to move its contents, retain them in an accessible archive, or apply existing justified cancellation/skipping rules where appropriate. Do not cascade-delete tasks, contracts, financial records, or unresolved issues. Preserve the distinction between removing organizational structure and changing the underlying wedding plan, consistent with DEC-098 and DEC-103.

**Accessibility and traceability:** Support keyboard and non-drag alternatives to reordering, clear hierarchy labels, mobile navigation, and understandable breadcrumbs. Preserve audit history for material moves, including actor, origin/destination, and affected records; notify collaborators when responsibilities or relevant visibility materially change under existing notification preferences.

**Acceptance criteria:** (1) A Suppliers category can contain collapsible Photography, Catering, and Entertainment groups; (2) a couple can browse tasks without managing the full professional hierarchy; (3) a planner can reorder or move tasks without losing ownership, deadlines, evidence, or dependencies; (4) nested groups cannot form cycles or exceed the supported depth; (5) a critical issue remains visible and affects readiness when its related task is moved into a collapsed or archived group; (6) removing a populated group triggers safe disposition of its contents rather than deletion; (7) keyboard users can reorganize without drag-and-drop.

**Follow-up:** Decide whether individual tasks should support subtasks and checklists, and how subtask completion affects the parent task.

### DEC-105 — Lightweight checklists and structured subtasks

**Status:** Approved  
**Decision:** Option C — Individual wedding-planning tasks support both lightweight checklist items for simple steps and structured subtasks when independent assignment, scheduling, status, or dependencies are required. The parent task displays progress but is never automatically completed solely because its children are checked off; explicit parent completion and all mandatory completion/approval conditions remain necessary.

**Two levels of detail:** A checklist item is a concise action with a completion checkbox, optional short description, and preserved author/completion history; it does not independently acquire an owner, deadline, canonical task status, or escalation workflow. A structured subtask is a first-class work item linked to its parent, with its own eligible assignee, the six canonical statuses and Waiting reasons (DEC-090), optional planned start/target/hard deadline (DEC-094), and appropriate dependencies, evidence, comments, and permissions. Users can choose the simpler checklist by default and promote an item to a structured subtask through a guided operation that preserves history. Do not create unlimited nested subtasks; any further nesting must respect the limited-hierarchy principles of DEC-104 and be separately specified if necessary.

**Parent progress and completion:** Show a transparent breakdown of completed checklist items and completed applicable subtasks, excluding items explicitly cancelled/skipped under approved rules without representing them as work done (DEC-098–DEC-099). Checklist progress is an aid, not an independent readiness score. The parent retains its own canonical status and responsible owner. Finishing all children does not automatically set the parent to Completed: an authorized person must explicitly confirm completion, and required approvals, blocking prerequisites, verified supplier commitments, or other applicable acceptance conditions must be satisfied (DEC-091–DEC-093). Conversely, a parent cannot be marked Completed while mandatory incomplete child work remains unless a permitted, justified exception or valid cancellation is recorded. Optional unfinished checklist items need not block parent completion unless explicitly designated mandatory.

**Delegation and visibility:** Structured subtasks may be delegated to eligible collaborators according to existing role, assignment, and access rules (DEC-007, DEC-041–DEC-046, DEC-069). Checklist items do not create implicit individual accountability. Couple-facing views present a simple expandable checklist and summarized subtask progress; professional views expose detailed assignees, waiting reasons, deadlines, blockers, and dependencies where authorized. Private planner notes and organization-only work must not leak through parent progress labels or notifications.

**Changes and safeguards:** Creating, moving, converting, skipping, reopening, or deleting child items must not silently alter contractual commitments, financial records, mandatory approvals, parent completion, or unrelated work. Reopening a mandatory completed subtask or invalidating its prerequisite triggers guided reassessment of an already-completed parent rather than silently reversing completion (DEC-084–DEC-085, DEC-093). Detect and prevent circular task/subtask dependencies. Archive or reorganize children through the same guided preservation rules used for categories and groups (DEC-103–DEC-104). Preserve authorship, original timestamps, assignments, and audit history through conversion and reorganization.

**Acceptance criteria:** (1) Book Photographer can contain five lightweight checklist steps; (2) Request quotations can be promoted to a structured subtask with its own owner and target date; (3) completion of all five checklist items does not auto-complete Book Photographer; (4) an outstanding mandatory contract-signing subtask blocks parent completion unless an authorized justified exception applies; (5) skipped optional steps do not inflate completed-work percentages; (6) a couple sees simple progress while a planner sees detailed authorized subtask information; (7) reassessment occurs when a completed parent depends on a subsequently reopened mandatory subtask; (8) conversion and status changes preserve permissions and audit history.

**Follow-up:** Decide how checklist and subtask templates should be offered when users create or expand a task.

### DEC-106 — Smart checklist and subtask suggestions with reusable custom templates

**Status:** Approved  
**Decision:** Option C — Suggest relevant lightweight checklists and structured subtasks based on task type, wedding details, selected planning complexity, and existing plan context. Users choose whether to accept, customize, or skip the suggestions. Authorized professional planners can save and reuse their own task-breakdown templates across weddings without exposing private client information.

**Suggestion experience:** When a user creates or expands a task, offer an optional, previewable suggested breakdown rather than automatically adding work. For example, Book Wedding Photographer may suggest research, quotation requests, comparisons, booking confirmation, and contract signing. Clearly label which entries are checklist items and which are structured subtasks, and explain relevant suggestions where helpful. Suggestions should adapt to short-notice weddings and existing tasks, avoid irrelevant steps and duplicates, and never claim that a suggested checklist satisfies a legal or contractual requirement without confirmation.

**Guided acceptance and editing:** Allow individual selection, select-all/deselect-all, editing titles and details, converting an eligible checklist item into a structured subtask, and skipping any non-mandatory suggestion. Before creating selected structured subtasks, preview proposed owners, dates, dependencies, importance, and any required approvals; reuse DEC-064, DEC-091–DEC-096, and DEC-105 safeguards. No suggestion is treated as completed, confirmed, assigned, or contractually binding merely because it was offered or accepted. If a proposed prerequisite or mandatory item conflicts with an existing plan, explain and request a safe decision rather than silently modifying records.

**Reusable professional templates:** Authorized professional planners can save a chosen breakdown as a reusable template, give it a descriptive name, edit and version it, and apply it to another eligible wedding through the same review-and-confirm flow. Templates may be personal or organization-shared, with organization publication, use, editing, and versioning governed by DEC-107. Template copies must not include source-wedding names, private couple data, personal contact details, supplier communications, attachments, confidential prices, or access grants. Templates may contain generic placeholders for such details, but applying one never imports private records from another wedding.

**Consistency and safeguards:** Preserve the parent task's explicit completion rules (DEC-105). Applying a template must not duplicate existing mandatory tasks, silently assign ineligible people, overwrite existing deadlines, create circular dependencies, or alter confirmed supplier/financial commitments. A template's later edits do not silently rewrite instances already added to weddings. Permission-aware previews prevent exposing planner-private details to couples or other unauthorized users. Preserve provenance and audit records for who applied or edited templates and which suggestions were accepted, changed, or skipped.

**Acceptance criteria:** (1) Creating Book Wedding Photographer can offer a relevant mixed checklist/subtask breakdown; (2) a couple can accept three suggested steps, edit one, and skip the rest; (3) structured subtask dates and owners require eligible, guided confirmation; (4) applying the same template twice identifies duplicates rather than blindly creating them; (5) a planner can save and reuse a generic template without copying couple-specific data; (6) organization-private templates are inaccessible to unauthorized people; (7) updating a saved template does not silently modify existing wedding tasks; (8) parent completion and approval safeguards remain effective.

**Follow-up:** Decide how personal and organization-shared professional templates should be owned, shared, and governed.

### DEC-107 — Personal and organization template libraries with permissions

**Status:** Approved  
**Decision:** Option C — Professional planners may maintain personal task-breakdown templates and submit or share selected templates with their planner organization. Authorized organization managers govern organization-wide templates; eligible employees may discover and apply approved shared templates. Shared templates are versioned, and existing wedding task instances never change automatically when a template is updated.

**Library ownership and visibility:** Each template has an explicit owner and scope: personal or organization. Personal templates are visible and editable by their owner unless deliberately shared through an authorized workflow. Organization templates belong to the organization rather than an individual employee and are accessible only to members with the relevant permission. A planner can propose a personal template for organization use without transferring ownership of the personal original; publication creates an organization-governed version or copy with clear provenance. Do not expose organization-private templates to couples, other planner organizations, or unauthorized staff.

**Governance and roles:** Authorized organization managers, or staff explicitly delegated template-management permission, may approve publication, edit or retire organization templates, set eligibility for use, and review version history. Eligible employees can browse, preview, and apply approved organization templates to weddings they are authorized to manage; mere permission to use a template does not grant permission to edit or publish it. Where employee contributions are allowed, proposals enter a review flow rather than overwriting the organization's approved template. Apply existing organization role and audit principles (DEC-005–DEC-006, DEC-041–DEC-046).

**Versioning and application:** Maintain immutable published versions or an equivalent traceable version history with change summaries, author, publication status, and timestamps. Show which version will be applied and permit an authorized user to review suggested checklist items, subtasks, owners, dates, dependencies, and mandatory steps before creating records (DEC-105–DEC-106). Editing or retiring a shared template affects future use only; it does not silently modify, delete, or reassign any existing wedding tasks. Where a newer version is available, the platform may offer an optional guided comparison and selective update for existing weddings, subject to their owners' permissions and protected commitments; automatic propagation is prohibited.

**Lifecycle and privacy safeguards:** When a planner leaves an organization, personal templates remain subject to their personal ownership and organization templates remain with the organization. Do not let removal of a staff member break already-created wedding tasks. Sharing, copying, publishing, exporting, or updating templates must strip or reject private client details, supplier conversations, personal contact information, confidential pricing, attachments, and access grants; use generic placeholders where appropriate. Prevent cross-organization leakage, duplicate work, invalid assignments, dependency cycles, and accidental override of confirmed commitments. Material publishing, access, and version actions must be auditable.

**Acceptance criteria:** (1) A planner creates and privately uses a personal photographer-booking template; (2) they submit it for organization publication without exposing client information; (3) a manager approves a shared version that eligible coworkers can preview and apply; (4) a coworker cannot edit the shared version without template-management permission; (5) publishing a revised version does not change wedding tasks already created from the old version; (6) a retired template remains traceable for audit and historical task provenance but is unavailable for new application; (7) organization templates remain available when their original author leaves; (8) an employee of another organization cannot access the library.

**Follow-up:** Decide how updates to shared templates should be communicated to planners who previously applied older versions.

### DEC-108 — Guided updates for templates already used in weddings

**Status:** Approved  
**Decision:** Option C — When an organization publishes a new version of a reusable task/checklist/subtask template, the platform informs eligible planners about meaningful changes and offers a guided, optional comparison and selective application to existing weddings. No published template version automatically changes an existing wedding's tasks, checklist items, assignments, deadlines, dependencies, approvals, or commitments.

**Update discovery and relevance:** Track which template and immutable published version were used to create each task breakdown, including the wedding and task provenance. Notify only eligible staff with relevant wedding responsibility and template access when a meaningful newer version becomes available; avoid repetitive notices for unrelated weddings, insignificant changes, or versions already reviewed. Provide an organization-level view of affected weddings where permissions permit. Show version identifiers, publication dates, a plain-language change summary, and whether an update has been reviewed, partly applied, deferred, or declined. A template update is a recommendation, never a new wedding obligation merely because it was published.

**Guided comparison and selective application:** Show the old applied version, the new published version, and the current wedding-specific task state side by side or in an equivalent accessible comparison. Distinguish added, edited, removed, and unchanged checklist items/subtasks, and identify local customization. Allow authorized users to select individual compatible additions or edits, or a safe group of changes, preview their exact effects, and explicitly confirm. Never treat template deletions as instructions to delete wedding records; any removal or cancellation must follow existing guided safeguards. Respect the parent task's completion rules and the user's ability to reject suggestions (DEC-105–DEC-106).

**Conflicts and safeguards:** Preserve completed work, local modifications, existing assignees, target dates and hard deadlines, dependency chains, approvals, supplier arrangements, contracts, deposits, payments, and unresolved issues. Detect duplicates, incompatible statuses, circular dependencies, impossible dates, and changes affecting essential obligations. Block unsafe changes, explain conflicts, and offer an eligible manual resolution or skip; do not quietly overwrite local edits. Proposed new owners, dates, dependencies, or mandatory requirements must pass the usual authorization, feasibility, and confirmation checks. A near-term wedding may receive a higher-priority review suggestion, but its timing and commitments are never automatically rewritten. Existing risk/readiness assessments are reassessed only after actual confirmed changes.

**Permissions, privacy, and history:** Template managers may publish versions but do not thereby gain access to weddings they are not authorized to view or edit. Only wedding-authorized users can apply changes to that wedding, subject to existing task and organization permissions. Comparison screens must not reveal couple-private or planner-private records across roles or organizations. Preserve the applied version, selected/skipped changes, responsible actor, timestamp, reasons for consequential decisions, and links to resulting records. Retired templates and superseded versions remain available as restricted historical provenance, not for unauthorized new use.

**Acceptance criteria:** (1) Publishing two new photographer-booking steps does not alter any of 20 existing weddings; (2) eligible planners see a concise update and can identify which weddings used the older version; (3) a planner adds the backup-equipment step to one wedding while declining the delivery-timeline step; (4) a wedding with completed or locally modified subtasks retains that work and receives a clear conflict warning for incompatible edits; (5) the system prevents changes that would silently affect a signed contract or hard deadline; (6) users without access to a wedding cannot inspect or update its tasks through the template library; (7) a reviewed or declined version does not produce repetitive alerts; (8) an audit record identifies the source template version and exactly what changed.

**Follow-up:** Decide whether professionals should be able to maintain template-specific rules for which changes warrant notifications and whether critical safety-related template improvements need special treatment.

### DEC-109 — Risk-based notification of professional template updates

**Status:** Approved  
**Decision:** Option C — Notify relevant planners about published professional-template updates according to their verified relevance, potential impact, wedding proximity, and risk. Routine improvements belong in the template library or a consolidated digest; consequential changes receive targeted notices; substantiated critical safety or compliance concerns receive appropriately elevated attention under existing notification and escalation safeguards. A template update remains advisory until a wedding-authorized person reviews and applies it under DEC-108.

**Classification and relevance:** Assess each published version's actual changes, distinguishing editorial improvements, optional enhancements, important operational steps, and potential safety/compliance issues. Consider the wedding's location, applicable requirements, date, existing tasks and commitments, whether the changed step is relevant or already satisfied, and the severity and confidence of the claimed risk. Do not label every manager-marked update as critical or imply that generic template guidance is verified legal advice. Allow authorized publishers to supply a reason and supporting references, but independently validate the resulting notification classification against product safeguards; uncertain high-impact claims require qualified human review. A template update cannot itself establish that an existing wedding is unsafe or noncompliant without supporting wedding-specific evidence.

**Delivery and prioritization:** Show low-impact revisions in the library or a scheduled digest rather than creating individual interruptions. Send important, relevant changes to authorized wedding owners or assigned planners via the user's permitted notification channels and urgency preferences, with a clear affected-wedding context, summary of what changed, why it matters, and an action to compare versions. Escalate verified time-sensitive critical concerns through the existing critical-alert framework, respecting channel preferences, quiet-hours rules, deduplication, accessibility, and security exceptions already approved in DEC-070–DEC-084. Use near-term wedding proximity to prioritize *relevant* changes, not to invent urgency for irrelevant edits. Avoid repeated notifications for updates already reviewed, declined, superseded, or found inapplicable unless new material evidence changes the risk.

**Human control and separation of concerns:** Publishing, classifying, or notifying about an update must not automatically edit wedding tasks, assign responsibility, create contractual requirements, alter readiness, or mark a risk mitigated. Eligible wedding users decide whether to apply suggested steps using DEC-108's preview, conflict checks, selective acceptance, and explicit confirmation. If credible wedding-specific evidence establishes a genuine critical issue, create or link an appropriate actionable issue through the existing risk workflow, with clear ownership and verification; do not treat a template-version notice alone as a critical incident. Organization administrators may manage publication but may not bypass wedding permissions or unilaterally suppress essential in-app risk visibility.

**Privacy, audit, and accessibility:** Send only to people with legitimate access to the affected template and wedding; aggregate organization reporting must not leak couple-private records or cross-organization information. Record publication, classification rationale, supporting evidence, recipient eligibility, delivery attempts, review and disposition, and any separately confirmed wedding changes. Present urgency in words and accessible labels rather than color alone, and provide a concise explanation of the recommended next action.

**Acceptance criteria:** (1) A minor photography wording update appears in a library/digest without urgent alerts; (2) a relevant catering confirmation step for a wedding in two weeks reaches its eligible planner with a comparison action; (3) a substantiated venue safety concern is elevated only for weddings to which it may apply, with evidence and human review where uncertain; (4) a publisher cannot make a trivial update critical merely by selecting a label; (5) a planner who declines an inapplicable change is not repeatedly notified absent new evidence; (6) a notice never changes an existing wedding's tasks, commitments, or readiness automatically; (7) unauthorized colleagues cannot view affected weddings or receive their private details; (8) delivery honors the established quiet-hours, channel, deduplication, and critical-alert rules.

**Follow-up:** Decide how reusable templates should handle different geographic regions and legal or cultural wedding requirements without presenting generic suggestions as authoritative local advice.

### DEC-110 — Adaptive regional and cultural wedding-planning templates

**Status:** Approved  
**Decision:** Option C — Combine reusable core wedding-planning templates with optional regional, cultural, religious, and ceremony-specific planning modules. Recommend relevant modules from the wedding's locations, ceremony arrangements, and voluntarily provided preferences; allow multiple traditions and ceremonies to coexist. Clearly distinguish verified jurisdiction-specific requirements from optional recommendations and unverified guidance. Never represent generic suggestions as guaranteed legal compliance.

**Configuration and inclusion:** During guided setup and later editing, authorized users may specify the ceremony and celebration locations (which may differ), relevant administrative jurisdictions, wedding formats, number of events, languages, and optional cultural or religious traditions. All cultural and religious inputs are voluntary, editable, and never inferred from names, nationality, ethnicity, or other sensitive attributes. Offer a neutral universal starting point and show why a particular module is suggested. Couples and planners may combine, customize, decline, or remove optional modules without being forced into a single predefined tradition. Do not assume that a couple's residence determines the jurisdiction of a ceremony or destination event.

**Template composition:** Keep a reusable core task structure and attach independently selectable modules, such as local civil-ceremony preparations, destination travel logistics, multi-day events, or tradition-specific ceremonies. Preview suggested tasks, checklists, structured subtasks, dates, dependencies, and category placement before applying them, following DEC-055–DEC-066 and DEC-105–DEC-108. Identify duplicates or overlapping steps across modules and suggest a safe consolidation rather than creating conflicting obligations. Each applied task retains provenance to the source module and version. User customization and confirmed wedding commitments take precedence over later template updates unless an authorized user explicitly approves a safe change.

**Requirements versus advice:** Label each item clearly as a verified applicable requirement, an item requiring local verification, or an optional planning recommendation. A verified requirement must have a traceable authoritative source, applicable location and circumstances, last-review date, and stated limitations; where coverage is unavailable or uncertain, state that verification is needed rather than inventing a deadline or compliance guarantee. Legal or administrative requirements may depend on residency, citizenship, ceremony recognition, venue, officiant, or other facts not collected by the platform; provide a path to confirm with the competent authority or qualified professional. Do not claim that completion of suggested tasks certifies a legally valid marriage.

**Change management and risk:** Changing wedding location, ceremony type, or selected traditions triggers a guided impact review of affected templates, tasks, dependencies, hard deadlines, supplier commitments, and category readiness. New regional guidance is proposed rather than silently applied; existing obligations cannot disappear when a module is removed. Verified time-sensitive changes may warrant the established risk-based notification and escalation workflow (DEC-070–DEC-084 and DEC-109), but uncertainty is disclosed and must not be treated as verified noncompliance. Protect completed work and confirmed arrangements, and keep changes reversible where feasible.

**Permissions, privacy, and accessibility:** Respect couple ownership, planner organization roles, and wedding-level permissions when viewing or editing cultural preferences and regional modules. Limit access to sensitive preference details and do not expose them through shared templates, analytics, notifications, or unrelated users. Localize labels, dates, and guidance appropriately without assuming that interface language determines legal jurisdiction. Make module previews, requirement labels, and explanations accessible without relying on color alone. Preserve version, source, decision, and change history.

**Acceptance criteria:** (1) A couple planning a Belgian civil ceremony receives relevant suggestions with clear jurisdictional labels and authoritative verification where available; (2) a destination wedding in Italy can have different ceremony and reception locations and receives distinct applicable suggestions; (3) a multicultural multi-ceremony wedding combines several optional modules without duplicate obligations; (4) users can decline tradition-specific recommendations without being blocked from planning; (5) an unsupported or uncertain legal rule is explicitly marked for local verification, not presented as mandatory fact; (6) changing the wedding location produces a preview without silently deleting booked suppliers or completed tasks; (7) a planner cannot infer or expose a couple's religious preferences through organization-wide templates; (8) existing wedding tasks are never silently synchronized when regional modules change.

**Follow-up:** Decide how location-specific legal and administrative guidance should be maintained, verified, and presented when authoritative information is missing or becomes outdated.

### DEC-111 — Verified regional guidance with confidence indicators

**Status:** Approved  
**Decision:** Option C — Maintain a curated, jurisdiction-aware knowledge base of wedding-related legal and administrative guidance, grounded in authoritative sources, with explicit applicability, verification status, review dates, and uncertainty indicators. Identify missing, outdated, conflicting, or insufficiently specific guidance rather than presenting it as verified. Invite confirmation with the responsible local authority where appropriate, and notify affected weddings about verified consequential changes through the established risk-based notification process.

**Jurisdiction and applicability:** Record the country, region, municipality or other competent jurisdiction, ceremony location, and relevant circumstances needed to assess a rule, without assuming that residence, language, nationality, or reception location alone determines applicable requirements. Where applicability depends on facts the platform does not know, label the guidance as conditional or requiring local verification. Provide country-level guidance only at its supported scope; do not imply municipality-level coverage without evidence. Allow more than one jurisdiction for destination, multi-location, or multi-ceremony weddings.

**Source and verification metadata:** Each purported legal or administrative requirement must carry a source title and authoritative link or citation, issuing authority, geographic and situational scope, effective date where known, last checked/reviewed date, reviewer or controlled verification process, and current status. Distinguish **Verified for stated scope**, **Needs local confirmation**, **Outdated / review overdue**, **Conflicting sources**, and **Not covered**. A review date or source link is not by itself proof that a requirement is current; show uncertainty plainly and do not imply that an automated suggestion is legal advice or a guarantee of marriage validity.

**Curation and change control:** Authorized maintainers review and publish knowledge-base entries through a controlled workflow, checking primary official sources where available. Material changes are versioned with the source, rationale, affected jurisdictions, and effective dates. Do not silently overwrite prior guidance used to generate tasks. When an entry is stale, withdrawn, or disputed, withdraw its verified label pending reassessment. Avoid asserting universal review frequencies before operational coverage is defined; require visible review schedules and overdue indicators for supported entries.

**Wedding-specific impact:** When verified consequential guidance changes, identify potentially affected weddings using permitted jurisdictional and ceremony details. Notify the appropriate authorized couple or planner users according to relevance, severity, timing, quiet-hours and delivery safeguards (DEC-070–DEC-084, DEC-109). Explain what changed, why it may matter, its source and applicability, and what to confirm or do next. Propose task, date, or dependency changes through the existing guided-review process; never automatically rewrite confirmed bookings, contracts, hard deadlines, or completed work. Uncertain changes trigger verification prompts rather than false assertions of noncompliance.

**User experience and safeguards:** Display clear plain-language confidence/status labels, source access, last-reviewed dates, and the responsible authority to contact. Where information is unsupported or stale, say so at the point of use; do not fabricate requirements or deadlines. Separate official requirements from best-practice recommendations and planner-created notes. Provide accessible text and icons independent of color. Limit disclosure of sensitive ceremony or personal details, respect wedding and organization permissions, and retain an audit trail of guidance versions, user confirmations, and applied task changes.

**Acceptance criteria:** (1) A Belgian municipal civil-ceremony item identifies the relevant municipality and official source, or explicitly asks for local confirmation if coverage is incomplete; (2) an outdated item loses its verified label and visibly prompts review; (3) contradictory authoritative sources are flagged, not resolved by an unsupported guess; (4) a destination wedding with different ceremony and reception jurisdictions receives appropriately scoped guidance; (5) a verified deadline change prompts targeted impact review without silently changing existing wedding tasks; (6) routine editorial changes do not create critical alerts; (7) unsupported regions receive useful generic planning advice clearly separated from unverified legal requirements; (8) users can inspect the source and review status without being promised legal compliance.

**Follow-up:** Decide what should happen when a couple or planner believes published legal or administrative guidance is incorrect or outdated.

### DEC-112 — Structured reporting, verification, and follow-up for incorrect guidance

**Status:** Approved  
**Decision:** Option C — Provide structured in-product reporting for suspected incorrect, incomplete, conflicting, or outdated regional legal and administrative guidance. Allow reporters to attach explanations and authoritative sources, track review status, and receive an appropriate outcome. Authorized maintainers verify evidence before publishing corrections, flag potentially unsafe advice while it is investigated, and notify legitimately affected weddings when a verified correction is consequential.

**Report entry and evidence:** Every published guidance item offers an accessible **Report an issue** action with its guidance identifier, current version, and applicable jurisdiction prefilled. The reporter can select an issue type (incorrect requirement, outdated deadline, wrong jurisdiction/applicability, broken or superseded source, conflicting guidance, other), describe the discrepancy, provide a source URL or supporting document, and indicate potential urgency. Minimize required personal information and discourage uploading unnecessary identity or sensitive ceremony documents. Submitting a report must not change the underlying guidance, a wedding's tasks, or its legal status.

**Triage and review:** Route reports to authorized knowledge-base maintainers, deduplicate reports about the same guidance/version while retaining individual reporters' tracking records, and prioritize credible time-sensitive risks based on evidence, effective dates, and proximity of potentially affected ceremonies. Reviewers verify against the competent official authority and record jurisdiction, evidence, rationale, disposition, and reviewer identity. A user-reported urgency label is not independently proof of a critical legal issue. Review outcomes include **Received**, **Under review**, **More information needed**, **Correction published**, **No change—explained**, and **Closed as duplicate** (linked to the primary case). Requests for more information must not expose other reporters' details.

**Temporary caution and disputed guidance:** When a credible report raises doubt about potentially harmful or consequential guidance, authorized maintainers can mark the affected item **Under review—verify locally** or withdraw its verified designation while investigating, preserving prior published versions. Explain the uncertainty at the point of use and link to the competent authority where available; avoid asserting an unverified correction. Temporary caution can trigger appropriately scoped verification prompts but must not silently delete, cancel, or reschedule wedding tasks or treat an allegation as proven noncompliance. False, unsupported, or abusive reports are handled with proportionate moderation without hiding credible safety concerns.

**Publication and wedding impact:** A verified correction is published through DEC-111's controlled versioning, with updated authoritative source, jurisdiction, effective date, review metadata, and a plain-language change summary. Determine affected weddings only from authorized relevant location and ceremony information. Apply DEC-109 risk-based notice classification and existing delivery/quiet-hour safeguards: routine editorial fixes stay in the guidance/library context; material deadline or eligibility corrections reach eligible affected users; substantiated critical risks follow the established risk-verification and escalation workflow. Propose changes to tasks, deadlines, and dependencies using guided approval; never auto-edit existing commitments or mark a wedding noncompliant.

**Reporter follow-up, permissions, and audit:** Reporters can inspect their own case status and receive a concise resolution or request for clarification, without access to internal deliberations, other reporters, or unrelated weddings. Support a report from a couple, authorized planner, or other user permitted to view the guidance, while separating public guidance review from wedding-private records. Maintain an auditable history of the report, evidence, status changes, interim warning, source verification, published correction, notifications, and any separately authorized wedding adjustments. Make reporting and status messages accessible and understandable without color-only indicators.

**Acceptance criteria:** (1) A couple flags an outdated Belgian municipal deadline and submits the official municipal page; (2) the report enters a visible review queue and the couple can track its status; (3) two reports on the same rule are linked without exposing reporter identities; (4) a credible but unconfirmed dangerous discrepancy temporarily removes the item's verified label rather than silently rewriting the rule; (5) an unsupported correction is rejected with an explanation and no authoritative change; (6) a verified material correction is versioned and sent only to appropriately affected weddings; (7) a proposed task/deadline change requires user confirmation and protects commitments; (8) a user without wedding access cannot inspect private affected-wedding details.

**Follow-up:** Decide how the product should handle jurisdiction-specific guidance that is due for scheduled re-verification even when no user has reported an issue.

### DEC-113 — Risk-based periodic re-verification of regional guidance

**Status:** Approved  
**Decision:** Option C — Assign risk-based review schedules to jurisdiction-specific legal and administrative guidance rather than relying only on user reports or one universal interval. Determine review priority using the consequence of inaccuracy, likelihood of regulatory change, source reliability, effective-date sensitivity, and proximity of weddings that may depend on the information. Flag overdue items, remove unsupported verified designations, and direct human reviewers toward the most consequential gaps.

**Review policy and scheduling:** Each guidance item has an accountable review owner or authorized maintainer, jurisdiction and authority, authoritative source references, last verified date, next review due date, and a documented risk tier with rationale. Higher-consequence, volatile, or deadline-sensitive requirements receive shorter review intervals than stable low-impact informational items. Use a configurable, governed review policy rather than implying one fixed cadence is universally appropriate. Source publication or known effective dates may prompt an earlier review, but detecting a changed webpage alone is not proof that a legal requirement changed. Schedule reassessment when risk factors, jurisdiction, or source credibility change.

**Prioritization and workflow:** Maintain an internal queue ordered by severity, review overdue age, known pending effective dates, reliability concerns, and imminence of legitimately affected weddings. Authorized maintainers verify against the competent official source, resolve discrepancies, document their rationale, and approve a new verified version or record why no change is necessary. When official sources are inaccessible, conflicting, or insufficient, preserve the uncertainty and refer users to the responsible authority. An overdue review must not be silently recorded as completed or resolved by an automated guess.

**User-visible freshness and confidence:** Show the last verification date and current confidence/status at the guidance item. When a required review is overdue or the evidence no longer justifies confidence, withdraw the **Verified** designation and mark the guidance **Review overdue—confirm locally** or another clear caution state. Distinguish a routine overdue check from evidence of a specific incorrect or dangerous instruction; do not automatically label every overdue item as a critical safety threat. Keep useful generic planning advice accessible with an appropriate warning, unless an authorized reviewer determines it should be withdrawn. Accessibility must not rely on color alone.

**Wedding impact and notification safeguards:** Prioritize review of guidance affecting weddings with upcoming relevant milestones, subject to lawful permissions and data minimization. A missed review deadline alone generally produces a contextual verification prompt, not a blanket critical alert; credible evidence of a consequential error or verified rule change follows DEC-111/DEC-112 publication and DEC-109 notification safeguards. Notify only authorized affected users and use existing quiet-hours, importance, deduplication, and escalation rules. Never silently modify a wedding's tasks, deadlines, commitments, readiness status, or purported legal compliance solely because guidance has become stale; guide users through any verified actionable change.

**Governance and audit:** Record review schedules, policy changes, source checks, reviewer actions, deferred or failed reviews, confidence-state transitions, and published versions. Managers can reprioritize reviews with a recorded reason but cannot suppress justified caution merely to clear a queue. Respect sensitive wedding details, cross-organization boundaries, and minimum necessary matching of affected weddings. Maintain a manageable fallback for unsupported jurisdictions without implying complete local coverage.

**Acceptance criteria:** (1) A volatile municipal deadline receives a shorter review interval than a stable general recommendation; (2) an overdue item visibly loses its verified status without being automatically called incorrect; (3) a wedding with an imminent ceremony elevates the applicable review in the authorized queue; (4) a reviewer confirms unchanged official requirements and records a fresh review date and evidence; (5) conflicting sources produce a caution and request for authoritative confirmation, not a guessed update; (6) a verified consequential change generates appropriately scoped notices and a guided task-impact review; (7) routine overdue guidance does not cause indiscriminate critical alerts; (8) review activity and exceptions remain auditable and privacy-preserving.

**Follow-up:** Decide how the product should behave in regions or municipalities for which reliable local guidance cannot yet be maintained.

### DEC-114 — Generic planning only in unsupported jurisdictions

**Status:** Approved  
**Decision:** Option A — When the platform cannot provide reliable, verified legal and administrative guidance for the wedding's relevant jurisdiction, offer the ordinary generic wedding-planning experience **without** jurisdiction-specific administrative tasks or guidance. Do not substitute speculative localized requirements, generic legal checklists with disclaimers, or AI-generated regulatory advice. Couples and planners remain free to create their own ordinary tasks and notes; those entries are not presented as platform-verified legal requirements.

**Coverage detection and presentation:** Evaluate supported coverage at the relevant jurisdictional granularity, rather than assuming that support for a country means every municipality, ceremony type, or circumstance is covered. Show a concise, understandable coverage notice where legal guidance would otherwise be expected: **Verified local legal guidance is not available for this location.** The standard timeline, supplier, budget, guest, and collaboration tools remain usable. Do not display a misleading empty 'all requirements complete' indicator or imply that no legal obligations exist. A neutral link to the platform's coverage information may be offered, but no unverified jurisdiction-specific checklist is generated.

**Template and onboarding safeguards:** Do not insert location-specific administrative tasks, dates, dependencies, mandatory badges, legal readiness assertions, or notifications from an unsupported jurisdiction module. Core non-legal wedding templates may still be offered if they are genuinely location-neutral. If a template contains a mix of generic and jurisdiction-specific items, omit unsupported legal items with a clear explanation rather than silently presenting them as authoritative. User-authored tasks are distinguishable from verified platform guidance.

**Changes in coverage or location:** If the wedding location changes or verified guidance later becomes available, inform eligible users that new coverage may be reviewed, without automatically adding tasks, changing deadlines, or altering commitments. Any adoption of newly available verified guidance follows existing guided preview, permissions, notification, and audit safeguards (DEC-065, DEC-110–DEC-113). If coverage is withdrawn, stop presenting affected guidance as verified and avoid automatic deletion of user data.

**Readiness, privacy and accessibility:** Unsupported legal coverage is an explicit **coverage unavailable** state, not evidence of legal readiness or noncompliance. Do not automatically penalize the overall planning-readiness level merely because the platform lacks a legal knowledge base; equally, do not count nonexistent legal checks as completed. Respect wedding-level access, sensitive location or ceremony preferences, and accessible status labels.

**Acceptance criteria:** (1) An unsupported municipality receives ordinary wedding-planning tools but no localized legal checklist; (2) a supported country with an unsupported municipality does not inherit unverified municipal requirements; (3) onboarding clearly distinguishes unavailable verified coverage from a claim that no legal steps exist; (4) a mixed template omits unsupported legal items while retaining genuinely generic tasks; (5) user-created administrative notes remain editable but are not labeled verified; (6) newly supported guidance is offered for review rather than injected into active plans; (7) unsupported coverage cannot create false readiness or completion claims; (8) changes preserve permissions, privacy, and auditability.

**Follow-up:** Begin defining the budget and payments module, starting with how a wedding budget is structured.

### DEC-115 — Flexible category budgets with intelligent suggestions

**Status:** Approved  
**Decision:** Option C — A wedding has an overall budget and customizable budget categories, with optional intelligent allocation suggestions informed by known wedding characteristics. Couples and authorized planners can accept, edit, or reject suggestions. Financial views must distinguish **estimated**, **planned/allocated**, **quoted**, **contractually committed**, **invoiced/due**, and **paid** amounts where those concepts apply, rather than presenting allocations as spending or commitments as payments. The budget should highlight projected overspending and financial uncertainty without silently changing allocations or commitments.

**Core budget structure:** Allow an optional overall budget target in a selected currency, category allocations, unallocated reserves, and individual budget items/expenses connected to relevant suppliers, services, or planning records where authorized. Start with sensible editable categories (e.g., venue and catering, photography, attire, flowers, entertainment) and support custom categories, renaming, reordering, splitting and merging. Budget categories need not match task-planning categories one-to-one; provide explicit links or mapping where useful, so reorganizing tasks cannot silently change financial classification. Maintain consistent totals when moving items, avoid double counting, and explain any unallocated amount or allocation above the target.

**Suggested allocations:** Offer contextual starting ranges or proportions based on known wedding size, location where reliable data exists, complexity, priorities, and selected services; clearly label suggestions as illustrative estimates, not verified local prices or obligations. If evidence is insufficient, use transparent generic defaults or omit the suggestion rather than implying precision. Ask permission before applying a suggested allocation and preserve user edits. Suggestions cannot overwrite quotes, signed contracts, invoices, or payments.

**Financial tracking and clarity:** Separate category allocation from expected final cost, vendor quotes, confirmed commitments, amounts due, and payments made. Show overall and category-level remaining allocation, anticipated shortfalls, upcoming obligations, and amounts actually paid with explicit labels and calculation explanations. Handle taxes, deposits, refunds, credits, and cancellation charges as distinct record types or adjustments where applicable; detailed treatment, funding sources, multi-currency, and payment workflows remain open for subsequent decisions. Warn when a quote or commitment may exceed an allocation, and distinguish a planning overage from an unpaid bill or overdue payment.

**Permissions, privacy and change safety:** Financial access and editing follow wedding and organization permissions, with sensitive business-only information kept separate from couple-shared finances. Changes to the total budget, category allocations, or classifications require appropriate authorization and are traceable. Never auto-approve a payment, change a contractual obligation, or disclose a private quote merely because a category allocation changes. Budget updates should inform relevant readiness or priority assessments only when there is an actual grounded risk, with transparent reasons.

**Acceptance criteria:** (1) A €30,000 target with €25,500 allocated displays €4,500 unallocated, not €4,500 spent; (2) users can customize categories without losing or double counting existing items; (3) a contextual suggestion is previewed and can be rejected or edited; (4) an accepted supplier quote does not become a recorded payment; (5) an allocation overrun is visibly differentiated from an overdue invoice; (6) moving a task between planning groups does not silently reclassify an expense; (7) users without financial permission cannot view restricted figures; (8) a new suggestion cannot overwrite an existing contractual commitment; (9) budget changes retain history and appropriate review signals.

**Follow-up:** Decide how to represent the different financial stages of an individual wedding expense, including quotes, commitments, invoices and payments.

### DEC-116 — Full expense lifecycle with flexible payments

**Status:** Approved  
**Decision:** Option C — Track the full financial lifecycle of each wedding expense where relevant: preliminary estimates, supplier quotations, accepted contractual commitments, invoices, scheduled installments and deposits, individual payments, credits/refunds, and outstanding balances. The model is flexible: a small cash purchase can be recorded directly as paid, while a contracted supplier can use multiple quotes, invoices and payments. No expense is forced through irrelevant stages.

**Expense records and stages:** Each expense has a clear title, optional budget category, supplier link, responsible authorized user, currency, and optional documents/notes. Preserve the distinction between an estimate (forecast), a quote (supplier offer), an accepted commitment (agreed obligation), an invoice (request for payment), a scheduled payment (planned due amount), and a recorded payment (money actually paid). Quotes may be revised or declined without being treated as commitments; multiple invoices or installments can relate to one commitment. Support cancellation charges, adjustments, credits, and refunds as explicit entries rather than rewriting historical amounts. Do not imply that an uploaded invoice proves payment or that an agreed quote is an invoice.

**Payment schedules and balances:** Support zero, one or many scheduled installments with amount, due date, optional payer, and relationship to invoice/commitment. Record partial payments and deposits with amount, actual date, payment method or reference where supplied, optional proof, and status. Calculate paid, unpaid, upcoming and overdue amounts from eligible records, explaining the basis and avoiding double counting between schedules, invoices and commitments. Distinguish an overdue *scheduled* payment from an overdue *invoiced* amount when evidence differs. Do not automatically claim that money has moved or a vendor has received funds; recording and confirmation permissions and evidence will be decided separately.

**Budget and vendor connections:** Connect expenses to customizable budget categories and suppliers, quotations, contracts, invoices, and relevant tasks where access allows. Surface estimated-versus-committed-versus-invoiced-versus-paid comparisons at expense, category and wedding levels. Support multiple expense records per supplier and split or shared costs without counting the same payment twice. Flag forecast overages, outstanding obligations and approaching due dates separately. Changes to budget allocations must never change contractual amounts or payment history.

**Correction, permissions and audit:** Authorized users can correct mistakes through traceable amendments, voids or reversals; do not silently erase recorded payments, contracts, invoices, or refunds. Keep document and transaction visibility aligned with couple/planner organization permissions, including private planner business records. Record material changes with actor, time, reason where appropriate, and before/after values. Prevent invalid negative balances or duplicate payment records unless clearly explained by explicit credits/overpayments; support overpayments as a visible state rather than silently discarding them. The platform is a planning and recordkeeping system, not a payment processor or accounting ledger by default.

**Acceptance criteria:** (1) A €2,500 estimate, €2,800 accepted quote/commitment, €500 deposit paid and €2,300 remaining display as distinct values; (2) a simple one-off purchase can be entered as paid without creating a quote or invoice; (3) a deposit and later installments contribute once each to the paid total; (4) uploading an invoice does not mark it paid; (5) a refund or correction retains transaction history and adjusts balances transparently; (6) an upcoming scheduled amount is not mislabeled as an overdue invoice; (7) a supplier can have multiple separate expenses without duplication; (8) unauthorized users cannot see restricted amounts or documents; (9) category changes cannot rewrite contracts or payment records; (10) missing confirmation is not presented as verified receipt by the supplier.

**Follow-up:** Decide who may record, confirm, or dispute payments and how payment evidence should affect status and visibility.

### DEC-117 — Permission-based payment tracking with verification

**Status:** Approved  
**Decision:** Option C — Authorized wedding participants can record payments with optional supporting proof. The platform distinguishes **Recorded**, **Confirmed**, and **Disputed** states and never implies that a supplier received money merely because someone entered a payment or uploaded a document. Confirmation is permission-based and grounded in an explicit authorized review or reliable evidence; the source and limits of confirmation must be clear.

**Payment workflow:** A payment record contains the amount, currency, payment date, linked expense and installment or invoice where applicable, payer if known and permitted, optional payment method/reference, optional proof, recording actor and timestamp. **Recorded** means a permitted user says payment was made, without independent confirmation. **Confirmed** means the record has been reviewed by an authorized confirmer or is supported by reliable evidence meeting applicable verification rules; show whether confirmation is internal/evidence-based or expressly acknowledged by the supplier. **Disputed** means a credible disagreement about payment, amount, allocation, evidence, or receipt requires investigation. A disputed payment remains visible and cannot be silently treated as settled. No payment status by itself constitutes a bank transfer or platform processing of funds.

**Permissions and evidence:** Permission to view financial records, create payment entries, edit them, confirm them, or dispute them may differ by wedding role and organization delegation. A person recording a payment is not automatically granted independent confirmation authority. Couples and planners may have distinct permitted views; private planner-business costs and personal financial identifiers remain protected. Proof is optional for initial recording, but confirmation may require a suitable receipt, bank confirmation, supplier acknowledgement, or a documented authorized review according to risk and context. Evidence is assessed for what it actually demonstrates: a transfer instruction or payer bank debit does not necessarily prove supplier receipt. Avoid mandatory uploads of sensitive full bank statements; minimize and restrict evidence access.

**Totals and uncertainty:** Show recorded amounts and confirmed amounts separately wherever the difference matters; distinguish paid-as-reported from verified payments and from supplier-acknowledged receipt. Outstanding balance views must explain whether they subtract recorded or confirmed payments, and flag disputes without double counting. A dispute or reversal triggers appropriate reassessment of overdue obligations and budget risk rather than automatically erasing historical activity. Do not mark an invoice definitively settled on an unverified entry when confirmation is required.

**Corrections, notifications and audit:** Authorized users can challenge, review, correct, void, or reverse records through traceable workflows with actor, timestamps, supporting rationale, and before/after values. Confirmation or dispute changes notify relevant authorized people proportionately, respecting established notification and privacy rules. Evidence changes or credible contradictions can reopen a previously confirmed record for review. No unauthorized participant can confirm, suppress a dispute, or access restricted proof. Financial records remain planning/recordkeeping information, not a bank integration or accounting certification by default.

**Acceptance criteria:** (1) A €500 deposit entered by a partner appears as **Recorded**, not supplier-confirmed; (2) an authorized reviewer can confirm with documented basis, and the UI states the type of confirmation; (3) a payment can be disputed without deleting its history; (4) optional evidence can be attached with restricted visibility; (5) a payer debit is not automatically represented as supplier receipt; (6) a user allowed to record but not confirm cannot change a payment to Confirmed; (7) recorded and confirmed totals are distinguishable without double counting; (8) corrections and reversals retain history and recalculate outstanding amounts; (9) private financial details do not leak to helpers or unauthorized staff; (10) a dispute or invalidated proof triggers review rather than silently preserving a misleading settled state.

**Follow-up:** Decide how payment due-date reminders and overdue escalation should work for scheduled installments and invoices, including what to do when a payment is recorded but unconfirmed.

### DEC-118 — Adaptive payment reminders with payment-status awareness

**Status:** Approved  
**Decision:** Option C — Payment reminders adapt to due dates, amounts, urgency, wedding proximity, and each eligible recipient's notification preferences. The system distinguishes unpaid obligations from payments already recorded but awaiting confirmation, avoids duplicates, and escalates significant unresolved financial risks only to authorized people. This extends the existing risk-based reminder, quiet-hours, and notification safeguards (DEC-070–080) and payment-state definitions (DEC-116–117).

**Due-date and status awareness:** Track each payable installment or invoice obligation with its applicable due date, amount, currency, source and responsible payer where known. Show upcoming, due, and overdue obligations according to reliable contractual or invoice dates; an estimate without a real payment due date must not be labeled overdue. When a payment is **Recorded**, stop reminders falsely instructing the payer to pay that same amount again; instead, where relevant, show a proportionate **awaiting confirmation** follow-up to authorized reviewers. A **Confirmed** payment settles the covered obligation to the extent supported by its confirmation basis; a **Disputed** payment raises a review issue and does not silently settle or erase the obligation. Partial payments leave only the remaining amount subject to ordinary unpaid reminders. Refunds, reversals, changed due dates and overpayments recalculate follow-ups without double counting.

**Adaptive scheduling:** Recommend reminder timing and intensity from time until due, amount and consequence of nonpayment, wedding proximity, known dependencies, prior reminder activity and whether the recipient can act. Routine small or distant payments can be grouped in digests; significant upcoming commitments receive appropriately timely individual reminders; genuinely critical impending losses or blocked arrangements can be escalated under existing risk rules. Do not imply that high monetary value alone establishes criticality. No fixed cadence is guaranteed for every payment, and users must be able to inspect the due date, reminder rationale and current payment status.

**Recipient selection and preferences:** Direct reminders to eligible responsible payers and authorized financial collaborators, with manager/planner escalation only where permissions and existing role delegation permit it. Respect recipient timezone, quiet hours, preferred channels, disabled external critical-planning alerts, deduplication, and privacy boundaries. Do not reveal private couple expenses, bank details, invoices, or planner-only business costs to helpers or unauthorized staff. A notification is not evidence of payment, debt collection, or supplier confirmation; the platform does not initiate bank transfers or contact suppliers automatically under this decision.

**Unresolved and exceptional cases:** For a recorded-but-unconfirmed payment, explain that transfer has been reported and identify what confirmation is still needed without asserting supplier nonreceipt. Escalate unresolved confirmation only when its risk and timing warrant it; avoid repeatedly prompting the payer to pay again. If the payment is disputed or proof invalidated, open or update an actionable financial issue and reassess the remaining exposure. An obligation with unknown due date or unclear contractual status must be labeled uncertain, not overdue. If all actionable portions are confirmed, cancel obsolete reminders; retain historical notification and payment records. Reminder acknowledgements, snoozes and delivery failures follow already approved platform-wide rules and do not change payment state.

**Acceptance criteria:** (1) A €2,000 catering installment due tomorrow prompts an appropriate reminder to an authorized payer; (2) a €500 deposit recorded but unconfirmed no longer generates an instruction to pay €500 again, but can generate a verification follow-up; (3) a €1,000 installment with €400 confirmed payment reminds only for the remaining €600; (4) an obligation with no verified due date is not marked overdue; (5) disputed or reversed payments reopen relevant risk review without deleting history; (6) routine notifications respect quiet hours and per-user channel choices; (7) significant risks can reach other eligible authorized people under existing escalation safeguards; (8) repeated events do not produce duplicate reminders; (9) no restricted financial details appear in unauthorized notifications; (10) confirming full settlement stops obsolete reminders and preserves an audit trail.

**Follow-up:** Decide how payment schedules should be created and adjusted when supplier contracts or invoices specify multiple installments, including conflicts between contractual dates and user-planned dates.

### DEC-119 — Contract-aware payment schedules with guided adjustments

**Status:** Approved  
**Decision:** Option C — Authorized users may create and confirm installment schedules from supplier quotations, accepted contracts, and invoices, using either fixed calendar dates or dates expressed relative to an agreed event or milestone. The platform may suggest a schedule and guide changes, but must not silently reinterpret or change a supplier's binding payment terms when the wedding date or planning milestones change.

**Schedule creation and provenance:** Each installment identifies the linked expense and, where applicable, supplier, quotation, accepted contract, invoice, payer, amount, currency, due-date rule, source document/reference, and who entered or confirmed it. Support fixed dates (for example, 15 March), relative rules (for example, 90 days before the wedding), event-triggered terms (for example, upon contract signing), and terms awaiting a verifiable trigger or due date. Clearly distinguish a *supplier-agreed contractual due date* from an internal suggested/planned payment target. Users can manually enter terms or review proposed terms extracted or inferred from supplied documents; extraction is never accepted as authoritative without authorized verification. Ambiguous, contradictory, or missing terms remain explicitly unresolved rather than being assigned invented dates.

**Amounts and lifecycle:** Support deposits, one-time balances, multiple installments, partial payments, credits, refunds, and revised agreements. Show total scheduled amount versus accepted commitment and identify mismatches, duplicated installments, unallocated amounts, and overpayments without double counting across quotes, invoices, schedules, and recorded/confirmed payments. An invoice may reference an existing installment without creating a duplicate obligation. Existing payment states (Recorded, Confirmed, Disputed) remain separate from installment scheduling and must not be changed by editing dates. Protect payment history, paid portions, and contractual obligations from destructive changes.

**Wedding-date and contract changes:** When the wedding date or relevant event changes, calculate a preview of *candidate* revised dates for installments whose source terms genuinely depend on that event. Fixed dates and terms not legally or contractually linked to the changed event stay unchanged by default. If an accepted contract fixes a date, an internal schedule cannot override it: the user must record and confirm a supplier-agreed amendment before changing the contractual due date. Show affected installments, original and proposed dates, linked documents, payment statuses, conflicts, urgency, and impact on reminders, budgets and tasks. Permit selective acceptance of safe internal planning adjustments; block unsupported contractual edits, and track unresolved differences as actionable issues. Never treat a wedding date change alone as supplier consent to new terms.

**Permissions, reminders and audit:** Only authorized financial editors may propose or change schedules; approval of contractual changes follows applicable permissions and evidence requirements. Notify relevant authorized people of material changes under the adaptive reminder and privacy safeguards of DEC-074–080 and DEC-118. Recalculate reminders only after confirmed schedule changes, suppress obsolete notices, and retain historical due dates, actors, reasons, evidence, and before/after values. Keep restricted supplier documents and payment data out of unauthorized views. The platform tracks obligations; it does not execute payments or amend contracts on users' behalf.

**Acceptance criteria:** (1) An €8,000 venue commitment can have a €2,000 deposit plus two €3,000 installments without duplication; (2) a fixed contractual due date remains unchanged when the wedding date moves; (3) a confirmed contractual rule of 90 days before the wedding yields a proposed revised date for review, not an automatic amendment; (4) a suggested internal payment date is clearly distinguished from the supplier's contractual date; (5) unknown or conflicting terms do not become fabricated due dates; (6) invoice references do not double count an existing scheduled installment; (7) paid or disputed installments retain their transaction history through schedule edits; (8) a supplier-agreed amendment can be documented and applied by an authorized user; (9) material changes trigger correct reminder reassessment without leaking private data; (10) all approved, declined, and unresolved schedule changes are traceable.

**Follow-up:** Decide how the platform should manage expenses and payment obligations involving multiple contributors or payers, such as a couple, their families, or other sponsors.

### DEC-120 — Flexible contributors and shared wedding expenses

**Status:** Approved  
**Decision:** Option C — Track expected and received wedding funding contributions, support one or more responsible payers per expense or installment, and distinguish contributions paid into a couple-controlled wedding fund from direct payments to suppliers. Permit partial contributions and split obligations while ensuring no amount is counted twice. This extends the expense lifecycle, payment verification, schedules and reminder safeguards of DEC-115–119 without introducing banking, fund custody or automatic transfers.

**Contributor and funding model:** Authorized users may create a contributor record for a partner, family member, sponsor or other funding source, with a display name, optional contact details, funding purpose, contribution amount/currency, expected date or milestone, and optional allocation to a budget category, supplier expense or installment. A contributor need not have a platform account. Track *proposed*, *pledged/expected*, *received* and *cancelled/adjusted* contribution amounts separately; a promise is never represented as cash received. Avoid implying a legally enforceable debt or commitment merely because an expected contribution was entered. Contributions may be unrestricted or earmarked for particular expenses, and may be divided across multiple items without exceeding the underlying contribution.

**Money flows and payer responsibility:** Distinguish (a) a contributor giving money to the couple or designated wedding fund and (b) a contributor paying a supplier directly. An incoming contribution is a funding inflow, not an additional wedding expense or proof of supplier payment. A direct supplier payment may settle the linked expense or installment to the extent appropriately recorded and confirmed, but is not simultaneously counted as money received by the couple. One installment can have multiple planned payers with shares, and one payer can cover several installments; keep planned responsibility, reported payment and verified settlement distinct. Reallocate unpaid shares through an authorized review without rewriting actual historical transfers or contractual obligations. Split allocations and actual settlements must reconcile with the full expense amount, identifying unassigned or overallocated shares.

**Budget and balance presentation:** Show total wedding budget, allocated costs, accepted commitments, actual supplier payments, expected contributions, received funds, directly paid supplier amounts, remaining obligations and any funding gap as distinct measures. Never add incoming contributions to the cost of the wedding or subtract both received contributions and direct supplier payments from the same liability. Support partial funding, refunds, returned contributions, disputed payments, currency mismatches and revised pledges; avoid silent conversion between currencies and require an explicit conversion basis if cross-currency totals are displayed. Unconfirmed payments and uncertain pledges remain visibly provisional.

**Privacy, permissions and collaboration:** Couple partners retain equal control of their shared wedding under DEC-001–003, subject to the approved financial permission model. Only authorized financial editors can add or change funding plans, payment responsibility and contributor details; payment confirmation follows DEC-117. Do not grant parents, sponsors or other contributors automatic wedding access, financial visibility, edit permissions or notifications merely because they are named as funders. If contributors are later invited, show only information explicitly shared with them. Respect planner-private business data, sensitive bank details, permission-based reminders and notification quiet hours. Preserve consent and appropriate privacy safeguards for third-party contact information.

**Reminders, changes and audit:** Adaptive reminders from DEC-118 target eligible responsible payers or authorized collaborators, without messaging external contributors automatically. A missing pledged contribution may be shown as a funding risk but must not be labeled an overdue supplier payment. Supplier contractual due dates remain governed by DEC-119 regardless of who promised to fund them. Log changes to contribution amounts, earmarks, payer shares, received/direct-payment status, confirmations, disputes and corrections with actors, dates, explanations and evidence where available. Never erase an actual payment record to reflect a revised promise.

**Acceptance criteria:** (1) A €30,000 budget with €20,000 couple funding and €6,000/€4,000 family pledges shows €30,000 expected funding but does not claim all €30,000 has been received; (2) a €4,000 photography expense paid directly by a parent is recorded once as an expense and once as its settlement, not as an additional incoming €4,000 contribution; (3) a €2,000 installment split between two payers can track different pledged shares and actual partial payments; (4) a €6,000 pledge with €2,000 received shows €4,000 outstanding expected funding; (5) a cancelled pledge recalculates the funding gap without changing supplier commitments; (6) a contribution received by the couple does not automatically mark any supplier invoice paid; (7) recorded-but-unconfirmed supplier payments remain provisional; (8) external contributors receive no automatic access or payment notifications; (9) changing payer shares preserves payment and contractual history; (10) financial totals reconcile without double counting or exposing restricted information.

**Follow-up:** Decide whether family members and other contributors should be able to access a limited contributor portal to view or update their own pledges and payments, or remain entirely outside the platform unless separately invited.

### DEC-121 — No self-service access for external wedding contributors

**Status:** Approved  
**Decision:** Option A — External wedding contributors, including parents, relatives and sponsors, do not receive a dedicated contributor portal or self-service access to their contribution records. The couple and other explicitly authorized wedding financial collaborators manage all contribution information inside the platform; contributors receive updates and arrange payments outside the platform. This is an intentional product boundary, not a temporary absence of a feature.

**Experience and access boundaries:** Creating a contributor, assigning a payer share, recording a pledge, or associating a payment with a named third party must never create an account, issue an invitation, expose a dashboard, grant permissions, or send automated messages to that person. The platform must not present a contributor sign-in, claim link, payment confirmation link, or contributor-specific portal. The couple may communicate contribution summaries or requests externally at their discretion. An external contributor may independently have a separately approved wedding helper role, but that role does not automatically confer access to financial records or contributor data.

**Authorized management:** Partners and authorized planner-side financial collaborators may enter or correct pledges, received contributions, direct supplier payments, allocations, payer shares and supporting evidence under DEC-115–120. Recorded payments and their confirmation remain subject to DEC-117, and schedules and reminders to authorized users remain governed by DEC-118–119. Contributor claims, payment receipts and disputes communicated outside the platform are entered by an authorized user with the appropriate provenance; an authorized editor's entry must not be presented as the contributor's own attestation or as verified supplier receipt.

**Privacy and notifications:** Keep contributor contact information and financial arrangements restricted to authorized wedding users; collect only necessary third-party details and respect relevant privacy obligations. Do not automatically email, message, remind or escalate to an external contributor, even when that contributor is listed as a responsible payer or has an outstanding pledge. Instead, surface relevant funding gaps or follow-ups to authorized collaborators, who may contact the contributor outside the product. Preserve the distinction between a contributor record and a platform member.

**Budget integrity and change handling:** Continue to distinguish expected from received funds and direct supplier settlement from contributions to the couple. Changing a pledge, payer responsibility or recorded payment must not imply consent by an external contributor, change a supplier's contract, or erase historical transfers. Preserve reasons, provenance, evidence, corrections and audit records; keep unconfirmed amounts visibly provisional.

**Acceptance criteria:** (1) Adding a parent as a €6,000 contributor creates no account, invitation, contributor dashboard or automated notification; (2) a parent paying a supplier directly can be recorded and verified by an authorized financial user without contributor login; (3) a pledge that becomes overdue generates internal authorized follow-up rather than a message to the parent; (4) financial information remains hidden from helpers who lack financial permissions; (5) contributor updates recorded by a planner are not misrepresented as contributor-confirmed; (6) the couple can manage multiple contributors and split expenses without granting third parties access; (7) corrections preserve history and prevent double counting.

**Follow-up:** Decide how the platform should handle financial privacy between the two partners and authorized professional planners, including whether specific expenses can be hidden from one another.

### DEC-122 — Shared wedding finances with protected private expenses

**Status:** Approved  
**Decision:** Option C — Both partners retain equal visibility and control over the shared wedding budget, while an authorized user may maintain explicitly private, individually funded expenses (for example, a surprise gift) outside shared wedding totals until deliberately disclosed. Professional planners and helpers see only records permitted by their roles. Private expenses must never silently create shared liabilities, misstate the shared budget, or conceal material shared commitments.

**Shared versus private financial scope:** Every financial record has an explicit shared-wedding or private-personal scope. Shared budget allocations, accepted supplier commitments, invoices, payments, contributions, funding gaps and risks remain equally accessible to both partners under DEC-001–003 and applicable financial permissions. A private expense belongs to its creator, does not automatically appear in shared financial summaries, and is not an undisclosed deduction from shared funds. The platform clearly labels private records to their owner and explains that shared reports exclude them. The ability to hide an expense must not become a way to conceal a shared contractual obligation or a payment using joint funds.

**Creating and funding private expenses:** A user may create a private expense only where they are entitled to do so and explicitly attest that it is individually funded and does not bind the couple or shared wedding finances. Track its estimate, commitments, installments and payments using the applicable lifecycle from DEC-116–119 without revealing it to unauthorized users. If an expense involves shared funds, a joint contract, a shared contributor pledge, an existing shared supplier arrangement, or a commitment requiring both partners' awareness, it must remain in the shared scope or be reviewed before any private designation. Do not allow hiding a shared liability by moving or duplicating its record. A private gift or surprise must not affect the wedding's overall readiness, funding gap, or shared payment obligations without an explicit, authorized transition into shared scope.

**Professional and helper access:** Planners see shared financial records only if authorized for the wedding and specific financial operations; helpers have no implicit financial access. Private personal expenses are invisible to planners, staff and the other partner by default. The private owner may deliberately share a particular private record with an eligible professional for assistance, subject to explicit scope and revocation, but this does not grant access to other private records or the entire personal budget. Planner-private business financial data remains separately protected under DEC-001 and DEC-010.

**Disclosure, changes and exceptions:** The owner can disclose a private expense to the shared wedding with a preview of how it affects allocations, liabilities, payment schedules, contributor shares and shared totals. Converting a private record to shared requires confirmation and applicable authorization; any new shared commitment must be visible to both partners. Returning a shared expense to private is prohibited when it would conceal an existing shared obligation, shared payment, or other partner's rights; otherwise it requires a guided review. Revocation of professional access cannot remove legitimate shared records or erase previously recorded transactions. Preserve linked documents and evidence without exposing private attachments through search, exports, notifications, dashboard counts, activity feeds or task dependencies.

**Privacy, notifications and audit:** Financial alerts for private expenses go only to the owner and explicitly authorized collaborators; shared reminders and escalation remain governed by DEC-074–080 and DEC-118. The other partner must not receive private expense names, amounts or identifying notification metadata, but must continue to receive information about any actual shared obligations. Record changes of visibility, disclosures, permissions, financial values and corrections in an access-controlled audit trail; do not reveal confidential private details through otherwise shared audit views. Apply data-minimization and appropriate safeguards for sensitive gifts, payers and payment evidence.

**Acceptance criteria:** (1) Both partners see identical shared budget totals and shared obligations; (2) one partner can track a personally funded surprise gift without its details appearing to the other partner or a planner; (3) a private expense does not reduce the shared budget or appear as a shared payment; (4) a jointly signed supplier contract cannot be hidden by marking it private; (5) a private expense paid with shared funds is flagged for review rather than silently concealed; (6) an owner may explicitly share one private expense with an eligible planner without revealing other private expenses; (7) disclosing an expense to the shared wedding requires confirmation and updates shared totals exactly once; (8) private expense notifications, exports and activity records do not leak details; (9) access changes preserve valid contractual and payment history; (10) both partners retain equal shared financial control and cannot use private scope to undermine it.

**Follow-up:** Decide whether budget allocations should be automatically rebalanced when one category is projected to exceed its allocation, or whether the platform should propose adjustments for user approval.

### DEC-123 — Guided budget rebalancing with approval

**Status:** Approved  
**Decision:** Option C — When projected spending exceeds a category allocation, the platform identifies the shortfall and proposes transparent, user-approved ways to rebalance the wedding budget. Available unallocated funds should be suggested first; reductions or transfers from other categories are optional and must be explicitly approved by an authorized financial editor. No suggestion changes a confirmed supplier commitment, invoice, payment, or contractual obligation.

**Detection and presentation:** Compare each category's allocation with its projected cost, distinguishing estimates, quotations, accepted commitments, scheduled liabilities, and actual payments under DEC-115–119. Show category over-allocation separately from exceeding the overall wedding budget. Explain whether a warning is driven by a tentative quote, a confirmed obligation, or another change. Do not treat an unconfirmed quote as a paid expense or count an expense twice across linked supplier records. Private personal expenses remain outside shared calculations under DEC-122.

**Guided resolution options:** Offer use of genuinely unallocated funds first, then suggest reallocating discretionary budget from other categories, revising nonbinding estimates, or deliberately increasing the total budget if the authorized user chooses. Explain the source, destination, amount, remaining cushion, resulting category and overall positions, and any new risks. Never propose moving money already committed to an essential or contracted expense as if it were freely available. Show the consequences of moving allocations away from categories with upcoming obligations. A user can reject, modify, select individually, or batch-select compatible suggestions.

**Approval and authority:** Present a before-and-after preview and require explicit confirmation from a user authorized to edit the affected shared budget allocations. Respect equal partner access to shared financial information and the applicable permissions for professional planners and helpers. Where a proposal touches a protected contractual commitment, shared obligation, restricted financial record, or another person's authority, block the unsafe part and explain the required separate process. Neither an automated suggestion nor a planner's budget transfer can amend supplier terms or create an obligation on behalf of a contributor.

**Partial changes and conflicts:** Apply approved transfers atomically for each chosen change, checking that balances and permissions have not changed since preview. Permit safe partial approval, flag unresolved category overruns, and preserve the remaining risk warnings. Handle insufficient unallocated funds, simultaneous edits, multiple over-budget categories, revised quotes, refunds, cancelled tasks, and changes to contributor pledges without double counting. If the total wedding budget is insufficient, explicitly state that shifting allocations does not solve the overall shortfall.

**Reporting, readiness and traceability:** Recalculate category allocations, projected overspend, available contingency, overall financial exposure, and relevant wedding-readiness signals after approved changes. Keep actual payments, accepted commitments, supplier records, and due dates unchanged. Record who proposed and approved each transfer, its reason, before-and-after values, and rejected or superseded suggestions. Notifications follow established relevance, permission, privacy and quiet-hour safeguards; do not disclose private expenses or sensitive contribution information.

**Acceptance criteria:** (1) A €4,000 photography allocation with a €4,800 projected cost and €2,000 unallocated produces an optional €800 transfer suggestion, not an automatic transfer; (2) approving it yields a €4,800 photography allocation and €1,200 unallocated, with the €4,800 projected expense counted once; (3) declining it leaves all allocations unchanged and retains the warning; (4) reallocating from catering cannot silently reduce or cancel a signed catering commitment; (5) an overall €2,000 funding shortfall is not shown as solved merely by transferring allocations; (6) an authorized user can approve some independent suggestions while others remain pending; (7) stale suggestions are revalidated against concurrent budget edits; (8) private expenses remain excluded from shared totals; (9) proposed changes do not alter invoice, payment, or contractual records; (10) an audit trail records confirmed allocation changes and their rationale.

**Follow-up:** Decide how the platform should handle a dedicated contingency or emergency reserve in the wedding budget, including whether suggested rebalancing may draw on it.

### DEC-124 — Protected contingency reserve with guided use

**Status:** Approved  
**Decision:** Option C — The wedding budget supports an optional, explicitly designated contingency reserve within (not on top of) the overall budget. The platform suggests a context-sensitive starting reserve during budget setup, allows authorized users to choose a different amount or no reserve, and treats reserved money differently from freely unallocated funds. Spending or reallocating the reserve always requires informed, explicit approval; no automated transfer may consume it.

**Creation and representation:** Show total shared budget, category allocations, contingency reserve, freely unallocated balance, projected expenses, committed amounts, and payments as distinct figures. Reserve amounts count once toward the overall allocation; they are not actual expenses, payments, contributions, or guaranteed cash on hand. Suggested reserve levels should be explainable, nonbinding, and based on known wedding size, complexity, timing, commitments, and uncertainty without implying precise financial advice. Users may set a currency amount or percentage, with clear rounding and recalculation behavior, and can decline suggestions.

**Guided use and budget rebalancing:** In DEC-123 rebalancing, propose genuinely free unallocated funds before drawing on the reserve. If a projected overrun remains, offer an optional reserve transfer with a before/after preview of reserve balance, percentage of budget protected, resulting category allocation, and residual risks. Permit partial reserve releases and explicit reallocation to a particular category or expense; do not treat a reserve transfer as a supplier payment or as proof that a shortfall in actual funding has been solved. Changes must be approved by an authorized shared-budget editor and revalidated at confirmation. If an overall budget overrun exists, clearly explain that releasing reserve money already included in the total budget does not increase total funding.

**Protection and limits:** Never silently use the reserve to offset overspending, new supplier commitments, payment deadlines, or forecast changes. Distinguish protected reserve from discretionary unallocated funds in dashboards, warnings, and suggestions. Where existing obligations leave less genuine financial flexibility than the nominal reserve, flag the discrepancy rather than presenting unavailable money as safely spendable. A depleted or unusually low reserve may prompt a proportionate, dismissible advisory, not an invented critical compliance or payment alert. Reserve reductions cannot amend contracts, cancel obligations, or alter recorded payments.

**Permissions, privacy and lifecycle:** Both partners have equal visibility and authority over the shared reserve; professional planners and helpers need applicable financial permissions. Private personal expenses remain excluded from shared reserve calculations under DEC-122. Contributions that have only been promised must not be counted as received funds under DEC-120. Reassess reserve suggestions after material wedding, budget, supplier or date changes, but never automatically reset a user's chosen reserve or overwrite approved allocations. Preserve amount, percentage, change reasons, actors, approvals, and previous values in an access-controlled audit history.

**Acceptance criteria:** (1) A €30,000 overall budget with €27,000 allocated to planning categories and €3,000 reserved shows no extra €3,000 added to the total; (2) the reserve is not displayed as a paid expense; (3) a €1,000 overrun with €500 freely unallocated suggests the €500 first and presents a separate, optional €500 reserve release; (4) rejecting a reserve transfer preserves the reserve and overrun warning; (5) approving a €500 reserve transfer reduces reserve to €2,500 and increases the destination category allocation by €500 without changing the overall budget; (6) a reserve release does not change signed supplier terms or mark payments complete; (7) an overall funding deficit is not falsely resolved by reserve reallocation; (8) private personal expenses remain excluded; (9) a changed wedding date can trigger a fresh recommendation without overwriting the selected reserve; (10) only authorized users can approve reserve changes, with audit history.

**Follow-up:** Decide how the platform should forecast future wedding cash requirements and warn when upcoming payment obligations exceed funds expected to be available by their due dates.

### DEC-125 — Basic wedding cash-flow forecast

**Status:** Approved  
**Decision:** Option B — Provide a basic cash-flow forecast comparing upcoming scheduled wedding payments with manually entered available funds and expected incoming contributions. Display projected balances over time and identify potential cash shortfalls. Do not expand this decision into automatic banking integrations, probability-based forecasting, automatic payment rescheduling, or advanced scenario optimization.

**Forecast inputs:** Authorized users can enter the amount of funds currently available for shared wedding payments, an as-of date, and expected incoming contributions with amounts and anticipated dates. Reuse applicable supplier installments and due dates from DEC-116 and DEC-119, plus received and expected contributions under DEC-120. Avoid counting a contribution both as available cash and as a future inflow; distinguish contributions paid directly to suppliers from cash received by the couple. Private personal expenses and funds remain outside shared forecasts under DEC-122 unless deliberately disclosed.

**Calculations and presentation:** Provide a chronological cash-flow view showing opening available funds, expected incoming contributions, scheduled outgoing payments, and projected balance after each dated event. Display a simple summary of the next relevant period and the first projected negative balance, if any. Clearly label manually supplied balances and expected (not yet received) funds. Separate confirmed or recorded past payments from unpaid future installments; an already recorded payment must not be subtracted again as an unpaid obligation. Forecasts are planning estimates, not live bank balances or verified liquidity.

**Shortfall handling:** Flag when scheduled outflows exceed projected available funds at a given date, identifying the estimated amount and affected payments. Explain that a positive overall wedding budget, an unspent category allocation, or a protected contingency reserve does not by itself mean sufficient cash is available. Expected contributions may be late or not materialize; show this uncertainty plainly without adding probabilistic forecasts. Users can adjust manual opening funds or anticipated contribution dates to see the updated basic projection; these edits do not amend a contributor's promise or a supplier contract.

**Updates and permissions:** Recalculate when authorized users change available funds, expected contribution dates or amounts, payment schedules, recorded/confirmed payments, refunds, or wedding dates. Respect payment verification states in DEC-117, reminders in DEC-118, and protected contractual dates in DEC-119. Only authorized shared-finance editors may change forecast assumptions; planners and helpers see the forecast only with appropriate financial access. Preserve an audit trail of substantive edits and make forecasts inaccessible to external contributors under DEC-121.

**Safeguards and boundaries:** Never automatically transfer budget allocations, spend contingency reserves, modify signed payment deadlines, request funds from contributors, or mark payments as completed based on the forecast. Do not suggest that a cash-flow projection is a guarantee of funds. No automatic bank-account connectivity, advanced scenario engine, or speculative contribution likelihood is approved by this decision.

**Acceptance criteria:** (1) €4,000 available and €6,500 due before any further inflow produces a €2,500 projected shortfall; (2) a €3,000 contribution expected after those payment dates does not eliminate the earlier shortfall; (3) a contribution paid directly to a supplier is not added to the couple's available cash; (4) a deposit already reflected in the entered available balance is not subtracted twice; (5) changes to an installment due date refresh the forecast but do not change a contract; (6) a protected reserve is not treated as additional cash or automatically released; (7) private surprise expenses remain excluded from the shared view; (8) forecast inputs and resulting warnings respect financial permissions; (9) missing available-funds data is shown as insufficient information rather than a zero or a safe forecast; (10) users can inspect which dated inflows and outflows produced a projected shortfall.

**Follow-up:** Decide how to represent uncertainty when expected contributions are not yet received, including whether the forecast should show one projection or separate confirmed-funds and expected-funds views.

### DEC-126 — Two cash-flow forecast views for expected contributions

**Status:** Approved  
**Decision:** Option C — Display two clearly differentiated projections within the basic wedding cash-flow forecast: a conservative view based on available/received funds and a conditional view including expected but not yet received contributions on their anticipated dates. Both views must highlight dated shortfalls and never portray a promise as cash already available. This is a dual-view presentation of DEC-125's basic forecast, not an advanced scenario engine.

**Conservative view:** Start from the manually entered shared available-funds balance at its as-of date. Subtract unpaid scheduled obligations in due-date order, incorporating only subsequent inflows explicitly recorded as actually received and not already included in the opening balance. Exclude all outstanding promises, anticipated gifts and unreceived reimbursements. Display the first negative projected balance and the corresponding amount and dates. Do not mislabel the result as a verified bank balance.

**Expected-contributions view:** Use the same opening balance and payment obligations, additionally including dated, unreceived contributions recorded under DEC-120. Show each contribution's expected amount, date and unreceived status. An inflow cannot cover a payment that falls due earlier. Treat a contribution whose date is unknown as an unquantified expectation, not a dated inflow. Distinguish direct-to-supplier funding from cash received by the couple; direct supplier payments affect only the relevant obligation when appropriately recorded and must not inflate available funds.

**Presentation and interpretation:** Show both views side by side when space permits, or as an accessible clearly labeled comparison on small screens, with a chronological breakdown and the first shortfall in each. Highlight the difference between the two projected balances as dependence on unreceived contributions, not as guaranteed extra money. If the conditional view avoids a shortfall but the conservative view does not, show the remaining funding uncertainty prominently. A forecast with missing opening funds or necessary dates must say information is insufficient rather than inventing a safe or zero balance. Use labels and text as well as visual indicators.

**Reconciliation and updates:** When a contribution is recorded as received, remove it from expected inflows and reflect it once in available cash or the appropriate subsequent actual inflow; never count it twice. If an expected amount, date, or status changes, recalculate both projections and reassess warnings and applicable DEC-118 reminders. Respect DEC-117 payment states, DEC-119 contractual due dates, DEC-121 no external contributor access, DEC-122 private-expense boundaries, and DEC-124 protected reserve accounting. No automatic fund transfer, contribution solicitation, supplier-term amendment or payment confirmation results from either projection.

**Permissions and audit:** Both partners retain equal shared-finance access. Only authorized financial editors can change contribution assumptions or available-funds inputs; planners and helpers need appropriate permissions to view or edit. Record material changes to forecasts' underlying assumptions and keep private contributor information out of unauthorized notifications and exports.

**Acceptance criteria:** (1) With €4,000 available and €6,500 due within 30 days, the conservative view shows a €2,500 shortfall; (2) if an unreceived €3,000 contribution is expected before all those payments, the expected-contributions view can show €500 remaining, while the conservative warning persists; (3) if that €3,000 is due after the payments, both views show the earlier €2,500 shortfall; (4) an unknown contribution date cannot erase a dated shortfall; (5) receiving a contribution updates the conservative projection without counting the contribution twice; (6) a direct-to-supplier payment never appears as the couple's cash inflow; (7) missing opening funds produce an insufficient-information state; (8) both views are accessible on mobile and desktop; (9) no forecast automatically changes contractual due dates or payment status; (10) only authorized users can view sensitive forecast details and change assumptions.

**Follow-up:** Decide how users should be warned about a projected shortfall when only the expected-contributions view appears solvent, including how prominent the distinction should be on the budget dashboard.

### DEC-127 — Context-aware financial risk warnings on the dashboard

**Status:** Approved  
**Decision:** Option C — Surface meaningful cash-flow risks on the wedding dashboard with prominence proportional to payment timing, potential impact, and the degree of reliance on unreceived contributions. Distinguish a projected shortfall even after expected contributions from a conservative-only shortfall that may be covered if promised contributions arrive in time. Avoid automatically classifying every conservative-only negative balance as critical.

**Warning categories:** (1) **Projected funding shortfall:** Both conservative and expected-contributions forecasts show insufficient funds at a payment due date; display the affected date, amount and obligation, with urgency reflecting the actual deadline and consequences. (2) **Dependent on expected contributions:** The conditional view covers payments but the conservative view does not; explain the amount and timing of unreceived funding needed, without treating it as secured cash. (3) **Information incomplete:** Available funds, due dates or expected contribution dates are missing or stale; show a neutral request to complete inputs rather than declaring the wedding financially safe or inventing a shortfall. (4) **No identified shortfall:** No special warning required, though the detailed forecast remains available.

**Prominence and prioritization:** Present a concise budget-dashboard summary linking to the two forecast views and the underlying dated inflows and outflows. Increase prominence as a material payment deadline approaches, the projected gap grows relative to available funds, or a critical supplier commitment is exposed. A conditional-only reliance far ahead of the due date may be informational; an imminent uncovered contractual payment may merit an important or critical warning consistent with the platform's existing risk and notification rules (DEC-070, DEC-073–DEC-084). Never equate an expected contribution with a confirmed payment.

**Actionability and user control:** Explain why the warning appears and offer permission-appropriate next actions such as checking contribution timing, updating manually entered funds, reviewing the payment schedule, contacting the contributor outside the platform, or opening the guided budget-rebalancing flow (DEC-123). Viewing, acknowledging or dismissing a warning does not change financial records, contractual dates, contribution status, or underlying risk. Do not automatically spend protected contingency reserves (DEC-124) or request payment from contributors (DEC-121).

**Recalculation and notification:** Reassess warning type and severity when available-funds inputs, expected contribution amounts/dates/statuses, supplier installments, confirmed payments or relevant dates change. Resolve or downgrade warnings only when the underlying dated forecast materially improves, with a traceable reason; preserve warning history. Respect quiet hours, channels, deduplication and authorized escalation from earlier decisions, without leaking contribution identities, amounts or private expenses to unauthorized users.

**Permissions and accessibility:** Display sensitive amounts only to users with financial visibility. Couple partners retain equal access to shared financial risks; planners/helpers see only permitted records. For users without financial access, do not expose figures or inferable contributor details through global dashboards, digests or alerts. Warnings must have text labels, dates and actionable explanations, not color alone, and remain usable on mobile and desktop.

**Acceptance criteria:** (1) With €4,000 available, €6,500 due soon and €3,000 expected before the due dates, show a **dependent on expected contributions** warning rather than an unconditional €2,500 confirmed shortage; (2) if the contribution arrives after a due date, flag the dated shortfall in both views; (3) if both forecasts are negative for an imminent essential supplier payment, increase urgency; (4) an expected contribution due months before a distant payment need not trigger a critical dashboard alert; (5) missing opening funds show insufficient information; (6) after receipt and correct reconciliation of funds, recalculate and reduce the warning when justified; (7) dismissing a notice does not falsely resolve the risk; (8) users without finance permissions cannot see the amounts or private contributor information; (9) no warning automatically transfers reserves, reschedules contracts or contacts contributors; (10) the dashboard warning links to an understandable dated cash-flow breakdown.

**Follow-up:** Decide whether and how the platform should help users compare alternative ways to resolve an identified cash-flow shortfall, while preserving the approved basic forecast rather than silently introducing advanced scenario modeling.

### DEC-128 — Guided resolution workflow for cash-flow shortfalls

**Status:** Approved  
**Decision:** Option C — When a dated cash-flow shortfall is identified, offer an optional guided workflow to inspect the affected obligations, compare practical corrective actions and preview their effect on both approved forecast views before an authorized user confirms any record change. This is a guided decision process, not automatic shortfall resolution or advanced financial scenario modeling.

**Entry and diagnosis:** Open the workflow from a financial dashboard warning (DEC-127) or the cash-flow forecast. Identify the earliest affected due date, amount of shortfall, relevant supplier installments, available-funds assumption and any expected-but-unreceived contributions. Distinguish confirmed obligations from estimates and conservative shortfalls from gaps persisting even if expected contributions arrive. If inputs are incomplete, prompt users to complete or correct them before presenting a definitive resolution.

**Guided action options:** Offer context-relevant steps: (1) verify or update manually entered available funds; (2) check the amount, timing and receipt status of expected contributions, with contributor communication handled outside the platform (DEC-121); (3) review whether an installment is recorded correctly or already paid; (4) inspect existing supplier payment terms and, if necessary, prepare to contact a supplier about a possible change without treating that change as agreed; (5) open guided budget rebalancing (DEC-123), including consideration of unallocated funds and explicitly approved contingency use (DEC-124). Present only actions supported by the user's permissions and actual records. Do not suggest altering contractual deadlines as if they were discretionary.

**Impact preview and confirmation:** For each proposed action, show its assumed effect on the dated conservative and expected-contributions balances, remaining shortfall, affected commitments and available reserve. Label hypothetical changes as **proposed / not yet confirmed**; do not incorporate a supplier extension or contribution promise into the authoritative forecast until the underlying fact is verified and saved. Let users accept actions separately; never require accepting an entire set of suggestions. When a proposed action would modify a budget allocation, reserve, payment record or due date, route it through the existing specific approval, verification and audit requirements rather than bypassing them.

**Workflow states:** Support **Not started**, **In progress**, **Awaiting external confirmation**, **Resolved** and **Closed without resolution** for the guidance process; these states must not be confused with supplier payment states or actual financial-risk severity. Users can pause and resume, and an unresolved or awaiting-confirmation workflow must not suppress risk warnings or ordinary reminders. Recalculate the underlying forecast after verified data changes; mark the shortfall resolved only when the relevant dated funding gap is actually eliminated, otherwise retain and update the warning.

**Permissions, privacy and accessibility:** Couples retain equal access to shared finances, while private expenses and professional visibility remain governed by DEC-122. Only authorized users can change financial records or approve budget/reserve adjustments. No contributor-facing accounts, direct automated contributor requests, automatic money movements, contract changes or payment status updates are created by this workflow. Keep a concise audit trail of proposed, accepted, rejected and externally pending actions; provide clear mobile-friendly steps and text explanations independent of color.

**Acceptance criteria:** (1) A €2,500 shortfall can open a guided breakdown of affected payment dates and funding; (2) the workflow distinguishes a conservative-only gap from one in both forecast views; (3) users can preview a hypothetical contribution arriving earlier without marking it received; (4) a supplier extension remains pending until confirmed and recorded by an authorized user; (5) using a contingency reserve requires the existing explicit approval; (6) accepting one action does not apply other suggested actions; (7) closing the workflow does not dismiss or resolve an actual shortfall; (8) corrected available funds trigger forecast and warning recalculation without double counting; (9) unauthorized users cannot see or change protected financial details; (10) no workflow step automatically changes contracts, payment status or supplier obligations.

**Follow-up:** Decide how the platform should handle a proposed supplier payment-date change while awaiting external confirmation, including whether and how to track it separately from the contractual due date.

### DEC-129 — Pending proposed supplier payment date

**Status:** Approved  
**Decision:** Option B — When a couple or authorized planner requests a different supplier installment due date, store the **proposed date** separately from the **currently agreed contractual due date**. A pending proposal never replaces the binding due date. Once the supplier has confirmed the change, an authorized user may approve and record the new agreed date under existing financial and permission safeguards.

**Payment date fields and states:** Each affected installment retains its authoritative agreed due date, alongside an optional proposed due date and a simple proposal status: **Pending**, **Confirmed by supplier — awaiting authorized approval**, **Applied**, **Declined**, or **Withdrawn**. A proposal may include an optional note and supplier-confirmation reference. These states describe the date-change proposal, not whether an installment has been paid (DEC-117). The platform must not infer supplier agreement from the mere passage of time or from a user's requested date.

**Creation and review:** Authorized financial editors can enter a proposed date and explain that the supplier has been asked outside the platform. Show both dates together, with the original contractual date visually and textually identified as **still effective**. If the supplier declines or a request is withdrawn, keep the agreed due date unchanged and preserve the proposal history. If the supplier agrees, record that confirmation and require an authorized user to explicitly apply the new agreed date. Where contractual terms require additional formalities, users must complete them externally before applying the change; the platform does not itself amend the contract or certify legal enforceability.

**Forecasts, reminders and risk:** Until the proposed change is confirmed **and applied**, both conservative and expected-contributions forecasts (DEC-125/126) continue using the original agreed due date, and existing due/overdue reminders and financial risk warnings (DEC-118/127) remain active. The guided shortfall workflow (DEC-128) may show the proposed date as a clearly labeled *hypothetical* impact preview, never as an actual resolved shortfall. Applying a verified date change recalculates forecasts and reminders, preserves paid/recorded/disputed states and installment amounts, and reassesses the risk on its merits.

**Permissions, privacy and history:** Only authorized users may propose, confirm or apply changes. Both partners have equal access to shared financial commitments, while protected private expenses and planner restrictions remain governed by DEC-122. Store who proposed and applied the change, when, the previous agreed date, the proposed date, and any supplied confirmation details. No supplier portal, automatic supplier acceptance, automatic rescheduling, or contributor access is introduced by this decision.

**Acceptance criteria:** (1) For an installment due 1 November, a requested 15 November date is displayed as pending while 1 November remains the operative due date; (2) the cash-flow forecast and reminders continue using 1 November until confirmation and authorized application; (3) the pending proposal does not clear an active €2,500 shortfall; (4) a supplier refusal preserves the original due date and records the declined proposal; (5) a supplier's confirmation alone does not silently modify the schedule; (6) applying an approved change updates relevant forecasts and reminders without changing the amount or payment status; (7) the original due date and decision history remain available; (8) unauthorized users cannot apply date changes; (9) proposals cannot be used to conceal a hard deadline or overdue payment; (10) both dates and their statuses are understandable without relying on color.

**Follow-up:** Decide how to represent supplier confirmation of a proposed payment-date change: user-attested confirmation, optional documentary proof, or evidence required before the revised due date may be applied.

### DEC-130 — Manual supplier confirmation for proposed payment-date changes

**Status:** Approved  
**Decision:** Option A — An authorized user may manually attest that a supplier has agreed to a proposed installment due date and apply the confirmed change **without a required explanation, confirmation-method entry, or supporting document**. The platform records the user's attestation as a user-entered fact, not as independent supplier verification or a legally executed contract amendment.

**Workflow:** While the request is pending, the original agreed date remains effective (DEC-129). Once the supplier agrees outside the platform, an authorized user explicitly marks the proposal **Confirmed by supplier** and then approves/apply the revised date. These may be offered in one deliberate confirmation interaction, provided the user can clearly see the original and replacement dates and understands that they are attesting to the supplier's agreement. No supplier account or platform-side supplier approval is required. The user may optionally retain notes or supporting evidence, but neither is a prerequisite.

**Financial integrity:** A merely proposed or unconfirmed date cannot change cash-flow forecasts, installment reminders, risk warnings, or contractual records. After the authorized confirmation and application, the new agreed date becomes the operative date for those calculations. The action does not itself change the amount due, payment status, supplier contract text, or any actual funds. If a contract requires a written amendment or other external formality, the user remains responsible for obtaining it; the platform does not claim that a manual attestation satisfies those requirements.

**Permissions, audit, and correction:** Only users with appropriate financial permissions can confirm and apply a proposed date. Preserve the old agreed date, new date, who attested and applied it, and when, along with the proposal's status history. An incorrectly attested change can be corrected through an authorized, auditable action; the previous date and intervening alerts remain traceable. Equal partner access to shared commitments and protected private-expense rules continue to apply (DEC-122).

**Acceptance criteria:** (1) An authorized user can confirm the supplier agreed to 15 November without uploading an email or writing a note; (2) the user must take an explicit confirmation action rather than simply edit a date; (3) 1 November remains effective while the proposal is pending; (4) the forecast and reminders update only after authorized application; (5) the interface labels the confirmation as user-recorded, not independently verified; (6) unauthorized users cannot attest or apply the change; (7) the change history records actor, timestamp, original date and new date; (8) applying the new date does not mark an invoice paid or alter the amount due; (9) a correction retains audit history; (10) the platform does not claim to amend supplier contracts automatically.

**Follow-up:** Decide how to handle installment payment dates that have already passed when a supplier's agreed extension is entered retrospectively, including overdue history and notifications.

### DEC-131 — Resolve current overdue status while preserving historical context

**Status:** Approved  
**Decision:** Option C — When a supplier agrees after an installment's original due date to extend that date, the new date becomes operative only after the supplier agreement is manually confirmed and the revised date is explicitly applied by an authorized user (DEC-129/130). If the installment remains unpaid but the new due date is in the future, it is **not currently overdue**. Previously issued overdue warnings and the original deadline remain in the audit history, explicitly labeled as **superseded by an agreed extension** rather than deleted or presented as an ongoing delinquency.

**Current state and timelines:** Current dashboards, payment calendars, reminders and both cash-flow forecasts use the newly agreed due date after application. A prior overdue event remains a historical event with its original occurrence date, the previous due date, and a link to the approved extension. The installment must not simultaneously display an active overdue state solely because of the superseded date. If the replacement date is already past and an unpaid balance remains, the installment is still overdue under the new date; if fully paid, normal payment-state rules apply. Do not erase, backdate, or falsely rewrite actual historical events.

**Alerts and risk:** On authorized application, resolve or supersede alerts whose only basis was the old due date, retain their delivery/activity history, and reassess risk against the revised date, outstanding amount, contribution assumptions, and other actual obligations. Do not retract notifications already sent; in-app views may indicate that an earlier warning was subsequently superseded. New reminders follow the replacement schedule and existing notification safeguards. If the extension is merely requested or supplier agreement is unconfirmed, original overdue states and alerts stay active.

**Permissions, contract and audit:** Require existing financial permissions and explicit user-recorded supplier agreement (DEC-130), with no mandatory note or document. Preserve original and replacement dates, confirmation/application actor and time, overdue event timestamps, and related alerts. The platform must not imply it independently verified the supplier's agreement or legally amended the contract. Correcting an erroneous extension must restore appropriate current-state and risk assessments without deleting prior history. Protected private-expense visibility and planner access rules continue to apply.

**Acceptance criteria:** (1) An unpaid 1 November installment is marked overdue on 2 November; (2) an unconfirmed proposal for 15 November leaves that warning active; (3) when the supplier agrees on 5 November and an authorized user confirms/applies 15 November, the installment is no longer currently overdue as of 5 November; (4) the original 1 November date and 2 November overdue warning remain traceable and clearly superseded; (5) current reminders and cash-flow forecasts use 15 November; (6) already-sent notifications are not erased or silently retracted; (7) if the new due date has also passed, an unpaid balance remains overdue; (8) no payment or supplier contract is automatically modified; (9) unauthorized users cannot retroactively alter the due date; (10) correction of a mistaken extension preserves the full history and recalculates risk.

**Follow-up:** Decide how the platform should handle supplier invoices or installments that are partially paid, including allocation of partial amounts, outstanding balances and payment reminders.

### DEC-132 — Detailed partial payments with installment allocation

**Status:** Approved  
**Decision:** Option C — Record each partial supplier payment separately and, when an invoice has an installment schedule, allocate payment amounts to specific installments. Calculate paid and outstanding balances automatically, respect the existing distinction between **Recorded**, **Confirmed**, and **Disputed** payments (DEC-117), and direct reminders only at amounts that remain due. Prevent double-counting and accidental overpayment.

**Payment records and allocation:** Each payment entry includes an amount, payment date, applicable supplier/invoice, payer when relevant, and existing payment-verification state. An entry may be allocated across one or more installments, but the total allocated amount cannot exceed that payment's amount or the eligible outstanding balances without an explicit correction workflow. Unallocated recorded funds must be visible as such rather than silently counted against an installment. Deposits already recorded as installments must not also count as separate additional payments. Direct payments by family or sponsors remain distinguishable from money received by the couple (DEC-120).

**Balances and status:** For each invoice and installment, display total due, recorded amounts, confirmed amounts, disputed amounts, and outstanding balance with labels that do not imply recorded-but-unconfirmed money has been independently verified. An installment can be **Partially paid** when applicable; a fully settled status requires the appropriate payment confirmation under DEC-117. Payment corrections, reversals, and disputes trigger recalculation without deleting history. Never count the same payment toward multiple invoices or twice toward one invoice.

**Reminders and cash-flow:** Reminders, overdue indicators, and forecasts use the remaining amount due for each installment and its currently effective due date (DEC-118/119/129–131). Do not continue sending full-amount reminders after a valid partial payment. Show when a remaining balance is already overdue; confirmed date extensions govern its deadline. Both conservative and expected-contribution cash-flow views (DEC-125/126) must reflect payment entries consistently and avoid treating a recorded-but-unconfirmed payment as both available cash and settled expenditure.

**Safeguards and permissions:** Authorized users may enter and allocate partial payments; only users with the appropriate permission may confirm, dispute, correct, or reallocate them. Warn against amounts exceeding the outstanding balance, duplicated transaction references, and inconsistent installment allocations. Do not silently create a credit balance, issue a refund, or modify a supplier's invoice or contractual obligations. Preserve original and corrected allocations, actors, timestamps, and financial audit trails; private-expense visibility rules (DEC-122) remain in force.

**Acceptance criteria:** (1) For a €4,000 invoice, a €1,500 partial payment leaves €2,500 outstanding; (2) users can enter several distinct partial payments; (3) where installments exist, a payment can be allocated to one or several eligible installments without exceeding its value; (4) recorded versus confirmed versus disputed money is visibly distinguished; (5) reminders reference only outstanding amounts due and the effective deadline; (6) overdue status is calculated on the unpaid portion, not the original full amount; (7) deposits and sponsor-direct payments cannot be counted twice; (8) overpayment and duplicate-entry attempts are prevented or flagged for explicit correction; (9) corrections and reallocations preserve history and update forecasts; (10) unauthorized users cannot change financial payment allocations.

**Follow-up:** Decide how to represent supplier overpayments, credits and refunds after payment records are corrected or suppliers return money.

### DEC-133 — Structured supplier refunds and credits

**Status:** Approved  
**Decision:** Option C — Structured refunds and supplier credits.

**Product behavior:**

- Track supplier overpayments and credits distinctly from payments, invoices, commitments, and cash received. An overpayment or credit is not automatically a refund.
- Support refund states including **refund due / requested**, **refund received**, and where relevant **disputed or cancelled**, with amount, expected/actual dates, linked supplier, invoice, and originating payment.
- Support credits applied to future installments; record the specific installment and amount credited, with any unapplied credit remaining visible.
- Recalculate the supplier's outstanding balance, installment balances, and the two approved cash-flow views without double-counting an original payment, credit, or refund.
- Expected refunds may be shown as anticipated inflows but **must not be counted as available/received funds** until an authorized user confirms actual receipt; distinguish user-recorded receipt from independent bank verification.
- Prevent allocating the same credit more than once, applying credits exceeding the available balance, or treating a pending refund as both a future installment credit and incoming cash.
- Preserve original payment and invoice history. Corrections, reversals, refund receipt, and credit reallocations must be traceable rather than silently overwriting prior records.
- Respect shared financial permissions and protected private expenses; only authorized users may record, confirm, adjust, or reverse supplier refunds and credits.
- Do not automatically initiate external transfers, alter supplier contracts, or presume that a supplier has agreed to a refund or credit.

**Acceptance criteria:** An authorized user can record a €500 credit, allocate it to an upcoming installment *or* track it as a refund due, and later confirm a refund received; invoice balances, outstanding obligations, and conservative/expected cash-flow forecasts update consistently, without duplicated funds or lost audit history.

**Scope:** Structured tracking and guided reconciliation only; no automatic bank matching, supplier-ledger accounting, or automatic disbursements.

### DEC-134 — Basic disputed amount tracking

**Status:** Approved  
**Decision:** Option B — Basic disputed amount tracking. Authorized users can identify the disputed portion of a supplier charge, payment, refund, or credit and record a brief reason and resolution status. Keep disputed amounts visible alongside undisputed amounts so disagreement does not silently change financial obligations, available funds, or payment verification.

**Product behavior:**

- Link each dispute to the relevant supplier and financial record, with the disputed amount, currency, brief reason, recording actor and date, and an **Open** or **Resolved** status. Allow an optional note or supporting evidence under existing financial visibility rules. Support disputes affecting all or part of a record; prevent overlapping entries from counting the same amount twice.
- Show the original amount, disputed portion, and undisputed portion together. A dispute is an uncertainty marker, not an additional expense, payment, refund, or credit. Preserve the distinctions between recorded payments, confirmed payments, supplier-acknowledged receipt, and disputed records established in DEC-117.
- Opening a dispute does not reduce an invoice, cancel a commitment, apply a credit, confirm a refund, reverse an actual payment, or change an agreed due date. Retain the existing obligation and payment history until an authorized correction or confirmed financial adjustment is explicitly applied through the relevant workflow.
- Keep disputed unpaid charges visible in both approved cash-flow views, clearly labeled as contested exposure. Do not assume the dispute will succeed or free the disputed amount for other spending. A disputed expected refund remains uncertain and cannot become available funds without confirmed receipt (DEC-133). A disagreement about an existing payment must not count the money as both available cash and settled expenditure.
- Continue normal payment reminders for undisputed unpaid amounts using the effective agreed due date. For the disputed portion, use a clearly labeled review/follow-up reminder identifying the amount, date, and unresolved exposure rather than an unqualified instruction to pay again. Disputed due or overdue amounts remain visible as such; opening a dispute does not imply a supplier-agreed payment suspension or suppress relevant financial-risk warnings (DEC-118/127).
- Resolving a dispute requires an authorized user to record the outcome. Closing the dispute alone does not alter balances or payment confirmation. Any resulting invoice correction, payment correction, credit, refund, or agreed date change must be explicitly applied through DEC-117/129–133 as applicable, with recalculation of balances, forecasts, reminders, and current risk.
- Preserve original and revised dispute amounts, reasons, outcomes, actors, timestamps, and linked financial adjustments. Restrict recording, editing, and resolution to users with the relevant financial permissions; protect private expenses and evidence under DEC-122. External supplier communication continues outside this basic tracking workflow.

**Acceptance criteria:** (1) A €2,000 unpaid charge with €300 disputed shows €1,700 undisputed and €300 disputed, while retaining €2,000 of exposure until an approved adjustment; (2) ordinary payment reminders refer to the €1,700 unpaid undisputed portion, with a separate review follow-up for the €300; (3) disputing a reported payment never prompts an unqualified duplicate payment instruction; (4) a contested €500 refund is not counted as received cash; (5) resolving a dispute without a financial adjustment leaves balances unchanged; (6) an explicitly applied €300 supplier credit updates the linked obligation once, preserves the original charge and dispute history, and recalculates forecasts and reminders; (7) unauthorized users cannot change disputes or see restricted financial details.

**Scope:** Basic amount, reason, status, and outcome tracking with existing financial safeguards. Detailed case management, supplier participation, automated negotiation, and adjudication are not approved by this decision.

**Follow-up:** Decide whether basic financial disputes should have a designated internal follow-up owner and an optional review date.

### DEC-135 — Optional dispute owner and review date

**Status:** Approved  
**Decision:** Option B — Optional owner and review date. A financial dispute may have one designated internal follow-up owner and an optional review date. Either field can be used independently; neither is required to create, save, or maintain an open dispute.

**Product behavior:**

- Authorized financial collaborators may assign, change, or clear the owner and review date. The owner must be an existing wedding collaborator with access to the relevant financial record; assignment does not grant new access or expose protected private expenses (DEC-122).
- Show the owner and review date on the dispute when present, and clearly indicate when no owner or date is set. Keep unassigned and undated disputes discoverable to authorized financial collaborators. Do not automatically assign the creator, a partner, or the lead planner merely because an owner has not been chosen.
- Ownership identifies responsibility for coordinating follow-up, not exclusive control. Other appropriately authorized collaborators can still review and update the dispute. Assignment does not grant payment-confirmation, financial-adjustment, or dispute-resolution authority beyond existing permissions.
- The review date is an internal follow-up target, separate from a supplier payment deadline or expected refund date. Setting, passing, changing, or clearing it does not suspend an obligation, change a cash-flow forecast, resolve the dispute, or suppress existing financial-risk warnings and dispute-aware reminders (DEC-134).
- If the owner loses access, cease routing restricted dispute information to that person and show the dispute as needing reassignment to eligible viewers. Do not silently grant access or select a replacement. Preserve assignment and review-date changes with actor and timestamp in the existing history.

**Acceptance criteria:** (1) An authorized user can create a dispute with neither field completed; (2) an owner can be assigned without a review date, and a review date set without an owner; (3) users cannot assign someone lacking access to the financial record; (4) an authorized collaborator other than the owner can update the dispute under existing permissions; (5) changing the review date leaves supplier due dates, balances, and forecast exposure unchanged; (6) removing an owner's access stops restricted follow-up delivery and makes the need for reassignment visible to eligible users; (7) changes remain traceable without exposing private expenses.

**Scope and follow-up:** This decision approves optional ownership and review-date tracking. Decide next whether reaching a review date should trigger an additional reminder and whether that reminder repeats; existing payment and financial-risk notification requirements remain applicable.

### DEC-136 — One-time dispute review reminder

**Status:** Approved  
**Decision:** Option B — One reminder. When an open financial dispute reaches its optional review date, notify its designated owner once. If it has no eligible owner, notify authorized financial collaborators with access to that dispute. Keep the overdue review visible afterward without automatically repeating this review-date reminder.

**Product behavior:**

- Generate the reminder only for an open dispute with a review date that has been reached. Disputes without a review date do not generate this additional reminder. Recheck status, date, ownership, and recipient access before delivery; a resolved dispute or a superseded review date must not produce a stale reminder.
- Route the reminder to the eligible designated owner, or to authorized financial collaborators who can follow up when the dispute is unassigned or its former owner no longer has access. Assignment never grants financial access; private-expense restrictions remain applicable (DEC-122/135).
- Use existing channel preferences, quiet hours, and notification deduplication. The reminder identifies an internal dispute review, links to the permitted record, and does not instruct the recipient to pay the disputed amount again.
- After the reminder, show **Review overdue** with the review date while the dispute remains open and that date remains past. Reading, acknowledging, or dismissing the reminder does not resolve the dispute or remove this indicator. Resolving the dispute or setting a future review date removes the current overdue-review indicator while preserving history.
- An authorized user may explicitly set a new future review date to schedule a new one-time review reminder. Merely editing notes, changing an owner, or revisiting the same reached review date does not restart or duplicate the reminder.
- Continue existing payment reminders, dispute follow-ups, financial-risk alerts, and applicable escalation independently (DEC-118/127/134). This one-time limit applies to the additional review-date reminder only; the review date does not change supplier deadlines, balances, cash-flow exposure, or payment verification.

**Acceptance criteria:** (1) An open dispute reaching its review date generates one reminder to its eligible owner; (2) an unassigned dispute routes that reminder to authorized financial collaborators with access; (3) restricted information is not delivered to a former owner who has lost access; (4) the review remains visibly overdue without a daily repeat of this reminder; (5) resolving the dispute before delivery cancels the obsolete reminder; (6) explicitly scheduling a new future review date permits a new one-time reminder; (7) other applicable payment and financial-risk alerts continue, and no financial amounts or obligations change.

**Follow-up:** Decide the scope of wedding financial reports and exports for couples and authorized planners.

### DEC-137 — Standard financial summaries and detailed exports

**Status:** Approved  
**Decision:** Option B — Standard summary and detailed exports. Provide a wedding budget overview and itemized financial reports covering expenses, payments, contributions, refunds, supplier credits, and disputes, with useful filters. Couples and authorized planners can export the information they are permitted to view.

**Product behavior:**

- Provide a standard overview of the overall budget, category allocations, contingency reserve, estimated and committed costs, reported and confirmed payments, outstanding obligations, and expected versus received contributions. Show refunds, credits, and disputed exposure distinctly wherever they affect the interpretation of totals.
- Provide detailed views and exports for expenses and supplier installments, payment entries and allocations, contributions and direct supplier payments, refunds due and received, available and applied credits, and open or resolved disputes. Include relevant amounts, currencies, dates, categories, supplier or contributor references, and record states subject to permissions. Preserve links or references between related entries so users can reconcile a summary to its underlying records.
- Offer useful filters by budget category, supplier, relevant date range, and applicable financial status; contribution reports may also filter by contributor where permitted. Label the date basis used, such as payment date versus installment due date, and show active filters and generation time. Clearly distinguish a filtered subtotal from the full permitted wedding total.
- Apply the same balance and verification rules as the living financial records (DEC-115–136). Separate estimated, committed, recorded, confirmed, disputed, expected, and received amounts rather than presenting them as interchangeable. Do not double-count contributions as wedding costs, credits as cash receipts, refunds as new contributions, or payments allocated across installments. Keep currencies separate unless an explicit conversion basis is available under existing requirements.
- Reports reflect the current permitted records at generation time; an exported copy is a dated snapshot and does not update itself. Generating or filtering a report does not change financial records, obligations, due dates, payment states, or dispute outcomes.
- Enforce financial visibility and protected private-expense rules (DEC-122) throughout summaries, details, filters, totals, and exports. Do not reveal excluded private records through hidden rows, attachment references, counts, or unexplained total differences. Both partners retain equal access to shared financial reports; planner access follows existing delegation. Supporting evidence and sensitive payment identifiers are not automatically bundled into financial exports.
- Let users review the report scope and filters before exporting. Exporting produces a file for the requesting user; it does not automatically send the report to suppliers, contributors, or other external recipients.

**Acceptance criteria:** (1) A user can view and export a standard wedding budget overview and itemized expense/payment details; (2) contribution, refund, credit, and dispute details remain available without being misrepresented as paid costs or received funds; (3) filtering by supplier or category produces a clearly labeled subtotal that reconciles to included records; (4) a recorded-but-unconfirmed payment remains labeled as such in the export; (5) a partially disputed invoice shows the disputed exposure without adding it a second time; (6) a planner's export excludes private expenses and restricted evidence they cannot view; (7) the export shows its generation time and applied filters, and does not modify source records or send itself externally.

**Scope and follow-up:** Approves standard reports, detailed exports, and useful filters. A custom report builder, saved custom layouts, email delivery, and automatic external sharing remain unapproved; scheduled in-app generation is defined in DEC-142. Downloadable formats are defined in DEC-138; reusable financial report filter presets are defined in DEC-139.

### DEC-138 — PDF and Excel financial exports

**Status:** Approved  
**Decision:** Option B — PDF and Excel (.xlsx). Support both formats for the standard wedding financial summaries and detailed exports approved in DEC-137.

**Product behavior:**

- Let authorized users choose PDF or Excel (.xlsx) after reviewing the report scope and filters. Both formats cover the approved standard summaries and itemized financial details; CSV is not included in this decision.
- PDF reports provide readable, shareable and printable summaries and detail tables, with clear headings, repeated table headers across pages, and no clipped amounts or omitted records. Long reports may span multiple pages.
- Excel exports provide clearly labeled summary and detail worksheets where relevant, consistent column headings, sortable and filterable tables, and amounts and dates usable for further spreadsheet analysis. Include currency labels and distinguish blank or unknown values from zero. Preserve references needed to reconcile related entries without double-counting.
- Both formats preserve the same selected scope, active filters, date basis, generation time, financial states, verification distinctions, currency separation and reconciled totals under DEC-137. Label files as dated snapshots; formatting differences must not change their financial meaning.
- Apply the same access restrictions in both formats. Excluded private expenses, restricted evidence and sensitive identifiers must not appear in hidden worksheets, rows, columns, comments or document metadata. Supporting documents are not automatically bundled.
- Exporting does not change source records or send files externally. Changes made to a downloaded spreadsheet do not update the platform; spreadsheet import or synchronization is not approved by this decision. If generation fails, clearly report the failure and allow a retry without presenting an incomplete file as successful.

**Acceptance criteria:** (1) An authorized user can download the standard overview and detailed financial reports as PDF or .xlsx; (2) identical scope and filters produce matching totals and financial states in both formats; (3) PDF tables remain readable across page breaks and Excel detail tables can be sorted and filtered with usable amounts and dates; (4) restricted information is absent from visible and hidden file content; (5) both files show generation time and scope, and editing the downloaded spreadsheet leaves platform records unchanged; (6) failed generation offers a clear retry and does not claim success.

**Scope and follow-up:** Approves PDF and Excel formats only. CSV, spreadsheet import, custom report builders, email delivery and automatic external sharing remain unapproved; scheduled in-app generation is defined in DEC-142. Reusable filter presets are defined in DEC-139.

### DEC-139 — Personal and organization-shared financial report presets

**Status:** Approved  
**Decision:** Option C — Support both personal and planner-organization shared presets for reusable financial report filters.

**Product behavior:**

- Allow authorized users to save a named preset of report type and filter selections, then select it when preparing another financial report. Applying a preset fills the report criteria; the user can review and adjust the criteria before viewing or exporting. A preset never stores a report snapshot or changes financial records.
- Personal presets are available only to their creator. Authorized planner-organization managers can create and manage organization-shared presets; they may grant suitable staff permission to create or edit them. Organization users with access to the relevant wedding and financial data can discover and apply shared presets, subject to their existing permissions.
- Keep personal and organization-shared presets distinct and clearly labeled. Users may create a personal copy of a shared preset; editing that copy does not change the organization preset. Shared-preset edit, archive, and permanent-delete permissions follow DEC-168 and DEC-171.
- Show the preset name and included criteria before application. Warn about unavailable or invalid criteria and let the user review a safe adjusted selection; do not silently broaden access or remove meaningful filters. Presets cannot grant report or financial-data permissions.
- Recheck the user's current wedding, financial-data and private-expense permissions each time a preset is applied and when a report is viewed or exported. Never expose restricted records through preset names, descriptions, filter values, counts, or results. Shared presets contain filter definitions only, not wedding data or report results.
- Show who created or last changed a shared preset and when. Changes to a preset affect future applications and do not alter a report already being viewed or a previously generated export. Clearly handle archived or deleted presets so users are not left with a silently changed report selection. Scheduled reports that reference a permanently deleted shared preset continue under the preserved filter behavior in DEC-180.

**Acceptance criteria:** (1) An authorized user can save, find, apply, edit, and delete their own personal presets; (2) authorized organization staff can create and manage shared presets, and eligible colleagues can apply them; (3) a personal copy can be changed without altering its shared source; (4) applying a preset does not bypass current wedding or financial permissions, including private-expense restrictions; (5) unavailable filters are clearly identified and reviewed before proceeding; (6) changing a preset does not change prior reports or exports.

**Scope and follow-up:** Approves personal and organization-shared presets for report criteria. Presets do not save report data, grant access, or create custom report layouts. Date-filter behavior is defined in DEC-140.

### DEC-140 — Fixed and common relative date filters in financial report presets

**Status:** Approved  
**Decision:** Option B — Saved financial report presets may use either fixed date ranges or supported common relative date ranges.

**Product behavior:**

- Allow a preset to retain fixed start and end dates or a supported relative range. Relative presets use common choices such as this month, last month, trailing 30 days, trailing 90 days, and year to date. The user chooses the applicable date field, such as payment date or installment due date, consistent with DEC-137.
- Fixed dates remain unchanged each time the preset is applied. Relative ranges are recalculated when applied, using the current date in the wedding's configured time zone; if none is configured, use the account's time zone and make that basis clear. Display the resolved start and end dates before the report is run or exported.
- Define range boundaries consistently and include both displayed start and end dates. Clearly distinguish a completed prior period, such as last month, from a rolling period, such as trailing 30 days. Do not silently change a preset's selected range or date field.
- Let an authorized user change the resolved dates or range for the current report without changing the saved preset, unless they explicitly choose to update that preset and have permission to do so. When updating a shared preset, follow DEC-139 management permissions and indicate that the change affects future applications.
- If a saved relative range or date field is no longer available, explain the issue and require review of the replacement criteria before generating the report. Never broaden the report silently.

**Acceptance criteria:** (1) Users can save fixed dates or a supported common relative range in personal and shared presets; (2) fixed ranges remain fixed while relative ranges resolve anew on application; (3) the resolved inclusive dates and date field are visible before generation and appear in report scope details; (4) changing dates for one report does not overwrite the saved preset without explicit action and permission; (5) unavailable criteria require review and cannot silently broaden the report.

**Scope and follow-up:** Approves fixed ranges and common relative date presets. User-defined custom rolling-range formulas and email delivery remain unapproved; scheduled in-app generation is defined in DEC-142. Preset organization and discovery are defined in DEC-141.

### DEC-141 — Categories, tags, and search for saved report presets

**Status:** Approved  
**Decision:** Option B — Organize financial report presets with categories or tags and provide search across personal and organization-shared presets.

**Product behavior:**

- Provide a clear way to categorize or tag saved presets and search them by name and descriptive metadata. Users can distinguish personal presets from organization-shared presets and can filter the list by scope and category or tag.
- Allow personal preset creators to maintain their own descriptive tags. Organization-shared presets use categories or tags available to the organization, managed by users authorized to manage shared presets. Users may assign an allowed category or tag when creating or editing a preset, subject to DEC-139 permissions.
- Search and filtering operate on preset names, descriptions, categories, and tags, not on wedding financial records or report results. Search results include only presets the user is authorized to discover and apply.
- Keep organization-shared categories and tags consistent for organization users. If an authorized manager renames, merges, or removes a shared category or tag, update its use on presets consistently and preserve each preset's other criteria and access rules. Personal tags remain under their creator's control.
- Make category, tag, or search matches visible in the list. An empty result state should allow the user to adjust the query or filters without changing or deleting any preset.

**Acceptance criteria:** (1) Users can categorize or tag and search their personal presets; (2) authorized users can categorize or tag and search organization-shared presets using organization-managed labels; (3) users can filter by personal/shared scope and category or tag; (4) search never reveals presets beyond the user's permissions or searches underlying financial data; (5) changing a label does not change preset filters or grant access; (6) users can clear filters and recover the full list of presets available to them.

**Scope and follow-up:** Approves categories or tags and search for personal and organization-shared presets. Preset folders and nested taxonomies remain undecided. Scheduled report generation is defined in DEC-142.

### DEC-142 — Scheduled financial report generation with in-app notification

**Status:** Approved  
**Decision:** Option B — Let authorized users schedule recurring financial report generation and notify them in-app when each report is ready.

**Product behavior:**

- Let a user with permission to view and export the selected financial information create a recurring schedule for an approved financial report, using a reviewed report scope and filters. Offer weekly and monthly frequencies with owner-selected weekday or day of month and local run time under DEC-153. Show a clear next-run date and time in the wedding's configured time zone; use the account time zone if none is configured and show the basis.
- Generate each run as an in-app report snapshot in the selected PDF or Excel (.xlsx) format. Apply the access, privacy, reconciliation, and currency rules in DEC-137 and DEC-138. Do not email or automatically share the generated file.
- For scheduled occurrences, notify the schedule owner and selected authorized collaborators under DEC-149. Manual-run notices follow DEC-157. Notices link to the report within the application. For a scheduled failure, notify the owner in-app with a clear status and retry action; for a manual failure, notify only the initiator under DEC-157. Do not represent an incomplete report as ready.
- Before confirming a schedule, show its report type, criteria, date behavior, format, frequency, next run, and recipient (the authorized schedule owner). Relative date ranges resolve at run time under DEC-140. A scheduled report uses the criteria reviewed when the schedule was created; changing those criteria requires an explicit authorized update to the schedule. If its organization-shared source preset is permanently deleted, preserve the schedule's filter definition and continue the schedule under DEC-180.
- Recheck wedding membership, financial permissions, and private-expense visibility for every run and whenever a generated report is viewed or downloaded. If the owner loses access or authorization, pause future runs and make restricted report snapshots unavailable; notify an eligible authorized wedding administrator in-app to review ownership or cancellation without disclosing report contents.
- Let the schedule owner review upcoming runs, past run dates and statuses, change or pause the schedule, run the report manually under DEC-156, and cancel future runs. Pausing or cancelling does not alter financial records or already generated report contents, though access to each stored snapshot remains permission-controlled.
- Keep a schedule history of run dates and statuses. Generated report snapshot availability and expiry are defined in DEC-143; users must be able to distinguish a past snapshot from current financial data.

**Acceptance criteria:** (1) An authorized user can create, review, pause, resume, update, manually run, and cancel weekly or monthly report schedules; (2) each successful scheduled occurrence creates the selected PDF or .xlsx snapshot and sends in-app ready notices under DEC-149; manual-run notices follow DEC-157; (3) failed runs show a failure state and retry action without a false ready notice; (4) relative date filters resolve at run time and schedule criteria change only after explicit authorized update; (5) access and private-expense permissions are rechecked on every run and on every view or download; (6) loss of authorization pauses future runs and prevents access to restricted snapshots; (7) the schedule history distinguishes completed, failed, and upcoming runs.

**Scope and follow-up:** Approves recurring weekly or monthly in-app generation and in-app notifications. Email delivery and automatic external sharing remain undecided. Schedule frequency is limited to weekly and monthly under DEC-152. Generated-file retention is defined in DEC-143; temporary run retries are defined in DEC-144.

### DEC-143 — 30-day availability for generated report snapshots

**Status:** Approved  
**Decision:** Option A — Keep each scheduled financial report snapshot available in the application for 30 days after it is generated.

**Product behavior:**

- Make a successfully generated scheduled PDF or Excel report available to its authorized recipient in the application for 30 days from its generation time. Display the expiration date with the report and in its run history.
- After 30 days, remove the stored report file and any application preview or cached copy. Keep a minimal schedule-history entry showing the run date, completion status, selected format, and that the snapshot expired; do not retain report contents or financial row data in that history entry.
- If a user follows a notification or history link after expiration, explain that the snapshot is no longer available and offer to run the report again if they remain authorized. A new report is a new snapshot and does not restore the expired file.
- Recheck the user's current wedding and financial permissions when they open or download a snapshot during its availability period. If permission is removed before expiry, make the snapshot inaccessible immediately; the 30-day period is a maximum, not a guarantee of continued access.
- Expiration does not delete financial records or affect reports the user downloaded and saved outside the application. A user's own downloads remain under their control.

**Acceptance criteria:** (1) Each generated report shows a clear expiration date 30 days after generation; (2) the in-app report becomes unavailable at expiry and stored content and previews are removed; (3) the schedule history keeps only minimal non-financial run metadata and an expired status; (4) expired links explain the outcome and offer a new run when authorized; (5) revoked access blocks viewing and downloading before expiry; (6) expiry does not change underlying wedding financial data.

**Scope and follow-up:** Approves 30-day in-app availability for scheduled report snapshots. It does not control copies downloaded outside the application. Decide next whether a failed scheduled run should be retried automatically.

### DEC-144 — Up to three automatic retries for temporary report-generation failures

**Status:** Approved  
**Decision:** Option C — Retry temporary scheduled report-generation failures automatically up to three times, then notify the schedule owner.

**Product behavior:**

- For a scheduled report run that fails because of a temporary generation or service problem, retry the same run up to three times after the initial attempt. Space retries to allow a temporary problem to clear and avoid running overlapping attempts for the same scheduled occurrence.
- Do not retry failures that require user action, including revoked access, invalid report criteria, or a missing or unavailable source. Mark the run failed and notify the schedule owner in-app promptly with a clear reason and available action. When access is no longer valid, follow DEC-142 access safeguards and pause the schedule as required.
- If all three retries fail, mark the run failed and notify the schedule owner in-app with the failure status and a manual retry option where the owner remains authorized. Do not create duplicate report snapshots or ready notifications for one scheduled occurrence.
- Record the initial attempt, retry attempts, final status, and relevant failure category in the schedule history without exposing financial report contents. A successful retry creates one report snapshot and one ready notification, subject to the 30-day availability rule in DEC-143.
- A failed run does not change the underlying financial records. How repeated failed scheduled occurrences affect future runs remains undecided.

**Acceptance criteria:** (1) A temporary failure triggers no more than three automatic retries after the initial attempt; (2) retries for one occurrence do not overlap or create duplicate snapshots; (3) failures needing user action are reported without futile automatic retries; (4) success after a retry produces one snapshot and one ready notification; (5) three failed retries produce a clear in-app failure notice and, when authorized, a manual retry action; (6) the attempt and outcome history excludes financial report contents.

**Scope and follow-up:** Approves up to three retries for temporary scheduled report-generation failures. Retry spacing and technical classification are implementation details; the product must communicate the final status clearly. Repeated-failure pausing is defined in DEC-145.

### DEC-145 — Pause after three consecutive failed scheduled runs

**Status:** Approved  
**Decision:** Option B — Automatically pause a financial report schedule after three consecutive scheduled occurrences fail.

**Product behavior:**

- Count a scheduled occurrence as failed only after its initial attempt and up to three eligible automatic retries under DEC-144 have all failed. A successful retry makes that occurrence successful and does not advance the failure count.
- After three consecutive failed scheduled occurrences, pause future automatic runs and notify the schedule owner in-app. Show the three failed run dates, final failure reasons, schedule status, and the action needed before the next run.
- Reset the consecutive-failure count after a successful scheduled occurrence. When a paused schedule is resumed, begin a new consecutive-failure count.
- Failures that already require immediate action, such as revoked permissions or unavailable criteria, follow DEC-142: pause promptly and notify the appropriate authorized user rather than waiting for three failures.
- Pausing a schedule does not delete its configuration or generated reports, change wedding financial records, or cancel unrelated schedules. Existing report snapshots remain subject to permissions and the 30-day expiry in DEC-143.

**Acceptance criteria:** (1) A schedule is not paused for a transient attempt that succeeds during retry; (2) the third consecutive scheduled occurrence that remains failed after retries pauses future automatic runs; (3) the owner receives an in-app notice with dates, reasons, and status; (4) a successful occurrence resets the failure count; (5) permission or criteria failures that require action pause promptly under DEC-142; (6) pausing preserves schedule configuration and eligible unexpired reports.

**Scope and follow-up:** Approves automatic pausing after three consecutive failed scheduled occurrences, counting only final outcomes after retries. Recovery and manual resumption are defined in DEC-146.

### DEC-146 — Review and manual resumption of a paused report schedule

**Status:** Approved  
**Decision:** Option B — Before resuming a schedule paused after repeated failures, require the owner to review the issue and the schedule, then resume it manually.

**Product behavior:**

- Keep a schedule paused until its authorized owner or another user with appropriate schedule-management permission reviews the failure information and the current schedule settings, then explicitly confirms resumption. Do not resume automatically because a failure appears resolved.
- Present the failed-run dates and reasons, any required corrective action, and the schedule's current report scope, filters, selected format, cadence, next-run timing, and authorized owner before confirmation.
- Let the reviewer correct invalid criteria or settings before resuming. Recheck current wedding membership and financial-data permissions. Block resumption if the user lacks permission or the schedule still contains invalid or unavailable criteria; explain what must be resolved.
- On confirmation, mark the schedule active and reset the consecutive-failure count under DEC-145. Clearly show its next planned run. Resumption does not generate a report by itself; handling of occurrences missed while paused is decided separately.
- Record who reviewed and resumed the schedule and when in its history. Notify the owner in-app that the schedule is active again.

**Acceptance criteria:** (1) A schedule paused after repeated failures remains paused until an authorized user reviews and confirms resumption; (2) the review shows failure context and current schedule settings; (3) invalid criteria or insufficient permissions block resumption with a clear explanation; (4) confirmation reactivates the schedule, resets its failure count, and displays the next planned run; (5) resumption alone does not generate an unrequested report; (6) the schedule history records the review and resumption.

**Scope and follow-up:** Approves issue and schedule review followed by explicit manual resumption. Missed occurrences are handled as defined in DEC-147.

### DEC-147 — Optional catch-up report for the most recent missed period

**Status:** Approved  
**Decision:** Option B — When resuming a paused schedule, offer its owner the option to generate one report for the most recent missed scheduled period.

**Product behavior:**

- During the resume review, identify the most recent scheduled occurrence missed while the schedule was paused and show its period and report criteria. Offer the authorized owner a clear choice to generate that one catch-up report or skip it.
- Do not generate a catch-up report automatically. Do not generate a backlog of multiple reports for older missed occurrences. After the owner chooses, continue the schedule at its next planned future occurrence.
- For a catch-up report, resolve relative date filters as of the missed occurrence's scheduled run time, not the current resumption time, so the report covers the period that would have run. Show the resolved inclusive dates and date basis before confirmation, following DEC-140.
- Let the owner choose PDF or Excel for this catch-up run under DEC-160; confirm the format and current access before generation. Notify only the confirming owner under DEC-158 and apply the 30-day availability rule in DEC-143.
- If the owner skips the catch-up report, record that choice in schedule history without generating a file. If no occurrence was missed, do not show the catch-up choice.

**Acceptance criteria:** (1) The resume review identifies the latest missed occurrence and its report period; (2) the owner can explicitly generate one catch-up report or skip it; (3) no catch-up report is generated without confirmation and no older backlog is generated; (4) relative dates resolve to the missed occurrence's scheduled time and are shown before generation; (5) the schedule resumes with its next planned future run; (6) skip and catch-up outcomes are recorded, and a catch-up file follows existing access and expiry rules.

**Scope and follow-up:** Approves an optional single catch-up report for the most recent missed period on resumption. Older missed periods are skipped; users cannot request a batch of historical scheduled occurrences through this flow. Schedule-owner access loss is handled in DEC-148.

### DEC-148 — Pause and administrator review when a schedule owner loses access

**Status:** Approved  
**Decision:** Option B — If a schedule owner loses access to the wedding or planner organization, pause the schedule and let an authorized administrator reassign or cancel it after review.

**Product behavior:**

- Pause the schedule promptly when its owner no longer has the required wedding membership, organization access, or financial-report permission. Do not transfer ownership automatically or run another report under the former owner's authority.
- Notify an eligible authorized wedding or planner-organization administrator in-app that the schedule needs review. Show enough schedule and failure context for the administrator to decide whether to reassign or cancel it, subject to their own permissions. Do not include report contents in the notice.
- Let an authorized administrator review the schedule's criteria, format, frequency, status, next run, and eligible replacement owners. Reassignment requires explicit confirmation, and the new owner must have current access to the wedding and every financial record the report may include. Otherwise, keep the schedule paused or cancel it.
- On reassignment, make the new owner responsible for future run notices and schedule management. Recheck permissions for every generated report and stored snapshot. The former owner immediately loses access to schedule details and report snapshots that are restricted by their revoked access.
- Preserve eligible unexpired snapshots subject to DEC-143 and current access rules. If no eligible administrator is available to review the schedule, keep it paused and do not disclose report contents to an unauthorized person.
- Record the access-loss pause, administrative review, reassignment, or cancellation in the schedule history without embedding report contents.

**Acceptance criteria:** (1) Loss of required access pauses the schedule before another run; (2) an eligible administrator receives an in-app review notice without report contents; (3) reassignment is never automatic and requires an eligible new owner plus explicit confirmation; (4) the former owner cannot access restricted schedule details or snapshots after access is revoked; (5) a paused schedule remains paused if no eligible administrator can review it; (6) review, reassignment, and cancellation are recorded in schedule history.

**Scope and follow-up:** Approves pausing, notifying an eligible administrator, and requiring review before reassignment or cancellation. Automatic ownership transfer is not included. Scheduled report-ready notices are defined in DEC-149.

### DEC-149 — Notify the owner and selected authorized collaborators when reports are ready

**Status:** Approved  
**Decision:** Option B — Send in-app ready notices to the schedule owner and selected collaborators who are authorized to access the report.

**Product behavior:**

- For scheduled occurrences only, let the schedule owner select additional wedding collaborators to receive in-app ready notices. The owner always remains a recipient while authorized; selected collaborators supplement the owner.
- Only allow selection of collaborators who currently have permission to view the report's full scope, including relevant financial records. Recheck each recipient's wedding membership and financial permissions before sending each notice and when the recipient opens or downloads the report.
- If a selected collaborator no longer has the required access, do not send that person a ready notice or reveal report details. Keep the report available to its other authorized recipients and notify the schedule owner in-app that the recipient list needs review, without disclosing restricted records.
- Notices contain a protected in-app link and basic ready status only; do not attach the report or include financial amounts, supplier details, dispute details, or other report contents in the notification. Email delivery remains outside this decision.
- Recipients may view or download the report only while authorized. Notification selection does not grant financial access or schedule-management rights. Recipient access to schedule status and history is defined in DEC-150; changes to the recipient list require the schedule owner's authorization, subject to schedule-management rules.
- On reviewed schedule reassignment under DEC-148, the new owner reviews and confirms the notice recipients for future runs. Existing snapshots remain subject to their current permissions and DEC-143 expiry.

**Acceptance criteria:** (1) The owner can select additional currently authorized collaborators for in-app ready notices; (2) the owner and selected eligible collaborators receive notices after a successful run; (3) an ineligible or revoked recipient receives no notice and cannot open the report; (4) notices contain no financial report contents or attachments; (5) notification recipients gain no schedule-management or financial-data permissions; (6) reassignment requires review of recipients for future notices.

**Scope and follow-up:** Approves in-app ready notices for scheduled occurrences to the schedule owner and selected authorized collaborators. Manual-run and catch-up notices follow DEC-157 and DEC-158. Notices do not grant report access or schedule-management rights, and reports are not delivered by email. Selected recipients' schedule access is defined in DEC-150.

### DEC-150 — View-only schedule access for selected report recipients

**Status:** Approved  
**Decision:** Option B — Selected report-notification recipients may view schedule status, run history, and generated reports, but cannot edit or manage the schedule.

**Product behavior:**

- Let currently selected, authorized report recipients view the schedule's active or paused status, next planned run, run history, and generated reports covered by that schedule. Apply current wedding and financial permissions whenever they view or download a report.
- Do not allow selected recipients to change the schedule cadence, criteria, format, owner, recipient list, pause state, or cancellation. Those actions remain available to the schedule owner and users with explicit schedule-management permission.
- Show recipients the criteria and run details needed to understand the report and its period, subject to their report permissions. Do not expose private expenses, restricted records, or administrative details beyond their access.
- Recheck a user's notification-recipient status and schedule access when opening schedule details or run history. Removing someone from the recipient list removes their access to this schedule's status and history, subject to the separate rule for previously generated reports decided in the next decision.
- If a schedule is reassigned under DEC-148, the new owner confirms the recipient list; selected recipients retain view-only access only if they remain selected and authorized.

**Acceptance criteria:** (1) A selected eligible recipient can view schedule status, run history, and permitted generated reports; (2) the recipient cannot alter schedule settings or recipients without separate management permission; (3) revoked financial access blocks report content immediately; (4) removal from the recipient list blocks schedule and history access; (5) schedule reassignment requires the new owner to confirm eligible recipients.

**Scope and follow-up:** Approves view-only access to schedule status, run history, and reports for selected authorized recipients. Schedule management remains with the owner and explicitly authorized managers. Recipient removal and past snapshot access are defined in DEC-151.

### DEC-151 — Immediate revocation of past snapshot access when a recipient is removed

**Status:** Approved  
**Decision:** Option A — Immediately revoke a removed recipient's access to past in-app report snapshots from the schedule.

**Product behavior:**

- When an authorized schedule manager removes a collaborator from the notification recipient list, immediately revoke that collaborator's access to the schedule's status, run history, and all past in-app snapshots, even if the collaborator still has general financial-report permission for the wedding.
- Apply the change to active sessions and existing in-app links. Explain that access to reports from this schedule was removed without exposing their contents. Do not send new ready notices to the removed collaborator.
- Preserve each snapshot for remaining authorized recipients until its expiry under DEC-143. Removing one recipient does not delete the report or revoke access for other currently selected, authorized recipients.
- The rule governs files stored in the application. It cannot revoke copies a recipient previously downloaded and saved outside the application, consistent with DEC-143.
- Record the recipient removal and access revocation in the schedule history without retaining or exposing report contents to the removed user.

**Acceptance criteria:** (1) Removing a recipient immediately blocks their access to all in-app snapshots, schedule status, and run history; (2) old links and active sessions cannot retrieve the reports after removal; (3) other eligible recipients retain access through the normal 30-day period; (4) no new ready notices go to the removed recipient; (5) previously downloaded external copies are unaffected; (6) the revocation is auditable without exposing report contents.

**Scope and follow-up:** Approves immediate revocation for in-app schedule snapshots and history when a recipient is removed. Previously downloaded copies remain outside the application's control. Decide next whether report schedules should support frequencies beyond weekly and monthly.

### DEC-152 — Weekly and monthly schedules only

**Status:** Approved  
**Decision:** Option A — Scheduled financial reports support weekly and monthly frequencies only.

**Product behavior:**

- Offer weekly and monthly recurring schedules for approved financial reports under DEC-142. Do not offer daily, quarterly, annual, or user-defined recurrence frequencies.
- Clearly display the selected weekly or monthly frequency and the next planned run. When a schedule is created or edited, preserve the existing review, permission, time-zone, retry, pause, and notification safeguards.
- If a user wants reports on a cadence that is not supported, explain the available weekly and monthly choices. They may generate an approved report manually at another time; the platform does not approximate an unsupported recurrence.

**Acceptance criteria:** (1) Schedule creation and editing offer weekly and monthly frequencies; (2) no other recurrence frequency is presented as available; (3) schedule summaries clearly show the chosen frequency and next run; (4) manual report generation remains available independently of a recurring schedule.

**Scope and follow-up:** Approves weekly and monthly recurring schedules only. Daily, quarterly, annual, and custom recurrence remain out of scope. Decide next how schedule owners should select the run day and time.

### DEC-153 — Owner-selected schedule day and local run time

**Status:** Approved  
**Decision:** Option B — Let the schedule owner choose the weekday for weekly reports or day of month for monthly reports, along with the local run time; use the month's final day when a selected date does not exist.

**Product behavior:**

- For a weekly schedule, let the owner select any weekday and a local run time. For a monthly schedule, let the owner select a day from 1 to 31 and a local run time.
- For monthly schedules set to a day that does not occur in a particular month, run on that month's final calendar day. Continue using the selected day in later months where it exists.
- Interpret the selected time in the wedding's configured time zone; if none is configured, use the schedule owner's account time zone and show that basis. Display the next planned run date and time with its time zone during setup, review, and schedule management. Changes to a configured wedding time zone pause schedules for owner review under DEC-154.
- If a schedule owner changes the selected day or time, show the next-run impact and require explicit confirmation. Preserve the report criteria and notification recipients unless the owner separately changes them.
- Apply this timing consistently to scheduled runs, retry attempts, missed-run identification, and catch-up reporting, subject to the existing retry and permission safeguards.

**Acceptance criteria:** (1) Weekly schedules support a chosen weekday and local time; (2) monthly schedules support a chosen day from 1 through 31 and local time; (3) a nonexistent monthly date resolves to the final day of that month and returns to the selected date in subsequent months; (4) the time-zone basis and next run are visible; (5) changing timing requires review and confirmation without silently changing other schedule settings.

**Scope and follow-up:** Approves owner-selected weekday or day of month and local time, including the last-day fallback. Time-zone-change behavior after schedule creation remains undecided.

### DEC-154 — Pause for owner review after a wedding time-zone change

**Status:** Approved  
**Decision:** Option C — When a wedding's configured time zone changes, pause its scheduled reports until the schedule owner reviews and confirms the new timing.

**Product behavior:**

- If the wedding's configured time zone changes, pause its active financial report schedules before they run under the new time zone. Do not change their effective run times silently.
- Notify each schedule owner in-app that review is needed. Show the former and new time zones, the chosen local run time, the previous next run, and the proposed next run in the new zone.
- Require the owner to review and explicitly confirm the updated timing before reactivating each schedule. The owner may adjust the run day or local time during review under DEC-153. Do not generate a report merely because the time zone changed or the owner confirmed the change.
- If the owner does not review, keep the schedule paused. Apply the existing missed-occurrence decision in DEC-147 if the owner later resumes it. If the owner has lost access or cannot manage the schedule, follow the reviewed reassignment or cancellation process in DEC-148.
- Record the time-zone change, pause, review, and confirmation in the schedule history. Continue to enforce current access, retries, notifications, snapshot expiry, and recipient rules.

**Acceptance criteria:** (1) A changed wedding time zone pauses active schedules before a new run occurs under the changed zone; (2) the owner receives an in-app review notice; (3) review clearly compares old and new time zones and next-run timing; (4) explicit owner confirmation is required to reactivate the schedule; (5) no report is generated on the strength of the time-zone change or confirmation alone; (6) a schedule left unreviewed remains paused and its missed occurrences follow DEC-147.

**Scope and follow-up:** Approves owner review and explicit confirmation for changes to a configured wedding time zone. Fallback account time-zone changes are defined in DEC-155.

### DEC-155 — Pause for owner review after a fallback account time-zone change

**Status:** Approved  
**Decision:** Option C — When a schedule uses the owner's account time zone because the wedding has none configured, pause it if that account time zone changes and require the owner to review and confirm the new timing.

**Product behavior:**

- Apply this rule only to schedules whose displayed time-zone basis is the schedule owner's account time zone under DEC-142 and DEC-153. A schedule using a configured wedding time zone follows DEC-154 instead.
- When the account time zone changes, pause each affected schedule before its next run under the new zone. Notify the schedule owner in-app and show the former and new zones, selected local run time, previous next run, and proposed next run.
- Require the owner to review and explicitly confirm the new timing before reactivating the schedule. The owner may adjust the weekday or day of month and local time under DEC-153. Do not generate a report merely because the account setting changed or the owner confirmed it.
- If the owner does not review, keep the schedule paused. If an occurrence is missed, apply DEC-147 upon later resumption. If the owner loses access or cannot manage the schedule, follow the administrative review process in DEC-148.
- Record the time-zone change, pause, review, and confirmation in schedule history. Continue to enforce current access, retries, recipient rules, and snapshot expiry.

**Acceptance criteria:** (1) Changing an owner's account time zone pauses schedules that rely on it before they run under the new zone; (2) schedules using a configured wedding time zone are unaffected by this account-setting change; (3) the owner receives an in-app notice showing old and proposed timing; (4) explicit confirmation is required to resume; (5) no report is generated just by changing or confirming the setting; (6) missed runs follow DEC-147.

**Scope and follow-up:** Approves pausing and requiring owner review when the fallback account time zone changes. A configured wedding time zone remains governed by DEC-154.

### DEC-156 — Manual report runs do not change the recurring schedule

**Status:** Approved  
**Decision:** Option A — Treat a manual report run as separate from the recurring schedule and leave its next planned run unchanged.

**Product behavior:**

- Let an authorized schedule owner initiate a one-off manual report using the schedule's current criteria, with one-time filter changes under DEC-162. Show that it is a manual run, let the owner choose PDF or Excel under DEC-161, and confirm its final scope and format before generation.
- Do not move, reset, or otherwise change the recurring schedule's next planned run, selected cadence, day, time, or criteria because a manual run was requested or completed.
- Record a manual run separately in schedule history and distinguish it from scheduled occurrences and optional catch-up runs. A manual run does not increment or reset the consecutive scheduled-failure count under DEC-145.
- Apply the existing permission, privacy, report-format, currency, snapshot-access, and expiry rules to the manually generated report. A failed manual run is recorded as a manual failure and does not pause or alter the recurring schedule.
- Manual-run notifications go only to the initiator under DEC-157; manual generation does not by itself change the selected recipient list.

**Acceptance criteria:** (1) An authorized owner can start a manual report from the schedule after reviewing its current scope; (2) the next planned run and recurrence settings are unchanged; (3) the run is labeled and recorded separately from scheduled and catch-up runs; (4) manual-run success or failure does not affect the scheduled consecutive-failure count or pause state; (5) permissions and snapshot expiry rules still apply; a per-run format choice does not change the schedule format under DEC-161.

**Scope and follow-up:** Approves a separate manual run that does not change or count toward the recurring schedule. Manual-run notices are defined in DEC-157.

### DEC-157 — Notify only the initiator when a manual report is ready

**Status:** Approved  
**Decision:** Option A — Send an in-app ready notice only to the person who initiated a manual report run from a schedule.

**Product behavior:**

- When an authorized user starts a manual report run from a schedule, send the in-app ready notice only to that initiating user after successful generation. Do not send a new ready notice to the schedule owner or selected notification recipients unless one of them initiated the run.
- Include a protected in-app link and basic ready status only. Do not attach the report or include financial amounts or other report contents in the notice. Recheck the initiator's current schedule and financial access when sending the notice and when the report is opened or downloaded.
- A selected recipient's view access to schedule history and the manual report remains governed by DEC-150, and removal revokes that access under DEC-151; this decision limits notifications only.
- If a manual run fails, show its failure status and any available retry action to the initiator in-app. A manual failure does not send a scheduled-run failure notice to other recipients and does not affect the schedule's failure count under DEC-156.

**Acceptance criteria:** (1) A successful manual run sends a ready notice only to its initiator; (2) the notice contains no report contents or attachment; (3) current permissions are checked at notice and report access; (4) other selected recipients may view the report if permitted but receive no ready notice unless they initiated it; (5) manual failure notices go only to the initiator and do not affect scheduled failure handling.

**Scope and follow-up:** Approves initiator-only in-app notices for manual runs from a schedule. This does not change selected recipients' view access to schedule history or reports. Catch-up notices are defined in DEC-158.

### DEC-158 — Notify only the confirming owner when a catch-up report is ready

**Status:** Approved  
**Decision:** Option A — Send an in-app ready notice only to the schedule owner who confirmed the optional catch-up report.

**Product behavior:**

- After a confirmed catch-up report is generated successfully, send the ready notice only to the authorized schedule owner who confirmed that run. Do not notify other selected schedule recipients unless one of them is the confirming owner.
- Include a protected in-app link and basic ready status only. Do not attach the report or include financial amounts or other report contents in the notice.
- Recheck the confirming owner's current schedule and financial access when sending the notice and when opening or downloading the report. If access has been revoked, do not provide a usable report link or disclose report contents; follow DEC-148 for schedule ownership review.
- Notification rules do not change report visibility. Selected authorized recipients may view the catch-up report without a notice under DEC-159, subject to DEC-150, DEC-151, and DEC-143.

**Acceptance criteria:** (1) A successful catch-up run sends a ready notice only to the owner who confirmed it; (2) the notice has no attachment or report contents; (3) current permissions are checked at notice and report access; (4) selected recipients may receive no notice while their separate view access remains governed by schedule access rules; (5) loss of owner access prevents report disclosure and triggers existing ownership safeguards.

**Scope and follow-up:** Approves initiator-only in-app notices for catch-up reports, where the initiator is the confirming schedule owner. It does not alter which selected recipients may view the report. Selected recipients' view access to catch-up reports is defined in DEC-159.

### DEC-159 — Selected recipients may view catch-up reports without a notice

**Status:** Approved  
**Decision:** Option A — A selected report recipient may view an in-app catch-up report if they remain selected and authorized, even when they do not receive its ready notice.

**Product behavior:**

- After a catch-up report is generated, let currently selected recipients with permission for its full report scope view it through the schedule and run history, even though the ready notice goes only to the owner who confirmed the catch-up under DEC-158.
- Recheck recipient selection, wedding membership, financial permissions, and private-expense access whenever a recipient opens or downloads the catch-up report. Notification delivery does not grant access.
- If the recipient is removed, loses required access, or the snapshot expires, immediately deny access under DEC-151 and DEC-143. Apply the same view-only schedule access rules in DEC-150 as for other schedule reports.
- Keep the catch-up report's date range, status, and generation time visible to eligible viewers. Do not include report contents in notifications sent to other users.

**Acceptance criteria:** (1) A selected, authorized recipient can find and view the catch-up report without receiving a ready notice; (2) an unselected or unauthorized user cannot access it; (3) removing a recipient or revoking financial access blocks access immediately; (4) the catch-up snapshot expires under DEC-143; (5) the recipient gains no schedule-editing rights.

**Scope and follow-up:** Approves view access for selected authorized recipients without sending them a catch-up ready notice. Decide next whether an owner may choose a different export format for an individual catch-up run.

### DEC-160 — Choose PDF or Excel for each catch-up report

**Status:** Approved  
**Decision:** Option B — Let the owner choose PDF or Excel (.xlsx) for each individual catch-up report.

**Product behavior:**

- During catch-up review, let the authorized owner select PDF or Excel (.xlsx), even when that differs from the schedule's saved format. Show the selected format alongside the missed period and report criteria before the owner confirms generation.
- Apply the format choice only to that catch-up snapshot. Do not change the schedule's saved format or the format for future scheduled, manual, or catch-up runs.
- Use the same approved financial report content, filters, permission safeguards, and format-specific behavior in DEC-137 and DEC-138. Apply report access and 30-day expiry under DEC-143, and selected-recipient access rules under DEC-150, DEC-151, and DEC-159.
- If the chosen format cannot be generated, show a clear failure status and retry action to the confirming owner; do not silently substitute the other format or mark an incomplete report ready.

**Acceptance criteria:** (1) The owner can choose PDF or Excel before confirming each catch-up report; (2) the chosen format is visible in the confirmation and run history; (3) the choice affects only that snapshot and does not change the schedule's saved format; (4) both formats follow existing financial, privacy, access, and expiry rules; (5) format failure is reported without silent substitution.

**Scope and follow-up:** Approves a per-run PDF or Excel choice for catch-up reports, independent of the schedule's saved format. Whether manual runs may also use a one-time format choice remains undecided.

### DEC-161 — Choose PDF or Excel for each manual report run

**Status:** Approved  
**Decision:** Option B — Let the owner choose PDF or Excel (.xlsx) for each individual manual report run.

**Product behavior:**

- Before confirming a manual report run, let its authorized initiator choose PDF or Excel (.xlsx), even when it differs from the schedule's saved format. Show the selected format with the report scope and criteria.
- Apply the choice only to that manual report snapshot. Do not change the recurring schedule's saved format or the format used for later scheduled or catch-up reports.
- Apply the approved financial report content, formatting, reconciliation, access, privacy, and expiry rules in DEC-137, DEC-138, and DEC-143. A selected recipient may view the report under DEC-150 and DEC-151 even if the initiator alone receives the ready notice under DEC-157.
- If the requested format cannot be generated, show a clear failure to the initiator with a retry option where appropriate. Do not silently switch formats or present an incomplete report as ready.

**Acceptance criteria:** (1) An authorized initiator can choose PDF or Excel before confirming a manual run; (2) the selected format appears in the confirmation and run history; (3) the choice affects only that manual snapshot and leaves the schedule's saved format unchanged; (4) reports follow existing financial and access safeguards; (5) a format failure is clear and does not silently substitute another format.

**Scope and follow-up:** Approves a per-run PDF or Excel choice for manual runs without changing the schedule's saved format. Whether a manual run may use one-time filter changes remains undecided.

### DEC-162 — One-time filter changes for a manual report run

**Status:** Approved  
**Decision:** Option B — Let an authorized owner adjust report filters for an individual manual run without changing the recurring schedule.

**Product behavior:**

- Before confirming a manual run, let the authorized initiator adjust the schedule's current report filters for that run, including supported category, supplier, date-range, and financial-status filters under DEC-137 and DEC-140.
- Show the resulting report scope, active filters, date basis, resolved dates, and selected output format before generation. Require explicit confirmation; never silently broaden the report or remove a meaningful filter.
- Apply changes only to the manual-run snapshot. Do not change the schedule's saved criteria or format, or any existing personal or organization-shared preset. An authorized user may explicitly save the adjusted criteria as a new personal preset under DEC-163.
- Recheck the initiator's current wedding and financial permissions, private-expense visibility, selected recipients' eligibility, and report reconciliation rules. A manual filter change cannot grant access to records the initiator or recipients cannot otherwise view.
- Record the filters used with the manual run in schedule history so eligible viewers can understand its scope. Follow manual-run notification rules in DEC-157 and the access and expiry rules in DEC-150, DEC-151, and DEC-143.

**Acceptance criteria:** (1) An authorized initiator can adjust supported filters before a manual run; (2) the final scope and resolved date ranges are visible before confirmation; (3) adjusted filters apply only to that run and do not alter schedule settings or existing presets, unless the user explicitly creates a new personal preset under DEC-163; (4) permission and privacy checks still limit the report; (5) run history shows the filters used to create the snapshot.

**Scope and follow-up:** Approves one-time supported filter changes for manual runs. Changes do not update saved presets or schedule criteria. Decide next whether users may save adjusted filters as a new personal preset.

### DEC-163 — Optionally save adjusted manual-run filters as a new personal preset

**Status:** Approved  
**Decision:** Option B — Let the owner optionally save adjusted filters from a manual report run as a new personal preset.

**Product behavior:**

- When an authorized user adjusts filters for a manual run under DEC-162, offer an explicit option to save those filters as a new personal preset. Saving is optional and requires confirmation; using filters for a one-time report does not save them automatically.
- Create a new personal preset under the user's account. Do not overwrite or modify an existing personal preset, an organization-shared preset, the current schedule, or the report being generated. Do not publish or share the new preset with colleagues.
- Save filter criteria and the user's chosen report type only. Do not store report contents, wedding financial data, generated files, or permission grants in the preset. Reapply DEC-139 access rules whenever the preset is later used.
- Suggest an editable preset name based on the report and filters under DEC-164; require the user to confirm or change it before saving. Apply the user's permitted personal category or tags under DEC-141 and store relative or fixed date behavior as selected under DEC-140. If the name or criteria are invalid or conflict with an existing name, explain the issue and let the user correct it without affecting the report run.
- Confirm when the personal preset has been saved and make it available in the user's personal preset list. If the user declines or abandons the save flow, keep the adjusted filters limited to the manual run.

**Acceptance criteria:** (1) The user can choose to save adjusted filters as a new personal preset; (2) no preset is saved without explicit confirmation; (3) the flow suggests an editable name under DEC-164 and supports personal labels under DEC-141; (4) existing presets, shared presets, schedules, and report records are unchanged; (5) the saved preset contains criteria only and grants no data access; (6) the new preset appears only in its creator's personal preset list.

**Scope and follow-up:** Approves optional creation of a new personal filter preset from adjusted manual-run criteria. Editing or overwriting an existing preset through this flow and publishing a shared preset remain excluded. Decide next whether the platform should suggest a name for the new preset.

### DEC-164 — Editable suggested names for new personal presets

**Status:** Approved  
**Decision:** Option B — Suggest an editable name based on the report and filters when saving adjusted criteria as a new personal preset.

**Product behavior:**

- When the user chooses to save adjusted manual-run filters under DEC-163, suggest a concise preset name based on the report type and useful filter context, such as category or date range.
- Let the user edit or replace the suggested name before confirming. A suggested name is not saved automatically, and the user may cancel preset creation while continuing with the report run.
- Keep suggested names descriptive without including financial amounts or report contents. Apply any user edits to the new personal preset only; do not change the report, schedule, or existing personal or organization-shared presets.
- Apply the personal preset naming, category/tag, and search behavior in DEC-139 and DEC-141. If the chosen name conflicts with another personal preset, block saving and require a unique personal name under DEC-165; never overwrite the existing preset.

**Acceptance criteria:** (1) The save flow suggests a name based on report type and filters; (2) the user can edit or replace it before saving; (3) the suggestion is never saved without explicit confirmation; (4) the name contains no financial amounts or report contents; (5) a name conflict blocks preset saving with a clear path to enter a unique name, without modifying existing presets or blocking the report run.

**Scope and follow-up:** Approves editable report- and filter-based name suggestions for new personal presets. Automatic saving is not included. Decide next whether preset names must be unique within a user's personal library.

### DEC-165 — Unique names within a personal preset library

**Status:** Approved  
**Decision:** Option A — Require every personal financial report preset name to be unique within its owner's personal library.

**Product behavior:**

- Check a proposed personal preset name against the user's existing personal preset names before saving. Treat names as duplicates when they differ only by capitalization or leading/trailing whitespace.
- If the name conflicts, block the save and explain that the name is already in use. Let the user edit the suggested or entered name and try again. Never overwrite, merge, or silently rename an existing preset.
- Apply the same uniqueness rule when creating, renaming, or copying a personal preset. A personal copy of a shared preset must receive a unique name in the user's personal library; retain the original shared preset unchanged.
- Scope this requirement to each user's personal library. Organization-shared names are unique within each organization under DEC-166. A matching name in a different user's personal library or in a shared organization library does not block a personal preset.
- Keep the uniqueness check scoped to preset names only; categories, tags, report criteria, or filters do not make duplicate personal names acceptable.

**Acceptance criteria:** (1) A user cannot save two personal presets with the same name after trimming whitespace and ignoring capitalization; (2) a conflict produces a clear error and editable name field; (3) resolving a conflict never changes the existing preset; (4) creating or renaming a personal copy enforces the same rule; (5) names in other users' libraries or shared libraries do not block the user's personal name.

**Scope and follow-up:** Approves name uniqueness within an individual personal preset library, regardless of category or tags. Organization-shared preset name uniqueness remains undecided.

### DEC-166 — Unique names across an organization's shared presets

**Status:** Approved  
**Decision:** Option A — Require each organization-shared financial report preset name to be unique across that planner organization.

**Product behavior:**

- Check a proposed shared preset name against all active organization-shared preset names within the same planner organization, regardless of category or tags. Ignore capitalization and leading or trailing whitespace when detecting duplicates.
- Apply the rule when creating, renaming, or copying a preset into the shared organization library. A name already used in that organization's shared library blocks the change until an authorized user chooses another name.
- Explain the conflict and let the authorized user edit the name. Never overwrite, merge, or silently rename an existing shared preset. Do not block the report run that prompted creation of a preset.
- Scope uniqueness to one planner organization. The same name may exist in a different organization or in an individual user's personal library; personal names follow DEC-165 independently.
- If an existing shared preset is archived or deleted, its name may be reused according to the organization's lifecycle rules; preserve its history and audit trail under DEC-139.

**Acceptance criteria:** (1) An organization cannot have two active shared presets with names that differ only by capitalization or surrounding whitespace; (2) a conflict blocks save or rename with a clear explanation and editable name; (3) resolving a conflict never changes the existing preset; (4) personal presets and other organizations' libraries do not create conflicts; (5) organization categories and tags do not create separate naming namespaces.

**Scope and follow-up:** Approves organization-wide unique names for active shared presets. Personal preset uniqueness is defined in DEC-165. Decide next whether a staff-created shared preset needs manager approval before publication.

### DEC-167 — Immediate publication by staff with shared-preset permission

**Status:** Approved  
**Decision:** Option A — Staff who have permission to publish organization-shared presets may make a newly created shared preset available immediately, without separate manager approval.

**Product behavior:**

- Let staff with the explicit organization permission to create and publish shared presets publish a new preset immediately to the organization's shared library. Do not require a separate manager approval step for that publication.
- Continue to restrict shared-preset creation to authorized staff; this decision does not grant permissions to staff who lack them. Organization managers retain control over assigning and revoking staff permissions under DEC-139.
- Before publication, apply the shared-preset naming rule in DEC-166 and require the creator to review its name, report type, filters, and category or tags. The preset contains criteria only and grants no wedding or financial access.
- Record the creator, publication time, and preset details in the organization library history. Make the new preset available only to users who are authorized to discover and apply organization presets and who have access to the relevant financial data.
- This decision covers publication of newly created shared presets. Staff edits to an already published preset are governed by DEC-168.

**Acceptance criteria:** (1) A staff member with shared-preset publishing permission can create and immediately publish a new organization preset; (2) no second manager approval is required; (3) staff without permission cannot publish; (4) the creator reviews details before publication and unique shared naming is enforced; (5) publication grants no data permissions and is recorded in organization history.

**Scope and follow-up:** Approves immediate publication for new shared presets by staff who have the required permission. Staff edits to existing shared presets are governed by DEC-168.

### DEC-168 — Immediate publication of shared-preset edits by authorized staff

**Status:** Approved  
**Decision:** Option A — Staff with permission to edit organization-shared presets may publish their edits immediately, without separate manager approval.

**Product behavior:**

- Let staff with explicit organization permission to edit shared presets publish edits to an existing shared preset immediately. Do not require separate manager approval. Managers continue to control who receives this permission under DEC-139.
- Before saving, show the proposed name, report type, filters, category or tags, and a summary of changed criteria. Enforce organization-wide shared-name uniqueness under DEC-166. Never silently overwrite another preset on a naming conflict.
- Preserve version history showing the editor, change summary, and time. Authorized managers and staff with edit permission may restore an earlier version under DEC-170; restoration creates a new version and is audited.
- A published edit affects future applications of the shared preset only, consistent with DEC-139. It does not change a report already in progress, a generated snapshot, or the criteria saved in an existing scheduled report. Schedule owners must explicitly review and update their own schedule if they want it to use changed criteria.
- Do not notify collaborators automatically when a preset is edited; make version history available under DEC-169.

**Acceptance criteria:** (1) Staff with edit permission can publish a reviewed shared-preset edit immediately; (2) staff without permission cannot edit or publish; (3) edits are versioned with editor, summary, and time; (4) a name conflict blocks save without overwriting; (5) existing schedules, in-progress reports, and generated snapshots are unchanged; (6) managers can inspect the history and use authorized correction or restoration controls.

**Scope and follow-up:** Approves immediate publication of edits by staff with explicit edit permission and preserves history. Edits affect future preset applications; existing schedules require owner review to change. Decide next how collaborators should learn about shared-preset edits.

### DEC-169 — No proactive notices for shared-preset edits

**Status:** Approved  
**Decision:** Option A — Do not send notifications when an organization-shared preset is edited; make its version history available to authorized users.

**Product behavior:**

- Do not send in-app, email, or other proactive notifications solely because an organization-shared preset was created, edited, renamed, archived, or restored. Existing report-ready and operational notices remain governed by their own decisions.
- Make the shared preset's version history available to users who are authorized to discover the preset. Show the editor, time, and change summary in that history, subject to organization access permissions.
- Before a user applies an edited shared preset, clearly show its current name, criteria, and last-change summary so the user can review it. Applying it remains an explicit action and does not alter existing schedules or reports under DEC-139 and DEC-168.
- A user's ability to view history does not grant edit, publish, or restore rights. Preserve the existing role and permission rules; restoration permissions are decided separately.

**Acceptance criteria:** (1) Editing a shared preset sends no proactive notice; (2) authorized users can inspect version history with editor, time, and change summary; (3) applying a preset shows its current criteria and last-change summary for review; (4) history visibility does not grant edit or restore permissions; (5) edits do not alter existing schedules or generated reports.

**Scope and follow-up:** Approves history-based discovery of shared-preset edits without proactive notifications. Existing report-ready and security notices remain unaffected. Decide next who may restore an earlier shared-preset version.

### DEC-170 — Restore shared-preset versions with edit permission

**Status:** Approved  
**Decision:** Option A — Any staff member with permission to edit an organization-shared preset may restore an earlier version.

**Product behavior:**

- Treat a restore as a new edit to the current shared preset. Any staff member with the preset's edit permission may select an earlier version, review its name, report type, filters, category or tags, and publish the restored configuration without separate manager approval.
- Preserve every prior version. Restoring never deletes or rewrites later versions; it creates a new current version based on the selected historical version and records who restored it and when.
- Before publication, show a comparison between the current version and the proposed restored version and require explicit confirmation. The user may adjust the proposed version before publishing, subject to their edit permission.
- Enforce organization-wide name uniqueness under DEC-166. If the restored name conflicts with another active shared preset, block publication until the editor supplies a unique name; never replace the other preset.
- A restored version affects future preset applications only. It does not change existing schedules, in-progress reports, or generated snapshots, consistent with DEC-139 and DEC-168. No proactive notice is sent under DEC-169; authorized users can inspect the new version in history.

**Acceptance criteria:** (1) Staff with edit permission can restore a historical version; (2) restoration creates a new version and preserves all intervening history; (3) the editor reviews a comparison and explicitly confirms publication; (4) a name conflict blocks restoration without overwriting another preset; (5) existing schedules and reports remain unchanged; (6) the actor and time appear in the history and no proactive edit notice is sent.

**Scope and follow-up:** Approves restore-as-new-version for staff with edit permission, with explicit review and confirmation. The permission to archive or delete a shared preset remains undecided.

### DEC-171 — Editors may archive; managers may permanently delete shared presets

**Status:** Approved  
**Decision:** Option B — Staff with edit permission may archive an organization-shared preset; only organization managers may permanently delete one.

**Product behavior:**

- Let staff with shared-preset edit permission archive a published preset. Archiving removes it from active search and application, while retaining its definition and version history for the organization. Archive visibility is restricted under DEC-173.
- Existing schedules, in-progress reports, generated snapshots, and personal copies are not changed by archiving or deleting the shared source. Existing schedule criteria remain independent under DEC-139 and DEC-168.
- Require an organization manager to confirm permanent deletion under DEC-174. No waiting period applies. Explain that the shared definition and its version contents will no longer be available for use or restoration. Retain only the minimal deletion audit event needed to identify the preset, actor, and time, without retaining report contents or exposing financial data.
- Do not permit staff with edit permission alone to permanently delete a shared preset. Keep the action visibly distinct from archive and provide a confirmation summary before the manager completes deletion.
- Shared-preset names may be reused after archive or deletion under DEC-166. Archived-preset restoration permissions and safeguards are defined in DEC-172.

**Acceptance criteria:** (1) An editor with edit permission can archive a shared preset and it no longer appears as active or can be newly applied; (2) its definition and version history remain retained while archived; (3) only a manager can permanently delete it after confirmation; (4) deletion removes the shared definition and its version contents while retaining a minimal audit event; (5) existing schedules, reports, snapshots, and personal copies remain unchanged; (6) names become available for reuse after archival or deletion under DEC-166.

**Scope and follow-up:** Approves editor-level archiving and manager-only permanent deletion. Archive recovery permissions remain undecided.

### DEC-172 — Restore archived shared presets with edit permission

**Status:** Approved  
**Decision:** Option A — Staff with edit permission may restore an archived organization-shared preset.

**Product behavior:**

- Let staff with permission to edit shared presets restore an archived preset to the active organization library. Require the editor to review the preset's current name, report type, filters, categories or tags, and archive history, then confirm restoration.
- Reactivate the archived preset's retained current version and preserve its full version and archive history. Restoration does not erase or rewrite prior versions and is recorded with the restoring user and time.
- Recheck organization membership and the editor's current edit permission. Enforce active shared-preset name uniqueness under DEC-166. If another active shared preset now uses the name, block restoration until the editor supplies a unique name; never overwrite another preset.
- Once restored, make the preset discoverable and applicable to authorized organization users under existing access rules. Restoration changes future applications only; it does not alter existing schedules, reports, or snapshots under DEC-139 and DEC-168.
- Do not send a proactive notice solely because a preset is restored, under DEC-169. Authorized users can see the restoration in the preset's history.

**Acceptance criteria:** (1) Staff with edit permission can restore an archived preset after reviewing its retained settings; (2) restoration activates the preset and preserves prior versions and archive history; (3) a current name conflict blocks restoration without overwriting; (4) the actor and time are recorded; (5) existing schedules and reports remain unchanged; (6) no proactive restoration notice is sent.

**Scope and follow-up:** Approves editor-level restoration of archived shared presets with review, confirmation, and unique-name validation. Decide next who should be able to view archived shared presets.

### DEC-173 — Archived shared presets visible only to managers and editors

**Status:** Approved  
**Decision:** Option A — Only organization managers and staff with shared-preset edit permission may view archived organization-shared presets.

**Product behavior:**

- Keep archived presets out of active shared-preset search and application for all organization users. Provide a separate archive view for organization managers and staff with shared-preset edit permission.
- In the archive view, let eligible users inspect the retained preset definition, version history, archive status, and archive event details, subject to organization access controls. Viewing an archived preset does not itself grant permission to edit, restore, or permanently delete it.
- Users without manager or edit permission cannot find archived presets through search, links, or history views. Do not expose archived preset names, criteria, or existence to them.
- Restoring an archived preset returns it to the active library under DEC-172; permanent deletion follows DEC-171. Personal copies and existing schedule criteria remain unaffected by archive visibility.

**Acceptance criteria:** (1) Archived presets do not appear in active search or application; (2) managers and staff with edit permission can find and inspect them in a separate archive view; (3) other organization users cannot see archived preset metadata or existence; (4) viewing an archive does not grant edit, restore, or delete permission; (5) restored presets return to active access rules.

**Scope and follow-up:** Approves archive visibility for managers and staff with edit permission only, separate from the active preset library. Decide next whether permanent deletion should require a waiting period after archive.

### DEC-174 — Manager-confirmed deletion without a waiting period

**Status:** Approved  
**Decision:** Option A — An organization manager may permanently delete a shared preset after confirmation, without a post-archive waiting period.

**Product behavior:**

- Allow an organization manager to permanently delete an active or archived organization-shared preset after reviewing a confirmation summary. No 30-day or other waiting period is required.
- Clearly distinguish permanent deletion from archiving. State that the preset definition and retained version contents will no longer be available for use, restoration, or review after deletion.
- Preserve the minimal deletion audit event required by DEC-171, without retaining the preset criteria or financial report data. Deletion does not affect existing schedules, reports, snapshots, or personal copies.
- Apply organization-manager authorization and recheck it when the deletion is confirmed. Editors may archive presets under DEC-171 but cannot permanently delete them.
- Release the shared preset name for reuse upon deletion under DEC-166. A manager may still choose to archive instead when preserving the preset and its history is useful.

**Acceptance criteria:** (1) A manager may permanently delete an active or archived preset after explicit confirmation with no waiting period; (2) the confirmation explains that the definition and version contents cannot be restored; (3) staff with edit permission alone cannot delete; (4) only the minimal audit event remains; (5) existing schedules, reports, snapshots, and personal copies remain unchanged; (6) the name becomes available for reuse after deletion.

**Scope and follow-up:** Approves manager-confirmed permanent deletion without a waiting period. Decide next how long shared-preset version history should be retained while a preset has not been deleted.

### DEC-175 — Retain shared-preset version history for the preset's lifetime

**Status:** Approved  
**Decision:** Option C — Retain organization-shared preset version history for as long as the preset exists, including while archived; remove version contents on permanent deletion.

**Product behavior:**

- Preserve all versions, authors, timestamps, and change summaries for an organization-shared preset while it is active or archived. Archiving does not start a history-expiration period.
- Apply the access controls in DEC-173 to archived preset history. Only managers and staff with shared-preset edit permission may inspect archived definitions and versions.
- When a manager permanently deletes a preset under DEC-171 and DEC-174, remove its definition and version contents without a waiting period. Retain only the minimal deletion audit event required by those decisions; do not retain old criteria or version details in that event.
- Keep deletion and history removal separate from existing schedules, reports, snapshots, and personal copies, which remain governed by their own rules.
- Do not automatically delete or expire version history while its preset remains active or archived. The prior one-year reminder policy was superseded by DEC-178, which defines a final notice followed by automatic deletion after seven days.

**Acceptance criteria:** (1) Active and archived presets retain complete version history without an expiration date; (2) archived history is visible only to roles allowed by DEC-173; (3) permanent deletion removes the preset and all version contents immediately after confirmation; (4) only the minimal deletion audit event remains; (5) existing schedules, reports, snapshots, and personal copies remain unaffected.

**Scope and follow-up:** Approves lifetime retention of shared-preset history until permanent deletion. Decide next whether archived presets should be deleted automatically after a period of inactivity.

### DEC-176 — Manager reminder after one year in archive

**Status:** Superseded by DEC-178 (20 October 2026)  
**Historical note:** This decision is retained for its original rationale; DEC-178 defines the current archive-notice and deletion behavior.  
**Decision:** Option C — After a shared preset has remained archived for one year, remind organization managers and let them decide whether to restore or permanently delete it.

**Product behavior:**

- When an organization-shared preset reaches one year in archived status, send an in-app reminder to the organization's current managers, subject to their current organization access. The reminder asks them to review the archived preset and choose whether to leave it archived, restore it, or permanently delete it under existing permissions.
- Do not automatically restore or delete the preset. It remains archived with its definition and version history under DEC-171 and DEC-175 until an authorized user acts.
- Keep reminder content limited to the preset name, archive date, and review action. Do not expose wedding financial records or report contents. Archived visibility remains restricted under DEC-173.
- Resolve the review reminder when the preset is restored or permanently deleted. The annual reminder policy was superseded by DEC-178.
- Record that the reminder was issued in the preset's administrative history. This reminder does not change the preset's archive date or version history.

**Acceptance criteria:** (1) A reminder is issued when a preset reaches one year archived; (2) current organization managers receive it in-app; (3) the reminder offers review choices without automatically changing status; (4) the archived preset and full version history remain intact until an authorized action; (5) no wedding financial data is disclosed; (6) reminder issuance is recorded.

**Scope and follow-up:** Approves a manager review reminder at one year archived, with no automatic deletion. Decide next whether the reminder repeats if the preset remains archived.

### DEC-177 — Annual repeat of archived-preset review reminders

**Status:** Superseded by DEC-178 (20 October 2026)  
**Historical note:** This decision is retained for its original rationale; DEC-178 defines the current archive-notice and deletion behavior.  
**Decision:** Option B — Repeat the one-year archive review reminder annually until the preset is restored or permanently deleted.

**Product behavior:**

- Send the first in-app review reminder when a shared preset has remained archived for one year, then repeat once each year on its archive anniversary for as long as it remains archived.
- Send each reminder to the organization's current managers at the time of delivery. Do not continue targeting former managers who have left the organization or lost the required access.
- Stop future reminders when an authorized user restores or permanently deletes the preset. A manager dismissing a reminder does not change the annual schedule; the preset remains archived until acted upon.
- Keep each reminder limited to the preset name, archive date, and review action under DEC-176. Do not disclose wedding financial records or report contents.
- Record each reminder date in the administrative history. Whether reminders for multiple presets should be grouped is decided separately.

**Acceptance criteria:** (1) The first reminder occurs at one year archived; (2) further reminders occur annually while the preset remains archived; (3) reminders stop after restoration or deletion; (4) only current authorized organization managers receive them; (5) dismissal does not alter the annual cadence; (6) each reminder is recorded without financial report contents.

**Scope and follow-up:** Approves annual reminders until restore or deletion. Grouping multiple due reminders remains undecided.

### DEC-178 — Final notice and automatic deletion after seven days

**Status:** Approved  
**Decision:** Replace the annual archive reminders in DEC-176 and DEC-177 with one final notice when a shared preset has been archived for one year, then automatically permanently delete it after seven days if it remains archived.

**Product behavior:**

- When an organization-shared preset has remained archived for one year, send one final in-app notice to the organization's current managers. State that the preset is scheduled for permanent deletion in seven days and show the deletion date and time.
- If the preset remains archived through the seven-day notice period, permanently delete it automatically when the period ends. Do not send annual repeat reminders. Dismissing the notice does not cancel or extend the deletion date.
- An authorized staff member with edit permission may restore the preset during the notice period under DEC-172. Restoration cancels the pending automatic deletion. If a restored preset is archived again, a new one-year period starts from the new archive date under DEC-179.
- An organization manager may permanently delete the preset earlier after confirmation under DEC-174. If the preset is already deleted or restored, no automatic deletion occurs at the deadline.
- On automatic deletion, remove the shared preset definition and version contents under DEC-175. Retain only the minimal deletion audit event under DEC-171 and DEC-174. Existing schedules, reports, snapshots, and personal copies remain unchanged.
- Keep the notice and deletion process within the archive visibility and access rules in DEC-173. Do not expose report contents or financial records.

**Acceptance criteria:** (1) One final notice is sent to current organization managers after one year archived; (2) the notice gives a clear seven-day deletion deadline; (3) an unchanged archived preset is permanently deleted at the end of that period; (4) dismissal does not extend the deadline; (5) restoration during the notice period cancels automatic deletion; (6) manual manager deletion under DEC-174 remains available; (7) version contents are removed and only the minimal audit event remains; (8) related schedules, reports, snapshots, and personal copies are not changed.

**Scope and follow-up:** Supersedes DEC-176 and DEC-177. Approves one final notice at one year archived and automatic permanent deletion seven days later if the preset remains archived. DEC-179 defines how the timer resets after restoration and re-archival.

### DEC-179 — Restart the archive timer after restoration

**Status:** Approved  
**Decision:** Option A — If an organization-shared preset is restored and later archived again, restart its one-year archive period from the new archive date.

**Product behavior:**

- Restoration under DEC-172 cancels any pending final notice and automatic-deletion deadline for that archive period.
- If the preset is archived again, record the new archive date and begin a fresh one-year period. Do not carry forward time from the prior archive period.
- After the new one-year period, send the final notice to current organization managers under DEC-178. If the preset remains archived, the seven-day permanent-deletion period begins from that notice.
- Apply the same reset each time the preset is restored and archived again. Preserve the history of archive, restore, and notice events for authorized reviewers; do not expose financial report contents.

**Acceptance criteria:** (1) Restoring a preset cancels its pending automatic deletion; (2) re-archiving starts a fresh one-year period on the new archive date; (3) no final notice or automatic deletion occurs based on the prior archive period; (4) after one year in the new archive period, DEC-178's final notice and seven-day deletion process applies; (5) repeated restore and re-archive cycles follow the same rule.

**Scope and follow-up:** Approves a fresh one-year archive period after every restore and re-archive cycle. Scheduled-report behavior after source-preset deletion is defined in DEC-180.

### DEC-180 — Continue scheduled reports with preserved filters after preset deletion

**Status:** Approved  
**Decision:** Option A — When an organization-shared preset used by a scheduled report is permanently deleted, preserve the filter definition the schedule was using as an independent, read-only snapshot and continue scheduled runs.

**Product behavior:**

- At permanent deletion of the source preset, retain the schedule's current filter definition, including fixed or relative date behavior, as an independent schedule snapshot. The snapshot contains criteria only, not report data or the deleted preset's version history.
- Continue the schedule on its existing cadence using those preserved criteria. Do not cancel or pause it solely because its source preset was deleted. Other schedule rules still apply, including permission checks, failure handling, report retention, and pauses caused by access or time-zone changes.
- Identify in schedule details that the source preset was deleted and that the schedule now uses preserved criteria. Do not present the deleted preset as available for reuse or editing.
- An authorized schedule owner may independently update the schedule's criteria through the existing schedule-edit flow. Such changes do not recreate or modify the deleted preset.
- Apply the same rule to manager-confirmed and automatic preset deletion. Continue to keep generated reports and snapshots governed by their existing access and retention rules.

**Acceptance criteria:** (1) Deleting a preset does not by itself cancel or pause a schedule that used it; (2) the schedule retains the filter definition active at deletion, including its date-filter behavior; (3) later runs continue on the existing cadence with current permissions rechecked; (4) schedule details identify the deleted source and preserved criteria; (5) the owner can update schedule criteria independently without restoring the deleted preset; (6) report snapshots and deletion audit rules remain unchanged.

**Scope and follow-up:** Approves continued scheduled report runs using the preserved filter definition after shared-preset deletion. Decide next whether schedule owners should receive a notice when this happens.

### DEC-182 — Different vendor-entry models for couples and professionals

**Status:** Approved  
**Decision:** Couples use manual vendor records in their wedding workspace. Professional wedding planners, including planning organizations, use an in-app vendor directory when managing weddings.

**Expected product behavior:** Couple workspaces support recording vendors the couple has found themselves; they are not directed to an in-app vendor directory. Professional planners can select vendors from an in-app directory for use in client work. This decision establishes different entry models by user context; it does not define whether directory entries are shared beyond a planner's own organization.

**Consequences and required follow-up design:** Define what information a couple can enter manually, how vendor records connect to budgets, tasks, contracts, contacts, and the wedding-day schedule, and the privacy and sharing behavior when a planner adds a directory vendor to a wedding. Vendor discovery for couples remains outside the approved scope unless reconsidered.

### DEC-183 — Organization-owned vendor directory

**Status:** Approved  
**Decision:** Each planner organization maintains its own vendor library, reusable across the organization's weddings. The directory is organization-scoped rather than a platform-wide vendor catalog.

**Expected product behavior:** Authorized organization members can use the organization's directory when working across its weddings. A solo professional planner can use their own planner workspace as their organization library. Directory entries belong to that organization and are not automatically available to other organizations or couple-only workspaces. Adding an entry to a wedding follows the separate wedding-sharing rules in DEC-184.

**Consequences and required follow-up design:** Define organization permissions for creating and maintaining directory entries, duplicate handling, vendor profile fields and categorization, and the details and privacy boundaries when a directory entry is added to a client wedding. Decide what happens to wedding records if an organization loses access or a directory entry is archived or removed.

### DEC-184 — Selectively share organization vendor details with a wedding

**Status:** Approved  
**Decision:** Option A — When adding a vendor from an organization library to a wedding, the planner chooses which details are shared with wedding collaborators. Organization-only notes remain private, and later library changes require review before sharing.

**Product behavior:** Adding a directory vendor does not expose the full organization profile automatically. The planner reviews and selects client-visible details for the wedding record; organization-only notes remain inaccessible to couple members and other wedding collaborators. Later changes to the directory entry do not silently change the wedding record or become visible to wedding collaborators. An authorized planner must review later changes and explicitly choose which to share. Current wedding-visible details remain governed by wedding permissions and the couple's access rules.

**Acceptance criteria:** (1) A planner can select details for the wedding record without exposing organization-only notes; (2) adding a vendor does not make the full library profile visible by default; (3) later library edits do not silently alter the wedding record; (4) a planner can review changes and explicitly select which updates to share; (5) users without organization access cannot retrieve private library details through the wedding record.

**Consequences and required follow-up design:** Define the vendor profile fields and their default visibility, who may select and share details, how edits to already-shared wedding details work, and how the wedding record behaves if the vendor entry is archived or removed from the organization library or the organization loses wedding access.

### DEC-185 — Structured side-by-side vendor comparison

**Status:** Approved  
**Decision:** Option A — Compare vendors for the same service side by side using relevant standard details and optional custom criteria. The platform does not calculate an automatic winner.

**Product behavior:** Users can compare key information such as price, package, availability, and pros and cons in a consistent view. The comparison may include criteria the user adds for that decision. The interface presents facts and user-entered assessments without automatically ranking vendors or recommending a winner.

**Acceptance criteria:** (1) Users can compare multiple vendor records for the same service together; (2) common relevant details appear in a consistent side-by-side layout; (3) users can add optional custom comparison criteria; (4) the platform does not generate a winner or weighted score.

**Consequences and required follow-up design:** Define the standard comparison fields for each vendor category, handling of missing or incomparable information, and how comparison criteria are saved or reused.

### DEC-186 — Guided standard vendor decision and booking stages

**Status:** Approved  
**Decision:** Option A — Use a standard vendor status flow: Considering, Contacted, Quote received, Shortlisted, Selected, Booked, and Not proceeding. Users may skip stages.

**Product behavior:** The status indicates where a vendor option stands in the couple’s or planner’s decision process. Users can move directly to an applicable stage without completing every earlier stage. “Selected” and “Booked” remain separate: selection records preference, while booking records that the vendor engagement is confirmed by the user. “Not proceeding” preserves a clear outcome for an option no longer under consideration.

**Acceptance criteria:** (1) The standard stages are available in the stated order; (2) users can skip stages and move to a relevant stage directly; (3) Selected does not automatically mean Booked; (4) Not proceeding remains distinguishable from deletion or archive.

**Consequences and required follow-up design:** Define confirmation behavior for marking a vendor Booked, status-change permissions and history, and how statuses appear in comparison views, dashboards, and reports.

### DEC-187 — One primary vendor with additional selections allowed

**Status:** Approved  
**Decision:** Option A — A service category may have one designated primary vendor while also supporting additional selected vendors for distinct needs or scopes.

**Product behavior:** Users can designate the main vendor for a service category and retain other selected vendors where a wedding needs multiple providers or separate scopes. The primary designation is distinct from the underlying Selected or Booked status. The system must not force multiple legitimate vendors into a single record or treat a primary designation as proof of a contract.

**Acceptance criteria:** (1) A category may have one primary vendor; (2) additional vendors may be selected for that category with distinct needs or scopes; (3) users can change the primary designation without deleting other vendor records or their history; (4) primary status does not itself imply booking or payment.

**Consequences and required follow-up design:** Define how scopes are recorded, whether one vendor may serve multiple categories, and how status and financial links are summarized when several vendors serve one category.

### DEC-188 — Link vendor records to wedding contact records

**Status:** Approved  
**Decision:** Option A — Link a vendor to one or more contact-directory records, with wedding-visible details controlled separately from organization-private information.

**Product behavior:** A vendor record can reference contact entries for relevant people at the vendor, such as a primary contact or day-of contact. Where the record comes from an organization library, the link does not bypass the selective sharing rules in DEC-184. Contacts and vendor records remain distinct records; linking them avoids re-entering the same contact details while preserving applicable wedding and organization permissions.

**Acceptance criteria:** (1) A vendor can link to one or more contact records; (2) users can identify each linked contact’s role for that vendor; (3) linking does not expose organization-private fields or bypass wedding permissions; (4) permitted updates to contact details are reflected through the linked contact rather than duplicated copies.

**Consequences and required follow-up design:** Define who can create, link, edit, and unlink contact records; how couples’ manual vendor entries connect to contacts; and how contact access and updates behave when a planner’s organization loses wedding access.

### DEC-189 — Link vendor records to documents, finances, and tasks in their own modules

**Status:** Approved  
**Decision:** Option A — Keep contracts, quotes, invoices, payments, and tasks in their respective modules and link them to the relevant vendor record instead of duplicating them inside it.

**Product behavior:** A vendor record provides access to its related documents, financial records, and tasks when the user has permission to view those items. The linked modules remain the source of truth for their own information and workflows. Creating a vendor link alone does not create a contract, financial commitment, payment, or task. Existing financial verification, privacy, and audit safeguards continue to apply.

**Acceptance criteria:** (1) Authorized users can navigate from a vendor to its related documents, financial records, and tasks; (2) the same item is not duplicated solely to appear on the vendor record; (3) vendor links do not grant access to otherwise restricted information; (4) adding or changing a link does not itself create a commitment or task; (5) each linked item retains its original module’s status, permissions, and history.

**Consequences and required follow-up design:** Define the exact supported link types, cross-module search and display behavior, handling when a linked item is archived or removed, and which roles can create or remove links.

### DEC-190 — Customizable starter vendor service categories

**Status:** Approved  
**Decision:** Provide a useful starter list of vendor service categories that authorized users can add to, rename, reorder, or hide.

**Product behavior:** Couples and planner organizations receive a consistent initial set of categories. Within the relevant workspace and permissions, users may tailor the category list to their needs. Hiding a category must not silently delete existing vendor records; existing records remain accessible and retain their category history or a clear uncategorized state if a category is removed.

**Scope and follow-up:** Approves a customizable starter list, not a platform-wide vendor catalog. Define the exact starter categories and migration behavior for category changes during detailed design.

### DEC-191 — Category-aware vendor fields

**Status:** Approved  
**Decision:** Vendor records use shared common fields plus fields tailored to the vendor’s service category, with optional custom fields.

**Product behavior:** Common information such as vendor name and contact details remains consistent. Category-specific fields capture useful details for that service type. Organizations may add optional custom fields where needed. Custom or organization-only information must follow existing visibility and sharing controls, including DEC-184.

**Scope and follow-up:** Approves a category-aware field model, not the exact field list or data validation rules. Define the initial common and category-specific fields during module design.

### DEC-192 — Review possible vendor duplicates

**Status:** Approved  
**Decision:** Suggest possible duplicate vendor records to authorized users for review; never automatically merge records.

**Product behavior:** When a user creates or imports a vendor that resembles an existing record in the organization directory, show likely matches and let an authorized user review, link, or merge as permitted. Do not block entry solely because a possible match exists, and do not merge records without an explicit user action. Preserve organization and wedding visibility boundaries while checking for matches.

**Scope and follow-up:** Approves review suggestions and user-controlled resolution. Define match signals, merge permissions, and handling of distinct branches or contacts during detailed design.

### DEC-193 — Editable date-based wedding planning starter plan

**Status:** Approved  
**Decision:** Offer an editable starter plan based on the wedding date, containing common planning tasks and milestones.

**Product behavior:** The plan should provide a useful starting point rather than a required workflow. Couples can edit, add, or remove tasks and milestones. A missing or changed wedding date must not prevent use of the task list; date-based timing can be adjusted when the date is added or changed. Starter-plan generation must avoid overwriting tasks users have already customized.

**Scope and follow-up:** Approves an editable date-based starter plan. The default plan contents, treatment of weddings without dates, and update behavior after major date changes remain to be designed.

### DEC-194 — One accountable owner with optional task collaborators

**Status:** Approved  
**Decision:** A task may have one accountable owner and optional collaborators. A task may also remain unassigned.

**Product behavior:** The owner is the primary person responsible for moving a task forward. Collaborators can help without creating ambiguity about accountability. Unassigned tasks remain visible to people with permission and can be claimed or assigned later. Assignment does not change workspace permissions or grant access to otherwise restricted information.

**Scope and follow-up:** Approves the ownership model, not the detailed permission matrix or notification rules. Define who may assign, claim, or change task ownership and how changes are communicated.

### DEC-195 — Optional task dependencies

**Status:** Approved  
**Decision:** Let users optionally link prerequisite tasks. Dependencies may surface blockers and overdue work but must not prevent users from working on or completing a task.

**Product behavior:** Tasks remain independently editable and completable. When a prerequisite is incomplete or overdue, show that relationship as planning context rather than enforcing a hard lock. Users may add or remove dependency links, subject to workspace permissions. Avoid circular dependency relationships.

**Scope and follow-up:** Approves optional, non-blocking dependencies. Define dependency display, reminders, and safeguards for changing dates or deleting linked tasks.

### DEC-196 — Digital and manually recorded guest RSVPs

**Status:** Superseded by DEC-203  
**Decision:** The original decision supported platform RSVP links and manual recording. The product direction is updated by DEC-203: couples track confirmation in their guest list, and the app does not send invitations or RSVP links.

**History:** Kept for decision traceability. The original invitation and response options are no longer current.

### DEC-197 — Itemized wedding budget with simple summaries

**Status:** Approved  
**Decision:** Track category budgets and individual cost records, including quotes, deposits, due dates, and payments, while presenting simple planned-versus-actual summaries.

**Product behavior:** The budget supports an overall target and category allocations, with individual records connected to vendors where relevant. Couples can distinguish estimates, quoted amounts, commitments, deposits, due dates, and paid amounts in line with the product’s experience principles. Summary views should remain understandable without requiring double-entry bookkeeping or a full accounting ledger.

**Scope and follow-up:** Approves itemized planning records and simple summaries. Define calculations, currencies, handling of shared or split payments, and planner-specific financial visibility during budget-module design.

### DEC-198 — Household grouping with individual guest records

**Status:** Superseded by DEC-204  
**Decision:** The original decision centered the list on individual guest records grouped by household. DEC-204 updates the primary list presentation to named guest entries or groups with adult and child counts.

**History:** Kept for traceability. The list may retain individual detail where needed, but the approved top-level row is the named guest entry or group.

### DEC-199 — Event-specific guest invitations

**Status:** Superseded by DEC-205  
**Decision:** The original decision described invitations sent to selected events. DEC-205 retains event-specific attendance categories as couple-managed guest-list data and does not imply that the app sends invitations.

**History:** Kept for traceability. Current event scopes and their display are defined by DEC-205.

### DEC-200 — Invitation-specific plus-one limits

**Status:** Superseded by DEC-204  
**Decision:** The original decision set a plus-one allowance on each invitation. DEC-204 replaces invitation allowances with adult and child counts on a named guest entry or group.

**History:** Kept for traceability. The app does not send invitations or enforce invitation plus-one limits.

### DEC-201 — Per-person RSVP records with household submission

**Status:** Superseded by DEC-203 and DEC-204  
**Decision:** The original decision supported household-submitted digital RSVP responses stored per person. The current flow uses a couple-managed confirmation checkbox on each guest entry or group, with headcounts recorded as adults and children.

**History:** Kept for traceability. There is no guest-facing RSVP submission flow in the app.

### DEC-202 — Per-guest dietary and allergy information

**Status:** Superseded by DEC-206  
**Decision:** The original decision called for structured dietary and allergy information per individual guest. DEC-206 updates this to optional labels chosen from a default list or created by the couple.

**History:** Existing wedding workspace permissions continue to apply. Current label behavior is defined by DEC-206.

### DEC-203 — Couple-managed guest list with manual confirmation

**Status:** Approved  
**Decision:** Couples use the app to maintain a guest list and manually mark whether each guest entry or group has confirmed. The app does not send wedding invitations or guest RSVP links.

**Product behavior:** Provide a confirmation checkbox on each guest entry or group. Couples update it based on confirmations they receive outside the app. An unchecked entry is not counted as confirmed. Do not provide guest-facing invitation delivery or an RSVP submission flow as part of this guest-list feature.

**Scope and follow-up:** Replaces the invitation and RSVP sending directions in DEC-196 and DEC-201. The handling of a partially confirmed group remains open under Q-208.

### DEC-204 — Named guest entries with adult and child counts

**Status:** Approved  
**Decision:** Represent each guest party or group as a named guest-list entry with a display name or group label and separate counts for adults and children.

**Product behavior:** Show the group label and adult/child counts directly in the guest list. A confirmation checkbox applies to the entry as a whole unless a future decision permits partial confirmation. Keep detailed individual information optional and secondary to the grouped list view. Do not use plus-one allowances as invitation controls.

**Scope and follow-up:** Replaces the previous individual-first presentation and invitation-specific plus-one allowance in DEC-198 and DEC-200. Q-208 covers partial confirmation behavior.

### DEC-205 — Event-scope categories and readable combinations

**Status:** Approved  
**Decision:** Assign each guest entry to the whole event, reception only, dinner only, dance party only, or a combination of those event segments.

**Product behavior:** Display one compact event-scope label per entry. Use “Full event” when the group is included in all event segments. For a partial combination, show all included segments in a consistent event order, for example “Reception + Dinner” or “Dinner + Dance party.” Keep combinations visually distinct from the full-event label so a partial invitation is easy to scan. The app records these categories for the couple; it does not send invitations.

**Scope and follow-up:** Replaces the invitation-delivery framing of DEC-199. Confirm exact event naming and ordering when the wedding schedule is configured.

### DEC-206 — Optional dietary labels from defaults or custom labels

**Status:** Approved  
**Decision:** Let couples attach optional dietary labels to guest entries, choosing from a default list or creating a custom label.

**Product behavior:** The default list should include common labels such as Vegan and Vegetarian. Couples can add a custom label for another dietary preference or requirement. Labels are optional and should be visible in the guest list for planning. Apply existing wedding workspace permissions to these details.

**Scope and follow-up:** Replaces the structured per-person dietary fields in DEC-202. Define the default label list and whether labels can be applied to a subgroup within a named guest entry during detailed design.

### DEC-207 — Confirmed headcount at the top of the guest list

**Status:** Approved  
**Decision:** Show the number of confirmed attendees at the top of the guest list, calculated from the adult and child counts on confirmed entries.

**Product behavior:** Display a clear total confirmed headcount. Include adult and child subtotals so the couple can quickly understand the composition. Update the count when an entry is marked confirmed or its headcount changes; do not include unchecked entries.

**Scope and follow-up:** Approves the confirmed headcount summary. Partial confirmation of a named group remains unresolved under Q-208.

### DEC-208 — Group-level confirmation with adjustable attending counts

**Status:** Approved  
**Decision:** The confirmation checkbox applies to the whole guest group. When marking the group confirmed, the couple can adjust the adult and child counts to reflect the number actually attending.

**Product behavior:** Keep one confirmation checkbox per guest group; do not require separate confirmation states for individuals in that group. Allow the couple to edit the group’s adult and child counts as part of recording confirmation. The confirmed headcount summary uses the adjusted counts for checked groups and excludes unchecked groups. This lets a group confirm while recording that fewer people will attend than were originally expected.

**Scope and follow-up:** Resolves Q-208. DEC-209 specifies that the confirmed attending counts replace the previous adult and child counts; a separate original headcount is not retained.

### DEC-209 — Replace guest-group counts with confirmed attendance

**Status:** Approved  
**Decision:** Keep one adult count and one child count for each guest group. When the group confirms, update those counts in place to reflect the number actually attending; do not retain the original planned headcount separately.

**Product behavior:** The confirmation checkbox applies to the whole group under DEC-208. The couple can adjust the adult and child counts at confirmation, and those updated values become the group’s current counts. The confirmed headcount summary uses the current counts for checked groups and excludes unchecked groups.

**Scope and follow-up:** Resolves Q-209. The app stores only the current adult and child counts for each group, not separate invited and attending totals.

### DEC-210 — Master chronological wedding-day schedule with event filters

**Status:** Approved  
**Decision:** Use one chronological master run sheet, with sections or filters for the ceremony, reception, dinner, dance party, and other configured event segments.

**Product behavior:** Keep one source schedule so users can follow the full day in order or focus on a particular event segment. Event-specific views must reflect the same schedule entries and changes as the master timeline.

**Scope and follow-up:** Approves a master timeline with event filters. Define detailed grouping, sort, and display behavior during schedule design.

### DEC-211 — Start and end times with a visible TBD state

**Status:** Approved  
**Decision:** Schedule items can have start and end times, and may remain marked TBD until the timing is known.

**Product behavior:** Allow an item to be saved without fixed times by showing a clear TBD state. Once known, users can add or edit its start and end times. Do not require fixed times before adding an item to the run sheet.

**Scope and follow-up:** Approves start/end time fields and TBD timing. Define time-zone display and behavior for overlapping or missing durations during detailed design.

### DEC-212 — Manual live status for schedule items

**Status:** Approved  
**Decision:** Use the statuses Planned, In progress, Complete, and Delayed for wedding-day schedule items.

**Product behavior:** Authorized users update statuses manually during the event. Status is visible in the coordinator view and helps the team understand what is happening. A status change does not by itself alter the scheduled time.

**Scope and follow-up:** Approves these four statuses. Define status-change history and whether additional statuses are needed during detailed design.

### DEC-213 — Couple, lead planner, and assigned coordinator schedule updates

**Status:** Approved  
**Decision:** The couple, lead planner, and assigned coordinators may update the wedding-day schedule according to their permissions. Other users’ access follows the workspace permission model.

**Product behavior:** Both partners retain equal control under DEC-003. Planner and coordinator updates remain subject to their current wedding access and assigned role. A schedule role does not grant access to unrelated private information.

**Scope and follow-up:** Approves the main update roles, subject to existing permissions. Exact role defaults and permission settings remain open elsewhere in the specification.

### DEC-214 — Offline read-only and printable schedule access

**Status:** Approved  
**Decision:** Provide a saved, read-only schedule for offline coordinator access, plus a printable/PDF version.

**Product behavior:** Coordinators can prepare the current schedule for offline viewing before connectivity is lost. Offline access is read-only; updates require normal online permissions. A printable/PDF version supports paper backup and is governed by the same access rules when generated.

**Scope and follow-up:** Approves offline read-only access and print/PDF support. Define when offline copies refresh and how stale copies are identified.

### DEC-215 — Notify on material schedule changes

**Status:** Approved  
**Decision:** Send schedule alerts when an item’s time, location, or responsibility changes. Routine note edits and status changes do not trigger these alerts.

**Product behavior:** Treat updates to start/end time, location, or assigned responsibility as material changes. Changes only to notes, or status changes such as In progress or Delayed, do not generate a schedule-change alert under this decision.

**Scope and follow-up:** Approves the change types that trigger alerts. Alert recipients are defined in DEC-216. Delivery channel and batching details remain open.

### DEC-216 — Notify people assigned to affected schedule items

**Status:** Approved  
**Decision:** Send schedule-change alerts to the people assigned to the affected items.

**Product behavior:** A change to an item notifies people assigned to that item. Do not notify every person who can view the full schedule solely because they have viewing access. Apply existing workspace access and notification settings.

**Scope and follow-up:** Approves the recipient group for the material changes in DEC-215. Define how users without an assigned person are handled during detailed design.

### DEC-217 — Review proposed timing adjustments after a delay

**Status:** Approved  
**Decision:** When a schedule item is delayed, show proposed timing adjustments for affected later items and require an authorized person to review and apply them. Do not shift later items automatically.

**Product behavior:** Identify downstream items that may be affected by the delay and show suggested revised times. Authorized users may accept or edit the proposals, or leave the original schedule unchanged. Applying a proposal updates the schedule and triggers the applicable material-change alerts under DEC-215/216.

**Scope and follow-up:** Approves human review before shifting later timings. Define how proposals account for buffers, fixed commitments, and overlapping locations during detailed design.

### DEC-218 — Keep the schedule editable during the wedding

**Status:** Approved  
**Decision:** Keep the schedule editable before and during the wedding for authorized users under DEC-213. Do not impose an automatic cutoff or event-start lock.

**Product behavior:** Authorized couples, lead planners, and assigned coordinators may make schedule updates as the day unfolds. Other users retain access according to their current permissions. Status changes remain available during the event.

**Scope and follow-up:** Approves ongoing editability; there is no automatic schedule lock at a selected cutoff or at event start.

### DEC-219 — Show the latest schedule without schedule-specific edit history

**Status:** Approved  
**Decision:** Show the latest schedule only. Do not provide a schedule-specific history of prior versions or edits.

**Product behavior:** Authorized users see current schedule details, including applied timing changes and status updates. Do not expose prior schedule versions or a persistent schedule-edit timeline. This decision does not remove security, access, or administrative audit records required by other platform rules.

**Scope and follow-up:** Approves the current-schedule-only experience. Offline-copy refresh and stale-copy handling remain open under Q-220.

### DEC-220 — Refresh saved offline schedules whenever online

**Status:** Approved  
**Decision:** A coordinator can save a schedule for offline use, and the app refreshes that saved copy whenever it is online.

**Product behavior:** When a schedule has been marked Save offline, update its local read-only copy when the app has connectivity and a newer schedule is available. Display the last successful sync time. Offline access remains read-only under DEC-214.

**Scope and follow-up:** Approves automatic refresh while online for explicitly saved schedules. DEC-221 defines how potential staleness is shown while offline.

### DEC-221 — Show offline-copy sync time and staleness warning

**Status:** Approved  
**Decision:** Show the last sync time and a clear warning that an offline schedule may be out of date while the device is offline.

**Product behavior:** Display when the saved schedule last synced. While offline, make clear that newer online changes may not be present. Once connectivity returns, refresh under DEC-220 and update the timestamp and warning state.

**Scope and follow-up:** Approves timestamp and offline staleness warning. The warning must not claim to know about an online change that cannot be checked while disconnected.

### DEC-222 — Explicitly save schedules for offline use

**Status:** Approved  
**Decision:** Let coordinators explicitly choose Save offline for a schedule; do not automatically save every schedule they can access.

**Product behavior:** Provide a clear action to prepare or refresh the saved copy while online. Show whether the schedule is available offline and its last sync time under DEC-220/221.

**Scope and follow-up:** Approves opt-in offline saving per schedule. Storage limits and removal behavior remain to be designed.

### DEC-223 — Offline schedule includes run sheet and essential contacts

**Status:** Approved  
**Decision:** Include the timeline, locations, responsibilities, status, and essential day-of contact details in the offline schedule copy.

**Product behavior:** Make this operational information available in the read-only offline copy. Do not include all connected wedding records or unrelated private information merely because they are linked elsewhere.

**Scope and follow-up:** Approves the contents at a product level. Define which contact fields count as essential and how their access follows current wedding permissions.

### DEC-224 — Printable/PDF run sheet includes operational details and essential contacts

**Status:** Approved  
**Decision:** Include timeline, locations, responsibilities, statuses, and essential day-of contacts in the printable/PDF run sheet.

**Product behavior:** Keep the exported schedule practical for use on paper, with readable timing and responsibility details. Exclude unrelated connected wedding information. Apply existing access rules when generating and sharing the PDF.

**Scope and follow-up:** Approves core printable/PDF contents. Page layout, print options, and essential contact fields remain for detailed design.

### DEC-225 — Remove saved offline schedule after access revocation
**Status:** Approved  
**Decision:** Option A — Revoke online access immediately. Because a disconnected device cannot be reached remotely, invalidate and remove its saved offline schedule the next time it reconnects.

**Consequences:** Clearly explain that removal is pending while a device remains offline; do not imply that the platform can remotely erase a disconnected device. The saved schedule remains read-only while available offline.

### DEC-226 — Searchable document library linked to workspace records
**Status:** Approved  
**Decision:** Option A — Organize documents in a searchable library with categories and links to relevant vendors, budget/finance records, tasks, and other workspace records. Linked records remain in their own modules; linking does not create duplicate copies.

**Consequences:** Default categories and search/filter details remain for later design.

### DEC-227 — Per-document Shared or Private visibility
**Status:** Approved  
**Decision:** Option B — Choose Shared or Private visibility for each document, applying the existing wedding workspace permission model.

**Consequences:** Define precise visibility semantics and authorized roles during detailed permissions design. A private document must not be exposed through links, search, exports, or notifications to unauthorized users.

### DEC-228 — Replacing a document discards the prior file
**Status:** Approved  
**Decision:** Replace the old file. A replacement becomes the current document, and the prior file content is not retained as a document version.

**Consequences:** Confirm replacement clearly before it occurs. Any separately required audit metadata remains subject to global audit and retention rules; this decision does not create file-version history.

### DEC-229 — Workspace notes are shared
**Status:** Approved  
**Decision:** Share all workspace notes with the wedding workspace.

**Consequences:** Do not describe notes as private in the module overview. Apply existing workspace permissions; note-specific private visibility is not included in this decision.

### DEC-230 — Default document library categories
**Status:** Approved  
**Decision:** Provide default categories for Contracts, Quotes/Invoices, Receipts, and Other Documents.

**Consequences:** Keep the starter categories clear and useful across different wedding planning workflows. Additional category behavior is defined in DEC-233.

### DEC-231 — Documents may have multiple categories
**Status:** Approved  
**Decision:** Allow a document to be assigned to more than one category.

**Consequences:** A document remains one library item even when it appears in multiple category views; categorization must not create duplicate files.

### DEC-232 — Search document metadata and linked records
**Status:** Approved  
**Decision:** Search document titles, categories, linked records, and notes/descriptions.

**Consequences:** Search results must respect each document's Shared or Private visibility and the user's current workspace permissions.

### DEC-233 — Couple-created document categories
**Status:** Approved  
**Decision:** Keep the default categories and allow couples to create custom categories.

**Consequences:** The detailed permissions for managing categories and any rename, reorder, archive, or deletion behavior remain open.

### DEC-234 — Optional document expiry and renewal reminders
**Status:** Approved  
**Decision:** Allow an optional expiry or renewal date and reminder for a document.

**Consequences:** Reminders are optional. Detailed reminder timing, recipients, and handling of replaced documents remain for later design.

### DEC-235 — Review carried-over expiry details after document replacement
**Status:** Approved  
**Decision:** When a document is replaced, carry its expiry or renewal date and reminder forward, then ask the user to review and confirm those details.

**Consequences:** Do not silently assume the replacement has the same expiry or renewal terms. Reminder timing and recipients follow later reminder design.

### DEC-236 — Recoverable document trash
**Status:** Approved  
**Decision:** Move deleted documents to a recoverable trash for 30 days, with restore available during that period.

**Consequences:** Define who can restore or permanently remove an item, and what happens to linked records and reminders, during detailed permissions and retention design.

### DEC-237 — Searchable notes list with optional organization
**Status:** Approved  
**Decision:** Present workspace notes in a searchable list and allow optional categories or tags.

**Consequences:** Notes remain usable without categorization; exact category/tag controls and search fields remain for later design.

### DEC-238 — Link notes to related wedding records
**Status:** Approved  
**Decision:** Allow notes to link to vendors, tasks, documents, and other relevant wedding workspace records.

**Consequences:** Links should navigate to the existing record without duplicating it and must respect the linked record's access permissions.

### DEC-239 — Latest note editor and time, without prior text versions
**Status:** Approved  
**Decision:** Show the latest editor and edit time for each note, but do not retain or offer restoration of earlier note text versions.

**Consequences:** This is a lightweight attribution indicator, not a note version history. Any global audit requirements remain separately applicable.

### DEC-240 — Basic formatting for shared notes
**Status:** Approved  
**Decision:** Support headings, bullets, and checklists in shared notes.

**Consequences:** Keep note editing focused on these basic structures; richer media and embedded files are not included by this decision.

### DEC-241 — Record-level comments with replies
**Status:** Approved  
**Decision:** Allow comments and replies attached to individual wedding workspace records, including tasks and vendor records.

**Consequences:** Comments remain connected to the record being discussed and follow that record's permissions. Further design should define editing, deletion, mention, and notification behavior.

### DEC-242 — Activity history for key workspace changes
**Status:** Approved  
**Decision:** Show key changes with the person who made each change and when it happened.

**Consequences:** Define the key-change event list and retention rules in detailed design. Activity history must respect access permissions and should not expose restricted record content.

### DEC-243 — In-app notifications with optional email or push
**Status:** Approved  
**Decision:** Provide in-app notifications and let users optionally receive them by email or push notification.

**Consequences:** Permission checks must still apply when a notification is opened; delivery channel selection does not grant access to the underlying record.

### DEC-244 — Per-area notification preferences
**Status:** Approved  
**Decision:** Let each user choose which notification areas to receive, including areas such as tasks, guests, and schedule changes.

**Consequences:** Keep category choices understandable and allow notification delivery channels to be configured separately under DEC-243.

### DEC-245 — Activity history covers key wedding workspace changes
**Status:** Approved  
**Decision:** Include changes to access, tasks, schedule, guests, budget, and documents in the activity history, with actor and time (DEC-242).

**Consequences:** Apply current permission checks when showing event details and links. Retain events until one year after the wedding date (DEC-401); vendor-related events use the same period (DEC-399).

### DEC-246 — Users may edit or delete their own comments
**Status:** Approved  
**Decision:** Let a user edit or delete their own comments. Show when a comment was edited; preserve replies and activity history.

**Consequences:** Define how a deleted comment appears within an existing reply thread and how comment edits/deletions are reflected in the activity history.

### DEC-247 — Authorized @mentions in record comments
**Status:** Approved  
**Decision:** Support @mentions in comments. Notify a mentioned person only if they are authorized to view the related record.

**Consequences:** Recheck access when the notification is delivered and when opened. A mention must not disclose the existence or content of an inaccessible record.

### DEC-248 — Immediate important notifications and optional routine digest
**Status:** Approved  
**Decision:** Deliver important changes immediately and offer a digest option for routine updates.

**Consequences:** Define which events are important, digest frequency, time zone, and how user notification preferences affect each channel.

### DEC-249 — Read controls in the in-app notification inbox
**Status:** Approved  
**Decision:** Track unread notifications and let users mark an individual notification or all notifications as read.

**Consequences:** Preserve notification access checks when opening from the inbox. Read state does not change access to the underlying record.

### DEC-250 — Common contact fields
**Status:** Approved  
**Decision:** Contact records include name, role/company, phone, email, address, and notes by default.

**Consequences:** Detailed validation, optionality, and multiple contact methods remain for further design.

### DEC-251 — Suggested contact types
**Status:** Approved  
**Decision:** Provide suggested types for vendor, venue, planner, guest, helper, and emergency contact.

**Consequences:** These are starting types for organizing the directory. Custom types and whether a contact can have multiple types remain open.

### DEC-252 — Link contacts to multiple workspace records
**Status:** Approved  
**Decision:** A contact may link to multiple vendors, tasks, and other records within the same wedding workspace.

**Consequences:** Links reuse the existing contact record and do not duplicate contact details. This decision does not authorize sharing a contact across separate wedding workspaces.

### DEC-253 — Per-contact Shared or Private visibility
**Status:** Approved  
**Decision:** Choose Shared or Private visibility for each contact, subject to existing wedding workspace permissions.

**Consequences:** Private contact details must not leak through links, search, exports, comments, or notifications to unauthorized people.

### DEC-254 — Review likely duplicate contacts
**Status:** Approved  
**Decision:** Flag possible duplicate contacts for review. Authorized users may explicitly link or merge them; never block creation or merge automatically.

**Consequences:** Define duplicate indicators and merge safeguards in detailed design. Preserve appropriate record links and attribution when merging.

### DEC-255 — Multiple contact types per record
**Status:** Approved  
**Decision:** Allow a contact to have multiple types, such as Vendor and Guest.

**Consequences:** Contact types are organizational labels and do not independently change access permissions.

### DEC-256 — Multiple labeled phone numbers and email addresses
**Status:** Approved  
**Decision:** Allow multiple phone numbers and email addresses on a contact, with a label for each entry.

**Consequences:** Exact label choices and validation remain for detailed design.

### DEC-257 — Couple-created contact types
**Status:** Approved  
**Decision:** Keep the suggested contact types and allow couples to create custom types.

**Consequences:** Rename, reorder, archive, and deletion behavior remains open. Custom types do not create new permission roles.

### DEC-258 — Contact directory search and filters
**Status:** Approved  
**Decision:** Search contact names, companies, and contact details; filter contacts by type and linked records.

**Consequences:** Results must respect each contact’s Shared or Private visibility and current workspace permissions.

### DEC-259 — Preferred contact method
**Status:** Approved  
**Decision:** Let users mark a phone number or email address as the preferred contact method for a contact.

**Consequences:** This is informational guidance for wedding collaborators; it does not authorize the platform to contact that person.

### DEC-260 — Manual contact entry only
**Status:** Approved  
**Decision:** Couples and collaborators add contacts manually; do not provide device contact import.

**Consequences:** No contact data is imported from a device or external address book. Manual entry uses the approved contact fields and validation.

### DEC-261 — Separate contact records for each wedding workspace
**Status:** Approved  
**Decision:** Keep contact records separate between wedding workspaces. Allow an authorized user to explicitly copy a contact into another workspace, creating an independent record.

**Consequences:** Changes to one workspace's copy do not change another. Copying must respect access permissions and make the destination clear to the user.

### DEC-262 — Contact visibility applies to the whole record
**Status:** Approved  
**Decision:** Apply Shared or Private visibility to the contact record as a whole, not to individual fields.

**Consequences:** If a contact is Private, its fields and linked contact details are not visible to unauthorized workspace members.

### DEC-263 — Archive linked contacts before permanent deletion
**Status:** Approved  
**Decision:** Archive a contact when deleted if it is linked to other records, preserving those links. Require review before permanent deletion.

**Consequences:** Define who can restore or permanently delete archived contacts and what the review shows in detailed design.

### DEC-264 — Select emergency contacts for offline and printable schedules
**Status:** Approved  
**Decision:** Let authorized users select which emergency contacts to include in the saved offline schedule and printable/PDF run sheet.

**Consequences:** Apply contact visibility permissions and include only selected, authorized contact details in exported or offline material.

### DEC-265 — Standard planning task statuses
**Status:** Approved  
**Decision:** Use Not started, In progress, Blocked, and Complete as the standard task statuses.

**Consequences:** Define status transitions and the relationship between Blocked status and prerequisite-task links in detailed design.

### DEC-266 — Undated tasks remain available
**Status:** Approved  
**Decision:** Allow a task to have no due date and show it in an undated list until a date is known.

**Consequences:** Undated tasks remain part of the planning task list and can still be assigned, linked, and completed.

### DEC-267 — Checklists and separate subtasks
**Status:** Approved  
**Decision:** Support simple checklists within a task. More substantial subtasks can be represented as separate tasks.

**Consequences:** Checklist items do not automatically receive separate owners or due dates; use full tasks when independent tracking is needed.

### DEC-268 — Reopen completed tasks with completion activity retained
**Status:** Approved  
**Decision:** An authorized user may reopen a completed task; retain the completion activity in the task history.

**Consequences:** Reopening returns the task to an active status while preserving its earlier completion event and attribution.

### DEC-269 — Optional per-task reminders
**Status:** Approved  
**Decision:** Let users set optional reminders on individual tasks, with a suggested reminder before the due date.

**Consequences:** Exact default lead time, reminder recipients, and delivery channels remain for detailed design and must respect each user's notification preferences.

### DEC-270 — Preview starter-task date changes after wedding-date changes
**Status:** Approved  
**Decision:** If the wedding date changes, preview proposed due-date changes for unfinished starter-plan tasks and ask before applying them. Do not shift task dates automatically.

**Consequences:** The review must distinguish starter-plan tasks from manually dated tasks and completed work; details of selective acceptance remain for design.

### DEC-271 — Overdue indicator separate from task status
**Status:** Approved  
**Decision:** Show an overdue indicator for late tasks while preserving their existing status.

**Consequences:** Overdue is a time-based signal, not a status value. It should clear when the due date changes or the task is completed.

### DEC-272 — Show prerequisite blockers without automatic status changes
**Status:** Approved  
**Decision:** Show a blocker indicator when a prerequisite is unfinished, but let users manage the task's status themselves.

**Consistency with DEC-195:** A prerequisite may surface a blocker without preventing work or completion. The platform does not automatically set Blocked status.

### DEC-273 — Group tasks by planning phase with filters
**Status:** Approved  
**Decision:** Organize the planning list by wedding-planning phase and provide filters for owner, status, and due date.

**Consequences:** Keep phase organization compatible with the editable starter plan; custom grouping behavior remains open.

### DEC-274 — Notify assignees on assignment and due-date changes
**Status:** Approved  
**Decision:** Notify task assignees when a task is assigned to them or its due date changes. Do not notify for routine description edits.

**Consequences:** Delivery follows users' notification-area and channel preferences, plus timing rules in DEC-243/248.

### DEC-275 — Confirm completion with unfinished checklist items
**Status:** Approved  
**Decision:** Allow a task to be marked Complete while checklist items remain unfinished, after showing a warning and requiring confirmation.

**Consequences:** Preserve the checklist state so the user can see which items remain unchecked after task completion.

### DEC-276 — Optional reason for a Blocked task
**Status:** Approved  
**Decision:** Let users add an optional short reason or link to a blocking task when a task is marked Blocked.

**Consequences:** A reason is not required; prerequisite relationships continue to surface blockers under DEC-272.

### DEC-277 — Notify task collaborators about due-date changes
**Status:** Approved  
**Decision:** When an assigned task's due date changes, notify the owner and task collaborators.

**Consistency with DEC-274:** Assignment notices go to the new owner; due-date change notices go to the owner and collaborators. Routine description edits do not trigger notices.

### DEC-278 — Completed tasks in a collapsed section
**Status:** Approved  
**Decision:** Move completed tasks to a collapsed Completed section that remains accessible in the task list.

**Consequences:** Users can review completed work without it crowding active tasks. Reopened tasks return to the relevant active list while retaining completion activity.

### DEC-279 — Archive tasks that are no longer needed
**Status:** Approved  
**Decision:** Archive tasks that are no longer needed, preserve their links and activity, and allow restoration.

**Consequences:** Define archive visibility and who may restore tasks in detailed permissions design. Archiving must not silently break dependencies or linked records.

### DEC-282 — Dashboard task card shows overdue and upcoming tasks
**Status:** Approved  
**Decision:** Show overdue tasks and the next few upcoming tasks on the couple-facing wedding overview.

**Consequences:** Exact count and ordering of upcoming tasks remain for detailed design. Selecting a task should open its task detail or planning list.

### DEC-283 — Dashboard budget card shows financial progress
**Status:** Approved  
**Decision:** Summarize total budget, committed costs, amount paid, and upcoming payments on the wedding overview.

**Consequences:** Respect financial permissions and show clear links to the detailed budget. Exact thresholds and visual indicators remain for detailed design.

### DEC-284 — Dashboard guest card shows confirmed count and progress
**Status:** Approved  
**Decision:** Show confirmed headcount and confirmation progress, including adult and child totals.

**Consequences:** Derive counts from the confirmed guest groups and link to the guest list. Do not imply that the app sends invitations or collects guest-submitted RSVPs.

### DEC-285 — Shared default dashboard with personal arrangement
**Status:** Approved  
**Decision:** Both partners start with the same fixed dashboard layout. Each partner may independently rearrange their own view while using the same shared wedding data.

**Consequences:** A partner's layout changes do not alter the other partner's view or wedding data. Define the specific layout controls during detailed design.

### DEC-286 — Wedding date and days remaining on the overview
**Status:** Approved  
**Decision:** Show the wedding date and the number of days remaining on the couple-facing overview.

**Consequences:** Define behavior when the wedding date is unset, in the past, or changes in detailed design.

### DEC-287 — Upcoming milestones with dates and progress
**Status:** Approved  
**Decision:** Show the next few planning milestones with their dates and progress on the overview.

**Consequences:** Exact count and progress calculation remain for detailed design. The card should link to the detailed planning timeline.

### DEC-288 — Surface unresolved decisions on the overview
**Status:** Approved  
**Decision:** Show unresolved decisions that need attention, with links to review them.

**Consequences:** Define how an item is identified as needing attention and how resolved decisions leave the card.

### DEC-289 — Dashboard quick actions
**Status:** Approved  
**Decision:** Provide shortcuts to add a task, guest, vendor, or budget item from the overview.

**Consequences:** Each shortcut must respect workspace permissions and open the relevant creation flow.

### DEC-290 — Role-filtered overview for helpers and coordinators
**Status:** Approved  
**Decision:** Helpers and coordinators see the same wedding overview, filtered to information their role allows them to access.

**Consequences:** Hide restricted card content without leaking its existence or details. This does not grant new permissions.

### DEC-291 — Save inspiration ideas with image, note, and optional source
**Status:** Approved  
**Decision:** Let couples save an inspiration idea with an image, a note, and an optional source link.

**Consequences:** Detailed image limits and source-link preview behavior remain for later design. This behavior decision does not commit the Inspiration module to MVP.

### DEC-292 — Topic-based inspiration boards
**Status:** Approved  
**Decision:** Organize inspiration ideas into topic-based boards, with examples such as Venue, Attire, and Decor.

**Consequences:** Whether couples can create custom boards and how board membership is managed remain open.

### DEC-293 — Place one inspiration idea on multiple boards
**Status:** Approved  
**Decision:** Allow the same inspiration idea to appear on multiple boards without duplicating the idea.

**Consequences:** Editing or removing the idea affects its single underlying record and its appearances across boards.

### DEC-294 — Visual grid with simple sorting for moodboards
**Status:** Approved  
**Decision:** Present moodboards as a visual grid of saved ideas with simple sorting.

**Consequences:** Specific sort options and ordering defaults remain for detailed design; freeform canvas behavior is not included in this decision.

### DEC-295 — Keep inspiration separate from other modules
**Status:** Approved  
**Decision:** Keep inspiration ideas separate from vendors, tasks, and other wedding records; do not link ideas to other modules.

**Consequences:** This preserves Inspiration as a standalone collection. The module remains a candidate and is not thereby committed to MVP.

### DEC-296 — Suggested and custom inspiration boards
**Status:** Approved  
**Decision:** Start with suggested topic boards and let couples create custom boards.

**Consequences:** Custom board management permissions and behavior remain for detailed design.

### DEC-297 — Per-idea privacy in Inspiration
**Status:** Approved  
**Decision:** Share inspiration ideas with the wedding workspace by default, with optional Private visibility for each idea.

**Consequences:** Board membership must not reveal a Private idea to users who cannot view it. Apply current workspace permissions to idea images, notes, and source links.

### DEC-298 — Manual and date-added sorting for inspiration ideas
**Status:** Approved  
**Decision:** Let users arrange ideas manually within a board and provide sorting by date added.

**Consequences:** Exact ordering controls and how manual order interacts with date sorting remain for detailed design.

### DEC-299 — Remove an idea from one board or delete it everywhere
**Status:** Approved  
**Decision:** Removing an idea from a board removes only that board placement. Provide a separate action to delete the idea from every board.

**Consequences:** Confirm global deletion clearly and apply applicable recovery rules if an inspiration trash is later defined.

### DEC-300 — Deleting a board keeps its ideas
**Status:** Approved  
**Decision:** Deleting a board removes the board but keeps its ideas in the main inspiration collection.

**Consequences:** Ideas that appeared on multiple boards remain in the collection and on their other boards. Confirm the effect before deleting a board.

### DEC-301 — Allow text-only inspiration ideas
**Status:** Approved  
**Decision:** Allow couples to save text-only inspiration ideas as well as image-based ideas.

**Consistency with DEC-291:** An inspiration idea may be text-only or include an image. Notes and source links are optional fields; an image is not required.

### DEC-302 — One image per inspiration idea
**Status:** Approved  
**Decision:** Allow no more than one image on an inspiration idea.

**Consequences:** To represent another image, create a separate idea. Image limits and replacement behavior remain for detailed design.

### DEC-303 — Contribution follows Inspiration edit permission
**Status:** Approved  
**Decision:** Any wedding workspace member with permission to edit Inspiration may add ideas to shared boards.

**Consequences:** This does not grant new permission to any role. Private ideas remain subject to their visibility settings under DEC-297.

### DEC-304 — Comments and replies on inspiration ideas
**Status:** Approved  
**Decision:** Allow comments and replies on each inspiration idea.

**Consequences:** Follow the general comment behavior in DEC-241 and access rules for the idea. This does not create cross-module links.

### DEC-305 — Recoverable trash for inspiration ideas
**Status:** Approved  
**Decision:** Keep deleted inspiration ideas in a 30-day trash with restore available.

**Consequences:** Define who may restore or permanently remove ideas in detailed permissions design. Restoring an idea should restore its board placements where possible.

### DEC-306 — Link-only inspiration ideas
**Status:** Approved  
**Decision:** Allow an inspiration idea to consist only of a source link, without text or an image.

**Consistency with DEC-291/301:** Images and notes are optional; an idea can be text-only, image-based, link-only, or combine these fields.

### DEC-307 — Short title for each inspiration idea
**Status:** Approved  
**Decision:** Require a short title for every inspiration idea; the note remains optional.

**Consequences:** Define title length and validation in detailed design.

### DEC-308 — Personal favorites for inspiration ideas
**Status:** Approved  
**Decision:** Let each person favorite ideas for their own view.

**Consequences:** Favorites are personal and do not change the shared idea or other users' favorites.

### DEC-309 — Clickable source URL without preview
**Status:** Approved  
**Decision:** Show source links as clickable URLs only; do not generate a preview.

**Consequences:** The destination remains visible as a link. No automatic page title, image, or summary is displayed.

### DEC-310 — Delete ideas based on Inspiration edit permission
**Status:** Approved  
**Decision:** Members with permission to edit Inspiration may delete an idea, subject to its visibility.

**Consequences:** Private ideas remain protected by their visibility rules. Deleted ideas follow the 30-day recoverable trash decision in DEC-305.

### DEC-311 — Search inspiration across boards
**Status:** Approved  
**Decision:** Search idea titles, notes, and source URLs across boards, and allow filtering by board.

**Consequences:** Search results must respect per-idea visibility. Hide Private ideas completely from users without access.

### DEC-312 — Show inspiration idea creator and date
**Status:** Approved  
**Decision:** Show who added each idea and when it was added.

**Consequences:** Do not expose creator or idea metadata to people who cannot view a Private idea.

### DEC-313 — Hide inaccessible Private ideas completely
**Status:** Approved  
**Decision:** Hide Private ideas entirely from users without access, even when the idea is placed on a shared board.

**Consequences:** Do not show placeholders, counts, or other indicators that reveal the hidden idea's existence.

### DEC-314 — Couples may manage suggested inspiration boards
**Status:** Approved  
**Decision:** Let couples rename, reorder, or hide suggested boards, as well as create custom boards.

**Consequences:** Board-management permissions for other workspace roles remain subject to detailed permission design.

### DEC-315 — No comment notifications for Inspiration
**Status:** Approved  
**Decision:** Do not send notifications for comments or replies on Inspiration ideas, including @mentions.

**Consistency with DEC-247:** This is a module-specific exception. Mentions in comments on other records continue to notify authorized mentioned people under DEC-247, subject to user preferences and delivery rules.

### DEC-316 — Basic Inspiration collection in MVP
**Status:** Approved  
**Decision:** Include a basic Inspiration collection for saving ideas and organizing them in suggested topic boards. Defer advanced extras from the initial MVP.

**Consequences:** The exact boundary between basic and advanced behavior remains open (Q-321). This decision does not make every proposed Inspiration feature part of MVP.

### DEC-317 — Basic contact directory in MVP
**Status:** Approved  
**Decision:** Include manual contact records with Shared/Private visibility and links to wedding records in MVP.

**Consequences:** Additional contact behavior already explored, such as custom types, multiple contact methods, import, and duplicate merging, is not automatically included; detailed MVP boundaries remain to be confirmed.

### DEC-318 — Full defined task planning behavior in MVP
**Status:** Approved  
**Decision:** Include all task behavior defined in the specification, including the editable starter plan, task ownership and collaboration, statuses, dates, reminders, checklists, prerequisites, completion, notifications, and archiving.

**Consequences:** The task experience is in MVP scope; this does not approve unspecified future task features.

### DEC-319 — Full defined guest tracking behavior in MVP
**Status:** Approved  
**Decision:** Include all defined guest-list and attendance behavior, including manual group entries, event scopes, confirmation tracking, adult/child counts, dietary labels, and confirmed headcounts.

**Consistency:** The app does not send invitations or guest RSVP links under DEC-203.

### DEC-320 — Full defined wedding-day schedule in MVP
**Status:** Approved  
**Decision:** Include all defined wedding-day schedule behavior, including live updates and statuses, change notifications, delay suggestions, saved offline access, essential contacts, and printable/PDF details.

**Consequences:** Apply existing schedule permissions and access rules; this scope decision does not extend access to unauthorized users.

### DEC-321 — Suggested boards only in the Inspiration MVP
**Status:** Approved  
**Decision:** Start with suggested topic boards only; custom boards are not included in the initial MVP.

**Consequences:** Custom board creation remains part of the broader proposed Inspiration behavior for a later release.

### DEC-322 — Private inspiration ideas in the MVP
**Status:** Approved  
**Decision:** Include per-idea Private visibility in the Inspiration MVP.

**Consequences:** Keep the access rules in DEC-297 and hide Private ideas from people without access.

### DEC-323 — One board per idea in the Inspiration MVP
**Status:** Approved  
**Decision:** In the MVP, each inspiration idea belongs to one board.

**Consequences:** Multi-board placement remains a later-release feature under the broader behavior approved in DEC-293.

### DEC-324 — Simple title search in the Inspiration MVP
**Status:** Approved  
**Decision:** Include simple title search in the Inspiration MVP.

**Consequences:** Searching notes and source URLs across boards remains outside the initial MVP; see the broader search behavior in DEC-311.

### DEC-325 — Defer personal inspiration favorites
**Status:** Approved  
**Decision:** Do not include personal favorites in the initial MVP.

**Consequences:** Personal favorites remain a later-release feature under DEC-308.

### DEC-326 — Defer Inspiration comments and replies from MVP
**Status:** Approved  
**Decision:** Keep comments and replies on Inspiration ideas out of the initial MVP; focus the basic collection on saving and browsing ideas.

**Consistency with broader design:** Comments and replies remain part of the later proposed Inspiration behavior under DEC-304.

### DEC-327 — Full defined Documents and Notes behavior in MVP
**Status:** Approved  
**Decision:** Include all document and notes behavior defined in the specification in the initial MVP.

**Consequences:** This includes the searchable library, categories, per-document Shared/Private visibility, linked records, replacement behavior, expiry reminders, recoverable trash, and shared notes behavior with its defined organization, links, and edit attribution.

### DEC-328 — Core itemized budget tracking in MVP
**Status:** Approved  
**Decision:** Include itemized costs, quotes, deposits, due dates, and payment tracking in the initial MVP.

**Consequences:** This scope covers the core budget workflow. Other financial reporting or advanced behavior remains subject to its applicable scope decisions.

### DEC-329 — Full defined vendor comparison and decision workflow in MVP
**Status:** Approved  
**Decision:** Include the full vendor comparison and decision workflow described in the specification.

**Consequences:** This includes structured comparisons and the guided vendor decision flow. Planner organization directory and business-only details remain subject to their separate MVP scope.

### DEC-330 — Couple-facing overview dashboard in MVP
**Status:** Approved  
**Decision:** Include the approved combined overview of tasks, budget, guests, decisions, milestones, and wedding countdown in the initial MVP.

**Consequences:** Dashboard cards remain subject to role permissions and approved layout behavior. This does not itself commit every underlying module beyond the scope decisions recorded separately.

### DEC-331 — Planner multi-wedding dashboard in MVP
**Status:** Approved  
**Decision:** Include a planner-facing dashboard for assigned weddings and actions needing attention.

**Consequences:** This commits the dashboard to MVP while retaining the combined portfolio and action-center direction in DEC-038. Detailed layout and action prioritization remain open.

### DEC-332 — Planner team assignment and access in MVP
**Status:** Approved  
**Decision:** Include assigning organization staff to weddings and setting their access.

**Consequences:** Couple visibility, notifications, and the ability to restrict particular staff members continue to apply. Advanced team administration and workload features remain undecided.

### DEC-333 — Private planner business notes in MVP
**Status:** Approved  
**Decision:** Include basic private client and business notes for planners, separate from the couple's shared wedding workspace.

**Consequences:** Private planner notes are not shared with couples unless explicitly added to the shared workspace. The exact record types and management workflow remain open.

### DEC-334 — Reusable organization-wide vendor directory in MVP
**Status:** Approved  
**Decision:** Include an organization-wide vendor directory reusable across weddings alongside wedding-specific vendor records.

**Consequences:** This extends the vendor comparison MVP scope in DEC-329 to include the reusable planner directory. Details of synchronization and copying directory records into a wedding remain open.

### DEC-335 — Reusable planner task and timeline templates in MVP
**Status:** Approved  
**Decision:** Include reusable task and timeline templates for planners.

**Consequences:** The template content, creation and sharing controls, and behavior when applying templates to an existing wedding remain open.

### DEC-336 — Planner organization staff management
**Status:** Approved  
**Decision:** Organization managers manage staff; assigned planners can manage access for their own weddings.

**Consequences:** This sets the initial division of responsibility. Detailed manager roles, onboarding, and staff permission defaults remain open.

### DEC-337 — Planner dashboard attention items
**Status:** Approved  
**Decision:** Flag overdue and upcoming tasks, budget payments due, schedule changes, and unresolved decisions.

**Consequences:** This defines the initial attention categories, not their ranking, notification behavior, or exact display rules.

### DEC-338 — Wedding vendor links to organization profiles
**Status:** Approved  
**Decision:** Link each wedding's vendor record to the live organization vendor profile.

**Consequences:** Changes to the organization profile can be reflected in linked wedding records. The handling of historical values and access when the organization relationship ends remains open.

### DEC-339 — Creating reusable planner templates
**Status:** Approved  
**Decision:** Let planners build task and timeline templates from scratch or save selected tasks and timeline items from an existing wedding.

**Consequences:** Template content, access controls, and behavior when applying templates to populated weddings remain open.

### DEC-340 — Private planner business note content
**Status:** Approved  
**Decision:** Support text notes with a title and optional link to a client or wedding.

**Consequences:** Notes remain private to the planner organization unless explicitly shared through the wedding workspace. Attachments and custom categories are outside this decision.

### DEC-341 — Couple access to linked organization vendor profiles
**Status:** Approved  
**Decision:** Couples can view the full organization vendor profile linked to their wedding record. Organization staff alone can edit organization profile details; couples can add wedding-specific notes.

**Consequences:** Wedding-specific notes remain distinct from organization-wide vendor information. Field-level handling beyond this boundary can be refined later.

### DEC-342 — Removing a vendor from the organization directory
**Status:** Approved  
**Decision:** Preserve linked wedding vendor records and their last available vendor details, and remove the live link when a vendor is removed from the organization directory.

**Consequences:** Existing wedding planning information is retained. The archived or unlinked state and restoration behavior remain to be specified.

### DEC-343 — Notifications for organization vendor profile changes
**Status:** Approved  
**Decision:** Notify couples about important changes to a linked organization vendor profile, such as contact or business status changes.

**Consequences:** The exact list of important changes and notification timing remain open.

### DEC-344 — Planner-only notes on organization vendor profiles
**Status:** Approved  
**Decision:** Allow organization vendor profiles to have internal notes visible only to organization staff.

**Consequences:** These notes remain separate from wedding-specific notes and couple-visible information. Note editing and history behavior follow later detail decisions.

### DEC-345 — Planner team responsibility per wedding
**Status:** Approved  
**Decision:** Allow multiple staff to be assigned to a wedding and identify one lead planner.

**Consequences:** All assigned staff remain visible according to the access rules. The lead planner coordinates but has no additional permissions solely from the lead designation (DEC-346).

### DEC-346 — Lead planner responsibilities and permissions
**Status:** Approved  
**Decision:** Give the lead planner coordination responsibility, while basing permissions on their assigned access.

**Consequences:** The lead designation does not grant broader access by itself.

### DEC-347 — Access defaults for assigned planner staff
**Status:** Approved  
**Decision:** Start staff access from role-based permissions; let the assigned planner adjust it within the couple's restrictions.

**Consequences:** Couple restrictions remain authoritative. Exact role presets and permission fields remain open.

### DEC-348 — Default organization vendor profile fields
**Status:** Approved  
**Decision:** Include vendor name, service categories, contact details, website, location, and internal notes by default.

**Consequences:** This is the default profile field set; further custom field behavior follows existing vendor module decisions.

### DEC-349 — Important linked vendor profile changes
**Status:** Approved  
**Decision:** Notify couples about changes to vendor contact details, availability, or business status.

**Consequences:** These are the defined important changes. Notification timing and delivery preferences follow the platform notification rules.

### DEC-350 — Organization vendor archive and internal notes
**Status:** Approved  
**Decision:** When a vendor is removed from the organization directory, archive the organization vendor profile and retain its planner-only notes for organization staff.

**Consequences:** Wedding links are removed as defined in DEC-342. The organization profile and internal notes are retained during the 30-day archive period and are permanently deleted at the end of that period (DEC-355).

### DEC-351 — Staff departure and wedding access
**Status:** Approved  
**Decision:** Revoke a departing or deactivated staff member's wedding access immediately, preserve their activity history, and flag their assignments for reassignment.

**Consequences:** Access removal does not erase their prior actions. Reassignment remains an organization follow-up.

### DEC-352 — Changing the lead planner
**Status:** Approved  
**Decision:** Let organization managers or the current lead planner change the lead planner, and notify the couple.

**Consequences:** The new lead continues to use permissions assigned to their role; the lead designation itself does not add permissions (DEC-346).

### DEC-353 — Applying templates to existing wedding plans
**Status:** Approved  
**Decision:** Preview reusable task and timeline templates and let planners select items to add to an existing wedding plan. Do not replace or remove existing items automatically.

**Consequences:** This protects existing planning work. Duplicate detection and conflict handling remain open.

### DEC-354 — Organization vendor profile visibility
**Status:** Approved  
**Decision:** Allow all organization staff to view organization-wide vendor profiles, with editing limited by role.

**Consequences:** Viewing and editing permissions for vendor records within each wedding follow their separate rules.

### DEC-355 — Permanent deletion of archived organization vendors
**Status:** Approved  
**Decision:** Permanently delete an archived organization vendor profile after 30 days.

**Consequences:** Linked wedding records retain their last available vendor details as defined in DEC-342. Organization profile data and internal notes are permanently deleted after the archive period.

### DEC-356 — Restoring archived organization vendors
**Status:** Approved  
**Decision:** Allow organization managers to restore archived vendor profiles during the 30-day archive period.

**Consequences:** Restoration returns the profile to the organization directory. Restoration behavior for prior wedding links remains governed by DEC-342 and requires further detail.

### DEC-357 — Final notice before vendor profile deletion
**Status:** Approved  
**Decision:** Send organization managers a final notice 7 days before an archived vendor profile is permanently deleted.

**Consequences:** The final notice supplements the archive period. Notice delivery details remain open.

### DEC-358 — Early permanent deletion of archived vendor profiles
**Status:** Approved  
**Decision:** Allow organization managers to permanently delete an archived vendor profile before the 30-day period ends, after confirmation.

**Consequences:** Early deletion permanently removes the organization profile and its internal notes. Wedding records preserve their last available details as specified in DEC-342.

### DEC-359 — Reassignment after planner staff departure
**Status:** Approved  
**Decision:** Organization managers review assignments flagged after a staff member leaves or is deactivated and reassign them.

**Consequences:** This establishes responsibility for resolving flagged assignments; the reassignment interface remains open.

### DEC-360 — Couple notifications for departure-related staff changes
**Status:** Approved  
**Decision:** Keep staff assignment changes caused by a planner's departure or deactivation within the planner organization; do not notify couples about those changes.

**Consequences:** A separately initiated lead planner change still notifies the couple under DEC-352.

### DEC-361 — Restoring vendor profiles and former wedding links
**Status:** Approved  
**Decision:** Restore the organization vendor profile to the directory but require planners to relink any former wedding records.

**Consequences:** Restoring a profile does not automatically reestablish previous wedding links.

### DEC-362 — Replacing a deleted vendor profile link
**Status:** Approved  
**Decision:** Allow an authorized planner to link a preserved wedding vendor record to another organization profile or keep it as a standalone wedding record after the original profile is permanently deleted.

**Consequences:** The wedding record and its last available details remain intact regardless of whether it is relinked.

### DEC-363 — Vendor records when planner organization access ends
**Status:** Approved  
**Decision:** Preserve linked wedding vendor records as standalone records with their last available details and remove organization links when the planner organization's access to a wedding ends.

**Consequences:** The couple's wedding records remain available independently of the planner organization.

### DEC-364 — Custom organization vendor categories
**Status:** Approved  
**Decision:** Allow each planner organization to create custom vendor service categories alongside the platform defaults.

**Consequences:** Custom categories belong to the organization directory; the organization-wide management workflow remains to be specified.

### DEC-365 — Custom organization vendor profile fields
**Status:** Approved  
**Decision:** Let organization managers create custom vendor profile fields shared across their organization's directory.

**Consequences:** Custom field creation is manager-controlled. Field types, validation, and behavior when a field is removed remain open.

### DEC-366 — Removing custom vendor profile fields
**Status:** Approved  
**Decision:** Archive removed custom fields, retain existing values as visible read-only information, and prevent new entries.

**Consequences:** Existing organization vendor data remains available. Archive duration and deletion behavior remain to be specified.

### DEC-367 — Creating custom vendor service categories
**Status:** Approved  
**Decision:** Restrict creation of organization-specific vendor service categories to organization managers.

**Consequences:** Custom categories are available alongside platform defaults.

### DEC-368 — Couple visibility of custom vendor fields
**Status:** Approved  
**Decision:** Show all organization custom vendor profile fields to couples who can view the linked profile.

**Consequences:** This does not expose organization-internal notes, which remain restricted under DEC-344.

### DEC-369 — MVP custom vendor field types
**Status:** Approved  
**Decision:** Support short text, long text, number, date, and single-choice dropdown custom fields.

**Consequences:** Multi-select, file, and formula fields are outside this MVP field-type selection.

### DEC-370 — Editing organization custom field values
**Status:** Approved  
**Decision:** Allow organization staff with vendor-edit permission to edit custom field values; keep field setup manager-only.

**Consequences:** Field setup and vendor record value editing use separate permissions.

### DEC-371 — Removing custom vendor service categories
**Status:** Approved  
**Decision:** Archive a removed custom service category, retain its existing vendor assignments visibly, and prevent new assignments to it.

**Consequences:** Existing vendor records keep their category information; the archived category is unavailable for new use.

### DEC-372 — Restoring removed custom service categories
**Status:** Approved  
**Decision:** Do not allow restoration of a removed custom service category.

**Consequences:** Removal is permanent for category setup, while existing assignments remain visible under DEC-371.

### DEC-373 — Managing custom dropdown options
**Status:** Approved  
**Decision:** Organization managers configure single-choice dropdown options; vendor-edit staff can select from those options when editing vendor values.

**Consequences:** Dropdown configuration remains separate from vendor record editing permissions.

### DEC-374 — Custom fields in vendor comparisons
**Status:** Approved  
**Decision:** Allow authorized users to compare organization custom field values alongside standard vendor details.

**Consequences:** Comparison access follows existing vendor and record permissions.

### DEC-375 — Notifications for important custom field changes
**Status:** Approved  
**Decision:** Notify couples when a visible custom field value changes and the change is important under the existing vendor-change notification rules.

**Consequences:** Do not send a notification for every custom field edit; importance follows the same rules as other linked vendor profile changes (DEC-349).

### DEC-376 — Custom values when an organization vendor is deleted
**Status:** Approved  
**Decision:** Delete custom field values from the organization profile when it is permanently deleted, while preserving last available details, including custom field values, in linked wedding records.

**Consequences:** Organization directory deletion does not erase the couple's wedding record.

### DEC-377 — Removing custom dropdown options
**Status:** Approved  
**Decision:** Keep existing vendor values visible as read-only when a dropdown option is removed; prevent new selection of that option.

**Consequences:** Existing profile data remains understandable without allowing the removed option to be reused.

### DEC-378 — Filtering organization vendors by custom fields
**Status:** Approved  
**Decision:** Allow filtering the organization vendor directory by custom field values.

**Consequences:** Search and filter details for each field type remain to be specified.

### DEC-379 — Renaming organization custom fields
**Status:** Approved  
**Decision:** Apply a custom field's renamed label across the organization directory and preserve its existing values.

**Consequences:** Renaming changes the field label without creating a separate field.

### DEC-380 — Custom values in standalone wedding vendor records
**Status:** Approved  
**Decision:** Preserve the last available organization custom field values when a linked vendor record becomes standalone in a wedding.

**Consequences:** Standalone wedding records retain the custom information even when the organization link ends.

### DEC-381 — Archived custom fields in comparisons and filters
**Status:** Approved  
**Decision:** Keep archived custom fields available for vendor comparisons and filters using their existing read-only values.

**Consequences:** Archived fields do not accept new entries, consistent with DEC-366.

### DEC-382 — Required custom vendor fields
**Status:** Approved  
**Decision:** Keep all organization custom vendor fields optional.

**Consequences:** Vendor profiles can be saved without completing custom fields.

### DEC-383 — Changing the type of a populated custom field
**Status:** Approved  
**Decision:** Do not allow the type of a custom field to change once values exist; create a new field to use a different type.

**Consequences:** Existing vendor values retain their original interpretation and are not automatically converted.

### DEC-384 — Applying custom fields by service category
**Status:** Approved  
**Decision:** Let organization managers choose which service categories use each custom field.

**Consequences:** A field may be limited to relevant vendor categories while remaining part of the organization's shared directory schema.

### DEC-385 — Organization custom field ordering
**Status:** Approved  
**Decision:** Let organization managers set a shared custom field order for the organization directory.

**Consequences:** The configured order applies across organization vendor profiles.

### DEC-386 — Permanently deleting archived custom fields
**Status:** Approved  
**Decision:** Let organization managers permanently delete an archived custom field after confirmation; remove its values from organization vendor profiles while preserving wedding record snapshots.

**Consequences:** Deletion from the directory does not erase values already preserved in wedding records.

### DEC-387 — Restoring archived custom fields
**Status:** Approved  
**Decision:** Let organization managers restore an archived custom field and resume editing its values.

**Consequences:** Restoring the field makes it available again in the organization directory. Its prior values remain.

### DEC-388 — Restoring removed dropdown options
**Status:** Approved  
**Decision:** Let organization managers restore a removed dropdown option; existing values using that option become editable again.

**Consequences:** The option is again available for new selections.

### DEC-389 — Category changes and custom field values
**Status:** Approved  
**Decision:** When a vendor changes service category, delete values for custom fields that no longer apply to the previous category.

**Consequences:** Values for inapplicable category-specific fields are removed from the organization vendor profile.

### DEC-390 — Required fields after vendor category changes
**Status:** Approved  
**Decision:** Do not block a vendor profile from saving when custom fields applicable to its new category are blank; all custom fields remain optional.

**Consequences:** Category changes do not create a required-field gate.

### DEC-391 — Confirming category changes that remove custom values
**Status:** Approved  
**Decision:** Before deleting custom values that no longer apply to a vendor's new category, show the affected fields and values and ask the editor to confirm.

**Consequences:** The editor can review the data loss before applying the category change.

### DEC-392 — Retaining values for fields shared across categories
**Status:** Approved  
**Decision:** Keep custom field values that apply to both the old and new service categories; delete only values for fields that no longer apply.

**Consequences:** Category changes retain still-relevant custom data.

### DEC-393 — Undoing category changes
**Status:** Approved  
**Decision:** Let the editor undo a category change and restore removed custom values before leaving the vendor profile.

**Consequences:** Undo is available within the current vendor profile editing session.

### DEC-394 — Notifications for vendor category changes
**Status:** Approved  
**Decision:** Notify couples about a linked vendor's service category change only when that vendor is their primary selection.

**Consequences:** Category changes for other vendor options remain within the workspace without a couple notification.

### DEC-395 — Vendor category changes in activity history
**Status:** Approved  
**Decision:** Record who changed the vendor's category and when, without retaining deleted custom field values in the activity history.

**Consequences:** The history records the category change event while avoiding retention of removed field values.

### DEC-396 — Custom field value changes in activity history
**Status:** Approved  
**Decision:** Do not log changes to organization custom field values in activity history.

**Consequences:** Category change events remain logged under DEC-395, but individual custom value edits are not.

### DEC-397 — Visibility of vendor-related activity
**Status:** Approved  
**Decision:** Organization staff with access to a vendor can see its activity; couples can see activity for linked wedding vendors they can access.

**Consequences:** Activity visibility follows existing vendor and workspace permissions.

### DEC-398 — Planner-only vendor note edits in activity history
**Status:** Approved  
**Decision:** Do not log edits to planner-only vendor notes.

**Consequences:** Internal note content and note edit events remain outside activity history.

### DEC-399 — Retention of vendor-related activity
**Status:** Approved  
**Decision:** Retain vendor-related activity for the same period as the workspace activity history.

**Consequences:** The exact workspace activity retention period remains to be decided.

### DEC-400 — Custom field definition changes in activity history
**Status:** Approved  
**Decision:** Record custom field definition changes with the manager, action, field name, and time.

**Consequences:** This covers setup changes such as creating, renaming, or archiving a custom field; it does not include custom field values.

### DEC-401 — Workspace activity history retention
**Status:** Approved  
**Decision:** Delete workspace activity history one year after the latest saved wedding date; when no wedding date exists, delete it one year after workspace creation.

**Consequences:** Vendor-related activity follows the same retention period (DEC-399). When the wedding date changes, update the deletion date to one year after the latest saved date (DEC-407).

### DEC-402 — Activity history display and filtering
**Status:** Approved  
**Decision:** Show activity as a chronological list without search or filters.

**Consequences:** Activity areas, actors, and dates appear as part of the chronological event stream.

### DEC-403 — Activity links to related records
**Status:** Approved  
**Decision:** Link activity entries to their related wedding records when the viewer has permission to access those records.

**Consequences:** Links do not grant access to records the viewer otherwise cannot see.

### DEC-404 — Activity history export
**Status:** Approved  
**Decision:** Keep activity history viewable in the app only; do not provide activity history export.

**Consequences:** Existing report and document exports remain governed separately.

### DEC-405 — Notifications from activity history
**Status:** Approved  
**Decision:** Do not create notifications from activity history itself; notifications follow the rules for each underlying change.

**Consequences:** Activity visibility and notification delivery remain separate behaviors.

### DEC-406 — Retention without a wedding date
**Status:** Approved  
**Decision:** When a workspace has no wedding date, delete its activity history one year after workspace creation.

**Consequences:** This provides a retention deadline even before the couple sets a wedding date.

### DEC-407 — Retention after a wedding date change
**Status:** Approved  
**Decision:** Base the activity-history deletion date on the latest saved wedding date.

**Consequences:** Changes to the wedding date update the retention deadline.

### DEC-408 — Activity list sort order
**Status:** Approved  
**Decision:** Show the most recent activity entries first.

**Consequences:** This order applies within the chronological activity view.

### DEC-409 — Activity history grouped by day
**Status:** Approved  
**Decision:** Group the activity history by day, with the most recent day first.

**Consequences:** Activity events remain chronological within each day, with the newest entries first.

### DEC-410 — Activity timestamp timezone
**Status:** Approved  
**Decision:** Display activity timestamps in the viewer's local time and identify the timezone.

**Consequences:** Viewers can distinguish local display time from the time recorded by another collaborator.

### DEC-411 — MVP non-couple permission presets
**Status:** Approved  
**Decision:** Include planner, coordinator, and helper permission presets in the MVP. Vendor profiles are data records managed by couples and planners; vendors are not workspace members.

**Consequences:** Vendor accounts and vendor sign-in are not part of the MVP or planned as a later product capability (DEC-416).

### DEC-412 — Coordinator default access
**Status:** Approved  
**Decision:** By default, coordinators can access the wedding-day schedule, essential contacts, and tasks assigned to them.

**Consequences:** Broader access must be explicitly granted within couple-set restrictions.

### DEC-413 — Helper default access
**Status:** Approved  
**Decision:** By default, helpers can access tasks assigned to them and records explicitly shared with them.

**Consequences:** Helpers do not receive workspace-wide access by default.

### DEC-414 — Vendor participation in the workspace
**Status:** Approved  
**Decision:** Vendors do not sign in to or hold accounts on the platform. Couples and planners create and manage vendor information.

**Consequences:** Vendor profiles are workspace records, not vendor-owned user accounts.

### DEC-415 — Adjusting coordinator and helper access
**Status:** Approved  
**Decision:** Either partner and the assigned lead planner may adjust coordinator/helper access; the lead planner must stay within the couple's restrictions.

**Consequences:** This extends the lead planner's operational access-management responsibility without granting broader permissions solely from the lead designation.

### DEC-416 — Permanent vendor account policy
**Status:** Approved  
**Decision:** Vendors will never have platform user accounts or sign-in access. Vendor information is created and managed by couples and planners within the wedding workspace.

**Consequences:** Vendor accounts, vendor login flows, and vendor-owned workspace membership are not planned for future releases.

### DEC-417 — Coordinator and helper invitation methods
**Status:** Approved  
**Decision:** Invite coordinators and helpers by email invitation or secure, expiring link/code.

**Consequences:** Invitation security and link behavior remain subject to detailed design.

### DEC-418 — Who can invite coordinators and helpers
**Status:** Approved  
**Decision:** Either partner or the assigned lead planner may invite a coordinator or helper; the lead planner must stay within the couple's restrictions.

**Consequences:** Invitation rights follow the same couple-defined access boundaries as other lead planner actions.

### DEC-419 — Access begins after invitation acceptance
**Status:** Approved  
**Decision:** Give an invitee workspace access only after they accept the invitation and sign in or create an account.

**Consequences:** Sending an invitation alone does not grant access.

### DEC-420 — Coordinator and helper invitation expiration
**Status:** Approved  
**Decision:** Invitations remain valid for seven days and may be resent or revoked.

**Consequences:** Expired invitations do not grant access; the inviter can send another invitation.

### DEC-421 — Revoking pending coordinator/helper invitations
**Status:** Approved  
**Decision:** Either partner or the assigned lead planner may revoke a pending coordinator/helper invitation; the lead planner must act within the couple's restrictions.

**Consequences:** Revocation prevents the pending invitation from being accepted.

### DEC-422 — Protecting coordinator/helper invitation links
**Status:** Approved  
**Decision:** Make each secure invitation link/code single-use and bind it to the intended invitee.

**Consequences:** Forwarding a link/code does not allow another person to accept it.

### DEC-423 — Verifying invitation email identity
**Status:** Approved  
**Decision:** Require invitees to verify the email address to which the invitation was sent, even when their account uses a different email address.

**Consequences:** Account access follows successful verification of the intended invitation recipient.

### DEC-424 — Invitation access preview
**Status:** Approved  
**Decision:** Before acceptance, show the invitee the wedding workspace name, inviter, role, and access they will receive.

**Consequences:** Invitees can review the scope before granting the workspace access to their account.

### DEC-425 — Declined invitation notifications
**Status:** Approved  
**Decision:** When an invitee declines, notify the inviter and both partners.

**Consequences:** The planner team may review staffing needs without exposing vendor accounts or workflows.

### DEC-426 — Visibility of pending coordinator/helper invitations
**Status:** Approved  
**Decision:** Let both partners and the assigned lead planner view pending invitations, including invitee, role, inviter, and expiry.

**Consequences:** Invitation status is transparent to workspace decision-makers, subject to the lead planner's couple-defined restrictions.

### DEC-427 — Coordinator/helper access requests
**Status:** Approved  
**Decision:** Do not provide a workflow for coordinators or helpers to request permissions beyond their role; only workspace decision-makers can change their access.

**Consequences:** Request submission, approval, denial, re-request, and request-submission notifications do not apply. Either partner and the assigned lead planner may change access within the couple's restrictions as already defined in DEC-415.

### DEC-431 — Default coordinator/helper access expiration
**Status:** Approved  
**Decision:** Set coordinator and helper access to expire seven days after the wedding by default; authorized decision-makers may adjust the expiration.

**Consequences:** Either partner or the assigned lead planner may adjust the date, with the lead planner subject to the couple's restrictions (DEC-008, DEC-415).

### DEC-432 — Reminders before coordinator/helper access expires
**Status:** Approved  
**Decision:** Send reminders seven days and one day before coordinator/helper access expires.

**Consequences:** Reminders provide advance notice of the scheduled access end.

### DEC-433 — Recipients of access-expiry reminders
**Status:** Approved  
**Decision:** Send access-expiry reminders to the coordinator/helper, both partners, and the assigned lead planner.

**Consequences:** If no lead planner is assigned, send reminders to the coordinator/helper and both partners.

### DEC-434 — Tasks when coordinator/helper access expires
**Status:** Approved  
**Decision:** Keep tasks and history when coordinator/helper access expires, and flag assigned tasks for review and reassignment.

**Consequences:** Authorized workspace decision-makers review and resolve the flagged tasks; task records are not deleted or automatically reassigned.

### DEC-435 — Comments and activity after access expiry
**Status:** Approved  
**Decision:** Preserve the expired member's comments and activity history and show that their access has expired.

**Consequences:** Expiry removes current access but does not erase attribution or collaboration history.

### DEC-436 — Restoring expired coordinator/helper access
**Status:** Approved  
**Decision:** Let an authorized decision-maker restore access directly by setting a new expiry date, and notify the person.

**Consequences:** Restoration does not require a new invitation; the new expiration date is required.

### DEC-437 — Default expiry after wedding-date changes
**Status:** Approved  
**Decision:** Move an expiry that still uses the default to seven days after the new wedding date. Keep manually chosen expiry dates fixed.

### DEC-438 — Wedding date changes after manual expiry adjustment
**Status:** Approved  
**Decision:** Preserve the manually chosen expiry date when the wedding date changes.

### DEC-439 — Expiry when no wedding date is set
**Status:** Approved  
**Decision:** Coordinator/helper access has no expiry until a wedding date is added; then use the seven-day-after-wedding default.

### DEC-440 — Time for access-expiry reminders
**Status:** Approved  
**Decision:** Send reminders at 9 a.m. in each recipient's local timezone.

### DEC-441 — Reminders after expiry date changes
**Status:** Approved  
**Decision:** Cancel reminders for the old expiry date and schedule reminders for the new date.

### DEC-442 — Default expiry recalculated into the past
**Status:** Approved  
**Decision:** Expire access immediately if a wedding-date change moves the default expiry into the past.

### DEC-443 — Reminders when expiry is less than seven days away
**Status:** Approved  
**Decision:** Send only reminders whose scheduled time has not passed.

### DEC-444 — Early access revocation and reminders
**Status:** Approved  
**Decision:** Cancel scheduled expiry reminders when access is revoked early.

### DEC-445 — Review of access with no expiry
**Status:** Approved  
**Decision:** Do not schedule a review for explicitly continued access; decision-makers may change access at any time.

### DEC-446 — Notification when active expiry date changes
**Status:** Approved  
**Decision:** Do not notify an active member when their expiry date changes.

### DEC-447 — Customizing coordinator/helper access
**Status:** Approved  
**Decision:** Start from the role preset, then adjust access by area.

### DEC-448 — Review before saving expanded access
**Status:** Approved  
**Decision:** Show a summary of all effective access before saving access beyond the role default.

### DEC-449 — Reviewing member access
**Status:** Approved  
**Decision:** Show each member's role and effective access in the member list, with a link to adjust it.

### DEC-450 — Permission levels by access area
**Status:** Approved  
**Decision:** Provide View and Edit levels; reserve access management for decision-makers.

### DEC-451 — Preset changes with custom access
**Status:** Approved  
**Decision:** Preserve custom access settings when the role preset changes and show a summary of resulting access.

### DEC-452 — Permission areas
**Status:** Approved  
**Decision:** Provide separate permission controls for each main wedding area, including tasks, schedule, guests, contacts, vendors, budget, documents, and notes.

### DEC-453 — Downloads and exports
**Status:** Approved  
**Decision:** Downloads and exports require permission beyond View access.

### DEC-454 — Scope of edit access
**Status:** Approved  
**Decision:** Edit access applies only to records assigned or explicitly shared with the member.

### DEC-455 — Download and export controls
**Status:** Approved  
**Decision:** Use one combined Download/Export permission.

### DEC-456 — Creating records with Edit access
**Status:** Approved  
**Decision:** Edit access includes creating records in that area.

### DEC-457 — Area permissions and explicit record sharing
**Status:** Approved  
**Decision:** Area permission sets the maximum access; record sharing selects which records are in scope.

### DEC-458 — Authority to share individual records
**Status:** Approved  
**Decision:** Either partner or the assigned lead planner may share or unshare records, within couple-defined restrictions.

### DEC-459 — Visibility of record shares
**Status:** Approved  
**Decision:** Show decision-makers which members a record is shared with and their effective access.

### DEC-460 — Removing area View permission
**Status:** Approved  
**Decision:** Warn decision-makers about affected shares; area permission takes priority over a record share.

### DEC-461 — History after unsharing a record
**Status:** Approved  
**Decision:** Remove the member's access but preserve their edits, comments, and activity history on the record.

### DEC-462 — Notifications on record-share changes
**Status:** Approved  
**Decision:** Notify the affected member when record access is granted or removed.

### DEC-463 — Activity history for individual record shares
**Status:** Approved  
**Decision:** Do not log individual record share/unshare changes in workspace activity history.

### DEC-464 — Attribution after record access removal
**Status:** Approved  
**Decision:** Keep the member's name on earlier comments and activity and show that their access was removed.

### DEC-465 — Delivery of record-share notifications
**Status:** Approved  
**Decision:** Follow the affected member's notification preferences and the established timing rules for important changes.

### DEC-466 — Other recipients of record-share notifications
**Status:** Approved  
**Decision:** Also notify the other partner and assigned lead planner.

### DEC-467 — Detail in coordinator/helper invitation preview
**Status:** Approved  
**Decision:** Show role, area permissions, and specifically shared records in the invitation preview.

### DEC-468 — Access changes during pending invitation
**Status:** Approved  
**Decision:** Update the invitation preview and notify the invitee if access changes while the invitation is pending.

### DEC-469 — Acceptance after pending invite access changes
**Status:** Approved  
**Decision:** Require the invitee to accept the latest access details.

### DEC-470 — Invitation expiry after access changes
**Status:** Approved  
**Decision:** Keep the invitation's original seven-day expiry date after access changes.

### DEC-471 — Stale invitation preview during acceptance
**Status:** Approved  
**Decision:** If the invitee opened an earlier preview, require review and acceptance of the latest access details.

### DEC-472 — Effective timing of permission reductions
**Status:** Approved  
**Decision:** Apply permission reductions immediately across the workspace, including open sessions.

### DEC-473 — Notification of active member access changes
**Status:** Approved  
**Decision:** Notify an active member of any effective-access change.

### DEC-474 — Review before permission reduction
**Status:** Approved  
**Decision:** Before saving a permission reduction, show the access being removed and affected records.

### DEC-475 — Assigned tasks after access reduction
**Status:** Approved  
**Decision:** Keep assigned tasks and history and flag tasks for review and reassignment if access reduction removes task access.

### DEC-476 — Member with no area permissions
**Status:** Approved  
**Decision:** Keep the person as a workspace member with no area access if all their area permissions are removed.

### DEC-477 — Wedding decision statuses
**Status:** Approved  
**Decision:** Use Open, Decided, Deferred, and Cancelled statuses.

### DEC-478 — Structured decision options and outcomes
**Status:** Approved  
**Decision:** Let users add selectable options, record the chosen option, and include an optional rationale.

### DEC-479 — Decision due dates and reminders
**Status:** Approved  
**Decision:** Allow an optional due date and optional reminder for each decision.

### DEC-480 — Decision ownership
**Status:** Approved  
**Decision:** Decisions belong to the couple and do not have an individual owner.

### DEC-481 — Links from decisions to wedding records
**Status:** Approved  
**Decision:** Allow decisions to link to relevant wedding records.

### DEC-482 — Decision-tracking MVP scope
**Status:** Approved  
**Decision:** Include a basic decision tracker in the MVP, with statuses, options, due dates, and links.

### DEC-483 — Decisions as a permission area
**Status:** Approved  
**Decision:** Give Decisions its own View/Edit permission area for coordinators and helpers.

### DEC-484 — Comments on decisions
**Status:** Approved  
**Decision:** Support comments and replies on decision records using the shared comments behavior.

### DEC-485 — Decisions needing attention on the dashboard
**Status:** Approved  
**Decision:** Show all Open and Deferred decisions in the dashboard’s needs-attention card.

### DEC-486 — Recipients of decision reminders
**Status:** Approved  
**Decision:** Send optional decision reminders to both partners and the assigned lead planner if that planner has access.

### DEC-487 — Reopening decided decisions
**Status:** Approved  
**Decision:** Allow a Decided decision to be reopened while retaining its previous outcome and history.

### DEC-488 — Follow-up dates for deferred decisions
**Status:** Approved  
**Decision:** Allow an optional follow-up date and reminder for a Deferred decision.

### DEC-489 — Authority to mark a decision Decided
**Status:** Approved  
**Decision:** Any member with Edit access to Decisions may mark a decision as Decided.

### DEC-490 — Deferred follow-up date and original due date
**Status:** Approved  
**Decision:** The follow-up date replaces the original due date.

### DEC-491 — Status after reopening a decision
**Status:** Approved  
**Decision:** Return a reopened decision to Open and retain its previous outcome in history.

### DEC-492 — Decision editing authority
**Status:** Approved  
**Decision:** Any member with Edit access to Decisions may create or edit decision details, including the title, options, and rationale.

### DEC-493 — Open-ended decisions
**Status:** Approved  
**Decision:** Allow decisions without predefined options.

### DEC-494 — Custom decision outcomes
**Status:** Approved  
**Decision:** Allow a custom outcome with an optional explanation when recording a decision.

### DEC-495 — Editing a Decided decision
**Status:** Approved  
**Decision:** Allow edits to options or outcomes while a decision remains Decided; retain the change history.

### DEC-496 — Authority to reopen a decision
**Status:** Approved  
**Decision:** Any member with Edit access to Decisions may reopen a Decided decision.

### DEC-497 — Decision change history details
**Status:** Approved  
**Decision:** Show who changed a decision, when, and the previous and new values.

### DEC-498 — Visibility of decision change history
**Status:** Approved  
**Decision:** Make decision change history visible to all members with View access to that decision.

### DEC-499 — Timing of decision reminders
**Status:** Approved  
**Decision:** Send optional reminders at 9 a.m. in each recipient's local timezone on the chosen reminder date.

### DEC-500 — Reminders after decision resolution
**Status:** Approved  
**Decision:** Cancel reminders when a decision is marked Decided or Cancelled before the reminder is sent.

### DEC-501 — Reminders after decision date changes
**Status:** Approved  
**Decision:** Cancel the old reminder and schedule a new one when the due date or follow-up date changes.

### DEC-502 — Decision list search and filters
**Status:** Approved  
**Decision:** Use a chronological decision list without search or filters.

### DEC-503 — Default decision order
**Status:** Approved  
**Decision:** Show Open and Deferred decisions first, ordered by due date; show Decided and Cancelled decisions below.

### DEC-504 — Decision categories
**Status:** Approved  
**Decision:** Provide suggested categories, such as Venue, Budget, and Attire, and allow custom categories.

### DEC-505 — Category count per decision
**Status:** Approved  
**Decision:** Allow one category per decision.

### DEC-506 — Optional decision categories
**Status:** Approved  
**Decision:** Allow decisions to remain uncategorized.

### DEC-507 — Custom decision category permissions
**Status:** Approved  
**Decision:** Any member with Edit access to Decisions may create and manage custom decision categories.

### DEC-508 — Managing suggested decision categories
**Status:** Approved  
**Decision:** Couples may rename, reorder, or hide suggested decision categories.

### DEC-509 — Removing a decision category
**Status:** Approved  
**Decision:** Keep decisions assigned to a removed category and make them uncategorized.

### DEC-510 — Hiding a suggested decision category
**Status:** Approved  
**Decision:** Preserve existing category assignments; hide the category from new assignments until it is restored.

### DEC-511 — Recovering removed decision categories
**Status:** Approved  
**Decision:** Keep removed custom categories in a 30-day trash with restore available.

### DEC-512 — Restoring decision categories
**Status:** Approved  
**Decision:** Any member with Edit access to Decisions may restore a custom category from trash.

### DEC-513 — Restoring category assignments
**Status:** Approved  
**Decision:** On restore, reinstate previous assignments only for decisions that remain uncategorized.

### DEC-514 — Permanent deletion after category trash period
**Status:** Approved  
**Decision:** Permanently delete a custom category after 30 days and leave its decisions uncategorized.

### DEC-515 — Early permanent deletion of category
**Status:** Approved  
**Decision:** Allow permanent deletion from trash before 30 days after confirmation.

### DEC-516 — Confirmation before moving category to trash
**Status:** Approved  
**Decision:** Show the category name and the number of decisions that will become uncategorized.

### DEC-517 — Decision changes in workspace activity history
**Status:** Approved  
**Decision:** Include decision creation, status, option, and outcome changes in the workspace activity history.

### DEC-518 — Decision category changes in workspace activity history
**Status:** Approved  
**Decision:** Record who changed a decision category and when, including category creation, rename, hide, restore, and deletion.

### DEC-519 — Notifications for decision comments
**Status:** Approved  
**Decision:** Do not notify members about decision comments; @mentions continue to notify mentioned members who can view the decision.

### DEC-520 — Details in decision activity entries
**Status:** Approved  
**Decision:** Show who changed the decision, when, and a short summary.

### DEC-521 — Visibility of decision activity entries
**Status:** Approved  
**Decision:** Only members with View access to the decision may see its activity entries.



### DEC-522 — Milestones and tasks
**Status:** Approved
**Decision:** Track milestones as separate records that can link to related tasks.

### DEC-523 — Milestone progress
**Status:** Approved
**Decision:** Set milestone progress manually; task links are optional.

### DEC-524 — Milestone dates
**Status:** Approved
**Decision:** Each milestone has a planned date. Users may optionally derive or update that date from linked tasks.

### DEC-525 — Stand-alone milestones
**Status:** Approved
**Decision:** A milestone may exist without any linked tasks.

### DEC-526 — Milestone editing permissions
**Status:** Approved
**Decision:** Any member with Edit access to the timeline may create and edit milestones.

### DEC-527 — Suggested starter-plan milestones
**Status:** Approved
**Decision:** Include common suggested milestones in the starter plan; couples can edit or remove them.

### DEC-528 — Milestone dates when the wedding date changes
**Status:** Approved
**Decision:** Preview proposed milestone-date changes and ask before applying them.

### DEC-529 — Milestone progress statuses
**Status:** Approved
**Decision:** Use Not started, In progress, and Complete statuses to show milestone progress.

### DEC-530 — Milestone reminders
**Status:** Approved
**Decision:** Allow an optional reminder for each milestone.

### DEC-531 — Removing milestones
**Status:** Approved
**Decision:** Move milestones that are no longer needed to a 30-day trash with restore available.

### DEC-532 — Milestone comments
**Status:** Approved
**Decision:** Allow shared comments and replies on milestone records.

### DEC-533 — Milestone reminder recipients
**Status:** Approved
**Decision:** Send optional milestone reminders to both partners; include the assigned lead planner if they have access.

### DEC-534 — Milestone reminder time
**Status:** Approved
**Decision:** Send milestone reminders at 9 a.m. in each recipient’s local timezone on the chosen reminder date.

### DEC-535 — Permanent deletion of trashed milestones
**Status:** Approved
**Decision:** Permanently delete milestones automatically when their 30-day trash period ends.

### DEC-536 — Task source for derived milestone dates
**Status:** Approved
**Decision:** When deriving a milestone date from linked tasks, let the user choose one linked task as the date source.

### DEC-537 — Milestone progress and linked tasks
**Status:** Approved
**Decision:** Keep milestone status manually controlled; changes to linked tasks do not automatically update milestone progress.

### DEC-538 — Milestone activity-history events
**Status:** Approved
**Decision:** Include milestone creation, date, status, trash, and restore changes in workspace activity history.

### DEC-539 — Reminder when a milestone is completed
**Status:** Approved
**Decision:** Cancel a pending milestone reminder if the milestone is marked Complete before the reminder is sent.

### DEC-540 — Reminder when milestone dates change
**Status:** Approved
**Decision:** If the milestone date or reminder date changes, cancel the old reminder and schedule a new one.

### DEC-541 — Notifications for milestone comments
**Status:** Approved
**Decision:** Do not send notifications for milestone comments; @mentions still notify the mentioned members.

### DEC-542 — Permission to restore milestones
**Status:** Approved
**Decision:** Any member with Edit access to the timeline may restore a milestone from trash.

### DEC-543 — Reminder when a milestone is trashed
**Status:** Approved
**Decision:** Cancel a pending reminder when its milestone is moved to trash.

### DEC-544 — Restoring a milestone
**Status:** Approved
**Decision:** Restore the milestone’s details, task links, comments, and prior status.

### DEC-545 — Updating a derived milestone date
**Status:** Approved
**Decision:** Automatically update a milestone date to match changes to the due date of its chosen source task.

### DEC-546 — Source task deleted or trashed
**Status:** Approved
**Decision:** Keep the last milestone date and ask the user to choose a new source task or switch to a planned date.

### DEC-547 — Source task unlinked
**Status:** Approved
**Decision:** Keep the last date and switch the milestone to a planned date when its chosen source task is unlinked.

### DEC-548 — Combined timeline view
**Status:** Approved
**Decision:** Show milestones and tasks together in one chronological timeline view, with filters.

### DEC-549 — Completed milestone placement
**Status:** Approved
**Decision:** Keep completed milestones in chronological order and show their Complete status.

### DEC-550 — Main timeline layout
**Status:** Approved
**Decision:** Use a chronological list with dates and progress as the main timeline view.

### DEC-551 — Combined timeline filters
**Status:** Approved
**Decision:** Filter the combined timeline by item type, status, and date range. Task items also support filtering by owner.

### DEC-552 — Milestone date requirement
**Status:** Approved
**Decision:** Require every milestone to have a planned date.

### DEC-553 — Undated task placement
**Status:** Approved
**Decision:** Show undated tasks in a separate Undated section below dated items in the combined timeline.

### DEC-554 — Default timeline date order
**Status:** Approved
**Decision:** Show upcoming items first, with the nearest date first; keep past items accessible below.

### DEC-555 — Completed tasks in the combined timeline
**Status:** Approved
**Decision:** Keep completed tasks in a collapsed Completed section, consistent with the task list.

### DEC-556 — Ordering items on the same date
**Status:** Approved
**Decision:** Let users arrange items manually when multiple timeline items share a date.

### DEC-557 — Shared same-day timeline order
**Status:** Approved
**Decision:** Use one shared manual order for same-day timeline items across the workspace.

### DEC-558 — Permission to change timeline order
**Status:** Approved
**Decision:** Members with Edit access to the timeline may change the manual order.

### DEC-559 — Dragging timeline items
**Status:** Approved
**Decision:** Dragging only reorders items on the same date; it does not change an item’s date.

### DEC-560 — Activity history for timeline reordering
**Status:** Approved
**Decision:** Do not include manual ordering changes in workspace activity history.

### DEC-561 — Notifications for timeline reordering
**Status:** Approved
**Decision:** Do not notify workspace members when item order changes; the shared order is visible in the timeline.

### DEC-562 — Placement of new same-day items
**Status:** Approved
**Decision:** Add a new item at the end of that date’s list.

### DEC-563 — Past timeline items
**Status:** Approved
**Decision:** Show past timeline items in a collapsed Past section below upcoming items.

### DEC-564 — Combining timeline filters
**Status:** Approved
**Decision:** Allow users to apply selected timeline filters together.

### DEC-565 — Timeline search
**Status:** Approved
**Decision:** Search task and milestone titles in the timeline.

### DEC-566 — Recipients for milestone date-change notifications
**Status:** Approved
**Decision:** Notify both partners when a milestone date changes; include the assigned lead planner if they have access.

### DEC-567 — Notifications for task-derived milestone date changes
**Status:** Approved
**Decision:** Treat automatic milestone-date changes caused by a linked task the same as direct milestone-date changes for notification purposes.

### DEC-568 — Notifications for milestone status changes
**Status:** Approved
**Decision:** Do not send notifications for milestone status changes; show these changes in the timeline and activity history.

### DEC-569 — Early permanent deletion of milestones
**Status:** Approved
**Decision:** Members with Edit access to the timeline may permanently delete a trashed milestone before the end of its 30-day trash period, after confirmation.

### DEC-570 — Final notice before milestone deletion
**Status:** Approved
**Decision:** Send decision-makers a final notice 7 days before a trashed milestone is automatically permanently deleted.

### DEC-571 — Effects of permanent milestone deletion
**Status:** Approved
**Decision:** Permanently delete the milestone, its comments, and its task links. Leave linked task records unchanged.

### DEC-572 — Milestone description
**Status:** Approved
**Decision:** Include an optional description on each milestone.

### DEC-573 — Milestone accountability
**Status:** Approved
**Decision:** Milestones belong to the couple and do not have an accountable owner. Tasks can have owners.

### DEC-574 — Milestone planning phases
**Status:** Approved
**Decision:** Organize milestones by suggested planning phases and allow couples to create custom phases.

### DEC-575 — Optional milestone phase
**Status:** Approved
**Decision:** Allow milestones to be unassigned to a planning phase.

### DEC-576 — Permission to manage milestone phases
**Status:** Approved
**Decision:** Any member with Edit access to the timeline may create and manage custom milestone phases.

### DEC-577 — Removing a milestone phase
**Status:** Approved
**Decision:** Keep milestones assigned to a removed phase and make them unassigned to a phase.

### DEC-578 — Managing suggested milestone phases
**Status:** Approved
**Decision:** Members with Edit access to the timeline may rename, reorder, and hide suggested milestone phases.

### DEC-579 — Milestones assigned to a hidden suggested phase
**Status:** Approved
**Decision:** Keep the phase and existing milestone assignments when hidden; do not offer it for new assignments until restored.

### DEC-580 — Recovering removed custom milestone phases
**Status:** Approved
**Decision:** Keep removed custom milestone phases in a 30-day trash with restore available.

### DEC-581 — Permission to restore a custom milestone phase
**Status:** Approved
**Decision:** Any member with Edit access to the timeline may restore a custom phase from trash.

### DEC-582 — Restored custom-phase assignments
**Status:** Approved
**Decision:** When a custom phase is restored, restore its previous assignments only for milestones that are still unassigned.

### DEC-583 — Custom-phase trash expiration
**Status:** Approved
**Decision:** Permanently delete a custom phase automatically when its 30-day trash period ends; leave its milestones unassigned.

## 7. Proposed experience principles — pending validation

1. Elegant and approachable for couples, efficient for professionals.
2. Mobile-first operational access for wedding-day coordination.
3. Clear distinctions between estimates, selected prices, contractual commitments, and paid amounts.
4. Explicit visibility and permissions for private information.
5. Shared, connected data rather than disconnected checklists.
6. Accessible and responsive across screen sizes.

## 8. Open decisions

- **Q-181 (deferred):** If a scheduled report continues using preserved filters after its shared preset is deleted, should the schedule owner be notified?
- Invitation, approval, and ownership-transfer workflows.
- Planner organization and team model.
- Module-by-module MVP scope.
- Guest access and vendor information visibility/privacy boundaries; vendors do not have workspace accounts or sign-in access (DEC-416).
- Pricing and monetization.
- Languages, regions, and localization.
- Website/PWA/native app strategy and technical architecture.
- Product name, branding, and visual design.

## 9. Decision log

| ID | Date | Topic | Outcome | Status |
|---|---|---|---|---|
| DEC-001 | 2026-10-20 | Wedding creation and ownership | Flexible model (Option C) | Approved |
| DEC-002 | 2026-10-20 | Planner-created wedding onboarding | Planner creates and later invites couple (Option A) | Approved |
| DEC-003 | 2026-10-20 | Partner permissions | Both partners have equal control; neither can unilaterally remove the other (Option A) | Approved |
| DEC-004 | 2026-10-20 | Second partner invitation | Email invitation or secure link/code (Option C) | Approved |
| DEC-005 | 2026-10-20 | Professional planner access | Independent planner or planner organization; organization manages its assigned team; couple controls organization access (Option C) | Approved |
| DEC-006 | 2026-10-20 | Planner team management | Organization assigns staff; couple can see, be notified of, and restrict individuals (Option C) | Approved |
| DEC-007 | 2026-10-20 | Coordinator and helper access | Preset roles with customizable permissions (Option C) | Approved |
| DEC-008 | 2026-10-20 | Coordinator/helper access expiration | Suggested expiration, adjustable or revocable by couple (Option C) | Approved |
| DEC-009 | 2026-10-20 | Partner administrative changes | Either partner may make changes independently; notify the other and log activity (Option A), preserving DEC-003 | Approved |
| DEC-010 | 2026-10-20 | Planner removal and shared information | Shared wedding data stays with couple; planner keeps private business records (Option A) | Approved |
| DEC-011 | 2026-10-20 | Voluntary planner departure | Guided handover with immediate exit available (Option C) | Approved |
| DEC-012 | 2026-10-20 | Unclaimed planner-created wedding | Warn, allow grace period, then delete subject to retention obligations (Option C) | Approved |
| DEC-013 | 2026-10-20 | Unclaimed wedding grace period | 90 days from planner departure (Option B) | Approved |

| DEC-014 | 2026-10-20 | Unclaimed wedding deletion reminders | Initial warning, then 30, 7, and 1 day before deletion (Option B) | Approved |

| DEC-015 | 2026-10-20 | Deletion reminder recipients | Only eligible, previously authorized invitation recipients; no unverified disclosure (Option C) | Approved |

| DEC-016 | 2026-10-20 | Claiming an unclaimed wedding | Sign in, verify invited email, and accept existing authorized invitation (Option A) | Approved |

| DEC-017 | 2026-10-20 | Expired invitation during unclaimed-wedding grace period | Secure renewal to original invited email if not revoked, with email verification (Option B) | Approved |

| DEC-018 | 2026-10-20 | Standard invitation validity | Invitations expire 14 days after issuance, with secure renewal where separately authorized (Option B) | Approved |

| DEC-019 | 2026-10-20 | Invitation-expiration reminder | One reminder 3 days before the 14-day expiration, only if invitation remains pending (Option B) | Approved |

| DEC-020 | 2026-10-20 | Invitation reminder delivery | Email only to the pending invitation address (Option A) | Approved |
| DEC-021 | 2026-10-20 | Failed invitation reminder delivery | Record failure and notify invitation sender (Option B) | Approved |
| DEC-022 | 2026-10-20 | Failed reminder sender alert channels | Email and in-app notification, with dashboard delivery status (Option B) | Approved |

| DEC-023 | 2026-10-20 | Temporary invitation-reminder delivery failures | Limited automatic retries; alert sender after final failure; permanent failures alert immediately (Option B) | Approved |

| DEC-024 | 2026-10-20 | Temporary invitation-reminder retry schedule | Three retries after 15 minutes, 1 hour, and 6 hours; stop on success or invalid invitation (Option B) | Approved |
| DEC-025 | 2026-10-20 | Fallback for failed-reminder alerts when original sender loses access | Notify an active authorized wedding administrator; otherwise log securely without disclosure (Option B) | Approved |

| DEC-026 | 2026-10-20 | Multiple eligible fallback alert recipients | Notify all active administrators authorized to manage invitations (Option B) | Approved |

| DEC-027 | 2026-10-20 | Shared invitation-failure notification resolution | Automatically resolve for all administrators when underlying issue is fixed; preserve history, no extra alerts (Option B) | Approved |

| DEC-028 | 2026-10-20 | When a replacement resolves an invitation-delivery failure | Resolve only after confirmed replacement delivery; failed replacements update the same issue (Option B) | Approved |

| DEC-029 | 2026-10-20 | Missing replacement-invitation delivery confirmation | After 24 hours mark delivery unconfirmed, keep shared issue open, and notify authorized administrators (Option B) | Approved |

| DEC-030 | 2026-10-20 | Expiration while invitation delivery is unconfirmed | Keep the shared issue open as Invitation expired — Action required; allow authorized manual replacement, no automatic resend (Option B) | Approved |

| DEC-031 | 2026-10-20 | Notification when unconfirmed invitation expires | Update existing issue and send fresh email and in-app alert to all authorized administrators (Option B) | Approved |

| DEC-032 | 2026-10-20 | Personal dismissal and snoozing of unresolved invitation alerts | Each administrator may dismiss or snooze their own notification; shared issue and others’ alerts remain unaffected (Option B) | Approved |
| DEC-033 | 2026-10-20 | Notification snooze duration choices | 1 hour, tomorrow, next week, or custom future date and time (Option B) | Approved |

| DEC-034 | 2026-10-20 | Calendar-based snooze presets | Tomorrow and next Monday at user-preferred reminder time, default 9:00 AM local (Option C) | Approved |

| DEC-035 | 2026-10-20 | Changing preferred reminder time | Automatically recalculate all active calendar-based snoozes; preserve 1-hour and custom snoozes (Option A) | Approved |

| DEC-036 | 2026-10-20 | Preferred-time change makes snooze overdue | Move affected calendar-based snooze to the following local day at the new preferred reminder time (Option B) | Approved |

| DEC-037 | 2026-10-20 | Couple-facing wedding dashboard structure | Combined overview of countdown, tasks, budget, guests, decisions, and milestones (Option C) | Approved |

| DEC-038 | 2026-10-20 | Professional planner dashboard structure | Combined wedding portfolio and cross-wedding action center (Option C) | Approved |

| DEC-039 | 2026-10-20 | Cross-wedding action-center prioritization | Smart ranking by urgency, deadlines, priority, wedding proximity and blocked decisions; chronological sort and wedding filters (Option C) | Approved |

| DEC-040 | 2026-10-20 | Professional dashboard team workload visibility | Default to personal assigned work, with authorized team, colleague and wedding filters (Option C) | Approved |

| DEC-041 | 2026-10-20 | Assigning and reassigning planner-organization tasks | Permission-based assignment by authorized owners/managers and delegated staff, with notifications and audit history (Option B) | Approved |

| DEC-042 | 2026-10-20 | Acceptance and acknowledgement of colleague task assignments | Assignment takes effect immediately, with optional acknowledgement or problem flag (Option C) | Approved |

| DEC-043 | 2026-10-20 | Handling problems with assigned tasks | Keep assigned and mark Needs review; notify authorized task manager, preserving responsibility until authorized change (Option B) | Approved |

| DEC-044 | 2026-10-20 | Initial reviewer for flagged team tasks | Notify designated eligible wedding lead first; fallback to authorized organization managers (Option B) | Approved |

| DEC-045 | 2026-10-20 | Lead planner designation and replacement | Owners/managers and explicitly delegated employees may appoint eligible wedding-access staff; notify and audit changes (Option B) | Approved |

| DEC-046 | 2026-10-20 | Whether lead planner designation is mandatory | Optional at creation and during planning; encourage appointment, with authorized-manager fallback for flagged tasks (Option B) | Approved |

| DEC-047 | 2026-10-20 | Number of designated lead planners per wedding | At most one designated lead at a time; appointment remains optional, with authorized-manager fallback when absent (Option A) | Approved |

| DEC-048 | 2026-10-20 | Initial lead planner selection during wedding creation | Suggest eligible creator; allow another eligible colleague or no lead; require explicit confirmation and honor designation permissions (Option B) | Approved |

| DEC-049 | 2026-10-20 | Temporary absence of designated lead planner | Lead sets absence period; route new flagged-task reviews to authorized organization managers; retain single lead designation (Option B) | Approved |

| DEC-050 | 2026-10-20 | Scope of lead planner absence coverage | Reroute actionable wedding requests to authorized managers by default, with lead-configurable category exceptions and sender notice (Option C) | Approved |

| DEC-051 | 2026-10-20 | Who manages lead planner absence settings | Lead and authorized organization managers may configure or modify absence and routing exceptions; notify and audit manager changes (Option B) | Approved |

| DEC-052 | 2026-10-20 | Manager override of lead absence routing exceptions | Authorized managers may override with a required reason; notify lead and audit changes (Option B) | Approved |

| DEC-053 | 2026-10-20 | Precedence of lead edits and manager absence-routing override | Active manager override remains effective until authorized manager releases it; lead can edit underlying preferences (Option B) | Approved |

| DEC-054 | 2026-10-20 | Manager override lifetime across lead-planner absences | Override automatically ends with its specific absence; future absences start without inherited overrides (Option A) | Approved |

| DEC-055 | 2026-10-20 | First core wedding-planning module to design in detail | Planning timeline and tasks first; other modules remain proposed and MVP scope is undecided (Option A) | Approved |

| DEC-056 | 2026-10-20 | Starting method for wedding planning timeline | User chooses ready-made template, guided setup, or blank timeline; all remain editable (Option D) | Approved |

| DEC-057 | 2026-10-20 | Ready-made wedding timeline template selection | Multiple-template library with contextual recommendations and preview before explicit application; resulting plan editable (Option C) | Approved |

| DEC-058 | 2026-10-20 | Initial wedding planning template structure | Small core template collection plus combinable optional wedding characteristics, with tailored preview and explicit application (Option C) | Approved |

| DEC-059 | 2026-10-20 | Foundational wedding planning template types | Simple, Standard, and Comprehensive templates organized by planning complexity, independent of wedding size or style (Option B) | Approved |

| DEC-060 | 2026-10-20 | Changing planning complexity after timeline creation | Guided preview of additions, retained items, and potential removals; explicit approval and safeguards for existing work (Option C) | Approved |

| DEC-061 | 2026-10-20 | Selection granularity during guided complexity changes | Individual accept/reject of proposed changes, bulk controls, dependency/conflict safeguards, and final confirmation (Option C) | Approved |

| DEC-062 | 2026-10-20 | Representation of partially applied complexity changes | Show the selected target level with a Customized indicator; use the target level for future recommendations without forcing template conformity (Option B) | Approved |

| DEC-063 | 2026-10-20 | When a timeline displays Customized | Structural changes only; routine progress, assignments, notes, and deadline adjustments do not trigger it (Option B) | Approved |

| DEC-064 | 2026-10-20 | Suggested planning dates and dependencies | Smart wedding-date-aware scheduling suggestions, dependency checks, short-window adaptation, editable dates, and approval safeguards (Option C) | Approved |

| DEC-065 | 2026-10-20 | Rescheduling after a wedding-date change | Guided, individually approvable rescheduling with dependency warnings, protected commitments, explicit confirmation, and audit trail (Option C) | Approved |

| DEC-066 | 2026-10-20 | Review experience for large wedding-date rescheduling proposals | Prioritize conflicts and external commitments, then group routine proposals by phase/category with individual and bulk review, permissions, and final confirmation (Option C) | Approved |

| DEC-067 | 2026-10-20 | Partial rescheduling with unresolved conflicts | Allow safe partial confirmation; track non-blocking conflicts as follow-up issues and block only affected unsafe changes (Option C) | Approved |

| DEC-068 | 2026-10-20 | Ownership of unresolved rescheduling follow-up issues | Automatically assign by existing task/vendor/milestone responsibility, with eligible lead planner or couple fallback and permission safeguards (Option B) | Approved |

| DEC-069 | 2026-10-20 | Reassignment of unresolved scheduling follow-up issues | Permission-based reassignment by authorized managers/coordinators and delegated employees, subject to recipient access, notifications, and audit (Option C) | Approved |

| DEC-070 | 2026-10-20 | Escalation of unresolved scheduling follow-up issues | Risk-based reminders and escalation using urgency, wedding proximity, severity, dependencies, and inactivity; preserve ownership and permissions (Option C) | Approved |

| DEC-071 | 2026-10-20 | Acknowledging and responding to escalated scheduling issues | Acknowledge and choose to retain ownership, reassign, take ownership, or record follow-up; acknowledgement does not resolve issue or silently transfer responsibility (Option C) | Approved |

| DEC-072 | 2026-10-20 | Reminders after escalation acknowledgement | Continue normal risk-based reminder and escalation schedule; acknowledgement does not pause or reset reminders (Option A) | Approved |

| DEC-073 | 2026-10-20 | Default reminder frequency for unresolved scheduling issues | Adaptive risk-based reminder frequency using urgency, deadlines, wedding proximity, severity, dependencies, and inactivity; deduplicate notifications (Option C) | Approved |

| DEC-074 | 2026-10-20 | Notifications during quiet hours | Per-user quiet hours and timezone defer routine reminders, with justified critical-risk bypass and continued escalation tracking (Option C) | Approved |

| DEC-075 | 2026-10-20 | Default quiet hours during onboarding | Suggest 22:00–08:00 local quiet hours; allow accept, customize, or disable; apply provisional default until a choice, with critical bypass preserved (Option C) | Approved |

| DEC-076 | 2026-10-20 | Delivery of deferred reminders after quiet hours | Send important actionable reminders individually and group lower-priority reminders; reevaluate relevance and deduplicate before dispatch (Option C) | Approved |

| DEC-077 | 2026-10-20 | Notification channels and user preferences | Support in-app, email, and available push notifications with user-selected channels by importance, sensible defaults, quiet-hour compliance, critical safeguards, privacy, and delivery auditing (Option C) | Approved |

| DEC-078 | 2026-10-20 | Default notification channels by importance | Routine in-app; important in-app + email; critical in-app + email + push where explicitly permitted; customizable, privacy-safe, quiet-hour-aware (Option C) | Approved |

| DEC-079 | 2026-10-20 | Critical planning-alert external channel opt-out | Users can disable critical email/push with explicit warning acknowledgement; critical issues stay in-app and escalation continues; essential account/security messages remain separate (Option B) | Approved |

| DEC-080 | 2026-10-20 | Critical alerts when external channels are disabled | Persistent in-app critical warning with risk-based escalation to independently authorized recipients using their own channel preferences; never bypass opt-out or permissions (Option C) | Approved |

| DEC-081 | 2026-10-20 | Clearing and downgrading persistent critical warnings | Reflect verified current risk: acknowledgement alone never clears warning; downgrade after substantiated mitigation and clear after resolution/no longer critical, with audit (Option C) | Approved |

| DEC-082 | 2026-10-20 | Authority to verify mitigation and downgrade critical issues | Permission-based verification by eligible issue owners, lead planners, and managers; require supporting information, maintain access boundaries and audit history (Option C) | Approved |

| DEC-083 | 2026-10-20 | Evidence required for downgrading critical issues | Written justification for every downgrade, with additional verified records or documentation for higher-risk issues according to severity and issue type (Option C) | Approved |

| DEC-084 | 2026-10-20 | Invalidated or contradicted mitigation evidence | Reassess current risk automatically; restore Critical only when reliable evidence meets critical criteria, otherwise flag for authorized review with notifications, safeguards, and audit (Option C) | Approved |

| DEC-085 | 2026-10-20 | Reopening previously resolved issues after new evidence | Reopen the original issue for verified invalidation of its resolution; request review for uncertain evidence; create linked new issues for genuinely separate incidents, with current-risk reassessment, permission safeguards, and full history (Option C) | Approved |

| DEC-086 | 2026-10-20 | Duplicate and related issue management | Suggest potential duplicates and related issues; allow permission-controlled merging, linking, and splitting with conflict previews, provenance, privacy, preserved history, and no automatic merges (Option C) | Approved |

| DEC-087 | 2026-10-20 | Ownership when merging duplicate issues | Guided merge preview recommends an eligible owner based on current responsibilities; an authorized user must confirm ownership, preserve other assignments and history, and notify affected parties (Option C) | Approved |

| DEC-088 | 2026-10-20 | Undoing an incorrect issue merge | Guided permission-controlled unmerge allocates post-merge work, preserves provenance and audit history, reassesses ownership and risk, and blocks unsafe or ambiguous reversals (Option C) | Approved |

| DEC-089 | 2026-10-20 | Task progress states for couples and professional planners | One shared task model with simple couple-facing progress and permission-based advanced professional operational states; consistent mapping, access protection, and audit (Option C) | Approved |

| DEC-090 | 2026-10-20 | Canonical task status workflow and waiting reasons | Six shared core statuses (Not Started, In Progress, Waiting, Blocked, Completed, Cancelled), with structured Waiting reasons and simplified couple-facing mappings, validation, permissions, and audit (Option C) | Approved |

| DEC-091 | 2026-10-20 | Task status transitions | Flexible direct transitions with contextual requirements for Waiting, Blocked, Cancelled, Completed and reopening; protect approvals, dependencies, permissions, concurrency, linked commitments, and audit (Option C) | Approved |

| DEC-092 | 2026-10-20 | Task dependencies and completion safeguards | Allow preliminary work before prerequisites finish; prevent final completion only when genuinely necessary, with permission-controlled justified safe exceptions, risk visibility, cycle prevention, and audit (Option C) | Approved |

| DEC-093 | 2026-10-20 | Reassessing dependent tasks after prerequisite changes | Impact-based guided reassessment preserves completed work, flags material downstream effects, suggests corrective actions, permits only safe reversible automatic updates, and protects approvals, commitments, permissions, and audit history (Option C) | Approved |

| DEC-094 | 2026-10-20 | Task start dates, targets, and hard deadlines | Optional planned start, ideal target, and final hard deadline; simple couple and detailed planner views, differentiated reminders and risk, guided rescheduling, protected external commitments, validation and audit (Option C) | Approved |

| DEC-095 | 2026-10-20 | Initial task date generation | Smart template-, wedding-, dependency-, and lead-time-based scheduling suggestions with individual/bulk guided confirmation, protected external hard deadlines, validation, and audit (Option D) | Approved |

| DEC-096 | 2026-10-20 | Short-notice planning | Adaptive, realistic compressed timelines with critical-path prioritization, explicit infeasibility warnings, suggested alternatives, guided approval, protected commitments, and audit (Option C) | Approved |

| DEC-097 | 2026-10-20 | Essential, recommended, and optional task classification | Adaptive importance suggestions based on wedding context and planning time, with authorized user customization, protected binding requirements, separation from urgency/status, and audit (Option C) | Approved |

| DEC-098 | 2026-10-20 | Optional-task simplification and restoration | Guided individual/bulk skipping of safe Optional tasks; use Cancelled with Skipped/not-needed reason, move out of active timeline, preserve discoverability and history, validate dependencies/commitments, and support permission-controlled restoration (Option C) | Approved |

| DEC-099 | 2026-10-20 | Task completion and wedding readiness | Show applicable-task completion excluding skipped/cancelled tasks, plus a distinct explainable readiness assessment based on essential milestones, critical issues, hard deadlines, and dependencies; protect privacy and history (Option C) | Approved |

| DEC-100 | 2026-10-20 | Wedding-readiness presentation | Use On Track, Needs Attention, At Risk, and Critical with explainable prioritized actions; no false-precision readiness percentage, with an insufficient-information state and privacy/accessibility safeguards (Option C) | Approved |

| DEC-101 | 2026-10-20 | Adaptive readiness categories | Show one overall qualitative readiness level plus relevant category-level indicators, explanations and prioritized actions; adapt categories to the wedding, with shared assessments, permission-aware views, and no false precision (Option C) | Approved |

| DEC-102 | 2026-10-20 | Flexible categories with system safeguards | Allow authorized users to create, rename, reorder, and group wedding categories with guided structural-change review, protected obligations/readiness, consistent shared structure, permission controls, and audit (Option C) | Approved |

| DEC-103 | 2026-10-20 | Guided removal of planning categories | Preview affected records and offer archive, reassignment, or justified cancellation of eligible tasks, with protected commitments, active risks, permissions, confirmation, recovery, and audit (Option C) | Approved |

| DEC-104 | 2026-10-20 | Task organization within planning categories | Flexible collapsible task groups with limited nesting, starter groups, shared structure, simplified couple and detailed planner views, accessible reordering, safeguarded moves/removal, and audit (Option C) | Approved |

| DEC-105 | 2026-10-20 | Checklists and structured subtasks | Lightweight checklist items and independently assignable/schedulable structured subtasks; transparent parent progress, explicit parent completion with mandatory safeguards, controlled conversion, shared permissions, and preserved audit (Option C) | Approved |

| DEC-106 | 2026-10-20 | Smart task breakdowns and reusable templates | Optional context-aware checklist/subtask suggestions with guided selection and editing; authorized reusable professional templates, privacy-safe copying, no automatic commitments or instance updates, and audit (Option C) | Approved |

| DEC-107 | 2026-10-20 | Personal and organization professional template libraries | Personal templates plus manager-governed organization templates, controlled publication and employee use, versioning, privacy-safe copying, no automatic changes to existing weddings, and audit (Option C) | Approved |

| DEC-108 | 2026-10-20 | Guided updates to previously applied professional templates | Notify relevant authorized planners of meaningful new versions; compare and selectively apply changes to existing weddings with explicit confirmation, conflict checks, preserved local work/commitments, permissions, and audit; never auto-sync (Option C) | Approved |

| DEC-109 | 2026-10-20 | Risk-based professional-template update notifications | Routine changes in library/digest; targeted relevant important notices; evidence-based critical escalation under existing notification rules; no automatic wedding changes, with privacy, review and audit safeguards (Option C) | Approved |

| DEC-110 | 2026-10-20 | Adaptive regional and cultural wedding templates | Core planning templates plus optional combinable geographic, cultural, religious, and ceremony-specific modules; voluntary preferences, verified-vs-advisory labels, authoritative sourcing, guided change review, privacy, permissions, and audit (Option C) | Approved |

| DEC-111 | 2026-10-20 | Verified regional guidance with confidence indicators | Curated jurisdiction-specific authoritative sources, verification status and review dates, transparent uncertainty, controlled change review, targeted consequential updates, guided task changes, privacy and audit (Option C) | Approved |

| DEC-112 | 2026-10-20 | Structured reporting and correction of regional guidance | In-product evidence-based reporting with tracked status, authorized source verification, interim caution for credible concerns, controlled publication, targeted consequential notices, protected wedding tasks, privacy and audit (Option C) | Approved |

| DEC-113 | 2026-10-20 | Risk-based re-verification of regional guidance | Risk-tiered review schedules, accountable reviewers, prioritized upcoming-wedding impact, overdue confidence withdrawal, authoritative checks, proportional notifications, protected commitments and audit (Option C) | Approved |

| DEC-114 | 2026-10-20 | Unsupported jurisdiction experience | Generic planning only; no platform-generated localized legal tasks or guidance, transparent coverage state, safe template filtering, user-authored task distinction, guided coverage changes and no false readiness (Option A) | Approved |

| DEC-115 | 2026-10-20 | Flexible wedding budget categories with intelligent suggestions | Customizable overall and category allocations, contextual opt-in estimates, separate estimate/quote/commitment/due/paid tracking, overspend visibility, protected contracts, permissions and audit (Option C) | Approved |

| DEC-116 | 2026-10-20 | Full expense lifecycle with flexible payments | Optional estimate/quote/commitment/invoice stages, deposits and installments, scheduled versus actual payments, refunds and corrections, linked documents and suppliers, accurate balances, permissions and audit (Option C) | Approved |

| DEC-117 | 2026-10-20 | Permission-based payment tracking with verification | Recorded/Confirmed/Disputed states; authorized recording and confirmation, optional restricted proof, evidence provenance, separate reported-versus-confirmed totals, dispute/correction workflow and audit; never imply supplier receipt without evidence (Option C) | Approved |

| DEC-118 | 2026-10-20 | Adaptive payment reminders with payment-status awareness | Context-sensitive due/overdue reminders, unpaid versus recorded/unconfirmed versus disputed handling, partial-payment balances, deduplication, authorized escalation, quiet hours, privacy, and auditable status-driven cancellation (Option C) | Approved |

| DEC-119 | 2026-10-20 | Contract-aware installment schedules with guided adjustments | Confirmed fixed/relative/event-triggered supplier terms, separate suggested targets, guided wedding-date impact previews, protected contractual obligations, payment-status preservation, accurate totals, permissions and audit (Option C) | Approved |

| DEC-120 | 2026-10-20 | Flexible contributors and shared wedding expenses | Track expected versus received contributions, direct supplier payments versus funding inflows, split payer responsibilities, partial amounts, reconciliation, funding gaps, restricted access, reminders and audit without double counting (Option C) | Approved |

| DEC-121 | 2026-10-20 | No self-service access for external wedding contributors | Couple and authorized collaborators manage all contributor records; no contributor portal, invitations or automatic messages; preserve privacy, payment verification, internal follow-up and audit (Option A) | Approved |

| DEC-122 | 2026-10-20 | Shared wedding finances with protected private expenses | Equal partner access to shared finances, individually funded private surprises excluded from shared totals, permission-limited professional sharing, protected shared obligations, guided disclosure and privacy-safe audit (Option C) | Approved |

| DEC-123 | 2026-10-20 | Guided budget rebalancing with approval | Detect projected category overruns, prioritize unallocated funds, preview and explicitly approve safe transfers, protect commitments, handle partial/conflicting changes, preserve privacy and audit (Option C) | Approved |

| DEC-124 | 2026-10-20 | Protected contingency reserve with guided use | Optional context-sensitive reserve within total budget, separate from unallocated funds; explicit guided releases, impact previews, protected commitments, funding clarity, privacy and audit (Option C) | Approved |

| DEC-125 | 2026-10-20 | Basic wedding cash-flow forecast | Manually entered available funds and dated expected contributions compared with scheduled supplier payments; chronological projected balances, shortfall visibility, no automatic financial changes, permissions and audit (Option B) | Approved |

| DEC-126 | 2026-10-20 | Two cash-flow forecast views for expected contributions | Conservative received-funds and conditional expected-contributions projections, dated shortfalls, clear uncertainty, no double counting, permissions and audit (Option C) | Approved |

| DEC-127 | 2026-10-20 | Context-aware financial risk warnings | Dashboard warning severity reflects dated funding shortfalls, dependence on unreceived contributions, payment urgency, permissions, and actionable explanations without automatic financial changes (Option C) | Approved |

| DEC-128 | 2026-10-20 | Guided cash-flow shortfall resolution | Optional step-by-step diagnosis, practical action choices, dual-forecast impact previews, separate approval and external-confirmation safeguards; no automatic financial changes (Option C) | Approved |

| DEC-129 | 2026-10-20 | Pending proposed supplier payment date | Keep proposed and contractual due dates distinct; only supplier-confirmed, explicitly approved changes update forecasts/reminders; preserve risks, permissions and history (Option B) | Approved |

| DEC-130 | 2026-10-20 | Manual supplier confirmation for proposed payment-date changes | Authorized user attests supplier agreement and explicitly applies revised date without mandatory note or evidence; preserve contractual caveats, audit and original-date safeguards (Option A) | Approved |

| DEC-131 | 2026-10-20 | Resolve overdue status, preserve historical context | Applied supplier-confirmed extensions update current overdue status, forecasts and reminders while retaining superseded deadlines, prior alerts and audit history (Option C) | Approved |

| DEC-132 | 2026-10-20 | Detailed partial payments with installment allocation | Record multiple partial payments, allocate to installments, calculate outstanding amounts, respect payment verification, prevent duplicates and overpayments, and remind only for balances due (Option C) | Approved |

| DEC-133 | 2026-10-20 | Structured supplier refunds and credits | Track overpayments, refunds due/received and credits applied to installments; reconcile balances and forecasts without double-counting, require confirmation of received refunds, preserve audit history (Option C) | Approved |

| DEC-134 | 2026-10-20 | Basic disputed amount tracking | Track disputed portions, reasons, status and outcomes; distinguish undisputed balances, preserve obligations and payment history, use dispute-aware follow-ups, and apply financial adjustments explicitly with permissions and audit (Option B) | Approved |

| DEC-135 | 2026-10-20 | Optional dispute owner and review date | Allow an optional eligible internal owner and independent optional review date; preserve financial permissions, shared collaboration, obligations and history; review-date reminder behavior remains undecided (Option B) | Approved |

| DEC-136 | 2026-10-20 | One-time dispute review reminder | Notify the eligible owner once at the review date, falling back to authorized financial collaborators if unassigned; keep overdue review visible, respect notification preferences, and continue existing payment and risk alerts (Option B) | Approved |

| DEC-137 | 2026-10-20 | Standard financial summaries and detailed exports | Provide a budget overview and itemized expenses, payments, contributions, refunds, credits and disputes with useful filters; reconcile totals, preserve verification distinctions and privacy, and generate dated exports without automatic sharing (Option B) | Approved |

| DEC-138 | 2026-10-20 | PDF and Excel financial exports | Support PDF and Excel (.xlsx) for standard summaries and detailed financial exports, with matching scope and totals, usable spreadsheet data, readable PDF tables, dated snapshots, permission safeguards and no automatic sharing or import (Option B) | Approved |

| DEC-139 | 2026-10-20 | Personal and organization-shared financial report presets | Save and apply personal or planner-organization shared report filter presets with permission-based management, personal copies, criteria review, access rechecks and no stored report data or access changes (Option C) | Approved |

| DEC-140 | 2026-10-20 | Fixed and common relative date filters in financial report presets | Allow saved presets to use fixed dates or common relative periods, resolve relative dates on application using the wedding time zone where set, preview inclusive dates, and require explicit authorized review for changes (Option B) | Approved |

| DEC-141 | 2026-10-20 | Categories, tags, and search for saved report presets | Organize and search personal and organization-shared presets using categories or tags, with organization-managed shared labels, permission-filtered results, and no access changes from labeling (Option B) | Approved |

| DEC-142 | 2026-10-20 | Scheduled financial report generation with in-app notification | Allow authorized users to schedule weekly or monthly financial report snapshots in PDF or Excel, notify the schedule owner in-app, recheck permissions on every run and access, and support review, pause, update and cancellation without email delivery (Option B) | Approved |

| DEC-143 | 2026-10-20 | 30-day availability for generated report snapshots | Keep scheduled PDF or Excel report snapshots accessible in-app for 30 days, then remove stored content and retain only minimal run metadata; recheck access and allow a new run when authorized (Option A) | Approved |

| DEC-144 | 2026-10-20 | Up to three automatic retries for temporary report-generation failures | Retry temporary scheduled report-generation failures up to three times, avoid duplicate runs and snapshots, notify the owner after success or exhausted retries, and skip futile retries for failures needing user action (Option C) | Approved |

| DEC-145 | 2026-10-20 | Pause after three consecutive failed scheduled runs | Automatically pause after three consecutive scheduled occurrences fail after retries, notify the owner, reset the count on success or resumption, and preserve the schedule and eligible unexpired reports (Option B) | Approved |

| DEC-146 | 2026-10-20 | Review and manual resumption of a paused report schedule | Require an authorized user to review failure details and current schedule settings, resolve invalid criteria, and explicitly resume; reset the failure count and show the next run without generating a report on resumption (Option B) | Approved |

| DEC-147 | 2026-10-20 | Optional catch-up report for the most recent missed period | On resumption, offer the owner one confirmed catch-up report for the latest missed occurrence using its original period; allow skipping, avoid backlogs, and continue with the next planned run (Option B) | Approved |

| DEC-148 | 2026-10-20 | Pause and administrator review when a schedule owner loses access | Pause schedules when required access is lost, notify an eligible administrator without report contents, and require reviewed, authorized reassignment or cancellation; recheck access to all snapshots (Option B) | Approved |

| DEC-149 | 2026-10-20 | Notify the owner and selected authorized collaborators when reports are ready | Send protected in-app ready notices to the owner and selected eligible collaborators, recheck access at notice and report open, and grant no permissions through notification selection (Option B) | Approved |

| DEC-150 | 2026-10-20 | View-only schedule access for selected report recipients | Let selected authorized recipients view schedule status, run history, and permitted reports without editing schedule settings; recheck membership, recipient status, and financial access (Option B) | Approved |

| DEC-151 | 2026-10-20 | Immediate revocation of past snapshot access when a recipient is removed | Immediately revoke access to schedule history and stored in-app snapshots when a recipient is removed; retain access for other eligible recipients and do not affect external downloads (Option A) | Approved |

| DEC-152 | 2026-10-20 | Weekly and monthly schedules only | Limit recurring financial report schedules to weekly and monthly frequencies; do not offer daily, quarterly, annual, or custom recurrence (Option A) | Approved |

| DEC-153 | 2026-10-20 | Owner-selected schedule day and local run time | Let owners choose a weekday and local time for weekly runs or day 1–31 and local time for monthly runs; use the month's last day if needed and show the time-zone basis (Option B) | Approved |

| DEC-154 | 2026-10-20 | Pause for owner review after a wedding time-zone change | Pause scheduled reports when the configured wedding time zone changes and require explicit owner review and confirmation of proposed run times before resuming (Option C) | Approved |

| DEC-155 | 2026-10-20 | Pause for owner review after a fallback account time-zone change | Pause schedules relying on the owner's account time zone when it changes; require explicit owner review and confirmation before running under the new timing (Option C) | Approved |

| DEC-156 | 2026-10-20 | Manual report runs do not change the recurring schedule | Treat manual runs as distinct from scheduled occurrences; leave the next planned run unchanged and do not affect the scheduled failure count or pause state (Option A) | Approved |

| DEC-157 | 2026-10-20 | Notify only the initiator when a manual report is ready | Send protected in-app ready and failure notices only to the person who initiated a manual report run, while retaining separate view access for selected authorized recipients (Option A) | Approved |

| DEC-158 | 2026-10-20 | Notify only the confirming owner when a catch-up report is ready | Send a protected in-app ready notice only to the authorized owner who confirmed a catch-up run; keep report access governed separately by permissions (Option A) | Approved |

| DEC-159 | 2026-10-20 | Selected recipients may view catch-up reports without a notice | Permit selected recipients with current full-scope permissions to view catch-up snapshots through schedule history even though ready notices go only to the confirming owner (Option A) | Approved |

| DEC-160 | 2026-10-20 | Choose PDF or Excel for each catch-up report | Let the owner select PDF or Excel for each catch-up snapshot without changing the schedule's saved format, while preserving established report, access, and expiry rules (Option B) | Approved |

| DEC-161 | 2026-10-20 | Choose PDF or Excel for each manual report run | Let the authorized initiator select PDF or Excel for each manual snapshot without changing the recurring schedule format or later scheduled reports (Option B) | Approved |

| DEC-162 | 2026-10-20 | One-time filter changes for a manual report run | Allow authorized owners to adjust supported filters for one manual snapshot after scope review, without changing the schedule or saved presets; preserve permission and privacy checks (Option B) | Approved |

| DEC-163 | 2026-10-20 | Optionally save adjusted manual-run filters as a new personal preset | Let users explicitly create a new personal preset from adjusted manual-run criteria without changing or sharing existing presets or schedule settings (Option B) | Approved |

| DEC-164 | 2026-10-20 | Editable suggested names for new personal presets | Suggest a concise editable name based on report type and filter context when saving a new personal preset; require explicit user confirmation and avoid report contents or amounts (Option B) | Approved |

| DEC-165 | 2026-10-20 | Unique names within a personal preset library | Require case- and whitespace-insensitive unique names for personal presets; block conflicts without overwriting existing presets; organization-shared naming remains undecided (Option A) | Approved |

| DEC-166 | 2026-10-20 | Unique names across an organization's shared presets | Require unique case- and whitespace-insensitive names across active shared presets within each organization; personal and other organizations' names are separate (Option A) | Approved |

| DEC-167 | 2026-10-20 | Immediate publication by staff with shared-preset permission | Allow staff with explicit permission to publish newly created organization presets immediately after review; no separate manager approval, with access controls and audit (Option A) | Approved |

| DEC-168 | 2026-10-20 | Immediate publication of shared-preset edits by authorized staff | Let staff with explicit edit permission publish shared-preset edits immediately, with version history and no changes to existing schedules or reports (Option A) | Approved |

| DEC-169 | 2026-10-20 | No proactive notices for shared-preset edits | Do not notify users when an organization-shared preset is edited; provide authorized users with version history and a current-criteria review before applying it (Option A) | Approved |

| DEC-170 | 2026-10-20 | Restore shared-preset versions with edit permission | Let staff with edit permission restore a prior version as a new reviewed and audited version, preserving history and leaving existing schedules and reports unchanged (Option A) | Approved |

| DEC-171 | 2026-10-20 | Editors may archive; managers may permanently delete shared presets | Let editors with edit permission archive shared presets, preserving their version history; reserve confirmed permanent deletion for organization managers and retain a minimal audit event (Option B) | Approved |

| DEC-172 | 2026-10-20 | Restore archived shared presets with edit permission | Let staff with edit permission restore an archived preset after review, preserve its history, enforce current unique naming, and leave existing schedules and reports unchanged (Option A) | Approved |

| DEC-173 | 2026-10-20 | Archived shared presets visible only to managers and editors | Restrict the separate archived-preset view to organization managers and staff with shared-preset edit permission; hide archived metadata from other organization users (Option A) | Approved |

| DEC-174 | 2026-10-20 | Manager-confirmed deletion without a waiting period | Allow managers to permanently delete an active or archived shared preset after explicit confirmation, with no waiting period; retain only the minimal audit event under DEC-171 (Option A) | Approved |

| DEC-175 | 2026-10-20 | Retain shared-preset version history for the preset's lifetime | Retain all versions while active or archived; remove definitions and version contents upon confirmed permanent deletion, preserving only the minimal deletion audit event (Option C) | Approved |

| DEC-176 | 2026-10-20 | Manager reminder after one year in archive | Original one-year review reminder decision; superseded by DEC-178, which adds automatic deletion after a seven-day final notice | Superseded by DEC-178 |

| DEC-177 | 2026-10-20 | Annual repeat of archived-preset review reminders | Original annual reminder decision; superseded by DEC-178, which replaces repeats with one final notice and automatic deletion after seven days | Superseded by DEC-178 |

| DEC-178 | 2026-10-20 | Final notice and automatic deletion after seven days | Send one final in-app notice to current managers after one year archived; automatically permanently delete seven days later if the preset remains archived; restoration cancels deletion (Amends DEC-176 and DEC-177) | Approved |
| DEC-179 | 2026-10-20 | Restart archive timer after restoration | If a preset is restored and later archived again, start a fresh one-year period from the new archive date before sending the final notice and beginning the seven-day deletion period (Option A) | Approved |
| DEC-180 | 2026-10-20 | Continue scheduled reports after shared-preset deletion | Preserve each affected schedule’s current filter definition as an independent snapshot and continue on its existing cadence, subject to current permissions and schedule rules (Option A) | Approved |

| DEC-182 | 2026-10-20 | Different vendor-entry models for couples and professionals | Couples use manual vendor records; planners and planning organizations use an in-app vendor directory (user direction) | Approved |

| DEC-183 | 2026-10-20 | Organization-owned vendor directory | Each planner organization maintains a private vendor library reusable across its weddings; no platform-wide catalog (Option A) | Approved |

| DEC-184 | 2026-10-20 | Selectively share organization vendor details with a wedding | Planners select client-visible details; organization-only notes stay private; directory changes require review before sharing (Option A) | Approved |

| DEC-185 | 2026-10-20 | Structured side-by-side vendor comparison | Compare relevant standard details with optional custom criteria; no automatic winner (Option A) | Approved |

| DEC-186 | 2026-10-20 | Guided standard vendor decision and booking stages | Considering, Contacted, Quote received, Shortlisted, Selected, Booked, and Not proceeding; users may skip stages (Option A) | Approved |

| DEC-187 | 2026-10-20 | One primary vendor with additional selections allowed | One primary per service category, with additional selected vendors for distinct needs or scopes (Option A) | Approved |

| DEC-188 | 2026-10-20 | Link vendor records to wedding contact records | Link vendors to one or more contacts with separate wedding visibility and organization privacy controls (Option A) | Approved |

| DEC-189 | 2026-10-20 | Link vendor records to documents, finances, and tasks | Keep related items in their own modules and link them to vendors without duplicating data (Option A) | Approved |

| DEC-190 | 2026-10-20 | Customizable starter vendor service categories | Provide a starter set that authorized users can add to, rename, reorder, or hide (Option A) | Approved |

| DEC-191 | 2026-10-20 | Category-aware vendor fields | Use common and category-specific fields with optional custom fields (Option A) | Approved |

| DEC-192 | 2026-10-20 | Review possible vendor duplicates | Suggest likely matches for user review; allow explicit linking or merging and never merge automatically (Option A) | Approved |

| DEC-193 | 2026-10-20 | Editable date-based wedding planning starter plan | Generate an editable starter plan with common wedding tasks and milestones based on the wedding date (Option A) | Approved |

| DEC-194 | 2026-10-20 | One accountable owner with optional task collaborators | Allow one task owner, optional collaborators, or an unassigned state (Option A) | Approved |

| DEC-195 | 2026-10-20 | Optional task dependencies | Allow non-blocking prerequisite links that surface blockers without preventing work or completion (Option A) | Approved |

| DEC-196 | 2026-10-20 | Digital and manually recorded guest RSVPs | Original decision included app RSVP links and manual responses; superseded by couple-managed confirmation tracking without app-sent invites or guest RSVP links (DEC-203) | Superseded by DEC-203 |

| DEC-197 | 2026-10-20 | Itemized wedding budget with simple summaries | Track category budgets and itemized quotes, costs, deposits, due dates, and payments with clear summaries (Option A) | Approved |

| DEC-198 | 2026-10-20 | Household grouping with individual guest records | Original individual-first household model; superseded by named group entries with adult and child counts (DEC-204) | Superseded by DEC-204 |

| DEC-199 | 2026-10-20 | Event-specific guest invitations | Event scopes remain, but invitation-sending framing is superseded by couple-managed event categories (DEC-205) | Superseded by DEC-205 |

| DEC-200 | 2026-10-20 | Invitation-specific plus-one limits | Superseded by recording adult and child counts on named guest entries without invitation controls (DEC-204) | Superseded by DEC-204 |

| DEC-201 | 2026-10-20 | Per-person RSVP records with household submission | Superseded by a couple-managed confirmation checkbox for each guest entry or group (DEC-203/204) | Superseded by DEC-203/204 |

| DEC-202 | 2026-10-20 | Per-guest dietary and allergy information | Superseded by optional default or custom dietary labels applied to guest entries (DEC-206) | Superseded by DEC-206 |

| DEC-203 | 2026-10-20 | Couple-managed guest list with manual confirmation | Couples manually maintain guest entries and confirmation checkboxes; the app does not send invitations or RSVP links (user direction) | Approved |

| DEC-204 | 2026-10-20 | Named guest entries with adult and child counts | Show each guest party/group by display name with adult and child counts; checkbox applies to the entry as a whole pending Q-208 (user direction) | Approved |

| DEC-205 | 2026-10-20 | Event-scope categories and readable combinations | Track full event, reception, dinner, dance party, or combinations; show partial combinations in one ordered label, e.g. “Reception + Dinner” (user direction) | Approved |

| DEC-206 | 2026-10-20 | Optional dietary labels from defaults or custom labels | Allow optional default labels such as Vegan or Vegetarian and couple-created custom labels (user direction) | Approved |

| DEC-207 | 2026-10-20 | Confirmed headcount at the top of the guest list | Sum adult and child counts for confirmed entries and show total with adult/child subtotals (user direction) | Approved |

| DEC-208 | 2026-10-21 | Group-level confirmation with adjustable attending counts | One checkbox confirms the guest group; adult and child counts can be adjusted to actual attendance and feed the confirmed headcount (user direction) | Approved |

| DEC-209 | 2026-10-21 | Replace guest-group counts with confirmed attendance | Keep one adult and child count per group; update them in place at confirmation and do not retain a separate original headcount (user direction) | Approved |

| DEC-210 | 2026-10-21 | Master chronological wedding-day schedule with event filters | Use one chronological run sheet with sections or filters for event segments (Option A) | Approved |

| DEC-211 | 2026-10-21 | Start and end times with a visible TBD state | Allow start and end times to remain TBD until known; do not require fixed times to add an item (Option A) | Approved |

| DEC-212 | 2026-10-21 | Manual live status for schedule items | Allow authorized users to mark items Planned, In progress, Complete, or Delayed (Option A) | Approved |

| DEC-213 | 2026-10-21 | Couple, lead planner, and assigned coordinator schedule updates | These roles may update the schedule according to existing permissions; others follow workspace access (Option A) | Approved |

| DEC-214 | 2026-10-21 | Offline read-only and printable schedule access | Provide a saved offline read-only schedule and a printable/PDF version (Option A) | Approved |

| DEC-215 | 2026-10-21 | Notify on material schedule changes | Alert on time, location, or responsibility changes; do not alert for routine notes or status updates (Option A) | Approved |

| DEC-216 | 2026-10-21 | Notify people assigned to affected schedule items | Send change alerts to people assigned to the affected items, not all schedule viewers by default (Option A) | Approved |

| DEC-217 | 2026-10-21 | Review proposed timing adjustments after a delay | Suggest changes to affected later items for authorized review; do not shift automatically (Option A) | Approved |

| DEC-218 | 2026-10-21 | Keep the schedule editable during the wedding | Authorized roles may edit before and during the event; no automatic cutoff or event-start lock (Option A) | Approved |

| DEC-219 | 2026-10-21 | Show the latest schedule without schedule-specific edit history | Show current details only; do not provide prior schedule versions or a persistent edit timeline (Option A) | Approved |

| DEC-220 | 2026-10-21 | Refresh saved offline schedules whenever online | Update an explicitly saved read-only schedule copy whenever a newer schedule is available online; show last sync time (Option A) | Approved |

| DEC-221 | 2026-10-21 | Show offline-copy sync time and staleness warning | Show last sync time and warn that an offline copy may be outdated while disconnected (Option A) | Approved |

| DEC-222 | 2026-10-21 | Explicitly save schedules for offline use | Let coordinators opt in per schedule with a Save offline action; do not save every accessible schedule automatically (Option A) | Approved |

| DEC-223 | 2026-10-21 | Offline schedule includes run sheet and essential contacts | Make timeline, locations, responsibilities, statuses, and essential day-of contacts available offline (Option A) | Approved |

| DEC-224 | 2026-10-21 | Printable/PDF run sheet includes operational details and essential contacts | Include timeline, locations, responsibilities, statuses, and essential day-of contacts in the printable/PDF (Option A) | Approved |

| DEC-225 | 2026-10-21 | Offline schedule after access revocation | Revoke online access immediately and remove the saved local copy when the device next reconnects (Option A) | Approved |

| DEC-226 | 2026-10-21 | Searchable document library and linked records | Use categories and search; link documents to related vendors, finances, tasks, and workspace records without duplicating them (Option A) | Approved |

| DEC-227 | 2026-10-21 | Per-document visibility | Let the uploader choose Shared or Private visibility for each document, subject to workspace permissions (Option B) | Approved |

| DEC-228 | 2026-10-21 | Document replacement behavior | Replace the old file without retaining prior file content as a version (user selection) | Approved |

| DEC-229 | 2026-10-21 | Workspace notes visibility | Share all workspace notes with the wedding workspace (user selection) | Approved |

| DEC-230 | 2026-10-21 | Default document categories | Provide Contracts, Quotes/Invoices, Receipts, and Other Documents | Approved |

| DEC-231 | 2026-10-21 | Multiple document categories | Allow one document to belong to multiple categories without duplicating the file | Approved |

| DEC-232 | 2026-10-21 | Document library search scope | Search titles, categories, linked records, and notes/descriptions | Approved |

| DEC-233 | 2026-10-21 | Custom document categories | Keep defaults and allow couples to create custom categories | Approved |

| DEC-234 | 2026-10-21 | Document expiry and renewal reminders | Allow an optional expiry/renewal date and reminder on documents | Approved |

| DEC-235 | 2026-10-21 | Expiry details on document replacement | Carry expiry/renewal dates and reminders forward, then prompt the user to review and confirm | Approved |

| DEC-236 | 2026-10-21 | Document deletion and recovery | Keep deleted documents in a recoverable 30-day trash | Approved |

| DEC-237 | 2026-10-21 | Notes organization | Use a searchable notes list with optional categories or tags | Approved |

| DEC-238 | 2026-10-21 | Notes linked to workspace records | Allow notes to link to vendors, tasks, documents, and other relevant records | Approved |

| DEC-239 | 2026-10-21 | Note edit attribution without version history | Show latest editor and time; do not retain prior note versions | Approved |

| DEC-240 | 2026-10-21 | Shared note editing tools | Support headings, bullets, and checklists | Approved |

| DEC-241 | 2026-10-21 | Record-level discussion | Attach comments and replies to individual workspace records | Approved |

| DEC-242 | 2026-10-21 | Workspace activity history | Show key changes with actor and time | Approved |

| DEC-243 | 2026-10-21 | Notification delivery channels | Provide in-app notifications with optional email or push delivery | Approved |

| DEC-244 | 2026-10-21 | Notification preferences | Let users select notification areas such as tasks, guests, and schedule changes | Approved |

| DEC-245 | 2026-10-21 | Workspace activity history scope | Include access, task, schedule, guest, budget, and document changes with actor and time | Approved |

| DEC-246 | 2026-10-21 | Editing and deleting comments | Users may edit or delete their own comments; show edits and preserve replies and activity history | Approved |

| DEC-247 | 2026-10-21 | Comment mentions | Support @mentions and notify only people authorized to view the linked record | Approved |

| DEC-248 | 2026-10-21 | Notification timing | Deliver important changes immediately and offer a digest for routine notifications | Approved |

| DEC-249 | 2026-10-21 | In-app notification inbox controls | Track unread state and allow marking individual or all notifications as read | Approved |

| DEC-250 | 2026-10-21 | Default contact fields | Include name, role/company, phone, email, address, and notes | Approved |

| DEC-251 | 2026-10-21 | Suggested contact types | Suggest vendor, venue, planner, guest, helper, and emergency contact | Approved |

| DEC-252 | 2026-10-21 | Contact links to workspace records | Allow contacts to link to multiple vendors, tasks, and other records within one wedding workspace | Approved |

| DEC-253 | 2026-10-21 | Contact visibility | Choose Shared or Private visibility for each contact under workspace permissions | Approved |

| DEC-254 | 2026-10-21 | Possible duplicate contacts | Flag for review; authorized users may link or merge; never block or merge automatically | Approved |

| DEC-255 | 2026-10-21 | Multiple contact types | Allow one contact to have multiple types | Approved |

| DEC-256 | 2026-10-21 | Multiple labeled contact methods | Allow multiple labeled phone numbers and email addresses | Approved |

| DEC-257 | 2026-10-21 | Custom contact types | Keep suggested types and allow couples to create custom types | Approved |

| DEC-258 | 2026-10-21 | Contact search and filtering | Search names, companies, and details; filter by type and linked records | Approved |

| DEC-259 | 2026-10-21 | Preferred contact method | Let users mark a phone number or email as preferred | Approved |

| DEC-260 | 2026-10-21 | Contact entry method | Require manual contact entry; no device import or automatic sync (user selection) | Approved |

| DEC-261 | 2026-10-21 | Contacts across wedding workspaces | Keep records separate; allow explicit copy into another wedding as an independent record | Approved |

| DEC-262 | 2026-10-21 | Contact visibility scope | Apply Shared or Private visibility to the whole contact record | Approved |

| DEC-263 | 2026-10-21 | Deleting linked contacts | Archive and preserve links; require review before permanent deletion | Approved |

| DEC-264 | 2026-10-21 | Emergency contacts in offline/PDF schedules | Let authorized users select emergency contacts for inclusion | Approved |

| DEC-265 | 2026-10-21 | Planning task statuses | Use Not started, In progress, Blocked, and Complete | Approved |

| DEC-266 | 2026-10-21 | Tasks without due dates | Allow undated tasks and show them in an undated list | Approved |

| DEC-267 | 2026-10-21 | Task checklists and subtasks | Support simple checklists and represent substantial subtasks as separate tasks | Approved |

| DEC-268 | 2026-10-21 | Reopening completed tasks | Allow authorized users to reopen tasks while preserving completion activity | Approved |

| DEC-269 | 2026-10-21 | Per-task reminders | Allow optional reminders per task with a suggested pre-due-date reminder | Approved |

| DEC-270 | 2026-10-21 | Wedding-date changes and starter tasks | Preview changes to unfinished starter-task due dates and ask before applying | Approved |

| DEC-271 | 2026-10-21 | Overdue tasks | Show an overdue indicator without changing task status | Approved |

| DEC-272 | 2026-10-21 | Prerequisite blocker behavior | Show blockers without automatically changing status or preventing work/completion | Approved |

| DEC-273 | 2026-10-21 | Planning task organization | Group by wedding-planning phase; filter by owner, status, and due date | Approved |

| DEC-274 | 2026-10-21 | Task assignment and due-date notifications | Notify assignees on assignment and due-date changes, not routine description edits | Approved |

| DEC-275 | 2026-10-21 | Complete tasks with unchecked checklist items | Allow after warning and confirmation; retain checklist state | Approved |

| DEC-276 | 2026-10-21 | Reason for Blocked status | Allow an optional short reason or blocking-task link | Approved |

| DEC-277 | 2026-10-21 | Task due-date notifications | Notify task owner and collaborators when a due date changes | Approved |

| DEC-278 | 2026-10-21 | Completed task list placement | Keep completed tasks in a collapsed, accessible Completed section | Approved |

| DEC-279 | 2026-10-21 | Archiving obsolete tasks | Archive while preserving links and activity; allow restoration | Approved |

| DEC-282 | 2026-10-21 | Dashboard task card | Show overdue and the next few upcoming tasks | Approved |

| DEC-283 | 2026-10-21 | Dashboard budget card | Show total budget, committed costs, amount paid, and upcoming payments | Approved |

| DEC-284 | 2026-10-21 | Dashboard guest-progress card | Show confirmed headcount and progress with adult/child totals | Approved |

| DEC-285 | 2026-10-21 | Couple dashboard layout | Start with a shared fixed layout; allow each partner to independently rearrange their view while wedding data remains shared | Approved |

| DEC-286 | 2026-10-21 | Wedding countdown card | Show the wedding date and days remaining | Approved |

| DEC-287 | 2026-10-21 | Dashboard milestone card | Show the next few milestones with dates and progress | Approved |

| DEC-288 | 2026-10-21 | Dashboard decisions card | Show unresolved decisions needing attention with review links | Approved |

| DEC-289 | 2026-10-21 | Dashboard quick actions | Add shortcuts for creating a task, guest, vendor, or budget item | Approved |

| DEC-290 | 2026-10-21 | Helper and coordinator dashboard | Show the overview filtered to the viewer’s existing permissions | Approved |

| DEC-291 | 2026-10-21 | Inspiration idea contents | Save an image and note with an optional source link | Approved |

| DEC-292 | 2026-10-21 | Topic-based inspiration boards | Organize ideas into boards such as Venue, Attire, and Decor | Approved |

| DEC-293 | 2026-10-21 | Ideas on multiple boards | Allow one idea to appear on multiple boards without duplication | Approved |

| DEC-294 | 2026-10-21 | Moodboard presentation | Use a visual grid with simple sorting | Approved |

| DEC-295 | 2026-10-21 | Inspiration links to other modules | Keep inspiration separate from vendors, tasks, and other modules | Approved |

| DEC-296 | 2026-10-21 | Suggested and custom inspiration boards | Provide suggested topic boards and allow couples to create custom boards | Approved |

| DEC-297 | 2026-10-21 | Inspiration idea visibility | Share by default, with optional Private visibility per idea | Approved |

| DEC-298 | 2026-10-21 | Sorting inspiration ideas | Allow manual arrangement and sorting by date added | Approved |

| DEC-299 | 2026-10-21 | Removing inspiration ideas | Remove from one board separately from deleting the idea from all boards | Approved |

| DEC-300 | 2026-10-21 | Deleting inspiration boards | Delete the board but retain its ideas in the main inspiration collection | Approved |

| DEC-301 | 2026-10-21 | Text-only inspiration ideas | Allow text-only ideas as well as image-based ideas | Approved |

| DEC-302 | 2026-10-21 | Inspiration images per idea | Limit each idea to one image | Approved |

| DEC-303 | 2026-10-21 | Permission to add inspiration ideas | Allow members with Inspiration edit permission to add ideas | Approved |

| DEC-304 | 2026-10-21 | Comments on inspiration ideas | Allow comments and replies on each idea | Approved |

| DEC-305 | 2026-10-21 | Deleted inspiration ideas | Keep in a recoverable 30-day trash | Approved |

| DEC-306 | 2026-10-21 | Link-only inspiration ideas | Allow ideas that consist only of a source link | Approved |

| DEC-307 | 2026-10-21 | Inspiration idea titles | Require a short title and keep notes optional | Approved |

| DEC-308 | 2026-10-21 | Personal inspiration favorites | Let each person favorite ideas for their own view | Approved |

| DEC-309 | 2026-10-21 | Inspiration source link display | Show clickable URLs only, without previews | Approved |

| DEC-310 | 2026-10-21 | Inspiration idea deletion rights | Allow members with Inspiration edit permission to delete subject to idea visibility | Approved |

| DEC-311 | 2026-10-21 | Inspiration search and filtering | Search titles, notes, and URLs across boards; filter by board | Approved |

| DEC-312 | 2026-10-21 | Inspiration idea attribution | Show creator and date added | Approved |

| DEC-313 | 2026-10-21 | Private idea visibility | Hide inaccessible Private ideas completely, including on shared boards | Approved |

| DEC-314 | 2026-10-21 | Suggested board management | Let couples rename, reorder, and hide suggested boards and create custom ones | Approved |

| DEC-315 | 2026-10-21 | Inspiration comment notifications | Do not notify for comments/replies on Inspiration ideas, including mentions; other record comments follow general rules | Approved |

| DEC-316 | 2026-10-21 | Inspiration MVP scope | Include a basic idea collection and suggested topic boards; defer advanced extras pending boundary definition | Approved |

| DEC-317 | 2026-10-21 | Contact directory MVP scope | Include manual contact records, Shared/Private visibility, and links to wedding records | Approved |

| DEC-318 | 2026-10-21 | Task planning MVP scope | Include all task behavior defined in the specification | Approved |

| DEC-319 | 2026-10-21 | Guest tracking MVP scope | Include all defined guest-list and attendance behavior | Approved |

| DEC-320 | 2026-10-21 | Wedding-day schedule MVP scope | Include all defined schedule behavior, including alerts and printable/PDF details | Approved |

| DEC-321 | 2026-10-21 | Inspiration MVP board types | Include suggested topic boards only; defer custom boards | Approved |

| DEC-322 | 2026-10-21 | Private ideas in Inspiration MVP | Include per-idea Private visibility | Approved |

| DEC-323 | 2026-10-21 | Inspiration MVP board membership | Limit each idea to one board | Approved |

| DEC-324 | 2026-10-21 | Inspiration MVP search | Include title search only | Approved |

| DEC-325 | 2026-10-21 | Inspiration MVP favorites | Defer personal favorites to a later release | Approved |

| DEC-326 | 2026-10-21 | Inspiration comments MVP scope | Defer comments and replies; focus MVP on saving and browsing ideas | Approved |

| DEC-327 | 2026-10-21 | Documents and Notes MVP scope | Include all defined document and notes behavior | Approved |

| DEC-328 | 2026-10-21 | Budget MVP scope | Include itemized costs, quotes, deposits, due dates, and payment tracking | Approved |

| DEC-329 | 2026-10-21 | Vendor comparison MVP scope | Include the full defined comparison and decision workflow | Approved |

| DEC-330 | 2026-10-21 | Couple overview dashboard MVP scope | Include the approved combined tasks, budget, guests, decisions, milestones, and countdown overview | Approved |
| DEC-331 | 2026-10-21 | Planner multi-wedding dashboard MVP scope | Include a dashboard with assigned weddings and actions needing attention | Approved |
| DEC-332 | 2026-10-21 | Planner team management MVP scope | Include assigning organization staff to weddings and setting their access | Approved |
| DEC-333 | 2026-10-21 | Private planner business records MVP scope | Include basic private client and business notes, separate from shared wedding workspaces | Approved |
| DEC-334 | 2026-10-21 | Planner vendor directory MVP scope | Include a reusable organization-wide directory alongside wedding vendor records | Approved |
| DEC-335 | 2026-10-21 | Reusable planner templates MVP scope | Include reusable task and timeline templates | Approved |
| DEC-336 | 2026-10-21 | Planner organization staff management | Managers manage staff; assigned planners manage access for their own weddings | Approved |
| DEC-337 | 2026-10-21 | Planner dashboard attention items | Flag overdue/upcoming tasks, payments due, schedule changes, and unresolved decisions | Approved |
| DEC-338 | 2026-10-21 | Wedding vendor profile relationship | Link wedding vendor records to the live organization vendor profile | Approved |
| DEC-339 | 2026-10-21 | Planner template creation | Build from scratch or save selected wedding tasks and timeline items | Approved |
| DEC-340 | 2026-10-21 | Private planner business notes | Support titled text notes with optional client or wedding link | Approved |
| DEC-341 | 2026-10-21 | Couple access to linked vendor profiles | Couples view full profile; only organization staff edit it; couples add wedding-specific notes | Approved |
| DEC-342 | 2026-10-21 | Vendor removal from organization directory | Preserve wedding records and last available details; remove live link | Approved |
| DEC-343 | 2026-10-21 | Notifications for linked vendor changes | Notify couples about important profile changes | Approved |
| DEC-344 | 2026-10-21 | Planner-only vendor notes | Keep organization vendor notes visible only to organization staff | Approved |
| DEC-345 | 2026-10-21 | Planner responsibility per wedding | Allow multiple assigned staff and identify one lead planner | Approved |
| DEC-346 | 2026-10-21 | Lead planner responsibilities | Lead coordinates; permissions still follow assigned access | Approved |
| DEC-347 | 2026-10-21 | Planner staff access defaults | Use role-based permissions, adjustable within couple restrictions | Approved |
| DEC-348 | 2026-10-21 | Organization vendor profile fields | Name, service categories, contact details, website, location, and internal notes | Approved |
| DEC-349 | 2026-10-21 | Important vendor profile changes | Notify couples of contact, availability, or business status changes | Approved |
| DEC-350 | 2026-10-21 | Archived organization vendor records | Retain archived profile and internal notes for organization staff | Approved |
| DEC-351 | 2026-10-21 | Staff departure and wedding access | Revoke access immediately, preserve activity history, flag assignments for reassignment | Approved |
| DEC-352 | 2026-10-21 | Changing the lead planner | Managers or current lead can change it; notify the couple | Approved |
| DEC-353 | 2026-10-21 | Applying templates to existing plans | Preview/select items to add; do not automatically replace or remove existing items | Approved |
| DEC-354 | 2026-10-21 | Organization vendor profile visibility | All staff can view; editing is role-limited | Approved |
| DEC-355 | 2026-10-21 | Permanent deletion of archived organization vendors | Permanently delete after 30 days | Approved |
| DEC-356 | 2026-10-21 | Restoring archived organization vendors | Organization managers can restore during the 30-day archive period | Approved |
| DEC-357 | 2026-10-21 | Final notice before vendor deletion | Notify managers 7 days before permanent deletion | Approved |
| DEC-358 | 2026-10-21 | Early permanent vendor deletion | Managers can permanently delete after confirmation | Approved |
| DEC-359 | 2026-10-21 | Reassignments after staff departure | Organization manager reviews and reassigns flagged assignments | Approved |
| DEC-360 | 2026-10-21 | Departure-related couple notifications | Keep staff assignment changes within the planner organization | Approved |
| DEC-361 | 2026-10-21 | Restoring vendor profiles | Restore profile but require planners to relink wedding records | Approved |
| DEC-362 | 2026-10-21 | Replacing a deleted vendor profile link | Allow authorized planners to relink or retain standalone wedding records | Approved |
| DEC-363 | 2026-10-21 | Vendor records after planner access ends | Preserve as standalone records and remove organization links | Approved |
| DEC-364 | 2026-10-21 | Custom organization vendor categories | Allow organization-specific categories alongside defaults | Approved |
| DEC-365 | 2026-10-21 | Custom organization vendor fields | Managers create fields shared across the organization directory | Approved |
| DEC-366 | 2026-10-21 | Removing custom vendor fields | Archive field; keep existing values visible read-only; prevent new entries | Approved |
| DEC-367 | 2026-10-21 | Creating custom vendor categories | Organization managers only | Approved |
| DEC-368 | 2026-10-21 | Couple visibility of custom fields | Show custom fields to couples who can view the linked profile | Approved |
| DEC-369 | 2026-10-21 | MVP custom vendor field types | Short text, long text, number, date, single-choice dropdown | Approved |
| DEC-370 | 2026-10-21 | Editing custom field values | Vendor-edit staff can edit values; setup remains manager-only | Approved |
| DEC-371 | 2026-10-21 | Removing custom vendor categories | Archive category; retain existing assignments; block new assignments | Approved |
| DEC-372 | 2026-10-21 | Restoring custom vendor categories | Do not allow restoration after removal | Approved |
| DEC-373 | 2026-10-21 | Managing custom dropdown options | Managers configure options; vendor-edit staff select them | Approved |
| DEC-374 | 2026-10-21 | Custom fields in vendor comparisons | Allow authorized comparison of custom field values | Approved |
| DEC-375 | 2026-10-21 | Custom field change notifications | Notify couples for important changes under existing vendor-change rules | Approved |
| DEC-376 | 2026-10-21 | Custom values when organization vendors are deleted | Delete organization values; preserve last values in linked wedding records | Approved |
| DEC-377 | 2026-10-21 | Removing custom dropdown options | Keep existing values read-only; prevent new selection | Approved |
| DEC-378 | 2026-10-21 | Custom field vendor filters | Allow filtering the organization directory by custom values | Approved |
| DEC-379 | 2026-10-21 | Renaming organization custom fields | Apply renamed label while preserving existing values | Approved |
| DEC-380 | 2026-10-21 | Custom values in standalone wedding records | Preserve last available custom values when link ends | Approved |
| DEC-381 | 2026-10-21 | Archived custom fields in comparisons and filters | Retain read-only values for comparison and filtering | Approved |
| DEC-382 | 2026-10-21 | Required custom vendor fields | Keep all custom fields optional | Approved |
| DEC-383 | 2026-10-21 | Changing populated custom field types | Create a new field rather than changing type | Approved |
| DEC-384 | 2026-10-21 | Applying custom fields by category | Let managers choose applicable service categories | Approved |
| DEC-385 | 2026-10-21 | Organization custom field ordering | Managers set shared field order | Approved |
| DEC-386 | 2026-10-21 | Permanently deleting archived custom fields | Managers may delete after confirmation; preserve wedding snapshots | Approved |
| DEC-387 | 2026-10-21 | Restoring archived custom fields | Managers can restore and resume editing values | Approved |
| DEC-388 | 2026-10-21 | Restoring dropdown options | Managers can restore; existing values become editable | Approved |
| DEC-389 | 2026-10-21 | Category changes and custom values | Delete values no longer applicable to the previous category | Approved |
| DEC-390 | 2026-10-21 | Required fields after category changes | Keep all custom fields optional; do not block saves | Approved |
| DEC-391 | 2026-10-21 | Confirming category changes that remove values | Show affected fields and values; require confirmation | Approved |
| DEC-392 | 2026-10-21 | Values for fields shared across categories | Retain values that still apply; remove inapplicable values | Approved |
| DEC-393 | 2026-10-21 | Undoing vendor category changes | Allow undo and restore removed values before leaving profile | Approved |
| DEC-394 | 2026-10-21 | Notifications for vendor category changes | Notify couples only if the vendor is their primary selection | Approved |
| DEC-395 | 2026-10-21 | Vendor category changes in activity history | Record actor and time, not deleted field values | Approved |
| DEC-396 | 2026-10-21 | Custom field value changes in activity history | Do not log custom field value changes | Approved |
| DEC-397 | 2026-10-21 | Visibility of vendor-related activity | Staff with permission to view vendor records; couples see activity for accessible linked wedding vendor records | Approved |
| DEC-398 | 2026-10-21 | Planner-only vendor note edits in history | Do not log internal note edits | Approved |
| DEC-399 | 2026-10-21 | Vendor activity retention | Match workspace activity history retention | Approved |
| DEC-400 | 2026-10-21 | Custom field definition changes in history | Record manager, action, field name, and time | Approved |
| DEC-401 | 2026-10-21 | Workspace activity history retention | Delete history one year after wedding date | Approved |
| DEC-402 | 2026-10-21 | Activity history display | Chronological list, without search or filters | Approved |
| DEC-403 | 2026-10-21 | Activity links | Link to records only when viewer has permission | Approved |
| DEC-404 | 2026-10-21 | Activity history export | App viewing only; no export | Approved |
| DEC-405 | 2026-10-21 | Notifications from activity history | Underlying change rules govern; no independent activity notifications | Approved |
| DEC-406 | 2026-10-21 | Activity retention without wedding date | Delete one year after workspace creation | Approved |
| DEC-407 | 2026-10-21 | Activity retention after date change | Base deadline on latest saved wedding date | Approved |
| DEC-408 | 2026-10-21 | Activity sort order | Show most recent entries first | Approved |
| DEC-409 | 2026-10-21 | Activity grouping | Group by day, most recent day first | Approved |
| DEC-410 | 2026-10-21 | Activity timestamp timezone | Show viewer local time and identify timezone | Approved |
| DEC-411 | 2026-10-21 | MVP non-couple permission presets | Include planner, coordinator, and helper; vendor profiles are records, not members | Approved |
| DEC-412 | 2026-10-21 | Coordinator default access | Schedule, essential contacts, and assigned tasks | Approved |
| DEC-413 | 2026-10-21 | Helper default access | Assigned tasks and explicitly shared records | Approved |
| DEC-414 | 2026-10-21 | Vendor participation in the workspace | Vendors have no accounts or sign-in; couples/planners manage vendor records | Approved |
| DEC-415 | 2026-10-21 | Adjusting coordinator/helper access | Either partner or assigned lead planner within couple restrictions | Approved |
| DEC-416 | 2026-10-21 | Permanent vendor account policy | Vendors never have platform accounts or sign-in; couples/planners manage vendor records | Approved |
| DEC-417 | 2026-10-21 | Coordinator/helper invitation methods | Email or secure expiring link/code | Approved |
| DEC-418 | 2026-10-21 | Who can invite coordinators/helpers | Either partner or assigned lead planner within couple restrictions | Approved |
| DEC-419 | 2026-10-21 | Access after invitation acceptance | Access starts after acceptance and sign-in/account creation | Approved |
| DEC-420 | 2026-10-21 | Coordinator/helper invitation expiration | Seven days; resend or revoke available | Approved |
| DEC-421 | 2026-10-21 | Revoking coordinator/helper invitations | Either partner or assigned lead planner within couple restrictions | Approved |
| DEC-422 | 2026-10-21 | Protecting coordinator/helper invitation links | Make each link/code single-use and bind it to intended invitee | Approved |
| DEC-423 | 2026-10-21 | Verifying invitation email identity | Verify the invitation email even if account email differs | Approved |
| DEC-424 | 2026-10-21 | Invitation access preview | Show workspace, inviter, role, area permissions, and specifically shared records before acceptance | Approved |
| DEC-425 | 2026-10-21 | Declined invitation notifications | Notify inviter and both partners | Approved |
| DEC-426 | 2026-10-21 | Pending invitation visibility | Both partners and assigned lead planner can view invite details and expiry | Approved |
| DEC-427 | 2026-10-21 | Coordinator/helper access requests | No requests; only workspace decision-makers can change access | Approved |
| DEC-431 | 2026-10-21 | Default coordinator/helper access expiration | Seven days after wedding; authorized decision-makers may adjust | Approved |
| DEC-432 | 2026-10-21 | Reminders before helper/coordinator access expiry | Send 7-day and 1-day reminders | Approved |
| DEC-433 | 2026-10-21 | Recipients of access-expiry reminders | Member, both partners, and assigned lead planner | Approved |
| DEC-434 | 2026-10-21 | Tasks after helper/coordinator access expires | Preserve tasks/history and flag tasks for review/reassignment | Approved |
| DEC-435 | 2026-10-21 | Comments/history after access expiry | Preserve and label as expired access | Approved |
| DEC-436 | 2026-10-21 | Restoring expired access | Restore directly with a new expiry date; notify person | Approved |
| DEC-437 | 2026-10-21 | Default expiry after wedding-date changes | Move default-based expiry to seven days after the new wedding date; keep manually set expiry dates fixed | Approved |
| DEC-438 | 2026-10-21 | Wedding date changes after manual expiry adjustment | Preserve the manually chosen expiry date | Approved |
| DEC-439 | 2026-10-21 | Expiry when no wedding date is set | Access has no expiry until a wedding date is added; then use the seven-day default | Approved |
| DEC-440 | 2026-10-21 | Time for access-expiry reminders | Send at 9 a.m. in each recipient’s local timezone | Approved |
| DEC-441 | 2026-10-21 | Reminders after expiry date changes | Cancel reminders for old date and schedule new ones | Approved |
| DEC-442 | 2026-10-21 | Default expiry recalculated into the past | Expire access immediately | Approved |
| DEC-443 | 2026-10-21 | Reminders when expiry is less than seven days away | Send only reminders whose scheduled time has not passed | Approved |
| DEC-444 | 2026-10-21 | Early access revocation and reminders | Cancel scheduled expiry reminders | Approved |
| DEC-445 | 2026-10-21 | Review of access with no expiry | No scheduled review; decision-makers may change access at any time | Approved |
| DEC-446 | 2026-10-21 | Notification when active expiry date changes | Do not notify the active member | Approved |
| DEC-447 | 2026-10-21 | Customizing coordinator/helper access | Start from role preset, then adjust by access area | Approved |
| DEC-448 | 2026-10-21 | Review before saving expanded access | Show full effective-access summary | Approved |
| DEC-449 | 2026-10-21 | Reviewing member access | Show role and effective access in member list with adjustment link | Approved |
| DEC-450 | 2026-10-21 | Permission levels by access area | View and Edit; access management stays with decision-makers | Approved |
| DEC-451 | 2026-10-21 | Preset changes with custom access | Preserve custom settings and show resulting access summary | Approved |
| DEC-452 | 2026-10-21 | Permission areas | Separate controls for each main wedding area | Approved |
| DEC-453 | 2026-10-21 | Downloads and exports | Require separate access from View; use one combined Download/Export permission | Approved |
| DEC-454 | 2026-10-21 | Scope of edit access | Edit only assigned or explicitly shared records | Approved |
| DEC-455 | 2026-10-21 | Download and export controls | Use one combined permission | Approved |
| DEC-456 | 2026-10-21 | Creating records with Edit access | Edit access includes creating records in that area | Approved |
| DEC-457 | 2026-10-21 | Area permissions and explicit record sharing | Area permission sets the maximum; sharing selects records in scope | Approved |
| DEC-458 | 2026-10-21 | Authority to share individual records | Either partner or assigned lead planner within couple restrictions | Approved |
| DEC-459 | 2026-10-21 | Visibility of record shares | Show shared members and their effective access to decision-makers | Approved |
| DEC-460 | 2026-10-21 | Removing area View permission | Warn about affected shares; area permission takes priority | Approved |
| DEC-461 | 2026-10-21 | History after unsharing a record | Remove member access; preserve their edits, comments, and activity | Approved |
| DEC-462 | 2026-10-21 | Notifications on record-share changes | Notify affected member when record access is granted or removed | Approved |
| DEC-463 | 2026-10-21 | Activity history for individual record shares | Do not log record share/unshare changes | Approved |
| DEC-464 | 2026-10-21 | Attribution after record access removal | Keep member name and show access was removed | Approved |
| DEC-465 | 2026-10-21 | Delivery of record-share notifications | Follow member preferences and established timing for important changes | Approved |
| DEC-466 | 2026-10-21 | Other recipients of record-share notifications | Notify the other partner and assigned lead planner | Approved |
| DEC-467 | 2026-10-21 | Detail in coordinator/helper invitation preview | Show role, area permissions, and specifically shared records | Approved |
| DEC-468 | 2026-10-21 | Access changes during pending invitation | Update preview and notify invitee | Approved |
| DEC-469 | 2026-10-21 | Acceptance after pending invite access changes | Require acceptance of latest access details | Approved |
| DEC-470 | 2026-10-21 | Invitation expiry after access changes | Keep original seven-day expiry date | Approved |
| DEC-471 | 2026-10-21 | Stale invitation preview during acceptance | Require review and acceptance of latest access details | Approved |
| DEC-472 | 2026-10-21 | Effective timing of permission reductions | Apply immediately across workspace, including open sessions | Approved |
| DEC-473 | 2026-10-21 | Notification of active member access changes | Notify member of any effective-access change | Approved |
| DEC-474 | 2026-10-21 | Review before permission reduction | Show access being removed and affected records | Approved |
| DEC-475 | 2026-10-21 | Assigned tasks after access reduction | Preserve tasks/history and flag for review and reassignment | Approved |
| DEC-476 | 2026-10-21 | Member with no area permissions | Keep as workspace member with no area access | Approved |

| DEC-477 | 2026-10-21 | Wedding decision statuses | Open, Decided, Deferred, and Cancelled | Approved |
| DEC-478 | 2026-10-21 | Decision options and outcome | Selectable options; record chosen option and optional rationale | Approved |
| DEC-479 | 2026-10-21 | Decision due dates and reminders | Optional due date and optional reminder | Approved |
| DEC-480 | 2026-10-21 | Decision ownership | Decisions belong to the couple; no individual owner | Approved |
| DEC-481 | 2026-10-21 | Decision links | Link decisions to relevant wedding records | Approved |
| DEC-482 | 2026-10-21 | Decision-tracking MVP scope | Include a basic decision tracker with statuses, options, due dates, and links | Approved |
| DEC-483 | 2026-10-21 | Decisions permission area | Give Decisions its own View/Edit access area | Approved |
| DEC-484 | 2026-10-21 | Comments on decisions | Use shared comments and replies | Approved |
| DEC-485 | 2026-10-21 | Decisions dashboard attention card | Show all Open and Deferred decisions | Approved |
| DEC-486 | 2026-10-21 | Decision reminder recipients | Both partners and assigned lead planner if they have access | Approved |
| DEC-487 | 2026-10-21 | Reopening decided decisions | Reopen to reconsider while retaining prior outcome and history | Approved |
| DEC-488 | 2026-10-21 | Deferred decision follow-up | Allow an optional follow-up date and reminder | Approved |
| DEC-489 | 2026-10-21 | Marking a decision Decided | Any member with Edit access to Decisions | Approved |
| DEC-490 | 2026-10-21 | Deferred follow-up and original due date | Follow-up date replaces original due date | Approved |
| DEC-491 | 2026-10-21 | Status after reopening a decision | Return to Open; retain prior outcome in history | Approved |
| DEC-492 | 2026-10-21 | Decision editing authority | Any member with Edit access to Decisions can create/edit details | Approved |
| DEC-493 | 2026-10-21 | Open-ended decisions | Allow decisions without predefined options | Approved |
| DEC-494 | 2026-10-21 | Custom decision outcomes | Allow a custom outcome with optional explanation | Approved |
| DEC-495 | 2026-10-21 | Editing Decided decisions | Allow edits while Decided; retain change history | Approved |
| DEC-496 | 2026-10-21 | Authority to reopen a decision | Any member with Edit access to Decisions | Approved |
| DEC-497 | 2026-10-21 | Decision change history details | Show actor, time, and previous/new values | Approved |
| DEC-498 | 2026-10-21 | Decision history visibility | Visible to all members with View access to the decision | Approved |
| DEC-499 | 2026-10-21 | Decision reminder timing | 9 a.m. in each recipient’s local timezone on chosen date | Approved |
| DEC-500 | 2026-10-21 | Decision reminders after resolution | Cancel on Decided or Cancelled status | Approved |
| DEC-501 | 2026-10-21 | Decision reminders after date changes | Cancel old reminder and schedule a new one | Approved |
| DEC-502 | 2026-10-21 | Decision list search and filters | Chronological list without search or filters | Approved |
| DEC-503 | 2026-10-21 | Default decision order | Open/Deferred first by due date; Decided/Cancelled below | Approved |
| DEC-504 | 2026-10-21 | Decision categories | Suggested categories plus custom categories | Approved |
| DEC-505 | 2026-10-21 | Category count per decision | One category per decision | Approved |
| DEC-506 | 2026-10-21 | Optional decision categories | Allow uncategorized decisions | Approved |
| DEC-507 | 2026-10-21 | Custom decision category permissions | Any member with Edit access to Decisions | Approved |
| DEC-508 | 2026-10-21 | Managing suggested decision categories | Couples may rename, reorder, and hide them | Approved |
| DEC-509 | 2026-10-21 | Removing a decision category | Keep decisions and make them uncategorized | Approved |
| DEC-510 | 2026-10-21 | Hiding a suggested category | Keep assignments; prevent new assignments until restored | Approved |
| DEC-511 | 2026-10-21 | Recovering removed custom categories | 30-day trash with restore available | Approved |
| DEC-512 | 2026-10-21 | Restoring decision categories | Any member with Edit access to Decisions | Approved |
| DEC-513 | 2026-10-21 | Restoring category assignments | Reassign prior decisions only if still uncategorized | Approved |
| DEC-514 | 2026-10-21 | Category after 30-day trash period | Permanently delete; leave decisions uncategorized | Approved |
| DEC-515 | 2026-10-21 | Early permanent category deletion | Allow after confirmation | Approved |
| DEC-516 | 2026-10-21 | Confirmation before category removal | Show category name and count of affected decisions | Approved |
| DEC-517 | 2026-10-21 | Decision changes in workspace activity history | Include creation, status, option, and outcome changes | Approved |
| DEC-518 | 2026-10-21 | Decision-category changes in activity history | Record who changed categories and when | Approved |
| DEC-519 | 2026-10-21 | Notifications for decision comments | No comment notifications; @mentions still notify authorized people | Approved |
| DEC-520 | 2026-10-21 | Decision activity entry detail | Show actor, time, and short summary | Approved |
| DEC-521 | 2026-10-21 | Visibility of decision activity entries | Only members with View access to the decision | Approved |
| DEC-522 | 2026-10-21 | Milestones and tasks | Separate milestone records that can link to related tasks | Approved |
| DEC-523 | 2026-10-21 | Milestone progress | Manually set progress; task links are optional | Approved |
| DEC-524 | 2026-10-21 | Milestone dates | Planned date; optionally derive or update from linked tasks | Approved |
| DEC-525 | 2026-10-21 | Stand-alone milestones | Allow milestones without linked tasks | Approved |
| DEC-526 | 2026-10-21 | Milestone editing permissions | Any member with Edit access to the timeline | Approved |
| DEC-527 | 2026-10-21 | Suggested starter-plan milestones | Include common suggested milestones that couples can edit or remove | Approved |
| DEC-528 | 2026-10-21 | Milestone dates after wedding-date change | Preview proposed changes and ask before applying | Approved |
| DEC-529 | 2026-10-21 | Milestone progress statuses | Not started, In progress, and Complete | Approved |
| DEC-530 | 2026-10-21 | Milestone reminders | Optional reminder for each milestone | Approved |
| DEC-531 | 2026-10-21 | Removing milestones | Move to 30-day trash with restore available | Approved |
| DEC-532 | 2026-10-21 | Milestone comments | Shared comments and replies | Approved |
| DEC-533 | 2026-10-21 | Milestone reminder recipients | Both partners; include assigned lead planner if they have access | Approved |
| DEC-534 | 2026-10-21 | Milestone reminder time | 9 a.m. in each recipient’s local timezone on the chosen reminder date | Approved |
| DEC-535 | 2026-10-21 | Milestone trash expiration | Permanently delete automatically after 30 days | Approved |
| DEC-536 | 2026-10-21 | Source for derived milestone dates | User chooses one linked task as the date source | Approved |
| DEC-537 | 2026-10-21 | Milestone progress with linked tasks | Keep status manual; linked task changes do not update it | Approved |
| DEC-538 | 2026-10-21 | Milestone activity history | Include creation, date, status, trash, and restore changes | Approved |
| DEC-539 | 2026-10-21 | Reminder on milestone completion | Cancel pending reminder when marked Complete | Approved |
| DEC-540 | 2026-10-21 | Reminder after milestone date change | Cancel old reminder and schedule a new one | Approved |
| DEC-541 | 2026-10-21 | Milestone comment notifications | No comment notifications; @mentions notify mentioned members | Approved |
| DEC-542 | 2026-10-21 | Milestone restore permission | Any member with Edit access to the timeline | Approved |
| DEC-543 | 2026-10-21 | Reminder when milestone is trashed | Cancel the pending reminder | Approved |
| DEC-544 | 2026-10-21 | Restored milestone contents | Restore details, task links, comments, and prior status | Approved |
| DEC-545 | 2026-10-21 | Derived milestone date updates | Automatically match changes to the chosen source task’s due date | Approved |
| DEC-546 | 2026-10-21 | Source task deleted or trashed | Keep last date; prompt to choose a new source or planned date | Approved |
| DEC-547 | 2026-10-21 | Source task unlinked | Keep last date and switch to planned date | Approved |
| DEC-548 | 2026-10-21 | Combined timeline view | Show milestones and tasks chronologically with filters | Approved |
| DEC-549 | 2026-10-21 | Completed milestone placement | Keep in chronological order with Complete status | Approved |
| DEC-550 | 2026-10-21 | Main timeline layout | Chronological list with dates and progress | Approved |
| DEC-551 | 2026-10-21 | Combined timeline filters | Item type, status, date range; owner for tasks | Approved |
| DEC-552 | 2026-10-21 | Milestone date requirement | Every milestone requires a planned date | Approved |
| DEC-553 | 2026-10-21 | Undated task placement | Separate Undated section below dated items | Approved |
| DEC-554 | 2026-10-21 | Default timeline date order | Upcoming first, nearest date first; past items below | Approved |
| DEC-555 | 2026-10-21 | Completed tasks in combined timeline | Collapsed Completed section | Approved |
| DEC-556 | 2026-10-21 | Same-date timeline ordering | Users arrange items manually | Approved |
| DEC-557 | 2026-10-21 | Shared same-day timeline order | One shared manual order across the workspace | Approved |
| DEC-558 | 2026-10-21 | Permission to change timeline order | Members with Edit access to the timeline | Approved |
| DEC-559 | 2026-10-21 | Dragging timeline items | Reorder only within the same date; dates do not change | Approved |
| DEC-560 | 2026-10-21 | Timeline ordering activity history | Do not record manual ordering changes | Approved |
| DEC-561 | 2026-10-21 | Notifications for timeline reordering | Do not notify; shared order is visible in the timeline | Approved |
| DEC-562 | 2026-10-21 | Placement of new same-day items | Add at the end of the date’s list | Approved |
| DEC-563 | 2026-10-21 | Past timeline items | Collapsed Past section below upcoming items | Approved |
| DEC-564 | 2026-10-21 | Combining timeline filters | Apply selected filters together | Approved |
| DEC-565 | 2026-10-21 | Timeline search | Search task and milestone titles | Approved |
| DEC-566 | 2026-10-21 | Milestone date-change notification recipients | Both partners; assigned lead planner if they have access | Approved |
| DEC-567 | 2026-10-21 | Notifications for task-derived milestone dates | Notify same as direct milestone-date changes | Approved |
| DEC-568 | 2026-10-21 | Milestone status-change notifications | No notifications; show in timeline and activity history | Approved |
| DEC-569 | 2026-10-21 | Early permanent deletion of milestones | Timeline editors may delete early after confirmation | Approved |
| DEC-570 | 2026-10-21 | Final notice before milestone deletion | Notify decision-makers 7 days before automatic deletion | Approved |
| DEC-571 | 2026-10-21 | Effects of permanent milestone deletion | Delete milestone, comments, task links; keep linked tasks | Approved |
| DEC-572 | 2026-10-21 | Milestone description | Optional description | Approved |
| DEC-573 | 2026-10-21 | Milestone accountability | Milestones belong to couple; tasks can have owners | Approved |
| DEC-574 | 2026-10-21 | Milestone planning phases | Suggested phases plus custom phases | Approved |
| DEC-575 | 2026-10-21 | Optional milestone phase | Milestones may be unassigned to a phase | Approved |
| DEC-576 | 2026-10-21 | Milestone-phase management permission | Any member with Edit access to timeline | Approved |
| DEC-577 | 2026-10-21 | Removing a milestone phase | Keep milestones and make them unassigned | Approved |
| DEC-578 | 2026-10-21 | Managing suggested milestone phases | Timeline editors can rename, reorder, and hide | Approved |
| DEC-579 | 2026-10-21 | Hidden suggested phase assignments | Preserve existing assignments; hide from new assignments until restored | Approved |
| DEC-580 | 2026-10-21 | Recovering removed custom milestone phases | 30-day trash with restore available | Approved |
| DEC-581 | 2026-10-21 | Custom phase restore permission | Any member with Edit access to the timeline | Approved |
| DEC-582 | 2026-10-21 | Restored custom-phase assignments | Restore prior assignments only for still-unassigned milestones | Approved |
| DEC-583 | 2026-10-21 | Custom-phase trash expiration | Permanently delete after 30 days; milestones stay unassigned | Approved |

## 10. Document maintenance rules



- Append every approved product decision to Section 6 and the decision log.
- Update affected sections so the specification remains internally consistent.
- Mark unapproved ideas as proposed; never silently promote them to requirements.
- Preserve unresolved questions until explicitly answered.
- Record important tradeoffs and consequences when decisions are made.
- Defer technology and architecture choices until product workflows are sufficiently clear.
