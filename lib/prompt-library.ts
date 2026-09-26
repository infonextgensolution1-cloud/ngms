// NGMS Prompt Library: 12 categories x 4 prompts.
// Variables use {{snake_case}}. {{service}} and {{area}} come from the header selectors;
// every other variable becomes an input in the prompt modal.

export type Accent = 'purple' | 'orange' | 'green'

export interface PromptItem {
  id: string
  label: string
  template: string
}

export interface Category {
  id: string
  title: string
  blurb: string
  icon: string // lucide-react icon name
  accent: Accent
  prompts: PromptItem[]
}

export const SERVICES = [
  'Solar panel cleaning',
  'Painting',
  'Waterproofing',
  'Paving',
  'Plumbing',
  'Electrical',
  'Pool fibre lining',
  'High-pressure cleaning',
  'Rubble removal',
  'Steelwork / welding',
  'Handyman work',
] as const

export const AREAS = [
  'Strand',
  "Gordon's Bay",
  'Somerset West',
  'Helderberg Basin',
  'Overberg (Kleinmond, Grabouw, Elgin, Bot River)',
  'Stellenbosch / Paarl / Worcester / Cape Town',
] as const

export interface VariableMeta {
  label: string
  placeholder: string
  long?: boolean
}

export const VARIABLES: Record<string, VariableMeta> = {
  client_name: { label: 'Client name', placeholder: 'e.g. Mrs van der Merwe' },
  client_type: { label: 'Client type', placeholder: 'homeowner, body corporate, security complex, light commercial' },
  job_details: {
    label: 'Job details',
    placeholder: 'Size, condition, access, anything the client asked for',
    long: true,
  },
  job_ref: { label: 'Job / quote number', placeholder: 'e.g. NGMS-2026-041' },
  amount: { label: 'Amount (ZAR)', placeholder: 'e.g. R12,500' },
  days_outstanding: { label: 'Days outstanding', placeholder: 'e.g. 14' },
  labour_days: { label: 'Labour days and crew size', placeholder: 'e.g. 3 days, 2 workers' },
  distance_km: { label: 'Round-trip distance (km)', placeholder: 'e.g. 35' },
  quoted_price: { label: 'Quoted price (ZAR)', placeholder: 'e.g. R18,900' },
  actual_costs: { label: 'Actual costs', placeholder: 'Materials, labour, fuel, extras', long: true },
  platform: { label: 'Platform', placeholder: 'Facebook, Instagram, WhatsApp Status, Google Business' },
  topic: { label: 'Topic or angle', placeholder: 'e.g. winter rain is coming, book waterproofing now', long: true },
  season_note: { label: 'Season / weather note', placeholder: 'e.g. first cold front this week' },
  photo_notes: { label: 'Photo notes', placeholder: 'What the before and after photos show', long: true },
  scene: { label: 'Scene to show', placeholder: 'e.g. crew on a double-storey roof in Somerset West', long: true },
  prospect_type: { label: 'Prospect type', placeholder: 'e.g. body corporate, security complex, retirement village' },
  prospect_name: { label: 'Prospect name', placeholder: 'Managing agent, trustee or complex name' },
  lead_details: { label: 'Lead details', placeholder: 'Source, what they asked for, budget hints', long: true },
  quote_sent_date: { label: 'Quote sent on', placeholder: 'e.g. 21 September' },
  last_job: { label: 'Last job done', placeholder: 'e.g. solar panel clean, March 2026' },
  week_jobs: { label: 'Jobs this week', placeholder: 'List jobs, suburbs and time estimates', long: true },
  forecast: { label: 'Weather forecast', placeholder: 'e.g. rain Tuesday and Wednesday, SE wind Thursday' },
  crew: { label: 'Crew available', placeholder: 'e.g. me, Henry, Kalvin' },
  review_text: { label: 'Review text', placeholder: 'Paste the review here', long: true },
  reviewer_name: { label: 'Reviewer name', placeholder: 'e.g. Marlene' },
  page_focus: { label: 'Page focus', placeholder: 'e.g. roof waterproofing for older Strand homes' },
  keywords: { label: 'Target keywords', placeholder: 'e.g. solar panel cleaning Somerset West' },
  complex_name: { label: 'Complex / scheme name', placeholder: 'e.g. Helderberg Village HOA' },
  units: { label: 'Number of units', placeholder: 'e.g. 48' },
  scheme_needs: { label: 'Scheme needs', placeholder: 'Known issues, budget cycle, trustee concerns', long: true },
  message_purpose: { label: 'What the message must do', placeholder: 'Confirm, reschedule, apologise, explain', long: true },
  visit_date: { label: 'Visit date and time', placeholder: 'e.g. Tuesday 30 September, 08:00' },
  complaint: { label: 'Complaint', placeholder: 'What the client said, in their words', long: true },
  customer_name: { label: 'Customer name', placeholder: 'e.g. Mrs van der Merwe' },
  property_address: { label: 'Property address', placeholder: 'e.g. 12 Beach Road, Strand' },
  area_size: { label: 'Area / quantity', placeholder: 'e.g. 120 m², 2 bathrooms' },
  panel_count: { label: 'Number of panels', placeholder: 'e.g. 16' },
  materials: { label: 'Materials', placeholder: 'Products, brands, colours, quantities', long: true },
  labour: { label: 'Labour', placeholder: 'e.g. 2 days, 3 workers' },
  price: { label: 'Price / rate / offer', placeholder: 'e.g. R45 per panel, or R8,500 ex VAT' },
  notes: { label: 'Notes', placeholder: 'Site access, condition, what the client said', long: true },
  text_to_translate: { label: 'Text to translate', placeholder: 'Paste the English message', long: true },
}

const c = (
  id: string,
  title: string,
  blurb: string,
  icon: string,
  accent: Accent,
  prompts: [string, string][],
): Category => ({
  id,
  title,
  blurb,
  icon,
  accent,
  prompts: prompts.map(([label, template], i) => ({
    id: `${id}.${i + 1}`,
    label,
    template: template.trim(),
  })),
})

export const CATEGORIES: Category[] = [
  c('quotations', 'Quotations', 'Branded PDF quotes in ZAR', 'FileText', 'purple', [
    [
      'Generate Quote',
      `Draft a branded NGMS quote for {{service}} at {{client_name}} ({{client_type}}) in {{area}}.

Job details: {{job_details}}

- Price in ZAR at current Helderberg market rates, split into labour, materials (Builders Warehouse pricing and availability), fuel and overhead.
- Show a VAT (15%) toggle: totals with and without VAT.
- Add the R350 callout fee if the job is outside the Helderberg.
- Add a 30-day validity line and clear payment terms.
- Banking details: Capitec Entrepreneurs Savings Account. Leave the account number as a clearly marked placeholder and ask me to confirm it before you finish.
- Use NGMS brand colours (Jet Black, Power Purple, Solar Orange, Eco Green), attach the logo, and deliver as a PDF.
- Tone: professional but friendly, not corporate.`,
    ],
    [
      'Scope of Work',
      `Write a clear scope of work for {{service}} at {{client_name}} in {{area}}.

Job details: {{job_details}}

Cover what is included, what is excluded, materials and brands to be used, access and safety requirements, expected duration, weather dependencies (Cape winter rain), and what the client needs to prepare. Keep it plain enough that a homeowner or trustee can sign off without a phone call.`,
    ],
    [
      'Good / Better / Best',
      `Give {{client_name}} three priced options for {{service}} in {{area}}: Good (essential repair), Better (recommended), Best (long-term fix with longer guarantee).

Job details: {{job_details}}

For each option list the work, materials, guarantee period and price in ZAR (ex VAT and incl. VAT). Explain the difference in plain language and say which one I recommend and why. Keep it to one page.`,
    ],
    [
      'Multi-Trade Quote',
      `Build one combined NGMS quote for {{client_name}} in {{area}} covering more than one trade, starting with {{service}}.

Job details: {{job_details}}

Group the work by trade, give each trade its own subtotal, then one grand total in ZAR with a VAT toggle. Point out where combining trades saves the client a callout or a second visit, and use that as the reason to book everything through one call. Deliver as a branded PDF.`,
    ],
  ]),

  c('invoices', 'Invoices & Payments', 'Invoices, deposits, reminders', 'Receipt', 'orange', [
    [
      'Final Invoice',
      `Create a final NGMS invoice for {{client_name}} for {{service}} in {{area}}, job reference {{job_ref}}.

Job details: {{job_details}}
Amount: {{amount}}

Show line items, VAT toggle (15%), amount due and due date. Banking details: Capitec Entrepreneurs Savings Account, with the account number left as a marked placeholder that I confirm before sending. Use the NGMS logo and brand colours and deliver as a PDF.`,
    ],
    [
      'Deposit Invoice',
      `Create a deposit invoice for {{client_name}} for {{service}} in {{area}}, quote {{job_ref}}, total job value {{amount}}.

Work out a sensible deposit for this type of job (materials-heavy jobs need more upfront), show the balance still due on completion, and add a line explaining that the deposit secures the booking and materials. Capitec Entrepreneurs Savings Account, account number left as a placeholder for me to confirm. Branded PDF.`,
    ],
    [
      'Payment Reminder',
      `Write a payment reminder to {{client_name}} for invoice {{job_ref}}, {{amount}}, which is {{days_outstanding}} days outstanding.

Match the tone to how late it is: friendly under 7 days, firm at 14 days, formal at 30 days or more. Give me a WhatsApp version (short) and an email version. Include the banking details line for the Capitec Entrepreneurs Savings Account without the account number, and ask for proof of payment.`,
    ],
    [
      'Reconcile Payments',
      `Help me reconcile payments. I will paste my Capitec statement lines and my open invoices. Match each EFT to an invoice by reference or amount, list anything unmatched, flag part-payments and overpayments, and give me a short list of clients to chase this week with the amount owing on each.

Open invoices and payments: {{job_details}}`,
    ],
  ]),

  c('costing', 'Job Costing', 'Labour, materials, fuel, overhead', 'Calculator', 'green', [
    [
      'Cost a Job',
      `Cost a {{service}} job in {{area}} for me.

Job details: {{job_details}}
Labour: {{labour_days}}
Round-trip distance: {{distance_km}} km

Break it into labour, materials (Builders Warehouse prices, note anything that needs special order), fuel for the bakkie, consumables and a fair overhead share. Give my cost, a recommended selling price at Helderberg market rates, and the margin. Flag anything I might have forgotten.`,
    ],
    [
      'Margin Check',
      `Sense-check my pricing. I quoted {{quoted_price}} for {{service}} in {{area}}.

Job details: {{job_details}}
Labour: {{labour_days}}

Tell me if the margin is too thin, whether the price is in line with the local market, and the lowest price I can accept before the job loses money. Be direct.`,
    ],
    [
      'Materials List',
      `Make a materials and consumables list for {{service}} at {{client_name}} in {{area}}.

Job details: {{job_details}}

Quantities with a sensible wastage allowance, the Builders Warehouse product to ask for, approximate ZAR price per unit, and what to pre-order. Group it by aisle so I can shop in one trip.`,
    ],
    [
      'Post-Job Review',
      `Review a finished job. {{service}} in {{area}}, quoted at {{quoted_price}}.

Actual costs: {{actual_costs}}

Show quoted against actual, the real margin, where I lost or made money, and what I should change in my next quote for the same kind of job. Finish with one rule of thumb I can reuse.`,
    ],
  ]),

  c('marketing', 'Marketing & Social', 'Posts, captions, ads, content plans', 'Megaphone', 'purple', [
    [
      'Create Post',
      `Write a {{platform}} post for NGMS about {{service}} in {{area}}.

Angle: {{topic}}
Season: {{season_note}}

Tone: straight-talking, dependable, friendly. Lead with the homeowner's problem, not our company. Include one clear call to action ("One Call. All Solutions."), our WhatsApp number and 5 local hashtags. Give me two versions: short and long.`,
    ],
    [
      'Before & After Caption',
      `Write a caption for a before-and-after post of a {{service}} job in {{area}}.

What the photos show: {{photo_notes}}

Keep it factual and proud, not boastful. Name the suburb, mention the result the client cares about (safer, drier, cleaner, more efficient) and end with a booking line. Give me Facebook, Instagram and WhatsApp Status versions.`,
    ],
    [
      'Weekly Content Plan',
      `Plan a week of social content for NGMS. Focus service: {{service}}. Area: {{area}}.

Season and weather: {{season_note}}
Topic ideas: {{topic}}

Give me 5 posts (one per weekday) with format (photo, video, carousel, story), the caption, the best time to post for Helderberg homeowners and the photo I need to take on site. Mix education, proof of work and one offer.`,
    ],
    [
      'Local Ad Copy',
      `Write ad copy for {{service}} in {{area}} for {{platform}}.

Angle: {{topic}}

Give me 3 headlines, 3 primary texts and 3 calls to action. Target homeowners, body corporates and security complexes. Keep claims honest and specific to what we do, use local place names, and suggest a small monthly budget in ZAR to test it.`,
    ],
  ]),

  c('images', 'AI Image Prompts', 'Prompts for branded visuals', 'Image', 'orange', [
    [
      'Before / After Hero',
      `Write an image-generation prompt for a split before-and-after hero image of {{service}} on a South African home in {{area}}.

Details: {{photo_notes}}

Photorealistic, natural Western Cape light, believable building style for the area. Left side shows the neglected state, right side the finished result. Leave clean space at the top for a headline. Do not put any text, logos or numbers inside the image. Add a negative prompt to avoid warped hands, fake signage and distorted buildings.`,
    ],
    [
      'Crew In Action',
      `Write an image-generation prompt showing an NGMS worker doing {{service}}.

Scene: {{scene}}

Realistic, documentary style, correct PPE (hard hat, gloves, harness where working at height), branded workwear in Jet Black with a Solar Orange accent, clear blue Cape sky or overcast winter light. No faces in close-up, no readable text. Give me a 4:5 and a 16:9 version of the prompt.`,
    ],
    [
      'Branded Social Graphic',
      `Write an image prompt for a social graphic promoting {{service}} in {{area}}.

Angle: {{topic}}

Use the NGMS palette: Jet Black background, Power Purple and Solar Orange as accents, Eco Green for highlights. Bold, clean and uncluttered with room for me to add the headline and logo myself afterwards. Give me square and story-size variations.`,
    ],
    [
      'Photo Clean-Up & Brand',
      `Give me instructions to improve and brand a job-site photo of {{service}} in {{area}}.

Photo notes: {{photo_notes}}

Cover cropping, straightening, brightness and colour correction that keeps the result honest (no faking the work), how to add the NGMS logo and Brand Stamp, and the file size and ratio for Facebook, Instagram and my website gallery.`,
    ],
  ]),

  c('leads', 'Lead Generation', 'Find, score and warm up prospects', 'Target', 'green', [
    [
      'Find Local Leads',
      `Find 15 realistic prospects for {{service}} in {{area}}.

Prospect type: {{prospect_type}}

For each: name, suburb, why they need it now, best contact route (agent, trustee, manager, owner) and one opening line. Prioritise the ones that have both the need and the budget authority. Tell me which 5 to contact first.`,
    ],
    [
      'Cold Outreach Email',
      `Write a cold outreach email from NGMS to {{prospect_name}} ({{prospect_type}}) in {{area}} offering {{service}}.

Context: {{lead_details}}

Under 120 words. Professional but friendly. One specific observation about their property or scheme, one proof point, one easy next step (a free quote visit). Include a subject line and a WhatsApp follow-up of two lines.`,
    ],
    [
      'Score This Lead',
      `Score this lead from 1 to 10 for NGMS.

Service wanted: {{service}}
Area: {{area}}
Lead details: {{lead_details}}

Score on need, budget, urgency, distance from the Helderberg and likelihood of repeat or multi-trade work. Say whether to quote, phone first or drop it, and give me the first thing to say on the call.`,
    ],
    [
      'Ask For Referrals',
      `Write a referral request to {{client_name}}, whose {{service}} job in {{area}} is finished and paid.

Keep it warm and short. Mention body corporate neighbours, family and their complex WhatsApp group. Offer a small thank-you that fits our margins. Give me a WhatsApp version and an email version.`,
    ],
  ]),

  c('followups', 'Follow-ups', 'Quotes, check-ins, reactivation', 'PhoneCall', 'purple', [
    [
      'Quote Follow-up (Day 3)',
      `Write a friendly follow-up to {{client_name}} about the {{service}} quote sent on {{quote_sent_date}} for {{area}}.

Ask if they have questions, offer to walk the site again, and mention one benefit of booking soon (the season, {{season_note}}). No pressure. WhatsApp version under 50 words and an email version.`,
    ],
    [
      'Quote Follow-up (Last Try)',
      `Write a last follow-up to {{client_name}} about the {{service}} quote sent on {{quote_sent_date}}.

Be polite, honest that the quote validity is ending and that materials pricing can move. Make it easy to say yes, and easy to say no. Leave the door open. WhatsApp and email versions.`,
    ],
    [
      'Post-Job Check-in',
      `Write a check-in message to {{client_name}} a week after our {{service}} job in {{area}}.

Ask if everything is holding up, remind them of the guarantee and how to reach me, and finish with a soft ask for a Google review. Keep it under 60 words for WhatsApp.`,
    ],
    [
      'Win Back Old Clients',
      `Write a message to bring back {{client_name}}, whose last job with us was {{last_job}}.

Give a reason to book now that is true for this season ({{season_note}}), suggest the service they are most likely to need next, and offer a specific slot. Friendly, short, no guilt. WhatsApp and email versions.`,
    ],
  ]),

  c('scheduling', 'Scheduling & Weather', 'Weekly plans, rain delays, routes', 'CalendarDays', 'orange', [
    [
      'Plan My Week',
      `Plan my working week.

Jobs: {{week_jobs}}
Forecast: {{forecast}}
Crew: {{crew}}

Move weather-sensitive work (painting, waterproofing, paving, pool lining, solar cleaning in rain) to dry days and put indoor, plumbing, electrical and steelwork on wet ones. Give me a day-by-day plan with times, a sensible route across the Helderberg and the clients I must message about changes.`,
    ],
    [
      'Rain Delay Notice',
      `Write a rain-delay message to {{client_name}} for {{service}} in {{area}}.

Forecast: {{forecast}}

Explain in one line why we cannot do this work in the wet (adhesion, curing, safety), give the new proposed date, and reassure them the quote and price still stand. WhatsApp version, plus an Afrikaans version.`,
    ],
    [
      'Route Plan',
      `Sequence these {{area}} jobs to save fuel and time.

Jobs: {{week_jobs}}
Crew: {{crew}}

Group by suburb (Strand, Gordon's Bay, Somerset West), account for the N2 and Sir Lowry's Pass traffic windows, allow load and unload time and suggest where to combine material pickups from Builders Warehouse.`,
    ],
    [
      'Solar Cleaning Round',
      `Build a recurring solar panel cleaning round for {{area}}.

Clients and systems: {{job_details}}
Forecast: {{forecast}}

Suggest a service interval per client (dust, wind, bird and salt exposure), the best time of day to avoid thermal shock on hot panels, the order of visits, and a reminder message I can send each client a week before.`,
    ],
  ]),

  c('reviews', 'Reviews & Reputation', 'Ask, reply, turn praise into content', 'Star', 'green', [
    [
      'Ask For A Review',
      `Write a review request for {{client_name}} after a {{service}} job in {{area}}.

Warm, quick, and specific. Tell them why reviews matter to a small local business, include a placeholder for the Google review link, and keep it under 50 words for WhatsApp. Add an email version.`,
    ],
    [
      'Reply To A Good Review',
      `Write a reply to this review from {{reviewer_name}}:

{{review_text}}

Thank them by name, mention the specific job ({{service}}), keep it personal and short, and avoid copy-paste phrasing. Give me two options.`,
    ],
    [
      'Reply To A Bad Review',
      `Write a public reply to this negative review from {{reviewer_name}}:

{{review_text}}

Stay calm and factual. Acknowledge the problem, do not argue or blame, say what I will do to put it right and move the conversation to a phone call. Under 100 words. Also give me the private message I should send them first.`,
    ],
    [
      'Testimonial To Post',
      `Turn this review into a social post and a website testimonial.

Review from {{reviewer_name}}: {{review_text}}
Service: {{service}}, {{area}}

Pull out the strongest line, keep their words unaltered, add a short heading and a call to action. Format for {{platform}} and for the website testimonials block.`,
    ],
  ]),

  c('website', 'Website & SEO', 'Service pages, local SEO, Google profile', 'Globe', 'purple', [
    [
      'Service Page Copy',
      `Write website copy for the {{service}} page on the NGMS site.

Focus: {{page_focus}}
Keywords: {{keywords}}

Include a headline, a 2-line intro, what is included, how it works in 4 steps, a short FAQ, and a strong call to action. Straight-talking, systemized, dependable. Cover Strand, Gordon's Bay and Somerset West naturally, without stuffing.`,
    ],
    [
      'Local SEO Page',
      `Write a local landing page for {{service}} in {{area}}.

Keywords: {{keywords}}

Give me the title tag (under 60 characters), meta description (under 155), H1, sections, local details a real resident would recognise, and LocalBusiness schema in JSON-LD with a placeholder for phone and address. No fake claims.`,
    ],
    [
      'Google Business Post',
      `Write a Google Business Profile post about {{service}} in {{area}}.

Angle: {{topic}}

Under 150 words, one photo idea, a button choice (Call, Book or Learn more) and a short offer line if it suits. Include the suburb name naturally.`,
    ],
    [
      'FAQ Block',
      `Write 8 FAQs for a {{service}} page aimed at {{area}} homeowners and body corporates.

Cover price ranges in ZAR, how long it takes, weather and season, guarantees, access, what the client must prepare and who to contact. Plain answers under 60 words each, plus FAQPage schema in JSON-LD.`,
    ],
  ]),

  c('bodycorp', 'Body Corporates', 'Trustees, schemes, compliance', 'Building2', 'orange', [
    [
      'Scheme Proposal',
      `Write a proposal to the trustees of {{complex_name}} ({{units}} units) in {{area}} for {{service}}.

What they need: {{scheme_needs}}

Structure: the problem in their words, our approach, scope, timeline around resident disruption, price in ZAR (ex and incl. VAT), and why one project-managed contractor beats three separate ones. Formal enough for a trustee meeting, still readable. Branded PDF.`,
    ],
    [
      '12-Month Maintenance Plan',
      `Build a 12-month planned maintenance schedule for {{complex_name}} ({{units}} units) in {{area}}, starting with {{service}}.

Known issues: {{scheme_needs}}

Month-by-month tasks that respect Cape seasons (paint and waterproof in the dry months, drains and gutters before winter), estimated cost per month in ZAR and a monthly total trustees can put into the levy budget.`,
    ],
    [
      'Trustee Email',
      `Write an email to the trustee or managing agent of {{complex_name}} about {{service}}.

Purpose: {{message_purpose}}

Short, respectful of their time, decision-ready: what I found, what I recommend, cost, and the exact approval I need. Add a subject line and a two-line WhatsApp version.`,
    ],
    [
      'Compliance & Safety Pack',
      `List the compliance and safety paperwork a body corporate will expect from NGMS for {{service}} at {{complex_name}} in {{area}}.

Cover certificates of compliance, working-at-height and fall protection, insurance, OHS Act and Construction Regulations items, method statements and risk assessments. For each item say what it is and whether I must supply it. Flag anything I should verify with the relevant authority or a registered professional before relying on it.`,
    ],
  ]),

  c('clientcomms', 'Client Comms', 'WhatsApp, email, complaints, Afrikaans', 'MessageCircle', 'green', [
    [
      'Booking Confirmation',
      `Write a booking confirmation for {{client_name}}: {{service}} in {{area}} on {{visit_date}}.

Include the arrival window, what to prepare (access, parking, pets, water and power), who is coming, and how to reach me. WhatsApp version under 70 words, and a fuller email version.`,
    ],
    [
      'Job Complete Message',
      `Write a job-complete message to {{client_name}} for {{service}} in {{area}}.

Job details: {{job_details}}

Summarise what was done, any aftercare advice, guarantee terms, the invoice ({{amount}}) and thanks. Warm, short, professional. WhatsApp and email versions.`,
    ],
    [
      'Handle A Complaint',
      `A client is unhappy. Help me respond.

Client: {{client_name}}, {{service}} in {{area}}
Complaint: {{complaint}}

First tell me honestly whether the complaint is fair. Then write a reply that acknowledges the issue, takes ownership where it is ours, proposes a fix with a date, and protects the relationship. Keep it calm and short. Give WhatsApp and email versions.`,
    ],
    [
      'Translate To Afrikaans',
      `Translate this message to natural, friendly Afrikaans as spoken in the Western Cape, suitable for a client in {{area}}.

{{text_to_translate}}

Keep the same tone, keep trade terms the way local clients use them, and give me an English back-translation so I can check the meaning.`,
    ],
  ]),
]

// ---- helpers used by the UI ----

export const VAR_RE = /\{\{\s*([a-z_]+)\s*\}\}/g

export function extractVars(template: string): string[] {
  const seen: string[] = []
  for (const m of template.matchAll(VAR_RE)) {
    if (!seen.includes(m[1])) seen.push(m[1])
  }
  return seen
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(VAR_RE, (_, key: string) => {
    const v = values[key]
    return v && v.trim() ? v.trim() : `[${key.replace(/_/g, ' ')}]`
  })
}

export const CONTEXT_HEADER = `Context: I run NGMS (Next Gen Maintenance Solutions), a multi-trade property maintenance contractor in the Helderberg Basin (Strand, Gordon's Bay, Somerset West), Western Cape. Clients are homeowners, body corporates, security complexes and light commercial. Use ZAR at Helderberg market rates, Builders Warehouse materials, SA regulations and Cape seasonal weather. Keep it direct, practical and action-oriented. Client-facing copy is professional but friendly, not corporate.`
