CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'clinician',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.diseases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ayush_term text NOT NULL,
  namaste_code text NOT NULL,
  icd11_tm2_code text NOT NULL,
  modern_equivalent text NOT NULL,
  system_of_medicine text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  synonyms jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diseases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diseases TO authenticated;
GRANT ALL ON public.diseases TO service_role;
ALTER TABLE public.diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diseases readable by everyone" ON public.diseases FOR SELECT USING (true);

CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer,
  gender text,
  phone text,
  department text,
  diagnosis_id uuid REFERENCES public.diseases(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo patients open access" ON public.patients FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id uuid REFERENCES public.diseases(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  query_text text NOT NULL DEFAULT '',
  confidence_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'auto',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mappings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mappings TO authenticated;
GRANT ALL ON public.mappings TO service_role;
ALTER TABLE public.mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo mappings open access" ON public.mappings FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.concept_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_id uuid NOT NULL REFERENCES public.diseases(id) ON DELETE CASCADE,
  source_system text NOT NULL,
  target_system text NOT NULL,
  equivalence text NOT NULL DEFAULT 'equivalent',
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.concept_maps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concept_maps TO authenticated;
GRANT ALL ON public.concept_maps TO service_role;
ALTER TABLE public.concept_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "concept maps readable by everyone" ON public.concept_maps FOR SELECT USING (true);

INSERT INTO public.diseases (ayush_term, namaste_code, icd11_tm2_code, modern_equivalent, system_of_medicine, short_description, synonyms) VALUES
('Madhumeha', 'NAM-AY-DEMO-0001', 'TM2-DEMO-SA00', 'Type 2 Diabetes Mellitus', 'Ayurveda', 'A vataja prameha marked by sweet urine, excessive thirst and progressive emaciation.', '["Madhumeeha","Madhumeh","Sugar Disease","Honey Urine Disease","Prameha","Sweet Urine","Madhu Meha"]'::jsonb),
('Amlapitta', 'NAM-AY-DEMO-0002', 'TM2-DEMO-SB10', 'Gastro-oesophageal Reflux / Hyperacidity', 'Ayurveda', 'Sour, burning digestive disorder caused by vitiated pitta and impaired agni.', '["Amla Pitta","Amlapita","Acidity","Hyperacidity","Sour Belching","Acid Reflux","Heart Burn"]'::jsonb),
('Ardhavabhedaka', 'NAM-AY-DEMO-0003', 'TM2-DEMO-SC22', 'Migraine', 'Ayurveda', 'Unilateral paroxysmal head pain of vata-kapha origin, often with nausea.', '["Ardhavbhedaka","Ardha Avabhedaka","Half Head Pain","Migraine Headache","Adha Shishi","Suryavarta"]'::jsonb),
('Tamaka Shwasa', 'NAM-AY-DEMO-0004', 'TM2-DEMO-SD31', 'Bronchial Asthma', 'Ayurveda', 'Paroxysmal dyspnoea with wheezing, aggravated at night and by cold exposure.', '["Tamak Shwas","Tamaka Swasa","Shwasa Roga","Asthma","Breathing Disease","Wheezing","Dama"]'::jsonb);

INSERT INTO public.concept_maps (disease_id, source_system, target_system, equivalence, comment)
SELECT id, 'http://demo.intermed.in/fhir/CodeSystem/namaste', 'http://id.who.int/icd/release/11/mms/tm2', 'equivalent', 'Illustrative demo mapping - not official WHO/NAMASTE content'
FROM public.diseases;

INSERT INTO public.concept_maps (disease_id, source_system, target_system, equivalence, comment)
SELECT id, 'http://demo.intermed.in/fhir/CodeSystem/namaste', 'http://id.who.int/icd/release/11/mms', 'relatedto', 'Biomedical equivalent concept (demo)'
FROM public.diseases;

INSERT INTO public.app_users (username, password_hash, role) VALUES
('doctor', 'demo-not-a-real-hash', 'clinician'),
('admin', 'demo-not-a-real-hash', 'admin');

INSERT INTO public.patients (name, age, gender, phone, department, diagnosis_id)
SELECT 'Ramesh Iyer', 54, 'Male', '+91 98200 11223', 'General Medicine', id FROM public.diseases WHERE ayush_term = 'Madhumeha';
INSERT INTO public.patients (name, age, gender, phone, department, diagnosis_id)
SELECT 'Sunita Devi', 38, 'Female', '+91 98111 44556', 'Panchakarma', id FROM public.diseases WHERE ayush_term = 'Amlapitta';
INSERT INTO public.patients (name, age, gender, phone, department, diagnosis_id)
SELECT 'Arjun Menon', 29, 'Male', '+91 99400 77889', 'Neurology', id FROM public.diseases WHERE ayush_term = 'Ardhavabhedaka';
INSERT INTO public.patients (name, age, gender, phone, department, diagnosis_id)
SELECT 'Fatima Sheikh', 46, 'Female', '+91 98330 99001', 'Pulmonology', id FROM public.diseases WHERE ayush_term = 'Tamaka Shwasa';

INSERT INTO public.mappings (disease_id, patient_id, query_text, confidence_score, status, source, reason, created_at)
SELECT p.diagnosis_id, p.id, d.ayush_term, 100, 'confirmed', 'manual', 'Exact match on AYUSH term', now() - (random() * interval '6 days')
FROM public.patients p JOIN public.diseases d ON d.id = p.diagnosis_id;

INSERT INTO public.mappings (disease_id, query_text, confidence_score, status, source, reason, created_at)
SELECT id, 'Sugar Disease', 92, 'confirmed', 'auto', 'Matched via synonym ''Sugar Disease''', now() - interval '2 days' FROM public.diseases WHERE ayush_term = 'Madhumeha';
INSERT INTO public.mappings (disease_id, query_text, confidence_score, status, source, reason, created_at)
SELECT id, 'Madhumeeha', 88, 'confirmed', 'auto', 'Fuzzy match on AYUSH term (spelling variant)', now() - interval '1 day' FROM public.diseases WHERE ayush_term = 'Madhumeha';
INSERT INTO public.mappings (disease_id, query_text, confidence_score, status, source, reason, created_at)
SELECT id, 'acidity', 71, 'pending', 'auto', 'Matched via synonym ''Acidity''', now() - interval '3 days' FROM public.diseases WHERE ayush_term = 'Amlapitta';