# Welcome / handover video script (Synthesia AI avatar)

Generic room-wide welcome and store handover for **The Store Is Yours**. Plays
once on the venue's large screen (one audio source, no per-laptop sync), before
the facilitator starts the briefing walkthrough. Speaker is the **outgoing
Plumfield store manager** handing over. It welcomes, hands the store over
emotionally, points to the handover document, and quietly seeds the
"unreliable narrator" (do not fully trust the handover).

`[bracketed]` items are fill-ins. ~90 seconds, ~230 words.

---

## Script (word-for-word)

> Hi. And congratulations. If you are watching this, it means the store is yours now.
>
> I am the manager who has been running this place, and today I am handing Plumfield [store name] over to you. I will not keep you long, because the best way to learn a store is to stand in it.
>
> So here is what I will say. This is not a spreadsheet you are taking over. It is people. A team who show up every day. Customers who expect the shelves full and the queues short. And a hundred small calls that only you can make, once those doors open.
>
> Some days will run clean. Some days something will break, usually when you least expect it. That is the job. You will not have time to get everything right, so what matters is what you choose to lead with: the people, the priorities, the performance.
>
> I have left you my handover notes. You will find them on your screen, behind the Handover button at the top right of your dashboard. Read them. They tell you what I think you need to know. But I will be honest with you. I saw this store one way. Trust what you see on the floor as much as what you read on the page.
>
> That is it from me. The team is good. They just need someone to lead them.
>
> Over to you. The store is yours.

---

## Synthesia production notes

- **Avatar:** business-casual, warm, mid-shot (waist-up). Non-corporate feel.
- **Voice / accent:** UK English to fit Plumfield. Speaking speed ~0.9-0.95x for warmth; let pauses breathe.
- **Pacing:** keep each paragraph as its own Synthesia **scene** (6 scenes); add short pauses (~0.4s) at the line breaks.
- **Background:** clean, on-theme (see `video-background-prompt.md`). Nothing with a real supermarket's branding.
- **On-screen text:**
  - Scene 1: title card **"The Store Is Yours"**
  - Scene 2: name/role lower-third, e.g. *"Outgoing Store Manager, Plumfield [store]"*
  - Final scene: **"The store is yours."** with the tagline *"Lead the people, the priorities and the performance."*
- **Captions:** subtitles **on** (accessibility, plus the fallback if a venue has no audio).
- **Format:** 16:9, 1080p. Keep any music bed low so speech stays clear in a room.

## Notes

- Venues have confirmed they will most likely have a large screen, so room-wide
  playback with one audio source is the plan (no cross-laptop audio, no babble).
- The handover line points at the real **Handover** button in the team header
  (`HandoverModal`), so it matches the live UI.
- A tighter ~45-second cut can be produced if venues want to move faster.
