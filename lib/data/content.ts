import type {
  BeyondEntry,
  Certification,
  CurrentlyBuilding,
  DisciplineId,
  ExperienceEntry,
  LanguageEntry,
  ProfessionalDevelopmentEntry,
  Project,
  SkillGroup,
  TimelineEntry,
  TrainingEntry,
} from "./types";

/**
 * Content collections.
 *
 * EVERY entry below carries `placeholder: true` and is rendered by the UI
 * with a visible "placeholder" marker. These exist to demonstrate the final
 * presentation format — they are not claims of completed work, and they
 * contain no employer, client, date, metric or outcome.
 *
 * Replacing content is a matter of editing this file. No component changes.
 */

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export const projects: Project[] = [
  {
    slug: "enterprise-operations-platform",
    title: "Enterprise Operations Platform",
    discipline: "software",
    summary:
      "A placeholder full-stack system demonstrating the final project presentation format.",
    role: "Role to be confirmed",
    stack: ["React", "TypeScript", "Python", "SQL", "API"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "This block demonstrates how a full case study reads once a real project replaces it — the problem, the constraints, and why the work was worth doing.",
      },
      {
        heading: "Approach",
        body: "This block demonstrates the architecture narrative: how the interface, application layer, API surface and data model were shaped, and which trade-offs were taken deliberately.",
      },
      {
        heading: "Result",
        body: "This block is reserved for the outcome. It stays empty until there is a real, verifiable result to state.",
      },
    ],
    technicalDetails: [
      "Placeholder — replace with a real architecture note.",
      "Placeholder — replace with a real implementation detail.",
    ],
    placeholder: true,
  },
  {
    slug: "automation-intelligence-system",
    title: "Automation Intelligence System",
    discipline: "software",
    summary:
      "A placeholder automation and applied-AI system showing how smaller projects are presented.",
    role: "Role to be confirmed",
    stack: ["Python", "API", "Automation", "AI"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },

  {
    slug: "xr-interactive-experience",
    title: "XR Interactive Experience",
    discipline: "xr",
    summary:
      "A placeholder spatial experience demonstrating the end-to-end XR presentation format.",
    role: "Role to be confirmed",
    stack: ["Unity", "C#", "Blender", "VFX"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "This block demonstrates how a spatial project is framed — the environment, the interaction model, and who it was built for.",
      },
      {
        heading: "Pipeline",
        body: "This block demonstrates the end-to-end account: concept, modelling and environment work, materials and texturing, interaction design, then engine implementation.",
      },
      {
        heading: "Result",
        body: "Reserved for the real outcome. Left empty rather than filled with an invented one.",
      },
    ],
    technicalDetails: [
      "Placeholder — replace with a real pipeline or engine note.",
    ],
    placeholder: true,
  },
  {
    slug: "immersive-training-environment",
    title: "Immersive Training Environment",
    discipline: "xr",
    summary:
      "A placeholder immersive environment showing the modelling-to-engine presentation.",
    role: "Role to be confirmed",
    stack: ["Unreal Engine", "Maya", "ZBrush", "Substance Painter"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },

  {
    slug: "predictive-forecasting-engine",
    title: "Predictive Forecasting Engine",
    discipline: "ai",
    summary:
      "A placeholder forecasting system demonstrating how modelling work is presented.",
    role: "Role to be confirmed",
    stack: ["Python", "SQL", "ML", "Forecasting"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "This block demonstrates how a data project is framed — the question being asked, the shape of the data, and what a useful answer would look like.",
      },
      {
        heading: "Method",
        body: "This block demonstrates the analytical narrative: cleaning, exploratory analysis, feature work, model selection and how the forecast was validated.",
      },
      {
        heading: "Result",
        body: "Reserved for real accuracy figures and outcomes. No metrics are stated until they are real.",
      },
    ],
    placeholder: true,
  },
  {
    slug: "decision-intelligence-dashboard",
    title: "Decision Intelligence Dashboard",
    discipline: "ai",
    summary:
      "A placeholder analytics surface demonstrating how visualisation work is presented.",
    role: "Role to be confirmed",
    stack: ["Python", "SQL", "Data Visualization"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },

  {
    slug: "brand-identity-system",
    title: "Brand Identity System",
    discipline: "creative",
    summary:
      "A placeholder identity system demonstrating how design work is presented.",
    role: "Role to be confirmed",
    stack: ["Adobe Creative Cloud", "Figma"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "expanded",
    caseStudy: [
      {
        heading: "Context",
        body: "This block demonstrates how an identity project is framed — the audience, the positioning problem, and the constraints the system had to survive.",
      },
      {
        heading: "System",
        body: "This block demonstrates the design narrative: typographic decisions, colour logic, compositional rules and how the system holds together across applications.",
      },
      {
        heading: "Result",
        body: "Reserved for the real outcome.",
      },
    ],
    placeholder: true,
  },
  {
    slug: "3d-motion-experiment",
    title: "3D / Motion Experiment",
    discipline: "creative",
    summary:
      "A placeholder 3D and motion piece demonstrating how visual experiments are presented.",
    role: "Role to be confirmed",
    stack: ["Blender", "Maya", "ZBrush", "Substance Painter"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },

  {
    slug: "ctf-challenge",
    title: "CTF Challenge",
    discipline: "security",
    summary:
      "A placeholder capture-the-flag write-up demonstrating how security activity is presented.",
    role: "Ongoing practice",
    stack: ["Ethical Hacking", "CTFs"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },
  {
    slug: "penetration-testing-lab",
    title: "Penetration Testing Lab",
    discipline: "security",
    summary:
      "A placeholder lab exercise demonstrating how practical security work is presented.",
    role: "Ongoing practice",
    stack: ["Penetration Testing"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },
  {
    slug: "soc-investigation",
    title: "SOC Investigation",
    discipline: "security",
    summary:
      "A placeholder investigation demonstrating how analysis work is presented.",
    role: "Ongoing practice",
    stack: ["SOC Analysis"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },
  {
    slug: "bug-bounty-research",
    title: "Bug Bounty Research",
    discipline: "security",
    summary:
      "A placeholder research note demonstrating how findings are presented.",
    role: "Ongoing practice",
    stack: ["Bug Bounty"],
    media: [{ kind: "image", src: "", alt: "", pending: true }],
    presentation: "compact",
    placeholder: true,
  },
];

/* ------------------------------------------------------------------ */
/* Skills — exactly the supplied list. Nothing invented.               */
/* ------------------------------------------------------------------ */

/**
 * SKILLS — verified. Nothing here is inferred.
 *
 * IMPORTANT DISTINCTION: this is Keathan's own skill set. It is NOT the
 * portfolio's tech stack. The site itself is built with Next.js, React,
 * Three.js and GSAP; only the technologies genuinely in his skill list
 * appear below. Professional experience is never implied from a technology
 * merely because this site happens to use it. Do not merge the two.
 *
 * `tier` is an editorial weighting, not a proficiency score:
 *   primary     the tools the work runs on. These are what a discipline
 *               world shows as its signature line.
 *   secondary   regularly used — listed, unemphasised
 *   supporting  known and used, but not headline. Set back in an expanded
 *               Skills Arsenal row rather than given equal weight — the
 *               security toolset alone is 28 entries, and flattening them
 *               all to the same emphasis turns the section into a wall.
 *
 * Every tier is rendered at every breakpoint. Tier changes emphasis, never
 * presence: no skill is hidden from anyone on any device.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "programming",
    label: "Software Engineering",
    discipline: "software",
    skills: [
      { name: "Python", disciplines: ["software", "ai"], tier: "primary", note: "Scripting, data and automation", related: ["Machine Learning", "Data Analytics"] },
      { name: "JavaScript", disciplines: ["software"], tier: "primary", note: "Application logic", related: ["TypeScript", "ReactJS"] },
      { name: "TypeScript", disciplines: ["software"], tier: "primary", note: "Typed application development", related: ["ReactJS", "JavaScript"] },
      { name: "ReactJS", disciplines: ["software", "creative"], tier: "primary", note: "Interface development", related: ["TypeScript", "CSS"] },
      { name: "C#", disciplines: ["software", "xr"], tier: "secondary", note: "Engine and application code", related: ["Unity"] },
      { name: "C++", disciplines: ["software"], tier: "secondary", note: "Systems-level programming", related: ["C#"] },
      { name: "HTML", disciplines: ["software", "creative"], tier: "secondary", note: "Structure and semantics", related: ["CSS"] },
      { name: "CSS", disciplines: ["software", "creative"], tier: "secondary", note: "Layout and styling", related: ["HTML", "ReactJS"] },
    ],
  },
  {
    id: "xr3d",
    label: "XR Development",
    discipline: "xr",
    skills: [
      { name: "Maya", disciplines: ["xr"], tier: "primary", note: "Modelling and animation", related: ["ZBrush", "Substance Painter"] },
      { name: "Blender", disciplines: ["xr"], tier: "primary", note: "Modelling, animation and VFX", related: ["Substance Painter"] },
      { name: "ZBrush", disciplines: ["xr"], tier: "primary", note: "Digital sculpting", related: ["Maya", "Substance Painter"] },
      { name: "Substance Painter", disciplines: ["xr"], tier: "primary", note: "Texturing and materials", related: ["Blender", "Maya"] },
      { name: "Houdini", disciplines: ["xr"], tier: "primary", note: "Visual effects", related: ["Blender"] },
      { name: "Unity", disciplines: ["xr", "software"], tier: "secondary", note: "Real-time and XR development", related: ["C#"] },
      { name: "Unreal Engine", disciplines: ["xr"], tier: "secondary", note: "Real-time environments", related: ["Maya", "ZBrush"] },
    ],
  },
  {
    id: "design",
    label: "Creative",
    discipline: "creative",
    skills: [
      { name: "Adobe Creative Cloud", disciplines: ["creative"], tier: "primary", note: "Graphic, motion and digital art", related: ["Figma"] },
      { name: "Figma", disciplines: ["creative", "software"], tier: "primary", note: "Interface and systems design", related: ["Adobe Creative Cloud", "ReactJS"] },
      { name: "UI / UX Design", disciplines: ["creative", "software"], tier: "primary", note: "Interface and experience design", related: ["Figma"] },
      { name: "Brand Identity Design", disciplines: ["creative"], tier: "primary", note: "Identity systems", related: ["Visual Communication"] },
      { name: "Digital Art Design", disciplines: ["creative"], tier: "secondary", note: "Illustration and digital artwork", related: ["Adobe Creative Cloud"] },
      { name: "Visual Communication", disciplines: ["creative"], tier: "secondary", note: "Message, hierarchy and composition", related: ["Brand Identity Design"] },
    ],
  },
  {
    id: "data",
    label: "Data Science",
    discipline: "ai",
    skills: [
      { name: "Data Analytics", disciplines: ["ai"], tier: "primary", note: "Analysis and interpretation", related: ["Python", "Power BI"] },
      { name: "Data Visualisation", disciplines: ["ai", "creative"], tier: "primary", note: "Making data legible", related: ["Plotly", "Tableau"] },
      { name: "Machine Learning", disciplines: ["ai"], tier: "primary", note: "Growing expertise — experiments and modelling", related: ["Scikit-learn", "Python"] },
      { name: "TensorFlow", disciplines: ["ai"], tier: "secondary", note: "Growing expertise", related: ["PyTorch"] },
      { name: "PyTorch", disciplines: ["ai"], tier: "secondary", note: "Growing expertise", related: ["TensorFlow"] },
      { name: "Scikit-learn", disciplines: ["ai"], tier: "secondary", note: "Growing expertise", related: ["Python"] },
      { name: "Power BI", disciplines: ["ai"], tier: "secondary", note: "Reporting and dashboards", related: ["Tableau"] },
      { name: "Plotly", disciplines: ["ai"], tier: "supporting", note: "Charting", related: ["Python"] },
      { name: "D3.js", disciplines: ["ai"], tier: "supporting", note: "Custom visualisation", related: ["JavaScript"] },
      { name: "Tableau", disciplines: ["ai"], tier: "supporting", note: "Reporting and dashboards", related: ["Power BI"] },
      { name: "AWS", disciplines: ["ai"], tier: "supporting", note: "Cloud data platform" },
      { name: "GCP", disciplines: ["ai"], tier: "supporting", note: "Cloud data platform" },
      { name: "Azure", disciplines: ["ai"], tier: "supporting", note: "Cloud data platform" },
      { name: "Databricks", disciplines: ["ai"], tier: "supporting", note: "Data platform" },
    ],
  },
  {
    id: "security",
    label: "Cybersecurity",
    discipline: "security",
    skills: [
      { name: "Kali Linux", disciplines: ["security"], tier: "primary", note: "Currently developing", related: ["Metasploit", "Nmap"] },
      { name: "Burp Suite", disciplines: ["security"], tier: "primary", note: "Currently developing — web exploitation", related: ["Nmap"] },
      { name: "Wireshark", disciplines: ["security"], tier: "primary", note: "Currently developing — traffic analysis", related: ["Nmap"] },
      { name: "Nmap", disciplines: ["security"], tier: "primary", note: "Currently developing — reconnaissance", related: ["Kali Linux"] },
      { name: "Metasploit", disciplines: ["security"], tier: "primary", note: "Currently developing — exploitation", related: ["Kali Linux"] },
      { name: "Ghidra", disciplines: ["security"], tier: "secondary", note: "Currently developing — reverse engineering", related: ["IDA Pro"] },
      { name: "Splunk", disciplines: ["security"], tier: "secondary", note: "Currently developing — SIEM", related: ["Elastic SIEM"] },
      { name: "Volatility", disciplines: ["security"], tier: "secondary", note: "Currently developing — memory forensics" },
      { name: "IDA Pro", disciplines: ["security"], tier: "supporting", note: "Currently developing", related: ["Ghidra"] },
      { name: "AWS Security", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Azure Sentinel", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Cloudflare", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Terraform", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "QRadar", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "ArcSight", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Elastic SIEM", disciplines: ["security"], tier: "supporting", note: "Currently developing", related: ["Splunk"] },
      { name: "MISP", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "ThreatConnect", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Recorded Future", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "VirusTotal", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Phantom", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Demisto", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Swimlane", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "SOAR", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "CrowdStrike", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "SentinelOne", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Carbon Black", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
      { name: "Cortex XDR", disciplines: ["security"], tier: "supporting", note: "Currently developing" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* CV                                                                  */
/* ------------------------------------------------------------------ */

/**
 * EXPERIENCE — roles are verified. Organisations and dates are NOT.
 *
 * Every unverified field carries the literal string "TODO" so it is visible
 * on the page rather than silently blank, and so it can never be mistaken
 * for a real value. No organisation, date range or outcome has been
 * invented for any entry.
 *
 * `placeholder` is false because these are real roles — the TODO strings
 * are the markers, not the tag.
 */
export const experience: ExperienceEntry[] = [
  {
    id: "exp-data-analyst",
    organisation: "Verifone",
    role: "Senior Data Analyst",
    period: "TODO — dates",
    // TODO — no description supplied for this role.
    summary: "TODO — description",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-creative-designer",
    organisation: "Kommar Technologies",
    role: "Creative Designer",
    period: "TODO — dates",
    summary:
      "Created digital assets including advertising creatives, landing pages, email templates, website content and social campaigns. Developed brand identities and visual communication systems. Worked with performance metrics including CTR, conversion rates and ROI. Used A/B testing and iterative design to improve creative performance. Used generative AI tools to accelerate concept development and creative production.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-xr-developer",
    organisation: "TODO — organisation",
    role: "XR Developer",
    period: "TODO — dates",
    summary:
      "Developing immersive VR/AR experiences using Unity and Unreal Engine. Building interactive 3D environments and real-time experiences.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-3d-vfx",
    organisation: "TODO — organisation",
    role: "Animator, 3D Modeller & VFX Artist",
    period: "TODO — dates",
    summary:
      "Produced advanced 3D models and character animations using Maya and Blender. Created VFX using Houdini and industry-standard compositing tools. Performed texturing and digital sculpting with Substance Painter and ZBrush.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-graphic-designer",
    organisation: "TODO — organisation",
    role: "Graphic Designer",
    period: "TODO — dates",
    // TODO — no description supplied for this role.
    summary: "TODO — description",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-data-ai",
    organisation: "TODO — organisation",
    role: "Data Science & AI/ML Practitioner",
    period: "TODO — dates",
    summary:
      "Conducted Python-based data analysis, feature engineering and machine learning experiments. Applied statistical modelling for insights and predictive analytics. Growing expertise in TensorFlow, PyTorch and Scikit-learn.",
    highlights: [],
    placeholder: false,
  },
  {
    id: "exp-cyber-analyst",
    organisation: "TODO — organisation",
    role: "Junior Cybersecurity Analyst",
    period: "TODO — dates",
    summary:
      "Studying ethical hacking through platforms including TryHackMe and related hands-on environments. Learning network defense, threat analysis and security tools. Practicing CTF-style challenges.",
    highlights: [],
    placeholder: false,
  },
];

/**
 * Professional development.
 *
 * The only place capability levels are stated. `weight` is a relative
 * visual measure with no number attached — never rendered as a percentage,
 * because a percentage would be a fabricated precision about a person.
 *
 * The Data Science and Cybersecurity weights are held deliberately low: both
 * were specified as growing/junior, and flattening them level with XR
 * Development would misrepresent him.
 */
export const professionalDevelopment: ProfessionalDevelopmentEntry[] = [
  {
    discipline: "xr",
    label: "XR Development",
    level: "Advanced",
    weight: 0.92,
    note: "Modelling, animation, VFX, texturing and real-time.",
  },
  {
    discipline: "creative",
    label: "Creative",
    level: "Advanced",
    weight: 0.9,
    note: "Identity, UI/UX, digital art and campaign creative.",
  },
  {
    discipline: "software",
    label: "Software Engineering",
    level: "Advanced / Broad",
    weight: 0.82,
    note: "TODO — confirm level. Python, TypeScript, React and C#/C++.",
  },
  {
    discipline: "ai",
    label: "Data Science",
    level: "Growing",
    weight: 0.45,
    note: "Data analysis and visualisation; machine learning is growing, not senior.",
  },
  {
    discipline: "security",
    label: "Cybersecurity",
    level: "Currently Developing",
    weight: 0.3,
    note: "Junior. Actively studying and practising.",
  },
];

/**
 * CERTIFICATIONS — names and issuers are verified.
 * No dates and no credential IDs were supplied; both stay TODO.
 */
export const certifications: Certification[] = [
  { id: "cert-endpoint-security", name: "Endpoint Security", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-network-defense", name: "Network Defense", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-cyber-threat-management", name: "Cyber Threat Management", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-ethical-hacker", name: "Ethical Hacker", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-junior-cyber-analyst", name: "Junior Cybersecurity Analyst", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-data-analytics", name: "Data Analytics", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-networking-basics", name: "Networking Basics", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-network-devices", name: "Network Devices & Initial Configuration", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  { id: "cert-python", name: "Python", issuer: "Cisco Networking Academy", issued: "TODO — date", placeholder: false },
  {
    id: "cert-xr-developer",
    name: "XR Developer Certificate",
    issuer:
      "CXI-Africa (Centre for Digital Transformation and Innovation Africa)",
    issued: "TODO — date",
    placeholder: false,
  },
];

/**
 * TRAINING — ongoing study. Verified from the cybersecurity description.
 */
export const training: TrainingEntry[] = [
  {
    id: "training-ethical-hacking",
    name: "Ethical hacking — hands-on practice",
    provider: "TryHackMe and related hands-on environments",
    period: "TODO — dates",
    inProgress: true,
    placeholder: false,
  },
];

/**
 * LANGUAGES — verified.
 */
export const languages: LanguageEntry[] = [
  { name: "English", level: "Native" },
  { name: "Afrikaans", level: "Proficient" },
];

/**
 * TIMELINE — ordering is honest, every date is TODO. No date was supplied
 * for any role, so none is shown.
 */
export const timeline: TimelineEntry[] = [
  {
    id: "tl-creative",
    period: "TODO — dates",
    title: "Creative and design practice",
    detail: "Brand identity, digital art, UI/UX and campaign creative.",
    discipline: "creative",
    placeholder: false,
  },
  {
    id: "tl-3d",
    period: "TODO — dates",
    title: "3D, animation and VFX",
    detail: "Modelling, character animation, sculpting, texturing and VFX.",
    discipline: "xr",
    placeholder: false,
  },
  {
    id: "tl-software",
    period: "TODO — dates",
    title: "Software development",
    detail: "Application and interface development.",
    discipline: "software",
    placeholder: false,
  },
  {
    id: "tl-data",
    period: "TODO — dates",
    title: "Data and AI/ML",
    detail: "Data analysis, visualisation and machine learning experiments.",
    discipline: "ai",
    placeholder: false,
  },
  {
    id: "tl-security",
    period: "Current",
    title: "Cybersecurity",
    detail: "Actively developing this capability.",
    discipline: "security",
    placeholder: false,
  },
];

/* ------------------------------------------------------------------ */
/* Currently building / learning                                       */
/* ------------------------------------------------------------------ */

export const currentlyBuilding: CurrentlyBuilding[] = [
  {
    id: "cb-1",
    title: "Cybersecurity development",
    discipline: "security",
    status: "studying",
    note: "Working through practical labs and ethical hacking material.",
    placeholder: true,
  },
  {
    id: "cb-2",
    title: "AI experiment",
    discipline: "ai",
    status: "exploring",
    note: "Placeholder — replace with the actual experiment.",
    placeholder: true,
  },
  {
    id: "cb-3",
    title: "XR prototype",
    discipline: "xr",
    status: "building",
    note: "Placeholder — replace with the actual prototype.",
    placeholder: true,
  },
  {
    id: "cb-4",
    title: "Automation experiment",
    discipline: "software",
    status: "building",
    note: "Placeholder — replace with the actual experiment.",
    placeholder: true,
  },
];

/* ------------------------------------------------------------------ */
/* Beyond the code                                                     */
/* ------------------------------------------------------------------ */

export const beyond: BeyondEntry[] = [
  { id: "b-1", label: "3D", media: { kind: "image", src: "", alt: "", pending: true } },
  { id: "b-2", label: "VFX", media: { kind: "image", src: "", alt: "", pending: true } },
  { id: "b-3", label: "Motion", media: { kind: "image", src: "", alt: "", pending: true } },
  { id: "b-4", label: "Visual design", media: { kind: "image", src: "", alt: "", pending: true } },
];

/* ------------------------------------------------------------------ */
/* Selectors — keep filtering logic out of components                  */
/* ------------------------------------------------------------------ */

export function projectsByDiscipline(id: DisciplineId): Project[] {
  return projects.filter((p) => p.discipline === id);
}

export function skillGroupsByDiscipline(id: DisciplineId): SkillGroup[] {
  return skillGroups.filter((g) => g.discipline === id);
}

export function currentlyBuildingByDiscipline(
  id: DisciplineId,
): CurrentlyBuilding[] {
  return currentlyBuilding.filter((c) => c.discipline === id);
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
