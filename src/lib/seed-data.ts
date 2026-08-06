export interface SeedDisease {
  ayush_term: string;
  namaste_code: string;
  icd11_tm2_code: string;
  modern_equivalent: string;
  system_of_medicine: string;
  short_description: string;
  synonyms: string[];
}

export const SEED_DISEASES: SeedDisease[] = [
  {
    ayush_term: "Madhumeha",
    namaste_code: "NAM-AY-DEMO-0001",
    icd11_tm2_code: "TM2-DEMO-SA00",
    modern_equivalent: "Type 2 Diabetes Mellitus",
    system_of_medicine: "Ayurveda",
    short_description:
      "A vataja prameha marked by sweet urine, excessive thirst and progressive emaciation.",
    synonyms: ["Madhumeeha", "Madhumeh", "Sugar Disease", "Honey Urine Disease", "Prameha", "Sweet Urine", "Madhu Meha"],
  },
  {
    ayush_term: "Amlapitta",
    namaste_code: "NAM-AY-DEMO-0002",
    icd11_tm2_code: "TM2-DEMO-SB10",
    modern_equivalent: "Gastro-oesophageal Reflux / Hyperacidity",
    system_of_medicine: "Ayurveda",
    short_description: "Sour, burning digestive disorder caused by vitiated pitta and impaired agni.",
    synonyms: ["Amla Pitta", "Amlapita", "Acidity", "Hyperacidity", "Sour Belching", "Acid Reflux", "Heart Burn"],
  },
  {
    ayush_term: "Ardhavabhedaka",
    namaste_code: "NAM-AY-DEMO-0003",
    icd11_tm2_code: "TM2-DEMO-SC22",
    modern_equivalent: "Migraine",
    system_of_medicine: "Ayurveda",
    short_description: "Unilateral paroxysmal head pain of vata-kapha origin, often with nausea.",
    synonyms: ["Ardhavbhedaka", "Ardha Avabhedaka", "Half Head Pain", "Migraine Headache", "Adha Shishi", "Suryavarta"],
  },
  {
    ayush_term: "Tamaka Shwasa",
    namaste_code: "NAM-AY-DEMO-0004",
    icd11_tm2_code: "TM2-DEMO-SD31",
    modern_equivalent: "Bronchial Asthma",
    system_of_medicine: "Ayurveda",
    short_description: "Paroxysmal dyspnoea with wheezing, aggravated at night and by cold exposure.",
    synonyms: ["Tamak Shwas", "Tamaka Swasa", "Shwasa Roga", "Asthma", "Breathing Disease", "Wheezing", "Dama"],
  },
];

export const SEED_PATIENTS = [
  { name: "Ramesh Iyer", age: 54, gender: "Male", phone: "+91 98200 11223", department: "General Medicine", term: "Madhumeha" },
  { name: "Sunita Devi", age: 38, gender: "Female", phone: "+91 98111 44556", department: "Panchakarma", term: "Amlapitta" },
  { name: "Arjun Menon", age: 29, gender: "Male", phone: "+91 99400 77889", department: "Neurology", term: "Ardhavabhedaka" },
  { name: "Fatima Sheikh", age: 46, gender: "Female", phone: "+91 98330 99001", department: "Pulmonology", term: "Tamaka Shwasa" },
];