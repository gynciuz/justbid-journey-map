import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MapPin, ShieldCheck, Users, Ticket, Gift, CheckCircle2,
  ChevronDown, Lightbulb, Eye, Sparkles, Target,
  Zap, Navigation, ScanLine, BellRing, Fingerprint,
  Package, Search, BookOpen, Gavel, CreditCard, Trophy,
  CalendarClock, CalendarCheck, ArrowRightLeft, Moon, Share2, CircleDot,
  Megaphone, HelpCircle, ChevronLeft, ShoppingBag, Truck, ArrowRight,
  AlertTriangle, Globe, TrendingUp, Palette, Wrench, Monitor,
  Database, Layers, ExternalLink
} from "lucide-react";

/* ═══ DATA ═══ */
const UX_GAPS = [
  { rank:1, title:"Hidden total cost during bidding", severity:"Critical", phase:"Pre-Purchase → Bidding", stepId:"learn_bidding", evidence:"15% buyer premium + $2 lot fee + sales tax invisible on bid button and item cards. Fee breakdown IS visible on invoice after win. Gap is at the decision point — users bid $3 thinking that's the price, actual cost ~$6.36. Confirmed by app screenshots: 'Bid $3' button shows zero fee indication.", uxFix:"Show total cost (bid + premium + fee) next to bid button before bid is placed.", bizFix:null, impact:"eBay's upfront cost display is industry standard. Reduces BBB complaints." },
  { rank:2, title:"No pickup deadline reminders", severity:"Critical", phase:"Post-Purchase → Scheduling", stepId:"view_deadline", evidence:"BBB: $700+ lost from missed deadlines. Zero proactive notifications.", uxFix:"Push reminders at 48h, 24h, 2h before deadline.", bizFix:"Auto-extend 1 day if no slots available.", impact:"Amazon, Target, IKEA all send min 2 reminders." },
  { rank:3, title:"Delegation rejected at warehouse", severity:"Critical", phase:"Post-Purchase → Delegation", stepId:"delegate_pickup", evidence:"BBB: staff said 'we have our own rules' — refused valid proxy.", uxFix:"Delegation QR + confirmation on delegate's phone.", bizFix:"Sync delegation to staff POS. Training. Audit trail.", impact:"Trust-breaking. Target, Apple handle proxy with order confirmation + ID." },
  { rank:4, title:"Unpredictable wait times", severity:"High", phase:"Post-Purchase → Queue", stepId:"queue_joined", evidence:"Yelp: 1+ hour waits. Position shown, no time estimate. 70% leave after 15 min.", uxFix:"Show wait time estimate. Virtual queue from car.", bizFix:"Historical data for prediction + staff allocation.", impact:"Wait estimates reduce walkaway by 50%." },
  { rank:5, title:"Pickup rules overwhelm", severity:"High", phase:"Pre-Purchase → Winning", stepId:"understand_pickup", evidence:"10+ scheduling rules across multiple screens. Client confirms: customers still can't tell appointment-only from walk-in days — scheduling calendar has zero day-type labels. Pickup Details accordion shows '(Appointment only)' per-invoice but collapsed by default. Additional confirmed rules: 1 active appointment, 1h-2 day booking window, invoice selection below fold (users miss it), partial pickup from oldest first, multi-location needs separate appointments, variable slot availability, cutoff rules by order size, reschedule may lose orders.", uxFix:"Visual decision tree. One-page booking wizard.", bizFix:null, impact:"Lowest feeling score (-1.5) in entire journey. Highest cognitive load step." },
  { rank:6, title:"Payment uncertainty overnight", severity:"Medium", phase:"Pre-Purchase → Payment", stepId:"payment_process", evidence:"Async batch charge. 'Did I win?' anxiety.", uxFix:"'Payment pending' badge + push when confirmed.", bizFix:"Evaluate real-time charging.", impact:"Every competitor confirms payment instantly." },
  { rank:7, title:"QR code hard to find", severity:"Medium", phase:"Post-Purchase → Collection", stepId:"show_qr", evidence:"Users dig through app under pressure.", uxFix:"Auto-surface QR on lock screen. Wallet pass.", bizFix:null, impact:"High-frequency friction on every pickup." },
  { rank:8, title:"Broken items at pickup", severity:"High", phase:"Post-Purchase → Collection", stepId:"receive_items", evidence:"Yelp: 'Everything broken.' Store-credit-only refund.", uxFix:"Photo receipt + in-app issue reporting.", bizFix:"Pre-verify items. Review refund policy.", impact:"#1 negative review theme." },
  { rank:9, title:"Reschedule drops orders", severity:"High", phase:"Post-Purchase → Scheduling", stepId:"book_slot", evidence:"Client reports: rescheduled appointments sometimes don't carry all selected orders. Customers arrive and items aren't ready. Reschedule UI shows time change only — no invoice re-confirmation step.", uxFix:"Show invoice summary on reschedule confirmation. Re-verify order linkage.", bizFix:"Add order-linkage integrity check to reschedule backend.", impact:"Direct trust violation — system confirms appointment but doesn't deliver." },
];

const FLOWS = [
  { id:"pre", title:"Pre-Purchase", subtitle:"Discover, bid, and win items", icon:ShoppingBag, accent:"#85aecf",
    phases:[
      { id:"discovery", label:"Discovering JustBid", icon:Search, color:"#6ac4b2", steps:[
        { id:"first_open", title:"First App Open", desc:"User downloads the app and browses items for the first time", icon:BookOpen, feeling:0, personaA:"Clean interface, I get the concept right away", personaB:"Lots of items but I don't understand how buying works", feedback:{text:"App Store: 'Game changer.' But new users confused about auction vs. Last Chance.", desc:"Early App Store reviews celebrate the concept but 2–3 star reviews consistently cite confusion about the bidding model on first use. New users can't distinguish auction items from Last Chance stock, and the fee structure is never surfaced during onboarding."}, competitor:"Shopify: guided tutorials. HiBid: rules inline.", ux:{text:"Onboarding tour: auction vs. Last Chance + fee structure", desc:"3-step guided walkthrough on first launch explaining auction mechanics, Last Chance timing, and fee structure with interactive examples", type:"Delighter"}, biz:null, frontstage:"Item grid, banners, filters. No onboarding or first-run detection.", backstage:"Content team manages item photography and catalog uploads.", support:"Catalog DB, CDN, search index. Mobile + web app." },
        { id:"learn_bidding", title:"How Bidding Works", desc:"User learns the auction mechanics — bidding, extensions, fees", icon:Gavel, feeling:-0.5, personaA:"Auction until midnight, +1 min extension — makes sense", personaB:"What happens if I get outbid? When does it end?", feedback:{text:"15% premium + $2 fee invisible until checkout.", desc:"MoneyAt30 review specifically calls out that the 15% buyer's premium and $2 lot fee are invisible during bidding, only appearing in the invoice after winning. Corroborated by multiple BBB complaints citing unexpected charges at checkout."}, competitor:"eBay: total cost upfront. Proxibid BBB: fees #1 pain.", ux:{text:"Show total cost (bid + premium + fee) next to bid button before bid is placed", desc:"Display running total dynamically updating as user changes bid amount, positioned next to the Place Bid button", type:"Baseline", gap:1}, biz:null, frontstage:"Bid input shows current bid only. Fees calculated server-side, shown in invoice after win.", backstage:"Auction engine: +1 min extension on last-minute bids (confirmed by client). Auto-bid system.", support:"Real-time bid infrastructure. Timer service. Auto-bid queue. Fee calculation service." },
        { id:"learn_lastchance", title:"Last Chance", desc:"Unsold items available at fixed price, 10pm–8am, prices drop hourly", icon:Moon, feeling:-1, personaA:"Fixed price, no fees, late night — nice fallback", personaB:"When is it available? How does pricing drop?", feedback:{text:"Timing (10pm–8am) and price drops unclear.", desc:"App Store reviews mention confusion about when Last Chance activates and how pricing works. Users discover the 10pm start time and hourly price drops by accident, often missing the window entirely on their first attempts."}, competitor:"Tophatter, Whatnot: countdown + price schedules.", ux:{text:"Countdown timer + pricing schedule ($2→$0.50)", desc:"Live countdown to Last Chance availability with hourly price schedule table showing drop tiers", type:"Baseline"}, biz:null, frontstage:"Last Chance appears after 10pm. Fixed price, no drop schedule shown.", backstage:"Unsold items move to Last Chance after auction cycle. Pricing managed by operations.", support:"Scheduled transition at 10pm. Hourly price drop scheduler. Status flow: auction→last_chance→expired." },
      ]},
      { id:"winning", label:"Winning & Payment", icon:Trophy, color:"#ffe2a9", steps:[
        { id:"win_notification", title:"Winning an Item", desc:"User receives push notification that they won an auction", icon:Megaphone, feeling:1.5, personaA:"Got a notification I won — exciting!", personaB:"I won but what happens next?", feedback:{text:"Positive on notifications. Post-win steps vague.", desc:"Win notifications consistently receive positive feedback for being timely. However, the follow-up is abrupt — users are dropped into a My Wins list with no guidance on payment timeline, pickup booking, or what happens if they miss the deadline."}, competitor:"BOPIS: clear instructions reduces support load.", ux:{text:"Post-win CTA: 'You won! Here's what happens next'", desc:"Replace generic notification with step-by-step wizard: payment timeline, pickup deadline, scheduling options", type:"Expected"}, biz:null, frontstage:"Push: 'You won [item]!' Links to My Wins. No next-step wizard.", backstage:"Auction close → winner determination → push notification → invoice generation.", support:"Push notification service. Invoice worker. Winner resolution (ties, proxy)." },
        { id:"payment_process", title:"Overnight Charge", desc:"Card charged overnight in async batch, confirmation next morning", icon:CreditCard, feeling:-0.5, personaA:"Card charged overnight, confirmed in morning", personaB:"Why not charged immediately? Is it confirmed?", feedback:{text:"Overnight batch creates delay, but payment status is now visible in app with retry option.", desc:"Cards are charged overnight in a batch process. Status IS visible in the Wins tab — green 'Paid' or red 'Payment failed' with specific error. Users can update card and retry directly. The anxiety gap is the delay between win and charge confirmation, not missing status. About 92-95% succeed automatically; a few percent use retry; the rest pay on-site at the assistance desk via cash, card, or split payment."}, competitor:"eBay, StockX charge immediately.", ux:{text:"'Payment pending — charged by [time]' badge + push", desc:"Payment status badges already exist (Paid/Failed with retry). Remaining gap: push notification when overnight charge completes, and 'Payment processing...' state during the overnight window before batch runs.", type:"Baseline", gap:6}, biz:{text:"Evaluate real-time charging for high-value wins", desc:"Evaluate real-time charging for high-value wins (threshold TBD with business), keep batch for remainder", type:"Baseline"}, frontstage:"Wins tab shows green 'Paid' badge or red 'Payment failed' badge with error reason and card last-4. Failed payments offer: View Invoice, Credit Cards (update method), Retry Payment button. Invoice available same day. 92-95% charged auto overnight; few % retry via app; remainder pay on-site at assistance desk.", backstage:"Nightly batch charges all winners from saved card. Failed charges show clear error (e.g. 'credit card number is invalid'). User can update card and retry from app. ~5% pay on-site at assistance desk (cash, card via POS, split payment). No partial invoice payment — one invoice per day per warehouse.", support:"Payment processor. Nightly cron. Retry queue. Invoice email service." },
        { id:"understand_pickup", title:"Pickup Options", desc:"User must navigate: appointment vs live queue days, mixed days, 1-appointment limit, partial order selection, multi-location scheduling, 2-day booking window, variable slot availability", icon:HelpCircle, feeling:-1.5, personaA:"Appointment or live queue — clear options", personaB:"So many rules — deadlines, slots, limits, locations, order selection changes the calendar", feedback:{text:"BBB: missed appointment = payment kept. No reminders.", desc:"BBB complaints include cases where customers missed their appointment without any reminder from JustBid, and payment was retained despite the no-show. The rule set — appointment vs. live days, 1-appointment limit, order-dependent calendar — is documented only in a FAQ no one reads before booking."}, competitor:"IKEA, Target: reminders. Amazon: auto-extend. Walmart: automated.", ux:{text:"Visual decision tree with all rules visible upfront. One-page booking wizard.", desc:"Interactive wizard walking through all 10+ scheduling rules, adapting based on the user's specific order", type:"Delighter", gap:5}, biz:null, frontstage:"Invoice shows deadline per item. FAQ link. No decision tree. No visual summary of all constraints.", backstage:"Deadlines = +3 business days. Capacity managed by operations team. Multi-location orders not coordinated.", support:"Business day calculator. Slot capacity DB. No reminder system." },
      ]},
    ],
  },
  { id:"post", title:"Post-Purchase", subtitle:"Schedule, arrive, and collect", icon:Truck, accent:"#64c8a0",
    phases:[
      { id:"scheduling", label:"Scheduling & Delegation", icon:CalendarClock, color:"#5cbcd4", steps:[
        { id:"view_deadline", title:"Pickup Deadline", desc:"Each item has a 3 business day window. Multiple orders have different deadlines — must pick up oldest first. Miss it and items are resold.", icon:CalendarCheck, feeling:0, personaA:"3 business days on each card — noted", personaB:"Different deadlines per order — which one matters? Do I have to pick up all at once?", feedback:{text:"$700+ lost. No reminders. Resold without refund.", desc:"BBB documents multiple $700+ losses from missed pickup deadlines. Users with orders across different dates are especially vulnerable — the app shows per-item deadlines but no consolidated urgency view. Items are resold with no refund and no reminder was ever sent."}, competitor:"Amazon: 3-day auto-refund. Industry: min 2 reminders.", ux:{text:"Earliest deadline highlighted + push at 48h/24h/2h. Show consolidated deadline view across all orders.", desc:"Dashboard showing all orders sorted by urgency with countdown timers and automated push reminders", type:"Expected", gap:2}, biz:{text:"Auto-extend 1 day when no slots. Review resale policy.", desc:"Auto-extend deadline when no slots available. Review no-refund resale policy with legal and CS", type:"Baseline"}, frontstage:"Each item shows own deadline. No consolidated view or countdown. Must select orders oldest-first for pickup.", backstage:"Expired items → resale, no refund. Manual account flagging. Partial pickup allowed but must start from oldest order.", support:"Per-item deadline tracking. Auto-resale trigger. No reminder jobs." },
        { id:"choose_method", title:"Pickup Method", desc:"Some days are appointment-only, some live-queue-only (e.g. Saturday), some allow both. Multi-location wins need separate appointments per warehouse.", icon:ArrowRightLeft, feeling:0.5, personaA:"I'll book an appointment — Mon/Wed/Fri", personaB:"Saturday is live-only? And I need two appointments for two warehouses?", feedback:{text:"Wanderlog: '15 min.' Yelp: 'hours.'", desc:"Wanderlog reviews suggest ~15 minute waits for appointments, but Yelp reviewers report 1–2 hour waits on live queue days. Users have no way to gauge live queue busyness before deciding which day to visit, leading to poor scheduling decisions and frustrated walk-aways."}, competitor:"Waitwhile: high walkaway without estimates. Wait estimates reduce perceived wait time.", ux:{text:"Live queue estimates + busy hours heatmap. Surface multi-location scheduling upfront.", desc:"Real-time wait estimates, historical busy-hour heatmap, and multi-location needs surfaced before day selection", type:"Baseline"}, biz:{text:"Historical traffic data for staffing. Consolidate multi-location pickups where possible.", desc:"Build staffing model from queue data. Allow cross-location transfers where feasible", type:"Expected"}, frontstage:"Pickup Details accordion (per-invoice, collapsed by default) shows day types with '(Appointment only)' labels and hours. However, the Appointments scheduling calendar has NO day-type labels — all days look identical. Multi-location via dropdown (6+ locations), requires separate booking per location.", backstage:"Staff equal across days. No real-time queue dashboard. Multi-location orders handled independently.", support:"Day-type scheduling rules. Queue counter DB. No analytics pipeline. No cross-location coordination." },
        { id:"book_slot", title:"Book Time Slot", desc:"Reserve a 15-min slot up to 2 business days ahead. Only 1 active appointment allowed. Selecting which orders to pick up changes available days. Slot availability varies daily — some days have zero slots.", icon:CircleDot, feeling:-0.5, personaA:"Picked a slot, 1hr cutoff fine", personaB:"Calendar changed when I selected my orders? Only 1 appointment? Some days have no slots at all?", feedback:{text:"Improved scheduling. Cutoff rules still surprise. Calendar behavior confusing.", desc:"App Store reviews note that slot booking improved significantly over previous versions. However, cutoff rules (1hr for ≤20 items, 2hr for ≤100) still catch users by surprise. The calendar shifts when different orders are selected — a counterintuitive UX that repeatedly confuses first-time bookers. Client reports: customers don't scroll to bottom to select all invoices — they schedule per-invoice via the card button. Calendar behavior when selecting orders is confusing. When rescheduling, orders sometimes don't carry over. The '2 days in advance' rule doesn't match user expectations (e.g. Monday for Wednesday)."}, competitor:"BOPIS: all rules before selection.", ux:{text:"Show all rules before selection. Preview calendar impact when selecting orders. Allow rescheduling from same screen.", desc:"Display cutoffs, no-show policy, slot counts upfront. Live preview of how order selection changes available dates. Additional: surface 'You have X pending invoices' banner at top of scheduling screen. Show invoice summary on reschedule confirmation to prevent order loss. Note: appointment confirmation already includes Google Maps link — missing is warehouse entrance photo and parking directions.", type:"Baseline"}, biz:{text:"15 min grace period for no-shows. Surface slot availability forecast.", desc:"Allow 15 min late arrival before no-show. Show slot availability forecast to reduce last-minute pressure", type:"Expected"}, frontstage:"15-min slots. 'Schedule between 1 hour and 2 days ahead' rule shown on screen. 1 active appointment. Unavailable slots marked with X (past cutoff) but no explanation why. Invoice selection at bottom of slot list (below fold — users miss it). Reschedule via 'Change time' button. Cancel via confirmation dialog ('Are you sure?') with no penalty warning. Calendar per-location via dropdown (6+ locations).", backstage:"30–40 per slot. Cutoff: ≤20=1h, ≤100=2h, 300+=3h. No-show 30min→cancel. Orders 1–500 items. Variable daily slot capacity. Cancel has no penalty. No-show policy exists but cancel flow doesn't reference it. Reschedule shows time slots only — may not properly re-link all selected invoices (client-reported bug).", support:"Capacity counter. Cutoff algorithm. Auto-cancel job. Extension logic. Reschedule API." },
        { id:"delegate_pickup", title:"Delegate Pickup", desc:"Send a unique link to someone else to collect on your behalf — 7-day validity", icon:Share2, feeling:-0.5, personaA:"Sent link, friend accepted in 2 min", personaB:"Does friend need account?", feedback:{text:"BBB: staff refused valid delegation.", desc:"Multiple BBB complaints describe staff refusing to honour valid delegation links, citing internal policies not reflected in the app. One reviewer reports driving 45 minutes only to be turned away despite having sent a valid delegation in advance."}, competitor:"Target, Apple: order confirmation + ID.", ux:{text:"Delegation QR visible to delegate + real-time status", desc:"Delegate gets own QR with live status. Both parties see confirmation. Staff sees verified delegation in POS", type:"Expected", gap:3}, biz:{text:"Sync to staff POS. Training. Audit trail.", desc:"Push delegation data to warehouse POS in real-time. Mandatory training for all staff. Full audit trail", type:"Baseline"}, frontstage:"Unique link → register/login → accept. 7-day validity.", backstage:"Staff check own system. Delegation not always synced to POS.", support:"Delegation token system (7-day TTL). POS integration gap." },
      ]},
      { id:"arrival", label:"Arriving & Queue", icon:Navigation, color:"#85aecf", steps:[
        { id:"geofence", title:"Geofence Trigger", desc:"App detects arrival via location and prompts queue entry", icon:MapPin, feeling:0.5, personaA:"Phone buzzed — I know where to go", personaB:"No notification, where do I check in?", feedback:{text:"Works when enabled. Many don't grant location.", desc:"MoneyAt30 reviewer notes the geofence works well when location is enabled, but many users never grant location permission. When absent, there is no fallback — users must find the QR screen independently with no in-app guidance on where it is."}, competitor:"Bluedot: Improves on-time prep. 'I'm here' fallback.", ux:{text:"Geofence + manual 'I'm arriving' button", desc:"Keep geofence for location-enabled users. Add prominent 'I'm arriving' button for everyone else", type:"Baseline"}, biz:null, frontstage:"If location on: push + CTA. If not: find QR independently.", backstage:"No pre-arrival prep. Picking starts only after queue join.", support:"Geofence service. Per-location radius. No prep workflow on arrival." },
        { id:"qr_scan", title:"QR Check-in", desc:"Scan QR code on warehouse TV screen to enter the pickup queue", icon:ScanLine, feeling:-0.5, personaA:"Found the TV with QR easily", personaB:"QR screen hard to find", feedback:{text:"Positive once found. Parking confusion.", desc:"MoneyAt30 and Wanderlog reviewers note the QR TV screen is easy to use once found, but first-timers report confusion in the parking lot. Multiple reviewers mention circling the lot before finding the entrance and check-in screen."}, competitor:"Walmart: numbered bays. KIOSK: self-service.", ux:{text:"Wayfinding in push notification", desc:"Include warehouse entrance photo, parking guidance, and QR screen location in the arrival notification", type:"Expected"}, biz:{text:"Numbered parking bays + signage", desc:"Number parking bays and add clear signage from lot to check-in. Low cost, high impact for first-timers", type:"Expected"}, frontstage:"Large TV with QR code at warehouse entrance/pickup zone. Scan — check-in + queue position. Simple layout: one entrance — pickup zone — fenced off beyond. Assistance desk nearby for payments, questions, returns (~5% of traffic).", backstage:"QR code displayed on large screen. Warehouse layout simple — single entrance, pickup zone immediately visible. Signage details vary by location.", support:"Rotating QR service. Kiosk display app. Queue entry API." },
        { id:"auth_check", title:"Auth Check", desc:"System verifies identity, delegations, and selects the right account", icon:ShieldCheck, feeling:0, personaA:"Straight through", personaB:"Account selection confusing", feedback:{text:"Staff inconsistency with delegation.", desc:"JustBid FAQ and BBB complaints both reference staff inconsistency with delegation verification. Some staff accept the delegation QR, others demand additional verification or refuse outright, citing internal guidelines not reflected in the app."}, competitor:"IKEA: no ID for low-value. Tiered verification.", ux:{text:"Auto-select when single active account", desc:"Skip account selection when only one has active orders. Auto-detect and pre-select delegated account", type:"Delighter"}, biz:{text:"Photo ID required for all pickups (per invoice policy)", desc:"Invoice states: 'Your valid photo ID is required for all order pickups to ensure the security and integrity of every transaction.' No tiered system — ID always required.", type:"Expected"}, frontstage:"System checks authorizations → account selector if needed.", backstage:"Auth flow: authorizations? → orders? → accounts? → select/auto.", support:"Auth API. Account-order mapping. Delegation lookup." },
        { id:"queue_joined", title:"Join Queue", desc:"Queue number assigned, wait for your order to be picked from warehouse", icon:Ticket, feeling:0.5, personaA:"Queue number instantly", personaB:"How long is the wait?", feedback:{text:"Position shown, no time estimate.", desc:"Wanderlog averages ~15 minute waits; Yelp cites 1+ hour waits on busy days. Queue position is shown but with no time estimate, users have no basis for whether to wait in their car or stay nearby, leading to missed calls and wasted trips. Client reports: when warehouse is behind on appointments, customers can't check in and must repeatedly scan QR to see if items are ready. Users want virtual scheduled queue — check in once, get notified."}, competitor:"High walkaway rate when no wait estimate shown. Time estimates reduce walkaway significantly.", ux:{text:"Wait time estimate + virtual queue from car + auto-notify when ready", desc:"Show estimated minutes based on position, pick time, order size. Virtual queue lets users wait in their car", type:"Expected", gap:4}, biz:{text:"Time estimation algorithm (items/staff ratio)", desc:"Model: avg pick time × order size × staff on shift = estimated wait. Feed into queue display", type:"Baseline"}, frontstage:"Queue number shown on warehouse screen and in app with real-time progress updates. No time estimate.", backstage:"Sequential picking. Time varies by order size. Progress visible to users on screen and in app. No time estimation algorithm.", support:"Queue assignment. Position API. No estimation. No 'approaching' trigger." },
      ]},
      { id:"collecting", label:"Collecting Items", icon:Package, color:"#82ce9e", steps:[
        { id:"order_picked", title:"Order Ready", desc:"Staff finishes picking your items and sends push notification", icon:BellRing, feeling:1, personaA:"Push notification — ready!", personaB:"Almost missed it — noisy warehouse", feedback:{text:"Noisy environment. Easy to miss.", desc:"Yelp reviews of the Lincoln warehouse specifically mention difficulty hearing order-ready calls due to warehouse noise. The standard push notification sound is indistinguishable from other apps, and several reviewers missed their turn and had to rejoin the queue."}, competitor:"Chick-fil-A: distinct sound. SMS backup.", ux:{text:"Distinct vibration + SMS backup + 'You're next!' pre-alert", desc:"Unique vibration pattern + sound. SMS backup for poor signal. Pre-alert 2 positions before being called", type:"Baseline"}, biz:null, frontstage:"Push: 'Order ready! Proceed to counter.' Standard sound.", backstage:"Staff marks order ready → push notification sent. Items staged at pickup counter.", support:"Picking app. State: queued→picking→ready→handed_off." },
        { id:"show_qr", title:"Present QR + ID", desc:"Show queue QR code and government ID to staff at handoff counter", icon:Fingerprint, feeling:-0.5, personaA:"Quick scan, showed ID, done", personaB:"Had to dig for my QR", feedback:{text:"Fast when ready. Finding QR clunky.", desc:"MoneyAt30 reviewer describes navigating several taps to find the QR code while standing at the counter with staff waiting. The experience is fast for prepared users but creates pressure and friction at the exact moment of handoff."}, competitor:"Starbucks auto-surfaces. Wallet passes.", ux:{text:"Auto-surface QR on lock screen when called", desc:"Auto-surface QR as lock screen notification or Wallet pass when number is called — no app navigation needed", type:"Expected", gap:7}, biz:null, frontstage:"Navigate My Wins → find QR. Show to staff + ID.", backstage:"Staff scans QR, checks ID visually, logs handoff.", support:"QR tied to queue entry. Scanner app. Verification API. No Wallet." },
        { id:"receive_items", title:"Receive Items", desc:"Collect items at counter. Most customers take home to inspect. On-site returns possible at assistance desk. 'Appears New' label replacing 'New' to set expectations.", icon:Gift, feeling:1.5, personaA:"Everything packed — fast!", personaB:"Item missing. Broken item.", feedback:{text:"'Everything broken.' 'Not Found' acknowledged.", desc:"Yelp, App Store, and JustBid FAQ all document item condition issues. 'Everything broken' appears verbatim in multiple Yelp reviews. FAQ acknowledges Not Found items but offers only store credit with no photo documentation at time of pickup. Client clarifies: most inspection happens at home, not on-site. Return rate is similar to standard ecommerce. 'New' label recently changed to 'Appears New' to set expectations. Self-service returns in My Account is in backlog but keeps getting deprioritized."}, competitor:"Pre-verify before calling. Photo at packing.", ux:{text:"In-app 'Report issue' + photo receipt", desc:"Report issue button on confirmation screen with photo upload. Photo receipt of all items at handoff for disputes", type:"Baseline", gap:8}, biz:{text:"Pre-verify items. Photo at packing. Review refund policy.", desc:"Staff pre-verifies all items before calling customer. Photo at packing for proof. Review store-credit-only policy", type:"Baseline"}, frontstage:"Receive at counter. Most take home to inspect. On-site returns at assistance desk (one-stop: payments, questions, returns). No self-service returns in My Account yet (in backlog). Return rate similar to standard ecommerce despite open-box items.", backstage:"Picker locates by zone. Not Found flagged. No quality check before handoff. No photo at packing. 'Appears New' label rollout in progress. Returns at assistance desk — no self-service flow yet.", support:"Warehouse location DB. Item status. No photo capture. No in-app reporting." },
        { id:"confirmation", title:"Confirmation", desc:"Digital confirmation with item list, starts 5-day return window", icon:CheckCircle2, feeling:1.5, personaA:"Confirmation with everything listed", personaB:"No photo receipt", feedback:{text:"Invoices good. No photo receipt.", desc:"App Store reviewers appreciate the itemised confirmation email but note the absence of photos. Several reviews mention disputes where items were not as expected, and the text-only receipt provided insufficient evidence to support a claim."}, competitor:"Amazon: photos in history. Photo receipts reduce disputes significantly.", ux:{text:"Digital receipt with photos + 5-day return reminder", desc:"Email + in-app receipt with item photos, itemized costs, and return window reminder with link to initiate", type:"Delighter"}, biz:null, frontstage:"Confirmation lists items collected. Text-only, no photos. Returns: no self-service in My Account yet (backlog). Can return at assistance desk on-site or at any location. 5-day return window. 'Appears New' label rollout reducing condition disputes.", backstage:"Handoff complete. 5-day return window. Returns at any location.", support:"Fulfillment status. Return timer. Email-based return flow." },
      ]},
    ],
  },
];

const UX_IMPROVEMENTS = [
  // DO FIRST — high impact, low effort
  { id: 1, title: "Calendar day-type labels", desc: "Add '(Appointment)' / '(Walk-in)' / '(Both)' labels to calendar days on scheduling screen", quadrant: "do-first", impact: 0.94, effort: 0.12, source: ["customer", "client"], stepId: "choose_method", gapId: 5 },
  { id: 2, title: "Invoice select-all banner", desc: "'You have X pending invoices — select all?' above time slots. Users schedule per-invoice because selection is below fold", quadrant: "do-first", impact: 0.88, effort: 0.22, source: ["customer"], stepId: "book_slot", gapId: null },
  { id: 3, title: "Pickup deadline reminders", desc: "Push notifications at 48h / 24h / 2h before expiry. $700+ losses reported", quadrant: "do-first", impact: 0.95, effort: 0.32, source: ["client"], stepId: "view_deadline", gapId: 2 },
  { id: 4, title: "Queue time estimate", desc: "Show estimated minutes based on queue position + order size", quadrant: "do-first", impact: 0.84, effort: 0.40, source: ["client"], stepId: "queue_joined", gapId: 4 },
  { id: 5, title: "Reschedule order confirmation", desc: "Show invoice summary before confirming reschedule. Orders sometimes drop silently", quadrant: "do-first", impact: 0.78, effort: 0.16, source: ["customer"], stepId: "book_slot", gapId: 9 },
  { id: 6, title: "Warehouse delay notifications", desc: "Proactive push when warehouse is behind on appointments. Stops repeated QR scanning", quadrant: "do-first", impact: 0.74, effort: 0.36, source: ["customer"], stepId: "queue_joined", gapId: null },
  { id: 7, title: "Payment completion push", desc: "Push notification when overnight charge succeeds. Paid/Failed badges exist but no push", quadrant: "do-first", impact: 0.70, effort: 0.26, source: ["ux-audit"], stepId: "payment_process", gapId: 6 },
  { id: 8, title: "Post-win next steps wizard", desc: "After winning: payment timeline → scheduling → deadline. Pure frontend CTA flow", quadrant: "do-first", impact: 0.70, effort: 0.08, source: ["ux-audit"], stepId: "win_notification", gapId: null },
  { id: 9, title: "Slot opening time clarity", desc: "'Between 1 hour and 2 days' rule confusing on edge cases (Monday→Wednesday)", quadrant: "do-first", impact: 0.68, effort: 0.44, source: ["customer"], stepId: "book_slot", gapId: null },
  // BIG BETS — high impact, high effort
  { id: 10, title: "Total cost on bid button", desc: "Show bid + 15% premium + $2 fee + tax near bid button. 'Bid $3' actual cost ~$6.36", quadrant: "big-bet", impact: 0.94, effort: 0.62, source: ["ux-audit"], stepId: "learn_bidding", gapId: 1 },
  { id: 11, title: "Auto-extend deadline", desc: "Auto-extend pickup deadline when no slots available. Client actively building this", quadrant: "big-bet", impact: 0.88, effort: 0.74, source: ["client"], stepId: "view_deadline", gapId: 2 },
  { id: 12, title: "Scheduling wizard", desc: "One-page booking wizard replacing complex multi-screen flow with 10+ hidden rules", quadrant: "big-bet", impact: 0.95, effort: 0.86, source: ["ux-audit"], stepId: "understand_pickup", gapId: 5 },
  { id: 13, title: "Virtual queue", desc: "Check in once, wait anywhere, get notified when ready. Replaces QR polling pattern", quadrant: "big-bet", impact: 0.78, effort: 0.68, source: ["customer"], stepId: "queue_joined", gapId: 4 },
  { id: 14, title: "Onboarding tour", desc: "First-run walkthrough for auction vs Last Chance + fee structure", quadrant: "big-bet", impact: 0.84, effort: 0.58, source: ["client"], stepId: "first_open", gapId: null },
  { id: 15, title: "Delegation POS sync", desc: "Push delegation data to warehouse POS in real-time + mandatory staff training", quadrant: "big-bet", impact: 0.72, effort: 0.80, source: ["ux-audit"], stepId: "delegate_pickup", gapId: 3 },
  { id: 16, title: "Auto-surface QR", desc: "Lock screen notification or Wallet pass when number is called — no app navigation", quadrant: "big-bet", impact: 0.70, effort: 0.56, source: ["ux-audit"], stepId: "show_qr", gapId: 7 },
  // QUICK FILLS — low impact, low effort
  { id: 17, title: "In-context help popups", desc: "Tooltips at decision points: cutoff rules, booking window, no-show policy", quadrant: "quick-fill", impact: 0.44, effort: 0.12, source: ["ux-audit", "client"], stepId: "book_slot", gapId: null },
  { id: 18, title: "Parking + entrance photo", desc: "Warehouse entrance photo in appointment confirmation. One-time upload per location", quadrant: "quick-fill", impact: 0.40, effort: 0.26, source: ["client"], stepId: "qr_scan", gapId: null },
  { id: 19, title: "Cancel penalty warning", desc: "Show consequences in cancel dialog instead of just 'Are you sure?'", quadrant: "quick-fill", impact: 0.32, effort: 0.18, source: ["ux-audit"], stepId: "book_slot", gapId: null },
  { id: 20, title: "Post-win FAQ block", desc: "Contextual FAQ on Wins screen. Rules at point of action, not in global FAQ", quadrant: "quick-fill", impact: 0.36, effort: 0.36, source: ["client"], stepId: "win_notification", gapId: null },
  { id: 21, title: "'Appears New' label rollout", desc: "Finish replacing 'Condition: New' across all locations. Screenshots show incomplete", quadrant: "quick-fill", impact: 0.24, effort: 0.08, source: ["screenshots"], stepId: "receive_items", gapId: null },
  { id: 22, title: "Map in push notification", desc: "Include navigation link in arrival push, not just in confirmation screen", quadrant: "quick-fill", impact: 0.26, effort: 0.30, source: ["ux-audit"], stepId: "geofence", gapId: null },
  // LATER — low impact, high effort
  { id: 23, title: "Photos in invoice/receipt", desc: "Item photos at packing stage for receipt + dispute resolution", quadrant: "later", impact: 0.44, effort: 0.62, source: ["client"], stepId: "confirmation", gapId: null },
  { id: 24, title: "Self-service returns", desc: "Returns flow in My Account. In backlog, keeps getting deprioritized", quadrant: "later", impact: 0.48, effort: 0.78, source: ["client"], stepId: "receive_items", gapId: 8 },
  { id: 25, title: "Busy time heatmap", desc: "Google-style busy hours on calendar. Needs historical data pipeline", quadrant: "later", impact: 0.36, effort: 0.72, source: ["ux-audit"], stepId: "choose_method", gapId: null },
  { id: 26, title: "Last Chance countdown", desc: "Live timer + hourly price schedule for Last Chance items", quadrant: "later", impact: 0.42, effort: 0.88, source: ["client"], stepId: "learn_lastchance", gapId: null },
  { id: 27, title: "In-app issue reporting", desc: "Report issue button with photo upload at pickup. Needs new flow + backend", quadrant: "later", impact: 0.26, effort: 0.64, source: ["ux-audit"], stepId: "receive_items", gapId: 8 },
];

const TC = { Delighter:{color:"#5cbcd4",icon:Sparkles}, Expected:{color:"#FFDAB9",icon:Target}, "Baseline":{color:"#64c8a0",icon:Zap} };
const SC = { Critical:"#ff635d", High:"#FF8C69", Medium:"#FFDAB9" };

/* ═══ SOURCE TAGS — per step, per row ═══ */
const SRC = {
  first_open: {
    feedback: [{l:"App Store",u:"https://apps.apple.com/us/app/justbid-com/id6738100468"}],
    competitor: [{l:"Shopify",u:"https://www.shopify.com/retail/bopis"}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Internal doc",u:null}],
  },
  learn_bidding: {
    feedback: [{l:"MoneyAt30",u:"https://moneyat30.com/justbid-com-review-is-it-legit/"},{l:"BBB",u:"https://www.bbb.org/us/ca/sacramento/profile/online-auctions/justbidcom-1156-90100178/complaints"}],
    competitor: [{l:"Proxibid BBB",u:"https://www.bbb.org/us/ca/sacramento/profile/online-auctions/justbidcom-1156-90100178/complaints"}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Internal doc",u:null}],
  },
  learn_lastchance: {
    feedback: [{l:"App Store",u:"https://apps.apple.com/us/app/justbid-com/id6738100468"}],
    competitor: [{l:"Tophatter",u:null},{l:"Whatnot",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Internal doc",u:null}],
  },
  win_notification: {
    feedback: [{l:"App Store",u:"https://apps.apple.com/us/app/justbid-com/id6738100468"}],
    competitor: [{l:"Shopify BOPIS",u:"https://www.shopify.com/enterprise/blog/click-and-collect"}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Internal doc",u:null}],
  },
  payment_process: {
    feedback: [{l:"JustBid FAQ",u:"https://www.justbid.com/faq"},{l:"App Screenshots Mar 2026",u:null}],
    competitor: [{l:"eBay",u:null},{l:"StockX",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Internal doc",u:null}],
  },
  understand_pickup: {
    feedback: [{l:"BBB",u:"https://www.bbb.org/us/ca/sacramento/profile/online-auctions/justbidcom-1156-90100178/complaints"}],
    competitor: [{l:"Shopify",u:"https://www.shopify.com/retail/bopis"},{l:"Amazon",u:null}],
    frontstage: [{l:"JustBid FAQ",u:"https://www.justbid.com/faq"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  view_deadline: {
    feedback: [{l:"BBB",u:"https://www.bbb.org/us/ca/sacramento/profile/online-auctions/justbidcom-1156-90100178/complaints"},{l:"JustBid FAQ",u:"https://www.justbid.com/faq"}],
    competitor: [{l:"Amazon",u:null},{l:"Instacart",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  choose_method: {
    feedback: [{l:"Wanderlog",u:"https://wanderlog.com/place/details/11069671/justbidcom"},{l:"Yelp",u:"https://www.yelp.com/biz/justbid-warehouse-lincoln"},{l:"Client Feedback",u:null}],
    competitor: [{l:"Waitwhile",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  book_slot: {
    feedback: [{l:"App Store",u:"https://apps.apple.com/us/app/justbid-com/id6738100468"},{l:"Client Feedback",u:null}],
    competitor: [{l:"Shopify BOPIS",u:"https://www.shopify.com/enterprise/blog/click-and-collect"}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  delegate_pickup: {
    feedback: [{l:"BBB",u:"https://www.bbb.org/us/ca/sacramento/profile/online-auctions/justbidcom-1156-90100178/complaints"}],
    competitor: [{l:"Target",u:null},{l:"Apple",u:null},{l:"IKEA",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  geofence: {
    feedback: [{l:"MoneyAt30",u:"https://moneyat30.com/justbid-com-review-is-it-legit/"}],
    competitor: [{l:"Bluedot",u:null},{l:"Shopify",u:"https://www.shopify.com/enterprise/blog/click-and-collect"}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  qr_scan: {
    feedback: [{l:"MoneyAt30",u:"https://moneyat30.com/justbid-com-review-is-it-legit/"},{l:"Wanderlog",u:"https://wanderlog.com/place/details/11069671/justbidcom"}],
    competitor: [{l:"Walmart",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  auth_check: {
    feedback: [{l:"JustBid FAQ",u:"https://www.justbid.com/faq"},{l:"BBB",u:"https://www.bbb.org/us/ca/sacramento/profile/online-auctions/justbidcom-1156-90100178/complaints"}],
    competitor: [{l:"IKEA",u:null},{l:"Apple",u:null}],
    frontstage: [{l:"Pickup Flow PDF",u:null}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  queue_joined: {
    feedback: [{l:"Wanderlog",u:"https://wanderlog.com/place/details/11069671/justbidcom"},{l:"Yelp",u:"https://www.yelp.com/biz/justbid-warehouse-lincoln"},{l:"Client Feedback",u:null}],
    competitor: [{l:"Waitwhile",u:null},{l:"Qminder",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  order_picked: {
    feedback: [{l:"Yelp",u:"https://www.yelp.com/biz/justbid-warehouse-lincoln"}],
    competitor: [{l:"Chick-fil-A",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  show_qr: {
    feedback: [{l:"MoneyAt30",u:"https://moneyat30.com/justbid-com-review-is-it-legit/"}],
    competitor: [{l:"Starbucks",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  receive_items: {
    feedback: [{l:"Yelp",u:"https://www.yelp.com/biz/justbid-warehouse-lincoln"},{l:"App Store",u:"https://apps.apple.com/us/app/justbid-com/id6738100468"},{l:"JustBid FAQ",u:"https://www.justbid.com/faq"},{l:"Client Feedback",u:null}],
    competitor: [{l:"Rakuten Ready",u:null},{l:"Costco",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
  confirmation: {
    feedback: [{l:"App Store",u:"https://apps.apple.com/us/app/justbid-com/id6738100468"}],
    competitor: [{l:"Amazon",u:null}],
    frontstage: [{l:"JustBid.com",u:"https://www.justbid.com"}],
    backstage: [{l:"Pickup Flow PDF",u:null}],
  },
};

function SourceTags({ stepId, rowKey }) {
  const tags = SRC[stepId]?.[rowKey];
  if (!tags || !tags.length) return null;
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
      {tags.map((t,i) => t.u ? (
        <a key={i} href={t.u} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
          style={{ fontSize:11, padding:"1px 6px", borderRadius:4, background:"#3e3e38", color:"#999990",
            textDecoration:"none", display:"inline-flex", alignItems:"center", gap:3,
            cursor:"pointer", transition:"color .15s" }}
          onMouseEnter={e=>e.currentTarget.style.color="#FFDAB9"}
          onMouseLeave={e=>e.currentTarget.style.color="#999990"}
        >{t.l} <ExternalLink size={8} style={{marginLeft:1}} /></a>
      ) : (
        <span key={i} style={{ fontSize:11, padding:"1px 6px", borderRadius:4, background:"#3e3e3860", color:"#787870" }}>{t.l}</span>
      ))}
    </div>
  );
}

/* ═══ FEELING CURVE — the narrative spine ═══ */
function BigCurve({ steps, colors, activeId, onSelect }) {
  const w = 960; const h = 140; const px = 48; const py = 24;
  const pts = steps.map((s, i) => ({
    x: px + i * ((w - px*2) / Math.max(steps.length-1,1)),
    y: h/2 - s.feeling * ((h - py*2) / 4),
    ...s,
  }));
  let d = pts.length === 1 ? `M${pts[0].x},${pts[0].y}` :
    pts.reduce((a,p,i) => { if(!i) return `M${p.x},${p.y}`; const pv=pts[i-1], cx=(pv.x+p.x)/2; return `${a} C${cx},${pv.y} ${cx},${p.y} ${p.x},${p.y}`; },"");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display:"block" }}>
      <line x1={0} y1={h/2} x2={w} y2={h/2} stroke="#3e3e38" strokeWidth="1" strokeDasharray="4 4" />
      <text x={12} y={py+4} fill="#787870" fontSize="9" fontFamily="inherit">positive</text>
      <text x={12} y={h-py+4} fill="#787870" fontSize="9" fontFamily="inherit">negative</text>
      <path d={d + ` L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`} fill="url(#curveGrad)" />
      <path d={d} fill="none" stroke="#9a9a92" strokeWidth="1.5" />
      <defs><linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9a9a92" stopOpacity=".08" /><stop offset="100%" stopColor="#9a9a92" stopOpacity="0" />
      </linearGradient></defs>
      {pts.map((p,i) => {
        const gap = UX_GAPS.find(g => g.stepId === p.id);
        const isActive = activeId === p.id;
        const c = colors[i] || "#9a9a92";
        return (
          <g key={p.id} onClick={() => onSelect(p.id)} style={{ cursor:"pointer" }}>
            {gap && <circle cx={p.x} cy={p.y} r="16" fill={`${SC[gap.severity]}12`} stroke={SC[gap.severity]} strokeWidth="1" strokeDasharray="3 2" />}
            {gap && <text x={p.x} y={p.y + 26} textAnchor="middle" fill={SC[gap.severity]} fontSize="11" fontWeight="800" fontFamily="inherit">#{gap.rank}</text>}
            <circle cx={p.x} cy={p.y} r={isActive ? 7 : 5} fill={isActive ? c : "#262624"} stroke={c} strokeWidth={isActive ? 3 : 2}
              style={{ transition:"all .2s" }} />
            <text x={p.x} y={p.y - 14} textAnchor="middle" fill={isActive ? "#F7FAFC" : "#999990"} fontSize="10" fontWeight={isActive ? 700 : 500} fontFamily="inherit"
              style={{ transition:"fill .2s" }}>
              {p.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══ IMPACT / EFFORT MATRIX ═══ */
function ImpactMatrix({ items, onSelect }) {
  const QC = {
    "do-first": { color: "#E24B4A", label: "Do first" },
    "big-bet": { color: "#BA7517", label: "Big bets" },
    "quick-fill": { color: "#378ADD", label: "Quick fills" },
    "later": { color: "#6e6e68", label: "Later" },
  };
  const W = 800, H = 400, PAD = 40;
  return (
    <div style={{ background: "#1e1e1c", border: "1px solid #3e3e38", borderRadius: 16, padding: "24px 20px 16px", overflow: "hidden" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x={PAD} y={0} width={(W-PAD)/2} height={H/2} fill="#64c8a0" opacity="0.04" />
        <rect x={PAD+(W-PAD)/2} y={0} width={(W-PAD)/2} height={H/2} fill="#BA7517" opacity="0.04" />
        <rect x={PAD} y={H/2} width={(W-PAD)/2} height={H/2} fill="#378ADD" opacity="0.04" />
        <rect x={PAD+(W-PAD)/2} y={H/2} width={(W-PAD)/2} height={H/2} fill="#888780" opacity="0.04" />
        <line x1={PAD} y1={H/2} x2={W} y2={H/2} stroke="#3e3e38" strokeWidth="1" />
        <line x1={PAD+(W-PAD)/2} y1={0} x2={PAD+(W-PAD)/2} y2={H} stroke="#3e3e38" strokeWidth="1" />
        <line x1={PAD} y1={0} x2={PAD} y2={H} stroke="#3e3e38" strokeWidth="1.5" />
        <line x1={PAD} y1={H} x2={W} y2={H} stroke="#3e3e38" strokeWidth="1.5" />
        <text x={PAD-8} y={H/2} textAnchor="middle" fill="#787870" fontSize="10" fontFamily="inherit" transform={`rotate(-90,${PAD-8},${H/2})`}>impact</text>
        <text x={PAD+(W-PAD)/2} y={H+16} textAnchor="middle" fill="#787870" fontSize="10" fontFamily="inherit">effort</text>
        <text x={PAD+12} y={16} fill="#64c8a0" fontSize="10" fontFamily="inherit" opacity="0.6">do first</text>
        <text x={W-8} y={16} textAnchor="end" fill="#BA7517" fontSize="10" fontFamily="inherit" opacity="0.6">big bets</text>
        <text x={PAD+12} y={H-8} fill="#378ADD" fontSize="10" fontFamily="inherit" opacity="0.6">quick fills</text>
        <text x={W-8} y={H-8} textAnchor="end" fill="#888780" fontSize="10" fontFamily="inherit" opacity="0.6">later</text>
        {items.map(item => {
          const x = PAD + item.effort * (W - PAD);
          const y = (1 - item.impact) * H;
          const c = QC[item.quadrant]?.color || "#888";
          return (
            <g key={item.id} onClick={() => onSelect(item)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r="14" fill={c} opacity="0.15" />
              <circle cx={x} cy={y} r="10" fill={c} />
              <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="inherit">{item.id}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
        {Object.entries(QC).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: v.color }} />
            <span style={{ fontSize: 11, color: "#999990" }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ ISSUE LIST ═══ */
function IssueList({ items, onNavigate }) {
  const QC = {
    "do-first": { color: "#E24B4A", label: "Do first — high impact, low effort" },
    "big-bet": { color: "#BA7517", label: "Big bets — high impact, high effort" },
    "quick-fill": { color: "#378ADD", label: "Quick fills — low impact, low effort" },
    "later": { color: "#6e6e68", label: "Later — low impact, high effort" },
  };
  const SRC_COLORS = { customer: "#FF8C69", client: "#64c8a0", "ux-audit": "#85aecf", screenshots: "#FFDAB9" };
  const groups = ["do-first", "big-bet", "quick-fill", "later"];
  return (
    <div>
      {groups.map(q => {
        const group = items.filter(i => i.quadrant === q);
        if (!group.length) return null;
        const qc = QC[q];
        return (
          <div key={q} style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: qc.color, marginBottom: 10 }}>{qc.label}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {group.map(item => (
                <div key={item.id} onClick={() => onNavigate(item)}
                  style={{ padding: "14px 18px", background: "#1e1e1c", border: `1px solid ${qc.color}18`, borderRadius: 12, cursor: "pointer", transition: "background .2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#262624"}
                  onMouseLeave={e => e.currentTarget.style.background = "#1e1e1c"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: qc.color, minWidth: 20 }}>#{item.id}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#F7FAFC" }}>{item.title}</span>
                    {item.gapId && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "#ff635d18", color: "#ff635d", fontWeight: 600 }}>Gap #{item.gapId}</span>}
                    <div style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 4 }}>
                      {item.source.map(s => (
                        <span key={s} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${SRC_COLORS[s] || "#888"}18`, color: SRC_COLORS[s] || "#888", fontWeight: 600, textTransform: "uppercase" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#A0AEC0", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════ */
function parseHash() {
  const hash = window.location.hash.replace("#", "");
  if (!hash || hash === "gaps") return { view: "gaps", step: null };
  const [v, s] = hash.split("/");
  if (v === "pre" || v === "post") return { view: v, step: s || null };
  return { view: "gaps", step: null };
}

export default function App() {
  const initial = parseHash();
  const [view, setView] = useState(initial.view);
  const [homeFlow, setHomeFlow] = useState(initial.view === "pre" || initial.view === "post" ? initial.view : "post");
  const [activeStep, setActiveStep] = useState(initial.step);
  const [hovered, setHovered] = useState(null);

  const blueprintRef = useRef(null);

  const scrollToStep = (stepId) => {
    setActiveStep(stepId);
    if (blueprintRef.current) {
      const el = blueprintRef.current.querySelector(`[data-step="${stepId}"]`);
      if (el) {
        const container = blueprintRef.current;
        const scrollLeft = el.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (el.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  };

  const scrollToGap = (stepId) => {
    setActiveStep(stepId);
    if (blueprintRef.current) {
      const col = blueprintRef.current.querySelector(`[data-step="${stepId}"]`);
      if (col) {
        const container = blueprintRef.current;
        const scrollLeft = col.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (col.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  };

  const flow = (view==="pre"||view==="post") ? FLOWS.find(f=>f.id===view) : null;
  const phases = flow ? flow.phases : [];
  const allSteps = phases.flatMap(p => p.steps.map(s => ({...s, phaseColor:p.color, phaseLabel:p.label})));
  const stepColors = phases.flatMap(p => p.steps.map(() => p.color));

  const effectiveActive = activeStep || (allSteps[0]?.id);
  const activeIndex = allSteps.findIndex(s => s.id === effectiveActive);
  const goPrev = useCallback(() => { if (activeIndex > 0) scrollToStep(allSteps[activeIndex - 1].id); }, [activeIndex, allSteps]);
  const goNext = useCallback(() => { if (activeIndex < allSteps.length - 1) scrollToStep(allSteps[activeIndex + 1].id); }, [activeIndex, allSteps]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!flow) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flow, goNext, goPrev]);

  useEffect(() => {
    if (flow && activeStep && blueprintRef.current) {
      const el = blueprintRef.current.querySelector(`[data-step="${activeStep}"]`);
      if (el) {
        const container = blueprintRef.current;
        const scrollLeft = el.offsetLeft - container.offsetLeft - (container.clientWidth / 2) + (el.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [flow, activeStep]);

  useEffect(() => {
    if (view === "gaps") {
      window.history.replaceState(null, "", "#gaps");
    } else if (view === "pre" || view === "post") {
      const slug = activeStep ? `${view}/${activeStep}` : view;
      window.history.replaceState(null, "", `#${slug}`);
    }
  }, [view, activeStep]);

  useEffect(() => {
    const onHashChange = () => {
      const { view: v, step: s } = parseHash();
      setView(v);
      setActiveStep(s);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? goNext() : goPrev(); }
    touchStart.current = null;
  };

  const colW = 280;
  const labelW = 110;
  const gridCols = flow ? `${labelW}px ${phases.flatMap(p=>p.steps.map(()=>`${colW}px`)).join(" ")}` : "";

  const isActive = (id) => id === effectiveActive;
  const cellStyle = (id) => ({
    padding: "17px 22px",
    background: isActive(id) ? "#1a1a18" : hovered===id ? "#222220" : "transparent",
    borderRight: "1px solid #3e3e38",
    borderBottom: "1px solid #3e3e38",
    cursor: "pointer",
    overflow: "hidden",
    boxSizing: "border-box",
    opacity: isActive(id) || hovered===id ? 1 : 0.35,
    transition: "none",
  });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:"#262624", minHeight:"100vh", color:"#E2E8F0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin:0; }
        .journey-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .home-container { max-width:860px; margin:0 auto; padding:56px 48px 120px; }
        @media (max-width:768px) {
          .journey-grid { grid-template-columns:1fr !important; }
          .home-container { padding:32px 16px 80px !important; }
        }
      `}</style>

      {/* ══════ HOMEPAGE ══════ */}
      {view === "gaps" && (
        <div className="home-container">
          <div style={{ marginBottom:36 }}>
            <h1 style={{ fontSize:34, fontWeight:700, margin:"0 0 4px", letterSpacing:-.5, color:"#F7FAFC" }}>JustBid Pickup Journey Map</h1>
            <p style={{ fontSize:17, color:"#999990", margin:0 }}>Service blueprint · User research · Competitor analysis</p>
          </div>

          {(() => {
            const hf = FLOWS.find(f=>f.id===homeFlow);
            const hPhases = hf ? hf.phases : [];
            const hSteps = hPhases.flatMap(p => p.steps.map(s => ({...s, phaseColor:p.color, phaseLabel:p.label})));
            const hColors = hPhases.flatMap(p => p.steps.map(() => p.color));
            const criticalGaps = UX_GAPS.filter(g => g.severity === "Critical" && hf.phases.some(p => p.steps.some(s => s.id === g.stepId)));
            const allCritical = UX_GAPS.filter(g => g.severity === "Critical");
            const gapsToShow = criticalGaps.length > 0 ? criticalGaps : allCritical.slice(0, 3);
            return (
              <div>
                {/* Journey toggle */}
                <div style={{ display:"flex", gap:4, marginBottom:32 }}>
                  {FLOWS.map(f=>(
                    <button key={f.id} onClick={()=>setHomeFlow(f.id)} style={{
                      fontSize:15, fontWeight:700, padding:"10px 20px", borderRadius:10,
                      border: homeFlow===f.id ? `2px solid ${f.accent}` : "2px solid #3e3e38",
                      cursor:"pointer", fontFamily:"inherit",
                      background: homeFlow===f.id ? `${f.accent}10` : "transparent",
                      color: homeFlow===f.id ? f.accent : "#999990",
                      transition:"all .2s", flex:1,
                    }}>{f.title}</button>
                  ))}
                </div>

                {/* Hero curve */}
                <div style={{ background:"#1e1e1c", border:"1px solid #3e3e38", borderRadius:20, padding:"28px 20px 16px", marginBottom:32 }}>
                  <BigCurve steps={hSteps} colors={hColors} activeId={null} onSelect={(id)=>{setView(hf.id);setActiveStep(id);}} />
                  <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:12 }}>
                    {hPhases.map(ph=>(
                      <div key={ph.id} style={{ display:"flex",alignItems:"center",gap:5 }}>
                        <div style={{ width:8,height:8,borderRadius:4,background:ph.color }} />
                        <span style={{ fontSize:12,color:"#999990" }}>{ph.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key issues */}
                <div style={{ marginBottom:32 }}>
                  <p style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, color:"#ff635d", marginBottom:16 }}>Key issues</p>
                  <div className="journey-grid" style={{ gap:12 }}>
                    {gapsToShow.map(gap => {
                      const parentFlow = FLOWS.find(f => f.phases.some(p => p.steps.some(s => s.id === gap.stepId)));
                      const step = hPhases.flatMap(p=>p.steps).find(s=>s.id===gap.stepId) || FLOWS.flatMap(f=>f.phases).flatMap(p=>p.steps).find(s=>s.id===gap.stepId);
                      const sevColor = SC[gap.severity];
                      return (
                        <div key={gap.rank} onClick={()=>{if(parentFlow){setView(parentFlow.id);setTimeout(()=>scrollToGap(gap.stepId),100);}}}
                          style={{ padding:"20px 24px", background:"#1e1e1c", border:`1px solid ${sevColor}20`, borderRadius:14, cursor:"pointer", transition:"background .2s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#262624"}
                          onMouseLeave={e=>e.currentTarget.style.background="#1e1e1c"}
                        >
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                            <span style={{ fontSize:24, fontWeight:800, color:sevColor }}>{gap.rank}</span>
                            <span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.8, padding:"2px 6px",borderRadius:4,background:`${sevColor}18`,color:sevColor }}>{gap.severity}</span>
                            <div style={{flex:1}}/>
                            <ArrowRight size={16} color="#999990" />
                          </div>
                          <p style={{ fontSize:18, fontWeight:700, color:"#F7FAFC", margin:"0 0 8px", lineHeight:1.4 }}>{gap.title}</p>
                          <p style={{ fontSize:14, color:"#A0AEC0", margin:"0 0 12px", lineHeight:1.6 }}>{gap.evidence}</p>
                          {step && step.ux && (
                            <div style={{ padding:"8px 10px",background:"#85aecf08",borderRadius:8,marginBottom:8 }}>
                              <p style={{ fontSize:12,fontWeight:600,color:"#85aecf",margin:"0 0 2px" }}>UX: {step.ux.text}</p>
                              {step.ux.desc && <p style={{ fontSize:11,color:"#A0AEC0",margin:0,lineHeight:1.45 }}>{step.ux.desc}</p>}
                            </div>
                          )}
                          {step && step.biz && (
                            <div style={{ padding:"8px 10px",background:"#64c8a008",borderRadius:8,marginBottom:8 }}>
                              <p style={{ fontSize:12,fontWeight:600,color:"#64c8a0",margin:"0 0 2px" }}>BIZ: {step.biz.text}</p>
                              {step.biz.desc && <p style={{ fontSize:11,color:"#A0AEC0",margin:0,lineHeight:1.45 }}>{step.biz.desc}</p>}
                            </div>
                          )}
                          {step && step.competitor && (
                            <div style={{ padding:"8px 10px",background:"#FF8C6908",borderRadius:8 }}>
                              <span style={{ fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,color:"#FF8C69" }}>Competitors</span>
                              <p style={{ fontSize:12,color:"#A0AEC0",margin:"4px 0 0",lineHeight:1.45 }}>{step.competitor}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gaps matrix */}
                <div style={{ marginBottom:32 }}>
                  <p style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, color:"#999990", marginBottom:16 }}>Gaps matrix</p>
                  <ImpactMatrix items={UX_IMPROVEMENTS} onSelect={(item) => {
                    const parentFlow = FLOWS.find(f => f.phases.some(p => p.steps.some(s => s.id === item.stepId)));
                    if (parentFlow) { setView(parentFlow.id); setTimeout(() => scrollToGap(item.stepId), 100); }
                  }} />
                </div>

                {/* All improvements */}
                <div style={{ marginBottom:32 }}>
                  <p style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, color:"#999990", marginBottom:16 }}>All improvements</p>
                  <IssueList items={UX_IMPROVEMENTS} onNavigate={(item) => {
                    const parentFlow = FLOWS.find(f => f.phases.some(p => p.steps.some(s => s.id === item.stepId)));
                    if (parentFlow) { setView(parentFlow.id); setTimeout(() => scrollToGap(item.stepId), 100); }
                  }} />
                </div>

                {/* Explore full map */}
                <button onClick={()=>{setView(hf.id);setActiveStep(null);}} style={{
                  width:"100%", padding:"16px", background:"transparent", border:"1px solid #3e3e38", borderRadius:12,
                  cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:600, color:hf.accent,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .2s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.background="#1e1e1c"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >
                  Explore full {hf.title} map <ArrowRight size={16} />
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════ JOURNEY VIEW ══════ */}
      {flow && (
        <div>
          {/* Header */}
          <div style={{ padding:"16px 32px", display:"flex",alignItems:"center",gap:14, position:"sticky",top:0,zIndex:60,background:"#262624", borderBottom:"1px solid #3e3e38" }}>
            <button onClick={()=>setView("gaps")} style={{ background:"#262624",border:"1px solid #3e3e38",borderRadius:10,width:38,height:38, cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <ChevronLeft size={18} color="#a8a8a0" />
            </button>
            <div>
              <h2 style={{ fontSize:24,fontWeight:700,margin:0,color:"#F7FAFC",letterSpacing:-.3 }}>{flow.title}</h2>
              <p style={{ fontSize:14,color:"#999990",margin:0 }}>{flow.subtitle}</p>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:6, alignItems:"center" }}>
              {FLOWS.filter(f=>f.id!==flow.id).map(f=>(
                <button key={f.id} onClick={()=>{setView(f.id);setActiveStep(null);}} style={{ fontSize:13,fontWeight:600,padding:"5px 12px",borderRadius:8, background:"#262624",color:"#a8a8a0",border:"1px solid #3e3e38",cursor:"pointer",fontFamily:"inherit", display:"flex",alignItems:"center",gap:4 }}><f.icon size={11} /> {f.title}</button>
              ))}
            </div>
          </div>

          {/* ══════ BLUEPRINT ══════ */}
          <div ref={blueprintRef} style={{ overflowX:"auto", padding:"0 0 200px" }}>
            <div style={{ display:"grid", gridTemplateColumns:gridCols, minWidth:"fit-content" }}>

              {/* Phases */}
              <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:"#787870",textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>Phases</div>
              {phases.map(ph=>(
                <div key={ph.id} style={{ gridColumn:`span ${ph.steps.length}`,padding:"20px 24px", display:"flex",alignItems:"center",gap:10, borderBottom:`2px solid ${ph.color}`,background:`${ph.color}06` }}>
                  <ph.icon size={18} color={ph.color} strokeWidth={1.6} />
                  <span style={{ fontSize:18,fontWeight:700,color:ph.color }}>{ph.label}</span>
                </div>
              ))}

              {/* Steps */}
              <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:"#787870",textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>Steps</div>
              {phases.map(ph=>ph.steps.map(st=>{
                const gap=UX_GAPS.find(g=>g.stepId===st.id);
                return(
                  <div key={st.id} data-step={st.id} onClick={()=>scrollToStep(st.id)} onMouseEnter={()=>setHovered(st.id)} onMouseLeave={()=>setHovered(null)}
                    style={{ ...cellStyle(st.id), display:"flex",flexDirection:"column",gap:4 }}>
                    <div>
                      <span style={{ fontSize:18,fontWeight:600,color:isActive(st.id)?"#F7FAFC":"#E2E8F0" }}>{st.title}</span>
                      {gap && <div style={{ fontSize:11,fontWeight:700,marginTop:3,padding:"1px 6px",borderRadius:4, display:"inline-flex",background:`${SC[gap.severity]}18`,color:SC[gap.severity],alignItems:"center",gap:3 }}><AlertTriangle size={8} />Gap #{gap.rank}</div>}
                    </div>
                    {st.desc && <p style={{ fontSize:14,color:isActive(st.id)?"#B2BEC3":"#999990",margin:0,lineHeight:1.45 }}>{st.desc}</p>}
                  </div>
                );
              }))}

              {/* Feelings */}
              <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:"#787870",textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>Feelings</div>
              {phases.map(ph=>{
                const w2=ph.steps.length*colW; const h2=100; const px2=colW/2;
                const pts2=ph.steps.map((s,i)=>({x:px2+i*colW,y:h2/2-s.feeling*((h2-16)/4),...s}));
                const gId=`c${ph.color.replace("#","")}`;
                let d2=pts2.length===1?`M${pts2[0].x},${pts2[0].y}`:pts2.reduce((a,p,i)=>{if(!i)return`M${p.x},${p.y}`;const pv=pts2[i-1],cx=(pv.x+p.x)/2;return`${a} C${cx},${pv.y} ${cx},${p.y} ${p.x},${p.y}`;},"");
                return(
                  <div key={ph.id} style={{ gridColumn:`span ${ph.steps.length}`, borderBottom:"1px solid #3e3e38",borderRight:"1px solid #3e3e38" }}>
                    <svg width="100%" height={h2} viewBox={`0 0 ${w2} ${h2}`} preserveAspectRatio="xMidYMid meet" style={{display:"block"}}>
                      <defs><linearGradient id={gId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ph.color} stopOpacity=".15"/><stop offset="100%" stopColor={ph.color} stopOpacity="0"/></linearGradient></defs>
                      <line x1={0} y1={h2/2} x2={w2} y2={h2/2} stroke="#3e3e38" strokeWidth="1"/>
                      {pts2.length>1&&<path d={`${d2} L${pts2[pts2.length-1].x},${h2} L${pts2[0].x},${h2} Z`} fill={`url(#${gId})`}/>}
                      <path d={d2} fill="none" stroke={ph.color} strokeWidth="2"/>
                      {pts2.map((p,i)=>(
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#262624" stroke={ph.color} strokeWidth="2"/>
                      ))}
                    </svg>
                  </div>
                );
              })}

              {/* User Feedback */}
              <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:"#ffb386",textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>User Feedback</div>
              {phases.map(ph=>ph.steps.map(st=>{
                const fb = st.feedback;
                return (
                  <div key={`feedback-${st.id}`} onClick={()=>scrollToStep(st.id)} onMouseEnter={()=>setHovered(st.id)} onMouseLeave={()=>setHovered(null)}
                    style={{ ...cellStyle(st.id) }}>
                    {typeof fb === "object" ? (
                      <>
                        <p style={{ fontSize:15,fontWeight:600,color:isActive(st.id)?"#E2E8F0":"#ffb386",margin:"0 0 6px",lineHeight:1.5 }}>{fb.text}</p>
                        <p style={{ fontSize:14,color:isActive(st.id)?"#B2BEC3":"#999990",margin:0,lineHeight:1.6 }}>{fb.desc}</p>
                      </>
                    ) : (
                      <p style={{ fontSize:15,color:isActive(st.id)?"#E2E8F0":"#B2BEC3",margin:0,lineHeight:1.65 }}>{fb}</p>
                    )}
                    <SourceTags stepId={st.id} rowKey="feedback" />
                  </div>
                );
              }))}

              {/* Gaps */}
              <div data-row="gaps" style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:"#ff635d",textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>Gaps</div>
              {phases.map(ph=>ph.steps.map(st=>{
                const gap=UX_GAPS.find(g=>g.stepId===st.id);
                return(
                  <div key={`gap-${st.id}`} data-gap={st.id} onClick={()=>scrollToStep(st.id)} onMouseEnter={()=>setHovered(st.id)} onMouseLeave={()=>setHovered(null)}
                    style={{ ...cellStyle(st.id) }}>
                    {gap ? (
                      <div>
                        <div style={{ height:2,background:SC[gap.severity],marginBottom:10,borderRadius:1 }} />
                        <div style={{ display:"flex",alignItems:"baseline",gap:8 }}>
                          <span style={{ fontSize:24,fontWeight:800,color:SC[gap.severity],lineHeight:1 }}>#{gap.rank}</span>
                          <p style={{ fontSize:14,fontWeight:600,color:"#F7FAFC",margin:0,lineHeight:1.4 }}>{gap.title}</p>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize:13,color:"#787870" }}>—</span>
                    )}
                  </div>
                );
              }))}

              {/* Actions */}
              <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:"#85aecf",textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>Actions</div>
              {phases.map(ph=>ph.steps.map(st=>{
                const ux=st.ux; const biz=st.biz;
                return(
                  <div key={`actions-${st.id}`} onClick={()=>scrollToStep(st.id)} onMouseEnter={()=>setHovered(st.id)} onMouseLeave={()=>setHovered(null)}
                    style={{ ...cellStyle(st.id) }}>
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {ux&&(
                        <div style={{ padding:"10px 12px",background:"#85aecf06",borderRadius:10 }}>
                          <p style={{ fontSize:16,color:isActive(st.id)?"#E2E8F0":"#B2BEC3",margin:"0 0 4px",lineHeight:1.55,fontWeight:600 }}>{ux.text}</p>
                          {ux.desc && <p style={{ fontSize:13,color:"#A0AEC0",margin:0,lineHeight:1.5 }}>{ux.desc}</p>}
                        </div>
                      )}
                      {biz&&(
                        <div style={{ padding:"10px 12px",background:"#64c8a006",borderRadius:10 }}>
                          <p style={{ fontSize:16,color:isActive(st.id)?"#E2E8F0":"#B2BEC3",margin:"0 0 4px",lineHeight:1.55,fontWeight:600 }}>{biz.text}</p>
                          {biz.desc && <p style={{ fontSize:13,color:"#A0AEC0",margin:0,lineHeight:1.5 }}>{biz.desc}</p>}
                        </div>
                      )}
                      {!ux&&!biz&&<span style={{ fontSize:13,color:"#787870" }}>—</span>}
                    </div>
                  </div>
                );
              }))}

              {/* Frontstage + Backstage */}
              {[
                {key:"frontstage",label:"Frontstage",icon:Monitor,accent:"#9a9a92",get:s=>s.frontstage},
                {key:"backstage",label:"Backstage",icon:Users,accent:"#9a9a92",get:s=>s.backstage},
              ].map(row=>(
                <React.Fragment key={row.key}>
                  <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:row.accent,textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>{row.label}</div>
                  {phases.map(ph=>ph.steps.map(st=>(
                    <div key={`${row.key}-${st.id}`} onClick={()=>scrollToStep(st.id)} onMouseEnter={()=>setHovered(st.id)} onMouseLeave={()=>setHovered(null)}
                      style={{ ...cellStyle(st.id) }}>
                      <p style={{ fontSize:16,color:isActive(st.id)?"#E2E8F0":"#9a9a92",margin:0,lineHeight:1.65 }}>{row.get(st)}</p>
                      <SourceTags stepId={st.id} rowKey={row.key} />
                    </div>
                  )))}
                </React.Fragment>
              ))}

              {/* Competitors */}
              {[{key:"competitor",label:"Competitors",icon:Globe,accent:"#FF8C69",get:s=>s.competitor}].map(row=>(
                <React.Fragment key={row.key}>
                  <div style={{ padding:"12px 14px",position:"sticky",left:0,background:"#262624",zIndex:50, width:110,minWidth:110,borderRight:"1px solid #3e3e38",fontSize:12,fontWeight:600, color:row.accent,textTransform:"uppercase",letterSpacing:1, display:"flex",alignItems:"center",gap:7 }}>{row.label}</div>
                  {phases.map(ph=>ph.steps.map(st=>(
                    <div key={`${row.key}-${st.id}`} onClick={()=>scrollToStep(st.id)} onMouseEnter={()=>setHovered(st.id)} onMouseLeave={()=>setHovered(null)}
                      style={{ ...cellStyle(st.id) }}>
                      <p style={{ fontSize:16,color:isActive(st.id)?"#E2E8F0":"#B2BEC3",margin:0,lineHeight:1.65 }}>{row.get(st)}</p>
                      <SourceTags stepId={st.id} rowKey={row.key} />
                    </div>
                  )))}
                </React.Fragment>
              ))}
            </div>

            {/* Pinned curve navigation */}
            <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{
              position:"fixed", bottom:0, left:0, right:0, zIndex:90,
              background:"#262624", borderTop:"1px solid #3e3e38",
              padding:"12px 24px 16px",
              boxShadow:"0 -8px 40px rgba(0,0,0,0.4)",
            }}>
              <BigCurve steps={allSteps} colors={stepColors} activeId={effectiveActive} onSelect={scrollToStep} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
