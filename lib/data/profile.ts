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
  headline: "Software Engineer & Multidisciplinary Builder",

  /** Province and country. The source CV's street address stays excluded. */
  location: "Gauteng, South Africa",

  email: "keathan179@gmail.com",

  /**
   * TODO — editable placeholder copy. No introduction prose was supplied.
   * Replace with Keathan's own words; the structure takes any number of
   * paragraphs.
   */
  intro: [
    "I am a builder. The label changes depending on the room — engineer, designer, analyst — but the work underneath is the same: take something that exists only as an idea, and make it real enough to use.",
    "Most of what I build is software, and most of it is the unglamorous half: the risk engine that refuses the order, the policy that makes an agent stop and ask, the database rule that makes a permission true rather than merely displayed. I like the parts that have to be right.",
    "The rest of it — the 3D, the design, the security — is not a separate set of hobbies. A forecast nobody opens is not a forecast. A spatial experience needs someone who can model it and someone who can ship it. A system is not finished until somebody has tried to break it. Five entrances, one practice.",
  ],

  /**
   * CV profile. Restates the VERIFIED breadth list and nothing beyond it —
   * no seniority claim, no outcome, no employer.
   */
  summary:
    "Software engineer working across full-stack and edge systems, applied AI and data, security engineering, 3D and real-time, and design. Builds end to end: architecture, implementation, testing and deployment.",

  /** TODO — editable. No availability statement was supplied. */
  availability: "Open to roles, contracts and collaborations.",
};

/**
 * Professional profiles. All four are VERIFIED and live.
 *
 * A fifth slot held a disabled Kaggle entry — present, pending, linking
 * nowhere. It has been removed at Keathan's request. A profile nobody has
 * is not an asset waiting to be filled in; it is a gap being advertised.
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
];
