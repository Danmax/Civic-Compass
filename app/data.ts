export type DimensionKey =
  | "economic"
  | "social"
  | "liberty"
  | "global"
  | "justice"
  | "markets"
  | "identity"
  | "change"
  | "trust"
  | "faith";

export type CategoryKey =
  | "economy"
  | "immigration"
  | "justice"
  | "family"
  | "equal"
  | "rights"
  | "institutions";

export type Weight = { dimension: DimensionKey; weight: number };

export type Question = {
  id: number;
  category: CategoryKey;
  statement: string;
  context: string;
  weights: Weight[];
  value: string;
};

export const DIMENSIONS: Record<
  DimensionKey,
  { name: string; low: string; high: string; explanation: string }
> = {
  economic: {
    name: "Economic approach",
    low: "Public investment",
    high: "Economic freedom",
    explanation: "How you balance shared public provision with private choice and lower taxation.",
  },
  social: {
    name: "Social outlook",
    low: "Progressive",
    high: "Traditional",
    explanation: "How you weigh social reform, inherited norms, family structures, and cultural continuity.",
  },
  liberty: {
    name: "Liberty & authority",
    low: "Individual liberty",
    high: "Government authority",
    explanation: "When personal choice conflicts with public order, safety, or collective rules.",
  },
  global: {
    name: "Global orientation",
    low: "Global cooperation",
    high: "National sovereignty",
    explanation: "How much decisions should prioritize international cooperation or national independence.",
  },
  justice: {
    name: "Criminal justice",
    low: "Rehabilitation",
    high: "Law & order",
    explanation: "How you balance prevention and second chances with enforcement, punishment, and public safety.",
  },
  markets: {
    name: "Economic systems",
    low: "Public direction",
    high: "Market capitalism",
    explanation: "Whether essential outcomes are best delivered through markets, public ownership, or a mix.",
  },
  identity: {
    name: "Equal treatment",
    low: "Identity-conscious",
    high: "Individual treatment",
    explanation: "Whether policy should account for group disparities or apply the same rules to each person.",
  },
  change: {
    name: "Pace of change",
    low: "Rapid reform",
    high: "Gradual change",
    explanation: "How quickly institutions should respond to social problems and emerging norms.",
  },
  trust: {
    name: "Institutional confidence",
    low: "Skeptical",
    high: "Trusting",
    explanation: "How much confidence you place in public institutions, experts, and established processes.",
  },
  faith: {
    name: "Public values",
    low: "Secular policy",
    high: "Faith-informed",
    explanation: "How religion and moral traditions should relate to public decisions in a pluralistic society.",
  },
};

export const CATEGORIES: Record<
  CategoryKey,
  {
    name: string;
    short: string;
    description: string;
    history: string;
    viewpoints: string;
    debate: string;
    reading: string[];
  }
> = {
  economy: {
    name: "Economy & public services",
    short: "Economy",
    description: "How markets, government, employers, and workers should share responsibility for prosperity and security.",
    history: "Modern debates draw from industrialization, the New Deal, postwar growth, deregulation, and expanding social insurance.",
    viewpoints: "Views range from free-market approaches to social democracy, with many mixed-economy positions between them.",
    debate: "Key questions include taxation, public ownership, worker power, competition, and which services should be guaranteed.",
    reading: ["Congressional Budget Office: The Budget and Economic Outlook", "Federal Reserve: Purposes and Functions"],
  },
  immigration: {
    name: "Immigration & borders",
    short: "Immigration",
    description: "How a country balances lawful entry, border security, economic needs, family unity, and humanitarian protection.",
    history: "U.S. immigration policy has repeatedly shifted through quotas, exclusion laws, refugee programs, and the 1965 immigration reforms.",
    viewpoints: "Competing views emphasize sovereignty and enforcement, humanitarian duties, economic gains, or pressure on local services.",
    debate: "Current debates cover asylum, legal immigration capacity, enforcement, citizenship, employer accountability, and legalization.",
    reading: ["Congressional Research Service: U.S. Immigration Policy", "Migration Policy Institute: Immigration Data Hub"],
  },
  justice: {
    name: "Crime & criminal justice",
    short: "Justice",
    description: "How society protects the public, holds people accountable, prevents crime, and supports rehabilitation.",
    history: "Policy has moved between rehabilitation, tougher sentencing, community policing, and reforms to bail and incarceration.",
    viewpoints: "Some prioritize consistent enforcement and victims; others stress prevention, oversight, treatment, and disparate impacts.",
    debate: "Central questions include police resources, accountability, sentencing, bail, youth justice, and reentry.",
    reading: ["Bureau of Justice Statistics: Criminal Justice Data", "National Institute of Justice: Crime and Justice Research"],
  },
  family: {
    name: "Family, education & community",
    short: "Family",
    description: "The roles of parents, schools, religious communities, and government in supporting children and families.",
    history: "Debates have evolved alongside public schooling, changing household structures, women’s employment, and civil-rights law.",
    viewpoints: "Positions differ on parental authority, plural family forms, public support, tradition, and school discretion.",
    debate: "Key debates include childcare, parental notice, sensitive curricula, marriage policy, and religious liberty.",
    reading: ["Child Trends: Family and Child Well-being", "National Center for Education Statistics"],
  },
  equal: {
    name: "Equal opportunity & inclusion",
    short: "Equality",
    description: "How institutions should pursue nondiscrimination, representation, individual merit, and fair opportunity.",
    history: "The debate reflects Reconstruction, civil-rights law, affirmative action, disability rights, and modern DEI programs.",
    viewpoints: "Some favor identity-conscious remedies; others emphasize neutral rules, individual treatment, and socioeconomic approaches.",
    debate: "Disputes center on preferences, measurement of disparities, anti-discrimination enforcement, and definitions of merit.",
    reading: ["U.S. Equal Employment Opportunity Commission", "Pew Research Center: Race and Ethnicity"],
  },
  rights: {
    name: "Rights, sex & gender policy",
    short: "Rights",
    description: "How policy can account for identity, biological sex, privacy, safety, fairness, and equal civic treatment.",
    history: "Current policy sits at the intersection of sex-discrimination law, privacy doctrine, athletics rules, and evolving gender norms.",
    viewpoints: "Approaches prioritize gender identity, sex-based protections, individualized accommodations, or combinations of these.",
    debate: "Questions include facilities, sport eligibility, healthcare, parental roles, shelters, prisons, and private alternatives.",
    reading: ["Congressional Research Service: Equal Protection", "U.S. Department of Justice: Civil Rights"],
  },
  institutions: {
    name: "Democracy, liberty & institutions",
    short: "Institutions",
    description: "The rules and norms that support democracy, civil liberty, public trust, and peaceful disagreement.",
    history: "Liberal democracy developed through constitutional limits, expanding suffrage, civil liberties, and professional institutions.",
    viewpoints: "Some emphasize reform and expert capacity; others stress decentralization, skepticism, tradition, and checks on elite power.",
    debate: "Current questions involve speech, institutional legitimacy, majority rule, minority rights, and the pace of reform.",
    reading: ["National Archives: Founding Documents", "Library of Congress: Constitution Annotated"],
  },
};

const q = (
  id: number,
  category: CategoryKey,
  statement: string,
  context: string,
  value: string,
  weights: Weight[],
): Question => ({ id, category, statement, context, value, weights });

export const QUESTIONS: Question[] = [
  q(1, "institutions", "Free speech should protect political opinions that many people find offensive.", "Consider legal protection, not whether the speech deserves approval.", "Individual liberty", [{ dimension: "liberty", weight: -1 }, { dimension: "trust", weight: -0.25 }]),
  q(2, "economy", "Government should guarantee access to essential healthcare, even when doing so requires higher taxes.", "Focus on access to essential care rather than one specific healthcare system.", "Compassion", [{ dimension: "economic", weight: -1 }, { dimension: "markets", weight: -0.65 }]),
  q(3, "immigration", "The government should strengthen enforcement at the national border.", "Assume enforcement remains consistent with constitutional and humanitarian law.", "National sovereignty", [{ dimension: "global", weight: 1 }, { dimension: "liberty", weight: 0.35 }]),
  q(4, "justice", "Nonviolent offenders should have greater access to treatment and rehabilitation instead of incarceration.", "Consider people who do not present a serious public-safety risk.", "Second chances", [{ dimension: "justice", weight: -1 }, { dimension: "social", weight: -0.15 }]),
  q(5, "equal", "Hiring and promotion decisions should primarily be based on individual qualifications and job performance.", "This does not imply that discrimination protections should be weakened.", "Merit", [{ dimension: "identity", weight: 1 }, { dimension: "markets", weight: 0.2 }]),
  q(6, "family", "Parents should have primary authority over the upbringing and education of their children.", "Think about the usual case while recognizing existing child-safety protections.", "Parental responsibility", [{ dimension: "social", weight: 0.75 }, { dimension: "liberty", weight: -0.45 }, { dimension: "faith", weight: 0.2 }]),
  q(7, "rights", "Schools should offer private or single-user facilities when students have conflicting privacy needs.", "Consider this as an accommodation available to any student.", "Practical compromise", [{ dimension: "change", weight: 0.25 }, { dimension: "identity", weight: 0.1 }]),
  q(8, "economy", "Private ownership and market competition generally create more prosperity than government economic planning.", "Compare overall systems rather than claiming markets never fail.", "Economic opportunity", [{ dimension: "markets", weight: 1 }, { dimension: "economic", weight: 0.7 }]),
  q(9, "institutions", "Government should take an active role in reducing social and economic inequality.", "Consider taxes, services, and regulation together.", "Equality", [{ dimension: "economic", weight: -0.9 }, { dimension: "identity", weight: -0.25 }]),
  q(10, "immigration", "People who came to the country illegally but have lived peacefully for many years should have a way to become legal residents.", "A pathway may include background checks, fees, and other requirements.", "Compassion", [{ dimension: "global", weight: -0.7 }, { dimension: "change", weight: -0.2 }]),
  q(11, "justice", "Police departments should receive the resources needed to respond effectively to violent crime.", "Resources can include staffing, training, technology, and prevention partnerships.", "Public safety", [{ dimension: "justice", weight: 0.85 }, { dimension: "trust", weight: 0.3 }]),
  q(12, "equal", "Schools and employers should sometimes consider a person's background when trying to make opportunities fairer.", "Think about limited consideration among otherwise qualified candidates, not automatic preferences.", "Remedial fairness", [{ dimension: "identity", weight: -1 }, { dimension: "change", weight: -0.25 }]),
  q(13, "family", "Families can take many forms and should receive equal legal protection.", "Consider civil law and access to public benefits.", "Equal dignity", [{ dimension: "social", weight: -0.8 }, { dimension: "faith", weight: -0.2 }]),
  q(14, "rights", "Women's sports may need rules about who can compete to keep competition fair and safe.", "Rules can vary by age, sport, and level of competition.", "Fairness", [{ dimension: "social", weight: 0.65 }, { dimension: "identity", weight: 0.45 }, { dimension: "change", weight: 0.3 }]),
  q(15, "institutions", "The best government is one with fair elections, basic rights, and laws that apply equally to everyone.", "This is about democratic rules and civil liberties, not a political party.", "Democratic norms", [{ dimension: "trust", weight: 0.9 }, { dimension: "liberty", weight: -0.3 }]),
  q(16, "economy", "Workers should have more influence over major decisions in the companies where they work.", "Influence could occur through unions, boards, ownership, or other structures.", "Worker voice", [{ dimension: "markets", weight: -0.6 }, { dimension: "economic", weight: -0.45 }]),
  q(17, "immigration", "The legal immigration process should be expanded and made more efficient.", "Consider both the number of legal pathways and how well the system operates.", "Opportunity", [{ dimension: "global", weight: -0.8 }, { dimension: "markets", weight: 0.15 }]),
  q(18, "justice", "Police departments require stronger independent oversight and accountability systems.", "Oversight can include civilian review, transparent reporting, and external investigation.", "Accountability", [{ dimension: "justice", weight: -0.65 }, { dimension: "trust", weight: -0.45 }]),
  q(19, "equal", "When different groups have different outcomes, that does not always prove discrimination caused the difference.", "Other explanations may still warrant investigation.", "Evidence", [{ dimension: "identity", weight: 0.8 }, { dimension: "trust", weight: -0.15 }]),
  q(20, "family", "Government should help working parents pay for childcare.", "Support could include childcare tax credits, subsidies, or direct assistance for families with young children.", "Family stability", [{ dimension: "economic", weight: -0.7 }, { dimension: "social", weight: -0.15 }]),
  q(21, "rights", "People should generally be able to use public facilities that correspond with their gender identity.", "Consider ordinary public facilities; specialized settings may raise separate questions.", "Equal access", [{ dimension: "social", weight: -0.8 }, { dimension: "identity", weight: -0.55 }, { dimension: "change", weight: -0.35 }]),
  q(22, "institutions", "Rapid social change can create instability even when its goals are well intentioned.", "Consider both the aims of reform and the effects of implementation.", "Social stability", [{ dimension: "change", weight: 1 }, { dimension: "social", weight: 0.3 }]),
  q(23, "economy", "Very large companies can sometimes have too much power over workers, customers, or public debate.", "Think about monopolies, market access, speech, and working conditions.", "Distributed power", [{ dimension: "markets", weight: -0.45 }, { dimension: "trust", weight: -0.35 }]),
  q(24, "immigration", "Asylum applicants should receive a fair hearing before removal.", "This statement does not assume that every claim should be approved.", "Due process", [{ dimension: "global", weight: -0.45 }, { dimension: "liberty", weight: -0.35 }]),
  q(25, "justice", "Repeat violent offenders should generally receive longer sentences.", "Focus on serious violent offenses and proven repeat conduct.", "Accountability", [{ dimension: "justice", weight: 1 }, { dimension: "liberty", weight: 0.35 }]),
  q(26, "equal", "Diversity programs can become unfair when they focus more on group identity than individual merit.", "Consider program design rather than the motives of participants.", "Individual fairness", [{ dimension: "identity", weight: 0.9 }, { dimension: "trust", weight: -0.3 }]),
  q(27, "family", "Religious and traditional families should be free to live by their values as long as they respect the rights of others.", "Consider pluralism: protection for belief alongside equal civil rights.", "Religious liberty", [{ dimension: "faith", weight: 0.8 }, { dimension: "liberty", weight: -0.6 }]),
  q(28, "rights", "Shelters and prisons should be allowed to consider someone's sex when deciding placement.", "Other factors may include safety, risk, identity, and individualized review.", "Safety", [{ dimension: "social", weight: 0.55 }, { dimension: "identity", weight: 0.4 }, { dimension: "liberty", weight: 0.15 }]),
  q(29, "institutions", "Society should continue reforming traditions that result in unfair treatment.", "Consider evidence of harm as well as the value of continuity.", "Social progress", [{ dimension: "change", weight: -0.9 }, { dimension: "social", weight: -0.45 }]),
  q(30, "economy", "The economy works best with both private businesses and some public programs.", "Think about the overall framework rather than any one program.", "Pragmatism", [{ dimension: "markets", weight: -0.15 }, { dimension: "economic", weight: -0.2 }]),
  q(31, "immigration", "Employers should face stronger consequences for knowingly hiring unauthorized workers.", "Assume employers have a reliable way to verify work authorization.", "Rule of law", [{ dimension: "global", weight: 0.5 }, { dimension: "justice", weight: 0.3 }]),
  q(32, "justice", "Poverty and lack of opportunity are major contributors to crime.", "This does not remove individual responsibility for criminal acts.", "Prevention", [{ dimension: "justice", weight: -0.7 }, { dimension: "economic", weight: -0.25 }]),
  q(33, "equal", "Organizations should actively examine whether their rules create avoidable barriers for people from different backgrounds.", "Focus on reviewing rules and access, not guaranteeing equal outcomes.", "Inclusion", [{ dimension: "identity", weight: -0.6 }, { dimension: "trust", weight: 0.2 }]),
  q(34, "family", "Schools should be able to teach some sensitive topics when educators believe they are age appropriate.", "Consider established curriculum review and opt-out processes.", "Professional judgment", [{ dimension: "social", weight: -0.55 }, { dimension: "trust", weight: 0.65 }]),
  q(35, "rights", "Policies in sex-specific spaces should be decided individually based on safety, privacy, and the circumstances involved.", "Consider case-by-case review instead of one universal rule.", "Context", [{ dimension: "identity", weight: -0.15 }, { dimension: "trust", weight: 0.25 }]),
  q(36, "institutions", "Public institutions have become disconnected from many working-class and traditional communities.", "Consider government, higher education, media, and large civic organizations.", "Representation", [{ dimension: "trust", weight: -0.85 }, { dimension: "change", weight: 0.2 }]),
  q(37, "economy", "When the government controls most of the economy, political freedom can be at risk.", "Distinguish full state control from limited public programs in a market democracy.", "Limited government", [{ dimension: "markets", weight: 0.85 }, { dimension: "liberty", weight: -0.3 }]),
  q(38, "immigration", "High levels of immigration can place excessive pressure on housing, schools, healthcare, and public services.", "Effects can vary by region, time period, and government capacity.", "Community capacity", [{ dimension: "global", weight: 0.75 }, { dimension: "economic", weight: 0.15 }]),
  q(39, "justice", "Juvenile offenders should generally be treated differently from adult offenders.", "Differences can include sentencing, privacy, education, and rehabilitation.", "Youth development", [{ dimension: "justice", weight: -0.75 }, { dimension: "change", weight: -0.1 }]),
  q(40, "family", "Communities and religious institutions should play a larger role in supporting families.", "This can complement rather than replace government or private support.", "Community responsibility", [{ dimension: "faith", weight: 0.65 }, { dimension: "economic", weight: 0.15 }]),
  q(41, "rights", "Adults should generally be able to make their own reproductive healthcare decisions.", "Consider the balance between personal privacy, medical judgment, and government limits.", "Bodily autonomy", [{ dimension: "social", weight: -0.8 }, { dimension: "liberty", weight: -0.75 }, { dimension: "faith", weight: -0.35 }]),
  q(42, "rights", "The government should be able to place stronger limits on abortion after a certain stage of pregnancy.", "Think about broad policy rules, not emergency medical situations.", "Protection of life", [{ dimension: "social", weight: 0.75 }, { dimension: "faith", weight: 0.55 }, { dimension: "liberty", weight: 0.35 }]),
  q(43, "institutions", "The Second Amendment protects an important individual right to own firearms.", "This does not mean every gun regulation would be unconstitutional.", "Self-defense", [{ dimension: "liberty", weight: -0.75 }, { dimension: "social", weight: 0.35 }, { dimension: "trust", weight: -0.15 }]),
  q(44, "institutions", "Gun laws should focus more on public safety than on protecting broad access to firearms.", "Consider background checks, storage rules, permits, and limits on certain weapons.", "Public safety", [{ dimension: "liberty", weight: 0.7 }, { dimension: "trust", weight: 0.25 }, { dimension: "social", weight: -0.2 }]),
  q(45, "family", "Parents who do not live with their children should be expected to provide consistent financial support.", "Consider ordinary child-support duties while recognizing hardship and custody disputes.", "Family responsibility", [{ dimension: "social", weight: 0.55 }, { dimension: "justice", weight: 0.25 }, { dimension: "economic", weight: 0.15 }]),
  q(46, "family", "Public schools should focus more on reading, math, history, and job skills than on social or political topics.", "Think about curriculum priorities across the school year.", "Educational basics", [{ dimension: "social", weight: 0.6 }, { dimension: "trust", weight: -0.25 }, { dimension: "change", weight: 0.2 }]),
  q(47, "justice", "Fraud in public programs, elections, and government contracts should be investigated more aggressively.", "Apply this standard regardless of political party, agency, or group involved.", "Public integrity", [{ dimension: "justice", weight: 0.55 }, { dimension: "trust", weight: -0.45 }, { dimension: "liberty", weight: 0.15 }]),
  q(48, "institutions", "Claims of political corruption should require strong evidence before they are treated as fact.", "This applies to accusations against any party, campaign, official, or institution.", "Evidence standards", [{ dimension: "trust", weight: 0.55 }, { dimension: "justice", weight: -0.2 }, { dimension: "change", weight: 0.1 }]),
  q(49, "institutions", "Voting rules should prioritize preventing fraud, even if that makes voting less convenient for some people.", "Consider ID rules, ballot handling, voter-roll maintenance, and election audits.", "Voting integrity", [{ dimension: "trust", weight: -0.35 }, { dimension: "liberty", weight: 0.25 }, { dimension: "change", weight: 0.2 }]),
  q(50, "institutions", "Voting rules should prioritize broad access, even if some fraud-prevention rules are less strict.", "Consider registration, mail voting, early voting, and access for people with limited time or transportation.", "Voting access", [{ dimension: "trust", weight: 0.25 }, { dimension: "liberty", weight: -0.35 }, { dimension: "identity", weight: -0.25 }]),
  q(51, "family", "Public policy should do more to discourage sexual behavior that weakens families or harms children.", "Think about education, culture, incentives, and community standards rather than criminal punishment alone.", "Moral responsibility", [{ dimension: "faith", weight: 0.85 }, { dimension: "social", weight: 0.75 }, { dimension: "liberty", weight: 0.35 }]),
  q(52, "institutions", "A leader's personal integrity matters even when you agree with that leader's policies.", "Consider honesty, conflicts of interest, responsibility, and respect for lawful limits.", "Character", [{ dimension: "trust", weight: 0.45 }, { dimension: "social", weight: 0.15 }]),
  q(53, "rights", "Women's safety and privacy should receive special attention in public policy.", "Consider shelters, prisons, sports, healthcare, public facilities, and workplace protections.", "Safety and dignity", [{ dimension: "social", weight: 0.35 }, { dimension: "identity", weight: 0.25 }, { dimension: "justice", weight: 0.25 }]),
  q(54, "equal", "Anti-discrimination laws should be enforced strongly even when enforcement creates costs for businesses or institutions.", "Think about employment, housing, education, disability access, and public services.", "Equal protection", [{ dimension: "identity", weight: -0.7 }, { dimension: "economic", weight: -0.2 }, { dimension: "trust", weight: 0.25 }]),
  q(55, "equal", "Public conversations about race should recognize both ongoing discrimination and fatigue from constant racial conflict.", "This asks whether both concerns deserve serious attention, not whether they are equal in every case.", "Social trust", [{ dimension: "identity", weight: 0.1 }, { dimension: "trust", weight: 0.25 }, { dimension: "change", weight: 0.15 }]),
  q(56, "institutions", "The Supreme Court should mainly interpret the Constitution as written, not update it for modern policy goals.", "Consider the Court's role compared with Congress, presidents, states, and voters.", "Judicial restraint", [{ dimension: "change", weight: 0.55 }, { dimension: "trust", weight: 0.2 }, { dimension: "social", weight: 0.25 }]),
  q(57, "institutions", "Presidents should have less power so that Congress and the courts can provide stronger checks.", "Apply this across presidents from any political party.", "Checks and balances", [{ dimension: "liberty", weight: -0.35 }, { dimension: "trust", weight: -0.15 }, { dimension: "change", weight: -0.1 }]),
  q(58, "immigration", "Foreign policy should put American interests first, even when allies or international organizations disagree.", "Consider trade, defense commitments, immigration, foreign aid, and diplomacy.", "National interest", [{ dimension: "global", weight: 0.9 }, { dimension: "trust", weight: -0.15 }]),
  q(59, "immigration", "Global cooperation is often necessary to solve major problems like war, migration, pandemics, and climate risk.", "Consider cooperation among countries while recognizing that each nation has its own interests.", "Global cooperation", [{ dimension: "global", weight: -0.85 }, { dimension: "trust", weight: 0.25 }, { dimension: "change", weight: -0.1 }]),
  q(60, "economy", "Government should avoid short-term benefits when they create serious long-term costs for future generations.", "Think about debt, public health, environment, infrastructure, and national security.", "Long-term stewardship", [{ dimension: "change", weight: 0.35 }, { dimension: "economic", weight: 0.15 }, { dimension: "trust", weight: 0.25 }]),
  q(61, "institutions", "The pursuit of happiness depends more on personal freedom than on government programs.", "Consider opportunity, personal responsibility, community support, and public safety nets.", "Personal agency", [{ dimension: "liberty", weight: -0.7 }, { dimension: "economic", weight: 0.45 }, { dimension: "markets", weight: 0.3 }]),
  q(62, "immigration", "Defending freedom sometimes requires military strength and a willingness to confront hostile governments.", "Consider deterrence, alliances, costs, risks, and limits on military action.", "Defense of freedom", [{ dimension: "global", weight: 0.45 }, { dimension: "justice", weight: 0.25 }, { dimension: "trust", weight: 0.15 }]),
];

export const ANSWERS = [
  { label: "Strongly agree", short: "Strongly agree", value: 3 },
  { label: "Agree", short: "Agree", value: 2 },
  { label: "Slightly agree", short: "Slightly agree", value: 1 },
  { label: "Neutral or unsure", short: "Neutral", value: 0 },
  { label: "Slightly disagree", short: "Slightly disagree", value: -1 },
  { label: "Disagree", short: "Disagree", value: -2 },
  { label: "Strongly disagree", short: "Strongly disagree", value: -3 },
] as const;

export const IMPORTANCE = [
  { label: "Not important", value: 0.75 },
  { label: "Somewhat important", value: 1 },
  { label: "Important", value: 1.2 },
  { label: "Very important", value: 1.4 },
] as const;
