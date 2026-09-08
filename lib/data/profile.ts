import type { ExternalLink, Profile } from "./types";

/**
 * Identity and contact details.
 *
 * Name, positioning, email and the four profile URLs are VERIFIED.
 * `intro` remains editable placeholder copy — no prose was supplied for it.
 *
 * Deliberately absent, and not to be added:
 *   - physical address (present in the source CV; never surfaced here)
 *   - references
 *   - phone number — there is no phone field in this data model, and the
 *     instruction was to omit it rather than invent a place for it
 *   - any education or degree field
 */
export const profile: Profile = {
  name: "Keathan Naidoo",

  /** Hero statement, one line per array entry. Kept minimal by design. */
  statement: ["I build.", "Absolutely anything."],

  /**
   * VERIFIED positioning. The hero shows this line and nothing more — the
   * breadth belongs to the discipline worlds, not to a single headline.
   */
  headline: "Creative Developer",

  /** No location supplied. The source CV's street address is excluded. */
  location: "",

  email: "keathan179@gmail.com",

  /**
   * TODO — editable placeholder copy. No introduction prose was supplied.
   * Replace with Keathan's own words; the structure takes any number of
   * paragraphs.
   */
  intro: [
    "I am a builder. The label changes depending on the room — engineer, designer, animator, analyst — but the work underneath is the same: take something that only exists as an idea, and make it real enough to use.",
    "Most people pick a lane. I found that the interesting problems live in the gaps between them. A spatial experience needs an engineer and a 3D artist. A forecasting model is worthless until someone designs the interface that makes it legible. A system is not finished until someone has tried to break it.",
    "So I learned all of it. Not as a collection of hobbies, but as one practice with five entrances.",
  ],

  /**
   * CV profile. Restates the VERIFIED breadth list and nothing beyond it —
   * no seniority claim, no outcome, no employer.
   */
  summary:
    "Creative developer working across software development, creative technology, 3D and VFX, graphic design, UI/UX, XR, data and AI, and cybersecurity.",

  /** TODO — editable. No availability statement was supplied. */
  availability: "Open to roles, contracts and collaborations.",
};

/**
 * Professional profiles.
 *
 * Four are VERIFIED and live. Kaggle is kept as a present-but-disabled
 * slot: `pending: true` with no href, so both the Hire Me section and the
 * footer render it as inert text rather than a link to nowhere. No
 * placeholder URL is invented. Setting a real `href` and removing
 * `pending` is all that is needed to activate it.
 */
export const socialLinks: ExternalLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/Keathan2609",
    ariaLabel: "GitHub profile",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/keathan-naidoo-792626220",
    ariaLabel: "LinkedIn profile",
  },
  {
    label: "Behance",
    href: "https://www.behance.net/keathan_n",
    ariaLabel: "Behance profile",
  },
  {
    label: "TryHackMe",
    href: "https://tryhackme.com/p/haketsebe",
    ariaLabel: "TryHackMe profile",
  },
  // TODO — no URL supplied. Present but disabled; never rendered as a link.
  { label: "Kaggle", href: "", ariaLabel: "Kaggle profile", pending: true },
];
