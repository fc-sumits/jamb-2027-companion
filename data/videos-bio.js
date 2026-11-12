/* ============================================================
   Sturdy — Biology study map (curated from 3 source playlists)
   Playlists: Learnliftapp JAMB & WAEC · MaxChem5 · Excellent
   Simplified Academy. Video titles are exact; the app resolves
   real video IDs from the playlists at runtime (~3 quota units,
   cached). Section → topic → subtopic, each with keys used by
   Recall to pull only questions from studied material.
   ============================================================ */
"use strict";

window.VIDEO_MAP = {
  Biology: {
    playlists: [
      "PL11XVymvna4LBiFISDoynUF4SclrMuEny",
      "PLB0IxFe_OTeNVy1HW7FCM61YPk_ps0_4C",
      "PL7BYUWfV903V4Ww-AbFekSWoio8mwJKZ9"
    ],
    sections: [
      /* ---------------- SECTION A ---------------- */
      { id: "A", name: "Variety of Organisms", topics: [
        { id: "living", name: "Living Organisms", subs: [
          { id: "living-chars", name: "Characteristics of living things",
            keys: ["characteristics of living", "mr niger", "movement", "respiration", "nutrition", "excretion", "growth", "reproduction", "irritability", "living things"],
            videos: [
              { t: "Characteristics Of Living Things", d: "full" },
              { t: "CHARACTERISTICS OF LIVING THINGS", d: "full" },
              { t: "LIVING THINGS (JAMB CHAPTER 1)", d: "recap" }
            ],
            notes: [
              "MR NIGER D: Movement, Respiration, Nutrition, Irritability (sensitivity), Growth, Excretion, Reproduction, Death — the 8 characteristics of living things.",
              "All living things are made of cells; the cell is the basic unit of life.",
              "Irritability = the ability to respond to stimuli (e.g., plants bending toward light)."
            ] },
          { id: "cell-structure", name: "Cell structure & functions of components",
            keys: ["cell", "organelle", "nucleus", "mitochondrion", "mitochondria", "ribosome", "chloroplast", "cell wall", "cytoplasm", "vacuole", "lysosome"],
            videos: [
              { t: "Cell Theory & Specialization! History, Structure & Cellular Adaptation", d: "full" },
              { t: "CELL HISTORY & PAST QUESTION", d: "full" },
              { t: "CONTENT OF THE CYTOPLASM & PAST QUESTION", d: "full" }
            ],
            notes: [
              "Nucleus: contains chromosomes (DNA); controls all cell activities.",
              "Mitochondrion: site of aerobic respiration; releases energy (ATP) — the powerhouse.",
              "Ribosome: site of protein synthesis.",
              "Chloroplast: contains chlorophyll; site of photosynthesis (plants only).",
              "Cell wall: rigid cellulose layer; gives plant cells shape and support (absent in animal cells).",
              "Cell membrane: partially permeable; controls what enters and leaves the cell.",
              "Vacuole: stores water and dissolved substances; large and central in plant cells.",
              "Lysosome: contains digestive enzymes; destroys worn-out organelles.",
              "Cytoplasm: jelly-like medium where chemical reactions happen; holds organelles."
            ] },
          { id: "levels-org", name: "Levels of organization (cell → tissue → organ → system)",
            keys: ["tissue", "organ", "system", "levels of organization", "meristem", "xylem", "phloem", "epithelial", "specialization"],
            videos: [
              { t: "Organisation of Life! Cells, Tissues, Organs & Systems", d: "full" },
              { t: "Plant Tissues! Meristems, Xylem, Phloem & Support Tissues", d: "full" },
              { t: "Animal Tissues! Epithelial, Connective, Muscular & Nervous", d: "full" }
            ],
            notes: [
              "Levels: cell → tissue → organ → system → organism.",
              "Tissue = group of similar cells doing the same job (e.g., muscle tissue, xylem).",
              "Plant tissues: meristematic (growth), xylem (water transport), phloem (food transport), parenchyma, collenchyma, sclerenchyma (support).",
              "Animal tissues: epithelial (covering), connective (blood, bone), muscular (movement), nervous (coordination).",
              "Meristems are the only dividing plant tissues — found at root and shoot tips (apical)."
            ] }
        ] },
        { id: "classification", name: "Classification / Evolution of Groups", subs: [
          { id: "kingdoms", name: "Monera, Protista, Fungi & the five kingdoms",
            keys: ["monera", "protista", "fungi", "kingdom", "bacteria", "virus", "algae", "classification", "five kingdoms"],
            videos: [
              { t: "Microorganisms! Bacteria, Viruses", d: "full" },
              { t: "THALLOPHYTA — ALGAE AND FUNGI", d: "full" },
              { t: "The Secret to Remembering All 5 Kingdoms of Classification", d: "full" }
            ],
            notes: [
              "Five kingdoms: Monera (prokaryotes, no true nucleus), Protista (single-celled eukaryotes), Fungi, Plantae, Animalia.",
              "Monera: bacteria and blue-green algae (cyanobacteria) — no membrane-bound nucleus.",
              "Protista: Amoeba, Paramecium, Euglena — single-celled, true nucleus.",
              "Fungi: no chlorophyll, cell wall of chitin, feed saprophytically (Mucor, mushroom, yeast).",
              "Viruses are NOT in any kingdom — not truly alive outside a host; no cell structure."
            ] },
          { id: "plantae", name: "Plantae: Thallophyta → Bryophyta → Pteridophyta → Spermatophyta",
            keys: ["bryophyte", "pteridophyte", "spermatophyte", "gymnosperm", "angiosperm", "moss", "fern", "thallophyta"],
            videos: [
              { t: "THALLOPHYTA — ALGAE AND FUNGI", d: "full" },
              { t: "BRYOPHYTES — MOSSES", d: "full" },
              { t: "PTERIDOPHYTES — FERNS", d: "full" },
              { t: "SPERMATOPHYTES", d: "full" },
              { t: "GYMNOSPERMS AND ANGIOSPERMS", d: "full" }
            ],
            notes: [
              "Bryophytes (mosses): no vascular tissue, no true roots — rhizoids; live in moist places.",
              "Pteridophytes (ferns): vascular tissue present but reproduce by spores, not seeds.",
              "Spermatophytes: seed plants — divided into Gymnosperms (naked seeds, cones, e.g., pine) and Angiosperms (seeds inside fruits/flowers).",
              "Angiosperms: monocots (one seed leaf, parallel veins, fibrous roots) vs dicots (two seed leaves, net veins, tap root).",
              "Evolutionary order: Thallophyta → Bryophyta → Pteridophyta → Gymnospermae → Angiospermae."
            ] },
          { id: "invertebrates", name: "Animalia — invertebrate phyla",
            keys: ["protozoa", "platyhelminthes", "nematoda", "annelida", "mollusca", "arthropoda", "insecta", "crustacea", "arachnida", "tapeworm", "coelenterata", "hydra", "cnidaria", "invertebrate"],
            videos: [
              { t: "CLASSIFICATIONS IN ANIMALS", d: "full" },
              { t: "PHYLUM PROTOZOA", d: "full" },
              { t: "PHYLUM PLATYHELMINTHES", d: "full" },
              { t: "TAPE WORM", d: "full" },
              { t: "PHYLUM NEMATODA", d: "full" },
              { t: "PHYLUM ANNELIDA", d: "full" },
              { t: "PHYLUM MOLLUSCA", d: "full" },
              { t: "PHYLUM ARTHROPODA", d: "full" },
              { t: "CLASS INSECTA", d: "full" },
              { t: "CLASS CRUSTACEA", d: "full" },
              { t: "CLASS ARACHNIDA", d: "full" },
              { t: "CLASS CHILOPODA & DIPLOPODA", d: "full" },
              { t: "CENTIPEDES AND MILLIPEDES", d: "full" }
            ],
            notes: [
              "Protozoa: single-celled (Amoeba — pseudopodia; Paramecium — cilia; Euglena — flagellum).",
              "Coelenterata (Cnidaria): hollow body, radial symmetry, stinging cnidoblasts (Hydra, jellyfish, sea anemone).",
              "Platyhelminthes: flatworms, no body cavity (tapeworm, liver fluke) — hermaphrodites.",
              "Nematoda: roundworms, cylindrical, complete digestive tract (Ascaris).",
              "Annelida: segmented worms with bristles (earthworm, leech) — closed blood system.",
              "Mollusca: soft body, muscular foot, most have shells (snail, octopus).",
              "Arthropoda: jointed legs, exoskeleton of chitin, segmented body — largest phylum.",
              "Arthropod classes: Insecta (3 pairs of legs, 1 pair antennae), Crustacea (5+ pairs, 2 antennae, gills), Arachnida (4 pairs of legs, no antennae), Chilopoda (centipedes — 1 pair legs/segment), Diplopoda (millipedes — 2 pairs legs/segment)."
            ] },
          { id: "vertebrates", name: "Animalia — vertebrate classes",
            keys: ["pisces", "amphibia", "reptilia", "aves", "mammalia", "vertebrate", "fish", "bird", "mammal", "poikilothermic"],
            videos: [
              { t: "PISCES (FISHES) PART 1", d: "full" },
              { t: "PISCES (FISHES) PART 3", d: "full" },
              { t: "PISCES (FISHES) PART 4", d: "full" },
              { t: "Reproductive System in Fish & Amphibians + Egg Parts", d: "partial" }
            ],
            notes: [
              "Pisces: cold-blooded, gills, fins, scales; cartilaginous (shark) vs bony (tilapia).",
              "Amphibia: cold-blooded, moist skin, gills as larvae then lungs, external fertilization, metamorphosis (frog, toad).",
              "Reptilia: cold-blooded, dry scaly skin, lungs, internal fertilization, shelled eggs on land (lizard, snake, crocodile).",
              "Aves: warm-blooded, feathers, beak, hollow bones, shelled eggs, lungs with air sacs.",
              "Mammalia: warm-blooded, hair/fur, mammary glands, mostly live birth, diaphragm, external ears (pinnae).",
              "Cold-blooded (poikilothermic) = body temperature changes with the environment: fish, amphibians, reptiles."
            ] }
        ] },
        { id: "adaptations", name: "Structural & behavioural adaptations", recall: true,
          keys: ["adaptation", "camouflage", "countershading", "termite", "beak", "mouthpart", "warning coloration", "cryptic"],
          videos: [],
          notes: [
            "Adaptive colouration — Camouflage (cryptic): blends with surroundings (stick insect).",
            "Adaptive colouration — Countershading: dark above, light below (fish, toads) — cancels shadows.",
            "Adaptive colouration — Warning: bright colours warn predators of danger (monarch butterfly).",
            "Adaptive colouration — Disruptive: stripes break the body outline (zebra).",
            "Termite castes: queen (lays eggs), king (mates), workers (feed & build), soldiers (defend), alates (winged — start new colonies).",
            "Bird beaks: sparrow (seeds), heron (spear-fishing), eagle (hooked — tearing flesh), hummingbird (long thin — nectar).",
            "Insect mouthparts: mosquito (piercing & sucking), butterfly (sucking proboscis), cockroach (biting & chewing), housefly (sponging), bee (chewing & lapping)."
          ] }
      ] },

      /* ---------------- SECTION B ---------------- */
      { id: "B", name: "Form and Functions", topics: [
        { id: "structure", name: "Internal structure of flowering plants & mammals",
          keys: ["root", "stem", "leaf", "vascular bundle", "internal structure", "epidermis", "cortex", "mesophyll"],
          videos: [
            { t: "ROOTS, STEMS AND LEAVES", d: "full" },
            { t: "Plant Tissues! Meristems, Xylem, Phloem & Support Tissues", d: "partial" },
            { t: "Organs & Systems! How the Body Coordinates", d: "partial" }
          ],
          notes: [
            "Root cross-section: epidermis (with root hairs), cortex, endodermis, pericycle, xylem & phloem.",
            "Stem: epidermis, cortex, vascular bundles arranged in a ring (dicots); xylem inside, phloem outside.",
            "Leaf: upper/lower epidermis with stomata, palisade mesophyll (most chloroplasts), spongy mesophyll (air spaces), veins (xylem + phloem).",
            "Root hairs increase surface area for water absorption by osmosis; mineral ions absorbed by active transport."
          ] },
        { id: "nutrition", name: "Nutrition", subs: [
          { id: "modes", name: "Modes of nutrition (auto/heterotrophic)",
            keys: ["autotrophic", "heterotrophic", "saprophyte", "holozoic", "parasitic nutrition", "chemosynthesis", "carnivorous"],
            videos: [
              { t: "Modes of Nutrition! Autotrophic vs Heterotrophic", d: "full" }
            ],
            notes: [
              "Autotrophic: makes own food — photosynthesis (light energy) or chemosynthesis (chemical energy).",
              "Chemosynthesis: making food using chemical energy — nitrifying, sulphur and iron bacteria.",
              "Heterotrophic types: holozoic (ingest whole food — man), saprophytic (feed on dead matter — fungi), parasitic (live on a host — tapeworm).",
              "Carnivorous plants (e.g., sundew, pitcher plant) photosynthesize but trap insects for nitrogen."
            ] },
          { id: "plant-nutrition", name: "Plant nutrition & photosynthesis",
            keys: ["photosynthesis", "light reaction", "dark reaction", "stomata", "chlorophyll", "mineral", "magnesium", "nitrate", "potassium", "photolysis"],
            videos: [
              { t: "Plant Nutrition & Photosynthesis! Light vs Dark Reactions", d: "full" },
              { t: "Plant Nutrition | Full Lesson | Photosynthesis", d: "full",
                ch: [["Types of nutrition", 103], ["Photosynthesis requirements", 214], ["Stages", 403], ["Factors", 659], ["Mineral nutrition", 869], ["Adaptations", 1095]] },
              { t: "Plant Minerals! Macro vs Micro Nutrients & Deficiency Symptoms", d: "full" }
            ],
            notes: [
              "Photosynthesis: 6CO2 + 6H2O --light/chlorophyll--> C6H12O6 + 6O2.",
              "Light reactions: in the grana (thylakoids); chlorophyll traps light; water is split (photolysis) releasing O2; ATP and NADPH made.",
              "Dark reactions (Calvin cycle): in the stroma; CO2 is fixed into sugar using ATP + NADPH; does not need light directly.",
              "Macronutrients: nitrogen (leaves yellow — older leaves first), magnesium (part of chlorophyll — yellowing between veins), phosphorus (poor roots, purple leaves), potassium (weak stems, leaf edges brown).",
              "Micronutrients: iron, boron, zinc, manganese, copper, molybdenum, chlorine.",
              "Factors affecting photosynthesis: light intensity, CO2 concentration, water, temperature, chlorophyll.",
              "Stomata: open when guard cells are turgid, close when flaccid — controls gas exchange and water loss."
            ] },
          { id: "animal-nutrition", name: "Animal nutrition, food classes & food tests",
            keys: ["food test", "benedict", "biuret", "iodine", "emulsion", "carbohydrate", "protein", "lipid", "vitamin", "feeding", "malnutrition", "kwashiorkor"],
            videos: [
              { t: "Animal Nutrition And Feeding Mechanisms", d: "full" },
              { t: "Food Nutrients! Carbs, Proteins, Lipids, Vitamins & Minerals", d: "full" },
              { t: "Food Tests! Benedict's, Biuret, Iodine & Emulsion", d: "full" },
              { t: "ANIMAL NUTRITION Made EASY", d: "full" },
              { t: "99% FAIL This WAEC & JAMB Food Test Question!", d: "full" },
              { t: "Food Classes", d: "full" },
              { t: "FEEDING HABIT", d: "full" }
            ],
            notes: [
              "Food test — reducing sugar: Benedict's solution, heat → brick-red/orange precipitate.",
              "Food test — starch: iodine → blue-black.",
              "Food test — protein: Biuret reagent → violet/purple.",
              "Food test — fats & oils: filter paper translucent spot, or emulsion test (ethanol + water → cloudy).",
              "Vitamin C (ascorbic acid): DCPIP decolourizes; deficiency → scurvy.",
              "Vitamin D: deficiency → rickets; made in skin using sunlight.",
              "Protein deficiency in children → kwashiorkor; overall energy deficiency → marasmus.",
              "Feeding mechanisms: filtering/suspension (mosquito larva), deposit (earthworm), fluid (aphid, mosquito), bulk (snake, man)."
            ] },
          { id: "teeth-digestion", name: "Mammalian teeth & the alimentary canal",
            keys: ["teeth", "incisor", "canine", "molar", "premolar", "enzyme", "amylase", "pepsin", "alimentary", "digestion", "villus", "bile", "oesophagus", "duodenum"],
            videos: [
              { t: "Human Teeth Biology", d: "full" },
              { t: "Human Digestive System! Enzymes, Organs & Absorption", d: "full" },
              { t: "DIGESTIVE SYSTEM (STOMACH)", d: "full" }
            ],
            notes: [
              "Teeth: incisors (cutting), canines (tearing), premolars & molars (grinding). Human dental formula: 2,1,2,3 per quarter — 32 teeth total.",
              "Mouth: salivary amylase (ptyalin) digests starch → maltose.",
              "Stomach: pepsin digests proteins → peptides; needs acid (HCl) conditions; rennin curdles milk in infants.",
              "Small intestine: bile emulsifies fats (no enzyme); pancreatic amylase, trypsin (proteins), lipase (fats).",
              "Absorption happens in the ileum — villi increase surface area; products: glucose & amino acids into blood capillaries, fatty acids into lacteals.",
              "Large intestine: reabsorbs water; undigested food forms faeces (egestion, not excretion).",
              "Digestion of starch: starch → maltose (amylase) → glucose (maltase). Protein: protein → peptides (pepsin/trypsin) → amino acids (peptidase). Fats: fat → emulsion (bile) → fatty acids + glycerol (lipase)."
            ] }
        ] },
        { id: "transport", name: "Transport", subs: [
          { id: "circulation", name: "Circulatory system: blood, heart & vessels",
            keys: ["blood", "heart", "artery", "vein", "capillary", "circulation", "plasma", "haemoglobin", "pulmonary", "aorta", "ventricle"],
            videos: [
              { t: "Need For Transportation", d: "full" },
              { t: "All About Blood! Composition, Groups, Transfusion & Clotting", d: "full" },
              { t: "Human Circulation! Heart Anatomy, Blood Vessels", d: "full" },
              { t: "How the Circulatory System Works | Blood & Heart", d: "full",
                ch: [["Definition", 45], ["Heart structure", 80], ["Blood vessels", 135], ["Blood flow", 190], ["Blood pressure", 245], ["Disorders", 300]] },
              { t: "BLOOD CELL", d: "full" },
              { t: "Plasma", d: "full" },
              { t: "Blood Cells Explained in 25 Minutes (RBC, WBC, Platelets)", d: "full" }
            ],
            notes: [
              "Blood = plasma (55%, water + dissolved food, wastes, hormones) + cells (45%): RBC, WBC, platelets.",
              "RBC (erythrocytes): biconcave, no nucleus, contain haemoglobin — carries oxygen.",
              "WBC (leucocytes): defend the body — phagocytes engulf germs, lymphocytes make antibodies.",
              "Platelets (thrombocytes): cell fragments — clotting.",
              "Arteries carry blood AWAY from the heart (thick muscular walls, no valves); veins return blood (valves present); capillaries link them (one cell thick).",
              "Pulmonary artery: heart → lungs (the only artery carrying deoxygenated blood). Pulmonary vein: lungs → heart (oxygenated).",
              "Hepatic portal vein: intestines → liver — richest in digested food after a meal.",
              "Left ventricle has the thickest wall — pumps blood to the whole body through the aorta.",
              "Double circulation: pulmonary (heart ↔ lungs) and systemic (heart ↔ body) in one complete circuit."
            ] },
          { id: "cell-environment", name: "Osmosis, diffusion & active transport",
            keys: ["osmosis", "diffusion", "active transport", "plasmolysis", "turgid", "flaccid", "hemolysis", "turgor", "permeable"],
            videos: [
              { t: "Cell Environment! Diffusion, Osmosis & Active Transport", d: "full" },
              { t: "OSMOSIS & PAST QUESTION", d: "full" },
              { t: "Cell and Its Environment | Diffusion, Osmosis, Plasmolysis", d: "full" },
              { t: "CELL AND ITS ENVIRONMENT 🔥 Past Questions", d: "recap" }
            ],
            notes: [
              "Diffusion: particles move from high → low concentration; no membrane needed.",
              "Osmosis: water moves through a partially permeable membrane from a dilute → concentrated solution.",
              "Active transport: movement against the concentration gradient; requires energy (ATP) — e.g., mineral ions into root hairs.",
              "Plant cell in strong salt/sugar solution: loses water → plasmolysis (cytoplasm shrinks from wall). In pure water: becomes turgid (wall prevents bursting).",
              "Animal cell in pure water: swells and bursts (haemolysis in RBC) — no cell wall.",
              "Turgor pressure keeps herbaceous plants firm; wilting happens when cells lose turgor."
            ] },
          { id: "blood-groups", name: "Blood groups & transfusion",
            keys: ["blood group", "abo", "rhesus", "transfusion", "agglutination", "universal donor", "universal recipient"],
            videos: [
              { t: "Blood Groups for JAMB 2026 | ABO, Rhesus & Transfusion", d: "full" }
            ],
            notes: [
              "ABO groups: A, B, AB, O — based on antigens on RBC and antibodies in plasma.",
              "Group O = universal donor (no A/B antigens). Group AB = universal recipient (no anti-A or anti-B antibodies).",
              "Wrong transfusion → agglutination (clumping of red blood cells).",
              "Rhesus (Rh) factor: Rh+ has the D antigen; Rh- mother with Rh+ baby can make anti-D antibodies (erythroblastosis)."
            ] }
        ] },
        { id: "respiration", name: "Respiration", recall: true,
          keys: ["respiration", "aerobic", "anaerobic", "glycolysis", "krebs", "fermentation", "lactic acid", "oxygen debt", "gills", "lungs", "trachea", "breathing", "diaphragm", "alveoli"],
          videos: [
            { t: "Respiration Explained! Aerobic vs Anaerobic & Mechanics of Breathing", d: "full" },
            { t: "Respiration in Higher Animals! Lungs, Diaphragm & Gas Exchange", d: "full" },
            { t: "Respiratory System Lesson 1", d: "full" }
          ],
          notes: [
            "Respiration = breakdown of food to release energy (ATP) in cells.",
            "Aerobic: glucose + oxygen → CO2 + water + energy — occurs in mitochondria, yields most ATP.",
            "Anaerobic in yeast (fermentation): glucose → ethanol + CO2 + little energy — used in bread and brewing.",
            "Anaerobic in muscles: glucose → lactic acid + little energy; the oxygen needed to clear the lactic acid = oxygen debt.",
            "Glycolysis: in the cytoplasm; glucose → pyruvate; no oxygen needed; yields 2 ATP.",
            "Krebs cycle: in mitochondria; needs oxygen; produces most of the ATP.",
            "Breathing in mammals: diaphragm flattens + ribs move up/out → inhale; reverse → exhale.",
            "Gas exchange surface: alveoli — thin, moist, numerous, rich capillary supply.",
            "Respiratory surfaces: body surface (earthworm), gills (fish), tracheae (insects), lungs (mammals), stomata/lenticels (plants)."
          ] },
        { id: "excretion", name: "Excretion & the kidney", recall: true,
          keys: ["excretion", "kidney", "nephron", "urea", "urine", "dialysis", "excretory", "deamination", "ureter", "bladder"],
          videos: [
            { t: "The Excretory System! Kidney Anatomy, Nephrons & Waste Removal", d: "full" },
            { t: "Excretory System", d: "full" },
            { t: "Excretory System, Nephron & Urine Formation FULL LESSON", d: "full",
              ch: [["Intro", 0], ["Excretion vs egestion", 126], ["Metabolic waste", 214], ["Excretory organs", 427], ["Excretion in mammals", 729], ["Urine formation", 1343]] }
          ],
          notes: [
            "Excretion = removing metabolic waste (made by body cells); egestion = passing out undigested food.",
            "Kidney: filters blood; each contains about a million nephrons.",
            "Urine formation: ultrafiltration (in the glomerulus/Bowman's capsule) → selective reabsorption (glucose, salts, water in the tubule) → urine (water, salts, urea).",
            "Liver: deamination (excess amino acids → urea); breaks down haemoglobin (bile pigment).",
            "Lungs excrete CO2 and water vapour; skin excretes sweat (water, salts, small urea).",
            "Kidney failure treated by dialysis or transplant.",
            "Plant excretory products: CO2 and oxygen (gases), tannins, resins, gums, latex, alkaloids — stored in leaves, bark or vacuoles."
          ] },
        { id: "support", name: "Support & movement", subs: [
          { id: "skeleton", name: "Skeleton, joints & muscles",
            keys: ["skeleton", "bone", "joint", "cartilage", "muscle", "axial", "appendicular", "tendon", "ligament", "ball and socket", "hinge"],
            videos: [
              { t: "Bones, Joints & Cartilage! Skeletal System & Movement", d: "full" },
              { t: "Muscular System", d: "full" },
              { t: "Skeletal System (Axial & Appendicular) – Likely Questions", d: "full",
                ch: [["Axial skeleton", 102], ["Appendicular skeleton", 358], ["Functions", 531]] },
              { t: "Explanation of the Skeletal system", d: "partial" }
            ],
            notes: [
              "Axial skeleton: skull, vertebral column, ribs, sternum. Appendicular: limbs (fore/hind) + limb girdles (pectoral, pelvic).",
              "Functions: support, protection, movement (with muscles), blood cell formation (bone marrow), mineral storage.",
              "Joint types: ball-and-socket (shoulder, hip — all directions), hinge (elbow, knee — one direction), pivot (neck), gliding (wrist).",
              "Tendon connects muscle to bone; ligament connects bone to bone; cartilage cushions joint ends.",
              "Muscles work in antagonistic pairs: biceps contracts while triceps relaxes (flexion vs extension of the arm)."
            ] },
          { id: "plant-movement", name: "Plant movements: tropisms & nastic responses", recall: true,
            keys: ["tropism", "nastic", "auxin", "phototropism", "geotropism", "hydrotropism", "thigmotropism", "mimosa"],
            videos: [],
            notes: [
              "Tropism: a DIRECTIONAL growth response to a directional stimulus.",
              "Phototropism (light), geotropism (gravity), hydrotropism (water), thigmotropism (touch).",
              "Shoots are positively phototropic and negatively geotropic; roots the opposite.",
              "Auxins collect on the shaded side of a shoot → cells elongate more → shoot bends toward light.",
              "Nastic movement: NON-directional response — Mimosa leaves fold when touched (seismonasty); flowers open/close.",
              "Tactic movement: the WHOLE organism moves toward/away from a stimulus (e.g., Chlamydomonas toward light)."
            ] }
        ] },
        { id: "reproduction", name: "Reproduction", subs: [
          { id: "cell-repro", name: "Cell division: mitosis & meiosis",
            keys: ["mitosis", "meiosis", "asexual", "sexual reproduction", "binary fission", "conjugation", "budding", "chromatid"],
            videos: [
              { t: "Reproduction in Living Organisms – Asexual & Sexual", d: "full" },
              { t: "The Cell Cycle & Mitosis", d: "full" },
              { t: "Meiosis", d: "full" },
              { t: "Mitosis vs Meiosis | Never Confuse Them Again", d: "full" }
            ],
            notes: [
              "Asexual reproduction: one parent, no gametes, offspring genetically identical (binary fission — Amoeba; budding — yeast/Hydra; spores — fungi; vegetative propagation — plants).",
              "Sexual reproduction: two parents, gametes fuse → variation in offspring.",
              "Mitosis: body cells; 2 identical diploid cells; growth and repair; one division.",
              "Meiosis: sex cells (gametes); 4 genetically different HAPLOID cells; two divisions; creates variation.",
              "Crossing over in meiosis (prophase I) exchanges genetic material between chromatids — a major source of variation."
            ] },
          { id: "plant-repro", name: "Plant reproduction: flowers, pollination & fruits",
            keys: ["pollination", "fertilization", "fertilisation", "flower", "stamen", "carpel", "ovule", "placentation", "fruit", "seed dispersal", "vegetative propagation", "grafting"],
            videos: [
              { t: "Plant Reproduction! Flowers, Pollination & Double Fertilization", d: "full" },
              { t: "Parts of a Flower & Their Functions", d: "full" }
            ],
            notes: [
              "Flower parts: stamen = male (anther + filament); carpel = female (stigma + style + ovary).",
              "Pollination: transfer of pollen from anther to stigma — self or cross; agents: wind, insects, water.",
              "Insect-pollinated flowers: large, brightly coloured, scented, sticky pollen, nectar. Wind-pollinated: small, dull, huge amounts of light pollen, feathery stigmas.",
              "Double fertilization (angiosperms): one male nucleus fuses with the egg (zygote), the other with the two polar nuclei (endosperm — food store).",
              "After fertilization: ovule → seed, ovary → fruit, ovary wall → pericarp.",
              "Placentation = arrangement of ovules in the ovary: marginal (bean), axial (tomato), parietal (pawpaw), basal (sunflower), central (watermelon).",
              "Fruit types: simple (one ovary — mango), aggregate (many ovaries of ONE flower — custard apple), multiple (ovaries of several flowers — pineapple); succulent vs dry.",
              "Vegetative propagation: asexual reproduction via vegetative parts — bulb (onion), tuber (yam), rhizome (ginger), runner (strawberry), corm; artificial: cutting, grafting (scion on stock), budding, layering."
            ] },
          { id: "mammal-repro", name: "Mammalian reproduction",
            keys: ["testis", "ovary", "uterus", "placenta", "menstruation", "ovulation", "pregnancy", "fetus", "gestation", "contraception", "ivf"],
            videos: [
              { t: "The Male Reproductive System!", d: "full" },
              { t: "The Female Reproductive System!", d: "full" },
              { t: "Male Reproductive system", d: "partial" },
              { t: "FEMALE REPRODUCTIVE SYSTEM", d: "partial" },
              { t: "Reproductive System in Fish & Amphibians", d: "partial" }
            ],
            notes: [
              "Male: testes (make sperm + testosterone), scrotum keeps them cooler than body temperature, epididymis stores sperm, vas deferens carries sperm, prostate + seminal vesicles add fluid (semen).",
              "Female: ovaries (eggs + oestrogen/progesterone), fallopian tube (site of fertilization), uterus (implantation), cervix, vagina.",
              "Menstrual cycle ≈ 28 days: ovulation (~day 14) releases the egg; the uterine lining thickens; if no fertilization, lining sheds (menstruation).",
              "Placenta: exchanges food, oxygen and waste between mother and fetus — no direct blood mixing; also makes progesterone.",
              "Gestation in humans ≈ 9 months (280 days).",
              "IVF: fertilization outside the body; embryo placed in the uterus (test-tube baby).",
              "Birth control: condoms, pills, IUD, vasectomy (male), tubal ligation (female)."
            ] }
        ] },
        { id: "growth", name: "Growth & germination", recall: true,
          keys: ["germination", "epigeal", "hypogeal", "radicle", "plumule", "cotyledon", "growth", "testa", "endosperm", "amylase"],
          videos: [],
          notes: [
            "Germination conditions: Water, Oxygen, suitable Temperature (WOT).",
            "Epigeal germination: cotyledons carried ABOVE ground (bean) — hypocotyl elongates.",
            "Hypogeal germination: cotyledons stay BELOW ground (maize) — epicotyl elongates.",
            "Seed parts: testa (coat), cotyledon (food store), plumule (→ shoot), radicle (→ root), endosperm (food store in maize).",
            "Growth enzymes: amylase (starch → sugar), protease (protein → amino acids), lipase (fat → fatty acids + glycerol).",
            "Growth curve: lag → log (rapid) → stationary → decline phase."
          ] },
        { id: "coordination", name: "Coordination & control", subs: [
          { id: "nervous", name: "Nervous coordination",
            keys: ["neuron", "neurone", "reflex", "central nervous", "spinal cord", "cerebrum", "cerebellum", "synapse", "nerve", "axon", "medulla"],
            videos: [
              { t: "The Nervous System", d: "full" },
              { t: "NERVOUS SYSTEM", d: "full" },
              { t: "NEURONES (NERVE CELLS)", d: "full" },
              { t: "Nervous Coordination Explained", d: "full",
                ch: [["Intro", 0], ["Nervous coordination", 320], ["The nervous system", 760], ["Central nervous system", 1210], ["Peripheral nervous system", 2115], ["The neurone", 2910], ["Reflex action", 3910]] }
            ],
            notes: [
              "CNS = brain + spinal cord. Peripheral = cranial + spinal nerves.",
              "Neurone parts: cell body, dendrites (receive), axon (carry away), myelin sheath (insulates, speeds impulse).",
              "Types: sensory (receptor → CNS), motor (CNS → effector), relay/intermediate (inside CNS).",
              "Reflex arc: receptor → sensory neurone → relay neurone → motor neurone → effector. Involuntary, fast, automatic.",
              "Synapse: gap between neurones; crossed by neurotransmitter chemicals — impulses are electrical in neurones, chemical across synapses.",
              "Brain parts: cerebrum (intelligence, memory, senses), cerebellum (balance, posture, coordination), medulla (heartbeat, breathing — involuntary)."
            ] },
          { id: "sense-organs", name: "Sense organs",
            keys: ["eye", "retina", "cornea", "ear", "cochlea", "taste", "smell", "skin", "pupil", "lens", "iris"],
            videos: [
              { t: "Sense Organs", d: "full" },
              { t: "THE HUMAN EYE (PART 1/5)", d: "full" }
            ],
            notes: [
              "Eye: cornea (refracts light), iris & pupil (control light amount), lens (fine focusing), retina (image forms — rods dim light, cones colour), optic nerve.",
              "Long sight: image behind retina — corrected with convex lens. Short sight: image in front — concave lens.",
              "Ear: outer (pinna, canal) → middle (eardrum, ossicles malleus-incus-stapes, Eustachian tube) → inner (cochlea = hearing; semicircular canals = balance).",
              "Skin: epidermis + dermis; receptors for touch, pressure, temperature, pain; also makes vitamin D and excretes sweat.",
              "Tongue: taste buds — sweet, sour, salty, bitter. Nose: olfactory receptors for smell."
            ] },
          { id: "hormonal", name: "Hormonal control (endocrine system)",
            keys: ["hormone", "endocrine", "pituitary", "insulin", "adrenaline", "thyroid", "oestrogen", "testosterone", "exocrine"],
            videos: [
              { t: "Endocrine System", d: "full",
                ch: [["Endocrine glands", 32], ["Locations", 222], ["Hormone characteristics", 351], ["Endocrine vs exocrine", 525], ["The pituitary", 773]] },
              { t: "Plant Hormones You Must Know", d: "full" }
            ],
            notes: [
              "Hormones: chemical messengers in the blood, made by ductless (endocrine) glands; slow but long-lasting; exocrine glands use ducts.",
              "Pituitary (master gland): controls other glands; growth hormone.",
              "Thyroid: thyroxine — controls metabolic rate; lack in children → cretinism.",
              "Pancreas (islets): insulin lowers blood sugar; lack/unresponsiveness → diabetes mellitus. Glucagon raises blood sugar.",
              "Adrenal: adrenaline — fight or flight (faster heart rate, more blood sugar).",
              "Ovaries: oestrogen + progesterone. Testes: testosterone.",
              "Plant hormones: auxin (growth, tropisms), gibberellin (germination, stem elongation), cytokinin (cell division), ethene (fruit ripening), abscisic acid (stomata close, dormancy)."
            ] }
        ] }
      ] },

      /* ---------------- SECTION C ---------------- */
      { id: "C", name: "Ecology", topics: [
        { id: "ecosystem", name: "Ecosystems, symbiosis & nutrient cycles",
          keys: ["ecosystem", "food chain", "food web", "symbiosis", "parasitism", "mutualism", "commensalism", "nitrogen cycle", "carbon cycle", "decomposer", "pyramid", "trophic", "producer", "saprophyte"],
          videos: [
            { t: "Ecosystems Explained! Food Chains, Webs & Energy Pyramids", d: "full" },
            { t: "Biotic Interactions! Symbiosis, Competition & Predator-Prey", d: "full" },
            { t: "Nutrient Cycles! Carbon, Nitrogen & Water Recycling", d: "full" },
            { t: "Ecological Management Made Easy | Symbiosis, Parasitism", d: "full" },
            { t: "Nitrogen Cycle JAMB 2026 ❌ Most Students Fail This", d: "full" },
            { t: "MOST REPEATED Nitrogen Cycle Questions", d: "full" }
          ],
          notes: [
            "Food chain: producer (green plant) → primary consumer (herbivore) → secondary consumer (carnivore) → tertiary consumer.",
            "Energy flows one way and DECREASES at each trophic level (only ~10% passes on) — that's why pyramids of energy are never inverted.",
            "Decomposers (bacteria, fungi) break down dead matter, returning nutrients.",
            "Symbiosis types: mutualism (both benefit — rhizobium & legume), commensalism (one benefits, other unharmed — remora & shark), parasitism (one benefits, host harmed — tapeworm).",
            "Nitrogen cycle: nitrogen fixation (lightning, rhizobium in root nodules) → nitrification (ammonia → nitrites → nitrates by nitrifying bacteria) → assimilation by plants → denitrification (denitrifying bacteria return N2 to air).",
            "Carbon cycle: photosynthesis removes CO2; respiration, combustion and decay return it."
          ] },
        { id: "habitats", name: "Natural habitats & local biomes",
          keys: ["biome", "habitat", "rainforest", "savanna", "desert", "mangrove", "ecological niche", "freshwater", "estuary"],
          videos: [
            { t: "Biomes Explained in 20 Minutes", d: "full",
              ch: [["Terrestrial & aquatic", 126], ["Tropical rainforest", 196], ["Savanna", 423], ["Desert", 513], ["Temperate", 630], ["Tundra", 804]] }
          ],
          notes: [
            "Biome = large region with a characteristic climate and community: tropical rainforest (most species, highest rainfall), savanna (grasses + scattered trees, wet/dry seasons), desert (very low rainfall, cacti store water), mangrove (salt-tolerant trees, coasts).",
            "Aquatic biomes: freshwater (ponds, rivers) and marine (oceans, estuaries where rivers meet the sea).",
            "Habitat = the place an organism lives; niche = its role in the habitat.",
            "Rainforest layers: canopy → middle/understorey → floor (few plants — little light reaches)."
          ] },
        { id: "populations", name: "Ecology of populations",
          keys: ["population", "density", "succession", "competition", "carrying capacity", "quadrat", "census", "mortality", "natality"],
          videos: [
            { t: "Population Studies! Density, Growth Curves & Sampling", d: "full" },
            { t: "Ecological Succession Questions", d: "full" },
            { t: "COMPETITION QUESTIONS", d: "full" }
          ],
          notes: [
            "Population density = number of organisms per unit area. Sampling tools: quadrat, pitfall trap, light trap; census counts a whole population.",
            "Population growth curve: lag → log (exponential) → stationary (limited by food/space) → decline.",
            "Carrying capacity = maximum population an environment can support.",
            "Competition: intraspecific (same species) vs interspecific (different species) — for food, light, space, mates.",
            "Succession: gradual replacement of one community by another — pioneer species (lichens/mosses) → grasses → shrubs → climax community (stable)."
          ] },
        { id: "soil", name: "Soil",
          keys: ["soil", "humus", "loamy", "erosion", "mulching", "crop rotation", "sandy", "clay", "leaching", "contour"],
          videos: [
            { t: "Soil Composition Calculations | Humus, Moisture, Air", d: "full" }
          ],
          notes: [
            "Soil components: mineral particles, water, air, humus (decayed organic matter), living organisms.",
            "Types: sandy (large particles, drains fast, poor nutrients), clay (tiny particles, holds water, poorly aerated), loamy (best — mixture + humus).",
            "Soil conservation: contour ridging (across slope), terracing (steps), mulching (cover soil), crop rotation, strip cropping, adding manure/fertilizer.",
            "Erosion is worse on bare, steep, overgrazed land."
          ] },
        { id: "humans-env", name: "Humans & the environment", subs: [
          { id: "diseases", name: "Diseases, pathogens & immunity", recall: true,
            keys: ["disease", "pathogen", "vector", "immunity", "vaccine", "malaria", "cholera", "endemic", "mosquito", "infection", "hiv", "tuberculosis"],
            videos: [
              { t: "Disease Classification! Infectious, Non-infectious, Endemic", d: "full" },
              { t: "Pathogens & How They Spread! Vectors, Carriers", d: "full" },
              { t: "Immunity & Vaccines! Natural vs Artificial", d: "full" },
              { t: "Human Influence on Ecosystems", d: "partial" }
            ],
            notes: [
              "Malaria: Plasmodium (protozoan) — vector female Anopheles mosquito. Cholera: Vibrio cholerae (bacteria) — contaminated water/food.",
              "Tuberculosis: Mycobacterium — airborne droplets. Polio: virus — contaminated water. Typhoid: Salmonella typhi — food/water.",
              "Bilharzia: Schistosoma worm — freshwater snail host. River blindness: Onchocerca — blackfly. Guinea worm: contaminated water.",
              "Gonorrhoea & syphilis: bacteria — sexual contact. HIV/AIDS: virus — body fluids.",
              "Endemic disease = constantly present in an area; epidemic = sudden outbreak; pandemic = worldwide.",
              "Immunity: natural (after infection or from mother) vs artificial (vaccination); active (body makes antibodies) vs passive (ready-made antibodies).",
              "Vaccines contain weakened/killed pathogens — they trigger active artificial immunity."
            ] },
          { id: "human-impact", name: "Pollution, drug abuse & conservation", recall: true,
            keys: ["pollution", "conservation", "drug abuse", "sanitation", "game reserve", "national park", "deforestation", "noise", "sewage", "who", "unicef"],
            videos: [],
            notes: [
              "Pollution types: air (CO, SO2, smoke — respiratory disease, acid rain, global warming), water (sewage, oil — water-borne disease), soil (pesticides, plastics), noise (hearing damage, stress).",
              "Control: sewage treatment, recycling, unleaded fuel, afforestation, proper waste disposal.",
              "Drug abuse: misuse of drugs without prescription (alcohol, tobacco, cannabis, heroin, cocaine) → addiction, liver damage, mental illness, crime.",
              "Conservation = protecting and managing natural resources; prevents extinction and desertification.",
              "Renewable resources (solar, water, forests) vs non-renewable (petroleum, coal).",
              "Agencies: WHO (world health), UNICEF (children), Red Cross (disaster relief), NCF (Nigerian conservation), WWF (wildlife), IUCN (endangered species), UNEP (environment).",
              "Nigerian national parks: Yankari, Kainji Lake, Cross River, Gashaka-Gumti, Chad Basin, Okomu, Kamuku."
            ] }
        ] }
      ] },

      /* ---------------- SECTION D ---------------- */
      { id: "D", name: "Heredity and Variations", topics: [
        { id: "variation", name: "Variation in populations",
          keys: ["variation", "continuous", "discontinuous", "morphological", "physiological", "twins"],
          videos: [
            { t: "Variation in Population! Genetic vs Environmental", d: "full" },
            { t: "Variation | Morphological & Physiological", d: "full",
              ch: [["Causes", 258], ["Types", 453], ["Continuous variation", 664], ["Discontinuous variation", 1299], ["Importance", 1541]] }
          ],
          notes: [
            "Morphological variation = visible structure (height, colour, fingerprint); physiological = functional/biochemical (blood group, tongue-rolling, sickle cell).",
            "Continuous variation: a range with intermediates (height, weight) — affected by genes AND environment.",
            "Discontinuous variation: distinct categories, no intermediates (blood group, sex, tongue-rolling) — genetic only.",
            "Importance of variation: adaptation, survival, and it is the raw material for evolution.",
            "Identical twins: one fertilized egg splits — same genes. Fraternal: two eggs — different genes."
          ] },
        { id: "genetics", name: "Genetics & heredity", recall: true,
          keys: ["genetic", "heredity", "mendel", "genotype", "phenotype", "allele", "dominant", "recessive", "monohybrid", "dihybrid", "test cross", "punnett", "sex-linked", "haemophilia", "colour blind", "sickle"],
          videos: [
            { t: "Genetics – Mendelian Laws, Blood Groups, Genotype/Phenotype", d: "full" },
            { t: "Genetics FULL CLASS | Monohybrid, Dihybrid, Test Cross", d: "full",
              ch: [["Intro", 0], ["Genetic terms", 185], ["Alleles", 688], ["Genotype & phenotype", 813], ["Dominant vs recessive", 1187], ["Law of Segregation", 1555], ["Independent assortment", 1891]] },
            { t: "Introduction to Genetics (Heredity)", d: "full" }
          ],
          notes: [
            "Gene = unit of heredity on DNA; alleles = different forms of a gene. Genotype = genetic make-up (TT, Tt); phenotype = what shows (tall).",
            "Mendel's 1st law (Segregation): allele pairs separate during gamete formation — each gamete gets one allele.",
            "Mendel's 2nd law (Independent assortment): genes for different traits are inherited independently.",
            "Monohybrid cross Tt × Tt → 1 TT : 2 Tt : 1 tt (genotype), 3 tall : 1 short (phenotype).",
            "Test cross: unknown genotype × homozygous recessive — if any offspring show the recessive trait, the parent was heterozygous.",
            "Sex determination: mother gives X; father gives X (girl) or Y (boy) — the FATHER determines sex.",
            "Sex-linked traits (on the X chromosome): haemophilia, colour blindness — males (XY) suffer more; females (XX) are usually carriers.",
            "Sickle cell: AA normal, AS carrier, SS sickler — two AS parents risk SS children each pregnancy: 1 in 4.",
            "Incomplete dominance: neither allele fully masks the other (red × white → pink)."
          ] },
        { id: "biotechnology", name: "Biotechnology", recall: true,
          keys: ["biotechnology", "genetic engineering", "tissue culture", "recombinant", "gmo", "insulin", "clone"],
          videos: [],
          notes: [
            "Biotechnology = using living organisms or their processes to make useful products.",
            "Applications: agriculture (GMOs, tissue culture, improved varieties), medicine (recombinant insulin, vaccines, antibiotics), food (fermentation — yogurt, cheese, bread, beer).",
            "Recombinant DNA: joining DNA from different organisms — e.g., human insulin gene inserted into bacteria.",
            "GMO concerns: biosafety, environmental effects, health risks.",
            "Fermentation is the oldest biotechnology — microbes convert sugars to alcohol/acid."
          ] }
      ] },

      /* ---------------- SECTION E ---------------- */
      { id: "E", name: "Evolution", topics: [
        { id: "evolution", name: "Evolution: theories & evidence",
          keys: ["evolution", "natural selection", "lamarck", "darwin", "fossil", "speciation", "adaptive radiation", "organic evolution"],
          videos: [
            { t: "Evolution & Natural Selection – Evidence & Theories", d: "full" },
            { t: "EVOLUTION IN BIOLOGY | Lamarck, Darwin, Evidence", d: "full",
              ch: [["Theories of origin", 128], ["Organic evolution", 284], ["Evidence", 370], ["Adaptive radiation", 881], ["Lamarck", 1221], ["Darwin", 1387]] },
            { t: "Evolution (History of life)", d: "full" }
          ],
          notes: [
            "Organic evolution = gradual change in organisms over generations from earlier forms.",
            "Lamarck: use and disuse + inheritance of acquired characters (giraffe stretched its neck) — DISPROVED.",
            "Darwin: natural selection — organisms with favourable variations survive, reproduce and pass them on (survival of the fittest).",
            "Evidence: fossils (records in sedimentary rock), comparative anatomy (homologous structures — same plan, different use), vestigial organs (appendix), embryology, selective breeding.",
            "Adaptive radiation: one ancestral species diversifies into many forms (Darwin's finches).",
            "Speciation: new species form when populations are isolated (geographical isolation) long enough to become genetically different."
          ] }
      ] },

      /* ---------------- REVISION (not a recall key source) ---------------- */
      { id: "R", name: "Revision & Past Questions", topics: [
        { id: "revision", name: "Repeated JAMB questions & hot topics", recall: false,
          keys: [],
          videos: [
            { t: "JAMB Biology Questions that Repeat Every Year", d: "full" },
            { t: "JAMB BIOLOGY 2026: Major Questions LEAKED!", d: "full" },
            { t: "Repeated JAMB Biology Questions", d: "full" },
            { t: "JAMB 2024 Biology Past Questions Complete 1–50", d: "full" },
            { t: "JAMB 400 BIOLOGY (PART 1)", d: "full" },
            { t: "JAMB 400 BIOLOGY (PART 7)", d: "full" }
          ],
          notes: [
            "Watch these in the last weeks before the exam — they cover the questions that repeat almost every year.",
            "Pair each past-question video with a Recall session on the same topic while it is fresh."
          ] }
      ] }
    ],

    /* High-yield JAMB facts attached at topic level (shown in every
       lesson of that topic, and turned into flashcards once studied) */
    topicNotes: {
      cell: [
        "Cell theory: all living things are made of cells; the cell is the basic unit of life; cells come from pre-existing cells.",
        "Prokaryotic cells (bacteria) have NO true nucleus or membrane-bound organelles; eukaryotic cells do.",
        "Plant cells have a cellulose cell wall, chloroplasts and a large central vacuole — animal cells have none of these.",
        "Mitochondria and chloroplasts both contain their own DNA — evidence for the endosymbiotic theory."
      ],
      photosynthesis: [
        "Word equation: carbon dioxide + water → glucose + oxygen (light + chlorophyll).",
        "Experiment: destarch a plant, cover part of a leaf with foil — the covered part tests negative for starch (light is needed).",
        "Experiment: variegated leaf — only green parts test positive for starch (chlorophyll is needed)."
      ],
      respiration: [
        "Respiration happens in ALL cells, day and night; photosynthesis only in chlorophyll-containing cells in light.",
        "Compensation point: at dawn/dusk the CO2 from respiration equals the CO2 used in photosynthesis."
      ],
      excretion: [
        "ADH from the pituitary makes the kidney tubule reabsorb more water — less, darker urine when dehydrated.",
        "Ultrafiltration happens because blood pressure in the glomerulus is high; proteins and cells are too big to filter."
      ],
      genetics: [
        "Always show your Punnett square — JAMB often asks for ratios (3:1 monohybrid, 9:3:3:1 dihybrid).",
        "Co-dominance: both alleles show (AB blood group)."
      ],
      nervous: [
        "Electrical impulse travels along the neurone; chemical transmitter crosses the synapse — one direction only.",
        "Conditioned reflex: learned reflex (salivation at the smell of food) — unlike simple reflexes, it involves the brain."
      ],
      circulation: [
        "Sequence through the heart: vena cava → right atrium → right ventricle → pulmonary artery → lungs → pulmonary vein → left atrium → left ventricle → aorta.",
        "Valves prevent backflow: tricuspid (right), bicuspid/mitral (left), semilunar (aorta & pulmonary artery)."
      ]
    }
  }
};
