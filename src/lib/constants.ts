export const APP_NAME = "Rainout Summit";

export const ROLES = ["attendee", "startup", "investor", "speaker", "partner", "media"] as const;

// One shared vocabulary: someone who *needs* X matches someone who *offers* X.
export const INTENTS = [
  "Funding",
  "Deal flow",
  "Customers",
  "Partnerships",
  "Talent",
  "Jobs",
  "Mentorship",
  "Press",
  "Co-founder",
  "Product feedback",
] as const;

export const INDUSTRIES = [
  "AI",
  "Fintech",
  "Climate",
  "Health",
  "Education",
  "SaaS",
  "E-commerce",
  "Media",
  "Mobility",
  "Gaming",
  "Web3",
  "Cybersecurity",
  "Hardware",
  "Other",
] as const;

export const ROOMS = [
  { title: "Lobby", topic: "Say hi. Everyone stranded by the storm lands here." },
  { title: "AI & Machine Learning", topic: "Models, agents, infra, applied AI." },
  { title: "Fintech", topic: "Payments, banking, insurtech, crypto rails." },
  { title: "Climate & Energy", topic: "Climate tech, energy, sustainability." },
  { title: "Health & Bio", topic: "Healthtech, biotech, wellbeing." },
  { title: "Education", topic: "Edtech, learning, future of work." },
  { title: "Investors × Founders", topic: "Founders pitch, investors scout. Be concise." },
  { title: "Hiring & Jobs", topic: "Post roles, find roles." },
  { title: "Portugal & Lisbon", topic: "Local ecosystem, meetups once the rain stops." },
] as const;

export const MAX_GROUP_SIZE = 12;
export const MAX_MESSAGE_LENGTH = 2000;
