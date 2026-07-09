# Start here — how we actually begin

> **Scope:** this covers getting started and building v1 (Phase 0–1). Later phases (accounts, FHIR, clinics) live in ROADMAP.md. The team habits below carry through the whole project.

## The product

A website where someone types in their blood-test results and gets a plain-language
explanation of each one — what the test measures, and whether their number is low, normal,
high, or something they should call a doctor about. We write the explanations by hand and a
human approves every one. Nothing the user types is ever saved or sent anywhere.

## The three jobs, in plain words

There's three of us, and the work splits into three jobs.

- **The Content Coordinator** (the *Content library* track in ROADMAP). Owns the ~50 explanations: keeps them consistent, tracks
  what's done, and makes sure each one gets reviewed. The *writing itself is shared across all
  three of us* (with AI help to draft from trusted medical sources — a human always checks and
  approves), so this is a coordination job plus a share of the writing, not one person
  authoring 50 entries alone. It's the longest-lead work, so it starts first.

- **The Logic Builder** (the *Classification engine* track in ROADMAP). Writes the code that makes the decision: given a number and its
  units, is it low / normal / high / dangerous / probably-a-typo? This is the "brain." It's
  self-contained coding with a clear right answer. This person also sets up the project
  skeleton at the very start (explained below), because it has to exist before anyone builds.

- **The Website Builder** (the *Product UI* track in ROADMAP). Builds the actual pages people see and click — the form where you
  type results, and the page that shows the explanations. This is the "face." Like the writing,
  the *design is shared* — we all shape the look and the screens together in Figma (see "Design
  is ongoing"); the Website Builder is the one who turns that into working pages, not the sole
  designer.

They meet in the middle at one thing: **what information we store about each test.** We agree
that together, first, so all three jobs fit together. (It's written up in SPEC.md's *Data
model* section — think of it as a shared blank form we each fill in or read from.)

## The "data shape" — the one shared form every test uses

The three jobs aren't really separate — they're a chain that passes information along:

> **Content** writes the facts and words for each test → **Logic** reads those to decide
> low / normal / high → **Website** shows the result on screen.

**What it is.** The "data shape" is the form each test's information is stored in — the exact
fields and what they're called: the test's name, its normal range, its danger threshold, the
explanation text, and so on. It's the hand-off point where one job's work becomes the next
job's input. (It's written up in SPEC.md's *Data model* section.)

**Why it's necessary.** Every job either fills this form in or reads from it, so it's the thing
that lets the three pieces connect at all. Without one fixed form, the Content person might
write a normal range as text ("13.5–17.5") while the Logic person's code expects two numbers (a
low and a high) — the pieces don't fit, and we only find out when we try to combine our work.

**Why we must all use the same one.** There is exactly one shape, and all three jobs build
against it — same fields, same names, same meaning, everywhere. It's a shared contract, not
each person's private choice: if Content fills in one form, Logic reads a different one, and
Website expects a third, nothing lines up. That single shared form is precisely what lets us
build our three parts separately and still have them click together at the end.

## The one idea: start tiny

Do **not** try to write all 50 tests, or build the whole website, or handle every case at
once. That's what makes it feel impossible.

Instead, pick **3 simple tests** — say glucose, hemoglobin, and cholesterol — and take *those
three* all the way through: written up, logic that classifies them, and a web page that shows
the result. When those 3 work end-to-end, you'll all understand — concretely, not
hypothetically — what "the data shapes" and "the three jobs" actually mean. Then you repeat
the pattern for the rest. **Small slice first, then scale.** This is the single most useful
thing a first-time team can do.

---

## Week 0 — a few days, all together

Short and shared. Just the things everyone depends on:

1. **Write down our decisions.** We've talked through the big open questions — put the answers
   in writing so they're official. The most important one: *we write explanations by hand and
   a human approves each one — we do not have an AI generate them live. *(This one is already settled.)*
2. **Confirm the shared "form" for a test** — walk through SPEC.md's *Data model* together; each person checks it fits their part.
3. **Rough-sketch the two main screens in Figma, together** — the "type your results" screen
   and the "here's what they mean" screen. Rough. Not finished art. Just so we share a picture.
4. **Pick who takes which of the three jobs.**

That's it for the all-together part. After this, we split up and work in parallel.

## Week 1 — split up, build the tiny slice

Everyone works on their own copy of the project (a "branch" — your own workspace that doesn't
disturb anyone else's), on the *same 3 tests*.

- **Logic Builder — first, set up the skeleton (1–2 days).** Create the empty-but-running
  website and turn on the **automated checks** ("CI" — a robot that runs every time someone
  proposes a change and refuses changes that break our rules, e.g. shipping an explanation
  nobody reviewed). This has to exist before feature work, and it's a one-person job. *Then*
  start the low/normal/high logic for the 3 tests.
- **Content — draft the 3 explanations + find the sources.** Shared, AI-assisted drafting;
  the coordinator keeps it consistent. Get a feel for how long one entry really takes — it
  tells us a lot about the timeline. (Our clinician reviews the whole library before public
  launch, and signs off specifically on the "call a doctor" critical thresholds.)
- **Website Builder — turn the Figma sketch into a rough working page.** Doesn't need to be
  pretty yet; it needs to display a result. Keep adjusting the design with the team as it
  becomes real on screen.

## Week 2 — connect the slice, look at it together

- Wire the three pieces together: the page shows the Writer's words, judged by the Logic
  Builder's code, for the 3 tests. This "connecting" work is real work — whoever built the
  website usually leads it.
- Look at the working thing together. *Now* the design conversation gets concrete — react to
  what's actually on screen, in Figma and in the real page.
- Add the automated "robot user" test that opens the site, types the 3 tests, and checks the
  right explanations appear.

**You'll know the first slice is done when:** a person can open the site, enter those 3
tests, and read correct, human-approved explanations — including one that shows a "call your
doctor" warning. Once that works, everything after is repeating the pattern for more tests
and polishing the design.

---

## How we work together (the day-to-day)

None of us has done this before, so keep it light — two habits are enough:

- **A short check-in a few times a week.** 15 minutes: what I did, what's next, what I'm stuck
  on. Not a big meeting.
- **Review each other's work before it becomes final.** When someone finishes a piece, they
  "open a pull request" — a request to add their work to the shared copy — and one of the
  other two looks it over and says yes. This is our main way of staying in sync *and* catching
  mistakes, and it's where design feedback naturally happens. Lean on it.

Two gentle warnings:

- **Don't all work on the same thing at once.** It feels safe but it wastes the point of being
  a team (doing things at the same time) and it's harder to coordinate, not easier.
- **Don't over-plan.** The docs and the automated checks exist so we *can* work independently
  and trust that mistakes get caught. Agreeing too much together is as much a trap as too
  little.

## Design is ongoing, not a phase

We keep designing in Figma the whole way through — building the pages is *how we discover* what
the design should be. The Website Builder does the building; all three of us keep having a say
through Figma and through reviewing each other's work. The only thing worth pinning down early
is what the *warning* states need to do (a dangerous-value alert must stand out and not rely on
color alone) — everything about how it looks stays open and keeps improving.

---

## The whole plan on one page

- [ ] Week 0: write down decisions · agree the test "form" · rough Figma sketch · pick jobs
- [ ] Week 1: skeleton + checks (Logic Builder) · 3 explanations (Writer) · rough page (Website)
- [ ] Week 2: connect the 3 tests end-to-end · look together · add the robot-user test
- [ ] First slice done → repeat for more tests, keep improving the design
